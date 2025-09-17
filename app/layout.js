import "./globals.css";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import {
  Menu,
  X,
  Home,
  Lightbulb,
  FileText,
  Gift,
  Send,
  CreditCard,
  File,
  DollarSign,
  User
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Business Idea', href: '/business-idea', icon: Lightbulb },
  { name: 'Business Plans', href: '/business-plans', icon: FileText },
  { name: 'Grants', href: '/grants', icon: Gift },
  { name: 'Grant Proposals', href: '/grant-proposals', icon: Send },
  { name: 'Credit Guide', href: '/credit-guide', icon: CreditCard },
  { name: 'Documents', href: '/documents', icon: File },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
        <div className="min-h-screen bg-background">
          {/* Mobile sidebar */}
          <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-64 bg-sidebar-background border-r border-sidebar-border">
              <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
                <h1 className="text-xl font-bold text-sidebar-foreground">
                  <span className="text-primary">Biz</span>Plan Navigator
                </h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-2 hover:bg-sidebar-accent transition-colors"
                >
                  <X className="h-5 w-5 text-sidebar-foreground" />
                </button>
              </div>
              <nav className="px-3 py-4">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={handleNavClick}
                          className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:block">
            <div className="flex h-full flex-col bg-sidebar-background border-r border-sidebar-border">
              <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
                <h1 className="text-xl font-bold text-sidebar-foreground">
                  <span className="text-primary">Biz</span>Plan Navigator
                </h1>
              </div>
              <nav className="flex-1 px-3 py-4">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={handleNavClick}
                          className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:pl-64">
            {/* Top navigation */}
            <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
              <button
                type="button"
                className="lg:hidden -m-2.5 p-2.5 text-foreground hover:text-primary transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-foreground lg:hidden">
                    <span className="text-primary">Biz</span>Plan Navigator
                  </h1>
                </div>
                <div className="flex items-center ml-auto">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Page content */}
            <main className="py-10">
              <div className="px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </div>
  );
}