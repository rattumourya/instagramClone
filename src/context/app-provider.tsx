
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Post, User, Comment } from '@/lib/types';
import { db, auth } from '@/lib/firebase';
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
  arrayRemove,
  increment,
  Timestamp,
  setDoc,
  getDoc,
  where
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

type RawComment = Omit<Comment, 'user'> & { userId: string };
type RawPost = Omit<Post, 'user' | 'comments' | 'isLiked'> & { comments: RawComment[], userId: string };
type NewPost = { imageUrl: string, caption: string };
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

const unknownUser: User = {
  id: 'unknown',
  name: 'Unknown User',
  username: 'unknown',
  avatarUrl: 'https://placehold.co/150x150.png',
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
  bio: '',
  likedPosts: []
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [rawPosts, setRawPosts] = useState<RawPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);

      // 1. Fetch all public data (users and posts) first, regardless of auth state.
      // This is crucial for displaying public pages correctly for logged-out users.
      try {
        const usersCollection = collection(db, 'users');
        const postsCollection = collection(db, 'posts');
        const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));

        const [usersSnapshot, postsSnapshot] = await Promise.all([
          getDocs(usersCollection),
          getDocs(postsQuery)
        ]);

        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);

        const postsList = postsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toDate(),
            comments: (data.comments || []).map((c: any) => ({
              ...c,
              timestamp: (c.timestamp as Timestamp)?.toDate() || new Date()
            }))
          } as RawPost;
        });
        setRawPosts(postsList);

      } catch (error) {
        console.error("Error fetching public data:", error);
      }

      // 2. After public data is fetched, set up the auth listener.
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const fetchedUser = { id: userSnap.id, ...userSnap.data() } as User;
            setCurrentUser(fetchedUser);
          } else {
             console.error("Authenticated user not found in Firestore, signing out.");
             setCurrentUser(null);
             await firebaseSignOut(auth);
          }
        } else {
          setCurrentUser(null);
        }
        // 3. Set loading to false only after all data is fetched and auth state is determined.
        setLoading(false);
      });

      return () => unsubscribe();
    };

    initializeApp();
  }, []);
  
  const posts = useMemo(() => {
    // Memoization now correctly depends on all raw data and the current user.
    if (users.length === 0) return [];
    
    const userMap = new Map(users.map(user => [user.id, user]));
    const likedPostsSet = new Set(currentUser?.likedPosts || []);
  
    return rawPosts.map(post => {
      const postUser = userMap.get(post.userId) ?? unknownUser;
      
      const hydratedComments = (post.comments || []).map(comment => {
        const commentUser = userMap.get(comment.userId) ?? unknownUser;
        return {
          ...comment,
          user: { username: commentUser.username, avatarUrl: commentUser.avatarUrl, id: commentUser.id }
        };
      });
  
      return {
        ...post,
        comments: hydratedComments,
        user: { username: postUser.username, avatarUrl: postUser.avatarUrl, id: postUser.id },
        isLiked: likedPostsSet.has(post.id) // `isLiked` is now correctly derived from the current user.
      };
    });
  }, [rawPosts, users, currentUser]);

  const signUp = async (email: string, username: string, password: string) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("Username already exists.");
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const newUser: User = {
      id: firebaseUser.uid,
      username,
      name: username,
      email,
      avatarUrl: `https://placehold.co/150x150.png?text=${username.slice(0,2)}`,
      bio: '',
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      likedPosts: []
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    setUsers(prev => [...prev, newUser]);
    router.push('/');
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    router.push('/');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const addPost = async (post: NewPost) => {
    if (!currentUser) return;
    try {
      const timestamp = serverTimestamp();
      const newPostData = {
        userId: currentUser.id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        timestamp: timestamp,
        likes: 0,
        comments: [],
      };

      const newPostRef = await addDoc(collection(db, 'posts'), newPostData);

      const newPostForUI: RawPost = {
        id: newPostRef.id,
        userId: currentUser.id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        timestamp: new Date(),
        likes: 0,
        comments: [],
      };
      setRawPosts(prevPosts => [newPostForUI, ...prevPosts]);
      
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, { postsCount: increment(1) });
      
      const updatedUser = { ...currentUser, postsCount: currentUser.postsCount + 1 };
      setCurrentUser(updatedUser);
      setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));

    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  const updatePost = useCallback((postId: string, payload: UpdatePayload) => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', postId);
    const userRef = doc(db, 'users', currentUser.id);
  
    if (typeof payload === 'object' && 'newComment' in payload) {
      const clientTimestamp = new Date();
      const newCommentForUI: RawComment = {
        id: `comment-${Date.now()}-${Math.random()}`,
        text: payload.newComment,
        userId: currentUser.id,
        timestamp: clientTimestamp,
      };

      const newCommentForFirestore = {
        ...newCommentForUI,
        timestamp: Timestamp.fromDate(clientTimestamp),
      };
  
      setRawPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId ? { ...p, comments: [...(p.comments || []), newCommentForUI] } : p
        )
      );
  
      updateDoc(postRef, { comments: arrayUnion(newCommentForFirestore) });
  
    } else if (typeof payload === 'function') {
        const fullPostForCallback = posts.find(p => p.id === postId);
        if (!fullPostForCallback) return;

        const { isLiked: newIsLiked } = payload(fullPostForCallback);

        if (newIsLiked === undefined) return;

        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            const currentLikedPosts = new Set(prevUser.likedPosts || []);
            if (newIsLiked) {
                currentLikedPosts.add(postId);
            } else {
                currentLikedPosts.delete(postId);
            }
            return { ...prevUser, likedPosts: Array.from(currentLikedPosts) };
        });

        setRawPosts(prevPosts =>
            prevPosts.map(p => {
                if (p.id === postId) {
                    const currentLikes = p.likes || 0;
                    const newLikes = newIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
                    return { ...p, likes: newLikes };
                }
                return p;
            })
        );
  
        updateDoc(postRef, {
            likes: increment(newIsLiked ? 1 : -1)
        });
        updateDoc(userRef, {
            likedPosts: newIsLiked ? arrayUnion(postId) : arrayRemove(postId)
        });
    }
  }, [currentUser, posts]);

  return (
    <AppContext.Provider value={{ posts, users, currentUser, loading, addPost, updatePost, signUp, signIn, signOut }}>
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
