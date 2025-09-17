'use client';

import { useState } from 'react';
import { BookOpen, Route, CheckCircle, Circle, ChevronDown } from 'lucide-react';

export default function CreditGuidePage() {
  const [activeTab, setActiveTab] = useState('education');
  const [formData, setFormData] = useState({
    businessAge: '',
    hasEIN: '',
    hasBusinessBank: ''
  });

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateRoadmap = () => {
    // Simple logic to show different roadmap items based on form responses
    return formData.businessAge || formData.hasEIN || formData.hasBusinessBank;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Credit Guide</h1>
        <p className="text-muted-foreground">
          Learn about business credit and get a personalized roadmap for building your credit profile.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('education')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'education'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Credit Education
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'roadmap'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Route className="h-4 w-4" />
            Personalized Roadmap
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'education' ? (
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-foreground mb-6">Understanding Business Credit</h2>

              <h3 className="text-xl font-semibold text-foreground mb-4">What is Business Credit?</h3>
              <p className="text-muted-foreground mb-6">
                Business credit is a measure of your company's creditworthiness, separate from your personal credit.
                It helps lenders, suppliers, and partners assess the financial reliability of your business.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-4">Why Business Credit Matters</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li>Access to better financing terms and higher credit limits</li>
                <li>Protection of your personal credit and assets</li>
                <li>Improved vendor relationships and payment terms</li>
                <li>Enhanced business credibility and reputation</li>
                <li>Easier qualification for business loans and lines of credit</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-4">Key Steps to Build Business Credit</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li><strong>Establish Your Business:</strong> Register your business and obtain an EIN</li>
                <li><strong>Open Business Bank Accounts:</strong> Separate business and personal finances</li>
                <li><strong>Get a Business Phone Line:</strong> Listed in your business name</li>
                <li><strong>Establish Trade Lines:</strong> Work with vendors who report to business credit bureaus</li>
                <li><strong>Apply for Business Credit Cards:</strong> Start with cards that don't require personal guarantees</li>
                <li><strong>Monitor Your Credit:</strong> Regularly check your business credit reports</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-4">Business Credit Bureaus</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                <li><strong>Dun & Bradstreet:</strong> The largest business credit bureau</li>
                <li><strong>Experian Business:</strong> Provides detailed business credit reports</li>
                <li><strong>Equifax Business:</strong> Offers business credit monitoring services</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-4">Common Mistakes to Avoid</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Mixing personal and business expenses</li>
                <li>Not establishing business credit early enough</li>
                <li>Relying too heavily on personal credit for business needs</li>
                <li>Ignoring business credit reports and scores</li>
                <li>Not diversifying credit sources</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-6">Tell Us About Your Business</h2>

              <form className="space-y-6">
                {/* Business Age */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    How long has your business been operating?
                  </label>
                  <div className="relative">
                    <select
                      value={formData.businessAge}
                      onChange={(e) => handleFormChange('businessAge', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                    >
                      <option value="">Select business age...</option>
                      <option value="startup">Just starting (0-6 months)</option>
                      <option value="new">New business (6 months - 2 years)</option>
                      <option value="established">Established (2-5 years)</option>
                      <option value="mature">Mature business (5+ years)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* EIN */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Do you have an EIN (Employer Identification Number)?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="hasEIN"
                        value="yes"
                        checked={formData.hasEIN === 'yes'}
                        onChange={(e) => handleFormChange('hasEIN', e.target.value)}
                        className="w-4 h-4 text-primary border-input focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-foreground">Yes</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="hasEIN"
                        value="no"
                        checked={formData.hasEIN === 'no'}
                        onChange={(e) => handleFormChange('hasEIN', e.target.value)}
                        className="w-4 h-4 text-primary border-input focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-foreground">No</span>
                    </label>
                  </div>
                </div>

                {/* Business Bank Account */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Do you have a dedicated business bank account?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="hasBusinessBank"
                        value="yes"
                        checked={formData.hasBusinessBank === 'yes'}
                        onChange={(e) => handleFormChange('hasBusinessBank', e.target.value)}
                        className="w-4 h-4 text-primary border-input focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-foreground">Yes</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="hasBusinessBank"
                        value="no"
                        checked={formData.hasBusinessBank === 'no'}
                        onChange={(e) => handleFormChange('hasBusinessBank', e.target.value)}
                        className="w-4 h-4 text-primary border-input focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-foreground">No</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Roadmap */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-6">Your Credit Building Roadmap</h2>

              {!generateRoadmap() ? (
                <div className="text-center py-12">
                  <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Complete the form to get your personalized credit building roadmap.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Register Your Business</h4>
                      <p className="text-sm text-muted-foreground">
                        Ensure your business is properly registered in your state.
                      </p>
                    </div>
                  </div>

                  {formData.hasEIN === 'no' && (
                    <div className="flex items-start space-x-3">
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground">Obtain an EIN</h4>
                        <p className="text-sm text-muted-foreground">
                          Apply for an Employer Identification Number from the IRS.
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.hasBusinessBank === 'no' && (
                    <div className="flex items-start space-x-3">
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground">Open Business Bank Account</h4>
                        <p className="text-sm text-muted-foreground">
                          Separate your business and personal finances with a dedicated account.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Establish Trade Lines</h4>
                      <p className="text-sm text-muted-foreground">
                        Work with vendors who report payments to business credit bureaus.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Apply for Business Credit Card</h4>
                      <p className="text-sm text-muted-foreground">
                        Start with secured business cards if you're just beginning.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">Monitor Your Credit</h4>
                      <p className="text-sm text-muted-foreground">
                        Regularly check your business credit reports from all three bureaus.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      💡 This roadmap is customized based on your responses. Complete each step to build a strong business credit profile.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}