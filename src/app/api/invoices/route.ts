import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { calculateFinancialSummarySync } from "@/lib/calculations";
import { InvoiceData, GenerateInvoiceRequest, ApiResponse } from "@/lib/types";
import { z } from "zod";

// Validation schema for invoice generation
const generateInvoiceSchema = z.object({
  docType: z.enum(["Invoice", "Waybill", "Account Info", "Pro-Forma"]),
  selectedClient: z.string().min(1),
  companyId: z.string().optional(),
  project: z.string().default(""),
  qty: z.number().default(0),
  rate: z.number().default(0),
  paid: z.number().default(0),
  discount: z.number().default(0),
  vat: z.number().default(0),
  fx: z.number().default(1),
  delivered: z.number().optional(),
  longDesc: z.string().default(""),
  params: z.string().default(""),
  etaDays: z.number().default(90),
  showVat: z.boolean().default(true),
  startDate: z.string().default(new Date().toISOString().split("T")[0]),
  lockTotal: z.boolean().default(false),
  finalTotal: z.number().default(0),
  totalInclVat: z.boolean().default(true),
  logoW: z.string().default("560px"),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        dur: z.number(),
        off: z.number(),
        dependsOn: z.string().optional(),
      }),
    )
    .default([]),
  resources: z
    .array(
      z.object({
        type: z.string(),
        hours: z.number(),
        rate: z.number(),
      }),
    )
    .optional(),
});

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (clientId) where.clientId = clientId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: true,
          company: true,
          tasks: true,
          resources: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

// POST /api/invoices - Create/Generate invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateInvoiceSchema.parse(body);

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: validatedData.selectedClient },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    // Get or create default company if not specified
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
      // Create a default company if none exists
      company = await prisma.company.findFirst();
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: "Default Company",
            bankName: "GT Bank",
            currency: "Ghana Cedi Account",
            accName: "PixelCraft Designs",
            accNo: "304 125 384 140",
            branch: "KNUST - Ghana",
            vatTin: "C0040393631",
          },
        });
      }
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

    // Create the invoice
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
        finalTotal: validatedData.finalTotal,
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

    // Calculate financial summary
    const invoiceData: InvoiceData = {
      id: invoice.id,
      docType: invoice.docType as any,
      selectedClient: invoice.clientId,
      clientData: invoice.client as any,
      companyData: invoice.company as any,
      project: invoice.project,
      qty: invoice.qty,
      rate: invoice.rate,
      paid: invoice.paid,
      discount: invoice.discount,
      vat: invoice.vat,
      fx: invoice.fx,
      delivered: invoice.delivered || 0,
      longDesc: invoice.longDesc,
      params: invoice.params,
      etaDays: invoice.etaDays,
      showVat: invoice.showVat,
      startDate: invoice.startDate.toISOString().split("T")[0],
      lockTotal: invoice.lockTotal,
      finalTotal: invoice.finalTotal,
      totalInclVat: invoice.totalInclVat,
      logoW: invoice.logoW,
      tasks: invoice.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        dur: task.dur,
        off: task.off,
        dependsOn: task.dependsOn || undefined,
      })),
      resources: invoice.resources?.map((resource) => ({
        id: resource.id,
        type: resource.type,
        hours: resource.hours,
        rate: resource.rate,
        amount: resource.hours * resource.rate,
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    const financialSummary = calculateFinancialSummarySync(invoiceData);

    const response: ApiResponse = {
      success: true,
      data: {
        invoice: invoiceData,
        financial: financialSummary,
        url: `/api/invoices/${invoice.id}`,
      },
      message: "Invoice created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);

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
      { success: false, error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}

// PUT /api/invoices - Update invoice
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = generateInvoiceSchema.partial().parse(body);

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    // Update the invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(validatedData.project !== undefined && {
          project: validatedData.project,
        }),
        ...(validatedData.qty !== undefined && { qty: validatedData.qty }),
        ...(validatedData.rate !== undefined && { rate: validatedData.rate }),
        ...(validatedData.paid !== undefined && { paid: validatedData.paid }),
        ...(validatedData.discount !== undefined && {
          discount: validatedData.discount,
        }),
        ...(validatedData.vat !== undefined && { vat: validatedData.vat }),
        ...(validatedData.fx !== undefined && { fx: validatedData.fx }),
        ...(validatedData.delivered !== undefined && {
          delivered: validatedData.delivered,
        }),
        ...(validatedData.longDesc !== undefined && {
          longDesc: validatedData.longDesc,
        }),
        ...(validatedData.params !== undefined && {
          params: validatedData.params,
        }),
        ...(validatedData.etaDays !== undefined && {
          etaDays: validatedData.etaDays,
        }),
        ...(validatedData.showVat !== undefined && {
          showVat: validatedData.showVat,
        }),
        ...(validatedData.startDate !== undefined && {
          startDate: new Date(validatedData.startDate),
        }),
        ...(validatedData.lockTotal !== undefined && {
          lockTotal: validatedData.lockTotal,
        }),
        ...(validatedData.finalTotal !== undefined && {
          finalTotal: validatedData.finalTotal,
        }),
        ...(validatedData.totalInclVat !== undefined && {
          totalInclVat: validatedData.totalInclVat,
        }),
        ...(validatedData.logoW !== undefined && {
          logoW: validatedData.logoW,
        }),
      },
      include: {
        client: true,
        company: true,
        tasks: true,
        resources: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedInvoice,
      message: "Invoice updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update invoice:", error);

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
      { success: false, error: "Failed to update invoice" },
      { status: 500 },
    );
  }
}

// DELETE /api/invoices - Delete invoice
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    // Delete the invoice (cascades to tasks and resources)
    await prisma.invoice.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "Invoice deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete invoice" },
      { status: 500 },
    );
  }
}
