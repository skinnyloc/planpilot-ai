
import React, { useState, useEffect } from "react";
import { BusinessIdea } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, DollarSign, CreditCard, ArrowRight, Plus } from "lucide-react";

export default function Dashboard() {
    const [ideaCount, setIdeaCount] = useState(0);

    useEffect(() => {
        const fetchIdeas = async () => {
            const ideas = await BusinessIdea.list();
            setIdeaCount(ideas.length);
        };
        fetchIdeas();
    }, []);

    const actions = [
        { title: "Define Your Business Idea", icon: Building2, url: createPageUrl("BusinessInput") },
        { title: "Generate a Business Plan", icon: FileText, url: createPageUrl("BusinessPlans") },
        { title: "Draft a Grant Proposal", icon: DollarSign, url: createPageUrl("GrantProposals") },
        { title: "Build Your Business Credit", icon: CreditCard, url: createPageUrl("CreditGuide") },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-navy-800">Welcome to Your Business Hub</h1>
                <p className="text-slate-600 mt-1">Plan, fund, and grow your business, all in one place.</p>
            </div>

            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">You have</p>
                        <p className="text-3xl font-semibold text-gray-900">{ideaCount} Business Idea{ideaCount !== 1 && 's'}</p>
                        <p className="text-sm text-slate-500">ready to be developed.</p>
                    </div>
                    <Link to={createPageUrl('BusinessInput')}>
                        <Button variant="secondary" className="bg-gold-500 hover:bg-gold-500/90 text-navy-800">
                            <Plus className="mr-2 h-4 w-4" /> Add Idea
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {actions.map((action) => (
                    <Card key={action.title} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium text-navy-800">{action.title}</CardTitle>
                            <action.icon className="h-6 w-6 text-slate-500" />
                        </CardHeader>
                        <CardContent>
                            <Link to={action.url}>
                                <Button variant="outline" className="w-full justify-between">
                                    Get Started
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
