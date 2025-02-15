// src/routes/api/posts/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Client, Databases, Account, ID } from 'appwrite';

// --- Appwrite Config (Same) ---
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
const account = new Account(client);

async function getCurrentUser() { // Same helper
  try {
    const session = await account.getSession('current');
    const user = await account.get();
    return user;
  } catch (e: any) {
    if (e.code === 401) {
      return null;
    }
    console.error("Error getting current user:", e);
    throw e; // Re-throw for higher-level handling
  }
}

// POST request: Add a new post
export const POST: RequestHandler = async ({ request }) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw error(401, 'Unauthorized');
    }

    const { str1, str2 } = await request.json();
    const content = { str1, str2 };
    if(!str1 || !str2){
      throw error(400, "Missing required fields");
    }

    const newPost = await databases.createDocument(
      APPWRITE_PROJECT_ID,
      POST_COLLECTION_ID,
      ID.unique(),
      {
        creator: currentUser.$id,
        published: new Date(),
        content
      }
    );

    // Increment user's num_posts
    await databases.updateDocument(
      APPWRITE_PROJECT_ID,
      USER_COLLECTION_ID,
      currentUser.$id,
      { num_posts: currentUser.num_posts + 1 } // Good to have a try...catch, but less critical here
    );
    return json(newPost, { status: 201 });

  } catch (e: any) {
    throw error(e.status || 500, e.message || 'Internal Server Error');
  }
};