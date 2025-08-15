
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
  following: string[]; // Array of user IDs the user is following
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  user: Pick<User, 'username' | 'avatarUrl' | 'id'>; // This will be added client-side
  timestamp: Date;
}

export interface Media {
  url: string;
  type: 'image' | 'video';
}

export interface Post {
  id: string;
  userId: string;
  user: Pick<User, 'username' | 'avatarUrl' | 'id'>; // This will be added client-side
  media: Media[];
  caption: string;
  timestamp: Date;
  likes: number;
  comments: Comment[];
  isLiked: boolean; // This will be determined client-side per user
}
