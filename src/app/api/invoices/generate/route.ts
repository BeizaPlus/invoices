import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { calculateFinancialSummarySync } from "@/lib/calculations";
import { resendEmailService } from "@/lib/resend-email";
import { InvoiceData, ApiResponse } from "@/lib/types";
import { z } from "zod";

// Validation schema for invoice generation with email
const generateInvoiceSchema = z.object({
  // Invoice data
  docType: z.enum(["Invoice", "Waybill", "Account Info", "Pro-Forma"]),
  selectedClient: z.string().min(1),
  companyId: z.string().optional(),
  project: z.string().min(1),
  qty: z.number().min(0),
  rate: z.number().min(0),
  paid: z.number().default(0),
  discount: z.number().min(0).max(100).default(0),
  vat: z.number().min(0).max(100).default(15),
  fx: z.number().min(0).default(1),
  delivered: z.number().optional(),
  longDesc: z.string().default(""),
  params: z.string().default(""),
  etaDays: z.number().min(1).default(90),
  showVat: z.boolean().default(true),
  startDate: z.string().default(new Date().toISOString().split("T")[0]),
  lockTotal: z.boolean().default(false),
  finalTotal: z.number().default(0),
  totalInclVat: z.boolean().default(true),
  logoW: z.string().default("560px"),
  tasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    dur: z.number(),
    off: z.number(),
    dependsOn: z.string().optional(),
  })).default([]),
  resources: z.array(z.object({
    id: z.string(),
    type: z.string(),
    hours: z.number(),
    rate: z.number(),
  })).optional(),

  // Email options
  sendEmail: z.boolean().default(false),
  recipientEmail: z.string().email().optional(),
  includePDF: z.boolean().default(true),
  
  // API key for authentication
  apiKey: z.string().optional(),
});

// POST /api/invoices/generate - Generate invoice with optional email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateInvoiceSchema.parse(body);

    // Verify API key if provided
    if (validatedData.apiKey) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: validatedData.apiKey },
      });

      if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired API key" },
          { status: 401 },
        );
      }
    }

    // Get client data
    const client = await prisma.client.findUnique({
      where: { id: validatedData.selectedClient },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    // Get company data
    let company;
    if (validatedData.companyId) {
      company = await prisma.company.findUnique({
        where: { id: validatedData.companyId },
      });
      if (!company) {
        return NextResponse.json(
          { success: false, error: "Company not found" },
          { status: 404 },
        );
      }
    } else {
      // Use first available company
      company = await prisma.company.findFirst();
      if (!company) {
        return NextResponse.json(
          { success: false, error: "No company found. Please create a company first." },
          { status: 404 },
        );
      }
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

    // Calculate financial summary
    const invoiceData: InvoiceData = {
      id: `temp-${Date.now()}`,
      docType: validatedData.docType,
      selectedClient: validatedData.selectedClient,
      clientData: client as any,
      companyData: company as any,
      project: validatedData.project,
      qty: validatedData.qty,
      rate: validatedData.rate,
      paid: validatedData.paid,
      discount: validatedData.discount,
      vat: validatedData.vat,
      fx: validatedData.fx,
      delivered: validatedData.delivered || 0,
      longDesc: validatedData.longDesc,
      params: validatedData.params,
      etaDays: validatedData.etaDays,
      showVat: validatedData.showVat,
      startDate: validatedData.startDate,
      lockTotal: validatedData.lockTotal,
      finalTotal: validatedData.finalTotal,
      totalInclVat: validatedData.totalInclVat,
      logoW: validatedData.logoW,
      tasks: validatedData.tasks,
      resources: validatedData.resources || [],
    };

    const financialSummary = calculateFinancialSummarySync(invoiceData);
    invoiceData.finalTotal = financialSummary.totalWithVat;

    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        docType: validatedData.docType.toUpperCase().replace(" ", "_") as any,
        project: validatedData.project,
        qty: validatedData.qty,
        rate: validatedData.rate,
        paid: validatedData.paid,
        discount: validatedData.discount,
        vat: validatedData.vat,
        fx: validatedData.fx,
        delivered: validatedData.delivered,
        longDesc: validatedData.longDesc,
        params: validatedData.params,
        etaDays: validatedData.etaDays,
        showVat: validatedData.showVat,
        startDate: new Date(validatedData.startDate),
        lockTotal: validatedData.lockTotal,
        finalTotal: invoiceData.finalTotal,
        totalInclVat: validatedData.totalInclVat,
        logoW: validatedData.logoW,
        clientId: validatedData.selectedClient,
        companyId: company.id,
        status: "DRAFT",
        tasks: {
          create: validatedData.tasks.map((task) => ({
            name: task.name,
            dur: task.dur,
            off: task.off,
            dependsOn: task.dependsOn,
          })),
        },
        ...(validatedData.resources && {
          resources: {
            create: validatedData.resources.map((resource) => ({
              type: resource.type,
              hours: resource.hours,
              rate: resource.rate,
            })),
          },
        }),
      },
      include: {
        client: true,
        company: true,
        tasks: true,
        resources: true,
      },
    });

    // Update invoice data with real ID
    invoiceData.id = invoice.id;

    let pdfBuffer: Buffer | undefined;
    let emailSent = false;

    // Generate PDF if requested
    if (validatedData.includePDF) {
      try {
        const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/invoices/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });

        if (pdfResponse.ok) {
          pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        }
      } catch (error) {
        console.error('Failed to generate PDF:', error);
      }
    }

    // Send email if requested
    if (validatedData.sendEmail && validatedData.recipientEmail) {
      try {
        emailSent = await resendEmailService.sendInvoiceEmail(
          validatedData.recipientEmail,
          {
            project: invoiceData.project,
            clientData: invoiceData.clientData,
            companyData: invoiceData.companyData,
            qty: invoiceData.qty,
            rate: invoiceData.rate,
            discount: invoiceData.discount,
            vat: invoiceData.vat,
            finalTotal: invoiceData.finalTotal,
            paid: invoiceData.paid,
            longDesc: invoiceData.longDesc,
            startDate: invoiceData.startDate,
            etaDays: invoiceData.etaDays,
            showVat: invoiceData.showVat,
          },
          pdfBuffer
        );
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        invoice: {
          ...invoiceData,
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt,
        },
        financial: financialSummary,
        pdfGenerated: !!pdfBuffer,
        emailSent,
        urls: {
          view: `/api/invoices/${invoice.id}`,
          pdf: pdfBuffer ? `/api/invoices/${invoice.id}/pdf` : undefined,
        },
      },
      message: `Invoice created successfully${emailSent ? ' and sent via email' : ''}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to generate invoice:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate invoice" },
      { status: 500 },
    );
  }
}
