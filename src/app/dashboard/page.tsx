'use client';

import { useState, useEffect } from 'react';
import {
  PlusCircle,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import ManagementLayout from '@/components/layout/ManagementLayout';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import InvoiceViewModal from '@/components/modals/InvoiceViewModal';
import InvoiceSendModal from '@/components/modals/InvoiceSendModal';
import InvoiceDeleteModal from '@/components/modals/InvoiceDeleteModal';
import { Invoice } from '@/types/invoice';

interface Stats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    paidInvoices: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load real data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try
      {
        // Load invoices
        const invoicesResponse = await fetch('/api/invoices?limit=50');
        const invoicesData = await invoicesResponse.json();

        if (invoicesData.success)
        {
          setInvoices(invoicesData.data.invoices);

          // Calculate stats from real data
          const totalInvoices = invoicesData.data.invoices.length;
          const pendingInvoices = invoicesData.data.invoices.filter((invoice: any) => invoice.status === 'DRAFT' || invoice.status === 'SENT').length;
          const paidInvoices = invoicesData.data.invoices.filter((invoice: any) => invoice.status === 'PAID').length;

          setStats({
            totalInvoices,
            totalRevenue: 0, // Removed for simplicity
            pendingInvoices,
            paidInvoices
          });
        }
      } catch (error)
      {
        console.error('Failed to load dashboard data:', error);
        // Fallback to empty state
        setStats({
          totalInvoices: 0,
          totalRevenue: 0,
          pendingInvoices: 0,
          paidInvoices: 0
        });
        setInvoices([]);
      } finally
      {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

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

  const getStatusIcon = (status: string) => {
    switch (status)
    {
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'SENT':
        return <Send className="w-4 h-4" />;
      case 'DRAFT':
        return <Edit className="w-4 h-4" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleEdit = (invoice: Invoice) => {
    window.location.href = `/dashboard/invoices/${invoice.id}/edit`;
  };

  const handleDownload = async (invoice: Invoice) => {
    try
    {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (response.ok)
      {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else
      {
        alert('Failed to download PDF');
      }
    } catch (error)
    {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  const handleSend = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowSendModal(true);
  };

  const handleSendEmail = async (email: string, includePDF: boolean) => {
    if (!selectedInvoice) return;

    try
    {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: email,
          includePDF: includePDF,
        }),
      });

      const data = await response.json();
      if (data.success)
      {
        alert('Invoice sent successfully!');
        setShowSendModal(false);
        setSelectedInvoice(null);
      } else
      {
        throw new Error(data.error || 'Failed to send invoice');
      }
    } catch (error)
    {
      console.error('Error sending invoice:', error);
      throw error;
    }
  };

  const handleDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoice) return;

    try
    {
      const response = await fetch(`/api/invoices?id=${selectedInvoice.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success)
      {
        // Remove the invoice from the local state
        setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
        setShowDeleteModal(false);
        setSelectedInvoice(null);
        // Update stats
        setStats(prev => ({
          ...prev,
          totalInvoices: prev.totalInvoices - 1
        }));
      } else
      {
        throw new Error(data.error || 'Failed to delete invoice');
      }
    } catch (error)
    {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };


  if (isLoading)
  {
    return (
      <ManagementLayout
        title="Dashboard"
        description="Overview of your invoices and business metrics"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Invoice
          </button>
        }
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout
      title="Dashboard"
      description="Overview of your invoices and business metrics"
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create Invoice
        </button>
      }
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paidInvoices}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
              <a
                href="/dashboard/invoices"
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                View all →
              </a>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.slice(0, 10).map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {`INV-${invoice.id.slice(-8)}`}
                        </div>
                        <div className="text-sm text-gray-500">{invoice.docType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.client?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{invoice.company?.name || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {invoice.project || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${invoice.finalTotal?.toLocaleString() || '0.00'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1">{invoice.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleView(invoice)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors duration-150"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                          title="Edit Invoice"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(invoice)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors duration-150"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSend(invoice)}
                          className="text-orange-600 hover:text-orange-900 p-1 rounded-md hover:bg-orange-50 transition-colors duration-150"
                          title="Send Invoice"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors duration-150"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first invoice.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Invoice"
          size="md"
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Choose how to create your invoice</h3>
              <p className="text-sm text-gray-500">
                Start from scratch or use a template to create your invoice quickly
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  window.location.href = '/dashboard/invoices/new';
                }}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Create from scratch</div>
                  <div className="text-sm text-gray-500">Start with a blank invoice form</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  // Navigate to template selection
                  alert('Template selection coming soon!');
                }}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Use template</div>
                  <div className="text-sm text-gray-500">Choose from pre-built templates</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Invoice View Modal */}
      <InvoiceViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onEdit={(invoice) => {
          setShowViewModal(false);
          handleEdit(invoice);
        }}
        onDelete={(invoice) => {
          setShowViewModal(false);
          handleDelete(invoice);
        }}
        onDownload={handleDownload}
        onSend={(invoice) => {
          setShowViewModal(false);
          handleSend(invoice);
        }}
      />

      {/* Invoice Send Modal */}
      <InvoiceSendModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSend={handleSendEmail}
      />

      {/* Invoice Delete Modal */}
      <InvoiceDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onDelete={handleDeleteConfirm}
      />
    </ManagementLayout>
  );
}