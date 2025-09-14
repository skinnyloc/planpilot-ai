import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function PricingPage() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-navy-800">Choose Your Plan</h1>
                <p className="text-slate-600 mt-2">Unlock the full power of PlanPilot with our Pro subscription.</p>
            </div>
            
            <div className="flex justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">PlanPilot Pro</CardTitle>
                        <div className="text-4xl font-bold text-navy-800 mt-4">
                            $19.99<span className="text-lg font-normal text-slate-600"> / month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span>Business plans generator</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span>Grant proposals</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span>Credit guide</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span>Document manager</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                <span>Priority saves to cloud</span>
                            </li>
                        </ul>
                        
                        <Button 
                            asChild
                            className="w-full py-3 text-lg font-semibold"
                            style={{ 
                                backgroundColor: '#000000', 
                                color: '#FFD000',
                                borderRadius: '16px'
                            }}
                        >
                            <a 
                                href="https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-2FM92036C5386342GNC5I7YY"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Subscribe with PayPal
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}