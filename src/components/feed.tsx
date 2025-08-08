"use client";

import { useApp } from '@/context/app-provider';
import { PostCard } from './post/post-card';

export function Feed() {
  const { posts } = useApp();

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
