'use client';
import Rounds from '@/src/components/organisms/roundPage';
import { SessionProvider } from 'next-auth/react';

export default function RoundPage() {
  return (
    <SessionProvider>
      <Rounds />
    </SessionProvider>
  );
}
 