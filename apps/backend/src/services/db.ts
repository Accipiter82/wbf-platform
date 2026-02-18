import { Filter, UpdateFilter, FindOptions, Sort } from 'mongodb';
import { getCollection, COLLECTIONS } from '../db-client';

// Get ObjectId constructor
// lazy load to be safe
let ObjectIdConstructor: any = null;

function getObjectId(): any {
    if (!ObjectIdConstructor) {
        try {
            const mongodb = require('mongodb');
            ObjectIdConstructor = mongodb.ObjectId;
        } catch (e: any) {
            console.error('[ERROR] Failed to load ObjectId:', e.message || e);
            throw new Error(`Cannot load ObjectId from mongodb module: ${e.message || e}`);
        }
    }
    return ObjectIdConstructor;
}

// Helper to safely create ObjectId from string or ObjectId
function createObjectId(id: string | any): any {
    // Get ObjectId constructor
    const ObjectId = getObjectId();
    
    // If already an ObjectId, return it
    if (id && typeof id === 'object' && id.constructor && id.constructor.name === 'ObjectId') {
        return id;
    }
    
    // If it's a string, create ObjectId
    if (typeof id === 'string') {
        // Validate hex string format (24 hex characters)
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
            // Use createFromHexString - this is the reliable method in MongoDB v7
            if (!ObjectId) {
                throw new Error('ObjectId constructor not loaded');
            }
            
            if (typeof ObjectId.createFromHexString === 'function') {
                return ObjectId.createFromHexString(id);
            }
            
            // If createFromHexString doesn't exist, try constructor (shouldn't happen in v7)
            if (typeof ObjectId === 'function') {
                // Use call/apply pattern to avoid 'new' keyword issues
                const objId = Object.create(ObjectId.prototype);
                const result = ObjectId.call(objId, id);
                return result || objId;
            }
        }
        
        // If not a valid ObjectId hex string, return as is (support for custom string IDs)
        return id;
    }
    
    throw new Error(`Cannot create ObjectId from: ${id} (type: ${typeof id})`);
}

// Helper to convert Firestore Timestamp-like objects to Date
function convertTimestamp(value: any): any {
    if (value && typeof value === 'object') {
        if (value.toDate && typeof value.toDate === 'function') {
            return value.toDate();
        }
        if (value.seconds && typeof value.seconds === 'number') {
            return new Date(value.seconds * 1000);
        }
        if (value._seconds && typeof value._seconds === 'number') {
            return new Date(value._seconds * 1000);
        }
    }
    return value;
}

// Recursively convert timestamps in objects
function convertTimestamps(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
    }
    // Check if it's a Date
    if (obj instanceof Date) {
        return convertTimestamp(obj);
    }
    // Check if it's an ObjectId using a safer method
    if (typeof obj === 'object' && obj && obj.constructor && obj.constructor.name === 'ObjectId') {
        return obj;
    }
    // Check if it's a plain object
    if (typeof obj === 'object' && obj.constructor === Object) {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertTimestamps(value);
        }
        return converted;
    }
    return convertTimestamp(obj);
}

// Convert MongoDB document to include id field
function toDocument<T extends { id?: string }>(doc: any): T {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    return {
        ...rest,
        id: _id.toString(),
    } as unknown as T;
}

// Database service class
export class DatabaseService {
    // Generic find one
    static async findOne<T>(
        collectionName: string,
        filter: Filter<any>,
        options?: FindOptions
    ): Promise<T | null> {
        const collection = await getCollection(collectionName);
        const doc = await collection.findOne(filter, options);
        if (!doc) return null;
        // Remove "as unknown as T" to ensure type safety; just return the converted object.
        const converted = toDocument(doc);
        return convertTimestamps(converted) as T;
    }

    // Generic find many
    static async findMany<T>(
        collectionName: string,
        filter: Filter<any> = {},
        options?: FindOptions & { skip?: number }
    ): Promise<T[]> {
        const collection = await getCollection(collectionName);
        let cursor = collection.find(filter, options);
        if (options?.skip) {
            cursor = cursor.skip(options.skip);
        }
        if (options?.limit) {
            cursor = cursor.limit(options.limit);
        }
        if (options?.sort) {
            cursor = cursor.sort(options.sort);
        }
        const docs = await cursor.toArray();
        return docs.map((doc: any) => toDocument<any>(convertTimestamps(doc))) as unknown as T[];
    }

