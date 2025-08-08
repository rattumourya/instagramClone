
"use client";
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PostGrid } from '@/components/post/post-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { useApp } from '@/context/app-provider';
import { useEffect, useState, use } from 'react';
import { User } from '@/lib/types';
import { Post } from '@/lib/types';

// The params object can be a promise in async components, so we use `use` to unwrap it.
export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { users, posts, loading } = useApp();
  const [user, setUser] = useState<User | undefined>(undefined);
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!loading && users.length > 0) {
      const foundUser = users.find(u => u.username === username);
      setUser(foundUser);
      if (foundUser) {
        const foundPosts = posts.filter(p => p.userId === foundUser.id);
        setUserPosts(foundPosts);
      }
    }
  }, [users, posts, username, loading]);

  // Initial loading state while waiting for auth and data
  if (loading || (users.length === 0 && !user)) {
    return (
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
        </div>
      </main>
    );
  }
  
  // After loading, if the user is still not found, show 404
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
