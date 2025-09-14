

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, FileText, DollarSign, CreditCard, FolderOpen, LayoutDashboard, Menu, X, ShieldCheck, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children }) {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const navigationItems = [
        { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
        { title: "Business Idea", url: createPageUrl("BusinessInput"), icon: Building2 },
        { title: "Business Plans", url: createPageUrl("BusinessPlans"), icon: FileText },
        { title: "Grants", url: createPageUrl("Grants"), icon: DollarSign },
        { title: "Grant Proposals", url: createPageUrl("GrantProposals"), icon: ShieldCheck },
        { title: "Credit Guide", url: createPageUrl("CreditGuide"), icon: CreditCard },
        { title: "Documents", url: createPageUrl("Documents"), icon: FolderOpen },
        { title: "Pricing", url: createPageUrl("Pricing"), icon: Tag },
        { title: "Profile", url: createPageUrl("Profile"), icon: User },
    ];

    const isActive = (url) => location.pathname.startsWith(url) && (url !== createPageUrl("Dashboard") || location.pathname === url) ;

    const NavLinks = ({ isMobile }) => (
        <nav className={`space-y-2 ${isMobile ? 'p-4' : 'p-2'}`}>
            {navigationItems.map((item) => (
                <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                    className={`group relative flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm
                        ${ isActive(item.url)
                            ? 'active-link'
                            : 'text-[#FFD400] hover:bg-[#111111] hover:text-white'
                        }`}
                >
                    <item.icon className="w-5 h-5" />
                    <span className="font-semibold">{item.title}</span>
                </Link>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Toaster position="top-center" richColors />
            <style>{`
                .sidebar { background-color: #000000; }
                .active-link { 
                    background-color: #222222;
                    color: #FFFFFF;
                }
                .active-link::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background-color: #FFD400;
                    border-top-right-radius: 3px;
                    border-bottom-right-radius: 3px;
                }
            `}</style>
            
            {/* Mobile Header */}
            <header className="lg:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-black" />
                    <h1 className="text-lg font-bold text-black">BizPlan Companion</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                    <Menu className="w-6 h-6" />
                </Button>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="lg:hidden fixed inset-0 z-50 flex"
                    >
                        <div className="bg-black w-72 h-full shadow-xl">
                            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                                <h2 className="font-bold text-white">Menu</h2>
                                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                                    <X className="w-6 h-6 text-white" />
                                </Button>
                            </div>
                            <NavLinks isMobile={true} />
                        </div>
                        <div className="flex-1 bg-black/30" onClick={() => setMobileMenuOpen(false)}></div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="flex">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-64 sidebar min-h-screen sticky top-0 z-30">
                    <div className="p-6 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#FFD400] rounded-lg">
                                <Building2 className="w-6 h-6 text-black" />
                            </div>
                            <h1 className="text-xl font-bold text-white">BizPlan Companion</h1>
                        </div>
                    </div>
                    <NavLinks />
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

