/**
 * CediRates API Integration Service
 * Handles all interactions with the CediRates API for exchange rates
 */

// Types based on the CediRates API documentation
export interface CurrencyRates {
  buyingRate: number;
  sellingRate: number;
  midRate?: number;
}

export interface ExchangeRate {
  company: string;
  logo: string;
  dollarRates: CurrencyRates;
  euroRates: CurrencyRates;
  poundRates: CurrencyRates;
}

export interface ExchangeRateDetail extends ExchangeRate {
  name: string;
}

export interface HistoricalExchangeRate {
  date: string;
  rates: {
    dollarRates: CurrencyRates;
    euroRates: CurrencyRates;
    poundRates: CurrencyRates;
  };
}

export interface Company {
  name: string;
  logo: string;
}

export interface RateV2 {
  company: string;
  logo: string;
  subCategory: string;
  url: string;
  UniqueID: string;
  tagsType: string;
  verified: boolean;
  actionUrl: string;
  dollarRates: CurrencyRates;
  euroRates: CurrencyRates;
  poundRates: CurrencyRates;
}

export interface CediRatesResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  hasNextPage: boolean;
  page: number;
  totalPages: number;
  totalPrices: number;
}

export interface CediRatesError {
  success: false;
  message: string;
  statusCode: number;
}

// Configuration
const CEDIRATES_BASE_URL = 'https://public-api.cedirates.com';
const DEFAULT_TIMEOUT = 10000; // 10 seconds

export class CediRatesAPI {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(apiKey: string, baseUrl: string = CEDIRATES_BASE_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Make HTTP request to CediRates API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CediRatesResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - API took too long to respond');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred while fetching exchange rates');
    }
  }

  /**
   * Get exchange rates for a specific date or today
   */
  async getExchangeRates(date?: string): Promise<CediRatesResponse<ExchangeRate[]>> {
    const params = new URLSearchParams();
    if (date) {
      params.append('date', date);
    }
    
    const endpoint = `/api/v1/exchangeRates${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<ExchangeRate[]>(endpoint);
  }

  /**
   * Get list of all exchange companies
   */
  async getExchangeCompanies(): Promise<CediRatesResponse<string[]>> {
    return this.makeRequest<string[]>('/api/v1/exchangeRates/companies');
  }

  /**
   * Get today's exchange rate for a specific company
   */
  async getCompanyExchangeRateToday(companyName: string): Promise<CediRatesResponse<ExchangeRateDetail>> {
    const encodedName = encodeURIComponent(companyName);
    return this.makeRequest<ExchangeRateDetail>(`/api/v1/exchangeRates/today/${encodedName}`);
  }

  /**
   * Get historical exchange rates for a specific company
   */
  async getCompanyHistoricalRates(
    companyName: string,
    page: number = 1,
    limit: number = 30
  ): Promise<CediRatesResponse<{
    company: Company;
    data: HistoricalExchangeRate[];
    hasNextPage: boolean;
  }>> {
    const encodedName = encodeURIComponent(companyName);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return this.makeRequest(`/api/v1/exchangeRates/getall/${encodedName}?${params.toString()}`);
  }

  /**
   * Get exchange rates with advanced filtering (V2 API)
   */
  async getRatesV2(options: {
    date?: string;
    baseCurrency?: string;
    quoteCurrency?: string;
    companyId?: string;
    subCategory?: string;
    isToday?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<RateV2>> {
    const params = new URLSearchParams();
    
    if (options.date) params.append('date', options.date);
    if (options.baseCurrency) params.append('baseCurrency', options.baseCurrency);
    if (options.quoteCurrency) params.append('quoteCurrency', options.quoteCurrency);
    if (options.companyId) params.append('companyId', options.companyId);
    if (options.subCategory) params.append('subCategory', options.subCategory);
    if (options.isToday !== undefined) params.append('isToday', options.isToday.toString());
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const endpoint = `/api/v2/rates${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<RateV2[]>(endpoint) as Promise<PaginatedResponse<RateV2>>;
  }

  /**
   * Get the best exchange rate for a specific currency pair
   */
  async getBestExchangeRate(
    fromCurrency: 'USD' | 'EUR' | 'GBP',
    toCurrency: 'GHS' = 'GHS',
    rateType: 'buying' | 'selling' | 'mid' = 'mid'
  ): Promise<{
    rate: number;
    company: string;
    source: 'api' | 'manual';
  }> {
    try {
      const response = await this.getExchangeRates();
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch exchange rates');
      }

      let bestRate = 0;
      let bestCompany = '';
      const currencyKey = `${fromCurrency.toLowerCase()}Rates` as keyof ExchangeRate;

      for (const exchangeRate of response.data) {
        const rates = exchangeRate[currencyKey] as CurrencyRates;
        if (!rates) continue;

        let currentRate = 0;
        switch (rateType) {
          case 'buying':
            currentRate = rates.buyingRate;
            break;
          case 'selling':
            currentRate = rates.sellingRate;
            break;
          case 'mid':
            currentRate = rates.midRate || (rates.buyingRate + rates.sellingRate) / 2;
            break;
        }

        if (currentRate > bestRate) {
          bestRate = currentRate;
          bestCompany = exchangeRate.company;
        }
      }

      if (bestRate === 0) {
        throw new Error('No exchange rates found');
      }

      return {
        rate: bestRate,
        company: bestCompany,
        source: 'api'
      };
    } catch (error) {
      console.error('Error fetching best exchange rate:', error);
      throw error;
    }
  }

  /**
   * Get exchange rate summary for dashboard
   */
  async getExchangeRateSummary(): Promise<{
    usdToGhs: { rate: number; company: string };
    eurToGhs: { rate: number; company: string };
    gbpToGhs: { rate: number; company: string };
    lastUpdated: string;
  }> {
    try {
      const [usdRate, eurRate, gbpRate] = await Promise.all([
        this.getBestExchangeRate('USD', 'GHS', 'mid'),
        this.getBestExchangeRate('EUR', 'GHS', 'mid'),
        this.getBestExchangeRate('GBP', 'GHS', 'mid'),
      ]);

      return {
        usdToGhs: usdRate,
        eurToGhs: eurRate,
        gbpToGhs: gbpRate,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching exchange rate summary:', error);
      throw error;
    }
  }
}

/**
 * Utility functions for exchange rate management
 */
export class ExchangeRateUtils {
  /**
   * Convert amount from one currency to another
   */
  static convertCurrency(
    amount: number,
    fromRate: number,
    toRate: number = 1
  ): number {
    return (amount * fromRate) / toRate;
  }

  /**
   * Calculate exchange rate between two currencies
   */
  static calculateExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
  ): number {
    if (fromCurrency === toCurrency) return 1;
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    return toRate / fromRate;
  }

  /**
   * Format exchange rate for display
   */
  static formatExchangeRate(rate: number, decimals: number = 4): string {
    return rate.toFixed(decimals);
  }

  /**
   * Validate exchange rate value
   */
  static isValidExchangeRate(rate: number): boolean {
    return typeof rate === 'number' && rate > 0 && isFinite(rate);
  }

  /**
   * Get currency symbol
   */
  static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      GHS: '₵',
      NGN: '₦',
      KES: 'KSh',
    };
    
    return symbols[currency.toUpperCase()] || currency;
  }

  /**
   * Parse currency string to number
   */
  static parseCurrencyAmount(amount: string): number {
    const cleaned = amount.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
}

// Default instance (will be configured with API key from environment)
export const cediRatesAPI = new CediRatesAPI(
  process.env.CEDIRATES_API_KEY || ''
);

export default CediRatesAPI;
