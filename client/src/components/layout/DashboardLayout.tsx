import React, { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatWidget from "../common/ChatWidget";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  description,
  actions,
}) => {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoginRoute] = useRoute("/login");
  const [isRegisterRoute] = useRoute("/register");

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in and not on auth pages, redirect to login
  if (!user && !isLoginRoute && !isRegisterRoute) {
    setLocation("/login");
    return null;
  }

  // If on auth pages but logged in, redirect to dashboard
  if (user && (isLoginRoute || isRegisterRoute)) {
    setLocation("/dashboard");
    return null;
  }

  // If on auth pages, don't show dashboard layout
  if (isLoginRoute || isRegisterRoute) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar user={user} />

      {/* Mobile sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <Sidebar user={user} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header 
          user={user} 
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} 
        />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            {/* Page header */}
            {(title || actions) && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between">
                {title && (
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                    {description && (
                      <p className="mt-1 text-sm text-gray-500">{description}</p>
                    )}
                  </div>
                )}
                {actions && (
                  <div className="mt-4 md:mt-0 flex space-x-3">
                    {actions}
                  </div>
                )}
              </div>
            )}

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {/* Chat widget */}
      <ChatWidget />
    </div>
  );
};

export default DashboardLayout;
