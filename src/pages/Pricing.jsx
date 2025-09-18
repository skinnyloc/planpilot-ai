import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

export default function PricingPage() {

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-navy-800">Choose Your Plan</h1>
                <p className="text-slate-600 mt-2">Unlock the full power of PlanPilot with our Pro subscription.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Monthly Plan */}
                <Card className="w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">PlanPilot Pro - Monthly</CardTitle>
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

                        {/* PayPal Monthly Subscription Button */}
                        <div dangerouslySetInnerHTML={{
                            __html: `
                                <div id="paypal-button-container-P-021407488D8484329NDEOG2A"></div>
                                <script src="https://www.paypal.com/sdk/js?client-id=Ab6MKwY3DX3P0K441jv6tZXbhHmXbtnK3K4dQLYldKjXMjquLusIsvTui17G_l03gJsCkgaY0Wa-mX7f&vault=true&intent=subscription" data-sdk-integration-source="button-factory"></script>
                                <script>
                                  paypal.Buttons({
                                      style: {
                                          shape: 'rect',
                                          color: 'gold',
                                          layout: 'vertical',
                                          label: 'subscribe'
                                      },
                                      createSubscription: function(data, actions) {
                                          return actions.subscription.create({
                                              'plan_id': 'P-021407488D8484329NDEOG2A'
                                          });
                                      },
                                      onApprove: function(data, actions) {
                                          alert(data.subscriptionID);
                                      }
                                  }).render('#paypal-button-container-P-021407488D8484329NDEOG2A');
                                </script>
                            `
                        }} />
                    </CardContent>
                </Card>

                {/* Yearly Plan */}
                <Card className="w-full border-2 border-blue-500 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Save 17%
                        </span>
                    </div>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">PlanPilot Pro - Yearly</CardTitle>
                        <div className="text-4xl font-bold text-navy-800 mt-4">
                            $199.99<span className="text-lg font-normal text-slate-600"> / year</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            Only $16.67/month when paid annually
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
                            <li className="flex items-center gap-3">
                                <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                <span className="font-medium text-blue-700">2 months free!</span>
                            </li>
                        </ul>

                        {/* PayPal Yearly Subscription Button */}
                        <div dangerouslySetInnerHTML={{
                            __html: `
                                <div id="paypal-button-container-P-5HR698674T6427033NDEOFSY"></div>
                                <script src="https://www.paypal.com/sdk/js?client-id=Ab6MKwY3DX3P0K441jv6tZXbhHmXbtnK3K4dQLYldKjXMjquLusIsvTui17G_l03gJsCkgaY0Wa-mX7f&vault=true&intent=subscription" data-sdk-integration-source="button-factory"></script>
                                <script>
                                  paypal.Buttons({
                                      style: {
                                          shape: 'rect',
                                          color: 'gold',
                                          layout: 'vertical',
                                          label: 'subscribe'
                                      },
                                      createSubscription: function(data, actions) {
                                          return actions.subscription.create({
                                              'plan_id': 'P-5HR698674T6427033NDEOFSY'
                                          });
                                      },
                                      onApprove: function(data, actions) {
                                          alert(data.subscriptionID);
                                      }
                                  }).render('#paypal-button-container-P-5HR698674T6427033NDEOFSY');
                                </script>
                            `
                        }} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}