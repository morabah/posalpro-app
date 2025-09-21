// __FILE_DESCRIPTION__: Provider template following route-group layout provider stack
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

'use client';

import React from 'react';
import { logDebug, logInfo } from '@/lib/logger';

export type __PROVIDER_NAME__ContextType = {
  // Define context shape here
  value: string;
  setValue: (value: string) => void;
  isLoading: boolean;
};

const __PROVIDER_NAME__Context = React.createContext<__PROVIDER_NAME__ContextType | null>(null);

export type __PROVIDER_NAME__ProviderProps = {
  children: React.ReactNode;
  // Provider-specific props
  initialValue?: string;
};

export function __PROVIDER_NAME__Provider({
  children,
  initialValue = '',
}: __PROVIDER_NAME__ProviderProps) {
  const [value, setValue] = React.useState<string>(initialValue);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Log provider initialization
  React.useEffect(() => {
    logDebug('Provider init', {
      component: '__PROVIDER_NAME__Provider',
      operation: 'initialize',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });
    logInfo('Provider ready', {
      component: '__PROVIDER_NAME__Provider',
    });
  }, []);

  const contextValue = React.useMemo<__PROVIDER_NAME__ContextType>(
    () => ({
      value,
      setValue,
      isLoading,
    }),
    [value, isLoading]
  );

  return (
    <__PROVIDER_NAME__Context.Provider value={contextValue}>
      {children}
    </__PROVIDER_NAME__Context.Provider>
  );
}

export function use__PROVIDER_NAME__(): __PROVIDER_NAME__ContextType {
  const context = React.useContext(__PROVIDER_NAME__Context);
  if (!context) {
    throw new Error('use__PROVIDER_NAME__ must be used within a __PROVIDER_NAME__Provider');
  }
  return context;
}

// For SSR/CSR consistency - provide default values that match server rendering
export const __PROVIDER_NAME__DefaultContext: __PROVIDER_NAME__ContextType = {
  value: '',
  setValue: () => {},
  isLoading: false,
};
