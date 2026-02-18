import React, { useState, useEffect } from "react";
import {
  Title,
  Text,
  Grid,
  Card,
  Group,
  Badge,
  Stack,
  Button,
  Box,
  TextInput,
  Textarea,
  MultiSelect,
  Select,
  useMantineTheme,
  ActionIcon,
  Avatar,
  Image,
  Alert,
} from "@mantine/core";
import {
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconBuilding,
  IconMapPin,
  IconUsers,
  IconMail,
  IconPhone,
  IconGlobe,
  IconUpload,
  IconTrash,
  IconAlertCircle,
  IconPlus,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandTiktok,
} from "@tabler/icons-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../store";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import {
  organisationTypes,
  missionFields,
  staffSizeOptions,
  volunteerSizeOptions,
} from "../../../data/profileOptions";
import { notifications } from "@mantine/notifications";
import { getCurrentUser } from "../../../store/slices/authSlice";
import axios from "axios";

interface ProfileSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const profileSections: ProfileSection[] = [
  {
    id: "basic",
    title: "Basic Information",
    icon: <IconBuilding size={20} />,
    description: "Organisation details and contact information",
  },
  {
    id: "media",
    title: "Media & Resources",
    icon: <IconUpload size={20} />,
    description: "Logos, images, and additional resources",
  },
];

// Social media platform data with icons and colors
const socialMediaData = [
  {
    value: "Facebook",
    label: "Facebook",
    icon: IconBrandFacebook,
    color: "#1877F2",
  },
  {
    value: "Instagram",
    label: "Instagram",
    icon: IconBrandInstagram,
    color: "#E4405F",
  },
  {
    value: "X (Twitter)",
    label: "X (Twitter)",
    icon: IconBrandX,
    color: "#000000",
  },
  {
    value: "LinkedIn",
    label: "LinkedIn",
    icon: IconBrandLinkedin,
    color: "#0A66C2",
  },
  {
    value: "YouTube",
    label: "YouTube",
    icon: IconBrandYoutube,
    color: "#FF0000",
  },
  { value: "TikTok", label: "TikTok", icon: IconBrandTiktok, color: "#000000" },
];

// Helper functions for social media
const getPlatformIcon = (platform: string) => {
  const platformData = socialMediaData.find((p) => p.value === platform);
  if (platformData) {
    const IconComponent = platformData.icon;
    return <IconComponent size={16} style={{ color: platformData.color }} />;
  }
  return null;
};

const getPlatformColor = (platform: string) => {
  const platformData = socialMediaData.find((p) => p.value === platform);
  return platformData?.color || "#6c757d";
};

