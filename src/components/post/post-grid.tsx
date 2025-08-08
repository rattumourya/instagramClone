"use client";

import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import type { Post } from '@/lib/types';

export function PostGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
        <h2 className="text-2xl font-semibold">No Posts Yet</h2>
        <p>Start sharing your moments.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {posts.map(post => (
        <div key={post.id} className="group relative aspect-square">
          <Image
            src={post.imageUrl}
            alt="Post image"
            fill
            className="object-cover"
            data-ai-hint="photo"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white">
            <div className="flex items-center gap-2 font-bold">
              <Heart className="h-6 w-6" />
              <span>{post.likes}</span>
            </div>
            <div className="flex items-center gap-2 font-bold">
              <MessageCircle className="h-6 w-6" />
              <span>{post.comments.length}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
