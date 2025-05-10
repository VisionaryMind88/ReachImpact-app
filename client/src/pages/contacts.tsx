import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ContactUpload from "@/components/contacts/ContactUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, UserPlus, Upload, Search, Trash2, Edit, MoreHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Contacts: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await apiRequest("DELETE", `/api/contacts/${contactId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Contact deleted",
        description: "The contact has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete contact",
        description: "There was an error deleting the contact. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting contact:", error);
    },
  });

  // Filter contacts based on search query
  const filteredContacts = contacts?.filter((contact) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      contact.fullName.toLowerCase().includes(query) ||
      (contact.companyName && contact.companyName.toLowerCase().includes(query)) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      contact.phoneNumber.toLowerCase().includes(query) ||
      (contact.industry && contact.industry.toLowerCase().includes(query))
    );
  });

  // Handle call contact
  const handleCallContact = (contactId: number) => {
    setLocation(`/calls/new?contactId=${contactId}`);
  };

  // Handle edit contact
  const handleEditContact = (contactId: number) => {
    setLocation(`/contacts/${contactId}/edit`);
  };

  // Handle delete contact
  const handleDeleteContact = (contactId: number) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  // Dashboard actions
  const contactsActions = (
    <>
      <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        {t("contacts.import")}
      </Button>
      <Button onClick={() => setLocation("/contacts/new")}>
        <UserPlus className="h-4 w-4 mr-2" />
        {t("contacts.addContact")}
      </Button>
    </>
  );

  return (
    <DashboardLayout 
      title={t("common.contacts")} 
      description="Manage your contacts and start conversations"
      actions={contactsActions}
    >
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search contacts..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts list */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
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
                    <p className="mt-2 text-sm text-gray-500">Loading contacts...</p>
                  </TableCell>
                </TableRow>
              ) : filteredContacts && filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.fullName}</TableCell>
                    <TableCell>{contact.companyName || "-"}</TableCell>
                    <TableCell>{contact.phoneNumber}</TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>{contact.industry || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        contact.status === "new" 
                          ? "bg-blue-100 text-blue-800" 
                          : contact.status === "contacted" 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-green-100 text-green-800"
                      }>
                        {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleCallContact(contact.id)}>
                          <Phone className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditContact(contact.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-gray-500">No contacts found.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery 
                        ? "Try a different search term or clear your search." 
                        : "Get started by adding a new contact or importing from a file."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("contacts.import")}</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file with your contacts. We'll automatically extract the relevant information.
            </DialogDescription>
          </DialogHeader>
          <ContactUpload onUploadComplete={() => setIsUploadDialogOpen(false)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Contacts;
