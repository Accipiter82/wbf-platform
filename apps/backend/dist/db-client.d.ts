declare let db: any;
export declare function connectMongoDB(): Promise<any>;
export declare function getDB(): Promise<any>;
export declare function getCollection<T = any>(collectionName: string): Promise<any>;
export declare function closeMongoDB(): Promise<void>;
export declare const COLLECTIONS: {
    readonly ORGANISATIONS: "organisations";
    readonly ADMIN_USERS: "admin_users";
    readonly SUPER_ADMIN_USERS: "super_admin_users";
    readonly EMAIL_VERIFICATIONS: "email_verifications";
    readonly CONVERSATIONS: "conversations";
    readonly ORGANISATION_CONVERSATIONS: "organisationConversations";
    readonly MESSAGES: "messages";
};
export default db;
//# sourceMappingURL=db-client.d.ts.map