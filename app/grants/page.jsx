'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, AlertCircle, CalendarIcon, RefreshCw, ExternalLink } from 'lucide-react';

const GrantCard = ({ grant }) => (
    <div style={{
        backgroundColor: '#000',
        border: '1px solid #f59e0b',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px'
    }}>
        <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#fafafa',
            marginBottom: '8px'
        }}>
            {grant.title}
        </h3>
        <p style={{
            fontSize: '14px',
            color: '#f59e0b',
            fontWeight: '600',
            marginBottom: '12px'
        }}>
            {grant.sponsor}
        </p>
        <p style={{
            fontSize: '14px',
            color: '#ccc',
            lineHeight: '1.5',
            marginBottom: '16px'
        }}>
            {grant.synopsis}
        </p>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end'
        }}>
            <div>
                <p style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '4px'
                }}>
                    Due Date: {new Date(grant.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </p>
                <p style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#22c55e'
                }}>
                    Award: ${grant.award_min?.toLocaleString()} - ${grant.award_max?.toLocaleString()}
                </p>
            </div>
            <a
                href={grant.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    backgroundColor: '#f59e0b',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                <ExternalLink style={{ width: '14px', height: '14px' }} />
                View
            </a>
        </div>
    </div>
);

export default function GrantsPage() {
    const [allGrants, setAllGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        eligibility: 'all',
        dueDate: null
    });
    const [activeTab, setActiveTab] = useState('this-month');

    const today = new Date();
    const thisMonth = today.toISOString().slice(0, 7); // YYYY-MM format
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1).toISOString().slice(0, 7);

    const fetchGrants = useCallback(async () => {
        setLoading(true);
        try {
            // Simulate API call with mock data
            setTimeout(() => {
                const mockGrants = [
                    {
                        id: 1,
                        title: "Small Business Innovation Research (SBIR) Grant",
                        sponsor: "National Science Foundation",
                        synopsis: "Funding for small businesses to engage in research and development with commercialization potential.",
                        due_date: new Date(today.getFullYear(), today.getMonth(), 28).toISOString(),
                        award_min: 50000,
                        award_max: 1500000,
                        category: "research",
                        eligibility: ["small_business"],
                        month_key: thisMonth,
                        link: "https://www.sbir.gov"
                    },
                    {
                        id: 2,
                        title: "Minority Business Development Grant",
                        sponsor: "Department of Commerce",
                        synopsis: "Supporting minority-owned businesses through funding and technical assistance programs.",
                        due_date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString(),
                        award_min: 25000,
                        award_max: 250000,
                        category: "business_development",
                        eligibility: ["minority_owned"],
                        month_key: thisMonth,
                        link: "https://www.mbda.gov"
                    },
                    {
                        id: 3,
                        title: "Women's Business Center Grant",
                        sponsor: "Small Business Administration",
                        synopsis: "Funding to support women entrepreneurs through training, counseling, and access to credit.",
                        due_date: new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString(),
                        award_min: 75000,
                        award_max: 500000,
                        category: "entrepreneurship",
                        eligibility: ["women_owned"],
                        month_key: nextMonth,
                        link: "https://www.sba.gov"
                    },
                    {
                        id: 4,
                        title: "Veteran Entrepreneur Program",
                        sponsor: "Department of Veterans Affairs",
                        synopsis: "Comprehensive support for veteran-owned businesses including grants and mentorship.",
                        due_date: new Date(today.getFullYear(), today.getMonth() + 1, 25).toISOString(),
                        award_min: 10000,
                        award_max: 100000,
                        category: "veteran_support",
                        eligibility: ["veteran_owned"],
                        month_key: nextMonth,
                        link: "https://www.va.gov"
                    }
                ];
                setAllGrants(mockGrants);
                setLoading(false);
            }, 1000);
        } catch (e) {
            console.error("Error fetching grants:", e);
            setError("Could not fetch grants.");
            setLoading(false);
        }
    }, [thisMonth, nextMonth]);

    const refreshGrants = async () => {
        setLoading(true);
        try {
            await fetchGrants();
        } catch (e) {
            console.error("Error refreshing grants:", e);
            setError("Could not refresh grants list.");
        }
    };

    useEffect(() => {
        fetchGrants();
    }, [fetchGrants]);

    const filteredGrants = useMemo(() => {
        return allGrants.filter(grant => {
            const searchMatch = filters.search ?
                grant.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                grant.synopsis.toLowerCase().includes(filters.search.toLowerCase()) : true;
            const categoryMatch = filters.category === 'all' || grant.category === filters.category;
            const eligibilityMatch = filters.eligibility === 'all' || grant.eligibility?.includes(filters.eligibility);
            const dueDateMatch = !filters.dueDate || new Date(grant.due_date) <= filters.dueDate;
            return searchMatch && categoryMatch && eligibilityMatch && dueDateMatch;
        });
    }, [allGrants, filters]);

    const thisMonthGrants = filteredGrants.filter(g => g.month_key === thisMonth);
    const nextMonthGrants = filteredGrants.filter(g => g.month_key === nextMonth);

    const categories = useMemo(() => ['all', ...new Set(allGrants.map(g => g.category).filter(Boolean))], [allGrants]);

    return (
        <div style={{ padding: '32px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#fafafa',
                        marginBottom: '8px'
                    }}>
                        Grants
                    </h1>
                    <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
                        Discover funding opportunities for your business.
                    </p>
                </div>
                <button
                    onClick={refreshGrants}
                    disabled={loading}
                    style={{
                        backgroundColor: loading ? '#666' : '#f59e0b',
                        color: loading ? '#999' : '#000',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <RefreshCw style={{
                        width: '16px',
                        height: '16px',
                        animation: loading ? 'spin 1s linear infinite' : 'none'
                    }} />
                    {loading ? 'Refreshing...' : 'Refresh Grants List'}
                </button>
            </div>

            {error && (
                <div style={{
                    backgroundColor: '#dc2626',
                    border: '1px solid #b91c1c',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '24px',
                    color: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <AlertCircle style={{ width: '16px', height: '16px' }} />
                    {error}
                </div>
            )}

            {/* Filter Card */}
            <div style={{
                backgroundColor: '#000',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '32px'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#fafafa',
                    marginBottom: '20px'
                }}>
                    Filter Grants
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '16px',
                            height: '16px',
                            color: '#999'
                        }} />
                        <input
                            type="text"
                            placeholder="Search title or keyword..."
                            value={filters.search}
                            onChange={e => setFilters(f => ({...f, search: e.target.value}))}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                backgroundColor: '#000',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <select
                        value={filters.category}
                        onChange={e => setFilters(f => ({...f, category: e.target.value}))}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            backgroundColor: '#000',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    >
                        {categories.map(c => (
                            <option key={c} value={c}>
                                {c === 'all' ? 'All Categories' : c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.eligibility}
                        onChange={e => setFilters(f => ({...f, eligibility: e.target.value}))}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            backgroundColor: '#000',
                            color: '#fff',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    >
                        <option value="all">All Eligibilities</option>
                        <option value="minority_owned">Minority-Owned</option>
                        <option value="women_owned">Women-Owned</option>
                        <option value="veteran_owned">Veteran-Owned</option>
                        <option value="small_business">Small Business</option>
                    </select>

                    <div style={{ position: 'relative' }}>
                        <CalendarIcon style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '16px',
                            height: '16px',
                            color: '#999'
                        }} />
                        <input
                            type="date"
                            value={filters.dueDate ? filters.dueDate.toISOString().split('T')[0] : ''}
                            onChange={e => setFilters(f => ({...f, dueDate: e.target.value ? new Date(e.target.value) : null}))}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                backgroundColor: '#000',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    display: 'flex',
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '4px',
                    width: 'fit-content'
                }}>
                    <button
                        onClick={() => setActiveTab('this-month')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: activeTab === 'this-month' ? '#f59e0b' : 'transparent',
                            color: activeTab === 'this-month' ? '#000' : '#fafafa',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        This Month ({today.toLocaleDateString('en-US', { month: 'long' })})
                    </button>
                    <button
                        onClick={() => setActiveTab('next-month')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: activeTab === 'next-month' ? '#f59e0b' : 'transparent',
                            color: activeTab === 'next-month' ? '#000' : '#fafafa',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Next Month ({new Date(today.getFullYear(), today.getMonth() + 1).toLocaleDateString('en-US', { month: 'long' })})
                    </button>
                </div>
            </div>

            {/* Grant Cards */}
            <div>
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px',
                        color: '#999'
                    }}>
                        Loading grants...
                    </div>
                ) : (
                    <>
                        {activeTab === 'this-month' && (
                            <div>
                                {thisMonthGrants.length > 0 ? (
                                    thisMonthGrants.map(g => <GrantCard key={g.id} grant={g} />)
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '48px',
                                        backgroundColor: '#000',
                                        border: '1px solid #f59e0b',
                                        borderRadius: '12px',
                                        color: '#999'
                                    }}>
                                        No grants found for this month.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'next-month' && (
                            <div>
                                {nextMonthGrants.length > 0 ? (
                                    nextMonthGrants.map(g => <GrantCard key={g.id} grant={g} />)
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '48px',
                                        backgroundColor: '#000',
                                        border: '1px solid #f59e0b',
                                        borderRadius: '12px',
                                        color: '#999'
                                    }}>
                                        No grants found for next month.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}