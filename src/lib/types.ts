
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
  userId: string;
  user: Pick<User, 'id' | 'username' | 'avatarUrl'>; // This will be added client-side
  timestamp: Date;
}

export interface Post {
  id: string;
  userId: string;
  user: Pick<User, 'username' | 'avatarUrl'>; // This will be added client-side
  imageUrl: string;
  caption: string;
  timestamp: Date;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}
