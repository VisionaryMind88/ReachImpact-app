import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/common/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  PhoneCall, 
  Calendar, 
  BarChart, 
  Mail, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Download,
  Phone,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Play
} from "lucide-react";

// Demo data
const demoContacts = [
  { id: 1, name: "John Smith", company: "Acme Corp", phone: "+1 (555) 123-4567", email: "john.smith@acmecorp.com", industry: "Technology" },
  { id: 2, name: "Sarah Johnson", company: "Globex Inc", phone: "+1 (555) 234-5678", email: "sarah.j@globexinc.com", industry: "Healthcare" },
  { id: 3, name: "Michael Brown", company: "Initech", phone: "+1 (555) 345-6789", email: "michael.b@initech.com", industry: "Finance" },
  { id: 4, name: "Emily Davis", company: "Massive Dynamics", phone: "+1 (555) 456-7890", email: "emily.d@massivedynamics.com", industry: "Technology" },
  { id: 5, name: "David Wilson", company: "Umbrella Corp", phone: "+1 (555) 567-8901", email: "david.w@umbrellacorp.com", industry: "Healthcare" },
  { id: 6, name: "Anna Martinez", company: "Stark Industries", phone: "+1 (555) 678-9012", email: "anna.m@starkindustries.com", industry: "Manufacturing" },
  { id: 7, name: "Robert Taylor", company: "Wayne Enterprises", phone: "+1 (555) 789-0123", email: "robert.t@wayneent.com", industry: "Technology" },
  { id: 8, name: "Jennifer Anderson", company: "Oscorp", phone: "+1 (555) 890-1234", email: "jennifer.a@oscorp.com", industry: "Finance" }
];

