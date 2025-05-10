import React, { useState } from "react";
import { supportedLanguages } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const LanguageSelector: React.FC = () => {
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  
  // Find the current language display name
  const currentLanguage = supportedLanguages.find(lang => lang.code === language);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center text-sm font-medium text-gray-700 py-2 px-3 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        <Globe className="mr-1 h-4 w-4" />
        <span>{currentLanguage?.code.toUpperCase() || "EN"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              changeLanguage(lang.code);
              setOpen(false);
            }}
            className={`cursor-pointer ${
              language === lang.code ? "bg-primary-50 text-primary-600" : ""
            }`}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
