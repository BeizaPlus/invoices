'use client';

import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Invoice } from '@/types/invoice';

interface InvoiceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onDelete: () => Promise<void>;
}

export default function InvoiceDeleteModal({
  isOpen,
  onClose,
  invoice,
  onDelete
}: InvoiceDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try
    {
      await onDelete();
      onClose();
    } catch (err)
    {
      setError('Failed to delete invoice. Please try again.');
    } finally
    {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setIsDeleting(false);
    onClose();
  };

  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="Delete Invoice">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Delete Invoice</h2>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
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
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Warning</h3>
                <p className="text-sm text-red-700 mt-1">
                  You are about to permanently delete this invoice. This action cannot be undone and will remove all associated data including tasks and resources.
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Invoice Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium">{`INV-${invoice.id.slice(-8)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Project:</span>
                <span className="font-medium">{invoice.project}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{invoice.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-red-600">${invoice.finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Confirmation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Are you sure you want to delete this invoice?</strong> This will permanently remove all data associated with this invoice and cannot be recovered.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
