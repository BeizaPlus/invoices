# Email Service Setup Guide

This application uses **Resend** for professional email delivery with PDF attachments. Follow these steps to set up email functionality.

## 🚀 Quick Setup

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Navigate to **API Keys** in your dashboard
4. Create a new API key
5. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Resend API Key (REQUIRED for email functionality)
RESEND_API_KEY="re_your_api_key_here"

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Verify Domain (Optional but Recommended)

For production use, verify your domain in Resend:

1. Go to **Domains** in your Resend dashboard
2. Add your domain (e.g., `yourcompany.com`)
3. Follow DNS verification steps
4. Update the `from` email in `/src/lib/resend-email.ts`:

```typescript
from: 'Invoice Generator <noreply@yourcompany.com>'
```

## 📧 Email Features

### ✅ What Works Now

- **Professional HTML emails** with beautiful styling
- **PDF attachments** automatically included
- **Invoice details** with financial breakdown
- **Client and company information** display
- **Responsive design** for all email clients
- **Error handling** and fallback options

### 🎨 Email Design Features

- **Modern gradient header** with company branding
- **Financial summary** with clear calculations
- **Project timeline** (if tasks are included)
- **Professional footer** with bank details
- **Mobile-responsive** design
- **Clean typography** and spacing

## 🔧 Technical Details

### Email Service Architecture

- **Primary**: Resend API for reliable delivery
- **Fallback**: Nodemailer (if Resend fails)
- **PDF Generation**: Puppeteer for high-quality PDFs
- **Template**: Custom HTML with inline CSS

### PDF Attachment Process

1. Generate invoice data
2. Create PDF using Puppeteer
3. Convert PDF to base64
4. Attach to email via Resend API
5. Send professional email with attachment

### API Endpoints

- `POST /api/invoices/generate` - Create invoice with email
- `GET /api/invoices/[id]/pdf` - Download PDF directly
- `POST /api/invoices/[id]/send` - Send existing invoice via email

## 🧪 Testing Email Functionality

### Test Invoice Creation with Email

```bash
curl -X POST http://localhost:3000/api/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{
    "docType": "Invoice",
    "selectedClient": "tac",
    "project": "Test Email Invoice",
    "qty": 1,
    "rate": 100,
    "discount": 0,
    "vat": 15,
    "longDesc": "Test invoice with email and PDF attachment",
    "etaDays": 30,
    "sendEmail": true,
    "recipientEmail": "your-email@example.com",
    "includePDF": true
  }'
```

### Test PDF Download

```bash
curl -I http://localhost:3000/api/invoices/[INVOICE_ID]/pdf
```

## 🚨 Troubleshooting

### Common Issues

1. **"Missing API key" error**
   - Ensure `RESEND_API_KEY` is set in `.env`
   - Restart the development server

2. **Email not sending**
   - Check Resend dashboard for delivery status
   - Verify API key permissions
   - Check email address format

3. **PDF not attaching**
   - Ensure Puppeteer is installed
   - Check server logs for PDF generation errors
   - Verify invoice data is complete

4. **Email in spam folder**
   - Verify your domain in Resend
   - Use a professional sender address
   - Avoid spam trigger words

### Debug Mode

Enable detailed logging by setting:

```bash
DEBUG=resend:*
```

## 📊 Email Analytics

Resend provides detailed analytics:

- **Delivery rates** and bounce tracking
- **Open rates** and click tracking
- **Spam complaints** monitoring
- **Domain reputation** management

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Rotate API keys** regularly
4. **Monitor usage** in Resend dashboard
5. **Set up webhooks** for delivery events

## 📈 Production Considerations

### Scaling

- **Rate limits**: Resend free tier allows 3,000 emails/month
- **Upgrade plan** for higher volumes
- **Queue system** for bulk email sending

### Monitoring

- **Set up alerts** for failed deliveries
- **Monitor bounce rates** and spam complaints
- **Track email performance** metrics

### Compliance

- **GDPR compliance** for EU customers
- **CAN-SPAM compliance** for US customers
- **Data retention** policies

## 🎯 Next Steps

1. **Set up Resend account** and get API key
2. **Configure environment variables**
3. **Test email functionality** with sample invoices
4. **Verify domain** for production use
5. **Monitor email delivery** and performance

---

**Need Help?** Check the [Resend Documentation](https://resend.com/docs) or create an issue in this repository.
