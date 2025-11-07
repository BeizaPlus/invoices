'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, DollarSign, Euro, PoundSterling, Globe } from 'lucide-react';
import { getCurrentExchangeRate, getExchangeRateSummary } from '@/lib/exchange-rate-utils';

interface ExchangeRateSelectorProps {
  fromCurrency: string;
  toCurrency: string;
  rateType: 'buying' | 'selling' | 'mid';
  value: number;
  onChange: (rate: number) => void;
  onSourceChange?: (source: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function ExchangeRateSelector({
  fromCurrency,
  toCurrency,
  rateType,
  value,
  onChange,
  onSourceChange,
  disabled = false,
  className = ''
}: ExchangeRateSelectorProps) {
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string>('manual');
  const [summary, setSummary] = useState<any>(null);

  // Load current exchange rate on mount or when dependencies change
  useEffect(() => {
    if (fromCurrency && toCurrency && rateType)
    {
      loadCurrentRate();
    }
  }, [fromCurrency, toCurrency, rateType]);

  const loadCurrentRate = async () => {
    setIsLoading(true);
    try
    {
      const response = await fetch(
        `/api/exchange-rates?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&limit=1`
      );
      const data = await response.json();

      if (data.success && data.data.data.length > 0)
      {
        const rate = data.data.data[0].rate;
        setCurrentRate(rate);
        if (value === 0 || value === 1)
        {
          onChange(rate);
        }
        setLastUpdated(data.data.meta?.lastUpdated || new Date().toISOString());
      }
    } catch (error)
    {
      console.error('Error loading current rate:', error);
    } finally
    {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try
    {
      const response = await fetch('/api/exchange-rates/summary');
      const data = await response.json();

      if (data.success)
      {
        setSummary(data.data);
        setLastUpdated(data.data.lastUpdated);
      }
    } catch (error)
    {
      console.error('Error loading summary:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try
    {
      await loadCurrentRate();
      await loadSummary();
      setSource('cedirates');
      onSourceChange?.('cedirates');
    } catch (error)
    {
      console.error('Error syncing rates:', error);
      alert('Failed to refresh exchange rates');
    } finally
    {
      setIsSyncing(false);
    }
  };

  const handleUseCurrentRate = () => {
    if (currentRate)
    {
      onChange(currentRate);
      setSource('cedirates');
      onSourceChange?.('cedirates');
    }
  };

  const handleManualRate = () => {
    setSource('manual');
    onSourceChange?.('manual');
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
        return <Globe className="w-4 h-4" />;
    }
  };

  const getRateTypeColor = (type: string) => {
    switch (type)
    {
      case 'buying':
        return 'bg-red-100 text-red-800';
      case 'selling':
        return 'bg-green-100 text-green-800';
      case 'mid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Selling Rate ({fromCurrency}/{toCurrency})
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            selling
          </span>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing || disabled}
          className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* Current Rate Display */}
      {currentRate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getCurrencyIcon(fromCurrency)}
              <span className="text-sm font-medium text-blue-900">
                Current Rate: {currentRate.toFixed(4)}
              </span>
            </div>
            <button
              onClick={handleUseCurrentRate}
              disabled={disabled}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use This Rate
            </button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-blue-700 mt-1">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Rate Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Exchange Rate
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            step="0.0001"
            value={value || ''}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value) || 0;
              onChange(newValue);
              handleManualRate();
            }}
            disabled={disabled}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Enter exchange rate"
          />
          <div className="flex items-center space-x-1">
            {getCurrencyIcon(fromCurrency)}
            <span className="text-sm text-gray-500">to</span>
            {getCurrencyIcon(toCurrency)}
          </div>
        </div>
      </div>

      {/* Source Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Source: {source}</span>
        {isLoading && <span>Loading...</span>}
      </div>

      {/* Quick Rate Buttons */}
      {summary && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Quick Rates:</p>
          <div className="grid grid-cols-3 gap-2">
            {summary.usdToGhs && fromCurrency === 'USD' && toCurrency === 'GHS' && (
              <button
                onClick={() => {
                  onChange(summary.usdToGhs.rate);
                  setSource('cedirates');
                  onSourceChange?.('cedirates');
                }}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                USD: {summary.usdToGhs.rate.toFixed(2)}
              </button>
            )}
            {summary.eurToGhs && fromCurrency === 'EUR' && toCurrency === 'GHS' && (
              <button
                onClick={() => {
                  onChange(summary.eurToGhs.rate);
                  setSource('cedirates');
                  onSourceChange?.('cedirates');
                }}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                EUR: {summary.eurToGhs.rate.toFixed(2)}
              </button>
            )}
            {summary.gbpToGhs && fromCurrency === 'GBP' && toCurrency === 'GHS' && (
              <button
                onClick={() => {
                  onChange(summary.gbpToGhs.rate);
                  setSource('cedirates');
                  onSourceChange?.('cedirates');
                }}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                GBP: {summary.gbpToGhs.rate.toFixed(2)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
