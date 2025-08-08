"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { Post } from '@/lib/types';
import { initialPosts } from '@/lib/data';

interface AppContextType {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => void;
  updatePost: (updatedPost: Post) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const addPost = (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => {
    const newPost: Post = {
      ...post,
      id: `post-${Date.now()}`,
      timestamp: new Date(),
      likes: 0,
      comments: [],
      isLiked: false,
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const updatePost = (updatedPost: Post) => {
    setPosts(prevPosts => prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
  }

  return (
    <AppContext.Provider value={{ posts, addPost, updatePost }}>
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
