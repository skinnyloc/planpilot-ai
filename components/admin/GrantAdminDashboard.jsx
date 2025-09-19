import React, { useState, useEffect } from 'react';
import {
  Database, RefreshCw, Plus, Search, Filter, Download, Upload,
  CheckCircle, XCircle, Clock, AlertTriangle, Settings, BarChart3
} from 'lucide-react';

const GrantAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [grants, setGrants] = useState([]);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    pending: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load grants and stats
      await Promise.all([
        loadGrants(),
        loadStats(),
        loadUpdateStatus()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGrants = async () => {
    try {
      const response = await fetch('/api/grants?limit=100');
      const result = await response.json();

      if (result.success) {
        setGrants(result.data.grants || []);
      }
    } catch (error) {
      console.error('Failed to load grants:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from grants data
      const response = await fetch('/api/grants?limit=1000');
      const result = await response.json();

      if (result.success) {
        const allGrants = result.data.grants || [];
        const newStats = {
          total: allGrants.length,
          active: allGrants.filter(g => g.status === 'active').length,
          expired: allGrants.filter(g => g.status === 'expired').length,
          pending: allGrants.filter(g => g.verification_status === 'needs_review').length
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUpdateStatus = async () => {
    try {
      const response = await fetch('/api/grants/update');
      const result = await response.json();

      if (result.success) {
        setUpdateStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load update status:', error);
    }
  };

  const triggerUpdate = async (type = 'full') => {
    try {
      setLoading(true);

      const response = await fetch('/api/grants/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, manual: true })
      });

      const result = await response.json();

      if (result.success) {
        alert(`${type} update started successfully`);
        await loadUpdateStatus();
      } else {
        alert(`Update failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Update trigger failed:', error);
      alert('Failed to trigger update');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`w-8 h-8 text-${color}-600`} />
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Grants" value={stats.total} icon={Database} />
        <StatCard title="Active Grants" value={stats.active} icon={CheckCircle} color="green" />
        <StatCard title="Expired Grants" value={stats.expired} icon={XCircle} color="red" />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="yellow" />
      </div>

      {/* Update Status */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Update System Status</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => triggerUpdate('quick')}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Quick Update
            </button>
            <button
              onClick={() => triggerUpdate('full')}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Full Update
            </button>
          </div>
        </div>

        {updateStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">System Status</p>
              <p className={`font-medium ${updateStatus.isRunning ? 'text-green-600' : 'text-gray-900'}`}>
                {updateStatus.isRunning ? 'Running' : 'Stopped'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Updates</p>
              <p className="font-medium">{updateStatus.activeUpdates?.length || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">Recent Grant Activity</h3>
        <div className="space-y-3">
          {grants.slice(0, 5).map((grant) => (
            <div key={grant.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{grant.title}</p>
                <p className="text-sm text-gray-600">{grant.agency}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  grant.status === 'active' ? 'bg-green-100 text-green-800' :
                  grant.status === 'expired' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {grant.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const GrantsTab = () => (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search grants..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <div className="flex space-x-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Grant
          </button>
        </div>
      </div>

      {/* Grants Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grants.map((grant) => (
                <tr key={grant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{grant.title}</div>
                      <div className="text-sm text-gray-500">{grant.grant_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{grant.agency}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {grant.max_amount ? `$${grant.max_amount.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {grant.application_deadline ?
                      new Date(grant.application_deadline).toLocaleDateString() : 'N/A'
                    }
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      grant.status === 'active' ? 'bg-green-100 text-green-800' :
                      grant.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {grant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'grants', name: 'Manage Grants', icon: Database },
    { id: 'sources', name: 'Data Sources', icon: RefreshCw },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">Grant Admin Dashboard</h1>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'grants' && <GrantsTab />}
        {activeTab === 'sources' && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Data Sources Management</h3>
            <p className="text-gray-600">Configure and monitor grant data sources</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-600">Configure update schedules and system preferences</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrantAdminDashboard;