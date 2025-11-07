import { NextRequest, NextResponse } from "next/server";
import { cediRatesAPI } from "@/lib/cedirates-api";
import { ApiResponse } from "@/lib/types";

// GET /api/exchange-rates/summary - Get exchange rate summary from Cedirates API
export async function GET(request: NextRequest) {
  try {
    // Get best selling rates for each currency from Cedirates API
    const [usdResponse, eurResponse, gbpResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/exchange-rates?fromCurrency=USD&toCurrency=GHS&limit=1`),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/exchange-rates?fromCurrency=EUR&toCurrency=GHS&limit=1`),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/exchange-rates?fromCurrency=GBP&toCurrency=GHS&limit=1`)
    ]);

    const usdData = await usdResponse.json();
    const eurData = await eurResponse.json();
    const gbpData = await gbpResponse.json();

    const apiResponse: ApiResponse = {
      success: true,
      data: {
        usdToGhs: usdData.success && usdData.data.data.length > 0 ? {
          rate: usdData.data.data[0].rate,
          company: usdData.data.data[0].company,
          source: 'cedirates'
        } : null,
        eurToGhs: eurData.success && eurData.data.data.length > 0 ? {
          rate: eurData.data.data[0].rate,
          company: eurData.data.data[0].company,
          source: 'cedirates'
        } : null,
        gbpToGhs: gbpData.success && gbpData.data.data.length > 0 ? {
          rate: gbpData.data.data[0].rate,
          company: gbpData.data.data[0].company,
          source: 'cedirates'
        } : null,
        lastUpdated: new Date().toISOString()
      }
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error('Failed to fetch exchange rate summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exchange rate summary' },
      { status: 500 }
    );
  }
}
