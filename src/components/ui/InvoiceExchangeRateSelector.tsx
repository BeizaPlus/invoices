'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, AlertCircle, DollarSign, Euro, PoundSterling } from 'lucide-react';

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateType: 'buying' | 'selling' | 'mid';
  source: string;
  company: string;
  effectiveDate: string;
}

interface InvoiceExchangeRateSelectorProps {
  fromCurrency: string;
  toCurrency: string;
  selectedRate?: number;
  onRateChange: (rate: number, rateId: string, company: string) => void;
  onCurrencyChange: (fromCurrency: string, toCurrency: string) => void;
}

export default function InvoiceExchangeRateSelector({
  fromCurrency,
  toCurrency,
  selectedRate,
  onRateChange,
  onCurrencyChange
}: InvoiceExchangeRateSelectorProps) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Available currencies supported by Cedirates API
  const availableCurrencies = ['USD', 'EUR', 'GBP'];
  const baseCurrency = 'GHS';

  useEffect(() => {
    if (fromCurrency && toCurrency)
    {
      fetchExchangeRates();
    }
  }, [fromCurrency, toCurrency]);

  const fetchExchangeRates = async () => {
    setIsLoading(true);
    try
    {
      const response = await fetch(
        `/api/exchange-rates?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&limit=50`
      );
      const data = await response.json();

      if (data.success)
      {
        setRates(data.data.data);
        setLastUpdated(data.data.meta?.lastUpdated || new Date().toISOString());

        // Auto-select GTBank if available, otherwise the first rate (which should be GTBank due to sorting)
        if (data.data.data.length > 0)
        {
          const gtBankRate = data.data.data.find((rate: any) => rate.company === 'GTBank');
          const selectedRate = gtBankRate || data.data.data[0];
          setSelectedRateId(selectedRate.id);
          setSelectedCompany(selectedRate.company);
          onRateChange(selectedRate.rate, selectedRate.id, selectedRate.company);
        }
      } else
      {
        console.error('Failed to fetch exchange rates:', data.error);
      }
    } catch (error)
    {
      console.error('Failed to fetch exchange rates:', error);
    } finally
    {
      setIsLoading(false);
    }
  };

  const handleRateSelection = (rate: ExchangeRate) => {
    setSelectedRateId(rate.id);
    setSelectedCompany(rate.company);
    onRateChange(rate.rate, rate.id, rate.company);
  };

  const handleCurrencyChange = (newFromCurrency: string) => {
    onCurrencyChange(newFromCurrency, toCurrency);
  };

  const refreshRates = async () => {
    await fetchExchangeRates();
  };

  const getRateTypeColor = (rateType: string) => {
    switch (rateType)
    {
      case 'buying': return 'text-green-600 bg-green-50';
      case 'selling': return 'text-red-600 bg-red-50';
      case 'mid': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source)
    {
      case 'cedirates': return 'text-purple-600 bg-purple-50';
      case 'manual': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency)
    {
      case 'USD':
        return <DollarSign className="w-4 h-4" />;
      case 'EUR':
        return <Euro className="w-4 h-4" />;
      case 'GBP':
        return <PoundSterling className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Currency Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invoice Currency
          </label>
          <div className="relative">
            <select
              value={fromCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {getCurrencyIcon(fromCurrency)}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Currency (Fixed)
          </label>
          <div className="w-full px-3 py-2 pl-10 bg-gray-100 border border-gray-300 rounded-md text-gray-600 flex items-center">
            <span className="text-2xl mr-2">₵</span>
            {baseCurrency}
          </div>
        </div>
      </div>

      {/* Exchange Rate Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Selling Rate: {fromCurrency} to {baseCurrency}
            </h3>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                (Updated: {new Date(lastUpdated).toLocaleTimeString()})
              </span>
            )}
          </div>
          <button
            onClick={refreshRates}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-2 text-gray-600">Loading exchange rates...</span>
          </div>
        ) : rates.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>No exchange rates available for {fromCurrency} to {baseCurrency}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">
              Select the best selling rate (lower rates give you more GHS for your {fromCurrency}):
            </p>

            <div className="relative">
              <select
                value={selectedRateId}
                onChange={(e) => {
                  const selectedRate = rates.find(rate => rate.id === e.target.value);
                  if (selectedRate)
                  {
                    handleRateSelection(selectedRate);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                {rates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.company} - {rate.rate.toFixed(4)} {rate.fromCurrency}/{rate.toCurrency} ({rate.rateType})
                  </option>
                ))}
              </select>
            </div>

            {selectedRateId && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {rates.find(r => r.id === selectedRateId)?.rate.toFixed(4)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {fromCurrency}/{baseCurrency}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRateTypeColor('selling')}`}>
                        selling
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor('cedirates')}`}>
                        cedirates
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {selectedCompany}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lastUpdated && new Date(lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
