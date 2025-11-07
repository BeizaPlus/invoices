import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { resendEmailService } from "@/lib/resend-email";
import { z } from "zod";

// Email sending request schema
const sendEmailSchema = z.object({
  recipientEmail: z.string().email(),
  includePDF: z.boolean().default(true),
  subject: z.string().optional(),
  message: z.string().optional(),
});

// POST /api/invoices/[id]/send-email - Send existing invoice via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const body = await request.json();
    const validatedData = sendEmailSchema.parse(body);

    // Get existing invoice from database
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

    let pdfBuffer: Buffer | undefined;
    let emailSent = false;

    // Generate PDF if requested
    if (validatedData.includePDF) {
      try {
        const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/invoices/${invoiceId}/pdf-improved`);
        
        if (pdfResponse.ok) {
          pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        }
      } catch (error) {
        console.error('Failed to generate PDF:', error);
      }
    }

    // Send email
    try {
      emailSent = await resendEmailService.sendInvoiceEmail(
        validatedData.recipientEmail,
        {
          project: invoice.project,
          clientData: invoice.client,
          companyData: invoice.company,
          qty: invoice.qty,
          rate: invoice.rate,
          discount: invoice.discount,
          vat: invoice.vat,
          finalTotal: invoice.finalTotal,
          paid: invoice.paid,
          longDesc: invoice.longDesc,
          startDate: invoice.startDate.toISOString().split('T')[0],
          etaDays: invoice.etaDays,
          showVat: invoice.showVat,
          invoiceNumber: invoice.invoiceNumber || undefined,
        },
        pdfBuffer
      );
    } catch (error) {
      console.error('Failed to send email:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update invoice status to sent if email was successful
    if (emailSent) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'SENT' }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        emailSent,
        pdfGenerated: !!pdfBuffer,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      },
      message: emailSent ? 'Invoice sent successfully' : 'Failed to send invoice'
    });

  } catch (error) {
    console.error('Failed to send invoice email:', error);

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
      { success: false, error: 'Failed to send invoice email' },
      { status: 500 }
    );
  }
}
