import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTranslation, supportedLanguages } from "@/lib/i18n";

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string, defaultValue?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  changeLanguage: () => {},
  t: (key: string, defaultValue?: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Try to get language from localStorage, fallback to browser language or English
  const getInitialLanguage = (): string => {
    const savedLanguage = localStorage.getItem("language");
    
    if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
      return savedLanguage;
    }
    
    // Try to match browser language
    const browserLang = navigator.language.split('-')[0];
    if (supportedLanguages.some(lang => lang.code === browserLang)) {
      return browserLang;
    }
    
    // Default to English
    return "en";
  };

  const [language, setLanguage] = useState<string>(getInitialLanguage());

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem("language", language);
    
    // Also update document language for accessibility
    document.documentElement.lang = language;
  }, [language]);

  // Function to change language
  const changeLanguage = (lang: string) => {
    if (supportedLanguages.some(l => l.code === lang)) {
      setLanguage(lang);
    }
  };

  // Translation function
  const t = (key: string, defaultValue?: string): string => {
    return getTranslation(language, key, defaultValue);
  };

  const value = {
    language,
    changeLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default LanguageProvider;
