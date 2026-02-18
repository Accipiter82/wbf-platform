import {
  MultiSelect,
  Textarea,
  TextInput,
  Button,
  Group,
  Stack,
  Card,
  Text,
  Box,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import {
  ProfileFormData,
  ReferenceProject,
  SuccessStory,
} from "../../../types/profile";
import { keywords, availableResources } from "../../../data/profileOptions";
import ProfileStepWrapper from "../ProfileStepWrapper";
import { IconPlus, IconTrash } from "@tabler/icons-react";

interface AdditionalInfoStepProps {
  form: UseFormReturnType<ProfileFormData>;
  onFieldChange?: (field: string, value: any) => void;
}

export default function AdditionalInfoStep({
  form,
  onFieldChange,
}: AdditionalInfoStepProps) {
  // Reference Projects
  const referenceProjects = form.values.referenceProjects || [];

  const addReferenceProject = () => {
    const newProject: ReferenceProject = {
      title: "",
      description: "",
    };
    onFieldChange?.("referenceProjects", [...referenceProjects, newProject]);
  };

  const removeReferenceProject = (idx: number) => {
    onFieldChange?.(
      "referenceProjects",
      referenceProjects.filter((_, i) => i !== idx)
    );
  };

  const updateReferenceProject = (
    idx: number,
    field: keyof ReferenceProject,
    value: string
  ) => {
    const updated = [...referenceProjects];
    updated[idx] = { ...updated[idx], [field]: value };
    onFieldChange?.("referenceProjects", updated);
  };

  // Success Stories
  const successStories = form.values.successStories || [];

  const addSuccessStory = () => {
    const newStory: SuccessStory = {
      title: "",
      description: "",
    };
    onFieldChange?.("successStories", [...successStories, newStory]);
  };

  const removeSuccessStory = (idx: number) => {
    onFieldChange?.(
      "successStories",
      successStories.filter((_, i) => i !== idx)
    );
  };

  const updateSuccessStory = (
    idx: number,
    field: keyof SuccessStory,
    value: string
  ) => {
    const updated = [...successStories];
    updated[idx] = { ...updated[idx], [field]: value };
    onFieldChange?.("successStories", updated);
  };

  return (
    <ProfileStepWrapper
      title="Additional Information"
      description="Final details to complete your organisation profile."
    >
      <Stack gap="xl">
        <MultiSelect
          label="Keywords/Tags"
          placeholder="Add keywords that describe your organisation"
          data={keywords}
          searchable
          value={form.values.keywords}
          onChange={(value) => onFieldChange?.("keywords", value)}
          error={form.errors.keywords}
          styles={{
            input: {
              borderColor: "#e9ecef",
              "&:focus": {
                borderColor: "#1a202c",
              },
            },
          }}
        />

        <MultiSelect
          label="Available Resources / Capacities"
          placeholder="What resources can you contribute to partnerships?"
          data={availableResources}
          searchable
          value={form.values.availableResources}
          onChange={(value) => onFieldChange?.("availableResources", value)}
          error={form.errors.availableResources}
          styles={{
            input: {
              borderColor: "#e9ecef",
              "&:focus": {
                borderColor: "#1a202c",
              },
            },
          }}
        />

        {/* Reference Projects */}
        <Box>
          <Text size="lg" fw={600} mb="md" c="dark.7">
            Reference Projects
          </Text>
          <Stack gap="lg">
            {referenceProjects.map((project, idx) => (
              <Card key={idx} p="lg" withBorder shadow="sm" radius="md">
                <Stack gap="md">
                  <TextInput
                    label="Project Title"
                    placeholder="Enter project title"
                    value={project.title}
                    onChange={(e) =>
                      updateReferenceProject(
                        idx,
                        "title",
                        e.currentTarget.value
                      )
                    }
                    styles={{
                      input: {
                        borderColor: "#e9ecef",
                        "&:focus": {
                          borderColor: "#1a202c",
                        },
                      },
                    }}
                  />

                  <Textarea
                    label="Project Description"
                    placeholder="Describe this reference project..."
                    value={project.description}
                    onChange={(e) =>
                      updateReferenceProject(
                        idx,
                        "description",
                        e.currentTarget.value
                      )
                    }
                    minRows={3}
                    styles={{
                      input: {
                        borderColor: "#e9ecef",
                        "&:focus": {
                          borderColor: "#1a202c",
                        },
                      },
                    }}
                  />

                  <Group justify="flex-end">
                    <Button
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeReferenceProject(idx)}
                      leftSection={<IconTrash size={14} />}
                    >
                      Remove
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={addReferenceProject}
              leftSection={<IconPlus size={16} />}
              size="md"
              radius="md"
              style={{
                borderColor: "#1a202c",
                color: "#1a202c",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: "#f8f9fa",
                    borderColor: "#2d3748",
                    color: "#2d3748",
                  },
                },
              }}
            >
              Add Reference Project
            </Button>
          </Stack>
        </Box>

        {/* Success Stories */}
        <Box>
          <Text size="lg" fw={600} mb="md" c="dark.7">
            Success Stories
          </Text>
          <Stack gap="lg">
            {successStories.map((story, idx) => (
              <Card key={idx} p="lg" withBorder shadow="sm" radius="md">
                <Stack gap="md">
                  <TextInput
                    label="Story Title"
                    placeholder="Enter success story title"
                    value={story.title}
                    onChange={(e) =>
                      updateSuccessStory(idx, "title", e.currentTarget.value)
                    }
                    styles={{
                      input: {
                        borderColor: "#e9ecef",
                        "&:focus": {
                          borderColor: "#1a202c",
                        },
                      },
                    }}
                  />

                  <Textarea
                    label="Success Story"
                    placeholder="Describe this success story..."
                    value={story.description}
                    onChange={(e) =>
                      updateSuccessStory(
                        idx,
                        "description",
                        e.currentTarget.value
                      )
                    }
                    minRows={3}
                    styles={{
                      input: {
                        borderColor: "#e9ecef",
                        "&:focus": {
                          borderColor: "#1a202c",
                        },
                      },
                    }}
                  />

                  <Group justify="flex-end">
                    <Button
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => removeSuccessStory(idx)}
                      leftSection={<IconTrash size={14} />}
                    >
                      Remove
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={addSuccessStory}
              leftSection={<IconPlus size={16} />}
              size="md"
              radius="md"
              style={{
                borderColor: "#1a202c",
                color: "#1a202c",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: "#f8f9fa",
                    borderColor: "#2d3748",
                    color: "#2d3748",
                  },
                },
              }}
            >
              Add Success Story
            </Button>
          </Stack>
        </Box>
      </Stack>
    </ProfileStepWrapper>
  );
}
