// src/routes/api/users/[userId]/+server.ts

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Client, Databases} from 'appwrite';

// --- Appwrite Config ---
const APPWRITE_ENDPOINT = 'YOUR_APPWRITE_ENDPOINT';
const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID';
const APPWRITE_API_KEY = 'YOUR_APPWRITE_API_KEY';
const USER_COLLECTION_ID = 'YOUR_USER_COLLECTION_ID';

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
    if (!userId) {
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
    return json(user);

	} catch (e: any) {
    throw error(e.status || 500, e.message || 'Internal Server Error');
	}
};