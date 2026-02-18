import { ObjectId, Filter, UpdateFilter, FindOptions, Sort } from 'mongodb';
import { getCollection, COLLECTIONS } from '../db-client';
import { DatabaseService } from './db';

// FieldValue-like helper for MongoDB
// Note: These return special markers that will be processed during update operations
export const FieldValue = {
    increment: (value: number) => ({ __fieldValueType: 'increment', __value: value }),
    arrayUnion: (elements: any[] | any) => ({ __fieldValueType: 'arrayUnion', __value: Array.isArray(elements) ? elements : [elements] }),
    arrayRemove: (elements: any[] | any) => ({ __fieldValueType: 'arrayRemove', __value: Array.isArray(elements) ? elements : [elements] }),
    delete: () => ({ __fieldValueType: 'delete' }),
};

// Timestamp-like helper
export const Timestamp = {
    now: () => new Date(),
    fromDate: (date: Date) => date,
    fromMillis: (millis: number) => new Date(millis),
};

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
    if (typeof obj === 'object' && obj.constructor && obj.constructor.name === 'ObjectId') {
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

// Convert MongoDB document to Firestore-like format
function toFirestoreDoc(doc: any): any {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return {
        ...rest,
        id: _id ? _id.toString() : undefined,
    };
}

// Firestore-like collection wrapper
export function createCollectionWrapper(collectionName: string) {
    return {
        doc: (id: string) => ({
            get: async () => {
                try {
                    const doc = await DatabaseService.getById(collectionName, id);
                    return {
                        exists: !!doc,
                        data: () => doc ? convertTimestamps(toFirestoreDoc(doc)) : undefined,
                        id,
                    };
                } catch (error) {
                    // If ObjectId is invalid, return non-existent doc
                    return {
                        exists: false,
                        data: () => undefined,
                        id,
                    };
                }
            },
            set: async (data: any, options?: { merge?: boolean }) => {
                const existing = await DatabaseService.getById(collectionName, id);
                const docData = convertTimestamps(data);
                
                if (existing && options?.merge) {
                    await DatabaseService.updateById(collectionName, id, { $set: docData });
                } else if (existing) {
                    await DatabaseService.updateById(collectionName, id, { $set: docData });
                } else {
                    await DatabaseService.insertOne(collectionName, { ...docData, id });
                }
            },
            update: async (data: any) => {
                const docData = convertTimestamps(data);
                // Handle FieldValue operations
                const updateDoc: any = {};
                const incDoc: any = {};
                const unsetDoc: any = {};
                
                for (const [key, value] of Object.entries(docData)) {
                    if (value && typeof value === 'object' && (value as any).__fieldValueType === 'increment') {
                        // Handle FieldValue.increment()
                        incDoc[key] = (value as any).__value;
                    } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'delete') {
                        // Handle FieldValue.delete()
                        unsetDoc[key] = '';
                    } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'arrayUnion') {
                        // Handle FieldValue.arrayUnion()
                        updateDoc[key] = { $addToSet: { $each: (value as any).__value } };
                    } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'arrayRemove') {
                        // Handle FieldValue.arrayRemove()
                        updateDoc[key] = { $pull: { $in: (value as any).__value } };
                    } else {
                        updateDoc[key] = value;
                    }
                }
                
                const finalUpdate: any = {};
                if (Object.keys(updateDoc).length > 0) {
                    // Merge $set operations
                    const setOps: any = {};
                    for (const [key, value] of Object.entries(updateDoc)) {
                        if (value && typeof value === 'object' && ('$addToSet' in value || '$pull' in value)) {
                            // This is already a MongoDB operator, add it directly
                            Object.assign(finalUpdate, { [key]: value });
                        } else {
                            setOps[key] = value;
                        }
                    }
                    if (Object.keys(setOps).length > 0) {
                        finalUpdate.$set = setOps;
                    }
                }
                // Fix: Ensure $addToSet and $pull are at the top level of update object, not nested in $set
                for (const [key, value] of Object.entries(updateDoc)) {
                    if (value && typeof value === 'object') {
                        if ('$addToSet' in value) {
                            if (!finalUpdate.$addToSet) finalUpdate.$addToSet = {};
                            // Merge with existing $addToSet or create new
                            const addToSetVal = (value as any).$addToSet;
                            // If it has $each, we need to be careful
                            for (const [field, val] of Object.entries(addToSetVal)) {
                                finalUpdate.$addToSet[key] = val; 
                            }
                        } else if ('$pull' in value) {
                            if (!finalUpdate.$pull) finalUpdate.$pull = {};
                            const pullVal = (value as any).$pull;
                            for (const [field, val] of Object.entries(pullVal)) {
                                finalUpdate.$pull[key] = val;
                            }
                        }
                    }
                }
                
                // Remove the direct assignment done above which was incorrect for $addToSet/$pull
                // The previous logic was trying to put {$addToSet: ...} directly into the update object which works
                // but the logic to separate $set vs operators was flawed.
                
                // Let's simplify the logic completely.
                const simplifiedUpdate: any = {};
                const $set: any = {};
                const $addToSet: any = {};
                const $pull: any = {};
                
                for (const [key, value] of Object.entries(docData)) {
                    if (value && typeof value === 'object' && (value as any).__fieldValueType === 'increment') {
                        if (!simplifiedUpdate.$inc) simplifiedUpdate.$inc = {};
                        simplifiedUpdate.$inc[key] = (value as any).__value;
                    } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'delete') {
                        if (!simplifiedUpdate.$unset) simplifiedUpdate.$unset = {};
                        simplifiedUpdate.$unset[key] = '';
                    } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'arrayUnion') {
                        $addToSet[key] = { $each: (value as any).__value };
                    } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'arrayRemove') {
                        $pull[key] = { $in: (value as any).__value };
                    } else {
                        $set[key] = value;
                    }
                }
                
                if (Object.keys($set).length > 0) simplifiedUpdate.$set = $set;
                if (Object.keys($addToSet).length > 0) simplifiedUpdate.$addToSet = $addToSet;
                if (Object.keys($pull).length > 0) simplifiedUpdate.$pull = $pull;
                
                await DatabaseService.updateById(collectionName, id, simplifiedUpdate);
            },
            delete: async () => {
                await DatabaseService.deleteById(collectionName, id);
            },
            collection: (subCollectionName: string) => {
                const subCollectionFullName = `${collectionName}_${subCollectionName}`;
                return createCollectionWrapper(subCollectionFullName);
            },
        }),
        where: (field: string, operator: string, value: any) => {
            // Create a query builder that accumulates filters
            const filters: Array<{ field: string; operator: string; value: any }> = [
                { field, operator, value }
            ];
            
            const addFilter = (f: string, op: string, val: any) => {
                filters.push({ field: f, operator: op, value: val });
            };
            
            const buildFilter = (): Filter<any> => {
                const filter: any = {};
                for (const f of filters) {
                    if (f.operator === '==') {
                        filter[f.field] = f.value;
                    } else if (f.operator === '!=') {
                        filter[f.field] = { $ne: f.value };
                    } else if (f.operator === '>') {
                        filter[f.field] = { $gt: f.value };
                    } else if (f.operator === '>=') {
                        filter[f.field] = { $gte: f.value };
                    } else if (f.operator === '<') {
                        filter[f.field] = { $lt: f.value };
                    } else if (f.operator === '<=') {
                        filter[f.field] = { $lte: f.value };
                    } else if (f.operator === 'in') {
                        filter[f.field] = { $in: Array.isArray(f.value) ? f.value : [f.value] };
                    } else if (f.operator === 'array-contains') {
                        filter[f.field] = f.value;
                    }
                }
                return filter;
            };

            const queryBuilder: any = {
                where: (f: string, op: string, val: any) => {
                    addFilter(f, op, val);
                    return queryBuilder;
                },
                get: async () => {
                    const filter = buildFilter();
                    const docs = await DatabaseService.findMany(collectionName, filter);
                    return {
                        docs: docs.map((doc: any) => ({
                            id: doc.id || doc._id?.toString(),
                            data: () => convertTimestamps(toFirestoreDoc(doc)),
                            exists: true,
                        })),
                        empty: docs.length === 0,
                        size: docs.length,
                    };
                },
                limit: (num: number) => {
                    queryBuilder._limit = num;
                    const limitedBuilder: any = {
                        where: (f: string, op: string, val: any) => {
                            addFilter(f, op, val);
                            return limitedBuilder;
                        },
                        get: async () => {
                            const filter = buildFilter();
                            const docs = await DatabaseService.findMany(collectionName, filter, { limit: num });
                            return {
                                docs: docs.map((doc: any) => ({
                                    id: doc.id || doc._id?.toString(),
                                    data: () => convertTimestamps(toFirestoreDoc(doc)),
                                    exists: true,
                                })),
                                empty: docs.length === 0,
                                size: docs.length,
                            };
                        },
                        orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => ({
                            get: async () => {
                                const filter = buildFilter();
                                const sort: Sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                                const docs = await DatabaseService.findMany(collectionName, filter, { limit: num, sort });
                                return {
                                    docs: docs.map((doc: any) => ({
                                        id: doc.id || doc._id?.toString(),
                                        data: () => convertTimestamps(toFirestoreDoc(doc)),
                                        exists: true,
                                    })),
                                    empty: docs.length === 0,
                                    size: docs.length,
                                };
                            },
                        }),
                    };
                    return limitedBuilder;
                },
                orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => ({
                    where: (f: string, op: string, val: any) => {
                        addFilter(f, op, val);
                        return queryBuilder.orderBy(orderField, direction);
                    },
                    limit: (num: number) => ({
                        get: async () => {
                            const filter = buildFilter();
                            const sort: Sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                            const docs = await DatabaseService.findMany(collectionName, filter, { limit: num, sort });
                            return {
                                docs: docs.map((doc: any) => ({
                                    id: doc.id || doc._id?.toString(),
                                    data: () => convertTimestamps(toFirestoreDoc(doc)),
                                    exists: true,
                                })),
                                empty: docs.length === 0,
                                size: docs.length,
                            };
                        },
                        offset: (skipNum: number) => ({
                            get: async () => {
                                const filter = buildFilter();
                                const sort: Sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                                const docs = await DatabaseService.findMany(collectionName, filter, { limit: num, skip: skipNum, sort });
                                return {
                                    docs: docs.map((doc: any) => ({
                                        id: doc.id || doc._id?.toString(),
                                        data: () => convertTimestamps(toFirestoreDoc(doc)),
                                        exists: true,
                                    })),
                                    empty: docs.length === 0,
                                    size: docs.length,
                                };
                            },
                        }),
                    }),
                    get: async () => {
                        const filter = buildFilter();
                        const sort: Sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                        const docs = await DatabaseService.findMany(collectionName, filter, { sort });
                        return {
                            docs: docs.map((doc: any) => ({
                                id: doc.id || doc._id?.toString(),
                                data: () => convertTimestamps(toFirestoreDoc(doc)),
                                exists: true,
                            })),
                            empty: docs.length === 0,
                            size: docs.length,
                        };
                    },
                }),
            };
            
            return queryBuilder;
        },
        limit: (num: number) => ({
            get: async () => {
                const docs = await DatabaseService.findMany(collectionName, {}, { limit: num });
                return {
                    docs: docs.map((doc: any) => ({
                        id: doc.id || doc._id?.toString(),
                        data: () => convertTimestamps(toFirestoreDoc(doc)),
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
            orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => ({
                get: async () => {
                    const sort: Sort = { [field]: direction === 'asc' ? 1 : -1 };
                    const docs = await DatabaseService.findMany(collectionName, {}, { limit: num, sort });
                    return {
                        docs: docs.map((doc: any) => ({
                            id: doc.id || doc._id?.toString(),
                            data: () => convertTimestamps(toFirestoreDoc(doc)),
                            exists: true,
                        })),
                        empty: docs.length === 0,
                        size: docs.length,
                    };
                },
                offset: (skipNum: number) => ({
                    get: async () => {
                        const sort: Sort = { [field]: direction === 'asc' ? 1 : -1 };
                        const docs = await DatabaseService.findMany(collectionName, {}, { limit: num, skip: skipNum, sort });
                        return {
                            docs: docs.map((doc: any) => ({
                                id: doc.id || doc._id?.toString(),
                                data: () => convertTimestamps(toFirestoreDoc(doc)),
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
                    const docs = await DatabaseService.findMany(collectionName, {}, { limit: num, sort });
                    return {
                        docs: docs.map((doc: any) => ({
                            id: doc.id || doc._id?.toString(),
                            data: () => convertTimestamps(toFirestoreDoc(doc)),
                            exists: true,
                        })),
                        empty: docs.length === 0,
                        size: docs.length,
                    };
                },
                offset: (skipNum: number) => ({
                    get: async () => {
                        const sort: Sort = { [field]: direction === 'asc' ? 1 : -1 };
                        const docs = await DatabaseService.findMany(collectionName, {}, { limit: num, skip: skipNum, sort });
                        return {
                            docs: docs.map((doc: any) => ({
                                id: doc.id || doc._id?.toString(),
                                data: () => convertTimestamps(toFirestoreDoc(doc)),
                                exists: true,
                            })),
                            empty: docs.length === 0,
                            size: docs.length,
                        };
                    },
                }),
            }),
            get: async () => {
                const sort: Sort = { [field]: direction === 'asc' ? 1 : -1 };
                const docs = await DatabaseService.findMany(collectionName, {}, { sort });
                return {
                    docs: docs.map((doc: any) => ({
                        id: doc.id || doc._id?.toString(),
                        data: () => convertTimestamps(toFirestoreDoc(doc)),
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
        }),
        get: async () => {
            const docs = await DatabaseService.findMany(collectionName);
            return {
                docs: docs.map((doc: any) => ({
                    id: doc.id || doc._id?.toString(),
                    data: () => convertTimestamps(toFirestoreDoc(doc)),
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
        add: async (data: any) => {
            const docData = convertTimestamps(data);
            const result = await DatabaseService.insertOne(collectionName, docData);
            return {
                id: result.id,
            };
        },
    };
}

// Export collection wrappers
export const organisationsCollection = createCollectionWrapper(COLLECTIONS.ORGANISATIONS);
export const adminUsersCollection = createCollectionWrapper(COLLECTIONS.ADMIN_USERS);
export const superAdminUsersCollection = createCollectionWrapper(COLLECTIONS.SUPER_ADMIN_USERS);
export const emailVerificationsCollection = createCollectionWrapper(COLLECTIONS.EMAIL_VERIFICATIONS);

// Helper to extract collection name from Firestore reference
function getCollectionNameFromRef(ref: any): string {
    if (ref && ref.parent) {
        if (ref.parent.id) {
            // It's a document reference, get parent collection
            return ref.parent.id;
        } else if (ref.parent.parent && ref.parent.parent.id) {
            // It's a subcollection document reference
            return `${ref.parent.parent.id}_${ref.parent.id}`;
        }
    }
    throw new Error('Unable to determine collection name from reference');
}

// Export db wrapper for db.collection() pattern
export const db = {
    collection: (name: string) => createCollectionWrapper(name),
    batch: () => {
        const operations: Array<{ type: string; collection: string; id: string; data?: any; update?: any; options?: any }> = [];
        return {
            set: (ref: any, data: any, options?: any) => {
                try {
                    const collectionName = getCollectionNameFromRef(ref);
                    const docId = ref.id;
                    operations.push({ type: 'set', collection: collectionName, id: docId, data, options });
                } catch (error) {
                    console.error('Error in batch.set:', error);
                    throw error;
                }
            },
            update: (ref: any, data: any) => {
                try {
                    const collectionName = getCollectionNameFromRef(ref);
                    const docId = ref.id;
                    // Process FieldValue operations
                    const processedData = convertTimestamps(data);
                    operations.push({ type: 'update', collection: collectionName, id: docId, update: processedData });
                } catch (error) {
                    console.error('Error in batch.update:', error);
                    throw error;
                }
            },
            commit: async () => {
                // Execute all operations
                for (const op of operations) {
                    const collection = createCollectionWrapper(op.collection);
                    if (op.type === 'set') {
                        await collection.doc(op.id).set(op.data, op.options);
                    } else if (op.type === 'update') {
                        // Handle FieldValue operations in batch updates
                        const updateDoc: any = {};
                        const incDoc: any = {};
                        const unsetDoc: any = {};
                        
                        for (const [key, value] of Object.entries(op.update)) {
                            if (value && typeof value === 'object' && (value as any).__fieldValueType === 'increment') {
                                incDoc[key] = (value as any).__value;
                            } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'delete') {
                                unsetDoc[key] = '';
                            } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'arrayUnion') {
                                updateDoc[key] = { $addToSet: { $each: (value as any).__value } };
                            } else if (value && typeof value === 'object' && (value as any).__fieldValueType === 'arrayRemove') {
                                updateDoc[key] = { $pull: { $in: (value as any).__value } };
                            } else {
                                updateDoc[key] = value;
                            }
                        }
                        
                        const finalUpdate: any = {};
                        if (Object.keys(updateDoc).length > 0) {
                            const setOps: any = {};
                            for (const [key, value] of Object.entries(updateDoc)) {
                                if (value && typeof value === 'object' && ('$addToSet' in value || '$pull' in value)) {
                                    Object.assign(finalUpdate, { [key]: value });
                                } else {
                                    setOps[key] = value;
                                }
                            }
                            if (Object.keys(setOps).length > 0) {
                                finalUpdate.$set = setOps;
                            }
                        }
                        if (Object.keys(incDoc).length > 0) {
                            finalUpdate.$inc = incDoc;
                        }
                        if (Object.keys(unsetDoc).length > 0) {
                            finalUpdate.$unset = unsetDoc;
                        }
                        
                        await DatabaseService.updateById(op.collection, op.id, finalUpdate);
                    }
                }
            },
        };
    },
};

