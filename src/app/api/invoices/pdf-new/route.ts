import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { calculateFinancialSummarySync } from "@/lib/calculations";
import { InvoicePDF } from "@/lib/pdf-generator";
import { renderToStream } from "@react-pdf/renderer";
import { z } from "zod";

// PDF generation request schema
const pdfGenerationSchema = z.object({
  invoiceId: z.string().optional(),
  invoiceData: z.object({
    docType: z.enum(['Invoice', 'Waybill', 'Account Info', 'Pro-Forma']),
    selectedClient: z.string(),
    project: z.string(),
    qty: z.number(),
    rate: z.number(),
    paid: z.number(),
    discount: z.number(),
    vat: z.number(),
    fx: z.number(),
    longDesc: z.string(),
    params: z.string(),
    etaDays: z.number(),
    showVat: z.boolean(),
    startDate: z.string(),
    lockTotal: z.boolean(),
    finalTotal: z.number(),
    totalInclVat: z.boolean(),
    logoW: z.string(),
    tasks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      dur: z.number(),
      off: z.number(),
      dependsOn: z.string().optional()
    })),
    resources: z.array(z.object({
      type: z.string(),
      hours: z.number(),
      rate: z.number()
    })).optional()
  }).optional(),
  includeWatermark: z.boolean().default(false),
  watermarkText: z.string().default('DRAFT')
});

// POST /api/invoices/pdf-new - Generate PDF using React PDF Renderer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = pdfGenerationSchema.parse(body);

    let invoiceData, clientData, companyData;

    // Get invoice data either from ID or direct data
    if (validatedData.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: validatedData.invoiceId },
        include: {
          client: true,
          company: true,
          tasks: true,
          resources: true
        }
      });

      if (!invoice) {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      invoiceData = {
        id: invoice.id,
        docType: invoice.docType,
        project: invoice.project,
        qty: invoice.qty,
        rate: invoice.rate,
        paid: invoice.paid,
        discount: invoice.discount,
        vat: invoice.vat,
        fx: invoice.fx,
        longDesc: invoice.longDesc,
        params: invoice.params,
        etaDays: invoice.etaDays,
        showVat: invoice.showVat,
        startDate: invoice.startDate.toISOString().split('T')[0],
        lockTotal: invoice.lockTotal,
        finalTotal: invoice.finalTotal,
        totalInclVat: invoice.totalInclVat,
        logoW: invoice.logoW,
        tasks: invoice.tasks,
        resources: invoice.resources
      };
      clientData = invoice.client;
      companyData = invoice.company;
    } else if (validatedData.invoiceData) {
      invoiceData = validatedData.invoiceData;

      // Get client and company data
      const [client, company] = await Promise.all([
        prisma.client.findUnique({ where: { id: validatedData.invoiceData.selectedClient } }),
        prisma.company.findFirst() // Use first company as default
      ]);

      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Client not found' },
          { status: 404 }
        );
      }

      clientData = client;
      companyData = company;
    } else {
      return NextResponse.json(
        { success: false, error: 'Either invoiceId or invoiceData is required' },
        { status: 400 }
      );
    }

    // Calculate financial summary
    const financial = calculateFinancialSummarySync(invoiceData as any);

    // Generate PDF using React PDF Renderer
    const pdfStream = await renderToStream(
      InvoicePDF({
        invoiceData,
        clientData,
        companyData,
        financial,
        options: {
          includeWatermark: validatedData.includeWatermark,
          watermarkText: validatedData.watermarkText
        }
      }) as any
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${(invoiceData as any).id || 'generated'}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('PDF generation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'PDF generation failed' },
      { status: 500 }
    );
  }
}
