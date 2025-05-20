"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/chat-interface';
import { supabase } from '@/lib/utils';

export default function Chat() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/signin');
    };
    checkAuth();
  }, [router]);

  return <ChatInterface />;
}