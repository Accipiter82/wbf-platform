import {
  TextInput,
  Select,
  Stack,
  Box,
  Image,
  FileInput,
  Group,
  Badge,
  Text,
  Loader,
  Button,
} from "@mantine/core";
import {
  IconPhoto,
  IconBuilding,
  IconCheck,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { ProfileFormData } from "../../../types/profile";
import { organisationTypes } from "../../../data/profileOptions";
import ProfileStepWrapper from "../ProfileStepWrapper";
import { useState, useEffect } from "react";
import {
  uploadOrganisationLogo,
  uploadOrganisationCover,
  validateImageFile,
  deleteOrganisationCover,
} from "../../../utils/storage";
import { notifications } from "@mantine/notifications";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

interface BasicInfoStepProps {
  form: UseFormReturnType<ProfileFormData>;
  onFieldChange?: (field: string, value: any) => void;
}

export default function BasicInfoStep({
  form,
  onFieldChange,
}: BasicInfoStepProps) {
  const { organisation } = useSelector((state: RootState) => state.auth);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [coverUploaded, setCoverUploaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  // Initialize previews from form data if they exist
  useEffect(() => {
    // Check form values first
    if (form.values.logoUrl) {
      setLogoPreview(form.values.logoUrl);
      setLogoUploaded(true);
    } else if (organisation?.images?.logo) {
      // Fallback to organisation data
      setLogoPreview(organisation.images.logo);
      setLogoUploaded(true);
      form.setFieldValue("logoUrl", organisation.images.logo);
    }

    if (form.values.coverUrl) {
      setCoverPreview(form.values.coverUrl);
      setCoverUploaded(true);
    } else if (organisation?.images?.cover) {
      // Fallback to organisation data
      setCoverPreview(organisation.images.cover);
      setCoverUploaded(true);
      form.setFieldValue("coverUrl", organisation.images.cover);
    }
  }, [
    form.values.logoUrl,
    form.values.coverUrl,
    organisation?.images?.logo,
    organisation?.images?.cover,
  ]);

  const handleLogoUpload = async (file: File | null) => {
    // Clear the file input value to allow re-selection of the same file
    const fileInput = document.getElementById(
      "logo-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }

    if (!file) {
      setLogoPreview(null);
      setLogoUploaded(false);
      setLogoError(false);
      form.setFieldValue("logoUrl", "");
      return;
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setLogoError(true);
      notifications.show({
        color: "red",
        title: "Invalid File",
        message: validation.error,
      });
      return;
    }

    setLogoError(false);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    if (organisation?.id) {
      setLogoUploading(true);
      try {
        const result = await uploadOrganisationLogo(file, organisation.id);

        if (result.success) {
          form.setFieldValue("logoUrl", result.url);
          setLogoUploaded(true);
          setLogoError(false);
          notifications.show({
            color: "green",
            title: "Logo Uploaded",
            message: "Your organisation logo has been successfully uploaded.",
          });
        } else {
          setLogoError(true);
          notifications.show({
            color: "red",
            title: "Upload Failed",
            message: result.error || "Failed to upload logo",
          });
        }
      } catch (error) {
        setLogoError(true);
        notifications.show({
          color: "red",
          title: "Upload Error",
          message: "An error occurred while uploading the logo",
        });
      } finally {
        setLogoUploading(false);
      }
    } else {
      notifications.show({
        color: "yellow",
        title: "Upload Pending",
        message: "Logo will be uploaded when you complete your profile",
      });
    }
  };

  const handleCoverUpload = async (file: File | null) => {
    // Clear the file input value to allow re-selection of the same file
    const fileInput = document.getElementById(
      "cover-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }

    if (!file) {
      setCoverFile(null);
      setCoverPreview(null);
      setCoverUploaded(false);
      setCoverError(false);
      form.setFieldValue("coverUrl", "");
      return;
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setCoverError(true);
      notifications.show({
        color: "red",
        title: "Invalid File",
        message: validation.error,
      });
      return;
    }

    setCoverFile(file);
    setCoverError(false);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    if (organisation?.id) {
      setCoverUploading(true);
      try {
        const result = await uploadOrganisationCover(file, organisation.id);

        if (result.success) {
          form.setFieldValue("coverUrl", result.url);
          setCoverUploaded(true);
          setCoverError(false);
          notifications.show({
            color: "green",
            title: "Cover Photo Uploaded",
            message:
              "Your organisation cover photo has been successfully uploaded.",
          });
        } else {
          setCoverError(true);
          notifications.show({
            color: "red",
            title: "Upload Failed",
            message: result.error || "Failed to upload cover photo",
          });
        }
      } catch (error) {
        setCoverError(true);
        notifications.show({
          color: "red",
          title: "Upload Error",
          message: "An error occurred while uploading the cover photo",
        });
      } finally {
        setCoverUploading(false);
      }
    } else {
      notifications.show({
        color: "yellow",
        title: "Upload Pending",
        message: "Cover photo will be uploaded when you complete your profile",
      });
    }
  };

  const handleLogoDelete = () => {
    setLogoPreview(null);
    setLogoUploaded(false);
    setLogoError(false);
    form.setFieldValue("logoUrl", "");

    // Also clear the organisation logo if it exists
    if (organisation?.images?.logo) {
      // This will be handled by the backend when the form is submitted
      // For now, just clear the local state
    }

    notifications.show({
      color: "blue",
      title: "Logo Removed",
      message: "Logo has been removed. You can upload a new one.",
    });
  };

  const handleCoverDelete = async () => {
    if (form.values.coverUrl && organisation?.id) {
      // Try to extract the path from the URL (if available)
      const path = form.values.coverUrl.includes("/organisations/")
        ? decodeURIComponent(
            form.values.coverUrl.split("/organisations/")[1].split("?")[0]
          )
          ? `organisations/${form.values.coverUrl.split("/organisations/")[1].split("?")[0]}`
          : undefined
        : undefined;
      if (path) {
        const result = await deleteOrganisationCover(path);
        if (!result.success) {
          notifications.show({
            color: "red",
            title: "Delete Failed",
            message:
              result.error || "Failed to delete cover photo from backend.",
          });
          return;
        }
      }
    }
    setCoverFile(null);
    setCoverPreview(null);
    setCoverUploaded(false);
    setCoverError(false);
    form.setFieldValue("coverUrl", "");

    // Also clear the organisation cover if it exists
    if (organisation?.images?.cover) {
      // This will be handled by the backend when the form is submitted
      // For now, just clear the local state
    }

    notifications.show({
      color: "blue",
      title: "Cover Photo Removed",
      message: "Cover photo has been removed. You can upload a new one.",
    });
  };

  const handleCoverReupload = async () => {
    if (coverFile && organisation?.id) {
      setCoverUploading(true);
      try {
        const result = await uploadOrganisationCover(
          coverFile,
          organisation.id
        );
        if (result.success) {
          form.setFieldValue("coverUrl", result.url);
          setCoverUploaded(true);
          setCoverError(false);
          setCoverPreview(result.url);
          notifications.show({
            color: "green",
            title: "Cover Photo Uploaded",
            message:
              "Your organisation cover photo has been successfully uploaded.",
          });
        } else {
          setCoverError(true);
          notifications.show({
            color: "red",
            title: "Upload Failed",
            message: result.error || "Failed to upload cover photo",
          });
        }
      } catch (error) {
        setCoverError(true);
        notifications.show({
          color: "red",
          title: "Upload Error",
          message: "An error occurred while uploading the cover photo",
        });
      } finally {
        setCoverUploading(false);
      }
    } else {
      notifications.show({
        color: "yellow",
        title: "No File",
        message: "No cover file available to re-upload.",
      });
    }
  };

  return (
    <ProfileStepWrapper
      title="Basic Information"
      description="Tell us about your organisation"
      isFirstStep={true}
    >
      {/* Organization Name Header */}
      {organisation?.name && (
        <Box mb="lg">
          <Text size="xl" fw={700} c="brand.7" mb="xs">
            {organisation.name}
          </Text>
          {organisation.nameLocal && (
            <Text size="md" c="dimmed">
              {organisation.nameLocal}
            </Text>
          )}
        </Box>
      )}

      {/* LinkedIn-style Profile Header */}
      <Box mb="xl">
        <Text size="sm" fw={500} mb="md" style={{ color: "#1a202c" }}>
          Profile Photo & Cover Image
        </Text>

        {/* LinkedIn-style Profile Header */}
        <Box
          style={{
            position: "relative",
            height: 200,
            borderRadius: "12px",
            background: "#f8f9fa",
            border: "1px solid #e9ecef",
            marginBottom: "80px",
          }}
        >
          {/* Cover Photo */}
          {coverPreview ? (
            <Image
              src={coverPreview}
              alt="Cover preview"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          ) : (
            <Box
              ta="center"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "#6c757d",
              }}
            >
              <IconPhoto size={48} />
              <Text size="sm" mt="xs">
                Cover Photo
              </Text>
            </Box>
          )}

          {/* Cover Action Buttons - Outside upload area */}
          {coverPreview && (
            <Group
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                zIndex: 20,
                pointerEvents: "auto",
              }}
            >
              {/* Delete Button */}
              <Button
                size="xs"
                color="red"
                variant="filled"
                onClick={async (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await handleCoverDelete();
                }}
                disabled={coverUploading}
                style={{
                  background: "rgba(220, 38, 38, 0.9)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  minWidth: "auto",
                  pointerEvents: "auto",
                }}
              >
                <IconTrash size={12} />
              </Button>

              {/* Re-upload Button (if there was an error) */}
              {coverError && (
                <Button
                  size="xs"
                  variant="filled"
                  onClick={async (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleCoverReupload();
                  }}
                  disabled={coverUploading}
                  style={{
                    background: "rgba(26, 32, 44, 0.9)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    minWidth: "auto",
                    pointerEvents: "auto",
                  }}
                >
                  <IconUpload size={12} />
                </Button>
              )}
            </Group>
          )}

          {/* Cover Upload Area */}
          <Box
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              cursor: coverUploading ? "not-allowed" : "pointer",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: coverUploading ? "rgba(0,0,0,0.1)" : "transparent",
              transition: "background 0.2s",
              zIndex: 10,
            }}
            onClick={() => {
              if (!coverUploading) {
                document.getElementById("cover-upload")?.click();
              }
            }}
          ></Box>

          {/* Hidden File Input for Cover */}
          <FileInput
            id="cover-upload"
            placeholder=""
            accept="image/*"
            onChange={handleCoverUpload}
            clearable
            disabled={coverUploading}
            style={{
              position: "absolute",
              top: "-9999px",
              left: "-9999px",
              opacity: 0,
              pointerEvents: "none",
            }}
          />

          {/* Logo Section - LinkedIn Style */}
          <Box
            style={{
              position: "absolute",
              bottom: -60,
              left: 24,
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "4px solid white",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              cursor: logoUploading ? "not-allowed" : "pointer",
              transition: "transform 0.2s",
              zIndex: 30,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!logoUploading) {
                document.getElementById("logo-upload")?.click();
              }
            }}
            onMouseEnter={(e) => {
              if (!logoUploading) {
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Logo preview"
                width={112}
                height={112}
                fit="contain"
                radius="50%"
              />
            ) : (
              <Box ta="center">
                <IconBuilding size={32} color="#6c757d" />
                <Text size="xs" c="dimmed" mt="xs">
                  Logo
                </Text>
              </Box>
            )}

            {/* Hidden File Input for Logo */}
            <FileInput
              id="logo-upload"
              placeholder=""
              accept="image/*"
              onChange={handleLogoUpload}
              clearable
              disabled={logoUploading}
              style={{
                position: "absolute",
                top: "-9999px",
                left: "-9999px",
                opacity: 0,
                pointerEvents: "none",
              }}
            />

            {/* Loading indicator for logo */}
            {logoUploading && (
              <Box
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "50%",
                  padding: 8,
                }}
              >
                <Loader size="sm" style={{ color: "#1a202c" }} />
              </Box>
            )}

            {/* Logo Action Buttons */}
            {logoPreview && (
              <Group style={{ position: "absolute", top: -8, right: -8 }}>
                {/* Delete Button */}
                <Button
                  size="xs"
                  color="red"
                  variant="filled"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleLogoDelete();
                  }}
                  disabled={logoUploading}
                  style={{
                    background: "rgba(220, 38, 38, 0.9)",
                    border: "none",
                    borderRadius: "50%",
                    padding: "4px",
                    minWidth: "auto",
                    width: "24px",
                    height: "24px",
                  }}
                >
                  <IconTrash size={10} />
                </Button>

                {/* Re-upload Button (if there was an error) */}
                {logoError && (
                  <Button
                    size="xs"
                    variant="filled"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      document.getElementById("logo-upload")?.click();
                    }}
                    disabled={logoUploading}
                    style={{
                      background: "rgba(26, 32, 44, 0.9)",
                      border: "none",
                      borderRadius: "50%",
                      padding: "4px",
                      minWidth: "auto",
                      width: "24px",
                      height: "24px",
                    }}
                  >
                    <IconUpload size={10} />
                  </Button>
                )}
              </Group>
            )}
          </Box>

          {/* Single Loading indicator for cover or logo */}
          {(coverUploading || logoUploading) && (
            <Box
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(255, 255, 255, 0.7)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
              }}
            >
              <Loader size="md" style={{ color: "#1a202c" }} />
              <Text size="sm" style={{ color: "#1a202c" }} ml="sm">
                Uploading...
              </Text>
            </Box>
          )}

          {/* Upload Status Badges */}
          <Group style={{ position: "absolute", top: 12, right: 12 }}>
            {logoUploaded && (
              <Badge color="green" variant="light" size="sm">
                <IconCheck size={10} />
                Logo
              </Badge>
            )}
            {coverUploaded && (
              <Badge color="green" variant="light" size="sm">
                <IconCheck size={10} />
                Cover
              </Badge>
            )}
            {logoUploading && (
              <Badge
                style={{ backgroundColor: "#1a202c", color: "white" }}
                variant="light"
                size="sm"
              >
                <Loader size={8} />
                Uploading
              </Badge>
            )}
          </Group>
        </Box>

        {/* Upload Instructions */}
        <Text size="xs" c="dimmed" mb="lg">
          • <strong>Cover Photo:</strong> Click anywhere on the cover area to
          upload (recommended: 1200x300px, max 5MB)
          <br />• <strong>Logo:</strong> Click on the circular logo area to
          upload (recommended: 400x400px, max 2MB)
          <br />• <strong>Supported formats:</strong> JPEG, PNG, WebP
        </Text>
      </Box>

      {/* Basic Information Form */}
      <Stack gap="md">
        <TextInput
          label="Organisation Name (Local Language)"
          placeholder="Enter your organisation name in local language"
          required
          value={form.values.nameLocal}
          onChange={(event) =>
            onFieldChange?.("nameLocal", event.currentTarget.value)
          }
          error={form.errors.nameLocal}
        />

        <TextInput
          label="Contracting Party"
          placeholder="Enter contracting party name"
          required
          value={form.values.contractingParty}
          onChange={(event) =>
            onFieldChange?.("contractingParty", event.currentTarget.value)
          }
          error={form.errors.contractingParty}
        />

        <Group grow>
          <TextInput
            label="City"
            placeholder="Enter city"  
            required
            value={form.values.city}
            onChange={(event) =>
              onFieldChange?.("city", event.currentTarget.value)
            }
            error={form.errors.city}
          />

          <Select
            label="Organisation Type"
            placeholder="Select organisation type"
            data={organisationTypes}
            required
            value={form.values.type}
            onChange={(value) => onFieldChange?.("type", value)}
            error={form.errors.type}
          />
        </Group>

        <TextInput
          label="Postal Address"
          placeholder="Enter postal address"
          value={form.values.postalAddress}
          onChange={(event) =>
            onFieldChange?.("postalAddress", event.currentTarget.value)
          }
          error={form.errors.postalAddress}
        />

        <Group grow>
          <Select
            label="Year of Establishment"
            placeholder="Select year"
            data={Array.from(
              { length: new Date().getFullYear() - 1899 },
              (_, i) => ({
                value: (new Date().getFullYear() - i).toString(),
                label: (new Date().getFullYear() - i).toString(),
              })
            )}
            required
            value={form.values.yearOfEstablishment?.toString()}
            onChange={(value) =>
              onFieldChange?.(
                "yearOfEstablishment",
                value ? parseInt(value) : null
              )
            }
            error={form.errors.yearOfEstablishment}
          />

          <TextInput
            label="Registration Number"
            placeholder="Enter registration number (optional)"
            value={form.values.registrationNumber}
            onChange={(event) =>
              onFieldChange?.("registrationNumber", event.currentTarget.value)
            }
            error={form.errors.registrationNumber}
          />
        </Group>
      </Stack>
    </ProfileStepWrapper>
  );
}
