import React from "react";
import { Call } from "@shared/schema";
import { Contact } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Phone } from "lucide-react";
import { format } from "date-fns";

interface CallListProps {
  calls: Array<Call & { contact: Contact }>;
  maxHeight?: string;
}

const CallList: React.FC<CallListProps> = ({ calls, maxHeight = "300px" }) => {
  // Function to determine the badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "appointment set":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Appointment Set
          </Badge>
        );
      case "callback":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Callback
          </Badge>
        );
      case "no answer":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            No Answer
          </Badge>
        );
      case "voicemail":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Voicemail
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  // Function to format call duration in MM:SS format
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-4 py-3 sm:px-6 bg-gray-50 border-t border-gray-200">
      <ScrollArea className={`h-[${maxHeight}]`}>
        <ul className="divide-y divide-gray-200">
          {calls.length === 0 ? (
            <li className="py-8 text-center text-gray-500">
              No calls found. Start a campaign to make calls.
            </li>
          ) : (
            calls.map((call) => (
              <li key={call.id} className="py-3">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    {call.contact.profilePicture ? (
                      <img 
                        className="h-10 w-10 rounded-full" 
                        src={call.contact.profilePicture} 
                        alt={`${call.contact.fullName} profile`} 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {call.contact.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{call.contact.fullName}</p>
                      <p className="text-xs text-gray-500">{call.contact.companyName}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    {getStatusBadge(call.status)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500 flex justify-between">
                  <span className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {format(new Date(call.createdAt), "MMM d, h:mm a")}
                  </span>
                  <span className="flex items-center">
                    <Phone className="mr-1 h-4 w-4" />
                    {formatDuration(call.duration)}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </div>
  );
};

export default CallList;
