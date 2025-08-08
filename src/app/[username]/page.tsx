
"use client";
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PostGrid } from '@/components/post/post-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { useApp } from '@/context/app-provider';
import { useMemo } from 'react';
import type { User, Post } from '@/lib/types';

const ProfilePageSkeleton = () => (
  <main className="min-h-screen">
    <Header />
    <div className="container mx-auto max-w-5xl px-4">
      <div className="flex items-center gap-8 md:gap-16 p-4 md:p-8">
        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="flex gap-8">
            <div className="h-6 w-20 bg-muted animate-pulse rounded-md"/>
            <div className="h-6 w-20 bg-muted animate-pulse rounded-md"/>
            <div className="h-6 w-20 bg-muted animate-pulse rounded-md"/>
          </div>
          <div className='space-y-2'>
            <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
      </div>
      <hr className="my-4" />
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        <div className="aspect-square bg-muted animate-pulse rounded-md" />
        <div className="aspect-square bg-muted animate-pulse rounded-md" />
        <div className="aspect-square bg-muted animate-pulse rounded-md" />
      </div>
    </div>
  </main>
);

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const { users, posts, loading } = useApp();

  const user: User | undefined = useMemo(() => {
    if (loading) return undefined;
    return users.find(u => u.username === username);
  }, [username, users, loading]);

  const userPosts: Post[] = useMemo(() => {
    if (!user) return [];
    return posts.filter(p => p.userId === user.id);
  }, [posts, user]);

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto max-w-5xl px-4">
        <ProfileHeader user={user} />
        <hr className="my-4" />
        <PostGrid posts={userPosts} />
      </div>
    </main>
  );
}
