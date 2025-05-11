import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { 
  Mail, 
  MessageSquare, 
  Search, 
  Phone, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Filter,
  PlusCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  type: "sms" | "email";
  content: string;
  contactName: string;
  contactCompany?: string;
  contactId: number;
  timestamp: string;
  status: "sent" | "delivered" | "failed" | "pending";
  campaignId?: number;
  campaignName?: string;
}

const MessagesPage: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [messageTab, setMessageTab] = useState<"all" | "sms" | "email">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "delivered" | "failed" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      try {
        // This will be replaced with actual API call
        // For now, using demo data
        return [
          {
            id: 1,
            type: "sms",
            content: "Hello John, this is a follow-up from our call earlier today. As discussed, I've scheduled a meeting for next week. Please confirm if the time works for you.",
            contactName: "John Smith",
            contactCompany: "Acme Corp",
            contactId: 1,
            timestamp: new Date().toISOString(),
            status: "delivered",
            campaignId: 1,
            campaignName: "Q2 Sales Outreach"
          },
          {
            id: 2,
            type: "email",
            content: "Dear Sarah,\n\nThank you for your time on our call today. I'm excited about the possibility of working together. As promised, I've attached the proposal document for your review.\n\nPlease let me know if you have any questions.\n\nBest regards,\nReachImpact Team",
            contactName: "Sarah Johnson",
            contactCompany: "Globex Inc",
            contactId: 2,
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            status: "sent",
            campaignId: 1,
            campaignName: "Q2 Sales Outreach"
          },
          {
            id: 3,
            type: "sms",
            content: "Michael, this is a reminder about our scheduled call tomorrow at 2 PM. Looking forward to discussing your needs.",
            contactName: "Michael Brown",
            contactCompany: "Initech",
            contactId: 3,
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            status: "pending",
            campaignId: 2,
            campaignName: "Follow-up Campaign"
          },
          {
            id: 4,
            type: "email",
            content: "Hello Emily,\n\nI noticed you missed our scheduled call today. I'd love to reschedule at your convenience to discuss how our solutions can address your business needs.\n\nPlease let me know a time that works for you.\n\nBest regards,\nReachImpact Team",
            contactName: "Emily Davis",
            contactCompany: "Massive Dynamics",
            contactId: 4,
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
            status: "failed",
            campaignId: 2,
            campaignName: "Follow-up Campaign"
          }
        ];
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        return [];
      }
    }
  });

  // Filter messages based on selected tab and filters
  const filteredMessages = messages.filter(message => {
    // Filter by message type
    if (messageTab !== "all" && message.type !== messageTab) {
      return false;
    }
    
    // Filter by status
    if (statusFilter !== "all" && message.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        message.contactName.toLowerCase().includes(query) ||
        (message.contactCompany && message.contactCompany.toLowerCase().includes(query)) ||
        message.content.toLowerCase().includes(query) ||
        (message.campaignName && message.campaignName.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);
  };

  const handleComposeMessage = () => {
    toast({
      title: "Message Sent",
      description: "Your message has been successfully sent.",
    });
    setIsComposeModalOpen(false);
  };

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "sent":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Message["status"]) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "sent":
        return "Sent";
      case "failed":
        return "Failed";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Message copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-gray-500">Manage your SMS and email communications</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsComposeModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message Types</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Tabs 
                value={messageTab} 
                onValueChange={(value) => setMessageTab(value as "all" | "sms" | "email")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Message Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "sent" | "delivered" | "failed" | "pending")}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search">Search Messages</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Search contact, content..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Message Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Total Messages</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">SMS Messages</span>
                  <span className="font-medium">{messages.filter(m => m.type === "sms").length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Email Messages</span>
                  <span className="font-medium">{messages.filter(m => m.type === "email").length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Delivery Rate</span>
                  <span className="font-medium">
                    {messages.length ? 
                      `${Math.round((messages.filter(m => m.status === "delivered" || m.status === "sent").length / messages.length) * 100)}%` : 
                      "0%"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main message list */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {messageTab === "all" ? "All Messages" : 
                 messageTab === "sms" ? "SMS Messages" : "Email Messages"}
              </CardTitle>
              <CardDescription>
                {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full"></div>
                </div>
              ) : filteredMessages.length > 0 ? (
                <div className="space-y-4">
                  {filteredMessages.map(message => (
                    <div 
                      key={message.id} 
                      className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleMessageClick(message)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-full ${
                            message.type === "sms" ? "bg-blue-100" : "bg-purple-100"
                          } flex items-center justify-center`}>
                            {message.type === "sms" ? (
                              <MessageSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Mail className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {message.contactName}
                              {message.contactCompany && (
                                <span className="text-gray-500 ml-1">({message.contactCompany})</span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(parseISO(message.timestamp), "MMM d, h:mm a")}
                              {message.campaignName && (
                                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                  {message.campaignName}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(message.status)}
                          <span className="text-xs text-gray-500">
                            {getStatusText(message.status)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        {message.content.length > 120
                          ? `${message.content.substring(0, 120)}...`
                          : message.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                    {messageTab === "email" ? (
                      <Mail className="h-6 w-6 text-gray-500" />
                    ) : messageTab === "sms" ? (
                      <MessageSquare className="h-6 w-6 text-gray-500" />
                    ) : (
                      <Mail className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium mb-1">No messages found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery
                      ? "No messages match your search criteria."
                      : statusFilter !== "all"
                      ? `No ${statusFilter} messages found.`
                      : `No ${messageTab === "all" ? "" : messageTab} messages found.`}
                  </p>
                  <Button onClick={() => setIsComposeModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Compose New Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* View Message Modal */}
      {selectedMessage && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedMessage.type === "sms" ? "SMS Message" : "Email Message"}
              </DialogTitle>
              <DialogDescription>
                Sent to {selectedMessage.contactName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${
                    selectedMessage.type === "sms" ? "bg-blue-100" : "bg-purple-100"
                  } flex items-center justify-center`}>
                    {selectedMessage.type === "sms" ? (
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Mail className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedMessage.contactName}</p>
                    {selectedMessage.contactCompany && (
                      <p className="text-sm text-gray-500">{selectedMessage.contactCompany}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(selectedMessage.status)}
                  <span className="text-sm">
                    {getStatusText(selectedMessage.status)}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">
                  {format(parseISO(selectedMessage.timestamp), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                {selectedMessage.campaignName && (
                  <div className="mt-1">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                      Campaign: {selectedMessage.campaignName}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mt-2 whitespace-pre-wrap relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(selectedMessage.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <p className="text-sm">{selectedMessage.content}</p>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
              <Button 
                variant={selectedMessage.status === "failed" ? "default" : "outline"}
                onClick={() => {
                  toast({
                    title: "Message resent",
                    description: "Your message has been resent successfully.",
                  });
                  setIsViewModalOpen(false);
                }}
              >
                {selectedMessage.status === "failed" ? "Retry Sending" : "Resend"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Compose Message Modal */}
      <Dialog open={isComposeModalOpen} onOpenChange={setIsComposeModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>
              Send a new SMS or email message
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Tabs defaultValue="sms" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="sms">SMS</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sms" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-recipient">Recipient</Label>
                  <Select>
                    <SelectTrigger id="sms-recipient">
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Smith (Acme Corp)</SelectItem>
                      <SelectItem value="2">Sarah Johnson (Globex Inc)</SelectItem>
                      <SelectItem value="3">Michael Brown (Initech)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="sms-message">Message</Label>
                    <span className="text-xs text-gray-500">0/160 characters</span>
                  </div>
                  <Textarea 
                    id="sms-message" 
                    placeholder="Type your SMS message here..." 
                    className="min-h-[120px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sms-campaign">Campaign (Optional)</Label>
                  <Select>
                    <SelectTrigger id="sms-campaign">
                      <SelectValue placeholder="Assign to a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Q2 Sales Outreach</SelectItem>
                      <SelectItem value="2">Follow-up Campaign</SelectItem>
                      <SelectItem value="3">Product Launch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-recipient">Recipient</Label>
                  <Select>
                    <SelectTrigger id="email-recipient">
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Smith (Acme Corp)</SelectItem>
                      <SelectItem value="2">Sarah Johnson (Globex Inc)</SelectItem>
                      <SelectItem value="3">Michael Brown (Initech)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input id="email-subject" placeholder="Email subject" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-message">Message</Label>
                  <Textarea 
                    id="email-message" 
                    placeholder="Type your email message here..." 
                    className="min-h-[150px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-campaign">Campaign (Optional)</Label>
                  <Select>
                    <SelectTrigger id="email-campaign">
                      <SelectValue placeholder="Assign to a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Q2 Sales Outreach</SelectItem>
                      <SelectItem value="2">Follow-up Campaign</SelectItem>
                      <SelectItem value="3">Product Launch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComposeMessage}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesPage;