
// scripts/seed.ts
import { db } from '../src/lib/firebase';
import { initialPosts } from '../src/lib/data';
import { collection, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { users } from '../src/lib/data';
import type { Post, Comment } from '../src/lib/types';

async function seedDatabase() {
  console.log('Starting to seed database...');
  const batch = writeBatch(db);

  // Seed users
  const usersCollection = collection(db, 'users');
  console.log(`Seeding ${users.length} users...`);
  users.forEach((user) => {
    const userRef = doc(usersCollection, user.id);
    batch.set(userRef, user);
  });
  console.log('Users added to batch.');

  // Seed posts
  const postsCollection = collection(db, 'posts');
   console.log(`Seeding ${initialPosts.length} posts...`);
  initialPosts.forEach((post) => {
    // Firestore can't store Date objects with nested data like in comments, so convert to Timestamps
    const postDataForFirestore = {
        ...post,
        timestamp: Timestamp.fromDate(post.timestamp as Date), // Convert Date to Firestore Timestamp
        comments: post.comments.map(c => ({
            ...c,
            user: { id: c.user.id, username: c.user.username, avatarUrl: c.user.avatarUrl },
            timestamp: Timestamp.fromDate(c.timestamp as Date) // Convert Date to Firestore Timestamp
        }))
    };
    const postRef = doc(postsCollection, post.id);
    batch.set(postRef, postDataForFirestore);
  });
  console.log('Posts added to batch.');

  try {
    await batch.commit();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
