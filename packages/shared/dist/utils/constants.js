"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGINATION = exports.API_ENDPOINTS = exports.USER_ROLES = exports.ORGANISATION_STATUSES = exports.SECTORS = exports.COUNTRIES = void 0;
exports.COUNTRIES = [
    { value: 'albania', label: 'Albania' },
    { value: 'bosnia-herzegovina', label: 'Bosnia and Herzegovina' },
    { value: 'croatia', label: 'Croatia' },
    { value: 'kosovo', label: 'Kosovo' },
    { value: 'montenegro', label: 'Montenegro' },
    { value: 'north-macedonia', label: 'North Macedonia' },
    { value: 'serbia', label: 'Serbia' },
];
exports.SECTORS = [
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'environment', label: 'Environment' },
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'tourism', label: 'Tourism' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'energy', label: 'Energy' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'media', label: 'Media & Communications' },
    { value: 'non-profit', label: 'Non-Profit' },
    { value: 'government', label: 'Government' },
    { value: 'research', label: 'Research & Development' },
    { value: 'other', label: 'Other' },
];
exports.ORGANISATION_STATUSES = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    DECLINED: 'declined',
};
exports.USER_ROLES = {
    ORGANISATION: 'organisation',
    ADMIN: 'admin',
};
exports.API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER_STEP1: '/auth/register/step-1',
        REGISTER_STEP2: '/auth/register/step-2',
        ME: '/auth/me',
    },
    ORGANISATION: {
        BROWSE: '/organisation/browse',
        GET: '/organisation/:id',
        ME_PROFILE: '/organisation/me/profile',
        EDIT: '/organisation/:id/edit',
    },
    ADMIN: {
        PENDING: '/admin/pending',
        ORGANISATIONS: '/admin/organisations',
        REVIEW: '/admin/review/:id',
        STATS: '/admin/stats',
    },
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};
//# sourceMappingURL=constants.js.map