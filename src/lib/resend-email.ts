import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key');

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

interface InvoiceEmailData {
  invoiceNumber?: string;
  project: string;
  clientData?: { name: string };
  companyData?: { name: string };
  qty: number;
  rate: number;
  discount: number;
  vat: number;
  finalTotal: number;
  paid: number;
  longDesc: string;
  startDate: string;
  etaDays: number;
  showVat?: boolean;
}

class ResendEmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key not configured. Please set RESEND_API_KEY environment variable.');
      return false;
    }

    try {
      const emailData: any = {
        from: 'Invoice Generator <noreply@activemillers.com>', // Replace with your verified domain
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        emailData.attachments = options.attachments.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content.toString('base64'),
          type: attachment.contentType,
        }));
      }

      const result = await resend.emails.send(emailData);
      
      if (result.error) {
        console.error('Failed to send email:', result.error);
        return false;
      }

      console.log('Email sent successfully:', result.data?.id);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendInvoiceEmail(
    to: string,
    invoiceData: InvoiceEmailData,
    pdfBuffer?: Buffer
  ): Promise<boolean> {
    const subject = `Invoice ${invoiceData.invoiceNumber || 'Generated'} - ${invoiceData.project}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container { 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #ef4444, #dc2626); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700;
          }
          .header p { 
            margin: 8px 0 0 0; 
            font-size: 16px; 
            opacity: 0.9;
          }
          .content { 
            padding: 30px; 
          }
          .invoice-details { 
            background: #f8f9fa; 
            padding: 25px; 
            margin: 25px 0; 
            border-radius: 8px; 
            border-left: 4px solid #ef4444;
          }
          .invoice-details h3 { 
            margin: 0 0 20px 0; 
            color: #1f2937; 
            font-size: 20px;
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 12px 0; 
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child { 
            border-bottom: none; 
          }
          .detail-label { 
            font-weight: 600; 
            color: #374151; 
          }
          .detail-value { 
            color: #1f2937; 
          }
          .financial-summary { 
            background: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border: 1px solid #e0f2fe;
          }
          .financial-summary h4 { 
            margin: 0 0 15px 0; 
            color: #1e40af; 
            font-size: 18px;
          }
          .financial-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 8px 0; 
            padding: 4px 0;
          }
          .total { 
            font-weight: 700; 
            font-size: 18px; 
            border-top: 2px solid #ef4444; 
            padding-top: 12px; 
            margin-top: 12px;
            color: #1f2937;
          }
          .amount-due { 
            color: #ef4444; 
            font-weight: 700;
          }
          .footer { 
            text-align: center; 
            padding: 25px; 
            color: #6b7280; 
            font-size: 14px; 
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #ef4444; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 15px 0; 
            font-weight: 600;
            transition: background-color 0.2s;
          }
          .button:hover { 
            background: #dc2626; 
          }
          .status-badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-draft { 
            background: #fef3c7; 
            color: #92400e; 
          }
          .status-sent { 
            background: #dbeafe; 
            color: #1e40af; 
          }
          .status-paid { 
            background: #d1fae5; 
            color: #065f46; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice ${invoiceData.invoiceNumber || 'Generated'}</h1>
            <p>${invoiceData.project}</p>
          </div>
          
          <div class="content">
            <p>Dear ${invoiceData.clientData?.name || 'Valued Client'},</p>
            
            <p>Please find attached your invoice for the services provided. Below is a summary of the charges:</p>
            
            <div class="invoice-details">
              <h3>Invoice Details</h3>
              <div class="detail-row">
                <span class="detail-label">Project:</span>
                <span class="detail-value">${invoiceData.project}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Invoice Number:</span>
                <span class="detail-value">${invoiceData.invoiceNumber || 'Generated'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(invoiceData.startDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">${new Date(new Date(invoiceData.startDate).getTime() + (invoiceData.etaDays * 24 * 60 * 60 * 1000)).toLocaleDateString()}</span>
              </div>
              
              ${invoiceData.longDesc ? `
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${invoiceData.longDesc.replace(/\n/g, '<br>')}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="financial-summary">
              <h4>Financial Summary</h4>
              <div class="financial-row">
                <span>Quantity:</span>
                <span>${invoiceData.qty}</span>
              </div>
              <div class="financial-row">
                <span>Rate:</span>
                <span>$${invoiceData.rate.toFixed(2)}</span>
              </div>
              <div class="financial-row">
                <span>Subtotal:</span>
                <span>$${(invoiceData.qty * invoiceData.rate).toFixed(2)}</span>
              </div>
              ${invoiceData.discount > 0 ? `
              <div class="financial-row">
                <span>Discount (${invoiceData.discount}%):</span>
                <span>-$${((invoiceData.qty * invoiceData.rate) * invoiceData.discount / 100).toFixed(2)}</span>
              </div>
              ` : ''}
              ${invoiceData.showVat && invoiceData.vat > 0 ? `
              <div class="financial-row">
                <span>VAT (${invoiceData.vat}%):</span>
                <span>$${((invoiceData.qty * invoiceData.rate) * (1 - invoiceData.discount / 100) * invoiceData.vat / 100).toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="financial-row total">
                <span>Total Amount:</span>
                <span class="amount-due">$${invoiceData.finalTotal.toFixed(2)}</span>
              </div>
              ${invoiceData.paid > 0 ? `
              <div class="financial-row">
                <span>Amount Paid:</span>
                <span>$${invoiceData.paid.toFixed(2)}</span>
              </div>
              <div class="financial-row">
                <span>Amount Due:</span>
                <span class="amount-due">$${(invoiceData.finalTotal - invoiceData.paid).toFixed(2)}</span>
              </div>
              ` : ''}
            </div>
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <p>Thank you for your business!</p>
            
            <p>Best regards,<br>
            <strong>${invoiceData.companyData?.name || 'Invoice Generator Team'}</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated invoice generated by the Invoice Generator system.</p>
            <p>Please keep this email for your records.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachments = pdfBuffer ? [{
      filename: `invoice-${invoiceData.invoiceNumber || 'generated'}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }] : undefined;

    return this.sendEmail({
      to,
      subject,
      html,
      attachments
    });
  }
}

export const resendEmailService = new ResendEmailService();
