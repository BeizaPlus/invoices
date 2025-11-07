# Invoice Generator API Documentation

## Overview

The Invoice Generator API provides comprehensive functionality for creating, managing, and sending invoices. It supports both web interface and programmatic access via REST API.

## Base URL

```
http://localhost:3002/api
```

## Authentication

API endpoints support optional API key authentication. Include the API key in the request body:

```json
{
  "apiKey": "your-api-key-here",
  // ... other data
}
```

## Endpoints

### 1. Invoices

#### GET /api/invoices

Retrieve a list of invoices with pagination and filtering.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (DRAFT, SENT, PAID, OVERDUE)
- `clientId` (optional): Filter by client ID

**Response:**

```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### POST /api/invoices

Create a new invoice.

**Request Body:**

```json
{
  "docType": "Invoice",
  "selectedClient": "client-id",
  "companyId": "company-id",
  "project": "Project Name",
  "qty": 1,
  "rate": 1000.00,
  "paid": 0,
  "discount": 0,
  "vat": 15,
  "fx": 1,
  "delivered": 0,
  "longDesc": "Project description",
  "params": "Additional parameters",
  "etaDays": 90,
  "showVat": true,
  "startDate": "2024-01-15",
  "lockTotal": false,
  "finalTotal": 0,
  "totalInclVat": true,
  "logoW": "560px",
  "tasks": [
    {
      "id": "task-1",
      "name": "Task Name",
      "dur": 7,
      "off": 0,
      "dependsOn": null
    }
  ],
  "resources": [
    {
      "id": "resource-1",
      "type": "Developer",
      "hours": 40,
      "rate": 75
    }
  ]
}
```

#### PUT /api/invoices?id={invoiceId}

Update an existing invoice.

#### DELETE /api/invoices?id={invoiceId}

Delete an invoice.

### 2. Invoice Generation with Email

#### POST /api/invoices/generate

Generate an invoice with optional PDF and email functionality.

**Request Body:**

```json
{
  // All invoice fields from POST /api/invoices
  "sendEmail": true,
  "recipientEmail": "client@example.com",
  "includePDF": true,
  "apiKey": "your-api-key-here"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "invoice": {...},
    "financial": {
      "subtotal": 1000.00,
      "discountAmount": 0,
      "vatAmount": 150.00,
      "total": 1000.00,
      "totalWithVat": 1150.00,
      "amountDue": 1150.00
    },
    "pdfGenerated": true,
    "emailSent": true,
    "urls": {
      "view": "/api/invoices/invoice-id",
      "pdf": "/api/invoices/invoice-id/pdf"
    }
  },
  "message": "Invoice created successfully and sent via email"
}
```

### 3. PDF Generation

#### POST /api/invoices/pdf

Generate a PDF from invoice data.

**Request Body:**

```json
{
  // Complete invoice data object
}
```

**Response:** PDF file (application/pdf)

### 4. Clients

#### GET /api/clients

Retrieve clients with pagination and search.

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search term

#### POST /api/clients

Create a new client.

**Request Body:**

```json
{
  "name": "Client Name",
  "cc": "Contact Person",
  "shipTo": "Shipping Address",
  "shipCc": "Shipping Contact"
}
```

#### PUT /api/clients?id={clientId}

Update a client.

#### DELETE /api/clients?id={clientId}

Delete a client.

### 5. Companies

#### GET /api/companies

Retrieve companies with pagination and search.

#### POST /api/companies

Create a new company.

**Request Body:**

```json
{
  "name": "Company Name",
  "logo": "logo.svg",
  "accent": "#ef4444",
  "accentDark": "#b91c1c",
  "logoWidth": "560px",
  "contactHTML": "Contact information HTML",
  "bankName": "Bank Name",
  "currency": "Currency",
  "accName": "Account Name",
  "accNo": "Account Number",
  "branch": "Branch",
  "swift": "SWIFT Code",
  "vatTin": "VAT/TIN Number"
}
```

### 6. API Keys

#### GET /api/keys

List API keys (masked for security).

#### POST /api/keys

Create a new API key.

**Request Body:**

```json
{
  "name": "API Key Name",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### DELETE /api/keys?id={keyId}

Delete an API key.

## Usage Examples

### 1. Create and Send an Invoice via API

```bash
curl -X POST http://localhost:3002/api/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{
    "docType": "Invoice",
    "selectedClient": "client-id",
    "project": "Website Development",
    "qty": 1,
    "rate": 5000.00,
    "vat": 15,
    "longDesc": "Complete website development project",
    "sendEmail": true,
    "recipientEmail": "client@example.com",
    "includePDF": true,
    "apiKey": "your-api-key-here"
  }'
```

### 2. Get All Invoices

```bash
curl http://localhost:3002/api/invoices?limit=20&status=PAID
```

### 3. Create a New Client

```bash
curl -X POST http://localhost:3002/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "cc": "John Doe",
    "shipTo": "123 Business St, City, State 12345",
    "shipCc": "Jane Smith"
  }'
```

### 4. Generate PDF Only

```bash
curl -X POST http://localhost:3002/api/invoices/pdf \
  -H "Content-Type: application/json" \
  -d '{
    "docType": "Invoice",
    "selectedClient": "client-id",
    "project": "Project Name",
    "qty": 1,
    "rate": 1000.00,
    "vat": 15
  }' \
  --output invoice.pdf
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [...] // Optional validation errors
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid API key)
- `404` - Not Found
- `500` - Internal Server Error

## Email Configuration

To enable email functionality, set these environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Rate Limiting

API endpoints are not currently rate-limited, but this may be implemented in future versions.

## Webhooks

Webhook support is planned for future releases to notify external systems of invoice events.

## Support

For API support and questions, please refer to the project documentation or create an issue in the repository.
