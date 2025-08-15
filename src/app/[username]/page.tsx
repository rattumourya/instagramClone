
"use client";
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PostGrid } from '@/components/post/post-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { useState, useEffect } from 'react';
import type { User, Post } from '@/lib/types';
import { useApp } from '@/context/app-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3x3, Bookmark } from 'lucide-react';

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
  const { users, posts: allPosts, loading: appLoading, currentUser } = useApp();
  
  const [user, setUser] = useState<User | undefined>(undefined);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (appLoading) return;

    setLoading(true);
    
    const profileUser = users.find(u => u.username === username);
    setUser(profileUser);

    if (profileUser) {
      const postsForUser = allPosts.filter(p => p.userId === profileUser.id);
      setUserPosts(postsForUser);
      
      if (currentUser && isOwnProfile) {
        const userSavedPosts = allPosts.filter(p => currentUser.savedPosts.includes(p.id));
        setSavedPosts(userSavedPosts);
      }

    } else {
      setUserPosts([]);
      setSavedPosts([]);
    }
    
    setLoading(false);

  }, [username, users, allPosts, appLoading, currentUser, isOwnProfile]);

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
        
        {isOwnProfile ? (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">
                <Grid3x3 className="mr-2 h-4 w-4" />
                POSTS
              </TabsTrigger>
              <TabsTrigger value="saved">
                <Bookmark className="mr-2 h-4 w-4" />
                SAVED
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
              <hr className="my-4" />
              <PostGrid posts={userPosts} />
            </TabsContent>
            <TabsContent value="saved">
              <hr className="my-4" />
              <PostGrid posts={savedPosts} />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <hr className="my-4" />
            <PostGrid posts={userPosts} />
          </>
        )}
      </div>
    </main>
  );
}
