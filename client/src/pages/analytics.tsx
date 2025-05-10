import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Call, Campaign } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownToLine, BarChart2, BarChart, Phone, CalendarCheck, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

const Analytics: React.FC = () => {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState("30d");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch calls data
  const { data: calls, isLoading: callsLoading } = useQuery<Call[]>({
    queryKey: ['/api/calls'],
  });

  // Fetch campaigns data
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  const isLoading = callsLoading || campaignsLoading;

  // Calculate overview metrics
  const metrics = {
    totalCalls: calls?.length || 0,
    answeredCalls: calls?.filter(call => call.status !== "No Answer" && call.status !== "Failed").length || 0,
    appointmentsSet: calls?.filter(call => call.status === "Appointment Set").length || 0,
    totalDuration: calls?.reduce((total, call) => total + call.duration, 0) || 0,
    conversionRate: calls?.length 
      ? Math.round((calls.filter(call => call.status === "Appointment Set").length / calls.length) * 100) 
      : 0
  };

  // Format duration as hours and minutes
  const formatTotalDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Prepare data for bar chart
  const callsByDay = [
    { name: 'Mon', calls: 12, appointments: 3 },
    { name: 'Tue', calls: 19, appointments: 5 },
    { name: 'Wed', calls: 15, appointments: 4 },
    { name: 'Thu', calls: 21, appointments: 6 },
    { name: 'Fri', calls: 18, appointments: 4 },
    { name: 'Sat', calls: 5, appointments: 1 },
    { name: 'Sun', calls: 3, appointments: 0 },
  ];

  // Prepare data for pie chart
  const callStatusData = [
    { name: 'Appointment Set', value: metrics.appointmentsSet, color: '#10B981' },
    { name: 'Callback', value: calls?.filter(call => call.status === "Callback").length || 0, color: '#3B82F6' },
    { name: 'Voicemail', value: calls?.filter(call => call.status === "Voicemail").length || 0, color: '#F59E0B' },
    { name: 'No Answer', value: calls?.filter(call => call.status === "No Answer").length || 0, color: '#EF4444' },
    { name: 'Other', value: calls?.filter(call => !["Appointment Set", "Callback", "Voicemail", "No Answer"].includes(call.status)).length || 0, color: '#6B7280' },
  ];

  return (
    <DashboardLayout 
      title={t("common.analytics")} 
      description="Monitor your calling performance and campaign results"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Phone className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Calls</p>
                  <p className="text-2xl font-bold">{metrics.totalCalls}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CalendarCheck className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Appointments</p>
                  <p className="text-2xl font-bold">{metrics.appointmentsSet}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-violet-100 p-3 rounded-full">
                  <Clock className="h-5 w-5 text-violet-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Duration</p>
                  <p className="text-2xl font-bold">{formatTotalDuration(metrics.totalDuration)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-amber-100 p-3 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Campaign Analytics</CardTitle>
              <CardDescription>
                Track call performance and conversion metrics
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 md:mt-0">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All campaigns</SelectItem>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Calls by Day</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={callsByDay}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="calls" fill="#3B82F6" name="Total Calls" />
                          <Bar dataKey="appointments" fill="#10B981" name="Appointments" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Call Status Distribution</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={callStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {callStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="calls">
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <BarChart className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-4 text-lg font-medium text-gray-700">Detailed Call Analytics</p>
                  <p className="mt-2 text-gray-500">This feature is coming soon.</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="appointments">
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <CalendarCheck className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-4 text-lg font-medium text-gray-700">Appointment Analytics</p>
                  <p className="mt-2 text-gray-500">This feature is coming soon.</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sentiment">
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <BarChart2 className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-4 text-lg font-medium text-gray-700">Conversation Sentiment Analysis</p>
                  <p className="mt-2 text-gray-500">This feature is coming soon.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Analytics;
