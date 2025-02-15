// src/routes/api/followed-posts/[userId]/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Client, Databases, ID, Query } from 'appwrite';

// --- Appwrite Config ---
const APPWRITE_ENDPOINT = 'YOUR_APPWRITE_ENDPOINT';
const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID';
const APPWRITE_API_KEY = 'YOUR_APPWRITE_API_KEY';
const USER_COLLECTION_ID = 'YOUR_USER_COLLECTION_ID';
const POST_COLLECTION_ID = 'YOUR_POST_COLLECTION_ID';

const client = new Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// GET request
export const GET: RequestHandler = async ({ params }) => {
	try {
    const userId = params.userId;
    if(!userId){
      throw error(400, 'Missing userId');
    }
    const user = await databases.getDocument(
      APPWRITE_PROJECT_ID,
      USER_COLLECTION_ID,
      userId
    );
    if (!user) {
      throw error(404, 'User not found');
    }
    const followingIds = user.following;

    if (!followingIds || followingIds.length === 0) {
      return json([]); // Return empty array
    }

    const posts = await databases.listDocuments(
      APPWRITE_PROJECT_ID,
      POST_COLLECTION_ID,
        [
          Query.equal('creator', followingIds),
          Query.orderDesc('published'),
          Query.limit(100),  // Consider pagination
        ]
    );

		return json(posts.documents);
	} catch (e: any) {
    throw error(e.status || 500, e.message || 'Internal Server Error');
	}
};