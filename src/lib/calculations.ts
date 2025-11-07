import { InvoiceData, Resource, FinancialSummary, ExchangeRate } from './types';

/**
 * Number formatter for currency display
 */
export const fmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0
});

/**
 * Safely evaluate a numeric expression string
 * Supports basic arithmetic operations: +, -, *, /, ()
 */
export function evalNum(value: string | number | null | undefined): number {
  if (typeof value === 'number') return isFinite(value) ? value : 0;

  const s = String(value ?? '').trim();
  if (!s) return 0;

  // If it's already a valid number, return it
  const directNum = +s;
  if (!isNaN(directNum)) return directNum;

  // Check if it contains only allowed characters for math expressions
  if (!/^[0-9+\-*/().\s]+$/.test(s)) {
    return +s || 0;
  }

  try {
    // Use Function constructor to safely evaluate the expression
    const result = Function('"use strict"; return (' + s + ')')();
    return isFinite(result) ? +result : 0;
  } catch {
    return +s || 0;
  }
}

/**
 * Calculate subtotal from quantity and rate
 */
export function calculateSubtotal(qty: number, rate: number): number {
  return evalNum(qty) * evalNum(rate);
}

/**
 * Calculate discount amount
 */
export function calculateDiscountAmount(subtotal: number, discountPercent: number): number {
  return subtotal * (evalNum(discountPercent) / 100);
}

/**
 * Calculate VAT amount
 */
export function calculateVatAmount(amount: number, vatPercent: number): number {
  return amount * (evalNum(vatPercent) / 100);
}

/**
 * Calculate resources total from resources array
 */
export function calculateResourcesTotal(resources: Resource[]): number {
  if (!resources || !Array.isArray(resources)) return 0;

  return resources.reduce((sum, resource) => {
    const hours = evalNum(resource.hours);
    const rate = evalNum(resource.rate);
    return sum + (hours * rate);
  }, 0);
}

/**
 * Get exchange rate from database or use manual rate
 */
