import { useState, useEffect } from "react";
import {
  Text,
  Grid,
  Card,
  Group,
  Badge,
  Stack,
  Button,
  Box,
  TextInput,
  Select,
  MultiSelect,
  Collapse,
  Divider,
  useMantineTheme,
  ActionIcon,
  NumberInput,
  Avatar,
  Title,
  Switch,
  Center,
  Loader,
  Flex,
  SegmentedControl,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconSearch,
  IconCalendar,
  IconMapPin,
  IconUsers,
  IconCurrencyEuro,
  IconPlus,
  IconEye,
  IconX,
  IconBuilding,
  IconChevronUp,
  IconChevronDown,
  IconSortAscending,
  IconRefresh,
  IconAdjustments,
  IconClock,
  IconAlertCircle,
  IconPower,
} from "@tabler/icons-react";
import SuperAdminDashboardLayout from "../components/layout/SuperAdminDashboardLayout";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { CallProjectPreview } from "../features/calls-projects/components/CallProjectPreview";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  ((import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:3001/api";

interface UICall {
  id: string;
  type: "call" | "project";
  title: string;
  description: string;
  organisation: {
    id: string;
    name: string;
    logo?: string;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  deadline: Date;
  location: string;
  thematicAreas: string[];
  requiredExpertise: string[];
  projectDuration?: string;
  maxPartners?: number;
  status: "active" | "closed" | "draft";
  createdAt: Date;
  applicationsCount: number;
  createdByOrganisationId?: string;
  // Extended fields
  shortDescription?: string;
  callType?: string;
  eligibleRegions?: string[];
  openingDate?: Date;
  evaluationPeriod?: string;
  expectedStartDate?: Date;
  eligibilityCriteria?: string;
  numberOfAwards?: number;
  applicationLink?: string;
  requiredDocuments?: string[];
  contact?: { name?: string; email?: string; phone?: string };
  guidelinePdfUrl?: string;
  faqLink?: string;
  visibility?: "public" | "members";
  shortSummary?: string;
  category?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  ongoing?: boolean;
  projectStatus?: "planned" | "ongoing" | "completed";
  leadOrganisationId?: string;
  leadOrganisationName?: string;
  partnerOrganisationNames?: string[];
  fundingSource?: string;
  budgetVisibility?: "public" | "private";
  outcomes?: string;
  galleryUrls?: string[];
  videoUrls?: string[];
  reportUrls?: string[];
  projectManager?: { name?: string; email?: string; phone?: string };
  website?: string;
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

export default function SuperAdminCallsProjectsPage() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const { token } = useSelector((s: RootState) => s.auth);

  // Main data state
  const [opportunities, setOpportunities] = useState<UICall[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [selectedCall, setSelectedCall] = useState<UICall | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtering and sorting state
  const [sortBy, setSortBy] = useState<string>("deadline-asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<string>("");
  const [organisations, setOrganisations] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedThematicAreas, setSelectedThematicAreas] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<("active" | "closed" | "draft")[]>(["active", "closed", "draft"]);
  const [selectedTypes, setSelectedTypes] = useState<("call" | "project")[]>([]);
  const [includeFinished, setIncludeFinished] = useState(false);
  const [budgetMin, setBudgetMin] = useState<number | undefined>();
  const [budgetMax, setBudgetMax] = useState<number | undefined>();
  const [deadlineFrom, setDeadlineFrom] = useState<Date | null>(null);
  const [deadlineTo, setDeadlineTo] = useState<Date | null>(null);

  // Pagination
  const itemsPerPage = 24;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch organisations for filter
  useEffect(() => {
    const fetchOrganisations = async () => {
      if (!token) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/super-admin/organisations`, {
          params: { page: 1, limit: 100 },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setOrganisations(
            response.data.data.organisations.map((org: any) => ({
              id: org.id,
              name: org.name || org.nameLocal || "Unnamed Organisation",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching organisations:", error);
      }
    };
    fetchOrganisations();
  }, [token]);

  // Load opportunities with enhanced filtering and sorting
  const loadOpportunities = async (resetPage = false) => {
    if (!token) return;
    
    try {
      if (resetPage) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }

      const page = resetPage ? 1 : currentPage + 1;

      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", itemsPerPage.toString());
      queryParams.append("sortBy", sortBy);
      queryParams.append("includeFinished", includeFinished.toString());
      // Add cache-busting timestamp to prevent 304 responses
      queryParams.append("_t", Date.now().toString());
      
      // Always send status filter - if empty, backend will show all
      if (selectedStatus.length > 0) {
        selectedStatus.forEach(s => queryParams.append("status", s));
      }
      if (selectedTypes.length === 1) {
        queryParams.append("type", selectedTypes[0]);
      }
      if (selectedThematicAreas.length > 0) {
        selectedThematicAreas.forEach(area => queryParams.append("thematicAreas", area));
      }
      if (selectedLocations.length > 0) {
        selectedLocations.forEach(loc => queryParams.append("locations", loc));
      }
      if (budgetMin) queryParams.append("budgetMin", budgetMin.toString());
      if (budgetMax) queryParams.append("budgetMax", budgetMax.toString());
      if (searchTerm.trim()) queryParams.append("searchTerm", searchTerm.trim());
      if (selectedOrganisationId) queryParams.append("organisationId", selectedOrganisationId);

      const response = await axios.get(
        `${API_BASE_URL}/super-admin/calls-projects?${queryParams.toString()}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Handle 304 Not Modified response (use cached data, don't treat as error)
      if (response.status === 304) {
        return;
      }

      // Check if response is successful
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.error || "Invalid response format");
      }

      if (response.data.success && response.data.data) {
        const mapped: UICall[] = response.data.data.opportunities.map((op: any) => {
          const deadlineTs: any = op.deadline;
          const createdAtTs: any = op.createdAt;
          const deadlineDate = deadlineTs?._seconds
            ? new Date(deadlineTs._seconds * 1000)
            : typeof deadlineTs === "string" || typeof deadlineTs === "number"
              ? new Date(deadlineTs)
              : new Date();
          const createdAtDate = createdAtTs?._seconds
            ? new Date(createdAtTs._seconds * 1000)
            : typeof createdAtTs === "string" || typeof createdAtTs === "number"
              ? new Date(createdAtTs)
              : new Date();

          return {
            id: op.id || `${op.organisation?.id}-${op.title}-${Math.random()}`,
            type: op.type,
            title: op.title,
            description: op.description,
            organisation: op.organisation,
            budget: op.budget,
            deadline: deadlineDate,
            location: op.location,
            thematicAreas: op.thematicAreas || [],
            requiredExpertise: op.requiredExpertise || [],
            projectDuration: op.projectDuration || undefined,
            maxPartners: op.maxPartners ?? undefined,
            status: op.status,
            createdAt: createdAtDate,
            applicationsCount: op.applicationsCount || 0,
            createdByOrganisationId: op.createdByOrganisationId,
            // Extended fields
            shortDescription: op.shortDescription,
            callType: op.callType,
            eligibleRegions: op.eligibleRegions,
            openingDate: op.openingDate?._seconds ? new Date(op.openingDate._seconds * 1000) : undefined,
            evaluationPeriod: op.evaluationPeriod,
            expectedStartDate: op.expectedStartDate?._seconds ? new Date(op.expectedStartDate._seconds * 1000) : undefined,
            eligibilityCriteria: op.eligibilityCriteria,
            numberOfAwards: op.numberOfAwards,
            applicationLink: op.applicationLink,
            requiredDocuments: op.requiredDocuments,
            contact: op.contact,
            guidelinePdfUrl: op.guidelinePdfUrl,
            faqLink: op.faqLink,
            visibility: op.visibility,
            shortSummary: op.shortSummary,
            category: op.category,
            tags: op.tags,
            startDate: op.startDate?._seconds ? new Date(op.startDate._seconds * 1000) : undefined,
            endDate: op.endDate?._seconds ? new Date(op.endDate._seconds * 1000) : undefined,
            ongoing: op.ongoing,
            projectStatus: op.projectStatus,
            leadOrganisationId: op.leadOrganisationId,
            leadOrganisationName: op.leadOrganisationName,
            partnerOrganisationNames: op.partnerOrganisationNames,
            fundingSource: op.fundingSource,
            budgetVisibility: op.budgetVisibility,
            outcomes: op.outcomes,
            galleryUrls: op.galleryUrls,
            videoUrls: op.videoUrls,
            reportUrls: op.reportUrls,
            projectManager: op.projectManager,
            website: op.website,
          };
        });

        if (resetPage) {
          setOpportunities(mapped);
        } else {
          setOpportunities((prev) => [...prev, ...mapped]);
        }

        setHasMore(response.data.data.pagination.page < response.data.data.pagination.totalPages);
        setTotalCount(response.data.data.pagination.total || 0);
        if (!resetPage) {
          setCurrentPage(page);
        }
      }
    } catch (error: any) {
      console.error("Error loading opportunities:", error);
      
      // Don't show error for 304 Not Modified responses
      if (error?.response?.status === 304) {
        return;
      }
      
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to load opportunities";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadOpportunities(true);
  }, []);

  // Reload when filters or sorting change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOpportunities(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    sortBy,
    searchTerm,
    selectedOrganisationId,
    selectedThematicAreas,
    selectedLocations,
    selectedStatus,
    selectedTypes,
    includeFinished,
    budgetMin,
    budgetMax,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedOrganisationId("");
    setSelectedThematicAreas([]);
    setSelectedExpertise([]);
    setSelectedLocations([]);
    setSelectedStatus(["active", "closed", "draft"]);
    setSelectedTypes([]);
    setIncludeFinished(false);
    setBudgetMin(undefined);
    setBudgetMax(undefined);
    setDeadlineFrom(null);
    setDeadlineTo(null);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      loadOpportunities(false);
    }
  };

  // Sort options for UI
  const sortOptions = [
    { value: "deadline-asc", label: "Deadline (Soon to Late)" },
    { value: "deadline-desc", label: "Deadline (Late to Soon)" },
    { value: "title-asc", label: "Title (A-Z)" },
    { value: "title-desc", label: "Title (Z-A)" },
    { value: "created-desc", label: "Newest First" },
    { value: "created-asc", label: "Oldest First" },
    { value: "budget-asc", label: "Budget (Low to High)" },
    { value: "budget-desc", label: "Budget (High to Low)" },
  ];

  const formatBudget = (budget: UICall["budget"]) => {
    return `${budget.min.toLocaleString()} - ${budget.max.toLocaleString()} ${budget.currency}`;
  };

  const formatDeadline = (deadline: Date | string) => {
    const date = typeof deadline === "string" ? new Date(deadline) : deadline;
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Deadline passed";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `${diffDays} days left`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`;
    return `${Math.ceil(diffDays / 30)} months left`;
  };

  // Handle status update (deactivate/end)
  const handleUpdateStatus = async (opportunity: UICall, newStatus: "active" | "closed" | "draft") => {
    if (!token || !opportunity.createdByOrganisationId) {
      notifications.show({
        title: "Error",
        message: "Missing required information",
        color: "red",
      });
      return;
    }

    const actionText = newStatus === "closed" ? "end" : newStatus === "draft" ? "deactivate" : "activate";
    
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/super-admin/calls-projects/${opportunity.createdByOrganisationId}/${opportunity.id}/status`,
        {
          status: newStatus,
          type: opportunity.type,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        notifications.show({
          title: "Success",
          message: `${opportunity.type === "call" ? "Call" : "Project"} ${actionText}ed successfully`,
          color: "green",
        });

        // Update local state
        setOpportunities((prev) =>
          prev.map((op) =>
            op.id === opportunity.id && op.createdByOrganisationId === opportunity.createdByOrganisationId
              ? { ...op, status: newStatus }
              : op
          )
        );

        // Update selected call if it's the one being modified
        if (selectedCall && selectedCall.id === opportunity.id) {
          setSelectedCall({ ...selectedCall, status: newStatus });
        }

        // Reload opportunities after a short delay
        setTimeout(() => {
          loadOpportunities(true);
        }, 500);
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || `Failed to ${actionText} ${opportunity.type === "call" ? "call" : "project"}`,
        color: "red",
      });
    }
  };

  const CallCard = ({ call }: { call: UICall }) => (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        position: "relative",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows.lg,
        },
      }}
    >
      {/* Type and Status Ribbons */}
      <Group
        gap="xs"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 10,
        }}
      >
        <Badge
          size="lg"
          variant="filled"
          color={call.type === "call" ? theme.colors.brand[7] : theme.colors.blue[6]}
          style={{
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {call.type === "call" ? "Call" : "Project"}
        </Badge>
        <Badge
          size="lg"
          variant="filled"
          color={
            call.status === "active"
              ? "green"
              : call.status === "closed"
                ? "red"
                : "gray"
          }
          style={{
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
        </Badge>
      </Group>

      <Group justify="space-between" mb="md" style={{ paddingRight: 180 }}>
        <Group>
          <Avatar src={call.organisation.logo} size="md" radius="md">
            <IconBuilding size={20} />
          </Avatar>
          <Box>
            <Text size="sm" fw={500} c={theme.colors.gray[7]}>
              {call.organisation.name}
            </Text>
            <Text size="xs" c="dimmed">
              Published {call.createdAt.toLocaleDateString()}
            </Text>
          </Box>
        </Group>
      </Group>

      <Text size="lg" fw={600} mb="xs" lineClamp={2}>
        {call.title}
      </Text>
      <Text size="sm" c="dimmed" mb="md" lineClamp={3}>
        {call.description}
      </Text>

      <Group gap="xs" mb="md">
        {call.thematicAreas.slice(0, 2).map((area, index) => (
          <Badge key={index} size="sm" variant="light" color="blue">
            {area}
          </Badge>
        ))}
        {call.thematicAreas.length > 2 && (
          <Badge size="sm" variant="light" color="gray">
            +{call.thematicAreas.length - 2}
          </Badge>
        )}
      </Group>

      <Stack gap="xs" mb="md">
        <Group gap="md">
          <Group gap="xs">
            <IconCurrencyEuro size={14} />
            <Text size="sm" fw={500}>
              {formatBudget(call.budget)}
            </Text>
          </Group>
          <Group gap="xs">
            <IconCalendar size={14} />
            <Text size="sm" c="dimmed">
              {formatDeadline(call.deadline)}
            </Text>
          </Group>
        </Group>
        <Group gap="md">
          <Group gap="xs">
            <IconMapPin size={14} />
            <Text size="sm" c="dimmed">
              {call.location}
            </Text>
          </Group>
          {call.maxPartners && (
            <Group gap="xs">
              <IconUsers size={14} />
              <Text size="sm" c="dimmed">
                {call.maxPartners} partners max
              </Text>
            </Group>
          )}
        </Group>
      </Stack>

      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          {call.applicationsCount} applications received
        </Text>
        {call.projectDuration && (
          <Text size="sm" c="dimmed">
            {call.projectDuration}
          </Text>
        )}
      </Group>

      <Group gap="xs">
        <Button
          variant="light"
          size="sm"
          leftSection={<IconEye size={14} />}
          style={{ flex: 1 }}
          onClick={() => setSelectedCall(call)}
        >
          View Details
        </Button>
        
        {/* Super Admin Deactivate Action */}
        {call.status === "active" && (
          <Button
            variant="light"
            color="orange"
            size="sm"
            leftSection={<IconPower size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to deactivate this ${call.type === "call" ? "call" : "project"}?`)) {
                handleUpdateStatus(call, "draft");
              }
            }}
          >
            Deactivate
          </Button>
        )}
      </Group>
    </Card>
  );


  return (
    <SuperAdminDashboardLayout>
      <Box style={{ position: "relative", minHeight: "calc(100vh - 60px)", paddingTop: "54px" }}>
        
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <Box>
            <Title order={1} size="2.5rem" mb="xs" c={theme.colors.brand[7]}>
              Calls & Projects
            </Title>
            <Text size="lg" c="dimmed">
              Manage all calls and projects across organisations
            </Text>
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate("/super-admin/calls-projects/create")}
            style={{
              backgroundColor: theme.colors.brand[7],
            }}
          >
            Create Call/Project
          </Button>
        </Group>

        {/* Enhanced Search, Filters and Sorting */}
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Stack gap="md">
            {/* Search and Sort Bar */}
            <Group gap="md">
              <TextInput
                placeholder="Search calls by title, description, or organisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                rightSection={
                  searchTerm && (
                    <ActionIcon
                      variant="subtle"
                      onClick={() => setSearchTerm("")}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  )
                }
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Sort by"
                data={sortOptions}
                value={sortBy}
                onChange={(value) => setSortBy(value || "deadline-asc")}
                leftSection={<IconSortAscending size={16} />}
                style={{ minWidth: 200 }}
              />
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={() => loadOpportunities(true)}
                loading={loading}
              >
                Refresh
              </Button>
            </Group>

            {/* Quick Filters */}
            <Group gap="md">
              <SegmentedControl
                data={[
                  { label: "All", value: "" },
                  { label: "Calls", value: "call" },
                  { label: "Projects", value: "project" },
                ]}
                value={selectedTypes.length === 1 ? selectedTypes[0] : ""}
                onChange={(value) =>
                  setSelectedTypes(value ? [value as "call" | "project"] : [])
                }
              />

              <MultiSelect
                placeholder="Status"
                value={selectedStatus}
                onChange={(value) =>
                  setSelectedStatus(value as ("active" | "closed" | "draft")[])
                }
                data={[
                  { value: "active", label: "Active" },
                  { value: "closed", label: "Closed" },
                  { value: "draft", label: "Draft" },
                ]}
                clearable={false}
                style={{ minWidth: 150 }}
              />

              <Switch
                label="Include Finished"
                checked={includeFinished}
                onChange={(e) => setIncludeFinished(e.currentTarget.checked)}
                thumbIcon={
                  includeFinished ? (
                    <IconClock size={12} color={theme.colors.teal[6]} />
                  ) : (
                    <IconAlertCircle size={12} color={theme.colors.red[6]} />
                  )
                }
              />
            </Group>

            {/* Main Filters */}
            <Group gap="md">
              <Select
                placeholder="Filter by Organisation"
                value={selectedOrganisationId}
                onChange={(value) => setSelectedOrganisationId(value || "")}
                data={organisations.map(org => ({ value: org.id, label: org.name }))}
                clearable
                searchable
                leftSection={<IconBuilding size={16} />}
                style={{ minWidth: 250 }}
              />
              <MultiSelect
                placeholder="Thematic Areas"
                value={selectedThematicAreas}
                onChange={setSelectedThematicAreas}
                data={thematicAreasOptions}
                clearable
                style={{ flex: 1 }}
              />
              <MultiSelect
                placeholder="Required Expertise"
                value={selectedExpertise}
                onChange={setSelectedExpertise}
                data={expertiseOptions}
                clearable
                style={{ flex: 1 }}
              />
              <MultiSelect
                placeholder="Locations"
                value={selectedLocations}
                onChange={setSelectedLocations}
                data={locations}
                clearable
                style={{ flex: 1 }}
              />
            </Group>

            {/* Advanced Filters Toggle */}
            <Button
              variant="subtle"
              leftSection={
                showAdvancedFilters ? (
                  <IconChevronUp size={16} />
                ) : (
                  <IconChevronDown size={16} />
                )
              }
              rightSection={<IconAdjustments size={16} />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
            </Button>

            {/* Advanced Filters */}
            <Collapse in={showAdvancedFilters}>
              <Stack gap="md">
                <Divider />

                {/* Budget Range */}
                <Group gap="md">
                  <Text size="sm" fw={500} style={{ minWidth: 100 }}>
                    Budget Range
                  </Text>
                  <NumberInput
                    placeholder="Min Budget"
                    value={budgetMin}
                    onChange={(value) =>
                      setBudgetMin(typeof value === "number" ? value : undefined)
                    }
                    min={0}
                    style={{ width: 140 }}
                    leftSection="€"
                  />
                  <Text size="sm">to</Text>
                  <NumberInput
                    placeholder="Max Budget"
                    value={budgetMax}
                    onChange={(value) =>
                      setBudgetMax(typeof value === "number" ? value : undefined)
                    }
                    min={0}
                    style={{ width: 140 }}
                    leftSection="€"
                  />
                </Group>

                {/* Date Range */}
                <Group gap="md">
                  <Text size="sm" fw={500} style={{ minWidth: 100 }}>
                    Deadline Range
                  </Text>
                  <DateInput
                    placeholder="From date"
                    value={deadlineFrom}
                    onChange={(value) => setDeadlineFrom(value as Date | null)}
                    style={{ width: 140 }}
                  />
                  <Text size="sm">to</Text>
                  <DateInput
                    placeholder="To date"
                    value={deadlineTo}
                    onChange={(value) => setDeadlineTo(value as Date | null)}
                    style={{ width: 140 }}
                  />
                </Group>

                <Group gap="md">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </Group>
              </Stack>
            </Collapse>
          </Stack>
        </Card>

        {/* Results Summary */}
        <Group justify="space-between" mb="lg">
          <Flex align="center" gap="md">
            <Text size="sm" c="dimmed">
              {loading && opportunities.length === 0
                ? "Loading..."
                : totalCount > 0
                  ? `Showing ${opportunities.length} of ${totalCount} opportunities`
                  : `Showing ${opportunities.length} opportunities`}
            </Text>
            {!includeFinished && (
              <Badge size="sm" variant="light" color="orange">
                Finished Hidden
              </Badge>
            )}
            {selectedStatus.length > 0 && selectedStatus.length < 3 && (
              <Badge size="sm" variant="light" color="blue">
                Status: {selectedStatus.join(", ")}
              </Badge>
            )}
            {selectedTypes.length > 0 && (
              <Badge size="sm" variant="light" color="green">
                Type: {selectedTypes.join(", ")}
              </Badge>
            )}
          </Flex>
          {(searchTerm ||
            selectedOrganisationId ||
            selectedThematicAreas.length > 0 ||
            selectedExpertise.length > 0 ||
            selectedLocations.length > 0 ||
            budgetMin ||
            budgetMax ||
            deadlineFrom ||
            deadlineTo) && (
            <Button variant="subtle" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Group>

        {/* Loading State */}
        {loading && opportunities.length === 0 && (
          <Center py={60}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text size="sm" c="dimmed">
                Loading opportunities...
              </Text>
            </Stack>
          </Center>
        )}

        {/* Empty State */}
        {!loading && opportunities.length === 0 && (
          <Center py={60}>
            <Stack align="center" gap="md">
              <Text size="lg" fw={500} c="dimmed">
                No opportunities found
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Try adjusting your filters or search terms
              </Text>
              <Button variant="light" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </Stack>
          </Center>
        )}

        {/* Opportunities Grid */}
        {opportunities.length > 0 && (
          <>
            <Grid mb="xl">
              {opportunities.map((call) => (
                <Grid.Col key={call.id} span={{ base: 12, lg: 6 }}>
                  <CallCard call={call} />
                </Grid.Col>
              ))}
            </Grid>

            {/* Load More / Pagination */}
            {hasMore && (
              <Center mb="xl">
                <Button
                  variant="light"
                  size="lg"
                  onClick={loadMore}
                  loading={loadingMore}
                  leftSection={<IconPlus size={16} />}
                >
                  Load More Opportunities
                </Button>
              </Center>
            )}

            {!hasMore && opportunities.length > 0 && (
              <Center mb="xl">
                <Text size="sm" c="dimmed">
                  You've reached the end of the list
                </Text>
              </Center>
            )}
          </>
        )}

        {/* Call/Project Detail Preview */}
        <CallProjectPreview
          opportunity={selectedCall}
          opened={!!selectedCall}
          onClose={() => setSelectedCall(null)}
          showApplyButton={false}
          isSuperAdmin={true}
          onStatusUpdate={handleUpdateStatus}
        />
      </Box>
    </SuperAdminDashboardLayout>
  );
}

