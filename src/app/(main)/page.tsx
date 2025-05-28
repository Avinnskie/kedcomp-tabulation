'use client';
import { SessionProvider } from 'next-auth/react';
import { Dashboard } from 'src/components/molecules/dashboard';

export default function Home() {
  return (
    <SessionProvider>
      <Dashboard />
    </SessionProvider>
  );
}
