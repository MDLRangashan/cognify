import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../translations/en.json';
import siTranslations from '../translations/si.json';

export interface LanguageContextType {
  language: 'en' | 'si';
  setLanguage: (lang: 'en' | 'si') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'si'>('en');

  // Get translations based on current language
  const getTranslations = () => {
    return language === 'si' ? siTranslations : enTranslations;
  };

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('cognify-language');
    if (savedLanguage === 'en' || savedLanguage === 'si') {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage when changed
  const setLanguage = (lang: 'en' | 'si') => {
    setLanguageState(lang);
    localStorage.setItem('cognify-language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    const translations = getTranslations();
    
    // Handle nested keys like 'navigation.overview'
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
