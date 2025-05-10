import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CampaignTable from "@/components/dashboard/CampaignTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search } from "lucide-react";
import { useLocation } from "wouter";

const Campaigns: React.FC = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  // Filter campaigns based on active tab and search query
  const filteredCampaigns = campaigns?.filter((campaign) => {
    // Filter by tab
    if (activeTab !== "all" && campaign.status.toLowerCase() !== activeTab) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(query) ||
        campaign.industry.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Handle manage campaign
  const handleManageCampaign = (campaignId: number) => {
    setLocation(`/campaigns/${campaignId}`);
  };

  // Handle create campaign
  const handleCreateCampaign = () => {
    setLocation("/campaigns/new");
  };

  // Dashboard actions
  const campaignsActions = (
    <Button onClick={handleCreateCampaign}>
      <PlusCircle className="h-4 w-4 mr-2" />
      New Campaign
    </Button>
  );

  return (
    <DashboardLayout 
      title={t("common.campaigns") || "Campaigns"} 
      description="Manage your AI calling campaigns"
      actions={campaignsActions}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>AI Calling Campaigns</CardTitle>
              <CardDescription>
                Create and manage automated outreach campaigns
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Campaigns</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <CampaignTable 
                  campaigns={filteredCampaigns || []} 
                  onManageCampaign={handleManageCampaign} 
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Campaigns;
