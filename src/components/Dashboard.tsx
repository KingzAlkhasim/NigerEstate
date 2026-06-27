import { useEffect, useState } from 'react';
import { supabase, Property, Client } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

type StatCard = {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  color: string;
};

export function Dashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const [{ data: propertiesData }, { data: clientsData }] = await Promise.all([
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
      ]);

      if (propertiesData) setProperties(propertiesData);
      if (clientsData) setClients(clientsData);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const totalPropertyValue = properties
    .filter((p) => p.status === 'available')
    .reduce((sum, p) => sum + p.price, 0);

  const soldProperties = properties.filter((p) => p.status === 'sold');
  const totalSoldValue = soldProperties.reduce((sum, p) => sum + p.price, 0);

  const stats: StatCard[] = [
    {
      title: 'Total Properties',
      value: properties.length,
      icon: <Building2 className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Active Clients',
      value: clients.filter((c) => c.status !== 'closed' && c.status !== 'lost').length,
      icon: <Users className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Available Listings Value',
      value: `₦${(totalPropertyValue / 1000000).toFixed(1)}M`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Sold Properties Value',
      value: `₦${(totalSoldValue / 1000000).toFixed(1)}M`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-rose-500 to-pink-600',
    },
  ];

  const recentProperties = properties.slice(0, 5);
  const recentClients = clients.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's your real estate overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}
              >
                {stat.icon}
              </div>
            </div>
            {stat.change !== undefined && (
              <div className="flex items-center gap-1 mt-4 text-sm">
                {stat.change >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">+{stat.change}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-medium">{stat.change}%</span>
                  </>
                )}
                <span className="text-slate-400 ml-1">vs last month</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Feature Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Description Generator</h3>
              <p className="text-sm text-slate-400">Powered by advanced language models</p>
            </div>
          </div>
          <p className="text-slate-300">
            Generate compelling property descriptions instantly. Add a new property and let AI create professional
            listings tailored to the Nigerian real estate market.
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Properties */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Recent Properties</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentProperties.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No properties yet. Add your first property!
              </div>
            ) : (
              recentProperties.map((property) => (
                <div key={property.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{property.title}</p>
                    <p className="text-sm text-slate-500 truncate">{property.location}, {property.city}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">
                      ₦{(property.price / 1000000).toFixed(1)}M
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        property.status === 'available'
                          ? 'bg-emerald-100 text-emerald-700'
                          : property.status === 'sold'
                          ? 'bg-blue-100 text-blue-700'
                          : property.status === 'under_contract'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {property.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Clients */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Recent Clients</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentClients.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No clients yet. Add your first client!
              </div>
            ) : (
              recentClients.map((client) => (
                <div key={client.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {client.full_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{client.full_name}</p>
                    <p className="text-sm text-slate-500 truncate">{client.phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {client.budget_max && (
                      <p className="text-sm font-medium text-slate-700">
                        ₦{(client.budget_max / 1000000).toFixed(1)}M
                      </p>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        client.status === 'new'
                          ? 'bg-blue-100 text-blue-700'
                          : client.status === 'negotiating'
                          ? 'bg-amber-100 text-amber-700'
                          : client.status === 'qualified'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
