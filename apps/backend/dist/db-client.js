"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTIONS = void 0;
exports.connectMongoDB = connectMongoDB;
exports.getDB = getDB;
exports.getCollection = getCollection;
exports.closeMongoDB = closeMongoDB;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'wbf-platform';
let client = null;
let db = null;
async function connectMongoDB() {
    if (db) {
        return db;
    }
    try {
        client = new mongodb_1.MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`[MongoDB] Connected to database: ${DB_NAME}`);
        return db;
    }
    catch (error) {
        console.error('[MongoDB] Connection error:', error);
        throw error;
    }
}
async function getDB() {
    if (!db) {
        return await connectMongoDB();
    }
    return db;
}
async function getCollection(collectionName) {
    const database = await getDB();
    return database.collection(collectionName);
}
async function closeMongoDB() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('[MongoDB] Connection closed');
    }
}
exports.COLLECTIONS = {
    ORGANISATIONS: 'organisations',
    ADMIN_USERS: 'admin_users',
    SUPER_ADMIN_USERS: 'super_admin_users',
    EMAIL_VERIFICATIONS: 'email_verifications',
    CONVERSATIONS: 'conversations',
    ORGANISATION_CONVERSATIONS: 'organisationConversations',
    MESSAGES: 'messages',
};
exports.default = db;
//# sourceMappingURL=db-client.js.map