import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AuthForm from "@/components/auth/AuthForm";

const Login: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

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

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/logo.svg"
            alt="ReachImpact Logo" 
            className="h-24 w-24"
            onError={(e) => {
              // Fallback if the logo image fails to load
              e.currentTarget.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = "h-12 w-12 bg-primary-500 rounded-md flex items-center justify-center text-white font-bold";
              fallback.innerText = "RI";
              e.currentTarget.parentNode?.appendChild(fallback);
            }}
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t("auth.login")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("auth.noAccount")}{" "}
          <a href="/register" className="font-medium text-primary-600 hover:text-primary-500">
            {t("auth.register")}
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm type="login" />
      </div>
    </div>
  );
};

export default Login;
