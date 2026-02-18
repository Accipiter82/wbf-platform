"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerificationsCollection = exports.superAdminUsersCollection = exports.adminUsersCollection = exports.organisationsCollection = exports.bucket = exports.auth = exports.db = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const storage_1 = require("firebase-admin/storage");
function getFirebaseAdminConfig() {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        return {
            credential: firebase_admin_1.default.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
        };
    }
    return {
        credential: firebase_admin_1.default.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    };
}
const config = getFirebaseAdminConfig();
console.log('[DEBUG] Firebase Admin config:', {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    storageBucket: config.storageBucket
});
const app = firebase_admin_1.default.initializeApp(config);
let bucket;
try {
    const storage = (0, storage_1.getStorage)(app);
    exports.bucket = bucket = storage.bucket();
    bucket.getMetadata()
        .then(() => {
        console.log('[DEBUG] Storage bucket exists and is accessible:', config.storageBucket);
    })
        .catch((error) => {
        console.error('[ERROR] Storage bucket does not exist or is not accessible:', config.storageBucket);
        console.error('[ERROR] Error details:', error.message);
        console.error('[ERROR] Please create the storage bucket manually in Firebase Console:');
        console.error('[ERROR] 1. Go to Firebase Console > Storage');
        console.error('[ERROR] 2. Click "Get Started" or "Create bucket"');
        console.error('[ERROR] 3. Use bucket name:', config.storageBucket);
    });
}
catch (error) {
    console.error('[ERROR] Failed to initialize Firebase Storage:', error);
}
exports.db = firebase_admin_1.default.firestore();
exports.auth = firebase_admin_1.default.auth();
exports.organisationsCollection = exports.db.collection("organisations");
exports.adminUsersCollection = exports.db.collection("admin_users");
exports.superAdminUsersCollection = exports.db.collection("super_admin_users");
exports.emailVerificationsCollection = exports.db.collection("email_verifications");
exports.default = firebase_admin_1.default;
//# sourceMappingURL=firebase.js.map