export async function getExchangeRate(
  fromCurrency: string = 'USD',
  toCurrency: string = 'GHS',
  manualRate?: number
): Promise<number> {
  // If manual rate is provided and valid, use it
  if (manualRate && manualRate > 0) {
    return manualRate;
  }

  try {
    // Try to fetch from database
    const response = await fetch(`/api/exchange-rates?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&rateType=mid&isActive=true&limit=1`);
    const data = await response.json();
    
    if (data.success && data.data.data.length > 0) {
      return data.data.data[0].rate;
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rate from database:', error);
  }

  // Fallback to default rate
  return 1;
}

/**
 * Calculate comprehensive financial summary with exchange rate support
 */
export async function calculateFinancialSummary(
  invoiceData: InvoiceData,
  fromCurrency: string = 'USD',
  toCurrency: string = 'GHS'
): Promise<FinancialSummary> {
  const qty = evalNum(invoiceData.qty);
  const rate = evalNum(invoiceData.rate);
  const discountPercent = evalNum(invoiceData.discount);
  const vatPercent = evalNum(invoiceData.vat);
  const paid = evalNum(invoiceData.paid);
  
  // Get exchange rate (async)
  const fx = await getExchangeRate(fromCurrency, toCurrency, evalNum(invoiceData.fx));

  // Calculate base subtotal
  const subtotal = calculateSubtotal(qty, rate);

  // Add resources if available
  const resourcesTotal = invoiceData.resources
    ? calculateResourcesTotal(invoiceData.resources)
    : 0;

  const totalBeforeDiscountVat = subtotal + resourcesTotal;

  // Calculate discount
  const discountAmount = calculateDiscountAmount(totalBeforeDiscountVat, discountPercent);
  const totalAfterDiscount = totalBeforeDiscountVat - discountAmount;

  // Calculate VAT
  const vatAmount = invoiceData.showVat
    ? calculateVatAmount(totalAfterDiscount, vatPercent)
    : 0;

  // Final totals
  const totalWithoutVat = totalAfterDiscount;
  const totalWithVat = totalAfterDiscount + vatAmount;

  // Determine final total based on settings
  const finalTotal = invoiceData.lockTotal
    ? evalNum(invoiceData.finalTotal)
    : invoiceData.totalInclVat
      ? totalWithVat
      : totalWithoutVat;

  // Apply exchange rate
  const finalTotalInCurrency = finalTotal * fx;

  // Calculate amount due
  const amountDue = Math.max(0, finalTotalInCurrency - paid);

  return {
    subtotal: subtotal,
    discountAmount: discountAmount,
    vatAmount: vatAmount,
    total: totalWithoutVat * fx,
    totalWithVat: totalWithVat * fx,
    amountDue: amountDue,
    resourcesTotal: resourcesTotal
  };
}

/**
 * Calculate comprehensive financial summary (synchronous version for backward compatibility)
 */
export function calculateFinancialSummarySync(invoiceData: InvoiceData): FinancialSummary {
  const qty = evalNum(invoiceData.qty);
  const rate = evalNum(invoiceData.rate);
  const discountPercent = evalNum(invoiceData.discount);
  const vatPercent = evalNum(invoiceData.vat);
  const paid = evalNum(invoiceData.paid);
  const fx = evalNum(invoiceData.fx) || 1; // Exchange rate, default to 1

  // Calculate base subtotal
  const subtotal = calculateSubtotal(qty, rate);

  // Add resources if available
  const resourcesTotal = invoiceData.resources
    ? calculateResourcesTotal(invoiceData.resources)
    : 0;

  const totalBeforeDiscountVat = subtotal + resourcesTotal;

  // Calculate discount
  const discountAmount = calculateDiscountAmount(totalBeforeDiscountVat, discountPercent);
  const totalAfterDiscount = totalBeforeDiscountVat - discountAmount;

  // Calculate VAT
  const vatAmount = invoiceData.showVat
    ? calculateVatAmount(totalAfterDiscount, vatPercent)
    : 0;

  // Final totals
  const totalWithoutVat = totalAfterDiscount;
  const totalWithVat = totalAfterDiscount + vatAmount;

  // Determine final total based on settings
  const finalTotal = invoiceData.lockTotal
    ? evalNum(invoiceData.finalTotal)
    : invoiceData.totalInclVat
      ? totalWithVat
      : totalWithoutVat;

  // Apply exchange rate
  const finalTotalInCurrency = finalTotal * fx;

  // Calculate amount due
  const amountDue = Math.max(0, finalTotalInCurrency - paid);

  return {
    subtotal: subtotal,
    discountAmount: discountAmount,
    vatAmount: vatAmount,
    total: totalWithoutVat * fx,
    totalWithVat: totalWithVat * fx,
    amountDue: amountDue,
    resourcesTotal: resourcesTotal
  };
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency?: string): string {
  const formatted = fmt.format(amount);
  return currency ? `${currency} ${formatted}` : formatted;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

/**
 * Calculate ETA date based on start date and duration
 */
export function calculateEtaDate(startDate: string | Date, daysTotal: number): Date {
  const start = new Date(startDate);
  const eta = new Date(start.getTime() + (daysTotal * 24 * 60 * 60 * 1000));
  return eta;
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string | Date, daysTotal: number): string {
  const start = new Date(startDate);
  const end = calculateEtaDate(startDate, daysTotal);

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit'
  });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

/**
 * Format ETA description
 */
export function formatEtaDescription(daysTotal: number): string {
  if (daysTotal === 7) return '1 week';
  if (daysTotal === 14) return '2 weeks';
  if (daysTotal === 30) return '1 month';
  if (daysTotal === 60) return '2 months';
  if (daysTotal === 90) return '3 months';
  return `${daysTotal} days`;
}

/**
 * Convert days to milliseconds
 */
export function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

/**
 * Convert date to ISO string (YYYY-MM-DD format)
 */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Validate numeric input
 */
export function isValidNumber(value: any): boolean {
  const num = evalNum(value);
  return isFinite(num) && !isNaN(num);
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calculate tax-inclusive amount from tax-exclusive amount
 */
export function calculateTaxInclusive(amount: number, taxRate: number): number {
  return amount * (1 + taxRate / 100);
}

/**
 * Calculate tax-exclusive amount from tax-inclusive amount
 */
export function calculateTaxExclusive(amount: number, taxRate: number): number {
  return amount / (1 + taxRate / 100);
}

/**
 * Calculate compound interest (for late payment penalties)
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  periods: number
): number {
  return principal * Math.pow(1 + rate / 100, periods);
}

/**
 * Parse currency string and extract numeric value
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and spaces, then parse
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  return evalNum(cleaned);
}

/**
 * Calculate weighted average (useful for blended rates)
 */
export function calculateWeightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = values.reduce((sum, value, index) => {
    return sum + (value * weights[index]);
  }, 0);

  return weightedSum / totalWeight;
}

/**
 * Generate invoice number based on pattern
 */
export function generateInvoiceNumber(pattern: string = 'INV-{YYYY}-{MM}-{###}'): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  // Generate a random 3-digit number for uniqueness
  const randomNum = Math.floor(Math.random() * 900) + 100;

  return pattern
    .replace('{YYYY}', year)
    .replace('{YY}', year.slice(-2))
    .replace('{MM}', month)
    .replace('{DD}', day)
    .replace('{###}', randomNum.toString());
}
