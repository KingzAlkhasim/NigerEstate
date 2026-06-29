import { useEffect, useState } from 'react';
import { supabase, Property } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Bed,
  Bath,
  Car,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Edit,
  X,
  Loader2,
} from 'lucide-react';

const propertyTypes = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'villa', label: 'Villa' },
  { value: 'office', label: 'Office Space' },
];

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  { value: 'available', label: 'Available', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'under_contract', label: 'Under Contract', color: 'bg-amber-100 text-amber-700' },
  { value: 'sold', label: 'Sold', color: 'bg-blue-100 text-blue-700' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-red-100 text-red-700' },
];

const commonFeatures = [
  '24/7 Security', 'Swimming Pool', 'Gym', 'Garden', 'Balcony', 'AC',
  'Furnished', 'Borehole', 'Generator', 'Fenced', 'Interlocked',
  'BQ', 'Janitor Services', 'CCTV', 'Solar Panels',
];

export function Properties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    property_type: 'apartment' as Property['property_type'],
    status: 'draft' as Property['status'],
    price: '',
    currency: 'NGN',
    location: '',
    city: 'Lagos',
    state: 'Lagos',
    bedrooms: '',
    bathrooms: '',
    parking_spaces: '',
    land_size_sqm: '',
    built_area_sqm: '',
    features: [] as string[],
    description: '',
  });

  useEffect(() => {
    if (!user) return;
    fetchProperties();
  }, [user]);

  async function fetchProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProperties(data);
    }
    setLoading(false);
  }

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  function resetForm() {
    setFormData({
      title: '',
      property_type: 'apartment',
      status: 'draft',
      price: '',
      currency: 'NGN',
      location: '',
      city: 'Lagos',
      state: 'Lagos',
      bedrooms: '',
      bathrooms: '',
      parking_spaces: '',
      land_size_sqm: '',
      built_area_sqm: '',
      features: [],
      description: '',
    });
    setEditingProperty(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const propertyData = {
      title: formData.title,
      property_type: formData.property_type,
      status: formData.status,
      price: parseFloat(formData.price) || 0,
      currency: formData.currency,
      location: formData.location,
      city: formData.city,
      state: formData.state,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
      land_size_sqm: formData.land_size_sqm ? parseFloat(formData.land_size_sqm) : null,
      built_area_sqm: formData.built_area_sqm ? parseFloat(formData.built_area_sqm) : null,
      features: formData.features.length > 0 ? formData.features : null,
      description: formData.description || null,
    };

    if (editingProperty) {
      const { error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', editingProperty.id);
      if (!error) {
        fetchProperties();
        setShowModal(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('properties').insert(propertyData);
      if (!error) {
        fetchProperties();
        setShowModal(false);
        resetForm();
      }
    }
  }

  function handleEdit(property: Property) {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      property_type: property.property_type,
      status: property.status,
      price: property.price.toString(),
      currency: property.currency,
      location: property.location,
      city: property.city,
      state: property.state,
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      parking_spaces: property.parking_spaces?.toString() || '',
      land_size_sqm: property.land_size_sqm?.toString() || '',
      built_area_sqm: property.built_area_sqm?.toString() || '',
      features: property.features || [],
      description: property.description || '',
    });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this property?')) return;
    await supabase.from('properties').delete().eq('id', id);
    fetchProperties();
  }

  async function generateDescription() {
    setGeneratingDescription(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert('Missing Gemini API Key in environment variables.');
        setGeneratingDescription(false);
        return;
      }

      const promptText = `You are an expert real estate copywriter specializing in the Nigerian property market. 
Write a compelling, professional description for a property with the following details:
Title: ${formData.title || 'New Property'}
Property Type: ${formData.property_type}
Location: ${formData.location || 'Prime Location'}, ${formData.city}, ${formData.state}
Price: ₦${(parseFloat(formData.price) || 0).toLocaleString()}
Bedrooms: ${formData.bedrooms || 'N/A'}
Bathrooms: ${formData.bathrooms || 'N/A'}
Amenities/Features: ${formData.features.join(', ') || 'Standard amenities'}

Make it sound premium, appealing to buyers/renters, and format it cleanly with paragraphs or bullet points where appropriate. Keep it concise.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          }),
        }
      );

      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        setGeneratedDescription(text);
        setFormData(prev => ({ ...prev, description: text }));
      } else {
        alert('Failed to extract text from AI response. Check your API dashboard configurations.');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      alert('AI Error: ' + (error instanceof Error ? error.message : String(error)));
    }
    setGeneratingDescription(false);
  }

  async function generateForExisting(property: Property) {
    setActivePropertyId(property.id);
    setGeneratingDescription(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert('Missing Gemini API Key.');
        setGeneratingDescription(false);
        setActivePropertyId(null);
        return;
      }

      const promptText = `You are an expert real estate copywriter specializing in the Nigerian property market. 
Write a compelling, professional description for a property with the following details:
Title: ${property.title}
Property Type: ${property.property_type}
Location: ${property.location}, ${property.city}, ${property.state}
Price: ₦${property.price.toLocaleString()}
Bedrooms: ${property.bedrooms || 'N/A'}
Bathrooms: ${property.bathrooms || 'N/A'}
Amenities/Features: ${property.features?.join(', ') || 'Standard amenities'}

Make it sound premium and format it cleanly.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          }),
        }
      );

      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text;
        await supabase
          .from('properties')
          .update({ description: text })
          .eq('id', property.id);
        setGeneratedDescription(text);
        setShowDescriptionModal(true);
        fetchProperties();
      } else {
        alert('Failed to extract text from AI response.');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      alert('AI Error: ' + (error instanceof Error ? error.message : String(error)));
    }
    setGeneratingDescription(false);
    setActivePropertyId(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleFeature(feature: string) {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
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
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 mt-1">Manage your real estate listings</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Property
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search properties..."
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
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProperties.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-500">Add your first property to get started</p>
          </div>
        ) : (
          filteredProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group"
            >
              <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative">
                {property.images && property.images[0] ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <span className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full ${
                  statusOptions.find((s) => s.value === property.status)?.color
                }`}>
                  {statusOptions.find((s) => s.value === property.status)?.label}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-slate-900 truncate">{property.title}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{property.location}, {property.city}</span>
                </div>

                <div className="flex items-center gap-3 mt-3 text-sm text-slate-600">
                  {property.bedrooms !== null && (
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> {property.bedrooms}
                    </span>
                  )}
                  {property.bathrooms !== null && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" /> {property.bathrooms}
                    </span>
                  )}
                  {property.parking_spaces !== null && (
                    <span className="flex items-center gap-1">
                      <Car className="w-4 h-4" /> {property.parking_spaces}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <p className="text-lg font-bold text-slate-900">
                    ₦{(property.price / 1000000).toFixed(1)}M
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateForExisting(property)}
                      disabled={generatingDescription && activePropertyId === property.id}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Generate AI Description"
                    >
                      {generatingDescription && activePropertyId === property.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(property)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(property.id)}
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

      {/* Add/Edit Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 4 Bedroom Duplex in Lekki Phase 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Property Type *</label>
                  <select
                    value={formData.property_type}
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value as Property['property_type'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {propertyTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Property['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (NGN) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 150000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Lekki Phase 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Lagos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Lagos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parking Spaces</label>
                  <input
                    type="number"
                    value={formData.parking_spaces}
                    onChange={(e) => setFormData({ ...formData, parking_spaces: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Land Size (sqm)</label>
                  <input
                    type="number"
                    value={formData.land_size_sqm}
                    onChange={(e) => setFormData({ ...formData, land_size_sqm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 650"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Built Area (sqm)</label>
                  <input
                    type="number"
                    value={formData.built_area_sqm}
                    onChange={(e) => setFormData({ ...formData, built_area_sqm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 450"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Features</label>
                <div className="flex flex-wrap gap-2">
                  {commonFeatures.map((feature) => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                        formData.features.includes(feature)
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Description Generator */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-slate-900">AI Description Generator</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateDescription}
                    disabled={!formData.title || !formData.location || generatingDescription}
                    className="px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {generatingDescription ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>
                {generatedDescription && (
                  <div className="bg-white rounded-lg p-3 text-sm text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {generatedDescription}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Add a property description..."
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
                  {editingProperty ? 'Update Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold text-slate-900">AI Generated Description</h2>
              </div>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 rounded-xl p-5 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {generatedDescription}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDescriptionModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    copyToClipboard(generatedDescription);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Description'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
