import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar as CalendarComponent, 
  CalendarProps 
} from "@/components/ui/calendar";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format, addHours, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth } from "date-fns";
import { Calendar, Clock, Users, PlusCircle, Filter, CalendarDays, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface AppointmentEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  contactName: string;
  contactCompany: string;
  contactEmail: string;
  contactPhone: string;
  status: "confirmed" | "pending" | "cancelled";
  notes?: string;
  calendarType?: "google" | "outlook" | "internal";
}

const CalendarPage: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null);
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("week");
  const [calendarProvider, setCalendarProvider] = useState<"all" | "google" | "outlook" | "internal">("all");
  const [appointmentFilter, setAppointmentFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery<AppointmentEvent[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      try {
        // This will be replaced with actual API call
        // For now, using demo data
        return [
          {
            id: 1,
            title: "Product Demo",
            startDate: new Date().toISOString(),
            endDate: addHours(new Date(), 1).toISOString(),
            contactName: "John Smith",
            contactCompany: "Acme Corp",
            contactEmail: "john.smith@acmecorp.com",
            contactPhone: "+1 (555) 123-4567",
            status: "confirmed",
            calendarType: "google"
          },
          {
            id: 2,
            title: "Follow-up Call",
            startDate: addHours(new Date(), 3).toISOString(),
            endDate: addHours(new Date(), 4).toISOString(),
            contactName: "Sarah Johnson",
            contactCompany: "Globex Inc",
            contactEmail: "sarah.j@globexinc.com",
            contactPhone: "+1 (555) 234-5678",
            status: "pending",
            calendarType: "outlook"
          },
          {
            id: 3,
            title: "Sales Presentation",
            startDate: addHours(new Date(), 26).toISOString(),
            endDate: addHours(new Date(), 27).toISOString(),
            contactName: "Michael Brown",
            contactCompany: "Initech",
            contactEmail: "michael.b@initech.com",
            contactPhone: "+1 (555) 345-6789",
            status: "confirmed",
            calendarType: "internal"
          }
        ];
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        return [];
      }
    }
  });

  // Filter appointments based on selected date and filters
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = parseISO(appointment.startDate);
    
    // Filter by calendar provider
    if (calendarProvider !== "all" && appointment.calendarType !== calendarProvider) {
      return false;
    }
    
    // Filter by status
    if (appointmentFilter !== "all" && appointment.status !== appointmentFilter) {
      return false;
    }

    // Filter by date view
    if (selectedDate) {
      if (calendarView === "day") {
        return isToday(appointmentDate);
      } else if (calendarView === "week") {
        return isThisWeek(appointmentDate);
      } else {
        return isThisMonth(appointmentDate);
      }
    }
    
    return true;
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: AppointmentEvent) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  };

  const handleConnectCalendar = (provider: "google" | "outlook") => {
    // This would normally redirect to OAuth flow
    toast({
      title: `Connecting to ${provider === "google" ? "Google" : "Outlook"} Calendar`,
      description: "This would redirect to the OAuth authentication page.",
    });
  };

  // For demo purposes, let's also show how to create a new appointment
  const handleCreateAppointment = () => {
    toast({
      title: "Appointment Created",
      description: "Your appointment has been successfully created and synced with your calendar.",
    });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-gray-500">Manage your appointments and calendar integrations</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
          <Select value={calendarView} onValueChange={(value: "day" | "week" | "month") => setCalendarView(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="month">Month View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendars</CardTitle>
              <CardDescription>Connected calendar services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-gray-500">Sync your Google events</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleConnectCalendar("google")}>
                  Connect
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Outlook Calendar</p>
                    <p className="text-sm text-gray-500">Sync your Outlook events</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleConnectCalendar("outlook")}>
                  Connect
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-filter">Calendar Type</Label>
                <Select value={calendarProvider} onValueChange={(value: any) => setCalendarProvider(value)}>
                  <SelectTrigger id="calendar-filter">
                    <SelectValue placeholder="All Calendars" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Calendars</SelectItem>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="outlook">Outlook Calendar</SelectItem>
                    <SelectItem value="internal">ReachImpact Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">Appointment Status</Label>
                <Select value={appointmentFilter} onValueChange={(value: any) => setAppointmentFilter(value)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointments.length > 0 ? (
                appointments
                  .filter(appointment => {
                    const appointmentDate = parseISO(appointment.startDate);
                    return isTomorrow(appointmentDate) || isToday(appointmentDate);
                  })
                  .map(appointment => (
                    <div 
                      key={appointment.id} 
                      className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEventClick(appointment)}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{appointment.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          appointment.status === "confirmed" ? "bg-green-100 text-green-800" : 
                          appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                          "bg-red-100 text-red-800"
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(parseISO(appointment.startDate), "MMM dd, h:mm a")}
                      </p>
                      <p className="text-sm mt-1">{appointment.contactName}</p>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-sm">No upcoming appointments</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Main calendar and appointments */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-6">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="w-full"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {calendarView === "day" ? "Today's" : calendarView === "week" ? "This Week's" : "This Month's"} Appointments
              </CardTitle>
              <CardDescription>
                {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full"></div>
                </div>
              ) : filteredAppointments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAppointments.map(appointment => (
                    <div 
                      key={appointment.id} 
                      className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEventClick(appointment)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.title}</h3>
                          <div className="flex items-center mt-2 text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                              {format(parseISO(appointment.startDate), "EEE, MMM d, yyyy")}
                            </span>
                            <Clock className="h-4 w-4 ml-4 mr-2" />
                            <span className="text-sm">
                              {format(parseISO(appointment.startDate), "h:mm a")} - {format(parseISO(appointment.endDate), "h:mm a")}
                            </span>
                          </div>
                        </div>
                        <span className={`h-fit text-xs px-2 py-1 rounded-full ${
                          appointment.status === "confirmed" ? "bg-green-100 text-green-800" : 
                          appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                          "bg-red-100 text-red-800"
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <p className="font-medium">{appointment.contactName}</p>
                            <p className="text-gray-500">{appointment.contactCompany}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <Calendar className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No appointments found</h3>
                  <p className="text-gray-500 mb-4">
                    {calendarProvider !== "all" 
                      ? `No ${calendarProvider} appointments in the selected view.` 
                      : "No appointments match your current filters."}
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* View Appointment Modal */}
      {selectedEvent && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              <DialogDescription>
                Appointment details
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-primary-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <p className="font-medium">{format(parseISO(selectedEvent.startDate), "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-sm text-gray-500">
                    {format(parseISO(selectedEvent.startDate), "h:mm a")} - {format(parseISO(selectedEvent.endDate), "h:mm a")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-primary-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-500" />
                </div>
                <div>
                  <p className="font-medium">{selectedEvent.contactName}</p>
                  <p className="text-sm text-gray-500">{selectedEvent.contactCompany}</p>
                </div>
              </div>
              
              <div className="pl-12 space-y-1">
                <p className="text-sm">
                  <span className="text-gray-500">Email:</span> {selectedEvent.contactEmail}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Phone:</span> {selectedEvent.contactPhone}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md mt-4">
                <p className="text-sm font-medium mb-1">Calendar:</p>
                <div className="flex items-center">
                  <div className={`h-6 w-6 rounded-full mr-2 flex items-center justify-center ${
                    selectedEvent.calendarType === "google" ? "bg-red-100 text-red-600" :
                    selectedEvent.calendarType === "outlook" ? "bg-blue-100 text-blue-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    <CalendarDays className="h-3 w-3" />
                  </div>
                  <span className="text-sm">
                    {selectedEvent.calendarType === "google" ? "Google Calendar" :
                     selectedEvent.calendarType === "outlook" ? "Outlook Calendar" :
                     "ReachImpact Calendar"}
                  </span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="sm:justify-between">
              <div>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                  selectedEvent.status === "confirmed" ? "bg-green-100 text-green-800" : 
                  selectedEvent.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"
                }`}>
                  {selectedEvent.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                <Button>
                  Edit
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Create Appointment Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment and sync it with your calendar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Meeting title" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Date</Label>
                <Input id="start-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-time">Time</Label>
                <Input id="start-time" type="time" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select defaultValue="30">
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <Select>
                <SelectTrigger id="contact">
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
              <Label htmlFor="calendar">Calendar</Label>
              <Select defaultValue="internal">
                <SelectTrigger id="calendar">
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">ReachImpact Calendar</SelectItem>
                  <SelectItem value="google">Google Calendar</SelectItem>
                  <SelectItem value="outlook">Outlook Calendar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Additional notes..." />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAppointment}>
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;