
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Files } from 'lucide-react';
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
        <Link key={post.id} href={`/#${post.id}`} className="group relative aspect-square cursor-pointer">
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {post.media[0].type === 'image' ? (
              post.media[0].url.startsWith('blob:') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                      src={post.media[0].url}
                      alt="Post media"
                      className="object-cover w-full h-full"
                  />
              ) : (
                  <Image
                      src={post.media[0].url}
                      alt="Post image"
                      fill
                      className="object-cover"
                      data-ai-hint="landscape photo"
                  />
              )
            ) : (
              <video
                src={post.media[0].url}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            )}

            {post.media.length > 1 && (
              <Files className="absolute top-2 right-2 h-5 w-5 text-white drop-shadow-lg" />
            )}
        </Link>
      ))}
    </div>
  );
}
