// components/providers/SessionProvider.tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import React from 'react';

/**
 * Client component wrapper for NextAuth SessionProvider.
 * This must be used in the root layout to enable client-side session access.
 */
export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
