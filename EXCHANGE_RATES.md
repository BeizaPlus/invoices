# Exchange Rates Feature

This document describes the Exchange Rates feature that allows you to manage currency exchange rates for your invoices using the CediRates API.

## Overview

The Exchange Rates feature provides:

- **Real-time exchange rate fetching** from CediRates API
- **Manual exchange rate management** for custom rates
- **Historical rate tracking** with audit trails
- **Automatic rate synchronization** with configurable frequency
- **Multi-currency support** (USD, EUR, GBP, GHS, etc.)
- **Rate type support** (buying, selling, mid rates)

## Features

### 1. Exchange Rate Management

- View all exchange rates in a comprehensive dashboard
- Add, edit, and delete exchange rates manually
- Filter rates by currency, source, and status
- Track rate history and changes

### 2. CediRates API Integration

- Automatic synchronization with CediRates API
- Support for multiple exchange companies
- Real-time rate updates
- Fallback to manual rates when API is unavailable

### 3. Configuration Management

- Configure default exchange rate source
- Set automatic update frequency
- Manage API keys and credentials
- Control manual rate permissions

### 4. Invoice Integration

- Automatic exchange rate application in invoice calculations
- Currency conversion for multi-currency invoices
- Real-time rate updates in invoice forms

## API Endpoints

### Exchange Rates

- `GET /api/exchange-rates` - Get all exchange rates with filtering
- `POST /api/exchange-rates` - Create a new exchange rate
- `GET /api/exchange-rates/[id]` - Get a specific exchange rate
- `PUT /api/exchange-rates/[id]` - Update an exchange rate
- `DELETE /api/exchange-rates/[id]` - Delete an exchange rate

### Exchange Rate Summary

- `GET /api/exchange-rates/summary` - Get current rate summary for dashboard

### Synchronization

- `POST /api/exchange-rates/sync` - Sync rates from CediRates API

### Configuration

- `GET /api/exchange-rates/config` - Get exchange rate configuration
- `PUT /api/exchange-rates/config` - Update configuration

## Database Schema

### ExchangeRate Table

```sql
CREATE TABLE "exchange_rates" (
    "id" TEXT PRIMARY KEY,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "rateType" TEXT NOT NULL, -- 'buying', 'selling', 'mid'
    "source" TEXT NOT NULL, -- 'api', 'manual', 'cedirates'
    "company" TEXT,
    "apiProvider" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "effectiveDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
```

### ExchangeRateHistory Table

```sql
CREATE TABLE "exchange_rate_history" (
    "id" TEXT PRIMARY KEY,
    "exchangeRateId" TEXT NOT NULL,
    "oldRate" DOUBLE PRECISION,
    "newRate" DOUBLE PRECISION NOT NULL,
    "changeReason" TEXT NOT NULL, -- 'api_update', 'manual_edit', 'bulk_import'
    "effectiveDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ExchangeRateConfig Table

```sql
CREATE TABLE "exchange_rate_config" (
    "id" TEXT PRIMARY KEY,
    "defaultSource" TEXT DEFAULT 'manual',
    "autoUpdateEnabled" BOOLEAN DEFAULT false,
    "updateFrequency" TEXT DEFAULT 'daily',
    "cediratesApiKey" TEXT,
    "lastApiUpdate" TIMESTAMP,
    "apiUpdateStatus" TEXT,
    "allowManualRates" BOOLEAN DEFAULT true,
    "requireApproval" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
```

## Setup Instructions

### 1. Database Setup

Run the setup script to create the necessary database tables:

```bash
./setup-exchange-rates.sh
```

### 2. Environment Variables

Add your CediRates API key to your environment variables:

```bash
CEDIRATES_API_KEY=your_api_key_here
```

### 3. Access the Feature

Navigate to the Exchange Rates page in your dashboard:

```
http://localhost:3000/dashboard/exchange-rates
```

## Usage

### 1. Manual Rate Entry

1. Go to Exchange Rates dashboard
2. Click "Add Rate"
3. Select currency pair and rate type
4. Enter the exchange rate value
5. Set effective date
6. Save the rate

### 2. API Synchronization

1. Go to Exchange Rates dashboard
2. Click "Sync from API"
3. The system will fetch latest rates from CediRates
4. Review and approve the imported rates

### 3. Configuration

1. Click "Settings" in the Exchange Rates dashboard
2. Configure your preferences:
   - Default source (API vs Manual)
   - Auto-update frequency
   - API credentials
   - Manual rate permissions

### 4. Invoice Integration

The exchange rates are automatically integrated into invoice calculations:

- When creating invoices, select the currency pair
- The system will suggest current exchange rates
- You can override with manual rates if needed
- All calculations will use the selected rate

## CediRates API Integration

### Supported Endpoints

- `/api/v1/exchangeRates` - Get current exchange rates
- `/api/v1/exchangeRates/companies` - Get list of exchange companies
- `/api/v1/exchangeRates/today/{name}` - Get today's rate for specific company
- `/api/v2/rates` - Advanced filtering and pagination

### Rate Types

- **Buying Rate**: Rate at which banks buy foreign currency
- **Selling Rate**: Rate at which banks sell foreign currency
- **Mid Rate**: Average of buying and selling rates

### Supported Currencies

- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- GHS (Ghanaian Cedi)

## Components

### ExchangeRateSelector

A React component for selecting exchange rates in forms:

```tsx
<ExchangeRateSelector
  fromCurrency="USD"
  toCurrency="GHS"
  rateType="mid"
  value={exchangeRate}
  onChange={setExchangeRate}
  onSourceChange={setSource}
/>
```

### Utility Functions

- `getCurrentExchangeRate()` - Fetch current rate for currency pair
- `getExchangeRateSummary()` - Get dashboard summary
- `syncExchangeRates()` - Sync from CediRates API
- `convertAmount()` - Convert amount using exchange rate

## Error Handling

The system includes comprehensive error handling:

- API failures fall back to manual rates
- Invalid rates are validated before saving
- Network errors are handled gracefully
- User-friendly error messages

## Security

- API keys are stored securely in the database
- Rate changes are logged for audit trails
- Input validation prevents invalid data
- Rate approval workflow for sensitive changes

## Monitoring

- Track API sync status and last update times
- Monitor rate change history
- View sync success/failure rates
- Audit trail for all rate modifications

## Troubleshooting

### Common Issues

1. **API Sync Failing**
   - Check your CediRates API key
   - Verify network connectivity
   - Check API rate limits

2. **Rates Not Updating**
   - Ensure auto-update is enabled
   - Check update frequency settings
   - Verify API key permissions

3. **Invalid Rate Values**
   - Rates must be positive numbers
   - Check for reasonable rate ranges
   - Validate currency pair combinations

### Support

For issues with the Exchange Rates feature:

1. Check the browser console for errors
2. Verify database connectivity
3. Test API key with CediRates directly
4. Review configuration settings

## Future Enhancements

Planned improvements include:

- Support for more currencies
- Historical rate charts and graphs
- Rate alerts and notifications
- Bulk rate import/export
- Advanced rate analytics
- Multi-provider rate comparison
