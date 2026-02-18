import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Box,
  Stepper,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  NumberInput,
  Checkbox,
  Grid,
  Card,
  useMantineTheme,
  Image,
  Tabs,
  ActionIcon,
  LoadingOverlay,
  Paper,
  Divider,
  Avatar,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Dropzone, IMAGE_MIME_TYPE, FileWithPath } from "@mantine/dropzone";
import {
  IconUpload,
  IconPhoto,
  IconX,
  IconLink,
  IconArrowLeft,
  IconCheck,
  IconBuilding,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import SuperAdminDashboardLayout from "../components/layout/SuperAdminDashboardLayout";
import axios from "axios";
import { notifications } from "@mantine/notifications";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api";

interface Organisation {
  id: string;
  name: string;
  logo?: string;
  country?: string;
  missionFields?: string[];
  description?: string;
}

const thematicAreasOptions = [
  "Environmental Protection",
  "Climate Change",
  "Youth Development",
  "Education",
  "Community Development",
  "Social Inclusion",
  "Social Innovation",
  "Economic Development",
  "Healthcare",
  "Human Rights",
  "Gender Equality",
];

const expertiseOptions = [
  "Environmental Education",
  "Policy Advocacy",
  "Community Engagement",
  "Youth Leadership",
  "Educational Programs",
  "Social Work",
  "Social Entrepreneurship",
  "Capacity Building",
  "Economic Development",
];

const locations = [
  "Poland",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Portugal",
  "Greece",
  "Croatia",
];

export default function SuperAdminCreateCallProjectPage() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const { token } = useSelector((s: RootState) => s.auth);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Organisation Selection
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<string>("");
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [isOrgInputFocused, setIsOrgInputFocused] = useState(false);

  // Type Selection (moved to Step 1)
  const [publishType, setPublishType] = useState<"call" | "project">("call");

  // Step 3: Basic Information
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishBudgetMin, setPublishBudgetMin] = useState<number | string>(0);
  const [publishBudgetMax, setPublishBudgetMax] = useState<number | string>(100000);
  const [publishCurrency, setPublishCurrency] = useState("EUR");
  const [publishDeadline, setPublishDeadline] = useState<Date | null>(null);
  const [publishLocation, setPublishLocation] = useState("");
  const [publishThematicAreas, setPublishThematicAreas] = useState<string[]>([]);
  const [publishExpertise, setPublishExpertise] = useState<string[]>([]);
  const [publishDuration, setPublishDuration] = useState("");
  const [publishMaxPartners, setPublishMaxPartners] = useState<number | string>("");
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string>("");
  const [thumbnailImagePreview, setThumbnailImagePreview] = useState<string>("");
  const [imageInputMethod, setImageInputMethod] = useState<"upload" | "link">("upload");
  const [imageLinkUrl, setImageLinkUrl] = useState("");

  // Call-specific fields
  const [callShortDescription, setCallShortDescription] = useState("");
  const [callType, setCallType] = useState("");
  const [callEligibleRegions, setCallEligibleRegions] = useState<string[]>([]);
  const [callOpeningDate, setCallOpeningDate] = useState<Date | null>(new Date());
  const [callEvaluationPeriod, setCallEvaluationPeriod] = useState("");
  const [callExpectedStartDate, setCallExpectedStartDate] = useState<Date | null>(null);
  const [callEligibilityCriteria, setCallEligibilityCriteria] = useState("");
  const [callNumberOfAwards, setCallNumberOfAwards] = useState<number | string>("");
  const [callApplicationLink, setCallApplicationLink] = useState("");
  const [callRequiredDocuments, setCallRequiredDocuments] = useState("");
  const [callContactName, setCallContactName] = useState("");
  const [callContactEmail, setCallContactEmail] = useState("");
  const [callContactPhone, setCallContactPhone] = useState("");
  const [callGuidelinePdfUrl, setCallGuidelinePdfUrl] = useState("");
  const [callFaqLink, setCallFaqLink] = useState("");
  const [callVisibility, setCallVisibility] = useState<"public" | "members">("public");

  // Project-specific fields
  const [projShortSummary, setProjShortSummary] = useState("");
  const [projCategory, setProjCategory] = useState("");
  const [projTags, setProjTags] = useState("");
  const [projStartDate, setProjStartDate] = useState<Date | null>(null);
  const [projEndDate, setProjEndDate] = useState<Date | null>(null);
  const [projOngoing, setProjOngoing] = useState(false);
  const [projStatus, setProjStatus] = useState<"planned" | "ongoing" | "completed">("planned");
  const [projPartnerNames, setProjPartnerNames] = useState("");
  const [projFundingSource, setProjFundingSource] = useState("");
  const [projBudgetVisibility, setProjBudgetVisibility] = useState<"public" | "private">("public");
  const [projOutcomes, setProjOutcomes] = useState("");
  const [projReportUrls, setProjReportUrls] = useState("");
  // Document uploads
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [projManagerName, setProjManagerName] = useState("");
  const [projManagerEmail, setProjManagerEmail] = useState("");
  const [projManagerPhone, setProjManagerPhone] = useState("");
  const [projWebsite, setProjWebsite] = useState("");
  const [projVisibility, setProjVisibility] = useState<"public" | "members">("public");

  // Fetch organisations with debounced search
  useEffect(() => {
    const fetchOrganisations = async () => {
      if (!token) return;
      
      // Only search if user has typed at least 3 characters, or if search is empty (show all)
      if (orgSearchTerm.trim().length > 0 && orgSearchTerm.trim().length < 3) {
        setOrganisations([]);
        return;
      }

      try {
        const params: any = { page: 1, limit: 100 };
        if (orgSearchTerm.trim().length >= 3) {
          params.searchTerm = orgSearchTerm.trim();
        }

        const response = await axios.get(`${API_BASE_URL}/super-admin/organisations`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setOrganisations(
            response.data.data.organisations.map((org: any) => ({
              id: org.id,
              name: org.name,
              logo: org.images?.logo || org.logo || "",
              country: org.profile?.country || org.country || "",
              missionFields: org.fields?.missionFields || [],
              description: org.description || "",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching organisations:", error);
      }
    };

    // Debounce the search - wait 300ms after user stops typing
    // If search is empty, fetch immediately
    const delay = orgSearchTerm.trim().length === 0 ? 0 : 300;
    const timeoutId = setTimeout(() => {
      fetchOrganisations();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [token, orgSearchTerm]);

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!token || !selectedOrganisationId) {
      notifications.show({
        title: "Error",
        message: "Please select an organisation first",
        color: "red",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("organisationId", selectedOrganisationId);

      const response = await axios.post(
        `${API_BASE_URL}/super-admin/upload-call-project-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setThumbnailImageUrl(response.data.data.url);
        setThumbnailImagePreview(response.data.data.url);
        notifications.show({
          title: "Success",
          message: "Image uploaded successfully",
          color: "green",
        });
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to upload image",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      handleImageUpload(file);
    }
  };

  const handleImageLinkChange = () => {
    if (imageLinkUrl.trim()) {
      setThumbnailImageUrl(imageLinkUrl.trim());
      setThumbnailImagePreview(imageLinkUrl.trim());
    }
  };

  // Document upload handler
  const handleDocumentUpload = async (files: FileWithPath[]) => {
    if (!token || !selectedOrganisationId) {
      notifications.show({
        title: "Error",
        message: "Please select an organisation first",
        color: "red",
      });
      return;
    }

    setUploadingDocuments(true);
    const uploadPromises = files.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("organisationId", selectedOrganisationId);

        const response = await axios.post(
          `${API_BASE_URL}/super-admin/upload-call-project-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          return {
            name: file.name,
            url: response.data.data.url,
            type: file.type || "application/octet-stream",
          };
        }
        throw new Error("Upload failed");
      } catch (error: any) {
        console.error("Document upload error:", error);
        notifications.show({
          title: "Error",
          message: `Failed to upload ${file.name}: ${error.response?.data?.error || error.message}`,
          color: "red",
        });
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((r) => r !== null) as Array<{
      name: string;
      url: string;
      type: string;
    }>;
    setUploadedDocuments((prev) => [...prev, ...successfulUploads]);
    setUploadingDocuments(false);

    if (successfulUploads.length > 0) {
      notifications.show({
        title: "Success",
        message: `Successfully uploaded ${successfulUploads.length} document(s)`,
        color: "green",
      });
    }
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper function to convert date to ISO string
  const dateToISOString = (date: any): string => {
    if (!date) return "";
    // If it's already a Date object
    if (date instanceof Date) {
      return date.toISOString();
    }
    // If it's a dayjs object (from @mantine/dates)
    if (date && typeof date.toDate === "function") {
      return date.toDate().toISOString();
    }
    // If it's a string, try to parse it
    if (typeof date === "string") {
      return new Date(date).toISOString();
    }
    // If it has _seconds (Firestore timestamp)
    if (date && date._seconds) {
      return new Date(date._seconds * 1000).toISOString();
    }
    // Fallback: try to create a Date from it
    try {
      return new Date(date).toISOString();
    } catch {
      return "";
    }
  };

  // Validation
  const canProceedToStep2 = selectedOrganisationId !== "" && (publishType === "call" || publishType === "project");
  const canSubmit = () => {
    if (!selectedOrganisationId || !publishTitle.trim() || !publishDescription.trim()) {
      return false;
    }
    if (!publishDeadline || !publishLocation.trim() || publishThematicAreas.length === 0) {
      return false;
    }
    // Budget validation
    const minBudget = Number(publishBudgetMin);
    const maxBudget = Number(publishBudgetMax);
    if (!publishCurrency || minBudget < 0 || maxBudget < 0 || minBudget > maxBudget) {
      return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!canSubmit() || !token) {
      notifications.show({
        title: "Error",
        message: "Please fill in all required fields",
        color: "red",
      });
      return;
    }

    setLoading(true);
    try {
      // Use uploaded image URL or link URL
      const finalImageUrl = thumbnailImageUrl || imageLinkUrl.trim() || undefined;

      const payload: any = {
        organisationId: selectedOrganisationId,
        type: publishType,
        title: publishTitle.trim(),
        description: publishDescription.trim(),
        budget: {
          min: Number(publishBudgetMin) || 0,
          max: Number(publishBudgetMax) || 0,
          currency: publishCurrency,
        },
        deadline: dateToISOString(publishDeadline),
        location: publishLocation.trim(),
        thematicAreas: publishThematicAreas,
        requiredExpertise: publishExpertise,
        projectDuration: publishDuration || undefined,
        maxPartners: publishMaxPartners ? Number(publishMaxPartners) : undefined,
        status: "active",
        visibility: publishType === "call" ? callVisibility : projVisibility,
        thumbnailImageUrl: finalImageUrl,
      };

      // Add call-specific fields
      if (publishType === "call") {
        if (callShortDescription) payload.shortDescription = callShortDescription;
        if (callType) payload.callType = callType;
        if (callEligibleRegions.length > 0) payload.eligibleRegions = callEligibleRegions;
        if (callOpeningDate) payload.openingDate = dateToISOString(callOpeningDate);
        if (callEvaluationPeriod) payload.evaluationPeriod = callEvaluationPeriod;
        if (callExpectedStartDate) payload.expectedStartDate = dateToISOString(callExpectedStartDate);
        if (callEligibilityCriteria) payload.eligibilityCriteria = callEligibilityCriteria;
        if (callNumberOfAwards) payload.numberOfAwards = Number(callNumberOfAwards);
        if (callApplicationLink) payload.applicationLink = callApplicationLink;
        if (callRequiredDocuments) {
          payload.requiredDocuments = callRequiredDocuments
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (callContactName || callContactEmail || callContactPhone) {
          payload.contact = {
            name: callContactName || undefined,
            email: callContactEmail || undefined,
            phone: callContactPhone || undefined,
          };
        }
        if (callGuidelinePdfUrl) payload.guidelinePdfUrl = callGuidelinePdfUrl;
        if (callFaqLink) payload.faqLink = callFaqLink;
        if (uploadedDocuments.length > 0) {
          payload.documents = uploadedDocuments.map(doc => ({
            name: doc.name,
            url: doc.url,
            type: doc.type
          }));
        }
      }

      // Add project-specific fields
      if (publishType === "project") {
        if (projShortSummary) payload.shortSummary = projShortSummary;
        if (projCategory) payload.category = projCategory;
        if (projTags) {
          payload.tags = projTags.split(",").map((t) => t.trim()).filter(Boolean);
        }
        if (projStartDate) payload.startDate = dateToISOString(projStartDate);
        if (projEndDate && !projOngoing) payload.endDate = dateToISOString(projEndDate);
        if (projOngoing !== undefined) payload.ongoing = projOngoing;
        if (projStatus) payload.projectStatus = projStatus;
        const selectedOrg = organisations.find((o) => o.id === selectedOrganisationId);
        if (selectedOrg) {
          payload.leadOrganisationId = selectedOrganisationId;
          payload.leadOrganisationName = selectedOrg.name;
        }
        if (projPartnerNames) {
          payload.partnerOrganisationNames = projPartnerNames
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (projFundingSource) payload.fundingSource = projFundingSource;
        if (projBudgetVisibility) payload.budgetVisibility = projBudgetVisibility;
        if (projOutcomes) payload.outcomes = projOutcomes;
        if (uploadedDocuments.length > 0) {
          payload.documents = uploadedDocuments.map(doc => ({
            name: doc.name,
            url: doc.url,
            type: doc.type
          }));
        }
        if (projReportUrls) {
          payload.reportUrls = projReportUrls
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (projManagerName || projManagerEmail || projManagerPhone) {
          payload.projectManager = {
            name: projManagerName || undefined,
            email: projManagerEmail || undefined,
            phone: projManagerPhone || undefined,
          };
        }
        if (projWebsite) payload.website = projWebsite;
      }

      const response = await axios.post(
        `${API_BASE_URL}/super-admin/calls-projects`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        notifications.show({
          title: "Success",
          message: `${publishType === "call" ? "Call" : "Project"} created successfully`,
          color: "green",
        });
        navigate("/super-admin/calls-projects");
      }
    } catch (error: any) {
      console.error("Failed to create call/project:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to create call/project";
      console.error("Full error response:", error.response?.data);
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminDashboardLayout>
      <Box style={{ position: "relative", minHeight: "calc(100vh - 60px)", paddingTop: "54px" }}>
        <LoadingOverlay visible={loading} />
        
        <Container size="xl">
          {/* Header */}
          <Group mb="xl">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate("/super-admin/calls-projects")}
            >
              Back
            </Button>
            <Box style={{ flex: 1 }}>
              <Title order={1} size="2.5rem" c={theme.colors.brand[7]}>
                Create New {publishType === "call" ? "Call" : "Project"}
              </Title>
              <Text size="lg" c="dimmed" mt="xs">
                Follow the steps below to create a new {publishType === "call" ? "call" : "project"}
              </Text>
            </Box>
          </Group>

          {/* Stepper */}
          <Card shadow="sm" padding="xl" radius="md" withBorder mb="xl">
            <Stepper
              active={activeStep}
              onStepClick={setActiveStep}
              allowNextStepsSelect={false}
            >
              <Stepper.Step
                label="Select Organisation & Type"
                description="Choose organisation and type"
                icon={<IconBuilding size={18} />}
              >
                <Stack gap="xl" mt="xl">
                  {/* Organisation Selection */}
                  <Box style={{ position: "relative" }}>
                    <TextInput
                      label="Search Organisation"
                      placeholder="Type to search organisations..."
                      value={orgSearchTerm}
                      onChange={(e) => setOrgSearchTerm(e.currentTarget.value)}
                      onFocus={() => setIsOrgInputFocused(true)}
                      onBlur={() => setTimeout(() => setIsOrgInputFocused(false), 200)}
                      leftSection={<IconBuilding size={16} />}
                    />
                    
                    {/* Dropdown - appears when focused and has results */}
                    {isOrgInputFocused && organisations.length > 0 && (
                      <Paper
                        withBorder
                        shadow="md"
                        p="md"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          maxHeight: 400,
                          overflowY: "auto",
                          marginTop: 8,
                          backgroundColor: "white",
                        }}
                      >
                        <Stack gap="xs">
                          {organisations.map((org) => (
                            <Card
                              key={org.id}
                              padding="md"
                              withBorder
                              style={{
                                cursor: "pointer",
                                borderColor:
                                  selectedOrganisationId === org.id
                                    ? theme.colors.brand[7]
                                    : theme.colors.gray[3],
                                backgroundColor:
                                  selectedOrganisationId === org.id
                                    ? `${theme.colors.brand[7]}15`
                                    : "white",
                              }}
                              onClick={() => {
                                setSelectedOrganisationId(org.id);
                                setOrgSearchTerm(org.name);
                                setIsOrgInputFocused(false);
                              }}
                            >
                              <Group justify="space-between" wrap="nowrap">
                                <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
                                  <Avatar
                                    src={org.logo}
                                    alt={org.name}
                                    size={48}
                                    radius="md"
                                    color={selectedOrganisationId === org.id ? theme.colors.brand[7] : "gray"}
                                  >
                                    {!org.logo && (
                                      <IconBuilding
                                        size={24}
                                        color={
                                          selectedOrganisationId === org.id
                                            ? "white"
                                            : theme.colors.gray[6]
                                        }
                                      />
                                    )}
                                  </Avatar>
                                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                      fw={selectedOrganisationId === org.id ? 600 : 500}
                                      size="sm"
                                      lineClamp={1}
                                    >
                                      {org.name}
                                    </Text>
                                    {(org.country || (org.missionFields && org.missionFields.length > 0)) && (
                                      <Group gap="xs" wrap="nowrap">
                                        {org.country && (
                                          <Text size="xs" c="dimmed" lineClamp={1}>
                                            {org.country}
                                          </Text>
                                        )}
                                        {org.country && org.missionFields && org.missionFields.length > 0 && (
                                          <Text size="xs" c="dimmed">•</Text>
                                        )}
                                        {org.missionFields && org.missionFields.length > 0 && (
                                          <Text size="xs" c="dimmed" lineClamp={1}>
                                            {org.missionFields.slice(0, 2).join(", ")}
                                          </Text>
                                        )}
                                      </Group>
                                    )}
                                  </Stack>
                                </Group>
                                {selectedOrganisationId === org.id && (
                                  <IconCheck size={20} color={theme.colors.brand[7]} />
                                )}
                              </Group>
                            </Card>
                          ))}
                        </Stack>
                      </Paper>
                    )}
                    
                    {/* Empty state message */}
                    {isOrgInputFocused && organisations.length === 0 && orgSearchTerm.trim().length >= 3 && (
                      <Paper
                        withBorder
                        shadow="md"
                        p="md"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          marginTop: 8,
                          backgroundColor: "white",
                        }}
                      >
                        <Text c="dimmed" ta="center" py="md">
                          No organisations found
                        </Text>
                      </Paper>
                    )}
                    
                    {isOrgInputFocused && orgSearchTerm.trim().length > 0 && orgSearchTerm.trim().length < 3 && (
                      <Paper
                        withBorder
                        shadow="md"
                        p="md"
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          marginTop: 8,
                          backgroundColor: "white",
                        }}
                      >
                        <Text c="dimmed" ta="center" py="md">
                          Type at least 3 characters to search
                        </Text>
                      </Paper>
                    )}
                  </Box>

                  {/* Selected Organisation Display */}
                  {selectedOrganisationId && (
                    <Card withBorder p="md" style={{ backgroundColor: `${theme.colors.brand[7]}10` }}>
                      <Group gap="md">
                        <Avatar
                          src={organisations.find((o) => o.id === selectedOrganisationId)?.logo}
                          size={56}
                          radius="md"
                          color={theme.colors.brand[7]}
                        >
                          <IconBuilding size={28} />
                        </Avatar>
                        <Stack gap={4} style={{ flex: 1 }}>
                          <Text fw={600} size="lg">
                            {organisations.find((o) => o.id === selectedOrganisationId)?.name}
                          </Text>
                          {organisations.find((o) => o.id === selectedOrganisationId)?.country && (
                            <Text size="sm" c="dimmed">
                              {organisations.find((o) => o.id === selectedOrganisationId)?.country}
                            </Text>
                          )}
                        </Stack>
                        <Button
                          variant="subtle"
                          color="blue"
                          size="xs"
                          onClick={() => {
                            setSelectedOrganisationId("");
                            setOrgSearchTerm("");
                          }}
                        >
                          Change
                        </Button>
                      </Group>
                    </Card>
                  )}

                  {/* Call/Project Selection Buttons */}
                  <Box>
                    <Text size="lg" fw={500} mb="md" ta="center">
                      What would you like to create?
                    </Text>
                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <Card
                          padding="xl"
                          withBorder
                          radius="md"
                          style={{
                            cursor: "pointer",
                            borderColor: publishType === "call" ? theme.colors.brand[7] : theme.colors.gray[3],
                            borderWidth: publishType === "call" ? 3 : 1,
                            backgroundColor: publishType === "call" ? `${theme.colors.brand[7]}10` : "white",
                            transition: "all 0.2s ease",
                            height: "100%",
                          }}
                          onClick={() => setPublishType("call")}
                        >
                          <Stack align="center" gap="md">
                            <Box
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                backgroundColor: publishType === "call" ? theme.colors.brand[7] : theme.colors.gray[2],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <IconBuilding size={40} color={publishType === "call" ? "white" : theme.colors.gray[6]} />
                            </Box>
                            <Text fw={700} size="xl" c={publishType === "call" ? theme.colors.brand[7] : "dark"}>
                              Call for Proposals
                            </Text>
                            <Text size="sm" c="dimmed" ta="center">
                              Invite organisations to apply for funding, partnerships, or collaboration opportunities
                            </Text>
                          </Stack>
                        </Card>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Card
                          padding="xl"
                          withBorder
                          radius="md"
                          style={{
                            cursor: "pointer",
                            borderColor: publishType === "project" ? theme.colors.brand[7] : theme.colors.gray[3],
                            borderWidth: publishType === "project" ? 3 : 1,
                            backgroundColor: publishType === "project" ? `${theme.colors.brand[7]}10` : "white",
                            transition: "all 0.2s ease",
                            height: "100%",
                          }}
                          onClick={() => setPublishType("project")}
                        >
                          <Stack align="center" gap="md">
                            <Box
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                backgroundColor: publishType === "project" ? theme.colors.brand[7] : theme.colors.gray[2],
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <IconPhoto size={40} color={publishType === "project" ? "white" : theme.colors.gray[6]} />
                            </Box>
                            <Text fw={700} size="xl" c={publishType === "project" ? theme.colors.brand[7] : "dark"}>
                              Project
                            </Text>
                            <Text size="sm" c="dimmed" ta="center">
                              Showcase ongoing or completed work, achievements, and outcomes
                            </Text>
                          </Stack>
                        </Card>
                      </Grid.Col>
                    </Grid>
                  </Box>
                </Stack>
              </Stepper.Step>

              <Stepper.Step
                label="Details"
                description="Fill in all information"
                icon={<IconCheck size={18} />}
              >
                <Stack gap="xl" mt="xl">
                  {/* Thumbnail Image */}
                  <Box>
                    <Text size="sm" fw={500} mb="xs">
                      Thumbnail Image
                    </Text>
                    <Tabs value={imageInputMethod} onChange={(v) => setImageInputMethod(v as any)}>
                      <Tabs.List>
                        <Tabs.Tab value="upload" leftSection={<IconUpload size={16} />}>
                          Upload
                        </Tabs.Tab>
                        <Tabs.Tab value="link" leftSection={<IconLink size={16} />}>
                          Link
                        </Tabs.Tab>
                      </Tabs.List>

                      <Tabs.Panel value="upload" pt="md">
                        {thumbnailImagePreview ? (
                          <Box style={{ position: "relative", display: "inline-block" }}>
                            <Image
                              src={thumbnailImagePreview}
                              alt="Thumbnail preview"
                              width={200}
                              height={200}
                              fit="cover"
                              radius="md"
                            />
                            <ActionIcon
                              color="blue"
                              variant="filled"
                              size="sm"
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                              }}
                              onClick={() => {
                                setThumbnailImagePreview("");
                                setThumbnailImageUrl("");
                                setImageLinkUrl("");
                              }}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Box>
                        ) : (
                          <Dropzone
                            onDrop={handleImageFileSelect}
                            accept={IMAGE_MIME_TYPE}
                            loading={loading}
                            maxSize={5 * 1024 * 1024}
                          >
                            <Group
                              justify="center"
                              gap="xl"
                              mih={220}
                              style={{ pointerEvents: "none" }}
                            >
                              <Dropzone.Accept>
                                <IconUpload size={52} color={theme.colors.blue[6]} />
                              </Dropzone.Accept>
                              <Dropzone.Reject>
                                <IconX size={52} color={theme.colors.red[6]} />
                              </Dropzone.Reject>
                              <Dropzone.Idle>
                                <IconPhoto size={52} color={theme.colors.gray[6]} />
                              </Dropzone.Idle>

                              <div>
                                <Text size="xl" inline>
                                  Drag image here or click to select
                                </Text>
                                <Text size="sm" c="dimmed" inline mt={7}>
                                  Upload a thumbnail image (max 5MB)
                                </Text>
                              </div>
                            </Group>
                          </Dropzone>
                        )}
                      </Tabs.Panel>

                      <Tabs.Panel value="link" pt="md">
                        <Group>
                          <TextInput
                            placeholder="https://example.com/image.jpg"
                            value={imageLinkUrl}
                            onChange={(e) => setImageLinkUrl(e.currentTarget.value)}
                            style={{ flex: 1 }}
                          />
                          <Button onClick={handleImageLinkChange}>Set Image</Button>
                        </Group>
                        {thumbnailImagePreview && (
                          <Box mt="md">
                            <Image
                              src={thumbnailImagePreview}
                              alt="Thumbnail preview"
                              width={200}
                              height={200}
                              fit="cover"
                              radius="md"
                            />
                          </Box>
                        )}
                      </Tabs.Panel>
                    </Tabs>
                  </Box>

                  <Divider />

                  {/* Basic Information */}
                  <Box>
                    <Title order={3} size="h4" mb="md" c={theme.colors.brand[7]}>
                      Basic Information
                    </Title>
                    <Stack gap="md">
                      <TextInput
                        label="Title"
                        placeholder="Enter the title"
                        value={publishTitle}
                        onChange={(e) => setPublishTitle(e.currentTarget.value)}
                        required
                      />
                      <Textarea
                        label="Description"
                        placeholder="Describe in detail"
                        minRows={8}
                        value={publishDescription}
                        onChange={(e) => setPublishDescription(e.currentTarget.value)}
                        required
                      />
                      <Grid>
                        <Grid.Col span={6}>
                          <NumberInput
                            label="Min Budget (EUR)"
                            placeholder="0"
                            min={0}
                            value={publishBudgetMin}
                            onChange={setPublishBudgetMin}
                            required
                          />
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <NumberInput
                            label="Max Budget (EUR)"
                            placeholder="100000"
                            min={0}
                            value={publishBudgetMax}
                            onChange={setPublishBudgetMax}
                            required
                          />
                        </Grid.Col>
                      </Grid>
                      <Select
                        label="Currency"
                        data={["EUR", "USD", "GBP"].map((c) => ({ value: c, label: c }))}
                        value={publishCurrency}
                        onChange={(v) => setPublishCurrency(v || "EUR")}
                        required
                      />
                      <DateInput
                        label="Deadline"
                        placeholder="Select deadline"
                        value={publishDeadline as any}
                        onChange={(v) => setPublishDeadline(v ? (v as any) : null)}
                        required
                      />
                      <TextInput
                        label="Location"
                        placeholder="e.g., Poland, Germany, France"
                        value={publishLocation}
                        onChange={(e) => setPublishLocation(e.currentTarget.value)}
                        required
                      />
                      <MultiSelect
                        label="Thematic Areas"
                        placeholder="Select thematic areas"
                        data={thematicAreasOptions}
                        value={publishThematicAreas}
                        onChange={setPublishThematicAreas}
                        required
                      />
                      <MultiSelect
                        label="Required Expertise"
                        placeholder="Select required expertise"
                        data={expertiseOptions}
                        value={publishExpertise}
                        onChange={setPublishExpertise}
                      />
                      <Select
                        label="Project Duration"
                        placeholder="Select duration"
                        data={[
                          "3 months",
                          "6 months",
                          "9 months",
                          "12 months",
                          "18 months",
                          "24 months",
                          "36 months",
                        ]}
                        value={publishDuration}
                        onChange={(v) => setPublishDuration(v || "")}
                      />
                      <NumberInput
                        label="Max Partners"
                        placeholder="e.g., 5"
                        min={1}
                        value={publishMaxPartners}
                        onChange={setPublishMaxPartners}
                      />
                    </Stack>
                  </Box>

                  {/* Call-specific or Project-specific fields */}
                  {publishType === "call" ? (
                    <Box>
                      <Title order={3} size="h4" mb="md" c={theme.colors.brand[7]}>
                        Call Details
                      </Title>
                      <Stack gap="md">
                        <TextInput
                          label="Short Description"
                          placeholder="1–2 sentence summary"
                          value={callShortDescription}
                          onChange={(e) => setCallShortDescription(e.currentTarget.value)}
                        />
                        <Select
                          label="Type of Call"
                          placeholder="Select call type"
                          data={[
                            "Grant",
                            "Partnership",
                            "Research Collaboration",
                            "Contest",
                          ].map((x) => ({ value: x, label: x }))}
                          value={callType}
                          onChange={(v) => setCallType(v || "")}
                        />
                        <MultiSelect
                          label="Eligible Countries / Regions"
                          placeholder="Select regions"
                          data={locations}
                          value={callEligibleRegions}
                          onChange={setCallEligibleRegions}
                          clearable
                        />
                        <Grid>
                          <Grid.Col span={6}>
                            <DateInput
                              label="Opening Date"
                              value={callOpeningDate as any}
                              onChange={(v) => setCallOpeningDate(v ? (v as any) : null)}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <DateInput
                              label="Expected Award/Start Date"
                              value={callExpectedStartDate as any}
                              onChange={(v) => setCallExpectedStartDate(v ? (v as any) : null)}
                            />
                          </Grid.Col>
                        </Grid>
                        <TextInput
                          label="Evaluation Period"
                          placeholder="e.g., 4 weeks"
                          value={callEvaluationPeriod}
                          onChange={(e) => setCallEvaluationPeriod(e.currentTarget.value)}
                        />
                        <Textarea
                          label="Eligibility Criteria"
                          placeholder="Who can apply?"
                          minRows={4}
                          value={callEligibilityCriteria}
                          onChange={(e) => setCallEligibilityCriteria(e.currentTarget.value)}
                        />
                        <Grid>
                          <Grid.Col span={6}>
                            <NumberInput
                              label="Number of Awards"
                              min={1}
                              value={callNumberOfAwards}
                              onChange={setCallNumberOfAwards}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <TextInput
                              label="Application Link / Portal"
                              placeholder="https://…"
                              value={callApplicationLink}
                              onChange={(e) => setCallApplicationLink(e.currentTarget.value)}
                            />
                          </Grid.Col>
                        </Grid>
                        <Textarea
                          label="Required Documents"
                          placeholder="One per line (e.g., Proposal.pdf)"
                          minRows={3}
                          value={callRequiredDocuments}
                          onChange={(e) => setCallRequiredDocuments(e.currentTarget.value)}
                        />
                        <Grid>
                          <Grid.Col span={4}>
                            <TextInput
                              label="Contact Person"
                              value={callContactName}
                              onChange={(e) => setCallContactName(e.currentTarget.value)}
                            />
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <TextInput
                              label="Contact Email"
                              value={callContactEmail}
                              onChange={(e) => setCallContactEmail(e.currentTarget.value)}
                            />
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <TextInput
                              label="Contact Phone"
                              value={callContactPhone}
                              onChange={(e) => setCallContactPhone(e.currentTarget.value)}
                            />
                          </Grid.Col>
                        </Grid>
                        <Grid>
                          <Grid.Col span={6}>
                            <TextInput
                              label="Guideline PDF URL"
                              value={callGuidelinePdfUrl}
                              onChange={(e) => setCallGuidelinePdfUrl(e.currentTarget.value)}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <TextInput
                              label="FAQ Link"
                              value={callFaqLink}
                              onChange={(e) => setCallFaqLink(e.currentTarget.value)}
                            />
                          </Grid.Col>
                        </Grid>
                        {/* Document Upload Section */}
                        <Box>
                          <Text size="sm" fw={500} mb="xs">
                            Documents (PDF, Word, Images)
                          </Text>
                          <Dropzone
                            onDrop={handleDocumentUpload}
                            accept={[
                              "application/pdf",
                              "application/msword",
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                              "image/jpeg",
                              "image/png",
                              "image/gif",
                            ]}
                            multiple
                            loading={uploadingDocuments}
                          >
                            <Group justify="center" gap="xl" style={{ minHeight: 100, pointerEvents: "none" }}>
                              <Dropzone.Accept>
                                <IconUpload size={52} stroke={1.5} />
                              </Dropzone.Accept>
                              <Dropzone.Reject>
                                <IconX size={52} stroke={1.5} />
                              </Dropzone.Reject>
                              <Dropzone.Idle>
                                <IconUpload size={52} stroke={1.5} />
                              </Dropzone.Idle>
                              <div>
                                <Text size="xl" inline>
                                  Drag documents here or click to select
                                </Text>
                                <Text size="sm" c="dimmed" inline mt={7}>
                                  PDF, Word documents, or images
                                </Text>
                              </div>
                            </Group>
                          </Dropzone>
                          {uploadedDocuments.length > 0 && (
                            <Stack gap="xs" mt="md">
                              {uploadedDocuments.map((doc, index) => (
                                <Group key={index} justify="space-between" p="xs" style={{ border: "1px solid #dee2e6", borderRadius: 4 }}>
                                  <Group gap="xs">
                                    <IconLink size={16} />
                                    <Text size="sm">{doc.name}</Text>
                                  </Group>
                                  <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() => removeDocument(index)}
                                  >
                                    <IconX size={16} />
                                  </ActionIcon>
                                </Group>
                              ))}
                            </Stack>
                          )}
                        </Box>
                        <Select
                          label="Visibility"
                          data={[
                            { value: "public", label: "Public" },
                            { value: "members", label: "Members only" },
                          ]}
                          value={callVisibility}
                          onChange={(v: string | null) => setCallVisibility((v || "public") as "public" | "members")}
                        />
                      </Stack>
                    </Box>
                  ) : (
                    <Box>
                      <Title order={3} size="h4" mb="md" c={theme.colors.brand[7]}>
                        Project Details
                      </Title>
                      <Stack gap="md">
                        <Textarea
                          label="Short Summary"
                          placeholder="1–2 sentence summary"
                          minRows={3}
                          value={projShortSummary}
                          onChange={(e) => setProjShortSummary(e.currentTarget.value)}
                        />
                        <Select
                          label="Project Category"
                          placeholder="Select category"
                          data={[
                            "Research",
                            "Community Development",
                            "Technology",
                            "Education",
                            "Health",
                          ].map((x) => ({ value: x, label: x }))}
                          value={projCategory}
                          onChange={(v) => setProjCategory(v || "")}
                        />
                        <TextInput
                          label="Tags"
                          placeholder="Comma separated (e.g., youth, STEM, inclusion)"
                          value={projTags}
                          onChange={(e) => setProjTags(e.currentTarget.value)}
                        />
                        <Grid>
                          <Grid.Col span={6}>
                            <DateInput
                              label="Start Date"
                              value={projStartDate as any}
                              onChange={(v) => setProjStartDate(v ? (v as any) : null)}
                            />
                          </Grid.Col>
                          <Grid.Col span={6}>
                            <DateInput
                              label="End Date"
                              value={projEndDate as any}
                              onChange={(v) => setProjEndDate(v ? (v as any) : null)}
                              disabled={projOngoing}
                            />
                          </Grid.Col>
                        </Grid>
                        <Checkbox
                          label="Ongoing"
                          checked={projOngoing}
                          onChange={(e) => setProjOngoing(e.currentTarget.checked)}
                        />
                        <Select
                          label="Status"
                          data={[
                            { value: "planned", label: "Planned" },
                            { value: "ongoing", label: "Ongoing" },
                            { value: "completed", label: "Completed" },
                          ]}
                          value={projStatus}
                          onChange={(v) => setProjStatus(((v as any) || "planned") as any)}
                        />
                        <TextInput
                          label="Funding Source"
                          value={projFundingSource}
                          onChange={(e) => setProjFundingSource(e.currentTarget.value)}
                        />
                        <Select
                          label="Budget Visibility"
                          data={[
                            { value: "public", label: "Public" },
                            { value: "private", label: "Private" },
                          ]}
                        value={projBudgetVisibility}
                        onChange={(v: string | null) => setProjBudgetVisibility((v || "public") as "public" | "private")}
                        />
                        <Textarea
                          label="Partner Organisations"
                          placeholder="One per line"
                          minRows={3}
                          value={projPartnerNames}
                          onChange={(e) => setProjPartnerNames(e.currentTarget.value)}
                        />
                        <Textarea
                          label="Key Achievements / Outcomes"
                          minRows={4}
                          value={projOutcomes}
                          onChange={(e) => setProjOutcomes(e.currentTarget.value)}
                        />
                        <TextInput
                          label="Website / External Link"
                          placeholder="https://…"
                          value={projWebsite}
                          onChange={(e) => setProjWebsite(e.currentTarget.value)}
                        />
                        {/* Document Upload Section */}
                        <Box>
                          <Text size="sm" fw={500} mb="xs">
                            Documents (PDF, Word, Images)
                          </Text>
                          <Dropzone
                            onDrop={handleDocumentUpload}
                            accept={[
                              "application/pdf",
                              "application/msword",
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                              "image/jpeg",
                              "image/png",
                              "image/gif",
                            ]}
                            multiple
                            loading={uploadingDocuments}
                          >
                            <Group justify="center" gap="xl" style={{ minHeight: 100, pointerEvents: "none" }}>
                              <Dropzone.Accept>
                                <IconUpload size={52} stroke={1.5} />
                              </Dropzone.Accept>
                              <Dropzone.Reject>
                                <IconX size={52} stroke={1.5} />
                              </Dropzone.Reject>
                              <Dropzone.Idle>
                                <IconUpload size={52} stroke={1.5} />
                              </Dropzone.Idle>
                              <div>
                                <Text size="xl" inline>
                                  Drag documents here or click to select
                                </Text>
                                <Text size="sm" c="dimmed" inline mt={7}>
                                  PDF, Word documents, or images
                                </Text>
                              </div>
                            </Group>
                          </Dropzone>
                          {uploadedDocuments.length > 0 && (
                            <Stack gap="xs" mt="md">
                              {uploadedDocuments.map((doc, index) => (
                                <Group key={index} justify="space-between" p="xs" style={{ border: "1px solid #dee2e6", borderRadius: 4 }}>
                                  <Group gap="xs">
                                    <IconLink size={16} />
                                    <Text size="sm">{doc.name}</Text>
                                  </Group>
                                  <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() => removeDocument(index)}
                                  >
                                    <IconX size={16} />
                                  </ActionIcon>
                                </Group>
                              ))}
                            </Stack>
                          )}
                        </Box>
                        <Textarea
                          label="Report URLs"
                          placeholder="One per line"
                          minRows={3}
                          value={projReportUrls}
                          onChange={(e) => setProjReportUrls(e.currentTarget.value)}
                        />
                        <Grid>
                          <Grid.Col span={4}>
                            <TextInput
                              label="Project Manager"
                              value={projManagerName}
                              onChange={(e) => setProjManagerName(e.currentTarget.value)}
                            />
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <TextInput
                              label="Manager Email"
                              value={projManagerEmail}
                              onChange={(e) => setProjManagerEmail(e.currentTarget.value)}
                            />
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <TextInput
                              label="Manager Phone"
                              value={projManagerPhone}
                              onChange={(e) => setProjManagerPhone(e.currentTarget.value)}
                            />
                          </Grid.Col>
                        </Grid>
                        <Select
                          label="Visibility"
                          data={[
                            { value: "public", label: "Public" },
                            { value: "members", label: "Members only" },
                          ]}
                        value={projVisibility}
                        onChange={(v: string | null) => setProjVisibility((v || "public") as "public" | "members")}
                        />
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Stepper.Step>
            </Stepper>

            {/* Navigation Buttons */}
            <Group justify="space-between" mt="xl">
              <Button
                variant="subtle"
                onClick={() => {
                  if (activeStep > 0) {
                    setActiveStep(activeStep - 1);
                  } else {
                    navigate("/super-admin/calls-projects");
                  }
                }}
              >
                {activeStep === 0 ? "Cancel" : "Back"}
              </Button>
              {activeStep < 1 ? (
                <Button
                  onClick={() => {
                    if (activeStep === 0 && canProceedToStep2) {
                      setActiveStep(1);
                    }
                  }}
                  disabled={!canProceedToStep2}
                >
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canSubmit()} loading={loading}>
                  Create {publishType === "call" ? "Call" : "Project"}
                </Button>
              )}
            </Group>
          </Card>
        </Container>
      </Box>
    </SuperAdminDashboardLayout>
  );
}

