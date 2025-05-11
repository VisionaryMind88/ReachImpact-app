import React, { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showingLanding, setShowingLanding] = useState(false);

  useEffect(() => {
    // If within 800ms we haven't redirected, show the landing page with demo option
    const timeout = setTimeout(() => {
      setShowingLanding(true);
    }, 800);
    
    if (!loading) {
      if (user) {
        setLocation("/dashboard");
      } else {
        setLocation("/login");
      }
      clearTimeout(timeout);
    }
    
    return () => clearTimeout(timeout);
  }, [user, loading, setLocation]);

  if (showingLanding) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 py-4 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-500 rounded-md flex items-center justify-center text-white font-bold mr-2">
                RI
              </div>
              <h1 className="text-xl font-bold text-gray-900">ReachImpact</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setLocation("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => setLocation("/register")}>
                Sign Up
              </Button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 bg-gradient-to-b from-primary-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                AI-Powered Outbound Calling<br />
                <span className="text-primary-600">That Actually Works</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Automate your outreach, increase appointment conversions, and boost productivity 
                with our intelligent AI calling platform.
              </p>
              
              <div className="mt-10 space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-6">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg h-14"
                  onClick={() => setLocation("/register")}
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto text-lg h-14"
                  onClick={() => setLocation("/demo")}
                >
                  Try Interactive Demo
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="h-12 w-12 bg-primary-500 rounded-md flex items-center justify-center text-white font-bold mx-auto mb-4">
          RI
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ReachImpact</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mt-4"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
