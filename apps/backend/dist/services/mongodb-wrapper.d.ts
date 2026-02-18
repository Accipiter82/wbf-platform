export declare const FieldValue: {
    increment: (value: number) => {
        __fieldValueType: string;
        __value: number;
    };
    arrayUnion: (elements: any[] | any) => {
        __fieldValueType: string;
        __value: any[];
    };
    arrayRemove: (elements: any[] | any) => {
        __fieldValueType: string;
        __value: any[];
    };
    delete: () => {
        __fieldValueType: string;
    };
};
export declare const Timestamp: {
    now: () => Date;
    fromDate: (date: Date) => Date;
    fromMillis: (millis: number) => Date;
};
export declare function createCollectionWrapper(collectionName: string): {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => any;
            id: string;
        }>;
        set: (data: any, options?: {
            merge?: boolean;
        }) => Promise<void>;
        update: (data: any) => Promise<void>;
        delete: () => Promise<void>;
        collection: (subCollectionName: string) => any;
    };
    where: (field: string, operator: string, value: any) => any;
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
        orderBy: (field: string, direction?: "asc" | "desc") => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
            offset: (skipNum: number) => {
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
            offset: (skipNum: number) => {
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
    get: () => Promise<{
        docs: {
            id: any;
            data: () => any;
            exists: boolean;
        }[];
        empty: boolean;
        size: number;
    }>;
    add: (data: any) => Promise<{
        id: string;
    }>;
};
export declare const organisationsCollection: {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => any;
            id: string;
        }>;
        set: (data: any, options?: {
            merge?: boolean;
        }) => Promise<void>;
        update: (data: any) => Promise<void>;
        delete: () => Promise<void>;
        collection: (subCollectionName: string) => any;
    };
    where: (field: string, operator: string, value: any) => any;
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
        orderBy: (field: string, direction?: "asc" | "desc") => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
            offset: (skipNum: number) => {
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
            offset: (skipNum: number) => {
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
    get: () => Promise<{
        docs: {
            id: any;
            data: () => any;
            exists: boolean;
        }[];
        empty: boolean;
        size: number;
    }>;
    add: (data: any) => Promise<{
        id: string;
    }>;
};
export declare const adminUsersCollection: {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => any;
            id: string;
        }>;
        set: (data: any, options?: {
            merge?: boolean;
        }) => Promise<void>;
        update: (data: any) => Promise<void>;
        delete: () => Promise<void>;
        collection: (subCollectionName: string) => any;
    };
    where: (field: string, operator: string, value: any) => any;
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
        orderBy: (field: string, direction?: "asc" | "desc") => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
            offset: (skipNum: number) => {
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
            offset: (skipNum: number) => {
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
    get: () => Promise<{
        docs: {
            id: any;
            data: () => any;
            exists: boolean;
        }[];
        empty: boolean;
        size: number;
    }>;
    add: (data: any) => Promise<{
        id: string;
    }>;
};
export declare const superAdminUsersCollection: {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => any;
            id: string;
        }>;
        set: (data: any, options?: {
            merge?: boolean;
        }) => Promise<void>;
        update: (data: any) => Promise<void>;
        delete: () => Promise<void>;
        collection: (subCollectionName: string) => any;
    };
    where: (field: string, operator: string, value: any) => any;
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
        orderBy: (field: string, direction?: "asc" | "desc") => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
            offset: (skipNum: number) => {
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
            offset: (skipNum: number) => {
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
    get: () => Promise<{
        docs: {
            id: any;
            data: () => any;
            exists: boolean;
        }[];
        empty: boolean;
        size: number;
    }>;
    add: (data: any) => Promise<{
        id: string;
    }>;
};
export declare const emailVerificationsCollection: {
    doc: (id: string) => {
        get: () => Promise<{
            exists: boolean;
            data: () => any;
            id: string;
        }>;
        set: (data: any, options?: {
            merge?: boolean;
        }) => Promise<void>;
        update: (data: any) => Promise<void>;
        delete: () => Promise<void>;
        collection: (subCollectionName: string) => any;
    };
    where: (field: string, operator: string, value: any) => any;
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
        orderBy: (field: string, direction?: "asc" | "desc") => {
            get: () => Promise<{
                docs: {
                    id: any;
                    data: () => any;
                    exists: boolean;
                }[];
                empty: boolean;
                size: number;
            }>;
            offset: (skipNum: number) => {
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
            offset: (skipNum: number) => {
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
    get: () => Promise<{
        docs: {
            id: any;
            data: () => any;
            exists: boolean;
        }[];
        empty: boolean;
        size: number;
    }>;
    add: (data: any) => Promise<{
        id: string;
    }>;
};
export declare const db: {
    collection: (name: string) => {
        doc: (id: string) => {
            get: () => Promise<{
                exists: boolean;
                data: () => any;
                id: string;
            }>;
            set: (data: any, options?: {
                merge?: boolean;
            }) => Promise<void>;
            update: (data: any) => Promise<void>;
            delete: () => Promise<void>;
            collection: (subCollectionName: string) => any;
        };
        where: (field: string, operator: string, value: any) => any;
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
            orderBy: (field: string, direction?: "asc" | "desc") => {
                get: () => Promise<{
                    docs: {
                        id: any;
                        data: () => any;
                        exists: boolean;
                    }[];
                    empty: boolean;
                    size: number;
                }>;
                offset: (skipNum: number) => {
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
                offset: (skipNum: number) => {
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
        get: () => Promise<{
            docs: {
                id: any;
                data: () => any;
                exists: boolean;
            }[];
            empty: boolean;
            size: number;
        }>;
        add: (data: any) => Promise<{
            id: string;
        }>;
    };
    batch: () => {
        set: (ref: any, data: any, options?: any) => void;
        update: (ref: any, data: any) => void;
        commit: () => Promise<void>;
    };
};
//# sourceMappingURL=mongodb-wrapper.d.ts.map