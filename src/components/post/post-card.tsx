
"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/app-provider';
import { cn } from '@/lib/utils';
import type { Post as PostType } from '@/lib/types';
import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export function PostCard({ post }: { post: PostType }) {
  const { updatePost } = useApp();
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

  const handleLike = () => {
    updatePost(post.id, (currentPost) => ({
      ...currentPost,
      isLiked: !currentPost.isLiked,
      likes: currentPost.isLiked ? currentPost.likes - 1 : currentPost.likes + 1,
    }));
  };

  const handleAddComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newComment.trim()) {
      updatePost(post.id, { newComment: newComment.trim() });
      setNewComment('');
    }
  };
  
  const commentsToShow = showAllComments ? post.comments : post.comments.slice(0, 2);

  const getFormattedTimestamp = () => {
    if (!post.timestamp) return 'just now';
    const date = post.timestamp instanceof Timestamp ? post.timestamp.toDate() : post.timestamp;
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }

  return (
    <Card className="w-full max-w-xl">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.user.avatarUrl} alt={`@${post.user.username}`} />
            <AvatarFallback>{post.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Link href={`/${post.user.username}`} className="font-semibold text-sm hover:underline">
            {post.user.username}
          </Link>
        </div>
        
        <div className="relative aspect-square w-full">
            <Image
            src={post.imageUrl}
            alt="Post image"
            fill
            className="object-cover"
            data-ai-hint="landscape photo"
            />
        </div>

        <div className="p-4 space-y-2">
            <div className="flex justify-between">
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={handleLike}>
                        <Heart className={cn('h-6 w-6 transition-all duration-200 ease-in-out', post.isLiked ? 'fill-destructive text-destructive' : 'text-foreground')} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}>
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                     <Button variant="ghost" size="icon">
                        <Send className="h-6 w-6" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon">
                    <Bookmark className="h-6 w-6" />
                </Button>
            </div>

            <div className="text-sm font-semibold">{post.likes.toLocaleString()} likes</div>
            
            <div>
                <Link href={`/${post.user.username}`} className="font-semibold text-sm mr-2">{post.user.username}</Link>
                <span className='text-sm'>{post.caption}</span>
            </div>
            
            {post.comments.length > 2 && !showAllComments && (
              <button onClick={() => setShowAllComments(true)} className="text-sm text-muted-foreground p-0 h-auto bg-transparent hover:bg-transparent">
                  View all {post.comments.length} comments
              </button>
            )}

            {post.comments.length > 0 && (
                <div className="space-y-2 text-sm">
                    {commentsToShow.map((comment) => (
                        <div key={comment.id}>
                             <Link href={`/${comment.user.username}`} className="font-semibold mr-2 hover:underline">{comment.user.username}</Link>
                             <span>{comment.text}</span>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="text-xs text-muted-foreground uppercase">
                {getFormattedTimestamp()}
            </div>
        </div>

        <div className="border-t px-4 py-2">
            <form onSubmit={handleAddComment} className='flex items-center gap-2'>
                <Input
                    id={`comment-input-${post.id}`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
                />
                 <Button type="submit" variant="ghost" size="sm" disabled={!newComment.trim()}>Post</Button>
            </form>
        </div>
      </CardContent>
    </Card>
  );
}
