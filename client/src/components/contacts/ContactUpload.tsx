import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { parseContactData } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileType, FileText, AlertCircle } from "lucide-react";

interface ContactUploadProps {
  onUploadComplete?: () => void;
}

const ContactUpload: React.FC<ContactUploadProps> = ({ onUploadComplete }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedContacts, setParsedContacts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Mutation for bulk contact creation
  const createContactsMutation = useMutation({
    mutationFn: async (contacts: any[]) => {
      const response = await apiRequest("POST", "/api/contacts/bulk", contacts);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Success",
        description: "Contacts imported successfully.",
        variant: "default",
      });
      reset();
      setParsedContacts([]);
      setUploadProgress(0);
      if (onUploadComplete) {
        onUploadComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to import contacts. Please try again.",
        variant: "destructive",
      });
      console.error("Error importing contacts:", error);
    },
  });

  const onSubmit = async (data: any) => {
    const file = data.file[0];
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);

      // Read the file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setUploadProgress(30);
          const fileContent = e.target?.result as string;
          
          // Determine file type
          const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel';
          
          // Parse the data using OpenAI
          setUploadProgress(50);
          const parsedData = await parseContactData(fileContent, fileType);
          
          // Validate parsed data
          if (!Array.isArray(parsedData) || parsedData.length === 0) {
            throw new Error("No valid contacts found in the file.");
          }
          
          setUploadProgress(80);
          setParsedContacts(parsedData);
          setUploadProgress(100);
          
          // Auto-submit the parsed contacts
          createContactsMutation.mutate(parsedData);
          
        } catch (error) {
          console.error("Error parsing contacts:", error);
          setError("Failed to parse contacts. Please check your file format and try again.");
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError("Error reading the file. Please try again.");
        setIsUploading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Upload error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("contacts.import")}</CardTitle>
        <CardDescription>
          Upload a CSV or Excel file with your contacts. We'll automatically extract the relevant information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="file">{t("contacts.uploadCsv")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  disabled={isUploading || createContactsMutation.isPending}
                  {...register("file", { required: "Please select a file" })}
                />
                <Button 
                  type="submit" 
                  disabled={isUploading || createContactsMutation.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
              {errors.file && (
                <p className="text-sm font-medium text-destructive">
                  {errors.file.message as string}
                </p>
              )}
            </div>
            
            {(isUploading || createContactsMutation.isPending) && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-gray-500">
                  {isUploading ? "Processing file..." : "Importing contacts..."}
                </p>
              </div>
            )}
            
            {parsedContacts.length > 0 && !createContactsMutation.isPending && (
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <p className="font-medium">
                    {parsedContacts.length} contacts found
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  The contacts have been parsed and are ready to import.
                </p>
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => reset()}>
          Cancel
        </Button>
        {parsedContacts.length > 0 && !createContactsMutation.isPending && (
          <Button
            onClick={() => createContactsMutation.mutate(parsedContacts)}
            disabled={createContactsMutation.isPending}
          >
            Import {parsedContacts.length} Contacts
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContactUpload;
