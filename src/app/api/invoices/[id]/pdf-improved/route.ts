import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { calculateFinancialSummarySync, formatCurrency, formatDateRange } from "@/lib/calculations";
import puppeteer from 'puppeteer';

// Generate clean HTML content for the invoice
function generateInvoiceHTML(
  invoiceData: any,
  clientData: any,
  companyData: any,
  financial: any
): string {
  const dateRange = formatDateRange(invoiceData.startDate, invoiceData.etaDays);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${companyData.name} — ${invoiceData.docType}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff;
            color: #111;
            line-height: 1.4;
            font-size: 14px;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm;
            background: #fff;
            position: relative;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #ef4444;
        }

        .logo-section {
            flex: 1;
        }

        .logo {
            width: 200px;
            height: 60px;
            margin-bottom: 10px;
            background: #ef4444;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }

        .company-info {
            font-size: 12px;
            color: #666;
            line-height: 1.3;
        }

        .title-section {
            text-align: right;
            flex: 1;
        }

        .document-title {
            font-size: 36px;
            font-weight: bold;
            color: #111;
            margin-bottom: 5px;
        }

        .date-range {
            font-size: 18px;
            color: #666;
        }

        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #111;
            margin-bottom: 10px;
        }

        .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background: #f9f9f9;
        }

        .client-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .client-info {
            font-size: 12px;
            color: #666;
            margin-bottom: 3px;
        }

        .project-pill {
            background: #f3f4f6;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #fff;
        }

        .invoice-table th {
            background: #ef4444;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
        }

        .invoice-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
        }

        .invoice-table .text-right {
            text-align: right;
        }

        .invoice-table .text-center {
            text-align: center;
        }

        .invoice-table tfoot td {
            border-top: 2px solid #ef4444;
            font-weight: bold;
            background: #f9f9f9;
        }

        .invoice-table .total-row {
            background: #fef3c7;
            border-top: 2px solid #ef4444;
        }

        .description-box {
            border: 2px solid #ddd;
            border-radius: 8px;
            margin: 20px 0;
            overflow: hidden;
        }

        .description-header {
            background: #f9f9f9;
            border-bottom: 2px solid #ddd;
            padding: 12px;
            font-weight: bold;
            font-size: 14px;
        }

        .description-content {
            padding: 15px;
            font-size: 12px;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        .footer-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .footer-text {
            font-size: 10px;
            color: #666;
            line-height: 1.3;
        }

        @media print {
            .page {
                margin: 0;
                padding: 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="logo-section">
                <div class="logo">${companyData.name || 'Company Logo'}</div>
                <div class="company-info">
                    ${companyData.contactHTML || `${companyData.accName || 'Company Name'}<br>${companyData.branch || 'Address'}<br>${companyData.vatTin || 'VAT/TIN'}`}
                </div>
            </div>
            <div class="title-section">
                <div class="document-title">${invoiceData.docType}</div>
                <div class="date-range">${dateRange}</div>
            </div>
        </div>

        <div class="content-grid">
            <div>
                <div class="section-title">Bill To</div>
                <div class="card">
                    <div class="client-name">${clientData.name}</div>
                    <div class="client-info">Cc: ${clientData.cc}</div>
                </div>
                
                ${invoiceData.docType !== 'Account Info' ? `
                <div class="section-title" style="margin-top: 20px;">Ship To</div>
                <div class="card">
                    <div class="client-name">${clientData.shipTo}</div>
                    <div class="client-info">Cc: ${clientData.shipCc}</div>
                </div>
                ` : ''}
            </div>

            <div>
                <div class="section-title">Project</div>
                <div class="project-pill">${invoiceData.project || 'Untitled Project'}</div>
                
                <div class="section-title" style="margin-top: 20px;">ETA</div>
                <div class="client-info">Estimated Completion Time: ${invoiceData.etaDays} days</div>
                <div class="client-info" style="font-size: 10px; margin-top: 5px;">
                    (${new Date(invoiceData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })})
                </div>
            </div>
        </div>

        ${invoiceData.docType === 'Invoice' || invoiceData.docType === 'Pro-Forma' ? `
        <table class="invoice-table">
            <thead>
                <tr>
                    <th style="width: 25%">Order Code</th>
                    <th>Description</th>
                    <th style="width: 12%" class="text-center">Quantity</th>
                    <th style="width: 15%" class="text-right">Rate</th>
                    <th style="width: 15%" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${invoiceData.project || 'PROJ-001'}</td>
                    <td>${invoiceData.longDesc || 'Project work'}</td>
                    <td class="text-center">${invoiceData.qty}</td>
                    <td class="text-right">${formatCurrency(invoiceData.rate)}</td>
                    <td class="text-right">${formatCurrency(invoiceData.qty * invoiceData.rate)}</td>
                </tr>
                ${invoiceData.resources?.map((resource: any) => `
                <tr>
                    <td>RES-${resource.type.slice(0, 6).toUpperCase()}</td>
                    <td>${resource.type}</td>
                    <td class="text-center">${resource.hours} hrs</td>
                    <td class="text-right">${formatCurrency(resource.rate)}</td>
                    <td class="text-right">${formatCurrency(resource.hours * resource.rate)}</td>
                </tr>
                `).join('') || ''}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4"><strong>Subtotal</strong></td>
                    <td class="text-right"><strong>${formatCurrency(financial.subtotal + (financial.resourcesTotal || 0))}</strong></td>
                </tr>
                ${invoiceData.discount > 0 ? `
                <tr>
                    <td colspan="4">Discount (${invoiceData.discount}%)</td>
                    <td class="text-right">-${formatCurrency(financial.discountAmount)}</td>
                </tr>
                ` : ''}
                ${invoiceData.showVat && invoiceData.vat > 0 ? `
                <tr>
                    <td colspan="4">VAT (${invoiceData.vat}%)</td>
                    <td class="text-right">${formatCurrency(financial.vatAmount)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td colspan="4"><strong>Total</strong></td>
                    <td class="text-right"><strong>${formatCurrency(invoiceData.totalInclVat ? financial.totalWithVat : financial.total)}</strong></td>
                </tr>
                ${invoiceData.paid > 0 ? `
                <tr>
                    <td colspan="4">Amount Paid</td>
                    <td class="text-right">${formatCurrency(invoiceData.paid)}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="4"><strong>Amount Due</strong></td>
                    <td class="text-right"><strong>${formatCurrency(financial.amountDue)}</strong></td>
                </tr>
                ` : ''}
            </tfoot>
        </table>
        ` : ''}

        ${invoiceData.longDesc && (invoiceData.docType !== 'Waybill' && invoiceData.docType !== 'Account Info') ? `
        <div class="description-box">
            <div class="description-header">Description</div>
            <div class="description-content">${invoiceData.longDesc}</div>
        </div>
        ` : ''}

        <div class="footer">
            <div>
                <div class="footer-title">Bank Details</div>
                <div class="footer-text">
                    <strong>${companyData.bankName || 'GT Bank'}</strong><br>
                    ${companyData.currency || 'Ghana Cedi Account'}<br>
                    Account Name: ${companyData.accName || 'PixelCraft Designs'}<br>
                    Account No: ${companyData.accNo || '304 125 384 140'}<br>
                    Branch: ${companyData.branch || 'KNUST - Ghana'}<br>
                    ${companyData.swift ? `SWIFT: ${companyData.swift}<br>` : ''}
                    ${companyData.vatTin ? `VAT/TIN: ${companyData.vatTin}` : ''}
                </div>
            </div>
            <div>
                <div class="footer-title">Legal Note</div>
                <div class="footer-text">
                    Payment is due within 30 days of invoice date. Late payments may incur additional charges.
                    Please include invoice number in payment reference.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// GET /api/invoices/[id]/pdf-improved - Generate improved PDF for specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser;

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

    // Generate HTML
    const html = generateInvoiceHTML(
      invoiceData,
      invoice.client,
      invoice.company,
      financial
    );

    // Launch Puppeteer with optimized settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1
    });

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
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

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Failed to close browser:', closeError);
      }
    }

    return NextResponse.json(
      { success: false, error: 'PDF generation failed' },
      { status: 500 }
    );
  }
}
