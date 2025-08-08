
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { Post, User, Comment } from '@/lib/types';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  arrayUnion,
  increment,
  Timestamp,
} from 'firebase/firestore';

type NewPost = Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked' | 'user'> & { user: { username: string, avatarUrl: string } };

interface AppContextType {
  posts: Post[];
  users: User[];
  currentUser: User | null;
  addPost: (post: Omit<NewPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => Promise<void>;
  updatePost: (postId: string, updater: (post: Post) => Partial<Post>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);
        // For now, we'll mock the current user as the first user in the list.
        if (usersList.length > 0) {
          setCurrentUser(usersList[0]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchPosts = async () => {
      try {
        const postsCollection = collection(db, 'posts');
        const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsList = postsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate(), // Convert Firestore Timestamp to Date
            comments: data.comments.map((c: any) => ({...c, timestamp: c.timestamp?.toDate()}))
          } as Post;
        });
        setPosts(postsList);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await fetchUsers();
      await fetchPosts();
      setLoading(false);
    }

    fetchData();
  }, []);

  const addPost = async (post: Omit<NewPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => {
    if (!currentUser) return;
    try {
      const newPostRef = await addDoc(collection(db, 'posts'), {
        ...post,
        user: {
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl
        },
        timestamp: serverTimestamp(),
        likes: 0,
        comments: [],
        isLiked: false,
      });

      // To keep UI in sync without re-fetching, we can optimistically update the state
      const newPost: Post = {
        ...post,
        id: newPostRef.id,
        user: {
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl
        },
        timestamp: new Date(),
        likes: 0,
        comments: [],
        isLiked: false,
      };
      setPosts(prevPosts => [newPost, ...prevPosts]);

    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  const updatePost = (postId: string, updater: (post: Post) => Partial<Post>) => {
    const postRef = doc(db, 'posts', postId);
    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate) return;
    
    const updates = updater(postToUpdate);

    // Optimistically update local state
    setPosts(prevPosts =>
      prevPosts.map(p => p.id === postId ? { ...p, ...updates } : p)
    );

    // Update Firestore
    // Note: a more robust solution would handle potential failures and roll back optimistic updates.
    if(updates.isLiked !== undefined){
        updateDoc(postRef, { likes: increment(updates.isLiked ? 1 : -1), isLiked: updates.isLiked });
    }
    if (updates.comments) {
        // This assumes we're only adding one comment at a time
        const newComment = updates.comments[updates.comments.length - 1];
        if (newComment) {
            // Firestore does not allow serverTimestamp() in arrayUnion.
            // We'll use the client-generated date for the optimistic update,
            // and create a separate object for the Firestore update.
            const commentForFirestore = {
                ...newComment,
                timestamp: serverTimestamp() // Use the server timestamp for the database
            };
            updateDoc(postRef, { comments: arrayUnion(commentForFirestore) });
        }
    }
  };

  return (
    <AppContext.Provider value={{ posts, users, currentUser, addPost, updatePost }}>
      {!loading ? children : <div>Loading...</div>}
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
