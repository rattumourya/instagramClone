"use client";

import { Feed } from '@/components/feed';
import { Header } from '@/components/layout/header';
import { useApp } from '@/context/app-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { currentUser, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto max-w-5xl px-4">
        <Feed />
      </div>
    </main>
  );
}
