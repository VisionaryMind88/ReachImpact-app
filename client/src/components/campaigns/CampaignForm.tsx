import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insertCampaignSchema, Campaign } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact } from "@shared/schema";
import { AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Extend the insert schema with additional validation
const campaignFormSchema = insertCampaignSchema
  .omit({ id: true, userId: true, createdAt: true })
  .extend({
    name: z.string().min(3, "Campaign name must be at least 3 characters"),
    industry: z.string().min(2, "Industry must be at least 2 characters"),
    description: z.string().optional(),
    script: z.string().optional(),
    selectedContactIds: z.array(z.number()).optional(),
  });

// Infer the type from our schema
type CampaignFormValues = z.infer<typeof campaignFormSchema>;

interface CampaignFormProps {
  campaignId?: number; // Optional: If provided, we're editing an existing campaign
  onSuccess?: () => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ campaignId, onSuccess }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const isEditing = !!campaignId;

  // Fetch campaign data if editing
  const { data: campaign, isLoading: isLoadingCampaign } = useQuery<Campaign>({
    queryKey: ['/api/campaigns', campaignId],
    enabled: isEditing,
  });

  // Fetch contacts for selection
  const { data: contacts, isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Form initialization
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      industry: "",
      status: "active",
      description: "",
      script: "",
      selectedContactIds: [],
    },
  });

  // Update form values when campaign data is loaded
  React.useEffect(() => {
    if (campaign && isEditing) {
      form.reset({
        name: campaign.name,
        industry: campaign.industry,
        status: campaign.status,
        description: campaign.description || "",
        script: campaign.script || "",
        // We'd need to fetch related contacts here
      });
    }
  }, [campaign, form, isEditing]);

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: async (data: CampaignFormValues) => {
      const response = await apiRequest('POST', '/api/campaigns', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      // Callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation(`/campaigns/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  // Update campaign mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CampaignFormValues) => {
      const response = await apiRequest('PUT', `/api/campaigns/${campaignId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId] });
      
      // Callback or redirect
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: CampaignFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setLocation("/campaigns");
    }
  };

  // Loading state
  if (isEditing && isLoadingCampaign) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="ml-2">Loading campaign data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Campaign not found
  if (isEditing && !campaign && !isLoadingCampaign) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-12 text-red-500">
            <AlertCircle className="h-8 w-8 mr-2" />
            <p>Campaign not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Campaign" : "Create New Campaign"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Campaign name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Industry */}
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter industry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campaign status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campaign description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the campaign goals and target audience"
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Call script */}
            <FormField
              control={form.control}
              name="script"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Script</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the script for the AI to follow when making calls"
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact selection will be added in a future enhancement */}
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update Campaign" : "Create Campaign"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default CampaignForm;