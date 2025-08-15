
"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { useApp } from '@/context/app-provider';

export function ProfileHeader({ user }: { user: User }) {
  const { currentUser, toggleFollow } = useApp();

  if (!currentUser) return null;

  const isOwnProfile = currentUser.id === user.id;
  const isFollowing = currentUser.following.includes(user.id);

  const handleFollowToggle = () => {
    toggleFollow(user.id);
  };

  return (
    <div className="flex items-center gap-8 md:gap-16 p-4 md:p-8">
      <div className="w-24 h-24 md:w-36 md:h-36 relative">
        <Image
          src={user.avatarUrl}
          alt={user.username}
          fill
          className="rounded-full object-cover"
          data-ai-hint="avatar portrait"
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-light">{user.username}</h2>
          {isOwnProfile ? (
            <Button variant="secondary">Edit Profile</Button>
          ) : (
            <Button
              variant={isFollowing ? 'secondary' : 'default'}
              onClick={handleFollowToggle}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </div>
        <div className="flex gap-8">
          <div><span className="font-semibold">{user.postsCount}</span> posts</div>
          <div><span className="font-semibold">{user.followersCount.toLocaleString()}</span> followers</div>
          <div><span className="font-semibold">{user.followingCount.toLocaleString()}</span> following</div>
        </div>
        <div>
          <h1 className="font-semibold">{user.name}</h1>
          {user.bio && <p className="text-muted-foreground">{user.bio}</p>}
        </div>
      </div>
    </div>
  );
}
