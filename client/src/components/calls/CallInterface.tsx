import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact } from "@shared/schema";
import { makeCall, getCallStatus, endCall, CallStatus } from "@/lib/twilio";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, Clock, MessageSquare, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CallInterfaceProps {
  contactId: number;
  campaignId?: number;
  onCallComplete?: (success: boolean) => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({
  contactId,
  campaignId,
  onCallComplete,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [duration, setDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch contact information
  const { data: contact, isLoading: isLoadingContact } = useQuery<Contact>({
    queryKey: ["/api/contacts/" + contactId],
    enabled: !!contactId,
  });

  // Mutation for starting a call
  const startCallMutation = useMutation({
    mutationFn: async () => {
      if (!contact || !user) return null;
      
      return makeCall({
        userId: user.id,
        contactId,
        campaignId,
        phoneNumber: contact.phoneNumber,
        language: user.preferredLanguage,
      });
    },
    onSuccess: (data) => {
      if (!data) return;
      
      setCallSid(data.sid);
      setCallStatus(data);
      toast({
        title: "Call initiated",
        description: `Calling ${contact?.fullName}...`,
      });
      
      // Start timer
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      setTimerInterval(interval);
    },
    onError: (error) => {
      console.error("Error starting call:", error);
      toast({
        title: "Call failed",
        description: "Could not initiate call. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for ending a call
  const endCallMutation = useMutation({
    mutationFn: async () => {
      if (!callSid) return null;
      return endCall(callSid);
    },
    onSuccess: () => {
      toast({
        title: "Call ended",
        description: "Call has been ended successfully.",
      });
      
      // Create call record in database
      createCallRecordMutation.mutate();
    },
    onError: (error) => {
      console.error("Error ending call:", error);
      toast({
        title: "Error",
        description: "Failed to end call properly.",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating a call record
  const createCallRecordMutation = useMutation({
    mutationFn: async () => {
      if (!callStatus || !contact) return null;
      
      const response = await apiRequest("POST", "/api/calls", {
        contactId,
        campaignId,
        status: callStatus.status === "completed" ? "Completed" : "No Answer",
        duration,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      if (onCallComplete) {
        onCallComplete(true);
      }
    },
    onError: (error) => {
      console.error("Error creating call record:", error);
    },
  });

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Poll for call status updates
  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null;
    
    if (callSid) {
      statusInterval = setInterval(async () => {
        try {
          const status = await getCallStatus(callSid);
          setCallStatus(status);
          
          // If call is completed or failed, clean up
          if (["completed", "busy", "failed", "no-answer", "canceled"].includes(status.status)) {
            if (timerInterval) {
              clearInterval(timerInterval);
              setTimerInterval(null);
            }
            
            if (statusInterval) {
              clearInterval(statusInterval);
            }
            
            // Create call record
            createCallRecordMutation.mutate();
          }
        } catch (error) {
          console.error("Error fetching call status:", error);
        }
      }, 3000);
    }
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [callSid, timerInterval]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get call status color and text
  const getCallStatusInfo = () => {
    if (!callStatus) return { color: "default", text: "Not started" };
    
    switch (callStatus.status) {
      case "queued":
        return { color: "warning", text: "Queued" };
      case "ringing":
        return { color: "warning", text: "Ringing" };
      case "in-progress":
        return { color: "success", text: "In Progress" };
      case "completed":
        return { color: "default", text: "Completed" };
      case "busy":
        return { color: "destructive", text: "Busy" };
      case "failed":
        return { color: "destructive", text: "Failed" };
      case "no-answer":
        return { color: "warning", text: "No Answer" };
      case "canceled":
        return { color: "default", text: "Canceled" };
      default:
        return { color: "default", text: callStatus.status };
    }
  };

  const { color, text } = getCallStatusInfo();

  if (isLoadingContact) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
          <p className="text-center mt-4">Loading contact information...</p>
        </CardContent>
      </Card>
    );
  }

  if (!contact) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-500">Contact not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Call {contact.fullName}</span>
          <Badge variant={color as any}>{text}</Badge>
        </CardTitle>
        <CardDescription>
          {contact.companyName && `${contact.companyName} · `}
          {contact.phoneNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Call duration */}
          {(callStatus && callStatus.status === "in-progress") && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="font-medium">Call Duration</span>
                </div>
                <span className="text-lg font-bold">{formatDuration(duration)}</span>
              </div>
              <Progress value={Math.min(duration / 300 * 100, 100)} className="h-2" />
            </div>
          )}
          
          {/* AI conversation status */}
          {callStatus && (
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">AI Conversation Status</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-500" />
                  <span>Call Status: {text}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                  <span>Appointment: Not set</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1 text-gray-500" />
                  <span>Follow-up: Not sent</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <span>Duration: {formatDuration(duration)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!callSid ? (
          <Button
            onClick={() => startCallMutation.mutate()}
            disabled={startCallMutation.isPending}
            className="w-full"
          >
            <Phone className="mr-2 h-4 w-4" />
            Start AI Call
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={() => endCallMutation.mutate()}
            disabled={endCallMutation.isPending || !["in-progress", "ringing"].includes(callStatus?.status || "")}
            className="w-full"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            End Call
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CallInterface;