export default function ProfilePage() {
  const theme = useMantineTheme();
  const { organisation } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState<string>("");
  const [newSocialUrl, setNewSocialUrl] = useState<string>("");

  const [editForm, setEditForm] = useState({
    name: organisation?.name || "",
    nameLocal: organisation?.nameLocal || "",
    type: organisation?.type || "",
    city: organisation?.profile?.city || "",
    country: organisation?.profile?.country || "",
    contractingParty: organisation?.profile?.contractingParty || "",
    postalAddress: organisation?.contact?.address || "",
    yearOfEstablishment: organisation?.profile?.yearOfEstablishment || "",
    registrationNumber: organisation?.profile?.registrationNumber || "",
    numberOfStaff: organisation?.profile?.numberOfStaff || null,
    numberOfVolunteers: organisation?.profile?.numberOfVolunteers || null,
    website: organisation?.contact?.website || "",
    socialMedia: organisation?.contact?.socialMedia || [],
    contactPersonName: organisation?.contact?.personName || "",
    contactPersonPosition: organisation?.contact?.personPosition || "",
    contactEmail: organisation?.contact?.email || "",
    contactPhone: organisation?.contact?.phone || "",
    missionFields: organisation?.fields?.missionFields || [],
    keywords: organisation?.fields?.keywords || [],
    availableResources: organisation?.fields?.availableResources || [],
    expertiseOffered: organisation?.fields?.expertiseOffered || [],
    expertiseSought: organisation?.fields?.expertiseSought || [],
    geographicalCoverage: organisation?.fields?.geographicalCoverage || [],
    lookingForPartnersInThematicAreas:
      organisation?.fields?.lookingForPartnersInThematicAreas || [],
    lookingForPartnersFromCPs:
      organisation?.fields?.lookingForPartnersFromCPs || [],
    preferredRole: organisation?.fields?.preferredRole || [],
    wbfCallsApplied: organisation?.wbfCallsApplied || [],
    roleInPastApplications: organisation?.roleInPastApplications || [],
    successStories: organisation?.successStories || [],
    referenceProjects: organisation?.referenceProjects || [],
  });

  // Update editForm when organisation data changes - only on initial load
  useEffect(() => {
    if (organisation && !isEditing) {
      setEditForm({
        name: organisation.name || "",
        nameLocal: organisation.nameLocal || "",
        type: organisation.type || "",
        city: organisation.profile?.city || "",
        country: organisation.profile?.country || "",
        contractingParty: organisation.profile?.contractingParty || "",
        postalAddress: organisation.contact?.address || "",
        yearOfEstablishment: organisation.profile?.yearOfEstablishment || "",
        registrationNumber: organisation.profile?.registrationNumber || "",
        numberOfStaff: organisation.profile?.numberOfStaff || null,
        numberOfVolunteers: organisation.profile?.numberOfVolunteers || null,
        website: organisation.contact?.website || "",
        socialMedia: organisation.contact?.socialMedia || [],
        contactPersonName: organisation.contact?.personName || "",
        contactPersonPosition: organisation.contact?.personPosition || "",
        contactEmail: organisation.contact?.email || "",
        contactPhone: organisation.contact?.phone || "",
        missionFields: organisation.fields?.missionFields || [],
        keywords: organisation.fields?.keywords || [],
        availableResources: organisation.fields?.availableResources || [],
        expertiseOffered: organisation.fields?.expertiseOffered || [],
        expertiseSought: organisation.fields?.expertiseSought || [],
        geographicalCoverage: organisation.fields?.geographicalCoverage || [],
        lookingForPartnersInThematicAreas:
          organisation.fields?.lookingForPartnersInThematicAreas || [],
        lookingForPartnersFromCPs:
          organisation.fields?.lookingForPartnersFromCPs || [],
        preferredRole: organisation.fields?.preferredRole || [],
        wbfCallsApplied: organisation.wbfCallsApplied || [],
        roleInPastApplications: organisation.roleInPastApplications || [],
        successStories: organisation.successStories || [],
        referenceProjects: organisation.referenceProjects || [],
      });
    }
  }, [organisation, isEditing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call to update organization profile
      console.log("Saving profile:", editForm);
      notifications.show({
        title: "Success",
        message: "Profile updated successfully!",
        color: "green",
      });
      setIsEditing(false);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update profile. Please try again.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSocialMedia = () => {
    if (newSocialPlatform && newSocialUrl) {
      const entry = `${newSocialPlatform}|${newSocialUrl}`;
      const updatedProfiles = [...(editForm.socialMedia || []), entry];
      setEditForm({ ...editForm, socialMedia: updatedProfiles });
      setNewSocialPlatform("");
      setNewSocialUrl("");
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: organisation?.name || "",
      nameLocal: organisation?.nameLocal || "",
      type: organisation?.type || "",
      city: organisation?.profile?.city || "",
      country: organisation?.profile?.country || "",
      contractingParty: organisation?.profile?.contractingParty || "",
      postalAddress: organisation?.contact?.address || "",
      yearOfEstablishment: organisation?.profile?.yearOfEstablishment || "",
      registrationNumber: organisation?.profile?.registrationNumber || "",
      numberOfStaff: organisation?.profile?.numberOfStaff || null,
      numberOfVolunteers: organisation?.profile?.numberOfVolunteers || null,
      website: organisation?.contact?.website || "",
      socialMedia: organisation?.contact?.socialMedia || [],
      contactPersonName: organisation?.contact?.personName || "",
      contactPersonPosition: organisation?.contact?.personPosition || "",
      contactEmail: organisation?.contact?.email || "",
      contactPhone: organisation?.contact?.phone || "",
      missionFields: organisation?.fields?.missionFields || [],
      keywords: organisation?.fields?.keywords || [],
      availableResources: organisation?.fields?.availableResources || [],
      expertiseOffered: organisation?.fields?.expertiseOffered || [],
      expertiseSought: organisation?.fields?.expertiseSought || [],
      geographicalCoverage: organisation?.fields?.geographicalCoverage || [],
      lookingForPartnersInThematicAreas:
        organisation?.fields?.lookingForPartnersInThematicAreas || [],
      lookingForPartnersFromCPs:
        organisation?.fields?.lookingForPartnersFromCPs || [],
      preferredRole: organisation?.fields?.preferredRole || [],
      wbfCallsApplied: organisation?.wbfCallsApplied || [],
      roleInPastApplications: organisation?.roleInPastApplications || [],
      successStories: organisation?.successStories || [],
      referenceProjects: organisation?.referenceProjects || [],
    });
    setIsEditing(false);
  };

  const BasicInfoSection = () => (
    <Stack gap="lg">
      {/* Organisation Header */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <Avatar src={organisation?.images.logo} size="xl" radius="md">
              <IconBuilding size={32} />
            </Avatar>
            <Box>
              <Title order={2} size="h3">
                {organisation?.name}
              </Title>
              {organisation?.nameLocal && (
                <Text size="lg" c="dimmed">
                  {organisation.nameLocal}
                </Text>
              )}
              <Group gap="md" mt="xs">
                <Badge
                  color={
                    organisation?.status === "approved"
                      ? "green"
                      : organisation?.status === "pending"
                        ? "yellow"
                        : "red"
                  }
                  variant="light"
                >
                  {organisation?.status
                    ? organisation.status.charAt(0).toUpperCase() +
                      organisation.status.slice(1)
                    : ""}
                </Badge>
                <Group gap="xs">
                  <IconMapPin size={14} />
                  <Text size="sm" c="dimmed">
                    {organisation?.profile.city},{" "}
                    {organisation?.profile.country}
                  </Text>
                </Group>
              </Group>
            </Box>
          </Group>
          <Button
            variant={isEditing ? "filled" : "outline"}
            leftSection={
              isEditing ? (
                <IconDeviceFloppy size={16} />
              ) : (
                <IconEdit size={16} />
              )
            }
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            loading={saving}
            disabled={saving}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
        </Group>
      </Card>

      {/* Basic Information Form */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} size="h4" mb="lg">
          Basic Information
        </Title>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Organisation Name"
              value={isEditing ? editForm.name : organisation?.name}
              onChange={(e) =>
                isEditing &&
                setEditForm({ ...editForm, name: e.currentTarget.value })
              }
              disabled={!isEditing}
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Organisation Name (Local)"
              value={isEditing ? editForm.nameLocal : organisation?.nameLocal}
              onChange={(e) =>
                isEditing &&
                setEditForm({ ...editForm, nameLocal: e.currentTarget.value })
              }
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Organisation Type"
              value={isEditing ? editForm.type : organisation?.type}
              onChange={(value) =>
                isEditing && setEditForm({ ...editForm, type: value || "" })
              }
              data={organisationTypes}
              disabled={!isEditing}
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="City"
              value={isEditing ? editForm.city : organisation?.profile.city}
              onChange={(e) =>
                isEditing &&
                setEditForm({ ...editForm, city: e.currentTarget.value })
              }
              disabled={!isEditing}
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Country"
              value={
                isEditing ? editForm.country : organisation?.profile.country
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({ ...editForm, country: e.currentTarget.value })
              }
              disabled={!isEditing}
              required
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label="Contracting Party"
              value={
                isEditing
                  ? editForm.contractingParty
                  : organisation?.profile.contractingParty
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  contractingParty: e.currentTarget.value,
                })
              }
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Year of Establishment"
              value={
                isEditing
                  ? editForm.yearOfEstablishment
                  : organisation?.profile.yearOfEstablishment
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  yearOfEstablishment: e.currentTarget.value,
                })
              }
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Registration Number"
              value={
                isEditing
                  ? editForm.registrationNumber
                  : organisation?.profile.registrationNumber
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  registrationNumber: e.currentTarget.value,
                })
              }
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Website"
              value={
                isEditing ? editForm.website : organisation?.contact.website
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({ ...editForm, website: e.currentTarget.value })
              }
              disabled={!isEditing}
              leftSection={<IconGlobe size={16} />}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Postal Address"
              value={
                isEditing
                  ? editForm.postalAddress
                  : organisation?.contact.address
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  postalAddress: e.currentTarget.value,
                })
              }
              disabled={!isEditing}
              minRows={2}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Contact Information */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} size="h4" mb="lg">
          Contact Information
        </Title>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Contact Person Name"
              value={
                isEditing
                  ? editForm.contactPersonName
                  : organisation?.contact.personName
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  contactPersonName: e.currentTarget.value,
                })
              }
              disabled={!isEditing}
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Contact Person Position"
              value={
                isEditing
                  ? editForm.contactPersonPosition
                  : organisation?.contact.personPosition
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  contactPersonPosition: e.currentTarget.value,
                })
              }
              disabled={!isEditing}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Email"
              value={
                isEditing ? editForm.contactEmail : organisation?.contact.email
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  contactEmail: e.currentTarget.value,
                })
              }
              disabled={!isEditing}
              leftSection={<IconMail size={16} />}
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Phone"
              value={
                isEditing ? editForm.contactPhone : organisation?.contact.phone
              }
              onChange={(e) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  contactPhone: e.currentTarget.value,
                })
              }
              disabled={!isEditing}
              leftSection={<IconPhone size={16} />}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Organisation Statistics */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} size="h4" mb="lg">
          Organisation Statistics
        </Title>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Number of Staff"
              placeholder="Select staff size"
              data={staffSizeOptions}
              value={
                isEditing
                  ? editForm.numberOfStaff
                    ? String(editForm.numberOfStaff)
                    : ""
                  : organisation?.profile?.numberOfStaff
                    ? String(organisation.profile.numberOfStaff)
                    : ""
              }
              onChange={(value) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  numberOfStaff: value ? Number(value) : null,
                })
              }
              disabled={!isEditing}
              leftSection={<IconUsers size={16} />}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Number of Volunteers"
              placeholder="Select volunteer size"
              data={volunteerSizeOptions}
              value={
                isEditing
                  ? editForm.numberOfVolunteers
                    ? String(editForm.numberOfVolunteers)
                    : ""
                  : organisation?.profile?.numberOfVolunteers
                    ? String(organisation.profile.numberOfVolunteers)
                    : ""
              }
              onChange={(value) =>
                isEditing &&
                setEditForm({
                  ...editForm,
                  numberOfVolunteers: value ? Number(value) : null,
                })
              }
              disabled={!isEditing}
              leftSection={<IconUsers size={16} />}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Mission Fields */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} size="h4" mb="lg">
          Mission Fields
        </Title>

        <MultiSelect
          label="Mission Fields"
          placeholder={
            (organisation?.fields?.missionFields?.length || 0) > 0
              ? undefined
              : "Add mission fields"
          }
          value={
            isEditing
              ? editForm.missionFields
              : organisation?.fields?.missionFields
          }
          onChange={(value) =>
            isEditing && setEditForm({ ...editForm, missionFields: value })
          }
          data={missionFields}
          disabled={!isEditing}
          searchable
        />

        {/* Social Media Profiles */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Social Media Profiles
          </Text>

          {/* Display existing social media profiles */}
          {(organisation?.contact?.socialMedia?.length || 0) > 0 && (
            <Stack gap="sm" mb="md">
              {organisation?.contact?.socialMedia?.map(
                (profile: string, index: number) => {
                  const [platform, url] = profile.split("|");
                  return (
                    <Group key={index} gap="xs">
                      <Select
                        placeholder="Platform"
                        data={socialMediaData}
                        value={platform}
                        onChange={(value) => {
                          if (isEditing) {
                            const updatedProfiles = [
                              ...(editForm.socialMedia || []),
                            ];
                            updatedProfiles[index] =
                              `${value || ""}|${url || ""}`;
                            setEditForm({
                              ...editForm,
                              socialMedia: updatedProfiles,
                            });
                          }
                        }}
                        leftSection={getPlatformIcon(platform)}
                        styles={{
                          input: {
                            borderLeftColor: getPlatformColor(platform),
                            borderLeftWidth: "3px",
                          },
                        }}
                        style={{ flex: "0 0 140px" }}
                        disabled={!isEditing}
                      />
                      <TextInput
                        placeholder="Enter profile URL"
                        value={url}
                        onChange={(event) => {
                          if (isEditing) {
                            const updatedProfiles = [
                              ...(editForm.socialMedia || []),
                            ];
                            updatedProfiles[index] =
                              `${platform || ""}|${event.currentTarget.value}`;
                            setEditForm({
                              ...editForm,
                              socialMedia: updatedProfiles,
                            });
                          }
                        }}
                        style={{ flex: 1 }}
                        disabled={!isEditing}
                      />
                      {isEditing && (
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => {
                            const updatedProfiles = editForm.socialMedia.filter(
                              (_, i) => i !== index
                            );
                            setEditForm({
                              ...editForm,
                              socialMedia: updatedProfiles,
                            });
                          }}
                          size="sm"
                          style={{ flex: "0 0 auto" }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  );
                }
              )}
            </Stack>
          )}

          {/* Add new social media profile */}
          {isEditing && (
            <Group gap="xs">
              <Select
                placeholder="Platform"
                data={socialMediaData}
                value={newSocialPlatform}
                onChange={(value) => setNewSocialPlatform(value || "")}
                leftSection={getPlatformIcon(newSocialPlatform)}
                styles={{
                  input: {
                    borderLeftColor: getPlatformColor(newSocialPlatform),
                    borderLeftWidth: "3px",
                  },
                }}
                style={{ flex: "0 0 140px" }}
              />
              <TextInput
                placeholder="Enter profile URL"
                value={newSocialUrl}
                onChange={(event) => setNewSocialUrl(event.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button
                variant="outline"
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={addSocialMedia}
                disabled={!newSocialPlatform || !newSocialUrl}
                style={{ flex: "0 0 auto" }}
              >
                Add
              </Button>
            </Group>
          )}
        </Box>

        {/* Additional Fields */}
        <MultiSelect
          label="Geographical Coverage"
          placeholder={
            (organisation?.fields?.geographicalCoverage?.length || 0) > 0
              ? undefined
              : "Add countries/regions"
          }
          value={
            isEditing
              ? editForm.geographicalCoverage
              : organisation?.fields?.geographicalCoverage
          }
          onChange={(value) =>
            isEditing &&
            setEditForm({ ...editForm, geographicalCoverage: value })
          }
          data={[
            "Albania",
            "Bosnia and Herzegovina",
            "Kosovo",
            "Montenegro",
            "North Macedonia",
            "Serbia",
            "Croatia",
            "Slovenia",
            "Bulgaria",
            "Romania",
            "Greece",
            "Turkey",
            "Other",
          ]}
          disabled={!isEditing}
          searchable
        />

        <MultiSelect
          label="Available Resources"
          placeholder={
            (organisation?.fields?.availableResources?.length || 0) > 0
              ? undefined
              : "Add available resources"
          }
          value={
            isEditing
              ? editForm.availableResources
              : organisation?.fields?.availableResources
          }
          onChange={(value) =>
            isEditing && setEditForm({ ...editForm, availableResources: value })
          }
          data={[
            "Technical Equipment",
            "Expert Staff",
            "Office Space",
            "Financial Resources",
            "Training Materials",
            "Research Data",
            "Networks & Contacts",
            "Other",
          ]}
          disabled={!isEditing}
          searchable
        />

        <MultiSelect
          label="Expertise Offered"
          placeholder={
            (organisation?.fields?.expertiseOffered?.length || 0) > 0
              ? undefined
              : "Add expertise you can offer"
          }
          value={
            isEditing
              ? editForm.expertiseOffered
              : organisation?.fields?.expertiseOffered
          }
          onChange={(value) =>
            isEditing && setEditForm({ ...editForm, expertiseOffered: value })
          }
          data={[
            "Project Management",
            "Technical Expertise",
            "Financial Management",
            "Capacity Building",
            "Research & Analysis",
            "Advocacy & Policy",
            "Training & Education",
            "Monitoring & Evaluation",
            "Other",
          ]}
          disabled={!isEditing}
          searchable
        />

        <MultiSelect
          label="Expertise Sought"
          placeholder={
            (organisation?.fields?.expertiseSought?.length || 0) > 0
              ? undefined
              : "Add expertise you are looking for"
          }
          value={
            isEditing
              ? editForm.expertiseSought
              : organisation?.fields?.expertiseSought
          }
          onChange={(value) =>
            isEditing && setEditForm({ ...editForm, expertiseSought: value })
          }
          data={[
            "Project Management",
            "Technical Expertise",
            "Financial Management",
            "Capacity Building",
            "Research & Analysis",
            "Advocacy & Policy",
            "Training & Education",
            "Monitoring & Evaluation",
            "Other",
          ]}
          disabled={!isEditing}
          searchable
        />
      </Card>

      {/* Keywords */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3} size="h4" mb="lg">
          Keywords
        </Title>

        <MultiSelect
          label="Keywords"
          placeholder={
            (organisation?.fields?.keywords?.length || 0) > 0
              ? undefined
              : "Add keywords to help others find your organisation"
          }
          value={isEditing ? editForm.keywords : organisation?.fields?.keywords}
          onChange={(value) =>
            isEditing && setEditForm({ ...editForm, keywords: value })
          }
          data={[]}
          disabled={!isEditing}
          searchable
        />

        <MultiSelect
          label="Looking for Partners in Thematic Areas"
          placeholder={
            (organisation?.fields?.lookingForPartnersInThematicAreas?.length ||
              0) > 0
              ? undefined
              : "Add thematic areas for partnership"
          }
          value={
            isEditing
              ? editForm.lookingForPartnersInThematicAreas
              : organisation?.fields?.lookingForPartnersInThematicAreas
          }
          onChange={(value) =>
            isEditing &&
            setEditForm({
              ...editForm,
              lookingForPartnersInThematicAreas: value,
            })
          }
          data={[
            "Education & Skills Development",
            "Health & Wellbeing",
            "Environmental Protection",
            "Economic Empowerment",
            "Social Inclusion",
            "Digital Transformation",
            "Cultural Exchange",
            "Youth Engagement",
            "Gender Equality",
            "Climate Action",
            "Humanitarian Aid",
            "Research & Innovation",
            "Other",
          ]}
          disabled={!isEditing}
          searchable
        />

        <MultiSelect
          label="Looking for Partners from Countries"
          placeholder={
            (organisation?.fields?.lookingForPartnersFromCPs?.length || 0) > 0
              ? undefined
              : "Add countries for partnership"
          }
          value={
            isEditing
              ? editForm.lookingForPartnersFromCPs
              : organisation?.fields?.lookingForPartnersFromCPs
          }
          onChange={(value) =>
            isEditing &&
            setEditForm({ ...editForm, lookingForPartnersFromCPs: value })
          }
          data={[
            "Albania",
            "Bosnia and Herzegovina",
            "Kosovo",
            "Montenegro",
            "North Macedonia",
            "Serbia",
            "Croatia",
            "Slovenia",
            "Bulgaria",
            "Romania",
            "Greece",
            "Turkey",
            "Other",
          ]}
          disabled={!isEditing}
          searchable
        />

        <MultiSelect
          label="Preferred Role in Partnerships"
          placeholder={
            (organisation?.fields?.preferredRole?.length || 0) > 0
              ? undefined
              : "Add preferred roles in partnerships"
          }
          value={
            isEditing
              ? editForm.preferredRole
              : organisation?.fields?.preferredRole
          }
          onChange={(value) =>
            isEditing && setEditForm({ ...editForm, preferredRole: value })
          }
          data={["Lead", "Partner", "Either"]}
          disabled={!isEditing}
          searchable
        />
      </Card>

      {/* Edit Actions */}
      {isEditing && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="flex-end">
            <Button
              variant="subtle"
              leftSection={<IconX size={16} />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            >
              Save Changes
            </Button>
          </Group>
        </Card>
      )}
    </Stack>
  );

  // const PartnershipsSection = () => {
  //   const dispatch = useDispatch();
  //   const navigate = useNavigate();
  //   const { token } = useSelector((state: RootState) => state.auth);
  //   const { favoriteOrganisations, isLoadingFavorites } = useSelector(
  //     (state: RootState) => state.organisation
  //   );

  //   useEffect(() => {
  //     if (token) {
  //       dispatch(fetchFavorites(token) as any);
  //     }
  //   }, [token, dispatch]);

  //   const handleRemoveFavorite = async (orgId: string) => {
  //     if (!token) return;

  //     try {
  //       const result = await dispatch(
  //         removeFavorite({ organisationId: orgId, token }) as any
  //       );

  //       if (removeFavorite.fulfilled.match(result)) {
  //         notifications.show({
  //           title: "Success",
  //           message: "Organisation removed from favorites",
  //           color: "green",
  //         });
  //       } else {
  //         notifications.show({
  //           title: "Error",
  //           message: result.payload || "Failed to remove from favorites",
  //           color: "red",
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error removing favorite:", error);
  //       notifications.show({
  //         title: "Error",
  //         message: "Failed to remove from favorites",
  //         color: "red",
  //       });
  //     }
  //   };

  //   return (
  //     <Stack gap="lg">
  //       <Card shadow="sm" padding="lg" radius="md" withBorder>
  //         <Group justify="space-between" mb="lg">
  //           <Title order={3} size="h4">
  //             Favorite Organizations
  //           </Title>
  //           <Badge size="lg" variant="light" color="blue">
  //             {favoriteOrganisations.length} Favorites
  //           </Badge>
  //         </Group>

  //         {isLoadingFavorites ? (
  //           <Center py={60}>
  //             <Loader size="md" />
  //           </Center>
  //         ) : favoriteOrganisations.length > 0 ? (
  //           <Grid>
  //             {favoriteOrganisations.map((org: FavoriteOrganisation) => (
  //               <Grid.Col key={org.id} span={{ base: 12, md: 6 }}>
  //                 <Card withBorder p="md" radius="md">
  //                   <Group gap="md">
  //                     <Avatar src={org.logo} size={48} radius="md">
  //                       <IconBuilding size={24} />
  //                     </Avatar>
  //                     <Box style={{ flex: 1 }}>
  //                       <Text size="sm" fw={600}>
  //                         {org.name}
  //                       </Text>
  //                       <Text size="xs" c="dimmed">
  //                         {org.country}
  //                       </Text>
  //                     </Box>
  //                     <Group gap="xs">
  //                       <ActionIcon
  //                         variant="light"
  //                         color="blue"
  //                         title="View Profile"
  //                         onClick={() => navigate(`/organisations/${org.id}`)}
  //                       >
  //                         <IconEye size={16} />
  //                       </ActionIcon>
  //                       <ActionIcon
  //                         variant="light"
  //                         color="red"
  //                         title="Remove from Favorites"
  //                         onClick={() => handleRemoveFavorite(org.id)}
  //                       >
  //                         <IconTrash size={16} />
  //                       </ActionIcon>
  //                     </Group>
  //                   </Group>
  //                 </Card>
  //               </Grid.Col>
  //             ))}
  //           </Grid>
  //         ) : (
  //           <Stack align="center" gap="md" py="xl">
  //             <IconStar size={48} color={theme.colors.gray[4]} />
  //             <Title order={4} c="dimmed">
  //               No favorite organizations yet
  //             </Title>
  //             <Text size="sm" c="dimmed" ta="center" maw={400}>
  //               Browse organizations and click the favorite button to save them
  //               here for quick access
  //             </Text>
  //             <Button
  //               variant="light"
  //               leftSection={<IconBuilding size={16} />}
  //               onClick={() => navigate("/dashboard/organisations")}
  //             >
  //               Browse Organizations
  //             </Button>
  //           </Stack>
  //         )}
  //       </Card>
  //     </Stack>
  //   );
  // };

  const MediaSection = () => {
    const dispatch = useDispatch();
    const { token } = useSelector((state: RootState) => state.auth);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [deletingLogo, setDeletingLogo] = useState(false);
    const [deletingCover, setDeletingCover] = useState(false);

    const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

    const handleLogoUpload = async (file: File) => {
      if (!token) {
        notifications.show({
          title: "Error",
          message: "Authentication required",
          color: "red",
        });
        return;
      }

      try {
        setUploadingLogo(true);
        
        const formData = new FormData();
        formData.append('logo', file);

        const response = await axios.post(
          `${API_BASE_URL}/organisation/upload-logo`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // Refresh organisation data
          await dispatch(getCurrentUser(token) as any);
          
          notifications.show({
            title: "Success",
            message: "Logo uploaded successfully!",
            color: "green",
          });
        } else {
          throw new Error(response.data.error || "Failed to upload logo");
        }
      } catch (error: any) {
        console.error("Logo upload error:", error);
        notifications.show({
          title: "Error",
          message: error.response?.data?.error || error.message || "Failed to upload logo",
          color: "red",
        });
      } finally {
        setUploadingLogo(false);
      }
    };

    const handleCoverUpload = async (file: File) => {
      if (!token) {
        notifications.show({
          title: "Error",
          message: "Authentication required",
          color: "red",
        });
        return;
      }

      try {
        setUploadingCover(true);
        
        const formData = new FormData();
        formData.append('cover', file);

        const response = await axios.post(
          `${API_BASE_URL}/organisation/upload-cover`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // Refresh organisation data
          await dispatch(getCurrentUser(token) as any);
          
          notifications.show({
            title: "Success",
            message: "Cover image uploaded successfully!",
            color: "green",
          });
        } else {
          throw new Error(response.data.error || "Failed to upload cover image");
        }
      } catch (error: any) {
        console.error("Cover upload error:", error);
        notifications.show({
          title: "Error",
          message: error.response?.data?.error || error.message || "Failed to upload cover image",
          color: "red",
        });
      } finally {
        setUploadingCover(false);
      }
    };

    const handleDeleteLogo = async () => {
      if (!confirm("Are you sure you want to delete your logo?")) return;
      
      if (!token) {
        notifications.show({
          title: "Error",
          message: "Authentication required",
          color: "red",
        });
        return;
      }

      if (!organisation?.images?.logo) {
        notifications.show({
          title: "Error",
          message: "No logo to delete",
          color: "red",
        });
        return;
      }

      try {
        setDeletingLogo(true);
        
        // Extract path from the public URL
        // URL format: https://storage.googleapis.com/{bucket}/{path}
        const logoUrl = organisation.images.logo;
        const urlParts = logoUrl.split('/organisations/');
        const path = urlParts.length > 1 ? `organisations/${urlParts[1].split('?')[0]}` : null;

        if (!path) {
          throw new Error("Could not extract file path from logo URL");
        }

        const response = await axios.post(
          `${API_BASE_URL}/organisation/delete-logo`,
          { path },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // Refresh organisation data
          await dispatch(getCurrentUser(token) as any);
          
          notifications.show({
            title: "Success",
            message: "Logo deleted successfully!",
            color: "green",
          });
        } else {
          throw new Error(response.data.error || "Failed to delete logo");
        }
      } catch (error: any) {
        console.error("Delete logo error:", error);
        notifications.show({
          title: "Error",
          message: error.response?.data?.error || error.message || "Failed to delete logo",
          color: "red",
        });
      } finally {
        setDeletingLogo(false);
      }
    };

    const handleDeleteCover = async () => {
      if (!confirm("Are you sure you want to delete your cover image?")) return;
      
      if (!token) {
        notifications.show({
          title: "Error",
          message: "Authentication required",
          color: "red",
        });
        return;
      }

      if (!organisation?.images?.cover) {
        notifications.show({
          title: "Error",
          message: "No cover image to delete",
          color: "red",
        });
        return;
      }

      try {
        setDeletingCover(true);
        
        // Extract path from the public URL
        // URL format: https://storage.googleapis.com/{bucket}/{path}
        const coverUrl = organisation.images.cover;
        const urlParts = coverUrl.split('/organisations/');
        const path = urlParts.length > 1 ? `organisations/${urlParts[1].split('?')[0]}` : null;

        if (!path) {
          throw new Error("Could not extract file path from cover URL");
        }

        const response = await axios.post(
          `${API_BASE_URL}/organisation/delete-cover`,
          { path },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // Refresh organisation data
          await dispatch(getCurrentUser(token) as any);
          
          notifications.show({
            title: "Success",
            message: "Cover image deleted successfully!",
            color: "green",
          });
        } else {
          throw new Error(response.data.error || "Failed to delete cover image");
        }
      } catch (error: any) {
        console.error("Delete cover error:", error);
        notifications.show({
          title: "Error",
          message: error.response?.data?.error || error.message || "Failed to delete cover image",
          color: "red",
        });
      } finally {
        setDeletingCover(false);
      }
    };

    return (
      <Stack gap="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} size="h4" mb="lg">
            Media & Resources
          </Title>

          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Box>
                <Group justify="space-between" mb="md">
                  <Text size="sm" fw={600}>
                    Organisation Logo
                  </Text>
                  {organisation?.images.logo && (
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={handleDeleteLogo}
                        loading={deletingLogo}
                        disabled={deletingLogo}
                      >
                        Delete
                      </Button>
                    </Group>
                  )}
                </Group>
                {organisation?.images.logo ? (
                  <Box mb="md">
                    <Image
                      src={organisation.images.logo}
                      alt="Organisation Logo"
                      style={{
                        maxWidth: 250,
                        borderRadius: theme.radius.md,
                        border: `1px solid ${theme.colors.gray[3]}`,
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    mb="md"
                    style={{
                      width: 250,
                      height: 150,
                      border: `2px dashed ${theme.colors.gray[3]}`,
                      borderRadius: theme.radius.md,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text size="sm" c="dimmed">
                      No logo uploaded
                    </Text>
                  </Box>
                )}
                <Button
                  leftSection={<IconUpload size={16} />}
                  variant="light"
                  fullWidth
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e: any) => {
                      const file = e.target?.files?.[0];
                      if (file) handleLogoUpload(file);
                    };
                    input.click();
                  }}
                  loading={uploadingLogo}
                >
                  {organisation?.images.logo ? "Replace Logo" : "Upload Logo"}
                </Button>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Box>
                <Group justify="space-between" mb="md">
                  <Text size="sm" fw={600}>
                    Cover Image
                  </Text>
                  {organisation?.images.cover && (
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={handleDeleteCover}
                        loading={deletingCover}
                        disabled={deletingCover}
                      >
                        Delete
                      </Button>
                    </Group>
                  )}
                </Group>
                {organisation?.images.cover ? (
                  <Box mb="md">
                    <Image
                      src={organisation.images.cover}
                      alt="Cover Image"
                      style={{
                        maxWidth: 250,
                        borderRadius: theme.radius.md,
                        border: `1px solid ${theme.colors.gray[3]}`,
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    mb="md"
                    style={{
                      width: 250,
                      height: 150,
                      border: `2px dashed ${theme.colors.gray[3]}`,
                      borderRadius: theme.radius.md,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text size="sm" c="dimmed">
                      No cover image uploaded
                    </Text>
                  </Box>
                )}
                <Button
                  leftSection={<IconUpload size={16} />}
                  variant="light"
                  fullWidth
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e: any) => {
                      const file = e.target?.files?.[0];
                      if (file) handleCoverUpload(file);
                    };
                    input.click();
                  }}
                  loading={uploadingCover}
                >
                  {organisation?.images.cover
                    ? "Replace Cover Image"
                    : "Upload Cover Image"}
                </Button>
              </Box>
            </Grid.Col>
          </Grid>

          <Alert
            icon={<IconAlertCircle size={16} />}
            color="blue"
            variant="light"
            mt="lg"
          >
            Images should be in JPG or PNG format. Recommended size: Logo (200x200px), Cover (1200x400px)
          </Alert>
        </Card>
      </Stack>
    );
  };

  const renderSection = () => {
    switch (activeTab) {
      case "basic":
        return <BasicInfoSection />;
      case "media":
        return <MediaSection />;
      default:
        return <BasicInfoSection />;
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <Box mb="xl">
        <Title order={1} size="2.5rem" mb="xs" c={theme.colors.gray[8]}>
          My Profile
        </Title>
        <Text size="lg" c="dimmed">
          Manage your organisation profile and settings
        </Text>
      </Box>

      <Grid>
        {/* Navigation Tabs */}
        <Grid.Col span={{ base: 12, lg: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              {profileSections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeTab === section.id ? "light" : "subtle"}
                  justify="flex-start"
                  leftSection={section.icon}
                  onClick={() => setActiveTab(section.id)}
                  style={{
                    textAlign: "left",
                    height: "auto",
                    padding: theme.spacing.md,
                  }}
                >
                  <Box>
                    <Text size="sm" fw={500}>
                      {section.title}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {section.description}
                    </Text>
                  </Box>
                </Button>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Content Area */}
        <Grid.Col span={{ base: 12, lg: 9 }}>{renderSection()}</Grid.Col>
      </Grid>
    </DashboardLayout>
  );
}
