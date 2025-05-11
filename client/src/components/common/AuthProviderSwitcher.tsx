import React from 'react';
import { API_SETTINGS } from '../../lib/constants';
import { AuthProvider as OldAuthProvider } from '../../contexts/AuthContext';
import { AuthProvider as NewAuthProvider } from '../../contexts/NewAuthContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { Toaster } from '../ui/toaster';

interface AuthProviderSwitcherProps {
  children: React.ReactNode;
}

/**
 * This component provides a convenient way to switch between Firebase authentication
 * and our new Fastify JWT authentication. It uses the USE_FASTIFY_BACKEND constant
 * from API_SETTINGS to determine which authentication provider to use.
 */
const AuthProviderSwitcher: React.FC<AuthProviderSwitcherProps> = ({ children }) => {
  const { USE_FASTIFY_BACKEND } = API_SETTINGS;

  // We always need the QueryClientProvider for data fetching
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {USE_FASTIFY_BACKEND ? (
          // Use the new Fastify-based auth provider
          <NewAuthProvider>
            {children}
            <Toaster />
          </NewAuthProvider>
        ) : (
          // Use the old Firebase-based auth provider
          <OldAuthProvider>
            {children}
            <Toaster />
          </OldAuthProvider>
        )}
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default AuthProviderSwitcher;