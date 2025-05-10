import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Campaign, Call, Contact } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CampaignForm from "@/components/campaigns/CampaignForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  Trash,
  Edit,
  Phone,
  RefreshCcw,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const CampaignDetail: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/campaigns/:id");
  const campaignId = params?.id ? parseInt(params.id) : undefined;
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch campaign data
  const { data: campaign, isLoading: isLoadingCampaign } = useQuery<Campaign>({
    queryKey: ['/api/campaigns', campaignId],
    enabled: !!campaignId,
  });

  // Fetch calls for this campaign
  const { data: calls, isLoading: isLoadingCalls } = useQuery<Call[]>({
    queryKey: ['/api/calls', { campaignId }],
    enabled: !!campaignId,
  });

  // Fetch contacts for this campaign (in a real app, this would be filtered by campaign)
  const { data: contacts, isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Update campaign status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PUT', `/api/campaigns/${campaignId}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId] });
      toast({
        title: "Success",
        description: "Campaign status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign status",
        variant: "destructive",
      });
    },
  });

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/campaigns/${campaignId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      setLocation("/campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });

  // Handle delete
  const handleDelete = () => {
    deleteMutation.mutate();
    setIsDeleteDialogOpen(false);
  };

  // Handle status toggle
  const handleStatusToggle = () => {
    if (!campaign) return;
    
    const newStatus = campaign.status === "active" ? "paused" : "active";
    updateStatusMutation.mutate(newStatus);
  };

  // Handle complete
  const handleComplete = () => {
    if (!campaign) return;
    updateStatusMutation.mutate("completed");
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {status}
          </Badge>
        );
      case "failed":
      case "no answer":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {status}
          </Badge>
        );
      case "appointment set":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {status}
          </Badge>
        );
      case "voicemail":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {status}
          </Badge>
        );
    }
  };

  // Dashboard actions
  const backAction = (
    <Button variant="outline" onClick={() => setLocation("/campaigns")}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Campaigns
    </Button>
  );

  // Loading state
  if (isLoadingCampaign) {
    return (
      <DashboardLayout title="Campaign Details" actions={backAction}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Campaign not found
  if (!campaign && !isLoadingCampaign) {
    return (
      <DashboardLayout title="Campaign Not Found" actions={backAction}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500">The campaign you're looking for doesn't exist or has been deleted.</p>
              <Button className="mt-4" onClick={() => setLocation("/campaigns")}>
                View All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // If in editing mode, show the form
  if (isEditing && campaign) {
    return (
      <DashboardLayout 
        title="Edit Campaign"
        description="Update your campaign settings"
        actions={backAction}
      >
        <CampaignForm 
          campaignId={campaignId} 
          onSuccess={() => setIsEditing(false)} 
        />
      </DashboardLayout>
    );
  }

  // Calls for campaign count
  const campaignCalls = calls || [];
  const totalCalls = campaignCalls.length;
  const successfulCalls = campaignCalls.filter(
    call => call.status === "Completed" || call.status === "Appointment Set"
  ).length;
  const appointmentsSet = campaignCalls.filter(
    call => call.status === "Appointment Set"
  ).length;
  const totalDuration = campaignCalls.reduce((total, call) => total + call.duration, 0);

  return (
    <DashboardLayout 
      title={campaign?.name || "Campaign Details"}
      description={`${campaign?.industry} - ${campaign?.status}`}
      actions={backAction}
    >
      {campaign && (
        <>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={campaign.status === "active" ? "default" : "outline"}
              onClick={handleStatusToggle}
              disabled={updateStatusMutation.isPending || campaign.status === "completed"}
            >
              {campaign.status === "active" ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Campaign
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {campaign.status === "completed" ? "Completed" : "Resume Campaign"}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Campaign
            </Button>

            <Button
              variant="outline"
              onClick={handleComplete}
              disabled={updateStatusMutation.isPending || campaign.status === "completed"}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Campaign</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this campaign? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending && (
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="script">Script</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-primary-500 mr-2" />
                      <div className="text-2xl font-bold">{totalCalls}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Successful Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-2xl font-bold">{successfulCalls}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Appointments Set</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                      <div className="text-2xl font-bold">{appointmentsSet}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Call Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-purple-500 mr-2" />
                      <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>Information about this campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1">{campaign.description || "No description provided"}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                      <p className="mt-1">{campaign.industry}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <div className="mt-1">
                        {campaign.status === "active" ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : campaign.status === "paused" ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            Paused
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created On</h3>
                      <p className="mt-1">{format(new Date(campaign.createdAt), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calls tab */}
            <TabsContent value="calls">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Calls</CardTitle>
                  <CardDescription>
                    Calls made as part of this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Follow-up</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingCalls ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">Loading calls...</p>
                          </TableCell>
                        </TableRow>
                      ) : campaignCalls.length > 0 ? (
                        campaignCalls.map((call) => {
                          const contact = contacts?.find(c => c.id === call.contactId);
                          return (
                            <TableRow key={call.id}>
                              <TableCell>{contact?.fullName || "Unknown"}</TableCell>
                              <TableCell>{format(new Date(call.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                              <TableCell>{formatDuration(call.duration)}</TableCell>
                              <TableCell>{getStatusBadge(call.status)}</TableCell>
                              <TableCell>
                                {call.followUpStatus ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800">
                                    {call.followUpStatus}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                    None
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-gray-500">No calls have been made for this campaign yet.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contacts tab */}
            <TabsContent value="contacts">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Campaign Contacts</CardTitle>
                      <CardDescription>
                        Contacts associated with this campaign
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setLocation("/contacts/import")}>
                      <Users className="h-4 w-4 mr-2" />
                      Import Contacts
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingContacts ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">Loading contacts...</p>
                          </TableCell>
                        </TableRow>
                      ) : contacts && contacts.length > 0 ? (
                        contacts.slice(0, 5).map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">{contact.fullName}</TableCell>
                            <TableCell>{contact.companyName}</TableCell>
                            <TableCell>{contact.phoneNumber}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                {contact.status || "New"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setLocation(`/calls/new?contactId=${contact.id}&campaignId=${campaignId}`)}
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <p className="text-gray-500">No contacts have been added to this campaign yet.</p>
                            <Button className="mt-4" onClick={() => setLocation("/contacts/import")}>
                              Import Contacts
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Script tab */}
            <TabsContent value="script">
              <Card>
                <CardHeader>
                  <CardTitle>Call Script</CardTitle>
                  <CardDescription>
                    Script used by the AI assistant during calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {campaign.script ? (
                    <div className="prose max-w-none">
                      <pre className="p-4 bg-gray-50 rounded-lg text-sm">
                        {campaign.script}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No script has been created for this campaign yet.</p>
                      <Button className="mt-4" onClick={() => setIsEditing(true)}>
                        Create Script
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardLayout>
  );
};

export default CampaignDetail;