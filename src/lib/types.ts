export interface User {
  id: string;
  username: string;
  name: string;
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
  timestamp: Date;
}

export interface Post {
  id: string;
  user: Pick<User, 'username' | 'avatarUrl'>;
  imageUrl: string;
  caption: string;
  timestamp: Date;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}
