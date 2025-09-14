
import React, { useState, useEffect } from "react";
import { BusinessIdea } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Trash2, Plus } from "lucide-react";

export default function BusinessInput() {
    const [ideas, setIdeas] = useState([]);
    const [currentIdea, setCurrentIdea] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadIdeas();
    }, []);

    const loadIdeas = async () => {
        const fetchedIdeas = await BusinessIdea.list('-updated_date');
        setIdeas(fetchedIdeas);
    };
    
    const validate = () => {
        const newErrors = {};
        if (!currentIdea.business_name?.trim()) newErrors.business_name = "Business name is required.";
        if (!currentIdea.business_address?.trim()) newErrors.business_address = "Business address is required.";
        if (!currentIdea.problem_solved?.trim()) newErrors.problem_solved = "Problem solved is required.";
        
        // Ensure years_in_business is a number before validation, default to 0 if not
        const yearsInBusiness = Number(currentIdea.years_in_business);
        if (isNaN(yearsInBusiness) || yearsInBusiness < 0) {
            newErrors.years_in_business = "Years in business must be a non-negative number.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNew = () => {
        setCurrentIdea({ business_name: "", concept: "", extra_prompt: "", business_address: "", years_in_business: 0, problem_solved: "" });
        setErrors({});
    };

    const handleSelect = (idea) => {
        setCurrentIdea(idea);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentIdea(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!currentIdea || !validate()) return;
        setIsSaving(true);
        const dataToSave = { 
            ...currentIdea, 
            startup_costs: Number(currentIdea.startup_costs) || 0,
            years_in_business: Number(currentIdea.years_in_business) || 0
        };
        if (currentIdea.id) {
            await BusinessIdea.update(currentIdea.id, dataToSave);
        } else {
            await BusinessIdea.create(dataToSave);
        }
        await loadIdeas();
        setCurrentIdea(null);
        setIsSaving(false);
    };

    const handleDelete = async (id) => {
        await BusinessIdea.delete(id);
        await loadIdeas();
        if (currentIdea && currentIdea.id === id) {
            setCurrentIdea(null);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-navy-800">Business Idea Input</h1>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Ideas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full" onClick={handleNew}><Plus className="mr-2 h-4 w-4" /> New Idea</Button>
                            {ideas.map(idea => (
                                <div key={idea.id} className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${currentIdea?.id === idea.id ? 'bg-slate-200' : 'hover:bg-slate-100'}`} onClick={() => handleSelect(idea)}>
                                    <span className="font-medium truncate">{idea.business_name}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDelete(idea.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    {currentIdea ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>{currentIdea.id ? `Editing: ${currentIdea.business_name}` : 'Create New Idea'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Field id="business_name" label="Business Name" value={currentIdea.business_name} onChange={handleChange} required error={errors.business_name} />
                                <Field id="business_address" label="Business Address" value={currentIdea.business_address} onChange={handleChange} required error={errors.business_address} />
                                <Field id="years_in_business" label="Years in Business" type="number" value={currentIdea.years_in_business} onChange={handleChange} error={errors.years_in_business} />
                                <Field id="problem_solved" label="Problem Solved" value={currentIdea.problem_solved} onChange={handleChange} isTextarea required error={errors.problem_solved} />
                                <hr/>
                                <Field id="concept" label="Concept" value={currentIdea.concept} onChange={handleChange} isTextarea />
                                <Field id="mission_statement" label="Mission Statement" value={currentIdea.mission_statement} onChange={handleChange} isTextarea />
                                <Field id="target_market" label="Target Market" value={currentIdea.target_market} onChange={handleChange} isTextarea />
                                <Field id="business_goals" label="Business Goals" value={currentIdea.business_goals} onChange={handleChange} isTextarea />
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <Field id="industry" label="Industry" value={currentIdea.industry} onChange={handleChange} />
                                    <Field id="startup_costs" label="Startup Costs ($)" type="number" value={currentIdea.startup_costs} onChange={handleChange} />
                                </div>
                                <Field id="revenue_model" label="Revenue Model" value={currentIdea.revenue_model} onChange={handleChange} isTextarea />
                                <Field id="competitive_advantage" label="Competitive Advantage" value={currentIdea.competitive_advantage} onChange={handleChange} isTextarea />
                                <Field id="location" label="Location" value={currentIdea.location} onChange={handleChange} />
                                <Field id="extra_prompt" label="Extra Instructions for AI" value={currentIdea.extra_prompt} onChange={handleChange} isTextarea placeholder="Tell the AI anything extra to include (tone, niche, special goals, partners, timeline, etc.)." />
                                <Button onClick={handleSave} disabled={isSaving}>
                                    <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Idea'}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="flex flex-col items-center justify-center text-center p-12 h-full">
                            <h2 className="text-xl font-semibold text-slate-700">Select an idea to edit or create a new one.</h2>
                            <p className="text-slate-500 mt-2">This is where you'll define the core of your business venture.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

const Field = ({ id, label, value, onChange, type = "text", isTextarea = false, required = false, placeholder="", error = null }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>{label}{required && ' *'}</Label>
        {isTextarea ? (
            <Textarea id={id} name={id} value={value || ""} onChange={onChange} placeholder={placeholder} className={error ? 'border-red-500' : ''}/>
        ) : (
            <Input id={id} name={id} type={type} value={value || ""} onChange={onChange} placeholder={placeholder} className={error ? 'border-red-500' : ''}/>
        )}
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
);
