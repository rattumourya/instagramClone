
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { Post, User } from '@/lib/types';
import { initialPosts, users } from '@/lib/data';

type NewPost = Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked'> & Partial<Pick<Post, 'likes' | 'comments' | 'isLiked'>>;

interface AppContextType {
  posts: Post[];
  currentUser: User;
  addPost: (post: NewPost) => void;
  updatePost: (postId: string, updater: (post: Post) => Partial<Post>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  // For now, we'll mock the current user as the first user in the list.
  const [currentUser] = useState<User>(users[0]);

  const addPost = (post: NewPost) => {
    const newPost: Post = {
      ...post,
      id: `post-${Date.now()}`,
      timestamp: new Date(),
      likes: post.likes ?? 0,
      comments: post.comments ?? [],
      isLiked: post.isLiked ?? false,
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const updatePost = (postId: string, updater: (post: Post) => Partial<Post>) => {
    setPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          const updates = updater(p);
          return { ...p, ...updates };
        }
        return p;
      })
    );
  }

  return (
    <AppContext.Provider value={{ posts, currentUser, addPost, updatePost }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
