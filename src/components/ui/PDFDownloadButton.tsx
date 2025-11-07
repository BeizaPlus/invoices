'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

interface PDFDownloadButtonProps {
  invoiceId?: string;
  invoiceData?: any;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export default function PDFDownloadButton({
  invoiceId,
  invoiceData,
  variant = 'button',
  size = 'md',
  className = '',
  children
}: PDFDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try
    {
      let url: string;
      let body: any = {};

      if (invoiceId)
      {
        // Download existing invoice
        url = `/api/invoices/${invoiceId}/pdf-improved`;
      } else if (invoiceData)
      {
        // Generate PDF from data
        url = '/api/invoices/pdf-improved';
        body = { invoiceData };
      } else
      {
        throw new Error('Either invoiceId or invoiceData is required');
      }

      const response = await fetch(url, {
        method: invoiceId ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: invoiceId ? undefined : JSON.stringify(body),
      });

      if (!response.ok)
      {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'invoice.pdf';
      if (contentDisposition)
      {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch)
        {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error)
    {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally
    {
      setIsDownloading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size)
    {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getIconSize = () => {
    switch (size)
    {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  if (variant === 'icon')
  {
    return (
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Download PDF"
      >
        {isDownloading ? (
          <Loader2 className={`${getIconSize()} animate-spin`} />
        ) : (
          <Download className={getIconSize()} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getSizeClasses()} ${className}`}
    >
      {isDownloading ? (
        <Loader2 className={`${getIconSize()} animate-spin`} />
      ) : (
        <FileText className={getIconSize()} />
      )}
      {children || (isDownloading ? 'Generating...' : 'Download PDF')}
    </button>
  );
}
