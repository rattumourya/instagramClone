
"use client";

import { Feed } from '@/components/feed';
import { Header } from '@/components/layout/header';
import { useApp } from '@/context/app-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PostSkeleton } from '@/components/post/post-skeleton';

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
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto max-w-5xl px-4">
            <div className="flex flex-col items-center gap-8 py-8">
                <PostSkeleton />
                <PostSkeleton />
            </div>
        </div>
      </main>
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
