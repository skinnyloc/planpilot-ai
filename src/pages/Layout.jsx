import React from "react";
import { Building2, FileText, DollarSign, CreditCard, LayoutDashboard, Menu, X, ShieldCheck, Tag, User } from "lucide-react";

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const navigationItems = [
        { title: "Dashboard", icon: LayoutDashboard },
        { title: "Business Idea", icon: Building2 },
        { title: "Business Plans", icon: FileText },
        { title: "Grants", icon: DollarSign },
        { title: "Grant Proposals", icon: ShieldCheck },
        { title: "Credit Guide", icon: CreditCard },
        { title: "Pricing", icon: Tag },
        { title: "Profile", icon: User },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Desktop Sidebar */}
            <aside className="w-56 bg-black min-h-screen">
                {/* Logo Section */}
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FFD400] rounded-lg">
                            <Building2 className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg leading-tight">BizPlan</h1>
                            <h1 className="text-white font-bold text-lg leading-tight">Companion</h1>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-4">
                    {navigationItems.map((item, index) => (
                        <div
                            key={item.title}
                            className={`relative flex items-center gap-3 px-3 py-4 mb-2 cursor-pointer transition-all duration-200 ${
                                index === 0 ? 'bg-gray-600 rounded-lg' : ''
                            }`}
                            style={{ backgroundColor: index === 0 ? '#444444' : 'transparent' }}
                        >
                            {index === 0 && (
                                <div 
                                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                                    style={{ backgroundColor: '#FFD400' }}
                                ></div>
                            )}
                            <item.icon 
                                className="w-5 h-5" 
                                style={{ color: '#FFD400' }}
                            />
                            <span 
                                className="font-medium text-base"
                                style={{ color: '#FFD400' }}
                            >
                                {item.title}
                            </span>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-white">
                <div className="p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Business Hub</h1>
                        <p className="text-gray-600">Plan, fund, and grow your business, all in one place.</p>
                    </div>

                    {/* Business Idea Counter */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">You have</p>
                                <h2 className="text-3xl font-bold text-gray-900">1 Business Idea</h2>
                                <p className="text-gray-500 text-sm">ready to be developed.</p>
                            </div>
                            <button className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 text-gray-700 hover:bg-gray-50">
                                <span className="text-xl">+</span>
                                <span className="font-medium">Add Idea</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Define Your Business Idea */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Define Your Business Idea</h3>
                                <FileText className="w-6 h-6 text-gray-400" />
                            </div>
                            <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium">
                                <span>Get Started</span>
                                <span className="text-lg">→</span>
                            </button>
                        </div>

                        {/* Generate a Business Plan */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Generate a Business Plan</h3>
                                <FileText className="w-6 h-6 text-gray-400" />
                            </div>
                            <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium">
                                <span>Get Started</span>
                                <span className="text-lg">→</span>
                            </button>
                        </div>

                        {/* Draft a Grant Proposal */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Draft a Grant Proposal</h3>
                                <DollarSign className="w-6 h-6 text-gray-400" />
                            </div>
                            <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium">
                                <span>Get Started</span>
                                <span className="text-lg">→</span>
                            </button>
                        </div>

                        {/* Build Your Business Credit */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Build Your Business Credit</h3>
                                <CreditCard className="w-6 h-6 text-gray-400" />
                            </div>
                            <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium">
                                <span>Get Started</span>
                                <span className="text-lg">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Menu Button - only visible on mobile */}
            <button 
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-black text-yellow-400 rounded-md"
                onClick={() => setMobileMenuOpen(true)}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="w-64 bg-black h-full">
                        <div className="p-4 flex justify-between items-center border-b border-gray-700">
                            <h2 className="text-yellow-400 font-bold">Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)}>
                                <X className="w-6 h-6 text-yellow-400" />
                            </button>
                        </div>
                        <nav className="p-4">
                            {navigationItems.map((item) => (
                                <div
                                    key={item.title}
                                    className="flex items-center gap-3 px-3 py-3 mb-1 rounded-lg cursor-pointer hover:bg-gray-800"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <item.icon className="w-5 h-5 text-[#FFD400]" />
                                    <span className="text-[#FFD400] font-medium">{item.title}</span>
                                </div>
                            ))}
                        </nav>
                    </div>
                    <div className="flex-1 bg-black/30" onClick={() => setMobileMenuOpen(false)}></div>
                </div>
            )}
        </div>
    );
}