import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, SlidersHorizontal, MapPin, Calendar, DollarSign,
  Building, Tag, ChevronDown, X, ExternalLink, Heart, Bookmark
} from 'lucide-react';

const GrantSearch = ({ onGrantSelect, businessPlanData }) => {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    categoryId: '',
    maxAmount: '',
    minAmount: '',
    deadline: '',
    agency: '',
    tags: [],
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [savedGrants, setSavedGrants] = useState(new Set());
  const [totalResults, setTotalResults] = useState(0);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      searchGrants();
    }, 300);

    setSearchTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [filters.searchTerm]);

  useEffect(() => {
    // Search immediately when filters change (except search term)
    searchGrants();
  }, [
    filters.categoryId,
    filters.maxAmount,
    filters.minAmount,
    filters.deadline,
    filters.agency,
    filters.sortBy,
    filters.sortOrder,
    filters.page
  ]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadCategories(),
        loadAgencies(),
        searchGrants()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadCategories = async () => {
    try {
      // Mock categories for now - in production, fetch from API
      setCategories([
        { id: '1', name: 'Federal', color_code: '#1F2937' },
        { id: '2', name: 'State', color_code: '#059669' },
        { id: '3', name: 'Technology', color_code: '#2563EB' },
        { id: '4', name: 'Small Business', color_code: '#7C2D12' },
        { id: '5', name: 'Research', color_code: '#5B21B6' }
      ]);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadAgencies = async () => {
    try {
      // Mock agencies - in production, fetch from grants data
      setAgencies([
        'Small Business Administration',
        'Department of Commerce',
        'USDA Rural Development',
        'National Science Foundation',
        'Department of Energy'
      ]);
    } catch (error) {
      console.error('Failed to load agencies:', error);
    }
  };

  const searchGrants = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              queryParams.append(key, value.join(','));
            }
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/grants?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setGrants(result.data.grants || []);
        setTotalResults(result.data.total || 0);
      } else {
        console.error('Search failed:', result.error);
        setGrants([]);
        setTotalResults(0);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setGrants([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 unless changing page
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      categoryId: '',
      maxAmount: '',
      minAmount: '',
      deadline: '',
      agency: '',
      tags: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      limit: 20
    });
  };

  const toggleSavedGrant = (grantId) => {
    setSavedGrants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(grantId)) {
        newSet.delete(grantId);
      } else {
        newSet.add(grantId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getMatchScore = (grant) => {
    if (!businessPlanData) return null;

    let score = 0;
    let maxScore = 0;

    // Industry match
    if (grant.industry_focus && businessPlanData.industry) {
      maxScore += 30;
      if (grant.industry_focus.some(industry =>
        businessPlanData.industry.toLowerCase().includes(industry.toLowerCase())
      )) {
        score += 30;
      }
    }

    // Funding amount match
    if (grant.max_amount && businessPlanData.fundingAmount) {
      maxScore += 25;
      if (businessPlanData.fundingAmount <= grant.max_amount) {
        score += 25;
      }
    }

    // Business stage match
    if (grant.business_stages && businessPlanData.businessStage) {
      maxScore += 20;
      if (grant.business_stages.includes(businessPlanData.businessStage)) {
        score += 20;
      }
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : null;
  };

  const GrantCard = ({ grant }) => {
    const matchScore = getMatchScore(grant);
    const isSaved = savedGrants.has(grant.id);

    return (
      <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {grant.title}
              </h3>
              {matchScore && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  matchScore >= 80 ? 'bg-green-100 text-green-800' :
                  matchScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {matchScore}% match
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {grant.description || grant.summary}
            </p>
          </div>

          <button
            onClick={() => toggleSavedGrant(grant.id)}
            className={`ml-3 p-2 rounded-full transition-colors ${
              isSaved
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-4 h-4 mr-2" />
            {grant.agency}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            {grant.min_amount && grant.max_amount
              ? `${formatCurrency(grant.min_amount)} - ${formatCurrency(grant.max_amount)}`
              : formatCurrency(grant.max_amount)
            }
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            Deadline: {formatDate(grant.application_deadline)}
          </div>
        </div>

        {grant.tags && grant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {grant.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
            {grant.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{grant.tags.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            grant.competitiveness_level === 'high' ? 'bg-red-100 text-red-800' :
            grant.competitiveness_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {grant.competitiveness_level || 'medium'} competition
          </span>

          <div className="flex space-x-2">
            {grant.application_url && (
              <a
                href={grant.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                Apply
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            )}
            <button
              onClick={() => onGrantSelect && onGrantSelect(grant)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Select for Matching
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search grants by title, description, or agency..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
              showFilters
                ? 'border-blue-500 text-blue-700 bg-blue-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {Object.values(filters).some(v => v && v !== '' && (!Array.isArray(v) || v.length > 0)) && (
              <span className="ml-2 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                !
              </span>
            )}
          </button>

          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => updateFilter('categoryId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
              <select
                value={filters.agency}
                onChange={(e) => updateFilter('agency', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Agencies</option>
                {agencies.map((agency) => (
                  <option key={agency} value={agency}>
                    {agency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                placeholder="Maximum funding"
                value={filters.maxAmount}
                onChange={(e) => updateFilter('maxAmount', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                placeholder="Minimum funding"
                value={filters.minAmount}
                onChange={(e) => updateFilter('minAmount', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline After</label>
              <input
                type="date"
                value={filters.deadline}
                onChange={(e) => updateFilter('deadline', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  updateFilter('sortBy', sortBy);
                  updateFilter('sortOrder', sortOrder);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at_desc">Newest First</option>
                <option value="application_deadline_asc">Deadline (Soonest)</option>
                <option value="max_amount_desc">Highest Amount</option>
                <option value="max_amount_asc">Lowest Amount</option>
                <option value="title_asc">Title A-Z</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {loading ? 'Searching...' : `${totalResults} grants found`}
          {businessPlanData && ' (showing match scores)'}
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={filters.limit}
            onChange={(e) => updateFilter('limit', parseInt(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Searching grants...</span>
        </div>
      ) : (
        <div className="grid gap-6">
          {grants.map((grant) => (
            <GrantCard key={grant.id} grant={grant} />
          ))}

          {grants.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No grants found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalResults > filters.limit && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
            disabled={filters.page <= 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="px-3 py-2 text-sm text-gray-600">
            Page {filters.page} of {Math.ceil(totalResults / filters.limit)}
          </span>

          <button
            onClick={() => updateFilter('page', filters.page + 1)}
            disabled={filters.page >= Math.ceil(totalResults / filters.limit)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default GrantSearch;