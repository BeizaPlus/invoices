-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "rateType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "company" TEXT,
    "apiProvider" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate_history" (
    "id" TEXT NOT NULL,
    "exchangeRateId" TEXT NOT NULL,
    "oldRate" DOUBLE PRECISION,
    "newRate" DOUBLE PRECISION NOT NULL,
    "changeReason" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate_config" (
    "id" TEXT NOT NULL,
    "defaultSource" TEXT NOT NULL DEFAULT 'manual',
    "autoUpdateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updateFrequency" TEXT NOT NULL DEFAULT 'daily',
    "cediratesApiKey" TEXT,
    "lastApiUpdate" TIMESTAMP(3),
    "apiUpdateStatus" TEXT,
    "allowManualRates" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rates_fromCurrency_toCurrency_isActive_idx" ON "exchange_rates"("fromCurrency", "toCurrency", "isActive");

-- CreateIndex
CREATE INDEX "exchange_rates_effectiveDate_idx" ON "exchange_rates"("effectiveDate");

-- CreateIndex
CREATE INDEX "exchange_rate_history_exchangeRateId_effectiveDate_idx" ON "exchange_rate_history"("exchangeRateId", "effectiveDate");

-- AddForeignKey
ALTER TABLE "exchange_rate_history" ADD CONSTRAINT "exchange_rate_history_exchangeRateId_fkey" FOREIGN KEY ("exchangeRateId") REFERENCES "exchange_rates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default configuration
INSERT INTO "exchange_rate_config" ("id", "defaultSource", "autoUpdateEnabled", "updateFrequency", "allowManualRates", "requireApproval") 
VALUES ('default', 'manual', false, 'daily', true, false);

-- Insert some sample exchange rates
INSERT INTO "exchange_rates" ("id", "fromCurrency", "toCurrency", "rate", "rateType", "source", "company", "apiProvider", "isActive", "effectiveDate", "createdBy") 
VALUES 
    ('sample_usd_mid', 'USD', 'GHS', 12.50, 'mid', 'manual', 'Sample Bank', NULL, true, CURRENT_TIMESTAMP, 'system'),
    ('sample_eur_mid', 'EUR', 'GHS', 13.75, 'mid', 'manual', 'Sample Bank', NULL, true, CURRENT_TIMESTAMP, 'system'),
    ('sample_gbp_mid', 'GBP', 'GHS', 15.25, 'mid', 'manual', 'Sample Bank', NULL, true, CURRENT_TIMESTAMP, 'system');