    // Generic insert one
    static async insertOne<T>(
        collectionName: string,
        document: any
    ): Promise<{ id: string }> {
        const collection = await getCollection(collectionName);
        const doc = convertTimestamps(document);
        // Convert id to _id if present
        if (doc.id) {
            doc._id = createObjectId(doc.id);
            delete doc.id;
        }
        const result = await collection.insertOne(doc);
        return { id: result.insertedId.toString() };
    }

    // Generic update one
    static async updateOne(
        collectionName: string,
        filter: Filter<any>,
        update: UpdateFilter<any>
    ): Promise<{ matchedCount: number; modifiedCount: number }> {
        const collection = await getCollection(collectionName);
        // Convert id to _id in filter
        const mongoFilter = this.convertIdToObjectId(filter);
        const mongoUpdate = this.convertUpdateOperators(update);
        const result = await collection.updateOne(mongoFilter, mongoUpdate);
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        };
    }

    // Generic delete one
    static async deleteOne(
        collectionName: string,
        filter: Filter<any>
    ): Promise<{ deletedCount: number }> {
        const collection = await getCollection(collectionName);
        const mongoFilter = this.convertIdToObjectId(filter);
        const result = await collection.deleteOne(mongoFilter);
        return { deletedCount: result.deletedCount };
    }

    // Generic count
    static async count(
        collectionName: string,
        filter: Filter<any> = {}
    ): Promise<number> {
        const collection = await getCollection(collectionName);
        const mongoFilter = this.convertIdToObjectId(filter);
        return await collection.countDocuments(mongoFilter);
    }

    // Convert id field to _id for MongoDB
    static convertIdToObjectId(filter: any): any {
        if (!filter || typeof filter !== 'object') {
            return filter;
        }
        if (Array.isArray(filter)) {
            return filter.map(item => this.convertIdToObjectId(item));
        }
        const converted: any = {};
        for (const [key, value] of Object.entries(filter)) {
            if (key === 'id') {
                converted._id = createObjectId(value as string);
            } else if (key === '$or' || key === '$and' || key === '$nor') {
                converted[key] = (value as any[]).map(item => this.convertIdToObjectId(item));
            } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                // Check if it's an ObjectId using constructor name
                if (value.constructor && value.constructor.name === 'ObjectId') {
                    converted[key] = value;
                } else {
                    converted[key] = this.convertIdToObjectId(value);
                }
            } else {
                converted[key] = value;
            }
        }
        return converted;
    }

    // Convert Firestore FieldValue operators to MongoDB operators
    static convertUpdateOperators(update: any): any {
        if (!update || typeof update !== 'object') {
            return update;
        }
        const converted: any = {};
        for (const [key, value] of Object.entries(update)) {
            if (key === '$set' || key === '$unset' || key === '$inc' || key === '$push' || key === '$pull' || key === '$addToSet') {
                converted[key] = this.convertUpdateOperators(value);
            } else if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'FieldValue') {
                // Handle Firestore FieldValue operations
                const fieldValue = value as any;
                if (fieldValue._methodName === 'increment') {
                    converted.$inc = { ...converted.$inc, [key]: fieldValue._value };
                } else if (fieldValue._methodName === 'arrayUnion') {
                    converted.$addToSet = { ...converted.$addToSet, [key]: { $each: fieldValue._value } };
                } else if (fieldValue._methodName === 'arrayRemove') {
                    converted.$pull = { ...converted.$pull, [key]: { $in: fieldValue._value } };
                } else if (fieldValue._methodName === 'delete') {
                    converted.$unset = { ...converted.$unset, [key]: '' };
                } else {
                    converted[key] = value;
                }
            } else {
                converted[key] = convertTimestamps(value);
            }
        }
        return converted;
    }

    // Get document by ID
    static async getById<T>(collectionName: string, id: string): Promise<T | null> {
        return this.findOne<T>(collectionName, { _id: createObjectId(id) });
    }

    // Update document by ID
    static async updateById(
        collectionName: string,
        id: string,
        update: UpdateFilter<any>
    ): Promise<{ matchedCount: number; modifiedCount: number }> {
        return this.updateOne(collectionName, { _id: createObjectId(id) }, update);
    }

    // Delete document by ID
    static async deleteById(
        collectionName: string,
        id: string
    ): Promise<{ deletedCount: number }> {
        return this.deleteOne(collectionName, { _id: createObjectId(id) });
    }
}

