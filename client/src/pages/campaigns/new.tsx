import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CampaignForm from "@/components/campaigns/CampaignForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const NewCampaign: React.FC = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  // Handle success (after form submission)
  const handleSuccess = () => {
    setLocation("/campaigns");
  };

  // Dashboard actions
  const backAction = (
    <Button variant="outline" onClick={() => setLocation("/campaigns")}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Campaigns
    </Button>
  );

  return (
    <DashboardLayout 
      title="Create New Campaign"
      description="Set up an automated AI calling campaign"
      actions={backAction}
    >
      <CampaignForm onSuccess={handleSuccess} />
    </DashboardLayout>
  );
};

export default NewCampaign;