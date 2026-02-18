export interface Project {
    title: string;
    description: string;
    imageUrl?: string;
    imagePath?: string; // Firebase Storage path for deletion
}

export interface ReferenceProject {
    title: string;
    description: string;
}

export interface SuccessStory {
    title: string;
    description: string;
    imageUrl?: string;
    imagePath?: string; // Firebase Storage path for deletion
}

export interface ProfileFormData {
    // Basic Information
    name: string;
    nameLocal: string;
    contractingParty: string;
    city: string;
    postalAddress: string;
    type: string;
    yearOfEstablishment: number;
    registrationNumber: string;
    logoUrl?: string;
    coverUrl?: string;

    // Organisation Details
    numberOfStaff: string;
    numberOfVolunteers: string;
    missionFields: string[];
    website: string;
    socialMediaProfiles: string[];

    // Contact Person
    contactPersonName: string;
    contactPersonPosition: string;
    contactEmail: string;
    contactPhone: string;

    // Project History
    wbfCallsApplied: { callNumber: string; year: number }[];
    roleInPastApplications: string[];
    projects: Project[];
    projectThematicAreas: string[];
    geographicalCoverage: string[];

    // Partnership Interests
    lookingForPartnersInThematicAreas: string[];
    lookingForPartnersFromCPs: string[];
    preferredRole: string[];
    expertiseOffered: string[];
    expertiseSought: string[];
    partnershipNotes?: string;

    // Additional Information
    keywords: string[];
    availableResources: string[];
    referenceProjects: ReferenceProject[];
    successStories: SuccessStory[];
}

export interface ProfileStep {
    title: string;
    icon: any;
    description: string;
    fields: (keyof ProfileFormData)[];
    required?: boolean;
} 