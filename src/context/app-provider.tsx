
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

type RawComment = Omit<Comment, 'user'>;
type RawPost = Omit<Post, 'user' | 'comments'> & { comments: RawComment[] };
type NewPost = { imageUrl: string, caption: string };
type UpdatePayload = ((post: Post) => Partial<Post>) | { newComment: string };

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

const unknownUser = {
  id: 'unknown',
  username: 'unknown',
  avatarUrl: 'https://placehold.co/150x150.png',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [rawPosts, setRawPosts] = useState<RawPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAllData = useCallback(async () => {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    setUsers(usersList);

    const postsCollection = collection(db, 'posts');
    const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
    const postsSnapshot = await getDocs(postsQuery);
    const postsList = postsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: (data.timestamp as Timestamp).toDate(),
        comments: data.comments.map((c: any) => ({
          ...c,
          timestamp: (c.timestamp as Timestamp).toDate()
        }))
      } as RawPost;
    });
    setRawPosts(postsList);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setCurrentUser({ id: userSnap.id, ...userSnap.data() } as User);
          await fetchAllData();
        } else {
           setCurrentUser(null);
           setUsers([]);
           setRawPosts([]);
        }
      } else {
        setCurrentUser(null);
        setUsers([]);
        setRawPosts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAllData]);
  
  const posts = useMemo(() => {
    if (loading || users.length === 0) return [];
    
    const userMap = new Map(users.map(user => [user.id, user]));
  
    return rawPosts.map(post => {
      const postUser = userMap.get(post.userId) ?? unknownUser;
      
      const hydratedComments = post.comments.map(comment => {
        const commentUser = userMap.get(comment.userId) ?? unknownUser;
        return {
          ...comment,
          user: { id: commentUser.id, username: commentUser.username, avatarUrl: commentUser.avatarUrl }
        };
      });
  
      return {
        ...post,
        comments: hydratedComments,
        user: { username: postUser.username, avatarUrl: postUser.avatarUrl }
      };
    });
  }, [rawPosts, users, loading]);


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
      avatarUrl: 'https://placehold.co/150x150.png',
      bio: '',
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    setUsers(prevUsers => [...prevUsers, newUser]);
    setCurrentUser(newUser);
    router.push('/');
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    router.push('/');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setRawPosts([]);
    setUsers([]);
    router.push('/login');
  };

  const addPost = async (post: NewPost) => {
    if (!currentUser) return;
    try {
      const newPostData = {
        userId: currentUser.id,
        imageUrl: post.imageUrl,
        caption: post.caption,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: [],
        isLiked: false,
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
        isLiked: false,
      };
      setRawPosts(prevPosts => [newPostForUI, ...prevPosts]);

    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  const updatePost = (postId: string, payload: UpdatePayload) => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', postId);
    const postToUpdate = rawPosts.find(p => p.id === postId);
    if (!postToUpdate) return;
  
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
          p.id === postId ? { ...p, comments: [...p.comments, newCommentForUI] } : p
        )
      );
  
      updateDoc(postRef, { comments: arrayUnion(newCommentForFirestore) });
  
    } else if (typeof payload === 'function') {
        const fullPostForCallback = posts.find(p => p.id === postId);
        if (!fullPostForCallback) return;

        const newIsLiked = payload(fullPostForCallback).isLiked;
        if (newIsLiked === undefined) return;

        setRawPosts(prevPosts =>
            prevPosts.map(p => {
                if (p.id === postId) {
                    const currentLikes = p.likes || 0;
                    const newLikes = newIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
                    return { ...p, isLiked: newIsLiked, likes: newLikes };
                }
                return p;
            })
        );
  
        updateDoc(postRef, {
            likes: increment(newIsLiked ? 1 : -1)
        });
    }
  };

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
