import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function SubscriptionModal({ isOpen, onClose }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Unlock with PlanPilot Pro
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <p className="text-slate-600">
                        Get unlimited access to all features including business plans, grant proposals, credit guides, and document management.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                            asChild
                            className="flex-1"
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
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Maybe later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}