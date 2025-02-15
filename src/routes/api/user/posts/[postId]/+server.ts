// src/routes/api/posts/[postId]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Client, Databases, Account, ID } from 'appwrite';

// --- Appwrite Configuration (Same) ---
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
    throw e;
  }
}

// GET request: Get a specific post
export const GET: RequestHandler = async ({ params }) => {
    try {
        const postId = params.postId;
        if (!postId) {
          throw error(400, "Missing postId");
        }
        const post = await databases.getDocument(APPWRITE_PROJECT_ID, POST_COLLECTION_ID, postId);
        if(!post){
          throw error(404, "Post not found");
        }
        return json(post);

    } catch (e: any) {
      throw error(e.status || 500, e.message || 'Internal Server Error');
    }
};

// PUT request: Modify a post
export const PUT: RequestHandler = async ({ request, params }) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          throw error(401, 'Unauthorized');
        }

        const postId = params.postId;
        if (!postId) {
          throw error(400, "Missing postId");
        }
        const { str1, str2 } = await request.json();
        const newContent = { str1, str2 };
        if(!str1 || !str2){
          throw error(400, "Missing required fields");
        }
        const existingPost = await databases.getDocument(
          APPWRITE_PROJECT_ID,
          POST_COLLECTION_ID,
            postId
        );

        if (existingPost.creator !== currentUser.$id) {
          throw error(403, 'Forbidden');
        }

        const updatedPost = await databases.updateDocument(
          APPWRITE_PROJECT_ID,
          POST_COLLECTION_ID,
            postId,
            { content: newContent }
        );

        return json(updatedPost);

    } catch (e: any) {
      throw error(e.status || 500, e.message || 'Internal Server Error');
    }
};

// DELETE request: Delete a post
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw error(401, 'Unauthorized');
    }

    const postId = params.postId;
    if (!postId) {
      throw error(400, "Missing postId");
    }
    const existingPost = await databases.getDocument(
      APPWRITE_PROJECT_ID,
      POST_COLLECTION_ID,
      postId
    );
    if(!existingPost){
      throw error(404, "Post not found");
    }
    if (existingPost.creator !== currentUser.$id) {
      throw error(403, 'Forbidden');
    }

    // Decrement num_posts *before* deleting
    await databases.updateDocument(
      APPWRITE_PROJECT_ID,
      USER_COLLECTION_ID,
        currentUser.$id,
        { num_posts: currentUser.num_posts - 1 } // Good to have a try...catch, but less critical here
    );

    await databases.deleteDocument(
      APPWRITE_PROJECT_ID,
      POST_COLLECTION_ID,
      postId
    );

    return json({ message: 'Post deleted successfully' });

  } catch (e: any) {
    throw error(e.status || 500, e.message || 'Internal Server Error');
  }
};