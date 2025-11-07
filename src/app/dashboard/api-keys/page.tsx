'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import ManagementLayout from '@/components/layout/ManagementLayout';
import DataTable from '@/components/ui/DataTable';
import Modal, { ConfirmModal } from '@/components/ui/Modal';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<ApiKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    expiresAt: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState<string | null>(null);

  // Load API keys
  const loadApiKeys = async (page = 1, search = '') => {
    setIsLoading(true);
    try
    {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append('search', search);

      const response = await fetch(`/api/keys?${params}`);
      const data = await response.json();

      if (data.success)
      {
        setApiKeys(data.data.keys);
        setPagination({
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        });
      }
    } catch (error)
    {
      console.error('Failed to load API keys:', error);
    } finally
    {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadApiKeys(1, query);
  };

  const handlePageChange = (page: number) => {
    loadApiKeys(page, searchQuery);
  };

  const handleCreate = () => {
    setFormData({ name: '', expiresAt: '' });
    setErrors({});
    setNewKey(null);
    setShowCreateModal(true);
  };

  const handleDelete = (key: ApiKey) => {
    setDeletingKey(key);
    setShowDeleteModal(true);
  };

  const handleView = (key: ApiKey) => {
    console.log('View API key:', key);
  };

  const handleCopy = (key: ApiKey) => {
    navigator.clipboard.writeText(key.key);
    // You could add a toast notification here
    alert('API key copied to clipboard!');
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId))
    {
      newVisibleKeys.delete(keyId);
    } else
    {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim())
    {
      newErrors.name = 'API key name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try
    {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success)
      {
        setNewKey(data.data.key);
        setShowCreateModal(false);
        loadApiKeys(pagination.page, searchQuery);
      } else
      {
        console.error('Failed to create API key:', data.error);
        alert('Failed to create API key: ' + data.error);
      }
    } catch (error)
    {
      console.error('Error creating API key:', error);
      alert('Error creating API key');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingKey) return;

    try
    {
      const response = await fetch(`/api/keys?id=${deletingKey.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success)
      {
        setShowDeleteModal(false);
        setDeletingKey(null);
        loadApiKeys(pagination.page, searchQuery);
      } else
      {
        alert('Failed to delete API key: ' + data.error);
      }
    } catch (error)
    {
      console.error('Error deleting API key:', error);
      alert('Error deleting API key');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedKeys.length === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${selectedKeys.length} API keys?`);
    if (!confirmed) return;

    try
    {
      const deletePromises = selectedKeys.map(key =>
        fetch(`/api/keys?id=${key.id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      setSelectedKeys([]);
      loadApiKeys(pagination.page, searchQuery);
    } catch (error)
    {
      console.error('Error bulk deleting API keys:', error);
      alert('Error deleting API keys');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string, row: ApiKey) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">Created {new Date(row.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      key: 'key',
      label: 'API Key',
      sortable: false,
      render: (value: string, row: ApiKey) => {
        const isVisible = visibleKeys.has(row.id);
        const displayKey = isVisible ? value : value.substring(0, 8) + '...';

        return (
          <div className="flex items-center space-x-2">
            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
              {displayKey}
            </code>
            <button
              onClick={() => toggleKeyVisibility(row.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        );
      },
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      sortable: true,
      render: (value: string | null) => {
        if (!value) return <span className="text-gray-500">Never</span>;
        const date = new Date(value);
        const isExpired = date < new Date();
        return (
          <span className={isExpired ? 'text-red-600' : 'text-gray-900'}>
            {date.toLocaleDateString()}
            {isExpired && ' (Expired)'}
          </span>
        );
      },
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
      title="API Keys"
      description="Manage API keys for programmatic access"
      actions={
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate API Key
        </button>
      }
    >
      <DataTable
        data={apiKeys}
        columns={columns}
        loading={loading}
        searchable
        onSearch={handleSearch}
        selectable
        onSelectionChange={setSelectedKeys}
        bulkActions={bulkActions}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        onView={handleView}
        onDelete={handleDelete}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewKey(null);
        }}
        title="Generate New API Key"
        size="md"
      >
        {newKey ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">API Key Generated Successfully!</h4>
              <p className="text-sm text-green-700 mb-3">
                Please copy this API key now. You won't be able to see it again.
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm bg-white px-3 py-2 rounded border font-mono">
                  {newKey}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(newKey)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </button>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">Security Notice</h4>
              <p className="text-sm text-yellow-700">
                Store this API key securely. It provides full access to your invoice system.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="e.g., Production API, Development API"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty for no expiration
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowCreateModal(false);
              setNewKey(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {newKey ? 'Close' : 'Cancel'}
          </button>
          {!newKey && (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
            >
              Generate API Key
            </button>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingKey(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete API Key"
        message={`Are you sure you want to delete "${deletingKey?.name}"? This action cannot be undone and will immediately revoke access.`}
        confirmText="Delete"
        type="danger"
      />
    </ManagementLayout>
  );
}

