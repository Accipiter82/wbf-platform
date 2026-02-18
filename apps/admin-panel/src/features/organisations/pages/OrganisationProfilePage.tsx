import React, { useEffect, useRef } from "react";
import {
  Container,
  Box,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Image,
  Avatar,
  Divider,
  Card,
  Chip,
  ActionIcon,
  Tooltip,
  TextInput,
  Textarea,
  Accordion,
  Modal,
  rem,
  LoadingOverlay,
} from "@mantine/core";

import { useMediaQuery } from "@mantine/hooks";
import {
  IconArrowLeft,
  IconBuilding,
  IconWorld,
  IconUsers,
  IconBriefcase,
  IconMapPin,
  IconLink,
  IconChevronRight,
  IconMessage,
  IconCalendar,
  IconChevronDown,
  IconFileTypePdf,
  IconFileDescription,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconX,
  IconPlus,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../../store";
import { fetchOrganisation } from "../../../store/slices/organisationSlice";
import { messagingService } from "../../../services/messagingService";
import { notifications } from "@mantine/notifications";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { Accordion as MantineAccordion } from "@mantine/core";

// Call type matching backend structure
interface Call {
  id: string;
  title: string;
  description: string;
  organisation?: {
    id: string;
    name: string;
    logo?: string;
  };
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  deadline: string | { _seconds: number; _nanoseconds?: number } | Date;
  location?: string;
  thematicAreas?: string[];
  requiredExpertise?: string[];
  projectDuration?: string;
  maxPartners?: number;
  status?: "active" | "closed" | "draft";
  createdAt?: string | { _seconds: number; _nanoseconds?: number } | Date;
  applicationsCount?: number;
}

function formatSocialLinks(socialMedia: string[] = []) {
  return socialMedia.map((entry) => {
    const [label, url] = entry.split("|");
    return { label: label || url, url: url || label };
  });
}

function formatBudget(budget: Call["budget"]): string {
  if (!budget) return "-";
  return `${budget.min?.toLocaleString?.() || 0} - ${budget.max?.toLocaleString?.() || 0} ${budget.currency || ""}`;
}

function formatDeadline(deadline: string | { _seconds: number; _nanoseconds?: number } | Date | undefined): string {
  if (!deadline) return "-";
  
  let date: Date;
  if (typeof deadline === "string") {
    date = new Date(deadline);
  } else if (deadline instanceof Date) {
    date = deadline;
  } else if (deadline._seconds) {
    date = new Date(deadline._seconds * 1000);
  } else {
    return "-";
  }
  
  if (isNaN(date.getTime())) return "-";
  
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Deadline passed";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `${diffDays} days left`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`;
  return `${Math.ceil(diffDays / 30)} months left`;
}

function isCallActive(call: Call): boolean {
  // First check if deadline has passed - if so, it's always past regardless of status
  if (call.deadline) {
    let deadlineDate: Date;
    if (typeof call.deadline === "string") {
      deadlineDate = new Date(call.deadline);
    } else if (call.deadline instanceof Date) {
      deadlineDate = call.deadline;
    } else if ((call.deadline as any)._seconds) {
      deadlineDate = new Date((call.deadline as any)._seconds * 1000);
    } else {
      // Invalid deadline format, check status instead
      if (call.status === "closed" || call.status === "draft") return false;
      return call.status === "active";
    }
    
    if (!isNaN(deadlineDate.getTime())) {
      const now = new Date();
      // If deadline has passed, it's not active
      if (deadlineDate <= now) {
        return false;
      }
      // Deadline hasn't passed, check status
      if (call.status === "closed" || call.status === "draft") return false;
      return call.status === "active" || !call.status;
    }
  }
  
  // No deadline, check status
  if (call.status === "closed" || call.status === "draft") return false;
  return call.status === "active";
}

export default function OrganisationProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isSuperAdminView = searchParams.get("superAdmin") === "true";
  const { organisations, currentOrganisation, isLoading } = useSelector(
    (state: RootState) => state.organisation
  );
  const { organisation: loggedOrg, admin } = useSelector(
    (state: RootState) => state.auth
  );
  
  // Determine which layout to use - no layout wrapper for super admin view
  // If superAdmin query param is present, hide layout (even if admin state isn't set yet)
  const isSuperAdminPreview = isSuperAdminView;
  const backPath = isSuperAdminView ? "/super-admin/organisations" : -1;
  const scrollRef = useRef(null);
  const [modalCall, setModalCall] = React.useState<Call | null>(null);

  const [applyFiles, setApplyFiles] = React.useState<File[]>([]);
  const [contactMessage, setContactMessage] = React.useState("");
  const [applyMessage, setApplyMessage] = React.useState("");
  const [accordionOpen, setAccordionOpen] = React.useState<string[]>([]);
  const [contactFormSent, setContactFormSent] = React.useState(false);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const { token } = useSelector((state: RootState) => state.auth);

  // Load favorite status on mount
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      try {
        const response = await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api'}/organisation/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          const favIds = data.data.organisations.map((org: any) => org.id);
          setIsFavorite(favIds.includes(id));
        }
      } catch (error) {
        console.error("Error loading favorite status:", error);
      }
    };
    if (token && id && !isSuperAdminView) {
      loadFavoriteStatus();
    }
  }, [token, id, isSuperAdminView]);

  const toggleFavorite = async () => {
    const previousState = isFavorite;
    // Optimistic update
    setIsFavorite(!isFavorite);

    // Call backend API
    try {
      const method = previousState ? 'DELETE' : 'POST';
      const response = await fetch(
        `${(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api'}/organisation/favorites/${id}`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (!data.success) {
        // Revert on failure
        setIsFavorite(previousState);
        notifications.show({
          title: "Error",
          message: "Failed to update favorites",
          color: "red",
        });
      } else {
        notifications.show({
          title: "Success",
          message: previousState ? "Removed from favorites" : "Added to favorites",
          color: "green",
        });
      }
    } catch (error) {
      // Revert on error
      setIsFavorite(previousState);
      console.error("Error toggling favorite:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update favorites",
        color: "red",
      });
    }
  };
  // Reset apply form when modalCall changes (modal opens)
  React.useEffect(() => {
    if (modalCall) {
      setApplyMessage("");
      setApplyFiles([]);
    }
  }, [modalCall]);
  // Find organisation by id - check both Redux store and currentOrganisation
  const organisation = React.useMemo(() => {
    return organisations.find((org: any) => org.id === id) || currentOrganisation;
  }, [organisations, currentOrganisation, id]);

  // Fetch organisation if not found in store (especially for super admin view)
  useEffect(() => {
    if (id && !organisation && !isLoading) {
      dispatch(fetchOrganisation(id) as any);
    }
  }, [id, organisation, isLoading, dispatch]);

  // Scroll to top on open
  useEffect(() => {
    if (scrollRef.current) {
      // @ts-ignore
      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  // Show loading state while fetching
  if (isLoading && !organisation) {
    if (isSuperAdminPreview) {
      return (
        <Container size="md" py="xl">
          <LoadingOverlay visible />
        </Container>
      );
    }
    return (
      <DashboardLayout>
        <Container size="md" py="xl">
          <LoadingOverlay visible />
        </Container>
      </DashboardLayout>
    );
  }

  if (!organisation) {
    if (isSuperAdminPreview) {
      return (
        <Container size="md" py="xl">
          <Button
            leftSection={<IconArrowLeft size={18} />}
            variant="subtle"
            mb="md"
            onClick={() => navigate(backPath as any)}
          >
            Back
          </Button>
          <Title order={2}>Organisation Not Found</Title>
          <Text c="dimmed">The requested organisation does not exist.</Text>
        </Container>
      );
    }
    return (
      <DashboardLayout>
        <Container size="md" py="xl">
          <Button
            leftSection={<IconArrowLeft size={18} />}
            variant="subtle"
            mb="md"
            onClick={() => navigate(backPath as any)}
          >
            Back
          </Button>
          <Title order={2}>Organisation Not Found</Title>
          <Text c="dimmed">The requested organisation does not exist.</Text>
        </Container>
      </DashboardLayout>
    );
  }
  const socialLinks = formatSocialLinks(organisation.contact.socialMedia);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Get calls from organisation data and filter into active and past
  const allCalls: Call[] = (organisation.calls || []) as Call[];
  const activeCalls = allCalls.filter((call) => isCallActive(call));
  const pastCalls = allCalls.filter((call) => !isCallActive(call));

  // Helper for file icons
  function getFileIcon(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext) return <IconFileDescription size={32} color="#aaa" />;
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext))
      return <IconFileDescription size={32} color="#228be6" />;
    if (["pdf"].includes(ext))
      return <IconFileTypePdf size={32} color="#e8590c" />;
    if (["doc", "docx"].includes(ext))
      return <IconFileTypeDoc size={32} color="#1971c2" />;
    if (["xls", "xlsx", "csv"].includes(ext))
      return <IconFileTypeXls size={32} color="#2b8a3e" />;
    return <IconFileDescription size={32} color="#aaa" />;
  }

  // Custom file uploader
  function FileUploader({
    files,
    setFiles,
  }: {
    files: File[];
    setFiles: (f: File[]) => void;
  }) {
    function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (!e.target.files) return;
      const allowed = Array.from(e.target.files).filter((f) =>
        /\.(pdf|jpg|jpeg|png|gif|bmp|webp|doc|docx|xls|xlsx|csv)$/i.test(f.name)
      );
      setFiles([...files, ...allowed]);
      e.target.value = "";
    }
    function removeFile(idx: number) {
      setFiles(files.filter((_, i) => i !== idx));
    }
    return (
      <Box>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
          Upload Files
        </label>
        <Box
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {files.map((file, idx) => (
            <Box
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                width: 72,
              }}
            >
              <Box
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "#f1f3f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 4,
                }}
              >
                {getFileIcon(file)}
              </Box>
              <Text
                size="xs"
                style={{
                  textAlign: "center",
                  maxWidth: 72,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </Text>
              <ActionIcon
                size="xs"
                color="red"
                variant="light"
                style={{ position: "absolute", top: 0, right: 0 }}
                onClick={() => removeFile(idx)}
              >
                <IconX size={14} />
              </ActionIcon>
            </Box>
          ))}
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              border: "1px dashed #adb5bd",
              borderRadius: 16,
              cursor: "pointer",
              color: "#868e96",
            }}
          >
            <IconPlus size={24} />
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.doc,.docx,.xls,.xlsx,.csv"
              style={{ display: "none" }}
              onChange={onFilesChange}
            />
            <Text size="xs" style={{ marginTop: 2 }}>
              Add
            </Text>
          </label>
        </Box>
      </Box>
    );
  }

  // Move CallCard here so it can access setModalCall
  function CallCard({ call, isPast = false }: { call: Call; isPast?: boolean }) {
    const openModal = () => setModalCall(call);
    const displayStatus = isPast ? "closed" : (call.status || (isCallActive(call) ? "active" : "closed"));
    
    return (
      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          width: 260,
          minHeight: 280,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          cursor: "pointer",
          overflow: "visible",
          transition: "box-shadow 0.2s",
          position: "relative",
        }}
        onClick={openModal}
      >
        {/* Status badge as ribbon */}
        <Badge
          size="sm"
          color={
            displayStatus === "active"
              ? "green"
              : displayStatus === "closed"
                ? "red"
                : "gray"
          }
          style={{
            position: "absolute",
            top: -9,
            right: 20,
            zIndex: 2,
            borderRadius: 6,
            padding: "4px 12px",
            fontWeight: 700,
          }}
        >
          {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
        </Badge>
        <Stack gap={10} style={{ flex: 1, width: "100%" }}>
          <Text fw={600} size="md">
            {call.title}
          </Text>
          <Group gap={6} mb={2}>
            <IconCalendar size={14} />
            <Text size="xs" c="dimmed">
              {formatDeadline(call.deadline)}
            </Text>
          </Group>
          <Group gap={4} mb={2}>
            {call.thematicAreas?.slice(0, 2).map((area, idx) => (
              <Badge key={idx} size="xs" color="blue" variant="light">
                {area}
              </Badge>
            ))}
          </Group>
          <Text size="sm" c="dimmed" lineClamp={2} mb={8}>
            {call.description}
          </Text>
        </Stack>
        <Button
          mt="auto"
          size="xs"
          variant="light"
          fullWidth
          rightSection={<IconChevronRight size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            openModal();
          }}
        >
          View Details
        </Button>
      </Card>
    );
  }

  const content = (
    <Box ref={scrollRef} style={{ minHeight: "100vh", background: "#fff" }}>
        {/* Cover and Logo */}
        <Box
          style={{
            position: "relative",
            height: 220,
            background: organisation.images.cover ? undefined : "#f6f8fa",
            overflow: "visible",
          }}
        >
          {organisation.images.cover ? (
            <Image
              src={organisation.images.cover}
              alt="cover"
              style={{ width: "100%", height: 220, objectFit: "cover" }}
            />
          ) : null}
          <Group style={{ position: "absolute", top: 16, left: 16, zIndex: 2 }} gap="xs">
            <Button
              leftSection={<IconArrowLeft size={18} />}
              variant="white"
              onClick={() => navigate(backPath as any)}
            >
              Back
            </Button>
            {isSuperAdminView && admin && (
              <Badge color="red" variant="filled" size="lg">
                Super Admin Preview
              </Badge>
            )}
          </Group>
          {/* Favorite Button */}
          {!isSuperAdminView && (
            <ActionIcon
              variant="filled"
              color={isFavorite ? "yellow" : "gray"}
              size="xl"
              radius="xl"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onClick={toggleFavorite}
            >
              {isFavorite ? (
                <IconStarFilled size={24} style={{ color: "#fff" }} />
              ) : (
                <IconStar size={24} style={{ color: "#fff" }} />
              )}
            </ActionIcon>
          )}
          <Avatar
            src={organisation.images.logo}
            size={100}
            radius={48}
            style={{
              position: "absolute",
              left: 40,
              bottom: -50,
              border: "4px solid white",
              background: "#f5f7fa",
              zIndex: 3,
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            }}
            styles={{
              image: {
                objectFit: "contain"
              }
            }}
          >
            <IconBuilding size={40} />
          </Avatar>
        </Box>
        <Container size="xl" py="xl">
          <Group
            align="flex-start"
            gap={32}
            wrap="nowrap"
            style={{ alignItems: "flex-start" }}
          >
            {/* Left: Profile */}
            <Box style={{ flex: 2, minWidth: 0 }}>
              <Box style={{ marginTop: 60 }}>
                <Title order={1} size="2.2rem">
                  {organisation.name}
                </Title>
                <Group align="flex-end" justify="space-between">
                  <Box>
                    {organisation.nameLocal && (
                      <Text size="md" c="dimmed" mb={4}>
                        {organisation.nameLocal}
                      </Text>
                    )}
                    <Group gap={8} mt={8}>
                      <Badge color="blue" variant="light">
                        {organisation.type}
                      </Badge>
                      {organisation.profile.city && (
                        <Group gap={4} align="center">
                          <IconMapPin size={16} />
                          <Text size="sm">
                            {organisation.profile.city}
                            {organisation.profile.country
                              ? `, ${organisation.profile.country}`
                              : ""}
                          </Text>
                        </Group>
                      )}
                      {organisation.profile.yearOfEstablishment && (
                        <Group gap={4} align="center">
                          <IconBriefcase size={16} />
                          <Text size="sm">
                            Est. {organisation.profile.yearOfEstablishment}
                          </Text>
                        </Group>
                      )}
                      {organisation.profile.numberOfStaff && (
                        <Group gap={4} align="center">
                          <IconUsers size={16} />
                          <Text size="sm">
                            {organisation.profile.numberOfStaff} staff
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </Box>
                  <Group>
                    {organisation.contact.website && (
                      <Tooltip label="Website">
                        <ActionIcon
                          component="a"
                          href={organisation.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="lg"
                          variant="light"
                        >
                          <IconWorld size={22} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {socialLinks.map((s) => (
                      <Tooltip key={s.url} label={s.label}>
                        <ActionIcon
                          component="a"
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="lg"
                          variant="light"
                        >
                          <IconLink size={22} />
                        </ActionIcon>
                      </Tooltip>
                    ))}
                  </Group>
                </Group>
              </Box>
              {/* Always visible badges row */}
              <Group gap={8} wrap="wrap" mt="md" mb="xs">
                {(organisation.fields.missionFields || []).map(
                  (field: string) => (
                    <Badge key={field} color="gray" variant="light">
                      {field}
                    </Badge>
                  )
                )}
                {(organisation.fields.keywords || []).map((kw: string) => (
                  <Badge key={kw} color="gray" variant="light">
                    {kw}
                  </Badge>
                ))}
              </Group>
              {/* Accordion for more info */}
              <Accordion
                value={accordionOpen}
                onChange={setAccordionOpen}
                multiple
                chevron={<IconChevronDown size={18} />}
                styles={{
                  control: {
                    fontWeight: 600,
                    fontSize: 16,
                    padding: "16px 20px",
                    borderRadius: 8,
                  },
                  item: {
                    border: "1px solid #e9ecef",
                    borderRadius: 8,
                    marginBottom: 8,
                  },
                  chevron: { marginLeft: 8 },
                }}
              >
                <Accordion.Item value="more">
                  <Accordion.Control style={{ height: "40px" }}>
                    More Info
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
                      <Group gap={16} wrap="wrap">
                        {(organisation.fields.availableResources || []).length >
                          0 && (
                          <Box>
                            <Text fw={500} size="sm">
                              Resources:
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {organisation.fields.availableResources.map(
                                (r: string) => (
                                  <Chip key={r} checked color="gray">
                                    {r}
                                  </Chip>
                                )
                              )}
                            </Group>
                          </Box>
                        )}
                        {(organisation.fields.expertiseOffered || []).length >
                          0 && (
                          <Box>
                            <Text fw={500} size="sm">
                              Expertise Offered:
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {organisation.fields.expertiseOffered.map(
                                (e: string) => (
                                  <Chip key={e} checked color="gray">
                                    {e}
                                  </Chip>
                                )
                              )}
                            </Group>
                          </Box>
                        )}
                        {(organisation.fields.expertiseSought || []).length >
                          0 && (
                          <Box>
                            <Text fw={500} size="sm">
                              Expertise Sought:
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {organisation.fields.expertiseSought.map(
                                (e: string) => (
                                  <Chip key={e} checked color="gray">
                                    {e}
                                  </Chip>
                                )
                              )}
                            </Group>
                          </Box>
                        )}
                        {(organisation.fields.preferredRole || []).length >
                          0 && (
                          <Box>
                            <Text fw={500} size="sm">
                              Preferred Role:
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {organisation.fields.preferredRole.map(
                                (r: string) => (
                                  <Chip key={r} checked color="gray">
                                    {r}
                                  </Chip>
                                )
                              )}
                            </Group>
                          </Box>
                        )}
                      </Group>
                      <Group gap={16} wrap="wrap">
                        {(organisation.fields.geographicalCoverage || [])
                          .length > 0 && (
                          <Box>
                            <Text fw={500} size="sm">
                              Geographical Coverage:
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {organisation.fields.geographicalCoverage.map(
                                (g: string) => (
                                  <Chip key={g} checked color="gray">
                                    {g}
                                  </Chip>
                                )
                              )}
                            </Group>
                          </Box>
                        )}
                        {(organisation.fields.lookingForPartnersFromCPs || [])
                          .length > 0 && (
                          <Box>
                            <Text fw={500} size="sm">
                              Looking for Partners from:
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {organisation.fields.lookingForPartnersFromCPs.map(
                                (cp: string) => (
                                  <Chip key={cp} checked color="gray">
                                    {cp}
                                  </Chip>
                                )
                              )}
                            </Group>
                          </Box>
                        )}
                        {(
                          organisation.fields
                            .lookingForPartnersInThematicAreas || []
                        ).length > 0 && (
                          <Box>
                            <Text fw={500} size="sm">
                              Looking for Partners in:
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {organisation.fields.lookingForPartnersInThematicAreas.map(
                                (ta: string) => (
                                  <Chip key={ta} checked color="gray">
                                    {ta}
                                  </Chip>
                                )
                              )}
                            </Group>
                          </Box>
                        )}
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
              <Divider my="lg" />
              {/* About & Details */}
              <Stack gap="md">
                <Title order={3} size="h4">
                  About
                </Title>
                <Group gap={32} wrap="wrap">
                  <Box>
                    <Text fw={500} size="sm">
                      Contracting Party:
                    </Text>
                    <Text>{organisation.profile.contractingParty}</Text>
                  </Box>
                  <Box>
                    <Text fw={500} size="sm">
                      Registration Number:
                    </Text>
                    <Text>{organisation.profile.registrationNumber}</Text>
                  </Box>
                  <Box>
                    <Text fw={500} size="sm">
                      Address:
                    </Text>
                    <Text>{organisation.contact.address}</Text>
                  </Box>
                </Group>
              </Stack>
              <Divider my="lg" />
              {/* Projects, Success Stories, Reference Projects */}
              <Stack gap="md">
                {organisation.projects && organisation.projects.length > 0 && (
                  <Box>
                    <Title order={3} size="h4" mb={8}>
                      Projects
                    </Title>
                    <Group gap={16} wrap="wrap">
                      {organisation.projects.map((proj: any, idx: number) => (
                        <Card
                          key={idx}
                          shadow="sm"
                          radius="md"
                          withBorder
                          style={{ minWidth: 260, maxWidth: 320 }}
                        >
                          {proj.imageUrl && (
                            <Card.Section>
                              <Image
                                src={proj.imageUrl}
                                alt={proj.title}
                                height={120}
                              />
                            </Card.Section>
                          )}
                          <Text fw={600} mt={8}>
                            {proj.title}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {proj.description}
                          </Text>
                        </Card>
                      ))}
                    </Group>
                  </Box>
                )}
                {organisation.successStories &&
                  organisation.successStories.length > 0 && (
                    <Box>
                      <Title order={3} size="h4" mb={8}>
                        Success Stories
                      </Title>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {organisation.successStories.map(
                          (story: string, idx: number) => (
                            <li key={idx}>
                              <Text>{story}</Text>
                            </li>
                          )
                        )}
                      </ul>
                    </Box>
                  )}
                {organisation.referenceProjects &&
                  organisation.referenceProjects.length > 0 && (
                    <Box>
                      <Title order={3} size="h4" mb={8}>
                        Reference Projects
                      </Title>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {organisation.referenceProjects.map(
                          (ref: string, idx: number) => (
                            <li key={idx}>
                              <Text>{ref}</Text>
                            </li>
                          )
                        )}
                      </ul>
                    </Box>
                  )}
              </Stack>
            </Box>
            {/* Right: Sticky Contact Form */}
            <Box
              style={{
                flex: 1,
                minWidth: 320,
                maxWidth: 400,
                position: "sticky",
                top: rem(64),
                alignSelf: "flex-start",
                zIndex: 2,
              }}
            >
              <Card shadow="sm" radius="md" withBorder p="lg">
                <Title order={4} mb="sm">
                  Contact {organisation.name}
                </Title>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!loggedOrg || !organisation) {
                      notifications.show({
                        title: "Error",
                        message: "Please log in to send messages",
                        color: "red",
                      });
                      return;
                    }

                    try {
                      setContactFormSent(true);

                      // Create a direct message conversation with proper metadata
                      await messagingService.createDirectMessage(
                        organisation.id,
                        `Message to ${organisation.name}`,
                        contactMessage.trim()
                      );

                      notifications.show({
                        title: "Success",
                        message:
                          "Message sent successfully! You can continue the conversation in Messages.",
                        color: "green",
                      });

                      // Clear the form
                      setContactMessage("");

                      // Reset button state after 2 seconds
                      setTimeout(() => setContactFormSent(false), 2000);
                    } catch (error: any) {
                      console.error("Failed to send message:", error);
                      setContactFormSent(false);
                      notifications.show({
                        title: "Error",
                        message:
                          error.message ||
                          "Failed to send message. Please try again.",
                        color: "red",
                      });
                    }
                  }}
                >
                  <Stack gap="sm">
                    <TextInput
                      label="Organisation Name"
                      value={loggedOrg?.name || ""}
                      readOnly
                      required
                    />
                    <Textarea
                      label="Message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.currentTarget.value)}
                      required
                      minRows={3}
                    />
                    <Button
                      type="submit"
                      leftSection={<IconMessage size={16} />}
                      color="dark"
                      fullWidth
                      disabled={contactFormSent}
                    >
                      {contactFormSent ? "Message Sent!" : "Send Message"}
                    </Button>
                  </Stack>
                </form>
              </Card>
            </Box>
          </Group>
          {/* Active Calls/Projects */}
          {activeCalls.length > 0 && (
            <Box mt={48}>
              <Title order={3} size="h4" mb={16}>
                Active Calls & Projects
              </Title>
              <Group gap={16} wrap="wrap">
                {activeCalls.map((call) => (
                  <CallCard key={call.id} call={call} />
                ))}
              </Group>
            </Box>
          )}
          {/* Past Calls/Projects */}
          {pastCalls.length > 0 && (
            <Box mt={32}>
              <Title order={3} size="h4" mb={16}>
                Past Calls & Projects
              </Title>
              <MantineAccordion variant="contained" chevronPosition="right">
                <MantineAccordion.Item value="past-calls-projects">
                  <MantineAccordion.Control
                    icon={<IconChevronRight size={18} />}
                  >
                    <Text fw={500} size="sm">
                      All Past Calls & Projects ({pastCalls.length})
                    </Text>
                  </MantineAccordion.Control>
                  <MantineAccordion.Panel>
                    <Group gap={16} wrap="wrap">
                      {pastCalls.map((call) => (
                        <CallCard key={call.id} call={call} isPast={true} />
                      ))}
                    </Group>
                  </MantineAccordion.Panel>
                </MantineAccordion.Item>
              </MantineAccordion>
            </Box>
          )}
          {/* Modal for call/project details */}
          <Modal
            opened={!!modalCall}
            onClose={() => {
              setModalCall(null);
            }}
            size={
              modalCall && modalCall.status === "active"
                ? isMobile
                  ? "full"
                  : 800
                : isMobile
                  ? "full"
                  : 480
            }
            title={null}
            styles={{
              content:
                modalCall && modalCall.status === "active"
                  ? {
                      padding: isMobile ? 10 : 16,
                      maxWidth: isMobile ? "100vw" : 900,
                    }
                  : {
                      padding: isMobile ? 10 : 16,
                      maxWidth: isMobile ? "100vw" : 480,
                    },
            }}
          >
            {modalCall &&
              (isCallActive(modalCall) ? (
                <Box
                  style={{
                    display: isMobile ? "block" : "flex",
                    minHeight: 320,
                  }}
                >
                  {/* Left: Details */}
                  <Box
                    style={{
                      flex: 1,
                      paddingRight: isMobile ? 0 : 20,
                      marginBottom: isMobile ? 16 : 0,
                    }}
                  >
                    <Title order={2} style={{ marginBottom: 12 }}>
                      {modalCall.title}
                    </Title>
                    <Group gap={16} mb={12}>
                      <Text size="sm">
                        <b>Deadline:</b> {formatDeadline(modalCall.deadline)}
                      </Text>
                      <Text size="sm">
                        <b>Budget:</b> {formatBudget(modalCall.budget)}
                      </Text>
                    </Group>
                    <Group gap={8} mb={12}>
                      {modalCall.thematicAreas?.map((area, idx) => (
                        <Badge key={idx} size="xs" color="blue" variant="light">
                          {area}
                        </Badge>
                      ))}
                    </Group>
                    <Text
                      size="sm"
                      c="dimmed"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxHeight: 120,
                        marginBottom: 16,
                      }}
                    >
                      {modalCall.description}
                    </Text>
                    <Group gap={16} mb={12}>
                      {modalCall.location && (
                        <Text size="sm">
                          <b>Location:</b> {modalCall.location}
                        </Text>
                      )}
                      {modalCall.projectDuration && (
                        <Text size="sm">
                          <b>Duration:</b> {modalCall.projectDuration}
                        </Text>
                      )}
                      {modalCall.maxPartners && (
                        <Text size="sm">
                          <b>Max Partners:</b> {modalCall.maxPartners}
                        </Text>
                      )}
                    </Group>
                    {modalCall.applicationsCount !== undefined && (
                      <Text size="sm" mb={4}>
                        <b>Applications:</b> {modalCall.applicationsCount}
                      </Text>
                    )}
                  </Box>
                  {/* Right: Apply Form (only for active calls) */}
                  <Box
                    style={{
                      flex: 1,
                      borderLeft: isMobile ? "none" : "1px solid #f1f3f5",
                      paddingLeft: isMobile ? 0 : 40,
                      borderTop: isMobile ? "1px solid #f1f3f5" : "none",
                      marginTop: isMobile ? 24 : 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!loggedOrg || !modalCall) {
                          notifications.show({
                            title: "Error",
                            message: "Please log in to apply",
                            color: "red",
                          });
                          return;
                        }

                        try {
                          // Create application message
                          await messagingService.createApplicationMessage(
                            organisation.id, // recipient (call owner)
                            modalCall.id,
                            modalCall.title,
                            "call", // assuming these are calls
                            applyMessage.trim()
                          );

                          notifications.show({
                            title: "Success",
                            message:
                              "Application sent successfully! You can track it in Messages.",
                            color: "green",
                          });

                          // Clear form and close modal
                          setApplyMessage("");
                        } catch (error: any) {
                          console.error("Failed to send application:", error);
                          notifications.show({
                            title: "Error",
                            message:
                              error.message ||
                              "Failed to send application. Please try again.",
                            color: "red",
                          });
                        }
                      }}
                    >
                      <Stack gap="md">
                        <TextInput
                          label="Organisation Name"
                          value={loggedOrg?.name || ""}
                          readOnly
                          required
                        />
                        <Textarea
                          label="Message"
                          value={applyMessage}
                          onChange={(e) =>
                            setApplyMessage(e.currentTarget.value)
                          }
                          required
                          minRows={6}
                          autosize
                          maxRows={12}
                        />
                        <FileUploader
                          files={applyFiles}
                          setFiles={setApplyFiles}
                        />
                        <Group justify="center">
                          <Button
                            type="submit"
                            color="dark"
                            size="md"
                            style={{ minWidth: 180 }}
                          >
                            Submit Application
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Title order={2} style={{ marginBottom: 12 }}>
                    {modalCall.title}
                  </Title>
                  <Group gap={16} mb={12}>
                    <Text size="sm">
                      <b>Deadline:</b> {formatDeadline(modalCall.deadline)}
                    </Text>
                    <Text size="sm">
                      <b>Budget:</b> {formatBudget(modalCall.budget)}
                    </Text>
                  </Group>
                  <Group gap={8} mb={12}>
                    {modalCall.thematicAreas?.map((area, idx) => (
                      <Badge key={idx} size="xs" color="blue" variant="light">
                        {area}
                      </Badge>
                    ))}
                  </Group>
                  <Text
                    size="sm"
                    c="dimmed"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxHeight: 120,
                      marginBottom: 16,
                    }}
                  >
                    {modalCall.description}
                  </Text>
                  <Group gap={16} mb={12}>
                    <Text size="sm">
                      <b>Location:</b> {modalCall.location}
                    </Text>
                    <Text size="sm">
                      <b>Duration:</b> {modalCall.projectDuration}
                    </Text>
                    <Text size="sm">
                      <b>Max Partners:</b> {modalCall.maxPartners}
                    </Text>
                  </Group>
                  <Text size="sm" mb={4}>
                    <b>Applications:</b> {modalCall.applicationsCount}
                  </Text>
                </Box>
              ))}
          </Modal>
        </Container>
      </Box>
  );

  // Return with or without layout wrapper based on super admin view
  if (isSuperAdminPreview) {
    return content;
  }
  
  return <DashboardLayout>{content}</DashboardLayout>;
}
