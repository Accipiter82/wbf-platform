import { Filter, UpdateFilter, FindOptions } from 'mongodb';
export declare class DatabaseService {
    static findOne<T>(collectionName: string, filter: Filter<any>, options?: FindOptions): Promise<T | null>;
    static findMany<T>(collectionName: string, filter?: Filter<any>, options?: FindOptions & {
        skip?: number;
    }): Promise<T[]>;
    static insertOne<T>(collectionName: string, document: any): Promise<{
        id: string;
    }>;
    static updateOne(collectionName: string, filter: Filter<any>, update: UpdateFilter<any>): Promise<{
        matchedCount: number;
        modifiedCount: number;
    }>;
    static deleteOne(collectionName: string, filter: Filter<any>): Promise<{
        deletedCount: number;
    }>;
    static count(collectionName: string, filter?: Filter<any>): Promise<number>;
    static convertIdToObjectId(filter: any): any;
    static convertUpdateOperators(update: any): any;
    static getById<T>(collectionName: string, id: string): Promise<T | null>;
    static updateById(collectionName: string, id: string, update: UpdateFilter<any>): Promise<{
        matchedCount: number;
        modifiedCount: number;
    }>;
    static deleteById(collectionName: string, id: string): Promise<{
        deletedCount: number;
    }>;
}
export declare const organisationsCollection: {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => Promise<unknown>;
            id: string;
        }>;
        set: (data: any) => Promise<void>;
        update: (data: any) => Promise<void>;
        delete: () => Promise<void>;
    };
    where: (field: string, operator: string, value: any) => {
        get: () => Promise<{
            docs: {
                id: any;
                data: () => any;
                exists: boolean;
            }[];
            empty: boolean;
            size: number;
        }>;
        limit: (num: number) => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
        };
        orderBy: (orderField: string, direction?: "asc" | "desc") => {
            limit: (num: number) => {
                get: () => Promise<{
                    docs: {
                        id: any;
                        data: () => any;
                        exists: boolean;
                    }[];
                    empty: boolean;
                    size: number;
                }>;
            };
        };
    };
    orderBy: (field: string, direction?: "asc" | "desc") => {
        limit: (num: number) => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
        };
        get: () => Promise<{
            docs: {
                id: any;
                data: () => any;
                exists: boolean;
            }[];
            empty: boolean;
            size: number;
        }>;
    };
    get: () => Promise<{
        docs: {
            id: any;
            data: () => any;
            exists: boolean;
        }[];
        empty: boolean;
        size: number;
    }>;
};
export declare const adminUsersCollection: {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => Promise<unknown>;
            id: string;
        }>;
        set: (data: any) => Promise<void>;
        update: (data: any) => Promise<void>;
        delete: () => Promise<void>;
    };
    where: (field: string, operator: string, value: any) => {
        get: () => Promise<{
            docs: {
                id: any;
                data: () => any;
                exists: boolean;
            }[];
            empty: boolean;
            size: number;
        }>;
        limit: (num: number) => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
        };
    };
    get: () => Promise<{
        docs: {
            id: any;
            data: () => any;
            exists: boolean;
        }[];
        empty: boolean;
        size: number;
    }>;
};
export declare const superAdminUsersCollection: {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => Promise<unknown>;
            id: string;
        }>;
        set: (data: any) => Promise<void>;
        update: (data: any) => Promise<void>;
        delete: () => Promise<void>;
    };
    where: (field: string, operator: string, value: any) => {
        get: () => Promise<{
            docs: {
                id: any;
                data: () => any;
                exists: boolean;
            }[];
            empty: boolean;
            size: number;
        }>;
        limit: (num: number) => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
        };
    };
    get: () => Promise<{
        docs: {
            id: any;
            data: () => any;
            exists: boolean;
        }[];
        empty: boolean;
        size: number;
    }>;
};
export declare const emailVerificationsCollection: {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => Promise<unknown>;
            id: string;
        }>;
        set: (data: any) => Promise<void>;
        update: (data: any) => Promise<void>;
    };
};
export declare const db: {
    collection: (name: string) => {
        doc: (id: string) => {
            get: () => Promise<{
                exists: boolean;
                data: () => unknown;
                id: string;
            }>;
            set: (data: any, options?: any) => Promise<void>;
            update: (data: any) => Promise<void>;
            delete: () => Promise<void>;
            collection: (subCollectionName: string) => {
                doc: (subId: string) => {
                    get: () => Promise<{
                        exists: boolean;
                        data: () => unknown;
                        id: string;
                    }>;
                    set: (data: any, options?: any) => Promise<void>;
                };
            };
        };
        where: (field: string, operator: string, value: any) => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
            orderBy: (orderField: string, direction?: "asc" | "desc") => {
                limit: (num: number) => {
                    get: () => Promise<{
                        docs: {
                            id: any;
                            data: () => any;
                            exists: boolean;
                        }[];
                        empty: boolean;
                        size: number;
                    }>;
                };
            };
        };
    };
};
//# sourceMappingURL=db.d.ts.map