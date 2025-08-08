
import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // This will be the Firebase Auth UID
  username: string;
  name: string;
  email?: string; // Add email field
  avatarUrl: string;
  bio?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface Comment {
  id: string;
  text: string;
  user: Pick<User, 'username' | 'avatarUrl'>;
  timestamp: Date | Timestamp;
}

export interface Post {
  id: string;
  user: Pick<User, 'username' | 'avatarUrl'>;
  imageUrl: string;
  caption: string;
  timestamp: Date | Timestamp;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}
