import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { createCheckoutSession, getProducts, Product } from "@/lib/stripe";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, CreditCard, CheckCircle, Clock } from "lucide-react";

const Billing: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("credits");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user profile
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user/profile'],
  });

  // Fetch credit packages
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: getProducts,
    staleTime: Infinity,
  });

  // Mock transaction history
  const transactionHistory = [
    { id: 1, date: '2023-12-15', package: 'Premium Package', credits: 500, amount: '$49.99' },
    { id: 2, date: '2023-11-02', package: 'Standard Package', credits: 200, amount: '$24.99' },
    { id: 3, date: '2023-10-05', package: 'Basic Package', credits: 100, amount: '$14.99' },
  ];

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast({
        title: "Please select a package",
        description: "You need to select a credit package before proceeding.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const session = await createCheckoutSession(selectedPackage);
      
      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Payment error",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = userLoading || productsLoading;

  return (
    <DashboardLayout 
      title="Billing & Credits" 
      description="Manage your AI credits and payment methods"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Coins className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available Credits</p>
                  <p className="text-2xl font-bold">{user?.aiCredits || 0} minutes</p>
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
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Average Call Time</p>
                  <p className="text-2xl font-bold">4.2 minutes</p>
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
                  <CreditCard className="h-5 w-5 text-violet-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Current Plan</p>
                  <p className="text-lg font-bold">Pay As You Go</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Billing</CardTitle>
          <CardDescription>
            Purchase AI credits for calling and manage your payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credits" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="credits">Buy Credits</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            </TabsList>
            
            <TabsContent value="credits">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div>
                  <p className="mb-6 text-gray-600">
                    Purchase AI calling credits to make automated outbound calls. Credits are measured in minutes of AI conversation time.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Credit packages */}
                    {products ? (
                      products.map(product => (
                        <Card 
                          key={product.id} 
                          className={`cursor-pointer transition-all ${
                            selectedPackage === product.id 
                              ? 'ring-2 ring-primary-500 ring-offset-2' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedPackage(product.id)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription>{product.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="text-3xl font-bold mb-2">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: product.currency,
                              }).format(product.price / 100)}
                            </div>
                            <div className="text-md text-primary-600 font-medium">
                              {product.credits} minutes
                            </div>
                          </CardContent>
                          <CardFooter className="pt-3 border-t">
                            {selectedPackage === product.id && (
                              <div className="flex items-center text-primary-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">Selected</span>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      // Fallback credit packages if API fails
                      [
                        { id: 'basic', name: 'Basic', description: 'Perfect for small businesses', price: 1499, credits: 100 },
                        { id: 'standard', name: 'Standard', description: 'Most popular option', price: 2499, credits: 250 },
                        { id: 'premium', name: 'Premium', description: 'Best value for high volume', price: 4999, credits: 600 }
                      ].map(pkg => (
                        <Card 
                          key={pkg.id} 
                          className={`cursor-pointer transition-all ${
                            selectedPackage === pkg.id 
                              ? 'ring-2 ring-primary-500 ring-offset-2' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedPackage(pkg.id)}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle>{pkg.name}</CardTitle>
                            <CardDescription>{pkg.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="text-3xl font-bold mb-2">
                              ${(pkg.price / 100).toFixed(2)}
                            </div>
                            <div className="text-md text-primary-600 font-medium">
                              {pkg.credits} minutes
                            </div>
                          </CardContent>
                          <CardFooter className="pt-3 border-t">
                            {selectedPackage === pkg.id && (
                              <div className="flex items-center text-primary-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">Selected</span>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handlePurchase} 
                      disabled={!selectedPackage || isProcessing}
                      className="min-w-[150px]"
                    >
                      {isProcessing ? "Processing..." : "Purchase Credits"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionHistory.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{transaction.package}</TableCell>
                          <TableCell>{transaction.credits} minutes</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span>Completed</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payment">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Saved Payment Methods</h3>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-3 rounded-md">
                            <CreditCard className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-500">Expires 12/24</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Remove</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Button>Add Payment Method</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Billing;
