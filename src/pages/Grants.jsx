
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Grant } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addMonths, startOfMonth } from 'date-fns';
import { CalendarIcon, Search, AlertCircle } from 'lucide-react';
import { refreshMonthlyGrants } from '@/api/functions';

const GrantCard = ({ grant }) => (
    <div className="border p-4 rounded-lg">
        <h3 className="font-bold text-lg">{grant.title}</h3>
        <p className="text-sm text-slate-600 font-semibold">{grant.sponsor}</p>
        <p className="text-sm mt-2">{grant.synopsis}</p>
        <div className="flex justify-between items-end mt-4">
            <div>
                <p className="text-xs text-slate-500">Due Date: {format(new Date(grant.due_date), 'MMM d, yyyy')}</p>
                <p className="font-semibold text-green-700">Award: ${grant.award_min?.toLocaleString()} - ${grant.award_max?.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild><a href={grant.link} target="_blank" rel="noopener noreferrer">View</a></Button>
            </div>
        </div>
    </div>
);

export default function GrantsPage() {
    const [allGrants, setAllGrants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ search: '', category: 'all', eligibility: 'all', dueDate: null });

    const today = new Date();
    const thisMonthKey = format(today, 'yyyy-MM');
    const nextMonthKey = format(addMonths(today, 1), 'yyyy-MM');

    const fetchGrants = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedGrants = await Grant.filter({
                month_key: { '$in': [thisMonthKey, nextMonthKey] }
            });
            setAllGrants(fetchedGrants);
        } catch (e) {
            console.error("Error fetching grants:", e);
            setError("Could not fetch grants.");
        } finally {
            setLoading(false);
        }
    }, [thisMonthKey, nextMonthKey]); // Added dependencies for useCallback

    const refreshGrants = async () => {
        setLoading(true);
        try {
            await refreshMonthlyGrants();
            await fetchGrants();
        } catch (e) {
            console.error("Error refreshing grants:", e);
            setError("Could not refresh grants list.");
        }
    };
    
    useEffect(() => {
        fetchGrants();
    }, [fetchGrants]); // Added fetchGrants to dependency array

    const filteredGrants = useMemo(() => {
        return allGrants.filter(grant => {
            const searchMatch = filters.search ? grant.title.toLowerCase().includes(filters.search.toLowerCase()) || grant.synopsis.toLowerCase().includes(filters.search.toLowerCase()) : true;
            const categoryMatch = filters.category === 'all' || grant.category === filters.category;
            const eligibilityMatch = filters.eligibility === 'all' || grant.eligibility?.includes(filters.eligibility);
            const dueDateMatch = !filters.dueDate || new Date(grant.due_date) <= filters.dueDate;
            return searchMatch && categoryMatch && eligibilityMatch && dueDateMatch;
        });
    }, [allGrants, filters]);

    const thisMonthGrants = filteredGrants.filter(g => g.month_key === thisMonthKey);
    const nextMonthGrants = filteredGrants.filter(g => g.month_key === nextMonthKey);
    
    const categories = useMemo(() => ['all', ...new Set(allGrants.map(g => g.category).filter(Boolean))], [allGrants]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-navy-800">Grants</h1>
                <Button onClick={refreshGrants} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Grants List'}</Button>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><AlertCircle className="inline mr-2"/>{error}</div>}

            <Card>
                <CardHeader>
                    <CardTitle>Filter Grants</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input placeholder="Search title or keyword..." value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} className="pl-10" />
                    </div>
                    <Select value={filters.category} onValueChange={val => setFilters(f => ({...f, category: val}))}>
                        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={filters.eligibility} onValueChange={val => setFilters(f => ({...f, eligibility: val}))}>
                        <SelectTrigger><SelectValue placeholder="Eligibility" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Eligibilities</SelectItem>
                            <SelectItem value="minority_owned">Minority-Owned</SelectItem>
                            <SelectItem value="women_owned">Women-Owned</SelectItem>
                            <SelectItem value="veteran_owned">Veteran-Owned</SelectItem>
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filters.dueDate ? format(filters.dueDate, 'PPP') : <span>Due date before...</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filters.dueDate} onSelect={date => setFilters(f => ({...f, dueDate: date}))} /></PopoverContent>
                    </Popover>
                </CardContent>
            </Card>

            <Tabs defaultValue="this-month">
                <TabsList>
                    <TabsTrigger value="this-month">This Month ({format(today, 'MMMM')})</TabsTrigger>
                    <TabsTrigger value="next-month">Next Month ({format(addMonths(today, 1), 'MMMM')})</TabsTrigger>
                </TabsList>
                <TabsContent value="this-month" className="mt-4">
                    <div className="space-y-4">
                        {loading ? <p>Loading...</p> : thisMonthGrants.length > 0 ? thisMonthGrants.map(g => <GrantCard key={g.id} grant={g} />) : <p>No grants found for this month.</p>}
                    </div>
                </TabsContent>
                <TabsContent value="next-month" className="mt-4">
                    <div className="space-y-4">
                         {loading ? <p>Loading...</p> : nextMonthGrants.length > 0 ? nextMonthGrants.map(g => <GrantCard key={g.id} grant={g} />) : <p>No grants found for next month.</p>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
