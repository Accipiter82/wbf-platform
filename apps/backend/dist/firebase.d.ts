import admin from "firebase-admin";
import { Bucket } from "@google-cloud/storage";
declare let bucket: Bucket | undefined;
export declare const db: admin.firestore.Firestore;
export declare const auth: import("firebase-admin/lib/auth/auth").Auth;
export { bucket };
export declare const organisationsCollection: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
export declare const adminUsersCollection: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
export declare const superAdminUsersCollection: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
export declare const emailVerificationsCollection: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
export default admin;
//# sourceMappingURL=firebase.d.ts.map