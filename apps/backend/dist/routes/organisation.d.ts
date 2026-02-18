declare const router: import("express-serve-static-core").Router;
export declare function groupOrganisationData(org: any, id: string): {
    id: string;
    name: any;
    nameLocal: any;
    type: any;
    status: any;
    createdAt: any;
    updatedAt: any;
    images: {
        cover: any;
        logo: any;
    };
    contact: {
        email: any;
        phone: any;
        personName: any;
        personPosition: any;
        address: any;
        website: any;
        socialMedia: any;
    };
    profile: {
        city: any;
        country: any;
        contractingParty: any;
        registrationNumber: any;
        yearOfEstablishment: any;
        numberOfStaff: any;
        numberOfVolunteers: any;
        profileCompleted: any;
        profileCompletedAt: any;
        approvedAt: any;
    };
    fields: {
        missionFields: any;
        keywords: any;
        availableResources: any;
        expertiseOffered: any;
        expertiseSought: any;
        preferredRole: any;
        geographicalCoverage: any;
        lookingForPartnersFromCPs: any;
        lookingForPartnersInThematicAreas: any;
    };
    projects: any;
    wbfCallsApplied: any;
    successStories: any;
    referenceProjects: any;
    roleInPastApplications: any;
    calls: any;
};
export default router;
//# sourceMappingURL=organisation.d.ts.map