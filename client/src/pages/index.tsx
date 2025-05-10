import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const Index: React.FC = () => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (user) {
        setLocation("/dashboard");
      } else {
        setLocation("/login");
      }
    }
  }, [user, loading, setLocation]);

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
