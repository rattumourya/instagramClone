import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PostGrid } from '@/components/post/post-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { users, initialPosts } from '@/lib/data';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const user = users.find(u => u.username === params.username);
  const userPosts = initialPosts.filter(p => p.user.username === params.username);

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
