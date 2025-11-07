# Database Setup Guide

## Option 1: Neon (Recommended - Free PostgreSQL)

1. **Sign up at Neon**
   - Go to <https://neon.tech>
   - Sign up for a free account
   - Create a new project

2. **Get Connection String**
   - Copy the connection string from your Neon dashboard
   - It will look like: `postgresql://username:password@hostname/database?sslmode=require`

3. **Set Environment Variable**

   ```bash
   export DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"
   ```

4. **Run Migration**

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## Option 2: Supabase (Free PostgreSQL)

1. **Sign up at Supabase**
   - Go to <https://supabase.com>
   - Create a new project

2. **Get Connection String**
   - Go to Settings → Database
   - Copy the connection string

3. **Set Environment Variable**

   ```bash
   export DATABASE_URL="postgresql://postgres:password@hostname:5432/postgres"
   ```

4. **Run Migration**

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## Option 3: Local PostgreSQL (Advanced)

1. **Install PostgreSQL**

   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   ```

2. **Create Database**

   ```bash
   sudo -u postgres psql
   CREATE DATABASE invoice_generator;
   CREATE USER invoice_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE invoice_generator TO invoice_user;
   \q
   ```

3. **Set Environment Variable**

   ```bash
   export DATABASE_URL="postgresql://invoice_user:your_password@localhost:5432/invoice_generator"
   ```

4. **Run Migration**

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## Quick Start (Neon - Recommended)

1. **Go to <https://neon.tech>**
2. **Sign up and create project**
3. **Copy connection string**
4. **Run these commands:**

```bash
# Set your database URL (replace with your actual connection string)
export DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"

# Push schema to database
npx prisma db push

# Seed with sample data
npx prisma db seed

# Start the application
npm run dev
```

## Verify Setup

After setting up the database, you can verify it's working:

```bash
# Check if Prisma can connect
npx prisma db pull

# View your data
npx prisma studio
```

## For Production (Vercel)

When deploying to Vercel:

1. **Set DATABASE_URL in Vercel dashboard**
2. **Use the same connection string**
3. **Vercel will automatically run the build process**

## Troubleshooting

### Common Issues

1. **"relation does not exist"**
   - Run `npx prisma db push` to create tables

2. **"connection refused"**
   - Check your DATABASE_URL
   - Ensure database is running

3. **"authentication failed"**
   - Verify username/password in connection string
   - Check database permissions

### Reset Database

If you need to start fresh:

```bash
# Reset the database
npx prisma db push --force-reset

# Seed with sample data
npx prisma db seed
```
