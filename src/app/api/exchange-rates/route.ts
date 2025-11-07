import { NextRequest, NextResponse } from "next/server";
import { cediRatesAPI } from "@/lib/cedirates-api";
import { ApiResponse } from "@/lib/types";

// GET /api/exchange-rates - Get exchange rates from Cedirates API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCurrency = searchParams.get('fromCurrency') || 'USD';
    const toCurrency = searchParams.get('toCurrency') || 'GHS';
    const limit = parseInt(searchParams.get('limit') || '50'); // Increased limit to get more rates

    // Validate currency codes - only support USD, EUR, GBP to GHS
    const validFromCurrencies = ['USD', 'EUR', 'GBP'];
    if (!validFromCurrencies.includes(fromCurrency) || toCurrency !== 'GHS') {
      return NextResponse.json(
        { success: false, error: 'Only USD, EUR, GBP to GHS exchange rates are supported' },
        { status: 400 }
      );
    }

    // Get exchange rates from Cedirates API
    const response = await cediRatesAPI.getExchangeRates();
    
    if (!response.success || !response.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch exchange rates from Cedirates API' },
        { status: 500 }
      );
    }

    // Filter and format the data - only selling rates
    const currencyKeyMap: Record<string, string> = {
      'USD': 'dollarRates',
      'EUR': 'euroRates', 
      'GBP': 'poundRates'
    };
    
    // Currency conversion rates (approximate)
    const currencyConversionRates: Record<string, number> = {
      'USD': 1.0,
      'EUR': 1.08, // 1 EUR = 1.08 USD (approximate)
      'GBP': 1.27  // 1 GBP = 1.27 USD (approximate)
    };
    
    const currencyKey = currencyKeyMap[fromCurrency] as keyof typeof response.data[0];
    const conversionRate = currencyConversionRates[fromCurrency] || 1.0;
    
    const filteredRates = response.data
      .map((rate) => {
        const currencyRates = rate[currencyKey] as any;
        if (!currencyRates || !currencyRates.sellingRate || currencyRates.sellingRate <= 0) return null;

        // Apply currency conversion to make rates different for different currencies
        const convertedRate = currencyRates.sellingRate * conversionRate;

        return {
          id: `cedirates-${rate.company}-${fromCurrency}-${toCurrency}-selling`,
          fromCurrency,
          toCurrency,
          rate: convertedRate,
          rateType: 'selling',
          source: 'cedirates',
          company: rate.company,
          apiProvider: 'cedirates',
          isActive: true,
          effectiveDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      })
      .filter(rate => rate !== null && rate.rate > 0)
      .sort((a, b) => {
        // Prioritize GTBank as the default option, then sort by rate (lower is better for selling)
        if (a!.company === 'GTBank' && b!.company !== 'GTBank') return -1;
        if (b!.company === 'GTBank' && a!.company !== 'GTBank') return 1;
        return a!.rate - b!.rate;
      })
      .slice(0, limit);

    const apiResponse: ApiResponse = {
      success: true,
      data: {
        data: filteredRates,
        pagination: {
          page: 1,
          limit,
          total: filteredRates.length,
          totalPages: 1
        },
        meta: {
          fromCurrency,
          toCurrency,
          rateType: 'selling',
          source: 'cedirates',
          lastUpdated: new Date().toISOString()
        }
      }
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
