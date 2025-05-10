import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Call, Contact } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Phone, Search, UserPlus, Download, Play, BarChart } from "lucide-react";
import { useLocation } from "wouter";

const Calls: React.FC = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch calls and contacts
  const { data: calls, isLoading: callsLoading } = useQuery<Call[]>({
    queryKey: ['/api/calls'],
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Wait for both queries to finish
  const isLoading = callsLoading || contactsLoading;

  // Combine calls with contact info
  const callsWithContacts = calls?.map(call => {
    const contact = contacts?.find(c => c.id === call.contactId);
    return {
      ...call,
      contactName: contact?.fullName || "Unknown",
      companyName: contact?.companyName || "Unknown"
    };
  }) || [];

  // Filter calls based on search query
  const filteredCalls = callsWithContacts.filter(call => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      call.contactName.toLowerCase().includes(query) ||
      call.companyName.toLowerCase().includes(query) ||
      call.status.toLowerCase().includes(query)
    );
  });

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "appointment set":
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {status}
          </Badge>
        );
      case "no answer":
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            {status}
          </Badge>
        );
      case "callback":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            {status}
          </Badge>
        );
      case "voicemail":
      case "busy":
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
  const callsActions = (
    <>
      <Button variant="outline" onClick={() => setLocation("/contacts/new")}>
        <UserPlus className="h-4 w-4 mr-2" />
        Add Contact
      </Button>
      <Button onClick={() => setLocation("/calls/new")}>
        <Phone className="h-4 w-4 mr-2" />
        Make Call
      </Button>
    </>
  );

  return (
    <DashboardLayout 
      title={t("common.calls")} 
      description="Track and manage your AI conversations"
      actions={callsActions}
    >
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search calls..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Calls list */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading calls...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCalls.length > 0 ? (
                filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">{call.contactName}</TableCell>
                    <TableCell>{call.companyName}</TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {call.recordingUrl && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {call.transcript && (
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/calls/${call.id}`)}>
                          <BarChart className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-gray-500">No calls found.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery 
                        ? "Try a different search term or clear your search." 
                        : "Start making calls to your contacts using our AI assistant."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Calls;
