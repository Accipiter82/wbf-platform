"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.emailVerificationsCollection = exports.superAdminUsersCollection = exports.adminUsersCollection = exports.organisationsCollection = exports.DatabaseService = void 0;
const db_client_1 = require("../db-client");
let ObjectIdConstructor = null;
function getObjectId() {
    if (!ObjectIdConstructor) {
        try {
            const mongodb = require('mongodb');
            ObjectIdConstructor = mongodb.ObjectId;
        }
        catch (e) {
            console.error('[ERROR] Failed to load ObjectId:', e.message || e);
            throw new Error(`Cannot load ObjectId from mongodb module: ${e.message || e}`);
        }
    }
    return ObjectIdConstructor;
}
function createObjectId(id) {
    const ObjectId = getObjectId();
    if (id && typeof id === 'object' && id.constructor && id.constructor.name === 'ObjectId') {
        return id;
    }
    if (typeof id === 'string') {
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
            if (!ObjectId) {
                throw new Error('ObjectId constructor not loaded');
            }
            if (typeof ObjectId.createFromHexString === 'function') {
                return ObjectId.createFromHexString(id);
            }
            if (typeof ObjectId === 'function') {
                const objId = Object.create(ObjectId.prototype);
                const result = ObjectId.call(objId, id);
                return result || objId;
            }
        }
        return id;
    }
    throw new Error(`Cannot create ObjectId from: ${id} (type: ${typeof id})`);
}
function convertTimestamp(value) {
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
function convertTimestamps(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
    }
    if (obj instanceof Date) {
        return convertTimestamp(obj);
    }
    if (typeof obj === 'object' && obj && obj.constructor && obj.constructor.name === 'ObjectId') {
        return obj;
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertTimestamps(value);
        }
        return converted;
    }
    return convertTimestamp(obj);
}
function toDocument(doc) {
    if (!doc)
        return doc;
    const { _id, ...rest } = doc;
    return {
        ...rest,
        id: _id.toString(),
    };
}
class DatabaseService {
    static async findOne(collectionName, filter, options) {
        const collection = await (0, db_client_1.getCollection)(collectionName);
        const doc = await collection.findOne(filter, options);
        if (!doc)
            return null;
        const converted = toDocument(doc);
        return convertTimestamps(converted);
    }
    static async findMany(collectionName, filter = {}, options) {
        const collection = await (0, db_client_1.getCollection)(collectionName);
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
        return docs.map((doc) => toDocument(convertTimestamps(doc)));
    }
    static async insertOne(collectionName, document) {
        const collection = await (0, db_client_1.getCollection)(collectionName);
        const doc = convertTimestamps(document);
        if (doc.id) {
            doc._id = createObjectId(doc.id);
            delete doc.id;
        }
        const result = await collection.insertOne(doc);
        return { id: result.insertedId.toString() };
    }
    static async updateOne(collectionName, filter, update) {
        const collection = await (0, db_client_1.getCollection)(collectionName);
        const mongoFilter = this.convertIdToObjectId(filter);
        const mongoUpdate = this.convertUpdateOperators(update);
        const result = await collection.updateOne(mongoFilter, mongoUpdate);
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        };
    }
    static async deleteOne(collectionName, filter) {
        const collection = await (0, db_client_1.getCollection)(collectionName);
        const mongoFilter = this.convertIdToObjectId(filter);
        const result = await collection.deleteOne(mongoFilter);
        return { deletedCount: result.deletedCount };
    }
    static async count(collectionName, filter = {}) {
        const collection = await (0, db_client_1.getCollection)(collectionName);
        const mongoFilter = this.convertIdToObjectId(filter);
        return await collection.countDocuments(mongoFilter);
    }
    static convertIdToObjectId(filter) {
        if (!filter || typeof filter !== 'object') {
            return filter;
        }
        if (Array.isArray(filter)) {
            return filter.map(item => this.convertIdToObjectId(item));
        }
        const converted = {};
        for (const [key, value] of Object.entries(filter)) {
            if (key === 'id') {
                converted._id = createObjectId(value);
            }
            else if (key === '$or' || key === '$and' || key === '$nor') {
                converted[key] = value.map(item => this.convertIdToObjectId(item));
            }
            else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                if (value.constructor && value.constructor.name === 'ObjectId') {
                    converted[key] = value;
                }
                else {
                    converted[key] = this.convertIdToObjectId(value);
                }
            }
            else {
                converted[key] = value;
            }
        }
        return converted;
    }
    static convertUpdateOperators(update) {
        if (!update || typeof update !== 'object') {
            return update;
        }
        const converted = {};
        for (const [key, value] of Object.entries(update)) {
            if (key === '$set' || key === '$unset' || key === '$inc' || key === '$push' || key === '$pull' || key === '$addToSet') {
                converted[key] = this.convertUpdateOperators(value);
            }
            else if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'FieldValue') {
                const fieldValue = value;
                if (fieldValue._methodName === 'increment') {
                    converted.$inc = { ...converted.$inc, [key]: fieldValue._value };
                }
                else if (fieldValue._methodName === 'arrayUnion') {
                    converted.$addToSet = { ...converted.$addToSet, [key]: { $each: fieldValue._value } };
                }
                else if (fieldValue._methodName === 'arrayRemove') {
                    converted.$pull = { ...converted.$pull, [key]: { $in: fieldValue._value } };
                }
                else if (fieldValue._methodName === 'delete') {
                    converted.$unset = { ...converted.$unset, [key]: '' };
                }
                else {
                    converted[key] = value;
                }
            }
            else {
                converted[key] = convertTimestamps(value);
            }
        }
        return converted;
    }
    static async getById(collectionName, id) {
        return this.findOne(collectionName, { _id: createObjectId(id) });
    }
    static async updateById(collectionName, id, update) {
        return this.updateOne(collectionName, { _id: createObjectId(id) }, update);
    }
    static async deleteById(collectionName, id) {
        return this.deleteOne(collectionName, { _id: createObjectId(id) });
    }
}
exports.DatabaseService = DatabaseService;
exports.organisationsCollection = {
    doc: (id) => ({
        get: async () => ({
            exists: true,
            data: () => DatabaseService.getById(db_client_1.COLLECTIONS.ORGANISATIONS, id),
            id,
        }),
        set: async (data) => {
            const existing = await DatabaseService.getById(db_client_1.COLLECTIONS.ORGANISATIONS, id);
            if (existing) {
                await DatabaseService.updateById(db_client_1.COLLECTIONS.ORGANISATIONS, id, { $set: data });
            }
            else {
                await DatabaseService.insertOne(db_client_1.COLLECTIONS.ORGANISATIONS, { ...data, id });
            }
        },
        update: async (data) => {
            await DatabaseService.updateById(db_client_1.COLLECTIONS.ORGANISATIONS, id, { $set: data });
        },
        delete: async () => {
            await DatabaseService.deleteById(db_client_1.COLLECTIONS.ORGANISATIONS, id);
        },
    }),
    where: (field, operator, value) => ({
        get: async () => {
            const filter = {};
            if (operator === '==')
                filter[field] = value;
            else if (operator === '!=')
                filter[field] = { $ne: value };
            else if (operator === '>')
                filter[field] = { $gt: value };
            else if (operator === '>=')
                filter[field] = { $gte: value };
            else if (operator === '<')
                filter[field] = { $lt: value };
            else if (operator === '<=')
                filter[field] = { $lte: value };
            else if (operator === 'in')
                filter[field] = { $in: value };
            else if (operator === 'array-contains')
                filter[field] = value;
            const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ORGANISATIONS, filter);
            return {
                docs: docs.map((doc) => ({
                    id: doc.id,
                    data: () => doc,
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
        limit: (num) => ({
            get: async () => {
                const filter = {};
                if (operator === '==')
                    filter[field] = value;
                else if (operator === '!=')
                    filter[field] = { $ne: value };
                else if (operator === '>')
                    filter[field] = { $gt: value };
                else if (operator === '>=')
                    filter[field] = { $gte: value };
                else if (operator === '<')
                    filter[field] = { $lt: value };
                else if (operator === '<=')
                    filter[field] = { $lte: value };
                else if (operator === 'in')
                    filter[field] = { $in: value };
                else if (operator === 'array-contains')
                    filter[field] = value;
                const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ORGANISATIONS, filter, { limit: num });
                return {
                    docs: docs.map((doc) => ({
                        id: doc.id,
                        data: () => doc,
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
        }),
        orderBy: (orderField, direction = 'asc') => ({
            limit: (num) => ({
                get: async () => {
                    const filter = {};
                    if (operator === '==')
                        filter[field] = value;
                    else if (operator === '!=')
                        filter[field] = { $ne: value };
                    else if (operator === '>')
                        filter[field] = { $gt: value };
                    else if (operator === '>=')
                        filter[field] = { $gte: value };
                    else if (operator === '<')
                        filter[field] = { $lt: value };
                    else if (operator === '<=')
                        filter[field] = { $lte: value };
                    else if (operator === 'in')
                        filter[field] = { $in: value };
                    else if (operator === 'array-contains')
                        filter[field] = value;
                    const sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                    const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ORGANISATIONS, filter, { limit: num, sort });
                    return {
                        docs: docs.map((doc) => ({
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
    orderBy: (field, direction = 'asc') => ({
        limit: (num) => ({
            get: async () => {
                const sort = { [field]: direction === 'asc' ? 1 : -1 };
                const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ORGANISATIONS, {}, { limit: num, sort });
                return {
                    docs: docs.map((doc) => ({
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
            const sort = { [field]: direction === 'asc' ? 1 : -1 };
            const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ORGANISATIONS, {}, { sort });
            return {
                docs: docs.map((doc) => ({
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
        const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ORGANISATIONS);
        return {
            docs: docs.map((doc) => ({
                id: doc.id,
                data: () => doc,
                exists: true,
            })),
            empty: docs.length === 0,
            size: docs.length,
        };
    },
};
exports.adminUsersCollection = {
    doc: (id) => ({
        get: async () => ({
            exists: true,
            data: () => DatabaseService.getById(db_client_1.COLLECTIONS.ADMIN_USERS, id),
            id,
        }),
        set: async (data) => {
            const existing = await DatabaseService.getById(db_client_1.COLLECTIONS.ADMIN_USERS, id);
            if (existing) {
                await DatabaseService.updateById(db_client_1.COLLECTIONS.ADMIN_USERS, id, { $set: data });
            }
            else {
                await DatabaseService.insertOne(db_client_1.COLLECTIONS.ADMIN_USERS, { ...data, id });
            }
        },
        update: async (data) => {
            await DatabaseService.updateById(db_client_1.COLLECTIONS.ADMIN_USERS, id, { $set: data });
        },
        delete: async () => {
            await DatabaseService.deleteById(db_client_1.COLLECTIONS.ADMIN_USERS, id);
        },
    }),
    where: (field, operator, value) => ({
        get: async () => {
            const filter = {};
            if (operator === '==')
                filter[field] = value;
            else if (operator === 'in')
                filter[field] = { $in: value };
            const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ADMIN_USERS, filter);
            return {
                docs: docs.map((doc) => ({
                    id: doc.id,
                    data: () => doc,
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
        limit: (num) => ({
            get: async () => {
                const filter = {};
                if (operator === '==')
                    filter[field] = value;
                else if (operator === 'in')
                    filter[field] = { $in: value };
                const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ADMIN_USERS, filter, { limit: num });
                return {
                    docs: docs.map((doc) => ({
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
        const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.ADMIN_USERS);
        return {
            docs: docs.map((doc) => ({
                id: doc.id,
                data: () => doc,
                exists: true,
            })),
            empty: docs.length === 0,
            size: docs.length,
        };
    },
};
exports.superAdminUsersCollection = {
    doc: (id) => ({
        get: async () => ({
            exists: true,
            data: () => DatabaseService.getById(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS, id),
            id,
        }),
        set: async (data) => {
            const existing = await DatabaseService.getById(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS, id);
            if (existing) {
                await DatabaseService.updateById(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS, id, { $set: data });
            }
            else {
                await DatabaseService.insertOne(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS, { ...data, id });
            }
        },
        update: async (data) => {
            await DatabaseService.updateById(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS, id, { $set: data });
        },
        delete: async () => {
            await DatabaseService.deleteById(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS, id);
        },
    }),
    where: (field, operator, value) => ({
        get: async () => {
            const filter = {};
            if (operator === '==')
                filter[field] = value;
            else if (operator === 'in')
                filter[field] = { $in: value };
            const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS, filter);
            return {
                docs: docs.map((doc) => ({
                    id: doc.id,
                    data: () => doc,
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
        limit: (num) => ({
            get: async () => {
                const filter = {};
                if (operator === '==')
                    filter[field] = value;
                else if (operator === 'in')
                    filter[field] = { $in: value };
                const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS, filter, { limit: num });
                return {
                    docs: docs.map((doc) => ({
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
        const docs = await DatabaseService.findMany(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS);
        return {
            docs: docs.map((doc) => ({
                id: doc.id,
                data: () => doc,
                exists: true,
            })),
            empty: docs.length === 0,
            size: docs.length,
        };
    },
};
exports.emailVerificationsCollection = {
    doc: (id) => ({
        get: async () => ({
            exists: true,
            data: () => DatabaseService.getById(db_client_1.COLLECTIONS.EMAIL_VERIFICATIONS, id),
            id,
        }),
        set: async (data) => {
            const existing = await DatabaseService.getById(db_client_1.COLLECTIONS.EMAIL_VERIFICATIONS, id);
            if (existing) {
                await DatabaseService.updateById(db_client_1.COLLECTIONS.EMAIL_VERIFICATIONS, id, { $set: data });
            }
            else {
                await DatabaseService.insertOne(db_client_1.COLLECTIONS.EMAIL_VERIFICATIONS, { ...data, id });
            }
        },
        update: async (data) => {
            await DatabaseService.updateById(db_client_1.COLLECTIONS.EMAIL_VERIFICATIONS, id, { $set: data });
        },
    }),
};
exports.db = {
    collection: (name) => ({
        doc: (id) => ({
            get: async () => {
                const doc = await DatabaseService.getById(name, id);
                return {
                    exists: !!doc,
                    data: () => doc,
                    id,
                };
            },
            set: async (data, options) => {
                const existing = await DatabaseService.getById(name, id);
                if (existing && options?.merge) {
                    await DatabaseService.updateById(name, id, { $set: data });
                }
                else if (existing) {
                    await DatabaseService.updateById(name, id, { $set: data });
                }
                else {
                    await DatabaseService.insertOne(name, { ...data, id });
                }
            },
            update: async (data) => {
                await DatabaseService.updateById(name, id, { $set: data });
            },
            delete: async () => {
                await DatabaseService.deleteById(name, id);
            },
            collection: (subCollectionName) => ({
                doc: (subId) => ({
                    get: async () => {
                        const doc = await DatabaseService.getById(`${name}_${subCollectionName}`, `${id}_${subId}`);
                        return {
                            exists: !!doc,
                            data: () => doc,
                            id: subId,
                        };
                    },
                    set: async (data, options) => {
                        const existing = await DatabaseService.getById(`${name}_${subCollectionName}`, `${id}_${subId}`);
                        if (existing && options?.merge) {
                            await DatabaseService.updateById(`${name}_${subCollectionName}`, `${id}_${subId}`, { $set: data });
                        }
                        else if (existing) {
                            await DatabaseService.updateById(`${name}_${subCollectionName}`, `${id}_${subId}`, { $set: data });
                        }
                        else {
                            await DatabaseService.insertOne(`${name}_${subCollectionName}`, { ...data, parentId: id, id: subId });
                        }
                    },
                }),
            }),
        }),
        where: (field, operator, value) => ({
            get: async () => {
                const filter = {};
                if (operator === '==')
                    filter[field] = value;
                else if (operator === 'in')
                    filter[field] = { $in: value };
                else if (operator === '>=')
                    filter[field] = { $gte: value };
                else if (operator === '<=')
                    filter[field] = { $lte: value };
                const docs = await DatabaseService.findMany(name, filter);
                return {
                    docs: docs.map((doc) => ({
                        id: doc.id,
                        data: () => doc,
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
            orderBy: (orderField, direction = 'asc') => ({
                limit: (num) => ({
                    get: async () => {
                        const filter = {};
                        if (operator === '==')
                            filter[field] = value;
                        else if (operator === 'in')
                            filter[field] = { $in: value };
                        else if (operator === '>=')
                            filter[field] = { $gte: value };
                        else if (operator === '<=')
                            filter[field] = { $lte: value };
                        const sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                        const docs = await DatabaseService.findMany(name, filter, { limit: num, sort });
                        return {
                            docs: docs.map((doc) => ({
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
//# sourceMappingURL=db.js.map