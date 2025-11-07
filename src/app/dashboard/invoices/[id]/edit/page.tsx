'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Send, Plus, Trash2 } from 'lucide-react';
import ManagementLayout from '@/components/layout/ManagementLayout';

interface Invoice {
  id: string;
  invoiceNumber?: string;
  docType: string;
  project: string;
  clientId: string;
  companyId: string;
  qty: number;
  rate: number;
  paid: number;
  discount: number;
  vat: number;
  fx: number;
  delivered: number;
  longDesc: string;
  params: string;
  etaDays: number;
  showVat: boolean;
  startDate: string;
  lockTotal: boolean;
  finalTotal: number;
  totalInclVat: boolean;
  logoW: string;
  client: { id: string; name: string };
  company: { id: string; name: string };
  tasks: Array<{
    id: string;
    name: string;
    dur: number;
    off: number;
    dependsOn?: string;
  }>;
  resources: Array<{
    id: string;
    type: string;
    hours: number;
    rate: number;
  }>;
}

interface Client {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState({
    docType: 'Invoice',
    selectedClient: '',
    selectedCompany: '',
    project: '',
    qty: 1,
    rate: 0,
    paid: 0,
    discount: 0,
    vat: 15,
    fx: 1,
    delivered: 0,
    longDesc: '',
    params: '',
    etaDays: 30,
    showVat: true,
    startDate: new Date().toISOString().split('T')[0],
    lockTotal: false,
    finalTotal: 0,
    totalInclVat: true,
    logoW: '560px',
    tasks: [] as Array<{ id: string; name: string; dur: number; off: number; dependsOn?: string }>,
    resources: [] as Array<{ id: string; type: string; hours: number; rate: number }>
  });

  // Load invoice data
  useEffect(() => {
    const loadInvoiceData = async () => {
      try
      {
        // Load invoice
        const invoiceResponse = await fetch(`/api/invoices/${invoiceId}`);
        const invoiceData = await invoiceResponse.json();

        if (invoiceData.success)
        {
          const inv = invoiceData.data;
          setInvoice(inv);
          setFormData({
            docType: inv.docType,
            selectedClient: inv.clientId,
            selectedCompany: inv.companyId,
            project: inv.project,
            qty: inv.qty,
            rate: inv.rate,
            paid: inv.paid,
            discount: inv.discount,
            vat: inv.vat,
            fx: inv.fx,
            delivered: inv.delivered || 0,
            longDesc: inv.longDesc,
            params: inv.params,
            etaDays: inv.etaDays,
            showVat: inv.showVat,
            startDate: inv.startDate.split('T')[0],
            lockTotal: inv.lockTotal,
            finalTotal: inv.finalTotal,
            totalInclVat: inv.totalInclVat,
            logoW: inv.logoW,
            tasks: inv.tasks || [],
            resources: inv.resources || []
          });
        }

        // Load clients and companies
        const [clientsResponse, companiesResponse] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/companies')
        ]);

        const [clientsData, companiesData] = await Promise.all([
          clientsResponse.json(),
          companiesResponse.json()
        ]);

        if (clientsData.success) setClients(clientsData.data);
        if (companiesData.success) setCompanies(companiesData.data);
      } catch (error)
      {
        console.error('Failed to load invoice data:', error);
      } finally
      {
        setIsLoading(false);
      }
    };

