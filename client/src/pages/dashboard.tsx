import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Campaign, Call, Contact } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import CampaignTable from "@/components/dashboard/CampaignTable";
import CallList from "@/components/dashboard/CallList";
import ContactList from "@/components/dashboard/ContactList";
import { Button } from "@/components/ui/button";
import { Phone, Upload, RefreshCcw, BarChart3, Calendar, MessageSquare, Clock } from "lucide-react";
import { useLocation } from "wouter";

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  // Fetch recent calls
  const { data: calls, isLoading: callsLoading } = useQuery<Call[]>({
    queryKey: ['/api/calls'],
  });

  // Fetch recent contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Handle start campaign button
  const handleStartCampaign = () => {
    setLocation("/campaigns/new");
  };

  // Handle import contacts button
  const handleImportContacts = () => {
    setLocation("/contacts/import");
  };

  // Handle call contact function
  const handleCallContact = (contactId: number) => {
    setLocation(`/calls/new?contactId=${contactId}`);
  };

  // Handle manage campaign function
  const handleManageCampaign = (campaignId: number) => {
    setLocation(`/campaigns/${campaignId}`);
  };

  // Prepare data for components
  const recentCalls = calls 
    ? calls.slice(0, 4).map(call => {
        // Find the contact for each call
        const contact = contacts?.find(c => c.id === call.contactId) || {
          id: 0,
          fullName: "Unknown",
          companyName: "Unknown",
          phoneNumber: "",
          userId: 0,
          status: "",
          createdAt: new Date()
        };
        return { ...call, contact };
      })
    : [];

  const recentContacts = contacts ? contacts.slice(0, 4) : [];

  // Dashboard actions
  const dashboardActions = (
    <>
      <Button variant="outline" onClick={handleImportContacts}>
        <Upload className="h-4 w-4 mr-2" />
        {t("dashboard.importContacts")}
      </Button>
      <Button onClick={handleStartCampaign}>
        <Phone className="h-4 w-4 mr-2" />
        {t("dashboard.startCampaign")}
      </Button>
    </>
  );

  return (
    <DashboardLayout 
      title={t("common.dashboard")} 
      description={t("dashboard.monitorCampaigns")}
      actions={dashboardActions}
    >
      {/* Metrics cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t("dashboard.activeCallsTitle")}
          value={calls ? calls.filter(call => call.status === "In Progress").length : 0}
          icon={Phone}
          actionLabel={t("dashboard.viewAllCalls")}
          actionUrl="/calls"
          color="primary"
        />
        <MetricCard
          title={t("dashboard.appointmentsTitle")}
          value={calls ? calls.filter(call => call.status === "Appointment Set").length : 0}
          icon={Calendar}
          actionLabel={t("dashboard.viewCalendar")}
          actionUrl="/calendar"
          color="success"
        />
        <MetricCard
          title={t("dashboard.followUpsTitle")}
          value={calls ? calls.filter(call => call.followUpStatus === "Sent").length : 0}
          icon={MessageSquare}
          actionLabel={t("dashboard.viewMessages")}
          actionUrl="/messages"
          color="warning"
        />
        <MetricCard
          title={t("dashboard.aiMinutesTitle")}
          value={user?.aiCredits || 0}
          icon={Clock}
          actionLabel={t("dashboard.buyMore")}
          actionUrl="/billing"
          color="accent"
        />
      </div>

      {/* Campaign status section */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{t("dashboard.activeCampaigns")}</h2>
          <Button variant="link" asChild>
            <a href="/campaigns">{t("dashboard.viewAll")}</a>
          </Button>
        </div>
        
        <CampaignTable 
          campaigns={campaigns || []} 
          onManageCampaign={handleManageCampaign} 
        />
      </div>

      {/* Recent calls and contact sections */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent calls */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">{t("dashboard.recentCalls")}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{t("dashboard.latestConversations")}</p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-1" />
              {t("dashboard.refresh")}
            </Button>
          </div>
          
          <CallList calls={recentCalls} />
          
          <div className="px-4 py-3 bg-white text-center border-t border-gray-200 rounded-b-lg">
            <Button variant="link" asChild>
              <a href="/calls">
                {t("dashboard.viewAllCalls")} <BarChart3 className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>

        {/* Recent contacts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">{t("dashboard.recentContacts")}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{t("dashboard.recentContactsDesc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/contacts/new")}>
              <Upload className="h-4 w-4 mr-1" />
              {t("dashboard.addNew")}
            </Button>
          </div>
          
          <ContactList 
            contacts={recentContacts} 
            onCallContact={handleCallContact} 
          />
          
          <div className="px-4 py-3 bg-white text-center border-t border-gray-200 rounded-b-lg">
            <Button variant="link" asChild>
              <a href="/contacts">
                {t("dashboard.viewAll")} <BarChart3 className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
