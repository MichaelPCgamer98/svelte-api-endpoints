// src/routes/api/user/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Client, Databases, Account, ID, Storage, InnputFile, Query } from 'appwrite';

// --- Appwrite Configuration (Same as before) ---
const APPWRITE_ENDPOINT = 'YOUR_APPWRITE_ENDPOINT';
const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID';
const APPWRITE_API_KEY = 'YOUR_APPWRITE_API_KEY';
const USER_COLLECTION_ID = 'YOUR_USER_COLLECTION_ID';
const APPWRITE_BUCKET_ID = 'YOUR_BUCKET_ID';

const client = new Client();
client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const account = new Account(client);
const storage = new Storage(client);

// Heolper function to get user data
async function getCurrentUser() {
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

// GET request: Get current user info
export const GET: RequestHandler = async () => {
	try {
		const user = await getCurrentUser();
		if (!user) {
			throw error(401, 'Unauthorized');
		}
		const userDoc = await databases.getDocument(APPWRITE_PROJECT_ID, USER_COLLECTION_ID, user.$id)
		return json(userDoc);
	} catch (e: any) {
    throw error(e.status || 500, e.message || 'Internal Server Error');
	}
};

// PUT request: Update user settings (combined)
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw error(401, 'Unauthorized');
    }

    const data = await request.formData(); // Use formData for file uploads AND other data.
    const newUsername = data.get('username') as string | null;  // Get as string, handle null
    const newStatus = data.get('status') as 'public' | 'private' | null;
    const profilePic = data.get('profilePic') as File | null;

    const updateData: { [key: string]: any } = {}; // Build update object dynamically

    if (newUsername) {
      updateData.name = newUsername;
    }
    if (newStatus) {
      updateData.status = newStatus;
    }

    let fileUrl: string | undefined; // Store file URL if a new picture is uploaded

    if (profilePic) {
      const uploadedFile = await storage.createFile(
        APPWRITE_PROJECT_ID,
        APPWRITE_BUCKET_ID,
        ID.unique(),
        InputFile.fromBlob(profilePic)
      );
      fileUrl = storage.getFileView(APPWRITE_PROJECT_ID, APPWRITE_BUCKET_ID, uploadedFile.$id).href;
      updateData.profile_pic_url = fileUrl;
    }

    // Perform the update only if there's something to update
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await databases.updateDocument(
        APPWRITE_PROJECT_ID,
        USER_COLLECTION_ID,
        currentUser.$id,
        updateData
      );

      return json(updatedUser);
    }
    else{
      return json(currentUser); //No changes, return current user.
    }


  } catch (e: any) {
    throw error(e.status || 500, e.message || 'Internal Server Error');
  }
};