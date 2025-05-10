import React from "react";
import { Contact } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone } from "lucide-react";

interface ContactListProps {
  contacts: Contact[];
  onCallContact: (contactId: number) => void;
  maxHeight?: string;
}

const ContactList: React.FC<ContactListProps> = ({ 
  contacts, 
  onCallContact, 
  maxHeight = "300px" 
}) => {
  return (
    <div className="px-4 py-3 sm:px-6 bg-gray-50 border-t border-gray-200">
      <ScrollArea className={`h-[${maxHeight}]`}>
        <ul className="divide-y divide-gray-200">
          {contacts.length === 0 ? (
            <li className="py-8 text-center text-gray-500">
              No contacts found. Import or add contacts to get started.
            </li>
          ) : (
            contacts.map((contact) => (
              <li key={contact.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {contact.profilePicture ? (
                      <img 
                        className="h-10 w-10 rounded-full" 
                        src={contact.profilePicture} 
                        alt={`${contact.fullName} profile`} 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {contact.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{contact.fullName}</p>
                      <p className="text-xs text-gray-500">{contact.companyName}</p>
                      <p className="text-xs text-gray-400">{contact.email}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => onCallContact(contact.id)}
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </div>
  );
};

export default ContactList;
