'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Dashboard } from 'src/components/molecules/dashboard';

export default function Home() {
  const { data: session, status } = useSession();
  const hasShown = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && !hasShown.current) {
      toast.success(`Welcome, ${session?.user?.name ?? 'user'}!`);
      hasShown.current = true;
    }
  }, [status, session]);

  return <Dashboard />;
}
