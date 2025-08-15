
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Post, User, Comment, Media } from '@/lib/types';
import { useRouter } from 'next/navigation';

// --- MOCK DATA IMPORTS ---
import initialPosts from '@/lib/data/posts.json';
import initialUsers from '@/lib/data/users.json';

type NewPost = { media: Media[], caption: string };
type UpdatePayload = ((post: Post) => Partial<Pick<Post, 'isLiked'>>) | { newComment: string };

interface AppContextType {
  posts: Post[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  addPost: (post: NewPost) => Promise<void>;
  updatePost: (postId: string, payload: UpdatePayload) => void;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate fetching data from a database
    setLoading(true);

    const loadedUsers = initialUsers as User[];
    
    // We need to convert timestamp strings from JSON into Date objects
    const loadedPosts = initialPosts.map(post => ({
      ...post,
      timestamp: new Date(post.timestamp),
      comments: post.comments.map(comment => ({
        ...comment,
        timestamp: new Date(comment.timestamp),
      })),
      isLiked: false, // Default isLiked state
    })) as Post[];

    setUsers(loadedUsers);
    setPosts(loadedPosts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    
    // Check for a logged-in user in localStorage
    const storedUser = localStorage.getItem('focusgram_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Find the full user object from our "database"
      const fullUser = loadedUsers.find(u => u.id === parsedUser.id);
      if (fullUser) {
        setCurrentUser(fullUser);
      }
    }

    setLoading(false);
  }, []);

  const enhancedPosts = useMemo(() => {
    if (loading) return [];
    
    const userMap = new Map(users.map(user => [user.id, user]));
    const likedPostsSet = new Set(currentUser?.likedPosts || []);

    return posts.map(post => {
      const postUser = userMap.get(post.userId);
      
      const hydratedComments = (post.comments || []).map(comment => {
        const commentUser = userMap.get(comment.userId);
        return {
          ...comment,
          user: { 
            id: commentUser?.id || 'unknown',
            username: commentUser?.username || 'unknown', 
            avatarUrl: commentUser?.avatarUrl || 'https://placehold.co/150x150.png'
          },
        };
      });
  
      return {
        ...post,
        user: { 
            id: postUser?.id || 'unknown',
            username: postUser?.username || 'unknown',
            avatarUrl: postUser?.avatarUrl || 'https://placehold.co/150x150.png' 
        },
        comments: hydratedComments,
        isLiked: likedPostsSet.has(post.id)
      };
    });
  }, [posts, users, currentUser, loading]);

  const signUp = async (email: string, username: string, password: string) => {
    if (users.some(u => u.username === username)) {
      throw new Error("Username already exists.");
    }
    if (users.some(u => u.email === email)) {
        throw new Error("Email already in use.");
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      name: username,
      email,
      avatarUrl: `https://placehold.co/150x150.png?text=${username.slice(0, 2)}`,
      bio: '',
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      likedPosts: []
    };
    
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('focusgram_user', JSON.stringify(newUser));
    
    router.push('/');
  };

  const signIn = async (email: string, password: string) => {
    // Note: In a real app, you'd hash and compare passwords. Here we just check for existence.
    const user = users.find(u => u.email === email);
    if (user) {
        setCurrentUser(user);
        localStorage.setItem('focusgram_user', JSON.stringify(user));
        router.push('/');
    } else {
        throw new Error("Invalid email or password.");
    }
  };

  const signOut = async () => {
    setCurrentUser(null);
    localStorage.removeItem('focusgram_user');
    router.push('/login');
  };
  
  const addPost = async (post: NewPost) => {
    if (!currentUser) return;

    const newPostForUI: Post = {
        id: `post-${Date.now()}`,
        userId: currentUser.id,
        user: {
            id: currentUser.id,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl
        },
        media: post.media,
        caption: post.caption,
        timestamp: new Date(),
        likes: 0,
        comments: [],
        isLiked: false,
    };
    
    setPosts(prevPosts => [newPostForUI, ...prevPosts]);
  };

  const updatePost = useCallback((postId: string, payload: UpdatePayload) => {
    if (!currentUser) return;
  
    if (typeof payload === 'object' && 'newComment' in payload) {
      const newCommentForUI: Comment = {
        id: `comment-${Date.now()}`,
        text: payload.newComment,
        userId: currentUser.id,
        user: {
            id: currentUser.id,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl
        },
        timestamp: new Date(),
      };
  
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId ? { ...p, comments: [...p.comments, newCommentForUI] } : p
        )
      );
  
    } else if (typeof payload === 'function') {
        const fullPostForCallback = enhancedPosts.find(p => p.id === postId);
        if (!fullPostForCallback) return;

        const { isLiked: newIsLiked } = payload(fullPostForCallback);

        if (newIsLiked === undefined) return;
        
        // Update the isLiked status on the post object
        setPosts(prevPosts =>
            prevPosts.map(p =>
              p.id === postId ? {
                ...p,
                isLiked: newIsLiked,
                likes: newIsLiked ? p.likes + 1 : p.likes - 1
              } : p
            )
          );

        // Update the likedPosts array on the user object
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            const newLikedPosts = newIsLiked
                ? [...prevUser.likedPosts, postId]
                : prevUser.likedPosts.filter(id => id !== postId);
            
            const updatedUser = { ...prevUser, likedPosts: newLikedPosts };
            localStorage.setItem('focusgram_user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }
  }, [currentUser, enhancedPosts]);

  return (
    <AppContext.Provider value={{ posts: enhancedPosts, users, currentUser, loading, addPost, updatePost, signUp, signIn, signOut }}>
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
