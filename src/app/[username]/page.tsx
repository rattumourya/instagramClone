
"use client";
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PostGrid } from '@/components/post/post-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { useState, useEffect } from 'react';
import type { User, Post } from '@/lib/types';
import { useApp } from '@/context/app-provider';

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

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { users, posts: allPosts, loading: appLoading } = useApp();
  
  const [user, setUser] = useState<User | undefined>(undefined);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appLoading) return;

    setLoading(true);
    
    const profileUser = users.find(u => u.username === username);
    setUser(profileUser);

    if (profileUser) {
      const postsForUser = allPosts.filter(p => p.userId === profileUser.id);
      setUserPosts(postsForUser);
    } else {
      setUserPosts([]);
    }
    
    setLoading(false);

  }, [username, users, allPosts, appLoading]);

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
