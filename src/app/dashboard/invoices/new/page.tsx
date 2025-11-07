'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Eye, Plus, Trash2 } from 'lucide-react';
import { InvoiceData, Client, Company, FinancialSummary } from '@/lib/types';
import { calculateFinancialSummarySync } from '@/lib/calculations';
import ManagementLayout from '@/components/layout/ManagementLayout';
import InvoiceExchangeRateSelector from '@/components/ui/InvoiceExchangeRateSelector';

export default function NewInvoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<InvoiceData>({
    docType: 'Invoice',
    selectedClient: '',
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
    etaDays: 90,
    showVat: true,
    startDate: new Date().toISOString().split('T')[0],
    lockTotal: false,
    finalTotal: 0,
    totalInclVat: true,
    logoW: '560px',
    tasks: [],
    resources: []
  });

  // Exchange rate state
  const [invoiceCurrency, setInvoiceCurrency] = useState('USD');
  const [selectedExchangeRateId, setSelectedExchangeRateId] = useState('');
  const [selectedExchangeRateCompany, setSelectedExchangeRateCompany] = useState('');

  const [financial, setFinancial] = useState<FinancialSummary>({
    subtotal: 0,
    discountAmount: 0,
    vatAmount: 0,
    total: 0,
    totalWithVat: 0,
    amountDue: 0
  });

  // Load clients and companies
  useEffect(() => {
    const loadData = async () => {
      try
      {
        const [clientsRes, companiesRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/companies')
        ]);

        const clientsData = await clientsRes.json();
        const companiesData = await companiesRes.json();

        if (clientsData.success)
        {
          setClients(clientsData.data.clients);
        }
        if (companiesData.success)
        {
          setCompanies(companiesData.data.companies);
        }
      } catch (error)
      {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  // Recalculate financial summary when form data changes
  useEffect(() => {
    const summary = calculateFinancialSummarySync(formData);
    setFinancial(summary);
    setFormData(prev => ({ ...prev, finalTotal: summary.totalWithVat }));
  }, [formData.qty, formData.rate, formData.discount, formData.vat, formData.paid, formData.fx]);

  const handleInputChange = (field: keyof InvoiceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field])
    {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Exchange rate handlers
  const handleExchangeRateChange = (rate: number, rateId: string, company: string) => {
    setFormData(prev => ({ ...prev, fx: rate }));
    setSelectedExchangeRateId(rateId);
    setSelectedExchangeRateCompany(company);
  };

  const handleCurrencyChange = (fromCurrency: string, toCurrency: string) => {
    setInvoiceCurrency(fromCurrency);
    // Reset exchange rate when currency changes
    setSelectedExchangeRateId('');
    setSelectedExchangeRateCompany('');
    setFormData(prev => ({ ...prev, fx: 1 })); // Reset to default
  };

  const addTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      name: '',
      dur: 1,
      off: 0,
      dependsOn: undefined
    };
    setFormData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
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
      hours: 0,
      rate: 0
    };
    setFormData(prev => ({ ...prev, resources: [...(prev.resources || []), newResource] }));
  };

  const updateResource = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources?.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource
      ) || []
    }));
  };

  const removeResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources?.filter((_, i) => i !== index) || []
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
      // Prepare the data in the format expected by the API
      const invoiceData = {
        docType: formData.docType,
        selectedClient: formData.selectedClient,
        companyId: formData.selectedCompany,
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
        resources: formData.resources,
        // Exchange rate information
        invoiceCurrency: invoiceCurrency,
        exchangeRateId: selectedExchangeRateId,
        exchangeRateCompany: selectedExchangeRateCompany
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (result.success)
      {
        router.push('/dashboard');
      } else
      {
        console.error('Failed to save invoice:', result.error);
        alert('Failed to save invoice: ' + result.error);
      }
    } catch (error)
    {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice');
    } finally
    {
      setIsSaving(false);
    }
  };

  return (
    <ManagementLayout
      title="Create Invoice"
      description="Fill in the details below to create a new invoice"
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
            {isSaving ? 'Sending...' : 'Send Invoice'}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.selectedClient ? 'border-red-300' : 'border-gray-300'
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => handleInputChange('project', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.project ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Enter project name"
                  />
                  {errors.project && (
                    <p className="mt-1 text-sm text-red-600">{errors.project}</p>
                  )}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${errors.rate ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VAT (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vat}
                    onChange={(e) => handleInputChange('vat', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.paid}
                    onChange={(e) => handleInputChange('paid', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

              </div>
            </div>

            {/* Exchange Rate Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Currency & Exchange Rate</h3>
              <InvoiceExchangeRateSelector
                fromCurrency={invoiceCurrency}
                toCurrency="GHS"
                selectedRate={formData.fx}
                onRateChange={handleExchangeRateChange}
                onCurrencyChange={handleCurrencyChange}
              />
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Description</h3>
              <textarea
                value={formData.longDesc}
                onChange={(e) => handleInputChange('longDesc', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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
                  <div key={task.id} className="flex space-x-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Task Name
                      </label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="Enter task name"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <input
                        type="number"
                        value={task.dur}
                        onChange={(e) => updateTask(index, 'dur', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Offset
                      </label>
                      <input
                        type="number"
                        value={task.off}
                        onChange={(e) => updateTask(index, 'off', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => removeTask(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                {formData.resources?.map((resource, index) => (
                  <div key={resource.id} className="flex space-x-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource Type
                      </label>
                      <input
                        type="text"
                        value={resource.type}
                        onChange={(e) => updateResource(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="e.g., Developer, Designer"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hours
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={resource.hours}
                        onChange={(e) => updateResource(index, 'hours', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={resource.rate}
                        onChange={(e) => updateResource(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => removeResource(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

              {/* Currency Information */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Currency Information</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Invoice Currency:</span>
                    <span className="font-medium">{invoiceCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Exchange Rate:</span>
                    <span className="font-medium">{formData.fx.toFixed(4)} {invoiceCurrency}/GHS</span>
                  </div>
                  {selectedExchangeRateCompany && (
                    <div className="flex justify-between text-sm">
                      <span>Rate Source:</span>
                      <span className="font-medium text-blue-600">{selectedExchangeRateCompany}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{invoiceCurrency} {financial.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-{invoiceCurrency} {financial.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT ({formData.vat}%):</span>
                  <span className="font-medium">{invoiceCurrency} {financial.vatAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total ({invoiceCurrency}):</span>
                    <span className="text-red-600">{invoiceCurrency} {financial.totalWithVat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Total (GHS):</span>
                    <span className="font-medium">GHS {(financial.totalWithVat * formData.fx).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Amount Due ({invoiceCurrency}):</span>
                  <span>{invoiceCurrency} {financial.amountDue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Amount Due (GHS):</span>
                  <span className="font-medium">GHS {(financial.amountDue * formData.fx).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagementLayout>
  );
}
