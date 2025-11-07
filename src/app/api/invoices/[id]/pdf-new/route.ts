import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { calculateFinancialSummarySync } from "@/lib/calculations";
import { createInvoicePDF } from "@/lib/pdf-generator-simple";
import { renderToStream } from "@react-pdf/renderer";

// GET /api/invoices/[id]/pdf-new - Generate PDF for specific invoice using React PDF Renderer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;

    // Get invoice data from database
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
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

    // Prepare invoice data
    const invoiceData = {
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

    // Calculate financial summary
    const financial = calculateFinancialSummarySync(invoiceData as any);

    // Generate PDF using React PDF Renderer
    const pdfStream = await renderToStream(
      createInvoicePDF(
        invoiceData,
        invoice.client,
        invoice.company,
        financial,
        {
          includeWatermark: false,
          watermarkText: 'DRAFT'
        }
      ) as any
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
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber || invoice.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('PDF generation failed:', error);

    return NextResponse.json(
      { success: false, error: 'PDF generation failed' },
      { status: 500 }
    );
  }
}
