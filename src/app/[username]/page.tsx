
"use client";
import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PostGrid } from '@/components/post/post-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { useState, useEffect } from 'react';
import type { User, Post } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

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
  const [user, setUser] = useState<User | undefined>(undefined);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Fetch user by username
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('username', '==', username), limit(1));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          setUser(undefined);
          setLoading(false);
          return;
        }

        const userData = userSnapshot.docs[0].data() as User;
        setUser({ id: userSnapshot.docs[0].id, ...userData });

        // Fetch user's posts
        const postsRef = collection(db, 'posts');
        const postsQuery = query(postsRef, where('userId', '==', userSnapshot.docs[0].id), orderBy('timestamp', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);

        const postsList: Post[] = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp instanceof Timestamp ? doc.data().timestamp.toDate() : new Date(), // Safely convert Firestore Timestamp to Date
        }) as Post);
        setUserPosts(postsList);

      } catch (error) {
        console.error('Error fetching profile data:', error);
        setUser(undefined); // Indicate user not found on error
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]); // Re-run effect when username changes

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