// Export collection helpers for convenience
export const organisationsCollection = {
    doc: (id: string) => ({
        get: async () => ({
            exists: true,
            data: () => DatabaseService.getById(COLLECTIONS.ORGANISATIONS, id),
            id,
        }),
        set: async (data: any) => {
            const existing = await DatabaseService.getById(COLLECTIONS.ORGANISATIONS, id);
            if (existing) {
                await DatabaseService.updateById(COLLECTIONS.ORGANISATIONS, id, { $set: data });
            } else {
                await DatabaseService.insertOne(COLLECTIONS.ORGANISATIONS, { ...data, id });
            }
        },
        update: async (data: any) => {
            await DatabaseService.updateById(COLLECTIONS.ORGANISATIONS, id, { $set: data });
        },
        delete: async () => {
            await DatabaseService.deleteById(COLLECTIONS.ORGANISATIONS, id);
        },
    }),
    where: (field: string, operator: string, value: any) => ({
        get: async () => {
            const filter: any = {};
            if (operator === '==') filter[field] = value;
            else if (operator === '!=') filter[field] = { $ne: value };
            else if (operator === '>') filter[field] = { $gt: value };
            else if (operator === '>=') filter[field] = { $gte: value };
            else if (operator === '<') filter[field] = { $lt: value };
            else if (operator === '<=') filter[field] = { $lte: value };
            else if (operator === 'in') filter[field] = { $in: value };
            else if (operator === 'array-contains') filter[field] = value;
            const docs = await DatabaseService.findMany(COLLECTIONS.ORGANISATIONS, filter);
            return {
                docs: docs.map((doc: any) => ({
                    id: doc.id,
                    data: () => doc,
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
        limit: (num: number) => ({
            get: async () => {
                const filter: any = {};
                if (operator === '==') filter[field] = value;
                else if (operator === '!=') filter[field] = { $ne: value };
                else if (operator === '>') filter[field] = { $gt: value };
                else if (operator === '>=') filter[field] = { $gte: value };
                else if (operator === '<') filter[field] = { $lt: value };
                else if (operator === '<=') filter[field] = { $lte: value };
                else if (operator === 'in') filter[field] = { $in: value };
                else if (operator === 'array-contains') filter[field] = value;
                const docs = await DatabaseService.findMany(COLLECTIONS.ORGANISATIONS, filter, { limit: num });
                return {
                    docs: docs.map((doc: any) => ({
                        id: doc.id,
                        data: () => doc,
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
        }),
        orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => ({
            limit: (num: number) => ({
                get: async () => {
                    const filter: any = {};
                    if (operator === '==') filter[field] = value;
                    else if (operator === '!=') filter[field] = { $ne: value };
                    else if (operator === '>') filter[field] = { $gt: value };
                    else if (operator === '>=') filter[field] = { $gte: value };
                    else if (operator === '<') filter[field] = { $lt: value };
                    else if (operator === '<=') filter[field] = { $lte: value };
                    else if (operator === 'in') filter[field] = { $in: value };
                    else if (operator === 'array-contains') filter[field] = value;
                    const sort: Sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                    const docs = await DatabaseService.findMany(COLLECTIONS.ORGANISATIONS, filter, { limit: num, sort });
                    return {
                        docs: docs.map((doc: any) => ({
                            id: doc.id,
                            data: () => doc,
                            exists: true,
                        })),
                        empty: docs.length === 0,
                        size: docs.length,
                    };
                },
            }),
        }),
    }),
    orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => ({
        limit: (num: number) => ({
            get: async () => {
                const sort: Sort = { [field]: direction === 'asc' ? 1 : -1 };
                const docs = await DatabaseService.findMany(COLLECTIONS.ORGANISATIONS, {}, { limit: num, sort });
                return {
                    docs: docs.map((doc: any) => ({
                        id: doc.id,
                        data: () => doc,
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
        }),
        get: async () => {
            const sort: Sort = { [field]: direction === 'asc' ? 1 : -1 };
            const docs = await DatabaseService.findMany(COLLECTIONS.ORGANISATIONS, {}, { sort });
            return {
                docs: docs.map((doc: any) => ({
                    id: doc.id,
                    data: () => doc,
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
    }),
    get: async () => {
        const docs = await DatabaseService.findMany(COLLECTIONS.ORGANISATIONS);
        return {
            docs: docs.map((doc: any) => ({
                id: doc.id,
                data: () => doc,
                exists: true,
            })),
            empty: docs.length === 0,
            size: docs.length,
        };
    },
};

// Similar helpers for other collections
export const adminUsersCollection = {
    doc: (id: string) => ({
        get: async () => ({
            exists: true,
            data: () => DatabaseService.getById(COLLECTIONS.ADMIN_USERS, id),
            id,
        }),
        set: async (data: any) => {
            const existing = await DatabaseService.getById(COLLECTIONS.ADMIN_USERS, id);
            if (existing) {
                await DatabaseService.updateById(COLLECTIONS.ADMIN_USERS, id, { $set: data });
            } else {
                await DatabaseService.insertOne(COLLECTIONS.ADMIN_USERS, { ...data, id });
            }
        },
        update: async (data: any) => {
            await DatabaseService.updateById(COLLECTIONS.ADMIN_USERS, id, { $set: data });
        },
        delete: async () => {
            await DatabaseService.deleteById(COLLECTIONS.ADMIN_USERS, id);
        },
    }),
    where: (field: string, operator: string, value: any) => ({
        get: async () => {
            const filter: any = {};
            if (operator === '==') filter[field] = value;
            else if (operator === 'in') filter[field] = { $in: value };
            const docs = await DatabaseService.findMany(COLLECTIONS.ADMIN_USERS, filter);
            return {
                docs: docs.map((doc: any) => ({
                    id: doc.id,
                    data: () => doc,
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
        limit: (num: number) => ({
            get: async () => {
                const filter: any = {};
                if (operator === '==') filter[field] = value;
                else if (operator === 'in') filter[field] = { $in: value };
                const docs = await DatabaseService.findMany(COLLECTIONS.ADMIN_USERS, filter, { limit: num });
                return {
                    docs: docs.map((doc: any) => ({
                        id: doc.id,
                        data: () => doc,
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
        }),
    }),
    get: async () => {
        const docs = await DatabaseService.findMany(COLLECTIONS.ADMIN_USERS);
        return {
            docs: docs.map((doc: any) => ({
                id: doc.id,
                data: () => doc,
                exists: true,
            })),
            empty: docs.length === 0,
            size: docs.length,
        };
    },
};

export const superAdminUsersCollection = {
    doc: (id: string) => ({
        get: async () => ({
            exists: true,
            data: () => DatabaseService.getById(COLLECTIONS.SUPER_ADMIN_USERS, id),
            id,
        }),
        set: async (data: any) => {
            const existing = await DatabaseService.getById(COLLECTIONS.SUPER_ADMIN_USERS, id);
            if (existing) {
                await DatabaseService.updateById(COLLECTIONS.SUPER_ADMIN_USERS, id, { $set: data });
            } else {
                await DatabaseService.insertOne(COLLECTIONS.SUPER_ADMIN_USERS, { ...data, id });
            }
        },
        update: async (data: any) => {
            await DatabaseService.updateById(COLLECTIONS.SUPER_ADMIN_USERS, id, { $set: data });
        },
        delete: async () => {
            await DatabaseService.deleteById(COLLECTIONS.SUPER_ADMIN_USERS, id);
        },
    }),
    where: (field: string, operator: string, value: any) => ({
        get: async () => {
            const filter: any = {};
            if (operator === '==') filter[field] = value;
            else if (operator === 'in') filter[field] = { $in: value };
            const docs = await DatabaseService.findMany(COLLECTIONS.SUPER_ADMIN_USERS, filter);
            return {
                docs: docs.map((doc: any) => ({
                    id: doc.id,
                    data: () => doc,
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
        limit: (num: number) => ({
            get: async () => {
                const filter: any = {};
                if (operator === '==') filter[field] = value;
                else if (operator === 'in') filter[field] = { $in: value };
                const docs = await DatabaseService.findMany(COLLECTIONS.SUPER_ADMIN_USERS, filter, { limit: num });
                return {
                    docs: docs.map((doc: any) => ({
                        id: doc.id,
                        data: () => doc,
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
        }),
    }),
    get: async () => {
        const docs = await DatabaseService.findMany(COLLECTIONS.SUPER_ADMIN_USERS);
        return {
            docs: docs.map((doc: any) => ({
                id: doc.id,
                data: () => doc,
                exists: true,
            })),
            empty: docs.length === 0,
            size: docs.length,
        };
    },
};

export const emailVerificationsCollection = {
    doc: (id: string) => ({
        get: async () => ({
            exists: true,
            data: () => DatabaseService.getById(COLLECTIONS.EMAIL_VERIFICATIONS, id),
            id,
        }),
        set: async (data: any) => {
            const existing = await DatabaseService.getById(COLLECTIONS.EMAIL_VERIFICATIONS, id);
            if (existing) {
                await DatabaseService.updateById(COLLECTIONS.EMAIL_VERIFICATIONS, id, { $set: data });
            } else {
                await DatabaseService.insertOne(COLLECTIONS.EMAIL_VERIFICATIONS, { ...data, id });
            }
        },
        update: async (data: any) => {
            await DatabaseService.updateById(COLLECTIONS.EMAIL_VERIFICATIONS, id, { $set: data });
        },
    }),
};

// Helper for db.collection() pattern
export const db = {
    collection: (name: string) => ({
        doc: (id: string) => ({
            get: async () => {
                const doc = await DatabaseService.getById(name, id);
                return {
                    exists: !!doc,
                    data: () => doc,
                    id,
                };
            },
            set: async (data: any, options?: any) => {
                const existing = await DatabaseService.getById(name, id);
                if (existing && options?.merge) {
                    await DatabaseService.updateById(name, id, { $set: data });
                } else if (existing) {
                    await DatabaseService.updateById(name, id, { $set: data });
                } else {
                    await DatabaseService.insertOne(name, { ...data, id });
                }
            },
            update: async (data: any) => {
                await DatabaseService.updateById(name, id, { $set: data });
            },
            delete: async () => {
                await DatabaseService.deleteById(name, id);
            },
            collection: (subCollectionName: string) => ({
                doc: (subId: string) => ({
                    get: async () => {
                        const doc = await DatabaseService.getById(`${name}_${subCollectionName}`, `${id}_${subId}`);
                        return {
                            exists: !!doc,
                            data: () => doc,
                            id: subId,
                        };
                    },
                    set: async (data: any, options?: any) => {
                        const existing = await DatabaseService.getById(`${name}_${subCollectionName}`, `${id}_${subId}`);
                        if (existing && options?.merge) {
                            await DatabaseService.updateById(`${name}_${subCollectionName}`, `${id}_${subId}`, { $set: data });
                        } else if (existing) {
                            await DatabaseService.updateById(`${name}_${subCollectionName}`, `${id}_${subId}`, { $set: data });
                        } else {
                            await DatabaseService.insertOne(`${name}_${subCollectionName}`, { ...data, parentId: id, id: subId });
                        }
                    },
                }),
            }),
        }),
        where: (field: string, operator: string, value: any) => ({
            get: async () => {
                const filter: any = {};
                if (operator === '==') filter[field] = value;
                else if (operator === 'in') filter[field] = { $in: value };
                else if (operator === '>=') filter[field] = { $gte: value };
                else if (operator === '<=') filter[field] = { $lte: value };
                const docs = await DatabaseService.findMany(name, filter);
                return {
                    docs: docs.map((doc: any) => ({
                        id: doc.id,
                        data: () => doc,
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
            orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => ({
                limit: (num: number) => ({
                    get: async () => {
                        const filter: any = {};
                        if (operator === '==') filter[field] = value;
                        else if (operator === 'in') filter[field] = { $in: value };
                        else if (operator === '>=') filter[field] = { $gte: value };
                        else if (operator === '<=') filter[field] = { $lte: value };
                        const sort: Sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                        const docs = await DatabaseService.findMany(name, filter, { limit: num, sort });
                        return {
                            docs: docs.map((doc: any) => ({
                                id: doc.id,
                                data: () => doc,
                                exists: true,
                            })),
                            empty: docs.length === 0,
                            size: docs.length,
                        };
                    },
                }),
            }),
        }),
    }),
};


