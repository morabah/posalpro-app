'use client';

import { ResponsiveBreakpointManager } from '@/components/ui/ResponsiveBreakpointManager';
import { ReactNode } from 'react';

interface ClientLayoutWrapperProps {
  children: ReactNode;
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return <ResponsiveBreakpointManager>{children}</ResponsiveBreakpointManager>;
}
