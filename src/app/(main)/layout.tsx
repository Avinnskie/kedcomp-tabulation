'use client';
import { SidebarComponent } from '@/src/components/molecules/sidebar';
import '../globals.css';
import Image from 'next/image';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>
        <SidebarComponent>{children}</SidebarComponent>
      </SessionProvider>
      <Toaster position="top-center" />
    </>
  );
}
