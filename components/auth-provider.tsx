'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabse'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !['/signin', '/signup'].includes(pathname)) {
        router.push('/signin');
      } else if (session && ['/signin', '/signup'].includes(pathname)) {
        router.push('/chat');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !['/signin', '/signup'].includes(pathname)) {
        router.push('/signin');
      } else if (session && ['/signin', '/signup'].includes(pathname)) {
        router.push('/chat');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return <>{children}</>;
}