import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { LucideShield, Bell, Globe, Smartphone, LogOut } from "lucide-react";
import { supportedLanguages } from "@/lib/i18n";

const Settings: React.FC = () => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");

  // Fetch user profile
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user/profile'],
  });

  // Toggle notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [campaignUpdates, setCampaignUpdates] = useState(true);

  // UI language (separate from AI language)
  const [uiLanguage, setUiLanguage] = useState("en");

  // Interface theme
  const [theme, setTheme] = useState("light");

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Update notification settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest("PUT", "/api/user/settings", settings);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating settings:", error);
    },
  });

  const handleSaveGeneralSettings = () => {
    updateSettingsMutation.mutate({
      notifications: {
        email: emailNotifications,
        sms: smsNotifications,
        appointments: appointmentReminders,
        campaigns: campaignUpdates,
      },
      uiLanguage,
      theme,
    });
  };

  const handleSaveSecuritySettings = () => {
    updateSettingsMutation.mutate({
      security: {
        twoFactorEnabled,
      },
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
      console.error("Error logging out:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title={t("common.settings")}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={t("common.settings")} 
      description="Manage your account settings and preferences"
    >
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your user interface and notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <Bell className="h-5 w-5 mr-2 text-gray-500" />
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications" className="text-base">SMS Notifications</Label>
                    <Switch
                      id="sms-notifications"
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="appointment-reminders" className="text-base">Appointment Reminders</Label>
                    <Switch
                      id="appointment-reminders"
                      checked={appointmentReminders}
                      onCheckedChange={setAppointmentReminders}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="campaign-updates" className="text-base">Campaign Updates</Label>
                    <Switch
                      id="campaign-updates"
                      checked={campaignUpdates}
                      onCheckedChange={setCampaignUpdates}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <Globe className="h-5 w-5 mr-2 text-gray-500" />
                  Interface Language
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {supportedLanguages.map((lang) => (
                    <div key={lang.code} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`lang-${lang.code}`}
                        name="interface-language"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        checked={uiLanguage === lang.code}
                        onChange={() => setUiLanguage(lang.code)}
                      />
                      <Label htmlFor={`lang-${lang.code}`}>{lang.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <Smartphone className="h-5 w-5 mr-2 text-gray-500" />
                  Interface Theme
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="theme-light"
                      name="interface-theme"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      checked={theme === "light"}
                      onChange={() => setTheme("light")}
                    />
                    <Label htmlFor="theme-light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="theme-dark"
                      name="interface-theme"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      checked={theme === "dark"}
                      onChange={() => setTheme("dark")}
                    />
                    <Label htmlFor="theme-dark">Dark</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="theme-system"
                      name="interface-theme"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      checked={theme === "system"}
                      onChange={() => setTheme("system")}
                    />
                    <Label htmlFor="theme-system">System</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSaveGeneralSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium flex items-center mb-4">
                  <LucideShield className="h-5 w-5 mr-2 text-gray-500" />
                  Two-Factor Authentication
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor" className="text-base">Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input type="password" id="current-password" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input type="password" id="new-password" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input type="password" id="confirm-password" className="mt-1" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSaveSecuritySettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account data and subscription.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Email:</span> {user?.email}</p>
                  <p><span className="font-medium">Account Type:</span> {user?.role}</p>
                  <p><span className="font-medium">Member Since:</span> {new Date(user?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Subscription & Billing</h3>
                <Button variant="outline" onClick={() => window.location.href = "/billing"}>
                  Manage Subscription
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Data & Privacy</h3>
                <div className="space-y-4">
                  <Button variant="outline">Export My Data</Button>
                  <Button variant="outline" className="text-red-600 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button
                onClick={() => window.location.href = "/profile"}
              >
                Edit Profile
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
