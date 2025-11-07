# Invoice Generator - Professional Invoice Management System

A modern, full-featured invoice management system built with Next.js, PostgreSQL, and Resend for professional email delivery.

## 🚀 Features

### ✅ **Complete Invoice Management**

- **Create, Read, Update, Delete** invoices
- **Professional PDF generation** with company branding
- **Email delivery** with PDF attachments via Resend
- **Real-time financial calculations** (subtotal, discount, VAT, totals)
- **Project timeline** visualization with Gantt charts
- **Resource tracking** and hourly billing

### ✅ **Modern UI/UX**

- **Clean, professional design** with Tailwind CSS
- **Responsive layout** for all devices
- **Interactive modals** for invoice management
- **Real-time search** and filtering
- **Status tracking** (Draft, Sent, Paid, Overdue)

### ✅ **API-First Architecture**

- **RESTful API** for all operations
- **API key authentication** for external access
- **Comprehensive error handling**
- **Type-safe** with TypeScript and Zod validation

### ✅ **Production Ready**

- **PostgreSQL database** for scalability
- **Vercel deployment** configuration
- **Environment variable** management
- **Professional email** with Resend integration

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Resend API for professional delivery
- **PDF**: Puppeteer for high-quality generation
- **Deployment**: Vercel-ready configuration

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Resend API key (for email functionality)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd uber-invoice-nextjs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Create .env.local file
   DATABASE_URL="postgresql://username:password@localhost:5432/invoice_generator"
   RESEND_API_KEY="re_your_resend_api_key_here"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Set up the database**

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**

   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set up PostgreSQL database**
   - Use Vercel Postgres (recommended)
   - Or external service (Neon, Supabase, Railway)

3. **Configure environment variables**

   ```bash
   DATABASE_URL="postgresql://..."
   RESEND_API_KEY="re_..."
   NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"
   ```

4. **Deploy**

   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Start production server**

   ```bash
   npm start
   ```

## 📧 Email Setup

### Resend Configuration

1. **Get API Key**
   - Sign up at [resend.com](https://resend.com)
   - Create API key in dashboard
   - Add to environment variables

2. **Verify Domain** (Production)
   - Add your domain in Resend dashboard
   - Update sender email in code
   - Test email delivery

### Email Features

- **Professional HTML templates** with company branding
- **PDF attachments** automatically included
- **Responsive design** for all email clients
- **Error handling** and delivery tracking

## 🗄️ Database Schema

### Core Tables

- **invoices** - Main invoice data and financial information
- **clients** - Customer information and contact details
- **companies** - Company branding and bank details
- **tasks** - Project timeline and task management
- **resources** - Hourly billing and resource tracking
- **api_keys** - API authentication and access control

### Relationships

- One-to-many: Company → Invoices
- One-to-many: Client → Invoices
- One-to-many: Invoice → Tasks
- One-to-many: Invoice → Resources

## 🔌 API Endpoints

### Invoice Management

- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices?id={id}` - Update invoice
- `DELETE /api/invoices?id={id}` - Delete invoice
- `GET /api/invoices/{id}/pdf` - Download PDF

### Email & Generation

- `POST /api/invoices/generate` - Generate and email invoice
- `GET /api/invoices/{id}/pdf` - Direct PDF download

### Data Management

- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company

## 🎨 UI Components

### Layout Components

- **ManagementLayout** - Main application layout with sidebar
- **DataTable** - Reusable table with sorting and pagination
- **Modal** - Base modal component for forms and confirmations

### Invoice Modals

- **InvoiceViewModal** - Detailed invoice view with actions
- **InvoiceSendModal** - Email sending interface
- **InvoiceDeleteModal** - Confirmation for deletion

### Form Components

- **InvoiceForm** - Complete invoice creation/editing
- **ClientForm** - Client management
- **CompanyForm** - Company settings

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Email Service
RESEND_API_KEY="re_..."

# Application
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
```

### Vercel Configuration

- **vercel.json** - Deployment settings
- **Build scripts** - Prisma generation and database setup
- **Function timeouts** - 30 seconds for PDF generation

## 📊 Features Overview

### Invoice Management

- ✅ **Create** invoices with comprehensive forms
- ✅ **Edit** existing invoices with real-time validation
- ✅ **Delete** invoices with confirmation
- ✅ **View** detailed invoice information
- ✅ **Download** professional PDF invoices
- ✅ **Send** invoices via email with attachments

### Financial Calculations

- ✅ **Subtotal** calculation (quantity × rate)
- ✅ **Discount** percentage application
- ✅ **VAT** calculation with toggle
- ✅ **Final total** with all adjustments
- ✅ **Amount due** tracking for payments

### Project Management

- ✅ **Task timeline** with Gantt chart visualization
- ✅ **Resource tracking** with hourly billing
- ✅ **Project descriptions** and parameters
- ✅ **ETA calculation** and due date tracking

### Professional Features

- ✅ **Company branding** in PDFs and emails
- ✅ **Bank details** and legal information
- ✅ **Status tracking** (Draft, Sent, Paid, Overdue)
- ✅ **Search and filtering** capabilities
- ✅ **Responsive design** for all devices

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Run `npx prisma db push`

2. **Email Not Sending**
   - Verify RESEND_API_KEY is set
   - Check Resend dashboard for delivery status
   - Ensure domain is verified (production)

3. **PDF Generation Fails**
   - Check Puppeteer installation
   - Verify invoice data is complete
   - Check server logs for errors

4. **Build Failures**
   - Run `npx prisma generate`
   - Check TypeScript errors
   - Verify all dependencies are installed

### Debug Mode

```bash
DEBUG=resend:* npm run dev
```

## 📈 Performance

### Optimization Features

- **Database indexing** for fast queries
- **Connection pooling** for PostgreSQL
- **Image optimization** with Next.js
- **Code splitting** for faster loading
- **Caching** for static data

### Monitoring

- **Vercel Analytics** for performance tracking
- **Error monitoring** with detailed logs
- **Database performance** metrics
- **Email delivery** tracking

## 🔒 Security

### Best Practices

- **Environment variables** for sensitive data
- **API key authentication** for external access
- **Input validation** with Zod schemas
- **SQL injection** protection with Prisma
- **CORS** configuration for API access

### Production Checklist

- ✅ Environment variables configured
- ✅ Database security enabled
- ✅ API keys rotated regularly
- ✅ Domain verification completed
- ✅ SSL certificates installed

## 📞 Support

### Documentation

- **API Documentation** - Complete endpoint reference
- **Deployment Guide** - Step-by-step deployment
- **Email Setup** - Resend configuration
- **Troubleshooting** - Common issues and solutions

### Resources

- **Next.js Docs** - <https://nextjs.org/docs>
- **Prisma Docs** - <https://www.prisma.io/docs>
- **Resend Docs** - <https://resend.com/docs>
- **Vercel Docs** - <https://vercel.com/docs>

---

**Built with ❤️ for professional invoice management**