    loadInvoiceData();
  }, [invoiceId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field])
    {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      name: '',
      dur: 1,
      off: 0,
      dependsOn: ''
    };
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const updateTask = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) =>
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const addResource = () => {
    const newResource = {
      id: `resource-${Date.now()}`,
      type: '',
      hours: 1,
      rate: 0
    };
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, newResource]
    }));
  };

  const updateResource = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource
      )
    }));
  };

  const removeResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.selectedClient)
    {
      newErrors.selectedClient = 'Please select a client';
    }
    if (!formData.project.trim())
    {
      newErrors.project = 'Project name is required';
    }
    if (formData.rate <= 0)
    {
      newErrors.rate = 'Rate must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: 'DRAFT' | 'SENT') => {
    if (!validateForm()) return;

    setIsSaving(true);
    try
    {
      const response = await fetch(`/api/invoices?id=${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docType: formData.docType,
          project: formData.project,
          qty: formData.qty,
          rate: formData.rate,
          paid: formData.paid,
          discount: formData.discount,
          vat: formData.vat,
          fx: formData.fx,
          delivered: formData.delivered,
          longDesc: formData.longDesc,
          params: formData.params,
          etaDays: formData.etaDays,
          showVat: formData.showVat,
          startDate: formData.startDate,
          lockTotal: formData.lockTotal,
          finalTotal: formData.finalTotal,
          totalInclVat: formData.totalInclVat,
          logoW: formData.logoW,
          tasks: formData.tasks,
          resources: formData.resources
        }),
      });

      const result = await response.json();

      if (result.success)
      {
        router.push('/dashboard/invoices');
      } else
      {
        console.error('Failed to update invoice:', result.error);
        alert('Failed to update invoice: ' + result.error);
      }
    } catch (error)
    {
      console.error('Error updating invoice:', error);
      alert('Error updating invoice');
    } finally
    {
      setIsSaving(false);
    }
  };

  if (isLoading)
  {
    return (
      <ManagementLayout
        title="Edit Invoice"
        description="Loading invoice data..."
        actions={<div />}
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invoice...</p>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  if (!invoice)
  {
    return (
      <ManagementLayout
        title="Edit Invoice"
        description="Invoice not found"
        actions={<div />}
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h2>
            <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/dashboard/invoices')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout
      title="Edit Invoice"
      description={`Editing ${invoice.invoiceNumber || `INV-${invoice.id.slice(-8)}`} - ${invoice.project}`}
      actions={
        <div className="flex space-x-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('SENT')}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200 shadow-lg"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSaving ? 'Sending...' : 'Save & Send'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={formData.docType}
                    onChange={(e) => handleInputChange('docType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                  >
                    <option value="Invoice">Invoice</option>
                    <option value="Pro-Forma">Pro-Forma</option>
                    <option value="Waybill">Waybill</option>
                    <option value="Account Info">Account Info</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    value={formData.selectedClient}
                    onChange={(e) => handleInputChange('selectedClient', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 ${errors.selectedClient ? 'border-red-300' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {errors.selectedClient && (
                    <p className="mt-1 text-sm text-red-600">{errors.selectedClient}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => handleInputChange('project', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 ${errors.project ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Enter project name"
                  />
                  {errors.project && (
                    <p className="mt-1 text-sm text-red-600">{errors.project}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <select
                    value={formData.selectedCompany}
                    onChange={(e) => handleInputChange('selectedCompany', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.qty}
                    onChange={(e) => handleInputChange('qty', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 ${errors.rate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    step="0.01"
                  />
                  {errors.rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Paid ($)
                  </label>
                  <input
                    type="number"
                    value={formData.paid}
                    onChange={(e) => handleInputChange('paid', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VAT (%)
                  </label>
                  <input
                    type="number"
                    value={formData.vat}
                    onChange={(e) => handleInputChange('vat', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exchange Rate
                  </label>
                  <input
                    type="number"
                    value={formData.fx}
                    onChange={(e) => handleInputChange('fx', parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Description</h3>
              <textarea
                value={formData.longDesc}
                onChange={(e) => handleInputChange('longDesc', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                placeholder="Enter project description..."
              />
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
                <button
                  onClick={addTask}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </button>
              </div>
              <div className="space-y-3">
                {formData.tasks.map((task, index) => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(index, 'name', e.target.value)}
                        placeholder="Task name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <input
                        type="number"
                        value={task.dur}
                        onChange={(e) => updateTask(index, 'dur', parseInt(e.target.value) || 0)}
                        placeholder="Duration (days)"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <input
                        type="number"
                        value={task.off}
                        onChange={(e) => updateTask(index, 'off', parseInt(e.target.value) || 0)}
                        placeholder="Offset (days)"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <input
                        type="text"
                        value={task.dependsOn || ''}
                        onChange={(e) => updateTask(index, 'dependsOn', e.target.value)}
                        placeholder="Depends on"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <button
                      onClick={() => removeTask(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
                <button
                  onClick={addResource}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </button>
              </div>
              <div className="space-y-3">
                {formData.resources.map((resource, index) => (
                  <div key={resource.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={resource.type}
                        onChange={(e) => updateResource(index, 'type', e.target.value)}
                        placeholder="Resource type"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <input
                        type="number"
                        value={resource.hours}
                        onChange={(e) => updateResource(index, 'hours', parseInt(e.target.value) || 0)}
                        placeholder="Hours"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <input
                        type="number"
                        value={resource.rate}
                        onChange={(e) => updateResource(index, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="Rate per hour"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        step="0.01"
                      />
                    </div>
                    <button
                      onClick={() => removeResource(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${(formData.qty * formData.rate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount ({formData.discount}%):</span>
                  <span className="font-medium">-${((formData.qty * formData.rate) * formData.discount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT ({formData.vat}%):</span>
                  <span className="font-medium">${(((formData.qty * formData.rate) * (1 - formData.discount / 100)) * formData.vat / 100).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total:</span>
                    <span className="text-red-600">
                      ${((formData.qty * formData.rate) * (1 - formData.discount / 100) * (1 + formData.vat / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Amount Due:</span>
                  <span>
                    ${(((formData.qty * formData.rate) * (1 - formData.discount / 100) * (1 + formData.vat / 100)) - formData.paid).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
}
