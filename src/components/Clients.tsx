import { useEffect, useState } from 'react';
import { supabase, Client, Property } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Building2,
  MoreVertical,
  Trash2,
  Edit,
  X,
  DollarSign,
  Link2,
  Users,
} from 'lucide-react';

const clientStatuses = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-slate-100 text-slate-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-amber-100 text-amber-700' },
  { value: 'closed', label: 'Closed', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
];

const propertyTypePreferences = [
  'Apartment', 'House', 'Land', 'Commercial', 'Duplex', 'Townhouse', 'Villa', 'Office',
];

export function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    status: 'new' as Client['status'],
    budget_min: '',
    budget_max: '',
    currency: 'NGN',
    preferred_locations: [] as string[],
    preferred_property_types: [] as string[],
    notes: '',
  });

  const [linkData, setLinkData] = useState({
    property_id: '',
    interest_level: 'medium' as 'low' | 'medium' | 'high' | 'very_high',
    notes: '',
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  async function fetchData() {
    const [{ data: clientsData }, { data: propertiesData }] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, title, city, price, status').order('created_at', { ascending: false }),
    ]);
    if (clientsData) setClients(clientsData);
    if (propertiesData) setProperties(propertiesData);
    setLoading(false);
  }

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  function resetForm() {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      status: 'new',
      budget_min: '',
      budget_max: '',
      currency: 'NGN',
      preferred_locations: [],
      preferred_property_types: [],
      notes: '',
    });
    setEditingClient(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const clientData = {
      full_name: formData.full_name,
      email: formData.email || null,
      phone: formData.phone,
      status: formData.status,
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      currency: formData.currency,
      preferred_locations: formData.preferred_locations.length > 0 ? formData.preferred_locations : null,
      preferred_property_types: formData.preferred_property_types.length > 0 ? formData.preferred_property_types : null,
      notes: formData.notes || null,
    };

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', editingClient.id);
      if (!error) {
        fetchData();
        setShowModal(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('clients').insert(clientData);
      if (!error) {
        fetchData();
        setShowModal(false);
        resetForm();
      }
    }
  }

  function handleEdit(client: Client) {
    setEditingClient(client);
    setFormData({
      full_name: client.full_name,
      email: client.email || '',
      phone: client.phone,
      status: client.status,
      budget_min: client.budget_min?.toString() || '',
      budget_max: client.budget_max?.toString() || '',
      currency: client.currency,
      preferred_locations: client.preferred_locations || [],
      preferred_property_types: client.preferred_property_types || [],
      notes: client.notes || '',
    });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this client?')) return;
    await supabase.from('clients').delete().eq('id', id);
    fetchData();
  }

  function handleLinkProperty(clientId: string) {
    setSelectedClientId(clientId);
    setLinkData({ property_id: '', interest_level: 'medium', notes: '' });
    setShowLinkModal(true);
  }

  async function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId || !linkData.property_id) return;

    const { error } = await supabase.from('property_clients').insert({
      property_id: linkData.property_id,
      client_id: selectedClientId,
      interest_level: linkData.interest_level,
      notes: linkData.notes || null,
    });

    if (!error) {
      setShowLinkModal(false);
      setSelectedClientId(null);
    }
  }

  function toggleLocation(location: string) {
    setFormData((prev) => ({
      ...prev,
      preferred_locations: prev.preferred_locations.includes(location)
        ? prev.preferred_locations.filter((l) => l !== location)
        : [...prev.preferred_locations, location],
    }));
  }

  function togglePropertyType(type: string) {
    setFormData((prev) => ({
      ...prev,
      preferred_property_types: prev.preferred_property_types.includes(type)
        ? prev.preferred_property_types.filter((t) => t !== type)
        : [...prev.preferred_property_types, type],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Manage your client relationships</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {clientStatuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No clients found</h3>
            <p className="text-slate-500">Add your first client to get started</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-lg">
                      {client.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{client.full_name}</h3>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        clientStatuses.find((s) => s.value === client.status)?.color
                      }`}>
                        {clientStatuses.find((s) => s.value === client.status)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.budget_max && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span>
                        Budget: ₦{((client.budget_min || 0) / 1000000).toFixed(0)}M - ₦{(client.budget_max / 1000000).toFixed(0)}M
                      </span>
                    </div>
                  )}
                </div>

                {client.preferred_locations && client.preferred_locations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {client.preferred_locations.slice(0, 3).map((loc) => (
                      <span
                        key={loc}
                        className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md"
                      >
                        {loc}
                      </span>
                    ))}
                    {client.preferred_locations.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        +{client.preferred_locations.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleLinkProperty(client.id)}
                    className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Link2 className="w-4 h-4" />
                    Link Property
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Chukwuemeka Obi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., +234 801 234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., client@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Client['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {clientStatuses.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Budget (NGN)</label>
                  <input
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 50000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Budget (NGN)</label>
                  <input
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 150000000"
                  />
                </div>
              </div>

              {/* Preferred Locations */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Locations</label>
                <div className="flex flex-wrap gap-2">
                  {['Lekki', 'Victoria Island', 'Ikoyi', 'Ikeja', 'Ajah', 'Ibeju-Lekki', 'Yaba', 'Surulere'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                        formData.preferred_locations.includes(loc)
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Property Types */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Property Types</label>
                <div className="flex flex-wrap gap-2">
                  {propertyTypePreferences.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => togglePropertyType(type)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                        formData.preferred_property_types.includes(type)
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Add notes about this client..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
                >
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Property Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Link Property</h2>
              <button
                onClick={() => setShowLinkModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Property</label>
                <select
                  value={linkData.property_id}
                  onChange={(e) => setLinkData({ ...linkData, property_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Choose a property...</option>
                  {properties.filter(p => p.status === 'available').map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} - ₦{(p.price / 1000000).toFixed(1)}M ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interest Level</label>
                <select
                  value={linkData.interest_level}
                  onChange={(e) => setLinkData({ ...linkData, interest_level: e.target.value as 'low' | 'medium' | 'high' | 'very_high' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={linkData.notes}
                  onChange={(e) => setLinkData({ ...linkData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Add notes about this match..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
                >
                  Link Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
