'use client';

import { useState } from 'react';
import { X, Send, Mail, FileText, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Invoice } from '@/types/invoice';

interface InvoiceSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSend: (email: string, includePDF: boolean) => Promise<void>;
}

export default function InvoiceSendModal({
  isOpen,
  onClose,
  invoice,
  onSend
}: InvoiceSendModalProps) {
  const [email, setEmail] = useState('');
  const [includePDF, setIncludePDF] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim())
    {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@'))
    {
      setError('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setError('');

    try
    {
      await onSend(email, includePDF);
      setEmail('');
      onClose();
    } catch (err)
    {
      setError('Failed to send invoice. Please try again.');
    } finally
    {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setIsSending(false);
    onClose();
  };

  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="Send Invoice">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Invoice</h2>
              <p className="text-sm text-gray-500">
                {invoice.invoiceNumber || `INV-${invoice.id.slice(-8)}`} - {invoice.project}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Invoice Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{invoice.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-green-600">${invoice.finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="client@example.com"
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includePDF"
                  checked={includePDF}
                  onChange={(e) => setIncludePDF(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includePDF" className="ml-2 text-sm text-gray-700">
                  Include PDF attachment
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Preview */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Email Preview</h4>
              <div className="text-sm text-blue-800">
                <p><strong>To:</strong> {email || 'client@example.com'}</p>
                <p><strong>Subject:</strong> Invoice {invoice.invoiceNumber || `INV-${invoice.id.slice(-8)}`} - {invoice.project}</p>
                <p><strong>Attachments:</strong> {includePDF ? 'Invoice PDF' : 'None'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={handleClose}
            disabled={isSending}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !email.trim()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
