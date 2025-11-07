/**
 * Exchange Rate Utilities for Invoice Management
 * Provides helper functions for working with exchange rates in invoices
 */

import { ExchangeRate, ExchangeRateSummary } from './types';

/**
 * Get current exchange rate for a currency pair from Cedirates API
 */
export async function getCurrentExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rateType: 'buying' | 'selling' | 'mid' = 'selling'
): Promise<number | null> {
  try {
    const response = await fetch(
      `/api/exchange-rates?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&limit=1`
    );
    
    const data = await response.json();
    
    if (data.success && data.data.data.length > 0) {
      return data.data.data[0].rate;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

/**
 * Get exchange rate summary for dashboard from Cedirates API
 */
export async function getExchangeRateSummary(): Promise<ExchangeRateSummary | null> {
  try {
    const response = await fetch('/api/exchange-rates/summary');
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching exchange rate summary:', error);
    return null;
  }
}

/**
 * Convert amount using exchange rate
 */
export function convertAmount(
  amount: number,
  exchangeRate: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  return amount * exchangeRate;
}

/**
 * Format currency with symbol
 */
export function formatCurrencyWithSymbol(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    GHS: '₵',
    NGN: '₦',
    KES: 'KSh',
  };
  
  const symbol = symbols[currency.toUpperCase()] || currency;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol} ${formatted}`;
}

/**
 * Get currency options for dropdowns
 */
export function getCurrencyOptions(): Array<{ value: string; label: string; symbol: string }> {
  return [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'GHS', label: 'Ghanaian Cedi', symbol: '₵' },
    { value: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
    { value: 'KES', label: 'Kenyan Shilling', symbol: 'KSh' },
  ];
}

/**
 * Validate exchange rate value
 */
export function validateExchangeRate(rate: number): { isValid: boolean; error?: string } {
  if (typeof rate !== 'number' || isNaN(rate)) {
    return { isValid: false, error: 'Exchange rate must be a valid number' };
  }
  
  if (rate <= 0) {
    return { isValid: false, error: 'Exchange rate must be greater than 0' };
  }
  
  if (rate > 1000000) {
    return { isValid: false, error: 'Exchange rate seems too high' };
  }
  
  return { isValid: true };
}

/**
 * Calculate exchange rate from two amounts
 */
export function calculateExchangeRateFromAmounts(
  fromAmount: number,
  toAmount: number
): number {
  if (fromAmount <= 0) {
    return 0;
  }
  
  return toAmount / fromAmount;
}

/**
 * Get exchange rate history for a currency pair
 */
export async function getExchangeRateHistory(
  fromCurrency: string,
  toCurrency: string,
  limit: number = 30
): Promise<ExchangeRate[]> {
  try {
    const response = await fetch(
      `/api/exchange-rates?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&limit=${limit}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching exchange rate history:', error);
    return [];
  }
}

/**
 * Refresh exchange rates from CediRates API (now handled directly by API routes)
 */
export async function refreshExchangeRates(): Promise<{ success: boolean; message: string }> {
  try {
    // Since we're now using Cedirates API directly, this is just a placeholder
    // The actual refresh happens when components call the API routes
    return {
      success: true,
      message: 'Exchange rates are now fetched directly from Cedirates API'
    };
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    return {
      success: false,
      message: 'Error refreshing exchange rates'
    };
  }
}

/**
 * Get exchange rate configuration
 */
export async function getExchangeRateConfig() {
  try {
    const response = await fetch('/api/exchange-rates/config');
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching exchange rate config:', error);
    return null;
  }
}

/**
 * Update exchange rate configuration
 */
export async function updateExchangeRateConfig(config: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/exchange-rates/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: 'Configuration updated successfully'
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to update configuration'
      };
    }
  } catch (error) {
    console.error('Error updating exchange rate config:', error);
    return {
      success: false,
      message: 'Network error while updating configuration'
    };
  }
}

/**
 * Create a new exchange rate
 */
export async function createExchangeRate(rateData: {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateType: 'buying' | 'selling' | 'mid';
  source: 'api' | 'manual' | 'cedirates';
  company?: string;
  effectiveDate?: Date;
}): Promise<{ success: boolean; message: string; data?: ExchangeRate }> {
  try {
    const response = await fetch('/api/exchange-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rateData),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: 'Exchange rate created successfully',
        data: data.data
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to create exchange rate'
      };
    }
  } catch (error) {
    console.error('Error creating exchange rate:', error);
    return {
      success: false,
      message: 'Network error while creating exchange rate'
    };
  }
}

/**
 * Update an existing exchange rate
 */
export async function updateExchangeRate(
  id: string,
  updates: {
    rate?: number;
    rateType?: 'buying' | 'selling' | 'mid';
    isActive?: boolean;
    effectiveDate?: Date;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/exchange-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: 'Exchange rate updated successfully'
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to update exchange rate'
      };
    }
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return {
      success: false,
      message: 'Network error while updating exchange rate'
    };
  }
}

/**
 * Delete an exchange rate
 */
export async function deleteExchangeRate(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/exchange-rates/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: 'Exchange rate deleted successfully'
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to delete exchange rate'
      };
    }
  } catch (error) {
    console.error('Error deleting exchange rate:', error);
    return {
      success: false,
      message: 'Network error while deleting exchange rate'
    };
  }
}

/**
 * Get the best exchange rate for a currency pair from Cedirates API
 */
export async function getBestExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rateType: 'buying' | 'selling' | 'mid' = 'selling'
): Promise<{ rate: number; company: string; source: string } | null> {
  try {
    const response = await fetch(
      `/api/exchange-rates?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&limit=10`
    );
    
    const data = await response.json();
    
    if (data.success && data.data.data.length > 0) {
      // The API already returns rates sorted by best rate, so the first one is the best
      const bestRate = data.data.data[0];
      
      return {
        rate: bestRate.rate,
        company: bestRate.company || 'Unknown',
        source: 'cedirates'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching best exchange rate:', error);
    return null;
  }
}
