import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'wbf-platform';

let client: MongoClient | null = null;
let db: any = null;

// Initialize MongoDB connection
export async function connectMongoDB(): Promise<any> {
    if (db) {
        return db;
    }

    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`[MongoDB] Connected to database: ${DB_NAME}`);
        return db;
    } catch (error) {
        console.error('[MongoDB] Connection error:', error);
        throw error;
    }
}

// Get database instance
export async function getDB(): Promise<any> {
    if (!db) {
        return await connectMongoDB();
    }
    return db;
}

// Get collection helper
export async function getCollection<T = any>(collectionName: string): Promise<any> {
    const database = await getDB();
    return database.collection(collectionName);
}

// Close MongoDB connection
export async function closeMongoDB(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('[MongoDB] Connection closed');
    }
}

// Collection names
export const COLLECTIONS = {
    ORGANISATIONS: 'organisations',
    ADMIN_USERS: 'admin_users',
    SUPER_ADMIN_USERS: 'super_admin_users',
    EMAIL_VERIFICATIONS: 'email_verifications',
    CONVERSATIONS: 'conversations',
    ORGANISATION_CONVERSATIONS: 'organisationConversations',
    MESSAGES: 'messages', // Sub-collection equivalent
    PASSWORD_RESETS: 'password_resets',
} as const;

export default db;
