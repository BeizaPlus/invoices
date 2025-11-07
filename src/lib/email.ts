import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

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

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (config.auth.user && config.auth.pass) {
      this.transporter = nodemailer.createTransport(config);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured. Please set SMTP environment variables.');
      return false;
    }

    try {
      const mailOptions = {
        from: `"Invoice Generator" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendInvoiceEmail(
    to: string,
    invoiceData: any,
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .financial-summary { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .financial-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 18px; border-top: 2px solid #ef4444; padding-top: 10px; }
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
              <p><strong>Project:</strong> ${invoiceData.project}</p>
              <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber || 'Generated'}</p>
              <p><strong>Date:</strong> ${new Date(invoiceData.startDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(new Date(invoiceData.startDate).getTime() + (invoiceData.etaDays * 24 * 60 * 60 * 1000)).toLocaleDateString()}</p>
              
              ${invoiceData.longDesc ? `<p><strong>Description:</strong><br>${invoiceData.longDesc.replace(/\n/g, '<br>')}</p>` : ''}
              
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
                  <span>$${invoiceData.finalTotal.toFixed(2)}</span>
                </div>
                ${invoiceData.paid > 0 ? `
                <div class="financial-row">
                  <span>Amount Paid:</span>
                  <span>$${invoiceData.paid.toFixed(2)}</span>
                </div>
                <div class="financial-row">
                  <span>Amount Due:</span>
                  <span>$${(invoiceData.finalTotal - invoiceData.paid).toFixed(2)}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <p>Thank you for your business!</p>
            
            <p>Best regards,<br>
            ${invoiceData.companyData?.name || 'Invoice Generator Team'}</p>
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

export const emailService = new EmailService();
