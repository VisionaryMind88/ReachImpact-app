import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/common/LanguageSelector";
import { ArrowRight, Play } from "lucide-react";

const DemoWelcome: React.FC = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Top navigation bar */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <img
            src="/logo.svg" 
            alt="ReachImpact Logo"
            className="h-8 w-auto mr-2"
            onError={(e) => {
              // Fallback if logo isn't available
              e.currentTarget.src = "https://via.placeholder.com/150x50?text=ReachImpact";
            }}
          />
          <h2 className="text-xl font-bold text-primary-700">ReachImpact</h2>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSelector />
          <Button variant="outline" size="sm" onClick={() => setLocation("/login")}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Welcome to the ReachImpact Demo!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience how our AI-driven outbound calling platform can automate your customer outreach, 
            increase appointment conversions, and boost your sales productivity by up to 300%.
          </p>
        </div>

        {/* Video and CTA section */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Video placeholder */}
          <div className="relative aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-xl">
            {isVideoPlaying ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white">Video would play here in production</p>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/70 to-primary-700/30 flex items-center justify-center">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="bg-white/20 hover:bg-white/30 text-white border-white rounded-full h-16 w-16"
                    onClick={() => setIsVideoPlaying(true)}
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="text-white font-medium">Guided Tour Video</h3>
                  <p className="text-white/80 text-sm">See how ReachImpact transforms your outreach strategy</p>
                </div>
              </div>
            )}
          </div>

          {/* Demo info and CTA */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Experience the future of AI-powered outreach</h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Interactive Demo Dashboard</h3>
                      <p className="text-gray-600">Explore a fully functional simulation of ReachImpact's platform</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">AI Call Simulations</h3>
                      <p className="text-gray-600">Experience different call scenarios with our advanced AI</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Multi-language Support</h3>
                      <p className="text-gray-600">See how our platform works in multiple languages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Button 
              size="lg" 
              className="w-full mt-8 text-lg h-14" 
              onClick={() => setLocation("/demo/dashboard")}
            >
              Start Interactive Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-gray-500 text-center">
              No credit card required. This demo uses simulated data and calls.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} ReachImpact. All data in this demo is simulated for demonstration purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemoWelcome;