import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { calculateFinancialSummarySync, formatCurrency, formatDateRange } from '@/lib/calculations';
import puppeteer from 'puppeteer';

// Generate HTML content for the invoice
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
        :root {
            --ink: #111;
            --muted: #6b7280;
            --line: #d1d5db;
            --accent: #ef4444;
            --accent-dark: #b91c1c;
            --chip: #f3f4f6;
            --logoW: ${invoiceData.logoW || '560px'};
        }

        html, body {
            margin: 0;
            padding: 0;
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
            background: #fff;
            color: var(--ink);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .page {
            width: 900px;
            margin: 24px auto;
            background: #fff;
            padding: 40px 48px;
            position: relative;
        }

        header {
            display: flex;
            align-items: flex-start;
            gap: 18px;
            margin-bottom: 32px;
        }

        .brand {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
        }

        .brand .logoWrap {
            width: var(--logoW);
        }

        .brand .logoWrap img,
        .brand .logoWrap svg {
            width: 100%;
            height: auto;
            display: block;
        }

        .brand .contact {
            margin-top: 6px;
            color: var(--muted);
            width: var(--logoW);
            text-align: center;
            font-size: 14px;
        }

        .title {
            margin-left: auto;
            text-align: right;
        }

        .title h2 {
            font-size: 40px;
            margin: 0;
            font-weight: 700;
        }

        .daterange {
            font-size: 28px;
            color: var(--muted);
        }

        .hgap {
            height: 22px;
        }

        h3 {
            margin: 0 0 6px 0;
            font-size: 28px;
            font-weight: 700;
        }

        .twocol {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }

        .card {
            border: 1px solid var(--line);
            border-radius: 10px;
            padding: 16px;
            background: #fff;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }

        th, td {
            padding: 12px;
            border-right: 1px solid var(--line);
            text-align: left;
        }

        th:last-child, td:last-child {
            border-right: none;
        }

        thead th {
            background: var(--accent);
            color: #fff;
            font-weight: 700;
        }

        tbody td {
            border-top: 1px solid var(--line);
        }

        tfoot td {
            border-top: 2px solid var(--line);
            font-weight: 600;
        }

        .num {
            text-align: right;
        }

        .pill {
            background: var(--chip);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 18px;
            display: inline-block;
        }

        .descbox {
            border: 2px solid var(--line);
            border-radius: 10px;
            margin-top: 24px;
            overflow: hidden;
        }

        .descbox .label {
            background: #f9fafb;
            border-bottom: 2px solid var(--line);
            padding: 10px 12px;
            font-weight: 800;
            font-size: 22px;
        }

        .descbox .content {
            padding: 12px 14px;
            font-size: 16px;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--line);
            font-size: 14px;
            color: var(--muted);
        }

        .gantt-container {
            margin: 24px 0;
            padding: 20px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: #fff;
        }

        .gantt-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
            text-align: center;
        }

        .gantt-tasks {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .gantt-task {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: var(--accent);
            color: #fff;
            border-radius: 4px;
            font-size: 14px;
            position: relative;
        }

        .task-name {
            flex: 1;
        }

        .task-duration {
            margin-left: 12px;
            font-size: 12px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="page">
        <header>
            <div class="brand">
                <div class="logoWrap">
                    <div style="width: 100%; height: 60px; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">
                        ${companyData.name || 'Company Logo'}
                    </div>
                </div>
                <div class="contact">
                    ${companyData.accName || 'Company Name'}<br>
                    ${companyData.branch || 'Address'}<br>
                    ${companyData.vatTin || 'VAT/TIN'}
                </div>
            </div>
            <div class="title">
                <h2>${invoiceData.docType}</h2>
                <div class="daterange">${dateRange}</div>
            </div>
        </header>

        <div class="twocol">
            <div>
                <h3>Bill To</h3>
                <div class="card">
                    <div style="font-weight: 600; font-size: 18px;">${clientData.name}</div>
                    <div style="color: var(--muted);">Email: ${clientData.email || 'N/A'}</div>
                    <div style="color: var(--muted);">Phone: ${clientData.phone || 'N/A'}</div>
                </div>
            </div>

            <div>
                <h3>Project</h3>
                <div class="pill">${invoiceData.project || 'Untitled Project'}</div>

                <div class="hgap"></div>
                <h3>ETA</h3>
                <div style="color: var(--muted);">Estimated Completion Time: ${invoiceData.etaDays} days</div>
                <div style="color: var(--muted); font-size: 14px; margin-top: 4px;">
                    (${new Date(invoiceData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })})
                </div>
            </div>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th style="width:26%">Order Code</th>
                        <th>Description</th>
                        <th style="width:12%">Quantity</th>
                        <th style="width:12%">Rate</th>
                        <th style="width:16%">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${invoiceData.project || 'PROJ-001'}</td>
                        <td>${invoiceData.longDesc || 'Project work'}</td>
                        <td class="num">${invoiceData.qty}</td>
                        <td class="num">${formatCurrency(invoiceData.rate)}</td>
                        <td class="num">${formatCurrency(invoiceData.qty * invoiceData.rate)}</td>
                    </tr>
                    ${invoiceData.resources?.map((resource: any) => `
                    <tr>
                        <td>RES-${resource.type.slice(0, 6).toUpperCase()}</td>
                        <td>${resource.type}</td>
                        <td class="num">${resource.hours} hrs</td>
                        <td class="num">${formatCurrency(resource.rate)}</td>
                        <td class="num">${formatCurrency(resource.hours * resource.rate)}</td>
                    </tr>
                    `).join('') || ''}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4"><strong>Subtotal</strong></td>
                        <td class="num"><strong>${formatCurrency(financial.subtotal + (financial.resourcesTotal || 0))}</strong></td>
                    </tr>
                    ${invoiceData.discount > 0 ? `
                    <tr>
                        <td colspan="4">Discount (${invoiceData.discount}%)</td>
                        <td class="num">-${formatCurrency(financial.discountAmount)}</td>
                    </tr>
                    ` : ''}
                    ${invoiceData.showVat && invoiceData.vat > 0 ? `
                    <tr>
                        <td colspan="4">VAT (${invoiceData.vat}%)</td>
                        <td class="num">${formatCurrency(financial.vatAmount)}</td>
                    </tr>
                    ` : ''}
                    <tr style="border-top: 2px solid var(--accent);">
                        <td colspan="4"><strong>Total</strong></td>
                        <td class="num"><strong>${formatCurrency(invoiceData.totalInclVat ? financial.totalWithVat : financial.total)}</strong></td>
                    </tr>
                    ${invoiceData.paid > 0 ? `
                    <tr>
                        <td colspan="4">Amount Paid</td>
                        <td class="num">${formatCurrency(invoiceData.paid)}</td>
                    </tr>
                    <tr style="background: #fef3c7;">
                        <td colspan="4"><strong>Amount Due</strong></td>
                        <td class="num"><strong>${formatCurrency(financial.amountDue)}</strong></td>
                    </tr>
                    ` : ''}
                </tfoot>
            </table>
        </div>

        ${invoiceData.longDesc ? `
        <div class="descbox">
            <div class="label">Description</div>
            <div class="content">${invoiceData.longDesc}</div>
        </div>
        ` : ''}

        ${invoiceData.tasks && invoiceData.tasks.length > 0 ? `
        <div class="gantt-container">
            <div class="gantt-title">Project Timeline</div>
            <div class="gantt-tasks">
                ${invoiceData.tasks.map((task: any) => `
                <div class="gantt-task">
                    <div class="task-name">${task.name}</div>
                    <div class="task-duration">${task.dur} days</div>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                    <h4 style="margin: 0 0 8px 0;">Bank Details</h4>
                    <div style="font-size: 14px; line-height: 1.4;">
                        <strong>${companyData.bankName || 'GT Bank'}</strong><br>
                        ${companyData.currency || 'Ghana Cedi Account'}<br>
                        Account Name: ${companyData.accName || 'PixelCraft Designs'}<br>
                        Account No: ${companyData.accNo || '304 125 384 140'}<br>
                        Branch: ${companyData.branch || 'KNUST - Ghana'}<br>
                        ${companyData.vatTin ? `VAT/TIN: ${companyData.vatTin}<br>` : ''}
                    </div>
                </div>
                <div>
                    <h4 style="margin: 0 0 8px 0;">Legal Note</h4>
                    <div style="font-size: 12px; line-height: 1.4; color: var(--muted);">
                        Payment is due within 30 days of invoice date. Late payments may incur additional charges.
                        Please include invoice number in payment reference.
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// GET /api/invoices/[id]/pdf - Generate PDF for specific invoice
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

    // Launch Puppeteer
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
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber || invoice.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
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
