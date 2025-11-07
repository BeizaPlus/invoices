'use client';

import { useState, useEffect } from 'react';
import { X, Download, Send, Edit, Trash2, Calendar, DollarSign, User, Building2, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { Invoice } from '@/types/invoice';

interface InvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
}

export default function InvoiceViewModal({
  isOpen,
  onClose,
  invoice,
  onEdit,
  onDelete,
  onDownload,
  onSend
}: InvoiceViewModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status)
    {
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateSubtotal = () => {
    return invoice.qty * invoice.rate;
  };

  const calculateDiscountAmount = () => {
    return calculateSubtotal() * (invoice.discount / 100);
  };

  const calculateVatAmount = () => {
    return (calculateSubtotal() - calculateDiscountAmount()) * (invoice.vat / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount() + calculateVatAmount();
  };

  const calculateAmountDue = () => {
    return calculateTotal() - invoice.paid;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Invoice Details">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {invoice.invoiceNumber || `INV-${invoice.id.slice(-8)}`}
              </h2>
              <p className="text-sm text-gray-500">{invoice.docType}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Project Name</label>
                  <p className="text-gray-900">{invoice.project}</p>
                </div>
                {invoice.longDesc && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{invoice.longDesc}</p>
                  </div>
                )}
                {invoice.params && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Parameters</label>
                    <p className="text-gray-900">{invoice.params}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Client & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Client
                </h4>
                <p className="text-gray-900">{invoice.client.name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Company
                </h4>
                <p className="text-gray-900">{invoice.company.name}</p>
              </div>
            </div>

            {/* Tasks */}
            {invoice.tasks && invoice.tasks.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>
                <div className="space-y-2">
                  {invoice.tasks.map((task) => (
                    <div key={task.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{task.name}</p>
                        <p className="text-sm text-gray-500">Duration: {task.dur} days</p>
                      </div>
                      <span className="text-sm text-gray-600">Offset: {task.off} days</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {invoice.resources && invoice.resources.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
                <div className="space-y-2">
                  {invoice.resources.map((resource) => (
                    <div key={resource.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{resource.type}</p>
                        <p className="text-sm text-gray-500">{resource.hours} hours @ ${resource.rate}/hour</p>
                      </div>
                      <span className="font-medium text-gray-900">${(resource.hours * resource.rate).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{invoice.qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-medium">${invoice.rate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({invoice.discount}%):</span>
                    <span>-${calculateDiscountAmount().toFixed(2)}</span>
                  </div>
                )}
                {invoice.vat > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT ({invoice.vat}%):</span>
                    <span className="font-medium">${calculateVatAmount().toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-red-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                {invoice.paid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>${invoice.paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Amount Due:</span>
                      <span>${calculateAmountDue().toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Dates</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">{new Date(invoice.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">
                      {new Date(new Date(invoice.startDate).getTime() + (invoice.etaDays * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
          <div className="flex items-center space-x-3">
            {onEdit && (
              <button
                onClick={() => onEdit(invoice)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            {onDownload && (
              <button
                onClick={() => onDownload(invoice)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            )}
            {onSend && (
              <button
                onClick={() => onSend(invoice)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {onDelete && (
              <button
                onClick={() => onDelete(invoice)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
