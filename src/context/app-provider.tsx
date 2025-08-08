
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
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


type NewPost = Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked' | 'user'> & { user: { username: string, avatarUrl: string } };

type UpdatePayload = ((post: Post) => Partial<Post>) | { newComment: string };

interface AppContextType {
  posts: Post[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  addPost: (post: Omit<NewPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => Promise<void>;
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
    const fetchAllData = async () => {
      // Fetch all users
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);

      // Fetch all posts
      const postsCollection = collection(db, 'posts');
      const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
      const postsSnapshot = await getDocs(postsQuery);
      const postsList = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp,
          comments: data.comments.map((c: any) => ({...c, timestamp: c.timestamp}))
        } as Post;
      });
      setPosts(postsList);
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = { id: userSnap.id, ...userSnap.data() } as User;
          setCurrentUser(userData);
          // Only fetch all data if it hasn't been fetched yet
          if (posts.length === 0 && users.length === 0) {
            await fetchAllData();
          }
        } else {
           console.log("User document not found in Firestore for uid:", firebaseUser.uid);
           setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        setPosts([]);
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (email: string, username: string, password: string) => {
    // Check if username already exists
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
      name: username, // Default name to username
      email,
      avatarUrl: 'https://placehold.co/150x150.png',
      bio: '',
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    // Add new user to the local state to avoid a full refetch
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
    router.push('/login');
  };


  const addPost = async (post: Omit<NewPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => {
    if (!currentUser) return;
    try {
      const newPostData = {
        ...post,
        user: {
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl
        },
        timestamp: serverTimestamp(),
        likes: 0,
        comments: [],
        isLiked: false,
      };

      const newPostRef = await addDoc(collection(db, 'posts'), newPostData);

      // Optimistic update
      const newPostForUI: Post = {
        id: newPostRef.id,
        user: {
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl
        },
        imageUrl: post.imageUrl,
        caption: post.caption,
        timestamp: new Date(),
        likes: 0,
        comments: [],
        isLiked: false,
      };
      setPosts(prevPosts => [newPostForUI, ...prevPosts]);

    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  const updatePost = (postId: string, payload: UpdatePayload) => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', postId);
    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate) return;
  
    // Handle comments
    if (typeof payload === 'object' && 'newComment' in payload) {
      const clientTimestamp = new Date();
      const newCommentForUI: Comment = {
        id: `comment-${Date.now()}-${Math.random()}`,
        text: payload.newComment,
        user: { username: currentUser.username, avatarUrl: currentUser.avatarUrl },
        timestamp: clientTimestamp,
      };

      const newCommentForFirestore = {
        ...newCommentForUI,
        timestamp: Timestamp.fromDate(clientTimestamp),
      };
  
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId ? { ...p, comments: [...p.comments, newCommentForUI] } : p
        )
      );
  
      updateDoc(postRef, { comments: arrayUnion(newCommentForFirestore) });
  
    // Handle likes and other updates
    } else if (typeof payload === 'function') {
        const updates = payload(postToUpdate);
        
        // This part is now specifically for likes
        const newIsLiked = updates.isLiked;
        if (newIsLiked === undefined) return;

        setPosts(prevPosts =>
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