// Demo statistics
const demoStats = {
  callsMade: 126,
  appointmentsBooked: 34,
  conversionRate: "27%",
  averageCallDuration: "3:24",
  callsPerHour: 14,
  responseRate: "68%"
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  description?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  change,
  trend
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h4 className="text-2xl font-bold mt-1">{value}</h4>
            {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            {change && (
              <div className="flex items-center mt-2">
                <span className={`text-xs font-medium ${
                  trend === "up" ? "text-green-600" : 
                  trend === "down" ? "text-red-600" : "text-gray-600"
                }`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Demo call simulation component
const CallSimulation: React.FC<{
  contact: typeof demoContacts[0]; 
  onClose: () => void;
}> = ({ contact, onClose }) => {
  const [scenario, setScenario] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("initializing");
  
  useEffect(() => {
    if (scenario) {
      const interval = setInterval(() => {
        if (step < 5) {
          setStep(prev => prev + 1);
          setProgress(prev => Math.min(100, prev + 20));
        } else {
          clearInterval(interval);
        }
      }, 1500);
      
      return () => clearInterval(interval);
    }
  }, [scenario, step]);
  
  const getStatusText = () => {
    if (!scenario) return "Select a scenario";
    
    switch (step) {
      case 0: return "Initializing call...";
      case 1: return "Dialing...";
      case 2: return "Ringing...";
      case 3: 
        if (scenario === "voicemail") return "Connected to voicemail";
        if (scenario === "no-answer") return "No answer";
        return "Connected";
      case 4: 
        if (scenario === "appointment") return "Appointment scheduling";
        if (scenario === "follow-up") return "Discussing follow-up";
        return "Call in progress";
      case 5: 
        if (scenario === "appointment") return "Appointment scheduled!";
        if (scenario === "follow-up") return "Follow-up scheduled";
        if (scenario === "voicemail") return "Left voicemail";
        return "Call completed";
      default: return "Call completed";
    }
  };
  
  const getScenarioTitle = (scenarioId: string) => {
    switch (scenarioId) {
      case "appointment": return "Successful Call: Appointment Scheduled";
      case "follow-up": return "Call – Follow-up Scheduled via SMS/Email";
      case "voicemail": return "Call – Voicemail";
      case "no-answer": return "Call – No answer";
      default: return "Select scenario";
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Call Simulation</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="sr-only">Close</span>
              <AlertCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-lg">{contact.name}</h3>
              <p className="text-gray-500 text-sm">{contact.company}</p>
              <p className="text-gray-500 text-sm">{contact.phone}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <Phone className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          {!scenario ? (
            <div className="space-y-4">
              <h3 className="font-medium">Select a call scenario:</h3>
              <div className="grid grid-cols-1 gap-3">
                {["appointment", "follow-up", "voicemail", "no-answer"].map((s) => (
                  <Button 
                    key={s} 
                    variant="outline" 
                    className="justify-start h-auto py-3"
                    onClick={() => {
                      setScenario(s);
                      setStatus("calling");
                      setStep(0);
                      setProgress(0);
                    }}
                  >
                    {getScenarioTitle(s)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                <strong>Note:</strong> This is a simulation. No actual calls will be made.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{getStatusText()}</span>
                  <span className="text-xs text-gray-500">
                    {scenario === "no-answer" && step >= 3 ? "Failed" : 
                     step >= 5 ? "Completed" : "In progress"}
                  </span>
                </div>
                <Progress value={progress} />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
                <h4 className="font-medium mb-2">Simulation: {getScenarioTitle(scenario)}</h4>
                {step < 3 ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-3 w-3 bg-primary-400 rounded-full"></div>
                      <div className="h-3 w-3 bg-primary-400 rounded-full animation-delay-200"></div>
                      <div className="h-3 w-3 bg-primary-400 rounded-full animation-delay-400"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {step >= 3 && scenario !== "no-answer" && (
                      <div className="flex items-start">
                        <div className="bg-primary-100 text-primary-800 rounded-lg p-3 max-w-[80%]">
                          <p className="text-sm">
                            {scenario === "voicemail" 
                              ? "Hello, this is a message for " + contact.name + ". This is ReachImpact calling about..." 
                              : "Hello, is this " + contact.name + " from " + contact.company + "?"}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {step >= 4 && scenario !== "no-answer" && scenario !== "voicemail" && (
                      <div className="flex items-start justify-end">
                        <div className="bg-gray-200 rounded-lg p-3 max-w-[80%]">
                          <p className="text-sm">Yes, this is {contact.name}. How can I help you?</p>
                        </div>
                      </div>
                    )}
                    
                    {step >= 5 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-medium text-sm mb-2">Call Result:</h5>
                        <div className="flex items-center">
                          {scenario === "appointment" ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Appointment scheduled for tomorrow at 2:00 PM</span>
                            </div>
                          ) : scenario === "follow-up" ? (
                            <div className="flex items-center text-blue-600">
                              <Mail className="h-5 w-5 mr-2" />
                              <span>Email follow-up scheduled for tomorrow</span>
                            </div>
                          ) : scenario === "voicemail" ? (
                            <div className="flex items-center text-yellow-600">
                              <AlertCircle className="h-5 w-5 mr-2" />
                              <span>Voicemail left successfully</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <AlertCircle className="h-5 w-5 mr-2" />
                              <span>No answer after 5 rings</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setScenario(null);
                    setStep(0);
                    setProgress(0);
                  }} 
                  disabled={step < 5}
                >
                  {step < 5 ? "Simulating..." : "Try Another Scenario"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const GuidedTourTooltip: React.FC<{
  title: string;
  description: string;
  position: "top" | "right" | "bottom" | "left";
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  step: number;
  totalSteps: number;
}> = ({ 
  title, 
  description, 
  position, 
  onNext, 
  onPrev, 
  onClose, 
  step, 
  totalSteps 
}) => {
  let positionClasses = "absolute";
  
  switch (position) {
    case "top":
      positionClasses += " bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      break;
    case "right":
      positionClasses += " left-full top-1/2 transform -translate-y-1/2 ml-2";
      break;
    case "bottom":
      positionClasses += " top-full left-1/2 transform -translate-x-1/2 mt-2";
      break;
    case "left":
      positionClasses += " right-full top-1/2 transform -translate-y-1/2 mr-2";
      break;
  }
  
  return (
    <div className={`${positionClasses} z-50 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4`}>
      <h4 className="font-bold text-base mb-1">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Step {step} of {totalSteps}
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={onPrev} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onNext} disabled={step === totalSteps}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const DemoDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedContact, setSelectedContact] = useState<typeof demoContacts[0] | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  
  const handleStartTour = () => {
    setShowTour(true);
    setTourStep(1);
  };
  
  const getTourContent = (step: number) => {
    switch (step) {
      case 1:
        return {
          title: "Welcome to ReachImpact",
          description: "This guided tour will walk you through the main features of our AI-powered calling platform.",
          position: "bottom" as const
        };
      case 2:
        return {
          title: "Dashboard Overview",
          description: "View key metrics and performance indicators for your calling campaigns at a glance.",
          position: "bottom" as const
        };
      case 3:
        return {
          title: "Contact Management",
          description: "Manage your contacts and initiate AI-powered calls directly from the platform.",
          position: "right" as const
        };
      case 4:
        return {
          title: "Multi-language Support",
          description: "ReachImpact supports multiple languages, allowing your AI to communicate with contacts in their preferred language.",
          position: "left" as const
        };
      case 5:
        return {
          title: "Start a Demo Call",
          description: "Click the 'Simulate AI Call' button next to any contact to see how our AI handles different call scenarios.",
          position: "bottom" as const
        };
      default:
        return {
          title: "Tour Complete",
          description: "You've completed the guided tour. Feel free to explore the demo dashboard on your own.",
          position: "bottom" as const
        };
    }
  };
  
  const renderTourTooltip = () => {
    if (!showTour) return null;
    
    const content = getTourContent(tourStep);
    
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
        <div className="relative">
          <GuidedTourTooltip
            title={content.title}
            description={content.description}
            position={content.position}
            onNext={() => setTourStep(prev => Math.min(prev + 1, 5))}
            onPrev={() => setTourStep(prev => Math.max(prev - 1, 1))}
            onClose={() => setShowTour(false)}
            step={tourStep}
            totalSteps={5}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Demo label */}
      <div className="bg-yellow-100 border-b border-yellow-200 py-1 px-4 text-center text-yellow-800 text-sm font-medium">
        <AlertCircle className="inline-block h-4 w-4 mr-1" />
        Demo Mode - All data shown is simulated for demonstration purposes only
      </div>
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary-700 mr-2">ReachImpact</h1>
          <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded text-xs">DEMO</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex"
            onClick={handleStartTour}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Guided Tour
          </Button>
          <LanguageSelector />
          <Button size="sm" onClick={() => setLocation("/demo")}>
            Exit Demo
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-16 md:w-64 bg-white border-r border-gray-200 py-6 flex flex-col">
          <div className="px-4 mb-6 hidden md:block">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              MENU
            </h2>
          </div>
          
          <nav className="flex-1 space-y-1 px-2">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className={`w-full justify-start ${activeTab === "dashboard" ? "" : "hover:bg-gray-100"}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart className="h-5 w-5 mr-3" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
            
            <Button
              variant={activeTab === "contacts" ? "default" : "ghost"}
              className={`w-full justify-start ${activeTab === "contacts" ? "" : "hover:bg-gray-100"}`}
              onClick={() => setActiveTab("contacts")}
            >
              <Users className="h-5 w-5 mr-3" />
              <span className="hidden md:inline">Contacts</span>
            </Button>
            
            <Button
              variant={activeTab === "calls" ? "default" : "ghost"}
              className={`w-full justify-start ${activeTab === "calls" ? "" : "hover:bg-gray-100"}`}
              onClick={() => setActiveTab("calls")}
            >
              <PhoneCall className="h-5 w-5 mr-3" />
              <span className="hidden md:inline">Calls</span>
            </Button>
            
            <Button
              variant={activeTab === "appointments" ? "default" : "ghost"}
              className={`w-full justify-start ${activeTab === "appointments" ? "" : "hover:bg-gray-100"}`}
              onClick={() => setActiveTab("appointments")}
            >
              <Calendar className="h-5 w-5 mr-3" />
              <span className="hidden md:inline">Appointments</span>
            </Button>
          </nav>
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="hidden">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
            </TabsList>
            
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                <p className="text-sm text-gray-500">Demo data updated: Today at 11:30 AM</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard 
                  title="Calls Made" 
                  value={demoStats.callsMade} 
                  icon={PhoneCall} 
                  change="+12% from last week" 
                  trend="up"
                />
                <StatCard 
                  title="Appointments Booked" 
                  value={demoStats.appointmentsBooked} 
                  icon={Calendar} 
                  change="+8% from last week" 
                  trend="up"
                />
                <StatCard 
                  title="Conversion Rate" 
                  value={demoStats.conversionRate} 
                  icon={BarChart} 
                  change="+2% from last week" 
                  trend="up"
                />
                <StatCard 
                  title="Avg. Call Duration" 
                  value={demoStats.averageCallDuration} 
                  icon={Clock} 
                  description="minutes"
                />
                <StatCard 
                  title="Calls Per Hour" 
                  value={demoStats.callsPerHour} 
                  icon={PhoneCall} 
                  change="+4 from last week" 
                  trend="up"
                />
                <StatCard 
                  title="Response Rate" 
                  value={demoStats.responseRate} 
                  icon={CheckCircle} 
                  change="-2% from last week" 
                  trend="down"
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent AI Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {demoContacts.slice(0, 3).map((contact) => (
                        <div key={contact.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <div>
                            <h4 className="font-medium">{contact.name}</h4>
                            <p className="text-sm text-gray-500">{contact.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Today, 10:30 AM</p>
                            <p className="text-xs text-green-600">Appointment Set</p>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full">View All Calls</Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {demoContacts.slice(3, 6).map((contact) => (
                        <div key={contact.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                          <div>
                            <h4 className="font-medium">{contact.name}</h4>
                            <p className="text-sm text-gray-500">{contact.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Tomorrow, 2:00 PM</p>
                            <p className="text-xs text-blue-600">30 min call</p>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full">View Calendar</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Contacts</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download Template
                  </Button>
                  <Button variant="default" size="sm">Import Contacts</Button>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">Industry</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demoContacts.map((contact) => (
                          <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{contact.name}</td>
                            <td className="px-4 py-3 text-gray-700">{contact.company}</td>
                            <td className="px-4 py-3 text-gray-700">{contact.phone}</td>
                            <td className="px-4 py-3 text-gray-700">{contact.email}</td>
                            <td className="px-4 py-3 text-gray-700">{contact.industry}</td>
                            <td className="px-4 py-3 text-right">
                              <Button 
                                onClick={() => setSelectedContact(contact)} 
                                size="sm"
                              >
                                Simulate AI Call
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <div className="text-center text-sm text-gray-500 mt-2">
                <AlertCircle className="inline-block h-4 w-4 mr-1" />
                Demo Mode: Example contact data only
              </div>
            </TabsContent>
            
            {/* Calls Tab */}
            <TabsContent value="calls" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Recent Calls</h2>
                <Button variant="outline" size="sm">
                  Export Report
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="py-12">
                    <div className="inline-flex h-20 w-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                      <PhoneCall className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Demo Call History</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      In the full version, this screen shows your AI call history with detailed analytics and transcripts.
                    </p>
                    <Button
                      onClick={() => {
                        setActiveTab("contacts");
                        setTimeout(() => {
                          setSelectedContact(demoContacts[0]);
                        }, 300);
                      }}
                    >
                      Try a Demo Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Appointments Tab */}
            <TabsContent value="appointments" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Appointments</h2>
                <Button variant="outline" size="sm">
                  Calendar View
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="py-12">
                    <div className="inline-flex h-20 w-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                      <Calendar className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Demo Appointment Calendar</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      In the full version, this screen shows appointments scheduled by your AI assistant with calendar integration.
                    </p>
                    <Button
                      onClick={() => {
                        setActiveTab("contacts");
                        setTimeout(() => {
                          setSelectedContact(demoContacts[0]);
                        }, 300);
                      }}
                    >
                      Try Scheduling a Demo Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Call simulation modal */}
      {selectedContact && (
        <CallSimulation
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
      
      {/* Guided tour */}
      {renderTourTooltip()}
      
      {/* Mobile guided tour button */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <Button 
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={handleStartTour}
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default DemoDashboard;