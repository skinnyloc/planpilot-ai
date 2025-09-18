'use client';

import { useState } from 'react';
import { Search, Calendar, Eye, ChevronDown } from 'lucide-react';

export default function GrantsPage() {
  const [activeTab, setActiveTab] = useState('this-month');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    eligibility: '',
    date: ''
  });

  const sampleGrants = {
    'this-month': [
      {
        id: 1,
        title: 'Small Business Innovation Research (SBIR)',
        agency: 'National Science Foundation',
        awardRange: '$50,000 - $500,000',
        dueDate: '2024-09-30',
        description: 'Funding for innovative research and development in high-tech fields',
        url: 'https://www.sbir.gov/'
      },
      {
        id: 2,
        title: 'Minority Business Development Agency Grant',
        agency: 'U.S. Department of Commerce',
        awardRange: '$25,000 - $150,000',
        dueDate: '2024-09-25',
        description: 'Support for minority-owned business enterprises',
        url: 'https://www.mbda.gov/grants'
      },
      {
        id: 3,
        title: 'Rural Business Development Grant',
        agency: 'USDA Rural Development',
        awardRange: '$10,000 - $75,000',
        dueDate: '2024-09-28',
        description: 'Funding for businesses in rural communities',
        url: 'https://www.rd.usda.gov/programs-services/business-programs'
      }
    ],
    'next-month': [
      {
        id: 4,
        title: 'Clean Energy Business Grant',
        agency: 'Department of Energy',
        awardRange: '$100,000 - $1,000,000',
        dueDate: '2024-10-15',
        description: 'Support for renewable energy and clean technology businesses',
        url: 'https://www.energy.gov/eere/funding/funding-opportunities'
      },
      {
        id: 5,
        title: 'Women-Owned Small Business Grant',
        agency: 'Small Business Administration',
        awardRange: '$15,000 - $100,000',
        dueDate: '2024-10-22',
        description: 'Funding opportunities for women entrepreneurs',
        url: 'https://www.sba.gov/funding-programs/grants'
      },
      {
        id: 6,
        title: 'Technology Commercialization Grant',
        agency: 'National Institute of Standards',
        awardRange: '$75,000 - $300,000',
        dueDate: '2024-10-31',
        description: 'Support for bringing innovative technologies to market',
        url: 'https://www.nist.gov/tpo/small-business-innovation-research-program'
      }
    ]
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const currentGrants = sampleGrants[activeTab] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Grant Directory</h1>
        <p className="text-muted-foreground">
          Discover funding opportunities for your business ventures.
        </p>
      </div>

      {/* Filters Row */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search grants..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              >
                <option value="">All Categories</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="agriculture">Agriculture</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="clean-energy">Clean Energy</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Eligibility Select */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Eligibility</label>
            <div className="relative">
              <select
                value={filters.eligibility}
                onChange={(e) => handleFilterChange('eligibility', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring pr-10"
              >
                <option value="">All Eligible</option>
                <option value="small-business">Small Business</option>
                <option value="minority-owned">Minority-Owned</option>
                <option value="women-owned">Women-Owned</option>
                <option value="rural">Rural Business</option>
                <option value="startup">Startup</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('this-month')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'this-month'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setActiveTab('next-month')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'next-month'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Next Month
          </button>
        </nav>
      </div>

      {/* Grants List */}
      <div className="space-y-4">
        {currentGrants.map((grant) => (
          <div key={grant.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {grant.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {grant.description}
                </p>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Agency:</span>
                    <span className="text-muted-foreground ml-1">{grant.agency}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Award Range:</span>
                    <span className="text-muted-foreground ml-1">{grant.awardRange}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Due Date:</span>
                    <span className="text-muted-foreground ml-1">{grant.dueDate}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.open(grant.url, '_blank')}
                className="ml-4 inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}