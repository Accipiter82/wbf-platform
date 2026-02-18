export declare const COUNTRIES: readonly [{
    readonly value: "albania";
    readonly label: "Albania";
}, {
    readonly value: "bosnia-herzegovina";
    readonly label: "Bosnia and Herzegovina";
}, {
    readonly value: "croatia";
    readonly label: "Croatia";
}, {
    readonly value: "kosovo";
    readonly label: "Kosovo";
}, {
    readonly value: "montenegro";
    readonly label: "Montenegro";
}, {
    readonly value: "north-macedonia";
    readonly label: "North Macedonia";
}, {
    readonly value: "serbia";
    readonly label: "Serbia";
}];
export declare const SECTORS: readonly [{
    readonly value: "education";
    readonly label: "Education";
}, {
    readonly value: "healthcare";
    readonly label: "Healthcare";
}, {
    readonly value: "environment";
    readonly label: "Environment";
}, {
    readonly value: "technology";
    readonly label: "Technology";
}, {
    readonly value: "finance";
    readonly label: "Finance";
}, {
    readonly value: "agriculture";
    readonly label: "Agriculture";
}, {
    readonly value: "tourism";
    readonly label: "Tourism";
}, {
    readonly value: "manufacturing";
    readonly label: "Manufacturing";
}, {
    readonly value: "energy";
    readonly label: "Energy";
}, {
    readonly value: "transportation";
    readonly label: "Transportation";
}, {
    readonly value: "media";
    readonly label: "Media & Communications";
}, {
    readonly value: "non-profit";
    readonly label: "Non-Profit";
}, {
    readonly value: "government";
    readonly label: "Government";
}, {
    readonly value: "research";
    readonly label: "Research & Development";
}, {
    readonly value: "other";
    readonly label: "Other";
}];
export declare const ORGANISATION_STATUSES: {
    readonly DRAFT: "draft";
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly DECLINED: "declined";
};
export declare const USER_ROLES: {
    readonly ORGANISATION: "organisation";
    readonly ADMIN: "admin";
};
export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly LOGIN: "/auth/login";
        readonly REGISTER_STEP1: "/auth/register/step-1";
        readonly REGISTER_STEP2: "/auth/register/step-2";
        readonly ME: "/auth/me";
    };
    readonly ORGANISATION: {
        readonly BROWSE: "/organisation/browse";
        readonly GET: "/organisation/:id";
        readonly ME_PROFILE: "/organisation/me/profile";
        readonly EDIT: "/organisation/:id/edit";
    };
    readonly ADMIN: {
        readonly PENDING: "/admin/pending";
        readonly ORGANISATIONS: "/admin/organisations";
        readonly REVIEW: "/admin/review/:id";
        readonly STATS: "/admin/stats";
    };
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
//# sourceMappingURL=constants.d.ts.map