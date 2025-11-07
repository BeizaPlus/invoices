# Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Database Setup

#### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Choose a name (e.g., `invoice-generator-db`)
4. Copy the connection string

#### Option B: External PostgreSQL

- **Neon** (Free tier): <https://neon.tech>
- **Supabase** (Free tier): <https://supabase.com>
- **Railway** (Free tier): <https://railway.app>

### 2. Environment Variables

In your Vercel project settings, add these environment variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Resend API Key
RESEND_API_KEY="re_your_resend_api_key_here"

# Next.js
NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: invoice-generator
# - Directory: ./
# - Override settings? No
```

### 4. Database Migration

After deployment, run the database migration:

```bash
# In Vercel dashboard, go to Functions tab
# Or use Vercel CLI:
vercel env pull .env.local
npx prisma db push
npx prisma db seed
```

## 🔧 Configuration Files

### vercel.json

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "RESEND_API_KEY": "@resend_api_key"
  }
}
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma db push && next build"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Ensure database is accessible from Vercel
   - Run `npx prisma db push` locally first

2. **Build Failures**
   - Check Prisma client generation
   - Ensure all dependencies are in package.json
   - Check for TypeScript errors

3. **PDF Generation Issues**
   - Puppeteer needs specific Vercel configuration
   - May need to use external PDF service for production

4. **Email Not Sending**
   - Verify RESEND_API_KEY is set
   - Check Resend dashboard for delivery status
   - Ensure domain is verified in Resend

### Performance Optimization

1. **Database Indexing**

   ```sql
   CREATE INDEX idx_invoices_client_id ON invoices(client_id);
   CREATE INDEX idx_invoices_company_id ON invoices(company_id);
   CREATE INDEX idx_invoices_status ON invoices(status);
   ```

2. **API Route Optimization**
   - Use connection pooling
   - Implement caching for static data
   - Optimize PDF generation

3. **Image Optimization**
   - Use Next.js Image component
   - Implement proper caching headers

## 📊 Monitoring

### Vercel Analytics

- Enable Vercel Analytics in dashboard
- Monitor function execution times
- Track error rates

### Database Monitoring

- Monitor connection usage
- Track query performance
- Set up alerts for failures

## 🔒 Security

### Environment Variables

- Never commit sensitive data
- Use Vercel's environment variable system
- Rotate API keys regularly

### Database Security

- Use connection pooling
- Implement proper access controls
- Enable SSL connections

### API Security

- Implement rate limiting
- Add request validation
- Use proper CORS settings

## 🚀 Production Checklist

- [ ] Database migrated to PostgreSQL
- [ ] Environment variables configured
- [ ] Domain verified in Resend
- [ ] Database indexes created
- [ ] Error monitoring set up
- [ ] Performance monitoring enabled
- [ ] Security headers configured
- [ ] Backup strategy implemented

## 📞 Support

- **Vercel Docs**: <https://vercel.com/docs>
- **Prisma Docs**: <https://www.prisma.io/docs>
- **Resend Docs**: <https://resend.com/docs>
