import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Context Providers
import AuthProvider from "@/contexts/AuthContext";
import LanguageProvider from "@/contexts/LanguageContext";

// Components
import ChatWidget from "@/components/common/ChatWidget";

// Pages
import Index from "@/pages/index";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Contacts from "@/pages/contacts";
import Calls from "@/pages/calls";
import Campaigns from "@/pages/campaigns";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import Billing from "@/pages/billing";
import Calendar from "@/pages/calendar";
import Messages from "@/pages/messages";
import NotFound from "@/pages/not-found";

// Import campaign pages
import NewCampaign from "@/pages/campaigns/new";
import CampaignDetail from "@/pages/campaigns/[id]";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Index} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/calls" component={Calls} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/new" component={NewCampaign} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route path="/billing" component={Billing} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/messages" component={Messages} />
      
      {/* Demo routes */}
      <Route path="/demo">
        {() => (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <React.Fragment>
              {(() => {
                const Demo = React.lazy(() => import("@/pages/demo"));
                return <Demo />;
              })()}
            </React.Fragment>
          </Suspense>
        )}
      </Route>
      <Route path="/demo/dashboard">
        {() => (
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <React.Fragment>
              {(() => {
                const DemoDashboard = React.lazy(() => import("@/pages/demo/dashboard"));
                return <DemoDashboard />;
              })()}
            </React.Fragment>
          </Suspense>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ChatWidget />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
