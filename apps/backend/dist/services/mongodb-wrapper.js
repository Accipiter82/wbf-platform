"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.emailVerificationsCollection = exports.superAdminUsersCollection = exports.adminUsersCollection = exports.organisationsCollection = exports.Timestamp = exports.FieldValue = void 0;
exports.createCollectionWrapper = createCollectionWrapper;
const db_client_1 = require("../db-client");
const db_1 = require("./db");
exports.FieldValue = {
    increment: (value) => ({ __fieldValueType: 'increment', __value: value }),
    arrayUnion: (elements) => ({ __fieldValueType: 'arrayUnion', __value: Array.isArray(elements) ? elements : [elements] }),
    arrayRemove: (elements) => ({ __fieldValueType: 'arrayRemove', __value: Array.isArray(elements) ? elements : [elements] }),
    delete: () => ({ __fieldValueType: 'delete' }),
};
exports.Timestamp = {
    now: () => new Date(),
    fromDate: (date) => date,
    fromMillis: (millis) => new Date(millis),
};
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
    if (typeof obj === 'object' && obj.constructor && obj.constructor.name === 'ObjectId') {
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
function toFirestoreDoc(doc) {
    if (!doc)
        return null;
    const { _id, ...rest } = doc;
    return {
        ...rest,
        id: _id ? _id.toString() : undefined,
    };
}
function createCollectionWrapper(collectionName) {
    return {
        doc: (id) => ({
            get: async () => {
                try {
                    const doc = await db_1.DatabaseService.getById(collectionName, id);
                    return {
                        exists: !!doc,
                        data: () => doc ? convertTimestamps(toFirestoreDoc(doc)) : undefined,
                        id,
                    };
                }
                catch (error) {
                    return {
                        exists: false,
                        data: () => undefined,
                        id,
                    };
                }
            },
            set: async (data, options) => {
                const existing = await db_1.DatabaseService.getById(collectionName, id);
                const docData = convertTimestamps(data);
                if (existing && options?.merge) {
                    await db_1.DatabaseService.updateById(collectionName, id, { $set: docData });
                }
                else if (existing) {
                    await db_1.DatabaseService.updateById(collectionName, id, { $set: docData });
                }
                else {
                    await db_1.DatabaseService.insertOne(collectionName, { ...docData, id });
                }
            },
            update: async (data) => {
                const docData = convertTimestamps(data);
                const updateDoc = {};
                const incDoc = {};
                const unsetDoc = {};
                for (const [key, value] of Object.entries(docData)) {
                    if (value && typeof value === 'object' && value.__fieldValueType === 'increment') {
                        incDoc[key] = value.__value;
                    }
                    else if (value && typeof value === 'object' && value.__fieldValueType === 'delete') {
                        unsetDoc[key] = '';
                    }
                    else if (value && typeof value === 'object' && value.__fieldValueType === 'arrayUnion') {
                        updateDoc[key] = { $addToSet: { $each: value.__value } };
                    }
                    else if (value && typeof value === 'object' && value.__fieldValueType === 'arrayRemove') {
                        updateDoc[key] = { $pull: { $in: value.__value } };
                    }
                    else {
                        updateDoc[key] = value;
                    }
                }
                const finalUpdate = {};
                if (Object.keys(updateDoc).length > 0) {
                    const setOps = {};
                    for (const [key, value] of Object.entries(updateDoc)) {
                        if (value && typeof value === 'object' && ('$addToSet' in value || '$pull' in value)) {
                            Object.assign(finalUpdate, { [key]: value });
                        }
                        else {
                            setOps[key] = value;
                        }
                    }
                    if (Object.keys(setOps).length > 0) {
                        finalUpdate.$set = setOps;
                    }
                }
                for (const [key, value] of Object.entries(updateDoc)) {
                    if (value && typeof value === 'object') {
                        if ('$addToSet' in value) {
                            if (!finalUpdate.$addToSet)
                                finalUpdate.$addToSet = {};
                            const addToSetVal = value.$addToSet;
                            for (const [field, val] of Object.entries(addToSetVal)) {
                                finalUpdate.$addToSet[key] = val;
                            }
                        }
                        else if ('$pull' in value) {
                            if (!finalUpdate.$pull)
                                finalUpdate.$pull = {};
                            const pullVal = value.$pull;
                            for (const [field, val] of Object.entries(pullVal)) {
                                finalUpdate.$pull[key] = val;
                            }
                        }
                    }
                }
                const simplifiedUpdate = {};
                const $set = {};
                const $addToSet = {};
                const $pull = {};
                for (const [key, value] of Object.entries(docData)) {
                    if (value && typeof value === 'object' && value.__fieldValueType === 'increment') {
                        if (!simplifiedUpdate.$inc)
                            simplifiedUpdate.$inc = {};
                        simplifiedUpdate.$inc[key] = value.__value;
                    }
                    else if (value && typeof value === 'object' && value.__fieldValueType === 'delete') {
                        if (!simplifiedUpdate.$unset)
                            simplifiedUpdate.$unset = {};
                        simplifiedUpdate.$unset[key] = '';
                    }
                    else if (value && typeof value === 'object' && value.__fieldValueType === 'arrayUnion') {
                        $addToSet[key] = { $each: value.__value };
                    }
                    else if (value && typeof value === 'object' && value.__fieldValueType === 'arrayRemove') {
                        $pull[key] = { $in: value.__value };
                    }
                    else {
                        $set[key] = value;
                    }
                }
                if (Object.keys($set).length > 0)
                    simplifiedUpdate.$set = $set;
                if (Object.keys($addToSet).length > 0)
                    simplifiedUpdate.$addToSet = $addToSet;
                if (Object.keys($pull).length > 0)
                    simplifiedUpdate.$pull = $pull;
                await db_1.DatabaseService.updateById(collectionName, id, simplifiedUpdate);
            },
            delete: async () => {
                await db_1.DatabaseService.deleteById(collectionName, id);
            },
            collection: (subCollectionName) => {
                const subCollectionFullName = `${collectionName}_${subCollectionName}`;
                return createCollectionWrapper(subCollectionFullName);
            },
        }),
        where: (field, operator, value) => {
            const filters = [
                { field, operator, value }
            ];
            const addFilter = (f, op, val) => {
                filters.push({ field: f, operator: op, value: val });
            };
            const buildFilter = () => {
                const filter = {};
                for (const f of filters) {
                    if (f.operator === '==') {
                        filter[f.field] = f.value;
                    }
                    else if (f.operator === '!=') {
                        filter[f.field] = { $ne: f.value };
                    }
                    else if (f.operator === '>') {
                        filter[f.field] = { $gt: f.value };
                    }
                    else if (f.operator === '>=') {
                        filter[f.field] = { $gte: f.value };
                    }
                    else if (f.operator === '<') {
                        filter[f.field] = { $lt: f.value };
                    }
                    else if (f.operator === '<=') {
                        filter[f.field] = { $lte: f.value };
                    }
                    else if (f.operator === 'in') {
                        filter[f.field] = { $in: Array.isArray(f.value) ? f.value : [f.value] };
                    }
                    else if (f.operator === 'array-contains') {
                        filter[f.field] = f.value;
                    }
                }
                return filter;
            };
            const queryBuilder = {
                where: (f, op, val) => {
                    addFilter(f, op, val);
                    return queryBuilder;
                },
                get: async () => {
                    const filter = buildFilter();
                    const docs = await db_1.DatabaseService.findMany(collectionName, filter);
                    return {
                        docs: docs.map((doc) => ({
                            id: doc.id || doc._id?.toString(),
                            data: () => convertTimestamps(toFirestoreDoc(doc)),
                            exists: true,
                        })),
                        empty: docs.length === 0,
                        size: docs.length,
                    };
                },
                limit: (num) => {
                    queryBuilder._limit = num;
                    const limitedBuilder = {
                        where: (f, op, val) => {
                            addFilter(f, op, val);
                            return limitedBuilder;
                        },
                        get: async () => {
                            const filter = buildFilter();
                            const docs = await db_1.DatabaseService.findMany(collectionName, filter, { limit: num });
                            return {
                                docs: docs.map((doc) => ({
                                    id: doc.id || doc._id?.toString(),
                                    data: () => convertTimestamps(toFirestoreDoc(doc)),
                                    exists: true,
                                })),
                                empty: docs.length === 0,
                                size: docs.length,
                            };
                        },
                        orderBy: (orderField, direction = 'asc') => ({
                            get: async () => {
                                const filter = buildFilter();
                                const sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                                const docs = await db_1.DatabaseService.findMany(collectionName, filter, { limit: num, sort });
                                return {
                                    docs: docs.map((doc) => ({
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
                orderBy: (orderField, direction = 'asc') => ({
                    where: (f, op, val) => {
                        addFilter(f, op, val);
                        return queryBuilder.orderBy(orderField, direction);
                    },
                    limit: (num) => ({
                        get: async () => {
                            const filter = buildFilter();
                            const sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                            const docs = await db_1.DatabaseService.findMany(collectionName, filter, { limit: num, sort });
                            return {
                                docs: docs.map((doc) => ({
                                    id: doc.id || doc._id?.toString(),
                                    data: () => convertTimestamps(toFirestoreDoc(doc)),
                                    exists: true,
                                })),
                                empty: docs.length === 0,
                                size: docs.length,
                            };
                        },
                        offset: (skipNum) => ({
                            get: async () => {
                                const filter = buildFilter();
                                const sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                                const docs = await db_1.DatabaseService.findMany(collectionName, filter, { limit: num, skip: skipNum, sort });
                                return {
                                    docs: docs.map((doc) => ({
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
                        const sort = { [orderField]: direction === 'asc' ? 1 : -1 };
                        const docs = await db_1.DatabaseService.findMany(collectionName, filter, { sort });
                        return {
                            docs: docs.map((doc) => ({
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
        limit: (num) => ({
            get: async () => {
                const docs = await db_1.DatabaseService.findMany(collectionName, {}, { limit: num });
                return {
                    docs: docs.map((doc) => ({
                        id: doc.id || doc._id?.toString(),
                        data: () => convertTimestamps(toFirestoreDoc(doc)),
                        exists: true,
                    })),
                    empty: docs.length === 0,
                    size: docs.length,
                };
            },
            orderBy: (field, direction = 'asc') => ({
                get: async () => {
                    const sort = { [field]: direction === 'asc' ? 1 : -1 };
                    const docs = await db_1.DatabaseService.findMany(collectionName, {}, { limit: num, sort });
                    return {
                        docs: docs.map((doc) => ({
                            id: doc.id || doc._id?.toString(),
                            data: () => convertTimestamps(toFirestoreDoc(doc)),
                            exists: true,
                        })),
                        empty: docs.length === 0,
                        size: docs.length,
                    };
                },
                offset: (skipNum) => ({
                    get: async () => {
                        const sort = { [field]: direction === 'asc' ? 1 : -1 };
                        const docs = await db_1.DatabaseService.findMany(collectionName, {}, { limit: num, skip: skipNum, sort });
                        return {
                            docs: docs.map((doc) => ({
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
        orderBy: (field, direction = 'asc') => ({
            limit: (num) => ({
                get: async () => {
                    const sort = { [field]: direction === 'asc' ? 1 : -1 };
                    const docs = await db_1.DatabaseService.findMany(collectionName, {}, { limit: num, sort });
                    return {
                        docs: docs.map((doc) => ({
                            id: doc.id || doc._id?.toString(),
                            data: () => convertTimestamps(toFirestoreDoc(doc)),
                            exists: true,
                        })),
                        empty: docs.length === 0,
                        size: docs.length,
                    };
                },
                offset: (skipNum) => ({
                    get: async () => {
                        const sort = { [field]: direction === 'asc' ? 1 : -1 };
                        const docs = await db_1.DatabaseService.findMany(collectionName, {}, { limit: num, skip: skipNum, sort });
                        return {
                            docs: docs.map((doc) => ({
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
                const sort = { [field]: direction === 'asc' ? 1 : -1 };
                const docs = await db_1.DatabaseService.findMany(collectionName, {}, { sort });
                return {
                    docs: docs.map((doc) => ({
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
            const docs = await db_1.DatabaseService.findMany(collectionName);
            return {
                docs: docs.map((doc) => ({
                    id: doc.id || doc._id?.toString(),
                    data: () => convertTimestamps(toFirestoreDoc(doc)),
                    exists: true,
                })),
                empty: docs.length === 0,
                size: docs.length,
            };
        },
        add: async (data) => {
            const docData = convertTimestamps(data);
            const result = await db_1.DatabaseService.insertOne(collectionName, docData);
            return {
                id: result.id,
            };
        },
    };
}
exports.organisationsCollection = createCollectionWrapper(db_client_1.COLLECTIONS.ORGANISATIONS);
exports.adminUsersCollection = createCollectionWrapper(db_client_1.COLLECTIONS.ADMIN_USERS);
exports.superAdminUsersCollection = createCollectionWrapper(db_client_1.COLLECTIONS.SUPER_ADMIN_USERS);
exports.emailVerificationsCollection = createCollectionWrapper(db_client_1.COLLECTIONS.EMAIL_VERIFICATIONS);
function getCollectionNameFromRef(ref) {
    if (ref && ref.parent) {
        if (ref.parent.id) {
            return ref.parent.id;
        }
        else if (ref.parent.parent && ref.parent.parent.id) {
            return `${ref.parent.parent.id}_${ref.parent.id}`;
        }
    }
    throw new Error('Unable to determine collection name from reference');
}
exports.db = {
    collection: (name) => createCollectionWrapper(name),
    batch: () => {
        const operations = [];
        return {
            set: (ref, data, options) => {
                try {
                    const collectionName = getCollectionNameFromRef(ref);
                    const docId = ref.id;
                    operations.push({ type: 'set', collection: collectionName, id: docId, data, options });
                }
                catch (error) {
                    console.error('Error in batch.set:', error);
                    throw error;
                }
            },
            update: (ref, data) => {
                try {
                    const collectionName = getCollectionNameFromRef(ref);
                    const docId = ref.id;
                    const processedData = convertTimestamps(data);
                    operations.push({ type: 'update', collection: collectionName, id: docId, update: processedData });
                }
                catch (error) {
                    console.error('Error in batch.update:', error);
                    throw error;
                }
            },
            commit: async () => {
                for (const op of operations) {
                    const collection = createCollectionWrapper(op.collection);
                    if (op.type === 'set') {
                        await collection.doc(op.id).set(op.data, op.options);
                    }
                    else if (op.type === 'update') {
                        const updateDoc = {};
                        const incDoc = {};
                        const unsetDoc = {};
                        for (const [key, value] of Object.entries(op.update)) {
                            if (value && typeof value === 'object' && value.__fieldValueType === 'increment') {
                                incDoc[key] = value.__value;
                            }
                            else if (value && typeof value === 'object' && value.__fieldValueType === 'delete') {
                                unsetDoc[key] = '';
                            }
                            else if (value && typeof value === 'object' && value.__fieldValueType === 'arrayUnion') {
                                updateDoc[key] = { $addToSet: { $each: value.__value } };
                            }
                            else if (value && typeof value === 'object' && value.__fieldValueType === 'arrayRemove') {
                                updateDoc[key] = { $pull: { $in: value.__value } };
                            }
                            else {
                                updateDoc[key] = value;
                            }
                        }
                        const finalUpdate = {};
                        if (Object.keys(updateDoc).length > 0) {
                            const setOps = {};
                            for (const [key, value] of Object.entries(updateDoc)) {
                                if (value && typeof value === 'object' && ('$addToSet' in value || '$pull' in value)) {
                                    Object.assign(finalUpdate, { [key]: value });
                                }
                                else {
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
                        await db_1.DatabaseService.updateById(op.collection, op.id, finalUpdate);
                    }
                }
            },
        };
    },
};
//# sourceMappingURL=mongodb-wrapper.js.map