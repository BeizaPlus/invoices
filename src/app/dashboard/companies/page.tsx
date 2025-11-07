'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';
import ManagementLayout from '@/components/layout/ManagementLayout';
import DataTable from '@/components/ui/DataTable';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { Company } from '@/lib/types';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    accent: '#ef4444',
    accentDark: '#b91c1c',
    logoWidth: '560px',
    contactHTML: '',
    bankName: '',
    currency: '',
    accName: '',
    accNo: '',
    branch: '',
    swift: '',
    vatTin: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load companies
  const loadCompanies = async (page = 1, search = '') => {
    setIsLoading(true);
    try
    {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append('search', search);

      const response = await fetch(`/api/companies?${params}`);
      const data = await response.json();

      if (data.success)
      {
        setCompanies(data.data.companies);
        setPagination({
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        });
      }
    } catch (error)
    {
      console.error('Failed to load companies:', error);
    } finally
    {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadCompanies(1, query);
  };

  const handlePageChange = (page: number) => {
    loadCompanies(page, searchQuery);
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      logo: '',
      accent: '#ef4444',
      accentDark: '#b91c1c',
      logoWidth: '560px',
      contactHTML: '',
      bankName: '',
      currency: '',
      accName: '',
      accNo: '',
      branch: '',
      swift: '',
      vatTin: '',
    });
    setErrors({});
    setEditingCompany(null);
    setShowCreateModal(true);
  };

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      logo: company.logo || '',
      accent: company.accent || '#ef4444',
      accentDark: company.accentDark || '#b91c1c',
      logoWidth: company.logoWidth || '560px',
      contactHTML: company.contactHTML || '',
      bankName: company.bankDetails?.bankName || '',
      currency: company.bankDetails?.currency || '',
      accName: company.bankDetails?.accName || '',
      accNo: company.bankDetails?.accNo || '',
      branch: company.bankDetails?.branch || '',
      swift: company.bankDetails?.swift || '',
      vatTin: company.bankDetails?.vatTin || '',
    });
    setErrors({});
    setEditingCompany(company);
    setShowEditModal(true);
  };

  const handleDelete = (company: Company) => {
    setDeletingCompany(company);
    setShowDeleteModal(true);
  };

  const handleView = (company: Company) => {
    console.log('View company:', company);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim())
    {
      newErrors.name = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try
    {
      const url = editingCompany ? `/api/companies?id=${editingCompany.id}` : '/api/companies';
      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success)
      {
        setShowCreateModal(false);
        setShowEditModal(false);
        loadCompanies(pagination.page, searchQuery);
      } else
      {
        console.error('Failed to save company:', data.error);
        alert('Failed to save company: ' + data.error);
      }
    } catch (error)
    {
      console.error('Error saving company:', error);
      alert('Error saving company');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;

    try
    {
      const response = await fetch(`/api/companies?id=${deletingCompany.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success)
      {
        setShowDeleteModal(false);
        setDeletingCompany(null);
        loadCompanies(pagination.page, searchQuery);
      } else
      {
        alert('Failed to delete company: ' + data.error);
      }
    } catch (error)
    {
      console.error('Error deleting company:', error);
      alert('Error deleting company');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCompanies.length === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${selectedCompanies.length} companies?`);
    if (!confirmed) return;

    try
    {
      const deletePromises = selectedCompanies.map(company =>
        fetch(`/api/companies?id=${company.id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      setSelectedCompanies([]);
      loadCompanies(pagination.page, searchQuery);
    } catch (error)
    {
      console.error('Error bulk deleting companies:', error);
      alert('Error deleting companies');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Company Name',
      sortable: true,
      render: (value: string, row: Company) => (
        <div className="flex items-center">
          {row.logo && (
            <img
              src={`/logos/${row.logo}`}
              alt={value}
              className="h-8 w-8 rounded-full mr-3"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.bankDetails?.accName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'bankName',
      label: 'Bank Details',
      sortable: true,
      render: (value: string, row: Company) => (
        <div>
          <div className="text-sm text-gray-900">{row.bankDetails?.bankName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.bankDetails?.accNo || 'N/A'}</div>
        </div>
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
    <button
      onClick={handleBulkDelete}
      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete Selected
    </button>
  );

  return (
    <ManagementLayout
      title="Companies"
      description="Manage your companies and their bank details"
      actions={
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </button>
      }
    >
      <DataTable
        data={companies}
        columns={columns}
        loading={loading}
        searchable
        onSearch={handleSearch}
        selectable
        onSelectionChange={setSelectedCompanies}
        bulkActions={bulkActions}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}
        title={editingCompany ? 'Edit Company' : 'Add New Company'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Enter company name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo File
                </label>
                <input
                  type="text"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="logo.svg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={formData.accent}
                  onChange={(e) => setFormData({ ...formData, accent: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo Width
                </label>
                <input
                  type="text"
                  value={formData.logoWidth}
                  onChange={(e) => setFormData({ ...formData, logoWidth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="560px"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information (HTML)
              </label>
              <textarea
                value={formData.contactHTML}
                onChange={(e) => setFormData({ ...formData, contactHTML: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Company Name<br>Address<br>Phone: +1 (555) 123-4567<br>Email: info@company.com"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Bank Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="USD Account"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.accName}
                  onChange={(e) => setFormData({ ...formData, accName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Account Holder Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accNo}
                  onChange={(e) => setFormData({ ...formData, accNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Branch Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SWIFT Code
                </label>
                <input
                  type="text"
                  value={formData.swift}
                  onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="SWIFT123"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT/TIN Number
                </label>
                <input
                  type="text"
                  value={formData.vatTin}
                  onChange={(e) => setFormData({ ...formData, vatTin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="VAT123456789"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
          >
            {editingCompany ? 'Update Company' : 'Create Company'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingCompany(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Company"
        message={`Are you sure you want to delete "${deletingCompany?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </ManagementLayout>
  );
}

