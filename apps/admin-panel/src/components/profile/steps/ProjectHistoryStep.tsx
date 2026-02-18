import {
  MultiSelect,
  Select,
  Textarea,
  Group,
  TextInput,
  Button,
  Stack,
  Card,
  Text,
  Box,
  Divider,
  ActionIcon,
  Space,
  Image,
  FileInput,
  Loader,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { ProfileFormData, Project } from "../../../types/profile";
import {
  thematicAreas,
  countries,
  preferredRoles,
} from "../../../data/profileOptions";
import ProfileStepWrapper from "../ProfileStepWrapper";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconBriefcase,
  IconCalendar,
  IconUpload,
} from "@tabler/icons-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { uploadProjectImage, deleteProjectImage } from "../../../utils/storage";
import { notifications } from "@mantine/notifications";

interface ProjectHistoryStepProps {
  form: UseFormReturnType<ProfileFormData>;
  onFieldChange?: (field: string, value: any) => void;
}

export default function ProjectHistoryStep({
  form,
  onFieldChange,
}: ProjectHistoryStepProps) {
  const { organisation } = useSelector((state: RootState) => state.auth);
  const [uploadingImages, setUploadingImages] = useState<{
    [key: number]: boolean;
  }>({});

  // --- Project Entries ---
  const projects = form.values.projects || [];

  const addProject = () => {
    const newProject: Project = {
      title: "",
      description: "",
      imageUrl: "",
    };
    onFieldChange?.("projects", [...projects, newProject]);
  };

  const removeProject = (idx: number) => {
    const updatedProjects = projects.filter((_, i) => i !== idx);
    onFieldChange?.("projects", updatedProjects);
  };

  const updateProject = (idx: number, field: keyof Project, value: string) => {
    const updatedProjects = [...projects];
    updatedProjects[idx] = { ...updatedProjects[idx], [field]: value };
    onFieldChange?.("projects", updatedProjects);
  };

  const handleImageUpload = async (file: File | null, idx: number) => {
    if (!file) {
      updateProject(idx, "imageUrl", "");
      updateProject(idx, "imagePath", "");
      return;
    }

    if (!organisation?.id) {
      notifications.show({
        color: "yellow",
        title: "Upload Pending",
        message: "Image will be uploaded when you complete your profile",
      });
      return;
    }

    setUploadingImages((prev) => ({ ...prev, [idx]: true }));

    try {
      const result = await uploadProjectImage(file, organisation.id, idx);

      if (result.success) {
        // Update both fields at once to avoid overwriting
        const updatedProjects = [...projects];
        updatedProjects[idx] = {
          ...updatedProjects[idx],
          imageUrl: result.url,
          imagePath: result.path,
        };
        onFieldChange?.("projects", updatedProjects);

        notifications.show({
          color: "green",
          title: "Image Uploaded",
          message: "Project image has been uploaded successfully.",
        });
      } else {
        notifications.show({
          color: "red",
          title: "Upload Failed",
          message: result.error || "Failed to upload image",
        });
      }
    } catch (error) {
      console.error("Image upload error:", error);
      notifications.show({
        color: "red",
        title: "Upload Error",
        message: "An error occurred while uploading the image",
      });
    } finally {
      setUploadingImages((prev) => ({ ...prev, [idx]: false }));
    }
  };

  // --- WBF Calls ---
  const addWbfCall = () => {
    const newCall = { callNumber: "", year: new Date().getFullYear() };
    form.setFieldValue("wbfCallsApplied", [
      ...form.values.wbfCallsApplied,
      newCall,
    ]);
  };

  const removeWbfCall = (index: number) => {
    const updatedCalls = form.values.wbfCallsApplied.filter(
      (_, i) => i !== index
    );
    form.setFieldValue("wbfCallsApplied", updatedCalls);
  };

  const updateWbfCall = (
    index: number,
    field: "callNumber" | "year",
    value: string | number
  ) => {
    const updatedCalls = [...form.values.wbfCallsApplied];
    updatedCalls[index] = { ...updatedCalls[index], [field]: value };
    form.setFieldValue("wbfCallsApplied", updatedCalls);
  };

  return (
    <ProfileStepWrapper
      title="Project History"
      description="Tell us about your past projects and experiences with WBF or similar initiatives."
    >
      <Stack gap="xl">
        {/* Role and Thematic Areas Section */}
        <Box>
          <Text size="lg" fw={600} mb="md" c="dark.7">
            <IconBriefcase
              size={20}
              style={{ marginRight: 8, verticalAlign: "middle" }}
            />
            Past Experience
          </Text>

          <MultiSelect
            label="Role in Past Applications *"
            placeholder="Select your roles in previous applications"
            data={preferredRoles}
            value={form.values.roleInPastApplications}
            onChange={(value) =>
              onFieldChange?.("roleInPastApplications", value)
            }
            error={form.errors.roleInPastApplications}
            searchable
            styles={{
              input: {
                borderColor: "#e9ecef",
                "&:focus": {
                  borderColor: "#1a202c",
                },
              },
            }}
          />
          <Space h="md" />

          <MultiSelect
            label="Thematic Areas of Past Projects *"
            placeholder="Select thematic areas you've worked in"
            data={thematicAreas}
            searchable
            value={form.values.projectThematicAreas}
            onChange={(value) => onFieldChange?.("projectThematicAreas", value)}
            error={form.errors.projectThematicAreas}
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
            label="Geographical Coverage *"
            placeholder="Countries/regions where you've worked"
            data={countries}
            searchable
            value={form.values.geographicalCoverage}
            onChange={(value) => onFieldChange?.("geographicalCoverage", value)}
            error={form.errors.geographicalCoverage}
            mt="md"
            styles={{
              input: {
                borderColor: "#e9ecef",
                "&:focus": {
                  borderColor: "#1a202c",
                },
              },
            }}
          />
        </Box>

        <Divider />

        {/* Key Projects Section */}
        <Box>
          <Text size="lg" fw={600} mb="md" c="dark.7">
            <IconEdit
              size={20}
              style={{ marginRight: 8, verticalAlign: "middle" }}
            />
            Key Projects
          </Text>

          <Stack gap="lg">
            {projects.map((project, idx) => (
              <Card
                key={idx}
                p={0}
                withBorder
                shadow="lg"
                radius="lg"
                style={{
                  borderColor: "#e2e8f0",
                  backgroundColor: "white",
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                  "&:hover": {
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                {/* Card Header */}
                <Box
                  p="lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
                    color: "white",
                  }}
                >
                  <Group justify="space-between" align="flex-start" gap="md">
                    <Group gap="sm" align="flex-start" style={{ flex: 1 }}>
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: "bold",
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          size="lg"
                          fw={600}
                          style={{
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                            cursor: "pointer",
                            wordBreak: "break-word",
                            lineHeight: "1.4",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                          onClick={() => {
                            const newTitle = prompt(
                              "Enter project title:",
                              project.title
                            );
                            if (newTitle !== null) {
                              updateProject(idx, "title", newTitle);
                            }
                          }}
                        >
                          {project.title || `Project ${idx + 1}`}
                        </Text>
                        <Text size="xs" opacity={0.8} mt="xs">
                          Click title to edit
                        </Text>
                      </Box>
                    </Group>

                    <ActionIcon
                      color="white"
                      variant="subtle"
                      size="lg"
                      onClick={() => removeProject(idx)}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        flexShrink: 0,
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Box>

                {/* Card Content */}
                <Box p="lg">
                  <Group align="flex-start" gap="lg">
                    {/* Project Image Section */}
                    <Box style={{ flex: "0 0 160px" }}>
                      {project.imageUrl ? (
                        <Box style={{ position: "relative" }}>
                          <Image
                            src={project.imageUrl}
                            alt="Project preview"
                            width={160}
                            height={120}
                            fit="cover"
                            radius="lg"
                            style={{
                              width: "100%",
                              border: "3px solid #f1f5f9",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <ActionIcon
                            size="sm"
                            color="red"
                            variant="filled"
                            style={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              backgroundColor: "#dc2626",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            }}
                            onClick={async () => {
                              // If the image was uploaded to storage, delete it
                              if (project.imagePath) {
                                try {
                                  const result = await deleteProjectImage(
                                    project.imagePath
                                  );
                                  if (result.success) {
                                    updateProject(idx, "imageUrl", "");
                                    updateProject(idx, "imagePath", "");
                                    notifications.show({
                                      color: "green",
                                      title: "Image Deleted",
                                      message:
                                        "Project image has been deleted.",
                                    });
                                  } else {
                                    notifications.show({
                                      color: "red",
                                      title: "Delete Failed",
                                      message:
                                        result.error ||
                                        "Failed to delete image",
                                    });
                                  }
                                } catch (error) {
                                  console.error("Delete image error:", error);
                                  notifications.show({
                                    color: "red",
                                    title: "Delete Error",
                                    message:
                                      "An error occurred while deleting the image",
                                  });
                                }
                              } else {
                                // Just clear the URL if no path stored (base64 or no image)
                                updateProject(idx, "imageUrl", "");
                                updateProject(idx, "imagePath", "");
                              }
                            }}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        </Box>
                      ) : uploadingImages[idx] ? (
                        <Box
                          style={{
                            width: 160,
                            height: 120,
                            border: "2px dashed #cbd5e0",
                            borderRadius: "12px",
                            backgroundColor: "#f8fafc",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Loader size="sm" color="#1e3a8a" />
                          <Text size="xs" c="dimmed" ta="center" mt="xs">
                            Uploading...
                          </Text>
                        </Box>
                      ) : (
                        <Box
                          style={{
                            position: "relative",
                            width: "100%",
                            height: 120,
                          }}
                        >
                          <FileInput
                            id={`file-input-${idx}`}
                            placeholder=""
                            accept="image/*"
                            onChange={(file) => handleImageUpload(file, idx)}
                            styles={{
                              input: {
                                width: "100%",
                                height: 120,
                                border: "2px dashed #cbd5e0",
                                borderRadius: "12px",
                                backgroundColor: "#f8fafc",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                padding: 0,
                                fontSize: 0,
                                color: "transparent",
                                "&:hover": {
                                  borderColor: "#1e3a8a",
                                  backgroundColor: "#f1f5f9",
                                },
                              },
                              wrapper: {
                                width: "100%",
                                height: 120,
                              },
                              placeholder: {
                                display: "none",
                              },
                            }}
                          />
                          <Box
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              pointerEvents: "none",
                              zIndex: 1,
                            }}
                          >
                            <IconUpload size={24} color="#94a3b8" />
                            <Text size="xs" c="dimmed" mt="xs" ta="center">
                              Add Image
                            </Text>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Project Description */}
                    <Box style={{ flex: 1 }}>
                      <Textarea
                        label="Project Description"
                        placeholder="Describe this project, its objectives, outcomes, and your role..."
                        value={project.description}
                        onChange={(e) =>
                          updateProject(
                            idx,
                            "description",
                            e.currentTarget.value
                          )
                        }
                        minRows={4}
                        maxRows={8}
                        styles={{
                          input: {
                            borderColor: "#e9ecef",
                            height: "95px",
                            "&:focus": {
                              borderColor: "#1a202c",
                            },
                          },
                        }}
                      />
                    </Box>
                  </Group>
                </Box>
              </Card>
            ))}

            {/* Add New Project Button */}
            <Button
              variant="outline"
              onClick={addProject}
              leftSection={<IconPlus size={16} />}
              size="lg"
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
              Add New Project
            </Button>
          </Stack>
        </Box>

        <Divider />

        {/* WBF Calls Section */}
        <Box>
          <Text size="lg" fw={600} mb="md" c="dark.7">
            <IconCalendar
              size={20}
              style={{ marginRight: 8, verticalAlign: "middle" }}
            />
            WBF Calls Applied
          </Text>

          <Group gap="xs" wrap="wrap">
            {form.values.wbfCallsApplied.map((call, index) => (
              <Group
                key={index}
                gap="xs"
                align="center"
                p="xs"
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.2s ease",
                  height: "54px",
                  "&:hover": {
                    backgroundColor: "#f1f5f9",
                    borderColor: "#cbd5e0",
                  },
                }}
              >
                <TextInput
                  placeholder="Call Number"
                  value={call.callNumber}
                  onChange={(e) =>
                    updateWbfCall(index, "callNumber", e.target.value)
                  }
                  size="xs"
                  style={{ width: "96px" }}
                  styles={{
                    input: {
                      borderColor: "#e2e8f0",
                      backgroundColor: "white",
                      fontSize: "13px",
                      height: "32px",
                      "&:focus": {
                        borderColor: "#0d9488",
                        boxShadow: "0 0 0 1px rgba(13, 148, 136, 0.1)",
                      },
                    },
                  }}
                />

                <Select
                  placeholder="Year"
                  data={Array.from(
                    { length: new Date().getFullYear() - 1999 },
                    (_, i) => ({
                      value: (new Date().getFullYear() - i).toString(),
                      label: (new Date().getFullYear() - i).toString(),
                    })
                  )}
                  value={call.year?.toString()}
                  onChange={(value) =>
                    updateWbfCall(
                      index,
                      "year",
                      value ? parseInt(value) : new Date().getFullYear()
                    )
                  }
                  size="xs"
                  style={{ width: "80px" }}
                  styles={{
                    input: {
                      borderColor: "#e2e8f0",
                      backgroundColor: "white",
                      fontSize: "13px",
                      height: "32px",
                      "&:focus": {
                        borderColor: "#0d9488",
                        boxShadow: "0 0 0 1px rgba(13, 148, 136, 0.1)",
                      },
                    },
                  }}
                />

                <ActionIcon
                  color="gray"
                  variant="subtle"
                  size="xs"
                  onClick={() => removeWbfCall(index)}
                  style={{
                    color: "#64748b",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                    },
                  }}
                >
                  <IconTrash size={12} />
                </ActionIcon>
              </Group>
            ))}

            <Button
              variant="subtle"
              onClick={addWbfCall}
              leftSection={<IconPlus size={12} />}
              size="xs"
              style={{
                color: "#64748b",
                fontWeight: 500,
                transition: "all 0.2s ease",
                alignSelf: "flex-start",
                height: "54px",
                width: "100%",
              }}
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: "#e2e8f0",
                    color: "#0d9488",
                  },
                },
              }}
            >
              Add WBF Call
            </Button>
          </Group>
        </Box>
      </Stack>
    </ProfileStepWrapper>
  );
}
