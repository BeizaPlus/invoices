'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye, Download, Send, Copy, FileText } from 'lucide-react';
import ManagementLayout from '@/components/layout/ManagementLayout';
import DataTable from '@/components/ui/DataTable';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import InvoiceViewModal from '@/components/modals/InvoiceViewModal';
import InvoiceSendModal from '@/components/modals/InvoiceSendModal';
import InvoiceDeleteModal from '@/components/modals/InvoiceDeleteModal';
import { Invoice } from '@/types/invoice';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Load invoices
  const loadInvoices = async (page = 1, search = '', status = 'ALL') => {
    setIsLoading(true);
    try
    {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append('search', search);
      if (status !== 'ALL') params.append('status', status);

      const response = await fetch(`/api/invoices?${params}`);
      const data = await response.json();

      if (data.success)
      {
        setInvoices(data.data.invoices);
        setPagination({
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        });
      }
    } catch (error)
    {
      console.error('Failed to load invoices:', error);
    } finally
    {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadInvoices(1, query, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    loadInvoices(1, searchQuery, status);
  };

  const handlePageChange = (page: number) => {
    loadInvoices(page, searchQuery, statusFilter);
  };

  const handleEdit = (invoice: Invoice) => {
    // Navigate to edit page
    window.location.href = `/dashboard/invoices/${invoice.id}/edit`;
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleDelete = (invoice: Invoice) => {
    setDeletingInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try
    {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (response.ok)
      {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.id}.pdf`;
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
        // Refresh the invoices list to show updated status
        loadInvoices();
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


  const handleDeleteConfirm = async () => {
    if (!deletingInvoice) return;

    try
    {
      const response = await fetch(`/api/invoices?id=${deletingInvoice.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success)
      {
        setShowDeleteModal(false);
        setDeletingInvoice(null);
        loadInvoices(pagination.page, searchQuery, statusFilter);
      } else
      {
        alert('Failed to delete invoice: ' + data.error);
      }
    } catch (error)
    {
      console.error('Error deleting invoice:', error);
      alert('Error deleting invoice');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${selectedInvoices.length} invoices?`);
    if (!confirmed) return;

    try
    {
      const deletePromises = selectedInvoices.map(invoice =>
        fetch(`/api/invoices?id=${invoice.id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      setSelectedInvoices([]);
      loadInvoices(pagination.page, searchQuery, statusFilter);
    } catch (error)
    {
      console.error('Error bulk deleting invoices:', error);
      alert('Error deleting invoices');
    }
  };

  const handleBulkExport = async () => {
    if (selectedInvoices.length === 0) return;

    try
    {
      // Export selected invoices as JSON
      const dataStr = JSON.stringify(selectedInvoices, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error)
    {
      console.error('Error exporting invoices:', error);
      alert('Error exporting invoices');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status)
    {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      render: (value: string, row: Invoice) => (
        <div>
          <div className="font-medium text-gray-900">{value || `INV-${row.id.slice(-8)}`}</div>
          <div className="text-sm text-gray-500">{row.docType}</div>
        </div>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      sortable: true,
      render: (value: any, row: Invoice) => (
        <div>
          <div className="font-medium text-gray-900">{row.client?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.company?.name || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'project',
      label: 'Project',
      sortable: true,
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value || 'N/A'}
        </div>
      ),
    },
    {
      key: 'finalTotal',
      label: 'Amount',
      sortable: true,
      render: (value: number) => (
        <div className="text-right">
          <div className="font-medium text-gray-900">${value?.toLocaleString() || '0.00'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const bulkActions = (
    <div className="flex space-x-2">
      <button
        onClick={handleBulkExport}
        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </button>
      <button
        onClick={handleBulkDelete}
        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </button>
    </div>
  );

  return (
    <ManagementLayout
      title="Invoices"
      description="Manage your invoices and track payments"
      actions={
        <button
          onClick={() => window.location.href = '/dashboard/invoices/new'}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 bg-white shadow-sm rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
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

      <DataTable
        data={invoices}
        columns={columns}
        loading={loading}
        selectable
        onSelectionChange={setSelectedInvoices}
        bulkActions={bulkActions}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownload={handleDownloadPdf}
        onSend={handleSend}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingInvoice(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deletingInvoice?.id}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

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
        onDownload={handleDownloadPdf}
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
    </ManagementLayout>
  );
}

