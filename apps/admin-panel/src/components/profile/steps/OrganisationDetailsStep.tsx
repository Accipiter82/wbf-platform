import {
  Select,
  MultiSelect,
  TextInput,
  Group,
  Button,
  Stack,
  Box,
  ActionIcon,
  Text,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { ProfileFormData } from "../../../types/profile";
import {
  missionFields,
  staffSizeOptions,
  volunteerSizeOptions,
} from "../../../data/profileOptions";
import ProfileStepWrapper from "../ProfileStepWrapper";
import {
  IconPlus,
  IconTrash,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandTiktok,
} from "@tabler/icons-react";
import { useState } from "react";

interface OrganisationDetailsStepProps {
  form: UseFormReturnType<ProfileFormData>;
  onFieldChange?: (field: string, value: any) => void;
}

interface SocialMediaEntry {
  platform: string;
  url: string;
}

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

export default function OrganisationDetailsStep({
  form,
  onFieldChange,
}: OrganisationDetailsStepProps) {
  const [newPlatform, setNewPlatform] = useState<string>("");
  const [newUrl, setNewUrl] = useState<string>("");

  // Parse social media profiles from form values
  const socialMediaEntries: SocialMediaEntry[] =
    form.values.socialMediaProfiles.map((profile) => {
      const [platform, url] = profile.split("|");
      return { platform: platform || "", url: url || "" };
    });

  const addSocialMedia = () => {
    if (newPlatform && newUrl) {
      const entry = `${newPlatform}|${newUrl}`;
      const updatedProfiles = [...form.values.socialMediaProfiles, entry];
      onFieldChange?.("socialMediaProfiles", updatedProfiles);
      setNewPlatform("");
      setNewUrl("");
    }
  };

  const removeSocialMedia = (index: number) => {
    const updatedProfiles = form.values.socialMediaProfiles.filter(
      (_, i) => i !== index
    );
    onFieldChange?.("socialMediaProfiles", updatedProfiles);
  };

  const updateSocialMedia = (
    index: number,
    field: "platform" | "url",
    value: string
  ) => {
    const entries = socialMediaEntries.map((entry, i) => {
      if (i === index) {
        return { ...entry, [field]: value };
      }
      return entry;
    });

    const updatedProfiles = entries.map(
      (entry) => `${entry.platform}|${entry.url}`
    );
    onFieldChange?.("socialMediaProfiles", updatedProfiles);
  };

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

  return (
    <ProfileStepWrapper title="Organisation Details">
      <Group grow>
        <Select
          label="Number of Staff"
          placeholder="Select staff size"
          data={staffSizeOptions}
          value={form.values.numberOfStaff}
          onChange={(value) => onFieldChange?.("numberOfStaff", value)}
          error={form.errors.numberOfStaff}
        />
        <Select
          label="Number of Volunteers"
          placeholder="Select volunteer size"
          data={volunteerSizeOptions}
          value={form.values.numberOfVolunteers}
          onChange={(value) => onFieldChange?.("numberOfVolunteers", value)}
          error={form.errors.numberOfVolunteers}
        />
      </Group>

      <MultiSelect
        label="Mission / Main Fields of Work"
        placeholder="Select areas your organisation works in"
        data={missionFields}
        searchable
        value={form.values.missionFields}
        onChange={(value) => onFieldChange?.("missionFields", value)}
        error={form.errors.missionFields}
      />

      <TextInput
        label="Website"
        placeholder="https://your-organisation.org"
        value={form.values.website}
        onChange={(event) =>
          onFieldChange?.("website", event.currentTarget.value)
        }
        error={form.errors.website}
      />

      {/* Social Media Section */}
      <Box>
        <Text size="sm" fw={500} mb="xs">
          Social Media Profiles
        </Text>

        {/* Existing Social Media Entries */}
        {socialMediaEntries.length > 0 && (
          <Stack gap="sm" mb="md">
            {socialMediaEntries.map((entry, index) => (
              <Group key={index} gap="xs">
                <Select
                  placeholder="Platform"
                  data={socialMediaData}
                  value={entry.platform}
                  onChange={(value) =>
                    updateSocialMedia(index, "platform", value || "")
                  }
                  leftSection={getPlatformIcon(entry.platform)}
                  styles={{
                    input: {
                      borderLeftColor: getPlatformColor(entry.platform),
                      borderLeftWidth: "3px",
                    },
                  }}
                  style={{ flex: "0 0 140px" }}
                />
                <TextInput
                  placeholder="Enter profile URL"
                  value={entry.url}
                  onChange={(event) =>
                    updateSocialMedia(index, "url", event.currentTarget.value)
                  }
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => removeSocialMedia(index)}
                  size="sm"
                  style={{ flex: "0 0 auto" }}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        )}

        {/* Add New Social Media Entry */}
        <Group gap="xs">
          <Select
            placeholder="Platform"
            data={socialMediaData}
            value={newPlatform}
            onChange={(value) => setNewPlatform(value || "")}
            leftSection={getPlatformIcon(newPlatform)}
            styles={{
              input: {
                borderLeftColor: getPlatformColor(newPlatform),
                borderLeftWidth: "3px",
              },
            }}
            style={{ flex: "0 0 140px" }}
          />
          <TextInput
            placeholder="Enter profile URL"
            value={newUrl}
            onChange={(event) => setNewUrl(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addSocialMedia}
            disabled={!newPlatform || !newUrl}
            leftSection={<IconPlus size={16} />}
            style={{ flex: "0 0 auto" }}
          >
            Add
          </Button>
        </Group>

        {/* Platform Icons Legend removed as requested */}

        {form.errors.socialMediaProfiles && (
          <Text size="xs" c="red" mt="xs">
            {form.errors.socialMediaProfiles}
          </Text>
        )}
      </Box>
    </ProfileStepWrapper>
  );
}
