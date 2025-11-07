'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';
import ManagementLayout from '@/components/layout/ManagementLayout';
import DataTable from '@/components/ui/DataTable';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    cc: '',
    shipTo: '',
    shipCc: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load clients
  const loadClients = async (page = 1, search = '') => {
    setIsLoading(true);
    try
    {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append('search', search);

      const response = await fetch(`/api/clients?${params}`);
      const data = await response.json();

      if (data.success)
      {
        setClients(data.data.clients);
        setPagination({
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        });
      }
    } catch (error)
    {
      console.error('Failed to load clients:', error);
    } finally
    {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadClients(1, query);
  };

  const handlePageChange = (page: number) => {
    loadClients(page, searchQuery);
  };

  const handleCreate = () => {
    setFormData({ name: '', cc: '', shipTo: '', shipCc: '' });
    setErrors({});
    setEditingClient(null);
    setShowCreateModal(true);
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      cc: client.cc,
      shipTo: client.shipTo,
      shipCc: client.shipCc,
    });
    setErrors({});
    setEditingClient(client);
    setShowEditModal(true);
  };

  const handleDelete = (client: Client) => {
    setDeletingClient(client);
    setShowDeleteModal(true);
  };

  const handleView = (client: Client) => {
    // Navigate to client details or show in modal
    console.log('View client:', client);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim())
    {
      newErrors.name = 'Client name is required';
    }
    if (!formData.cc.trim())
    {
      newErrors.cc = 'Contact person is required';
    }
    if (!formData.shipTo.trim())
    {
      newErrors.shipTo = 'Shipping address is required';
    }
    if (!formData.shipCc.trim())
    {
      newErrors.shipCc = 'Shipping contact is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try
    {
      const url = editingClient ? `/api/clients?id=${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

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
        loadClients(pagination.page, searchQuery);
      } else
      {
        console.error('Failed to save client:', data.error);
        alert('Failed to save client: ' + data.error);
      }
    } catch (error)
    {
      console.error('Error saving client:', error);
      alert('Error saving client');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClient) return;

    try
    {
      const response = await fetch(`/api/clients?id=${deletingClient.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success)
      {
        setShowDeleteModal(false);
        setDeletingClient(null);
        loadClients(pagination.page, searchQuery);
      } else
      {
        alert('Failed to delete client: ' + data.error);
      }
    } catch (error)
    {
      console.error('Error deleting client:', error);
      alert('Error deleting client');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${selectedClients.length} clients?`);
    if (!confirmed) return;

    try
    {
      const deletePromises = selectedClients.map(client =>
        fetch(`/api/clients?id=${client.id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      setSelectedClients([]);
      loadClients(pagination.page, searchQuery);
    } catch (error)
    {
      console.error('Error bulk deleting clients:', error);
      alert('Error deleting clients');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Client Name',
      sortable: true,
      render: (value: string, row: Client) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.cc}</div>
        </div>
      ),
    },
    {
      key: 'shipTo',
      label: 'Shipping Address',
      sortable: true,
      render: (value: string, row: Client) => (
        <div>
          <div className="text-sm text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.shipCc}</div>
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
      title="Clients"
      description="Manage your clients and their contact information"
      actions={
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      }
    >
      <DataTable
        data={clients}
        columns={columns}
        loading={loading}
        searchable
        onSearch={handleSearch}
        selectable
        onSelectionChange={setSelectedClients}
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
        title={editingClient ? 'Edit Client' : 'Add New Client'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Enter client name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person *
            </label>
            <input
              type="text"
              value={formData.cc}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.cc ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Enter contact person name"
            />
            {errors.cc && <p className="mt-1 text-sm text-red-600">{errors.cc}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Address *
            </label>
            <textarea
              value={formData.shipTo}
              onChange={(e) => setFormData({ ...formData, shipTo: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.shipTo ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Enter shipping address"
            />
            {errors.shipTo && <p className="mt-1 text-sm text-red-600">{errors.shipTo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Contact *
            </label>
            <input
              type="text"
              value={formData.shipCc}
              onChange={(e) => setFormData({ ...formData, shipCc: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.shipCc ? 'border-red-300' : 'border-gray-300'
                }`}
              placeholder="Enter shipping contact name"
            />
            {errors.shipCc && <p className="mt-1 text-sm text-red-600">{errors.shipCc}</p>}
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
            {editingClient ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingClient(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        message={`Are you sure you want to delete "${deletingClient?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </ManagementLayout>
  );
}

