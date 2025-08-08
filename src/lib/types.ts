
export interface User {
  id: string; // This will be the Firebase Auth UID
  username: string;
  name: string;
  email?: string;
  avatarUrl: string;
  bio?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likedPosts: string[]; // Array of liked post IDs
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  user: Pick<User, 'username' | 'avatarUrl' | 'id'>; // This will be added client-side
  timestamp: Date;
}

export interface Post {
  id: string;
  userId: string;
  user: Pick<User, 'username' | 'avatarUrl' | 'id'>; // This will be added client-side
  imageUrl: string;
  caption: string;
  timestamp: Date;
  likes: number;
  comments: Comment[];
  isLiked: boolean; // This will be determined client-side per user
}
