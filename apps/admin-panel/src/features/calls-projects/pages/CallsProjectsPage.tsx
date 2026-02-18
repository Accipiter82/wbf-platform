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
  Modal,
  Textarea,
  NumberInput,
  Avatar,
  Title,
  Checkbox,
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
  IconMessage,
  IconX,
  IconBuilding,
  IconChevronUp,
  IconChevronDown,
  IconSortAscending,
  IconRefresh,
  IconAdjustments,
  IconClock,
  IconAlertCircle,
} from "@tabler/icons-react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import {
  opportunityService,
  GetAllOpportunitiesParams,
} from "../../../services/opportunityService";
import {
  createOpportunity,
  applyToOpportunity,
} from "../../../services/opportunitiesService";
import { messagingService } from "../../../services/messagingService";
import { CallProjectPreview } from "../components/CallProjectPreview";
import axios from "axios";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api";

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
}

// Live options are below; data will be loaded from backend API

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

export default function CallsProjectsPage() {
  const theme = useMantineTheme();
  const { user, organisation } = useSelector((s: RootState) => s.auth);

  // Main data state
  const [opportunities, setOpportunities] = useState<UICall[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // UI state
  const [selectedCall, setSelectedCall] = useState<UICall | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtering and sorting state
  const [sortBy, setSortBy] = useState<string>("deadline-asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<string>("");
  const [organisations, setOrganisations] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedThematicAreas, setSelectedThematicAreas] = useState<string[]>(
    []
  );
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    ("active" | "closed" | "draft")[]
  >(["active", "closed"]);
  const [selectedTypes, setSelectedTypes] = useState<("call" | "project")[]>(
    []
  );
  const [includeFinished, setIncludeFinished] = useState(false);
  const [budgetMin, setBudgetMin] = useState<number | undefined>();
  const [budgetMax, setBudgetMax] = useState<number | undefined>();
  const [deadlineFrom, setDeadlineFrom] = useState<Date | null>(null);
  const [deadlineTo, setDeadlineTo] = useState<Date | null>(null);

  // Pagination
  const itemsPerPage = 12;

  // Fetch organisations for filter
  useEffect(() => {
    const fetchOrganisations = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/organisation/browse`, {
          params: { page: 1, limit: 100 },
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
  }, []);

  // Publish form state
  const [publishType, setPublishType] = useState<"call" | "project">("call");
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishBudgetMin, setPublishBudgetMin] = useState<number | string>(0);
  const [publishBudgetMax, setPublishBudgetMax] = useState<number | string>(
    100000
  );
  const [publishCurrency, setPublishCurrency] = useState("EUR");
  const [publishDeadline, setPublishDeadline] = useState<Date | null>(null);
  const [publishLocation, setPublishLocation] = useState("");
  const [publishThematicAreas, setPublishThematicAreas] = useState<string[]>(
    []
  );
  const [publishExpertise, setPublishExpertise] = useState<string[]>([]);
  const [publishDuration, setPublishDuration] = useState("");
  const [publishMaxPartners, setPublishMaxPartners] = useState<number | string>(
    ""
  );
  // Call-specific
  const [callShortDescription, setCallShortDescription] = useState("");
  const [callType, setCallType] = useState("");
  const [callEligibleRegions, setCallEligibleRegions] = useState<string[]>([]);
  const [callOpeningDate, setCallOpeningDate] = useState<Date | null>(
    new Date()
  );
  const [callEvaluationPeriod, setCallEvaluationPeriod] = useState("");
  const [callExpectedStartDate, setCallExpectedStartDate] =
    useState<Date | null>(null);
  const [callEligibilityCriteria, setCallEligibilityCriteria] = useState("");
  const [callNumberOfAwards, setCallNumberOfAwards] = useState<number | string>(
    ""
  );
  const [callApplicationLink, setCallApplicationLink] = useState("");
  const [callRequiredDocuments, setCallRequiredDocuments] = useState(""); // one per line
  const [callContactName, setCallContactName] = useState("");
  const [callContactEmail, setCallContactEmail] = useState("");
  const [callContactPhone, setCallContactPhone] = useState("");
  const [callGuidelinePdfUrl, setCallGuidelinePdfUrl] = useState("");
  const [callFaqLink, setCallFaqLink] = useState("");
  const [callVisibility, setCallVisibility] = useState<"public" | "members">(
    "public"
  );
  // Project-specific
  const [projShortSummary, setProjShortSummary] = useState("");
  const [projCategory, setProjCategory] = useState("");
  const [projTags, setProjTags] = useState(""); // comma separated
  const [projStartDate, setProjStartDate] = useState<Date | null>(null);
  const [projEndDate, setProjEndDate] = useState<Date | null>(null);
  const [projOngoing, setProjOngoing] = useState(false);
  const [projStatus, setProjStatus] = useState<
    "planned" | "ongoing" | "completed"
  >("planned");
  const [projPartnerNames, setProjPartnerNames] = useState(""); // one per line
  const [projFundingSource, setProjFundingSource] = useState("");
  const [projBudgetVisibility, setProjBudgetVisibility] = useState<
    "public" | "private"
  >("public");
  const [projOutcomes, setProjOutcomes] = useState("");
  const [projGalleryUrls, setProjGalleryUrls] = useState(""); // one per line
  const [projVideoUrls, setProjVideoUrls] = useState(""); // one per line
  const [projReportUrls, setProjReportUrls] = useState(""); // one per line
  const [projManagerName, setProjManagerName] = useState("");
  const [projManagerEmail, setProjManagerEmail] = useState("");
  const [projManagerPhone, setProjManagerPhone] = useState("");
  const [projWebsite, setProjWebsite] = useState("");
  const [projVisibility, setProjVisibility] = useState<"public" | "members">(
    "public"
  );

  // Load opportunities with enhanced filtering and sorting
  const loadOpportunities = async (resetPage = false) => {
    try {
      if (resetPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Filter out "draft" status - only show active and closed
      const filteredStatus = selectedStatus.filter(s => s !== "draft");
      
      const params: GetAllOpportunitiesParams = {
        page: resetPage
          ? 1
          : Math.floor(opportunities.length / itemsPerPage) + 1,
        limit: itemsPerPage,
        sortBy,
        includeFinished,
        status: filteredStatus.length > 0 ? filteredStatus : ["active", "closed"],
        type: selectedTypes.length === 1 ? selectedTypes[0] : undefined,
        thematicAreas:
          selectedThematicAreas.length > 0 ? selectedThematicAreas : undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
        budgetMin,
        budgetMax,
        searchTerm: searchTerm.trim() || undefined,
        organisationId: selectedOrganisationId || undefined,
      };

      const result = await opportunityService.getAllOpportunities(params);

      const mapped: UICall[] = result.opportunities.map((op: any) => {
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
          // Extended fields for preview
          shortDescription: op.shortDescription,
          callType: op.callType,
          eligibleRegions: op.eligibleRegions,
          openingDate: op.openingDate?._seconds
            ? new Date(op.openingDate._seconds * 1000)
            : undefined,
          evaluationPeriod: op.evaluationPeriod,
          expectedStartDate: op.expectedStartDate?._seconds
            ? new Date(op.expectedStartDate._seconds * 1000)
            : undefined,
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
          startDate: op.startDate?._seconds
            ? new Date(op.startDate._seconds * 1000)
            : undefined,
          endDate: op.endDate?._seconds
            ? new Date(op.endDate._seconds * 1000)
            : undefined,
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

      setHasMore(result.pagination.page < result.pagination.totalPages);
    } catch (error) {
      console.error("Error loading opportunities:", error);
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
    }, 300); // Debounce search

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
    setSelectedStatus(["active", "closed"]);
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

      {/* Header */}
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

      {/* Title and Description */}
      <Text size="lg" fw={600} mb="xs" lineClamp={2}>
        {call.title}
      </Text>
      <Text size="sm" c="dimmed" mb="md" lineClamp={3}>
        {call.description}
      </Text>

      {/* Thematic Areas */}
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

      {/* Key Info */}
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
          <Group gap="xs">
            <IconUsers size={14} />
            <Text size="sm" c="dimmed">
              {call.maxPartners} partners max
            </Text>
          </Group>
        </Group>
      </Stack>

      {/* Applications Count */}
      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">
          {call.applicationsCount} applications received
        </Text>
        <Text size="sm" c="dimmed">
          {call.projectDuration}
        </Text>
      </Group>

      {/* Action Buttons */}
      <Group gap="xs">
        <Button
          variant="light"
          size="sm"
          leftSection={<IconEye size={14} />}
          style={{ flex: 1 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedCall(call);
          }}
        >
          View Details
        </Button>
        {call.createdByOrganisationId !== organisation?.id && (
          <Button
            size="sm"
            leftSection={<IconMessage size={14} />}
            style={{ flex: 1 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowApplyModal(true);
            }}
          >
            Apply Now
          </Button>
        )}
      </Group>
    </Card>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <Box mb="xl">
        <Title order={1} size="2.5rem" mb="xs" c={theme.colors.gray[8]}>
          Calls & Projects
        </Title>
        <Text size="lg" c="dimmed">
          Discover partnership opportunities from organizations worldwide
        </Text>
      </Box>

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
              value={selectedStatus.filter(s => s !== "draft")}
              onChange={(value) =>
                setSelectedStatus(value as ("active" | "closed" | "draft")[])
              }
              data={[
                { value: "active", label: "Active" },
                { value: "closed", label: "Closed" },
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
              : `Showing ${opportunities.length} opportunities`}
          </Text>
          {!includeFinished && (
            <Badge size="sm" variant="light" color="orange">
              Finished Hidden
            </Badge>
          )}
          {selectedStatus.length < 3 && (
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
        onApply={() => setShowApplyModal(true)}
        showApplyButton={true}
        currentOrganisationId={organisation?.id}
      />

      {/* Publish Call Modal */}
      <Modal
        opened={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        size="lg"
        centered
        overlayProps={{
          opacity: 0.55,
          blur: 3,
        }}
        styles={{
          header: {
            zIndex: 1001,
          },
          overlay: {
            zIndex: 1000,
          },
          inner: {
            zIndex: 1000,
          },
          content: {
            zIndex: 1001,
          },
        }}
        title="Publish New Call"
      >
        <Stack gap="md">
          <Select
            label="Type"
            data={[
              { value: "call", label: "Call" },
              { value: "project", label: "Project" },
            ]}
            value={publishType}
            onChange={(v) => setPublishType((v as any) || "call")}
            required
          />
          {/* Shared basic details */}
          <TextInput
            label="Call Title"
            placeholder="Enter the title of your call"
            value={publishTitle}
            onChange={(e) => setPublishTitle(e.currentTarget.value)}
            required
          />
          <Textarea
            label="Description"
            placeholder="Describe your call or project in detail"
            minRows={8}
            value={publishDescription}
            onChange={(e) => setPublishDescription(e.currentTarget.value)}
            required
          />

          {/* CALL form */}
          {publishType === "call" && (
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
                    label="Deadline"
                    placeholder="Select deadline"
                    value={publishDeadline as any}
                    onChange={(v) => setPublishDeadline(v ? (v as any) : null)}
                    required
                  />
                </Grid.Col>
              </Grid>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Evaluation Period"
                    placeholder="e.g., 4 weeks"
                    value={callEvaluationPeriod}
                    onChange={(e) =>
                      setCallEvaluationPeriod(e.currentTarget.value)
                    }
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <DateInput
                    label="Expected Award/Start Date"
                    value={callExpectedStartDate as any}
                    onChange={(v) =>
                      setCallExpectedStartDate(v ? (v as any) : null)
                    }
                  />
                </Grid.Col>
              </Grid>
              <Textarea
                label="Eligibility Criteria"
                placeholder="Who can apply?"
                minRows={4}
                value={callEligibilityCriteria}
                onChange={(e) =>
                  setCallEligibilityCriteria(e.currentTarget.value)
                }
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
                    onChange={(e) =>
                      setCallApplicationLink(e.currentTarget.value)
                    }
                  />
                </Grid.Col>
              </Grid>
              <Textarea
                label="Required Documents"
                placeholder="One per line (e.g., Proposal.pdf)"
                minRows={3}
                value={callRequiredDocuments}
                onChange={(e) =>
                  setCallRequiredDocuments(e.currentTarget.value)
                }
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
                    onChange={(e) =>
                      setCallGuidelinePdfUrl(e.currentTarget.value)
                    }
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
              <Select
                label="Visibility"
                data={[
                  { value: "public", label: "Public" },
                  { value: "members", label: "Members only" },
                ]}
                value={callVisibility}
                onChange={(v) =>
                  setCallVisibility(((v as any) || "public") as any)
                }
              />
            </Stack>
          )}

          {/* PROJECT form */}
          {publishType === "project" && (
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
                onChange={(v) =>
                  setProjStatus(((v as any) || "planned") as any)
                }
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
                onChange={(v) =>
                  setProjBudgetVisibility(((v as any) || "public") as any)
                }
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
              <Textarea
                label="Photo URLs"
                placeholder="One per line"
                minRows={3}
                value={projGalleryUrls}
                onChange={(e) => setProjGalleryUrls(e.currentTarget.value)}
              />
              <Textarea
                label="Video URLs"
                placeholder="One per line"
                minRows={3}
                value={projVideoUrls}
                onChange={(e) => setProjVideoUrls(e.currentTarget.value)}
              />
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
                onChange={(v) =>
                  setProjVisibility(((v as any) || "public") as any)
                }
              />
            </Stack>
          )}
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
            required
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
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowPublishModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!publishDeadline || !organisation || !user) return;
                try {
                  await createOpportunity({
                    type: publishType,
                    title: publishTitle.trim(),
                    description: publishDescription.trim(),
                    organisation: {
                      id: organisation.id,
                      name: organisation.name,
                      logo: organisation.images?.logo,
                    },
                    budget: {
                      min: Number(publishBudgetMin) || 0,
                      max: Number(publishBudgetMax) || 0,
                      currency: publishCurrency,
                    },
                    deadline: publishDeadline,
                    location: publishLocation.trim(),
                    thematicAreas: publishThematicAreas,
                    requiredExpertise: publishExpertise,
                    projectDuration: publishDuration || undefined,
                    maxPartners: publishMaxPartners
                      ? Number(publishMaxPartners)
                      : undefined,
                    status: "active",
                    createdByUserId: user.id,
                    createdByOrganisationId: organisation.id,
                    // Calls
                    shortDescription:
                      publishType === "call"
                        ? callShortDescription || undefined
                        : undefined,
                    callType:
                      publishType === "call"
                        ? callType || undefined
                        : undefined,
                    eligibleRegions:
                      publishType === "call" ? callEligibleRegions : undefined,
                    openingDate:
                      publishType === "call"
                        ? callOpeningDate || undefined
                        : undefined,
                    evaluationPeriod:
                      publishType === "call"
                        ? callEvaluationPeriod || undefined
                        : undefined,
                    expectedStartDate:
                      publishType === "call"
                        ? callExpectedStartDate || undefined
                        : undefined,
                    eligibilityCriteria:
                      publishType === "call"
                        ? callEligibilityCriteria || undefined
                        : undefined,
                    numberOfAwards:
                      publishType === "call"
                        ? callNumberOfAwards
                          ? Number(callNumberOfAwards)
                          : undefined
                        : undefined,
                    applicationLink:
                      publishType === "call"
                        ? callApplicationLink || undefined
                        : undefined,
                    requiredDocuments:
                      publishType === "call"
                        ? callRequiredDocuments
                          ? callRequiredDocuments
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : []
                        : undefined,
                    contact:
                      publishType === "call"
                        ? {
                            name: callContactName || undefined,
                            email: callContactEmail || undefined,
                            phone: callContactPhone || undefined,
                          }
                        : undefined,
                    guidelinePdfUrl:
                      publishType === "call"
                        ? callGuidelinePdfUrl || undefined
                        : undefined,
                    faqLink:
                      publishType === "call"
                        ? callFaqLink || undefined
                        : undefined,
                    visibility:
                      publishType === "call" ? callVisibility : projVisibility,
                    // Projects
                    shortSummary:
                      publishType === "project"
                        ? projShortSummary || undefined
                        : undefined,
                    category:
                      publishType === "project"
                        ? projCategory || undefined
                        : undefined,
                    tags:
                      publishType === "project"
                        ? projTags
                          ? projTags
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean)
                          : []
                        : undefined,
                    startDate:
                      publishType === "project"
                        ? projStartDate || undefined
                        : undefined,
                    endDate:
                      publishType === "project"
                        ? projOngoing
                          ? undefined
                          : projEndDate || undefined
                        : undefined,
                    ongoing:
                      publishType === "project" ? projOngoing : undefined,
                    projectStatus:
                      publishType === "project" ? projStatus : undefined,
                    leadOrganisationId:
                      publishType === "project" ? organisation.id : undefined,
                    leadOrganisationName:
                      publishType === "project" ? organisation.name : undefined,
                    partnerOrganisationNames:
                      publishType === "project"
                        ? projPartnerNames
                          ? projPartnerNames
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : []
                        : undefined,
                    fundingSource:
                      publishType === "project"
                        ? projFundingSource || undefined
                        : undefined,
                    budgetVisibility:
                      publishType === "project"
                        ? projBudgetVisibility
                        : undefined,
                    outcomes:
                      publishType === "project"
                        ? projOutcomes || undefined
                        : undefined,
                    galleryUrls:
                      publishType === "project"
                        ? projGalleryUrls
                          ? projGalleryUrls
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : []
                        : undefined,
                    videoUrls:
                      publishType === "project"
                        ? projVideoUrls
                          ? projVideoUrls
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : []
                        : undefined,
                    reportUrls:
                      publishType === "project"
                        ? projReportUrls
                          ? projReportUrls
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : []
                        : undefined,
                    projectManager:
                      publishType === "project"
                        ? {
                            name: projManagerName || undefined,
                            email: projManagerEmail || undefined,
                            phone: projManagerPhone || undefined,
                          }
                        : undefined,
                    website:
                      publishType === "project"
                        ? projWebsite || undefined
                        : undefined,
                  });
                  setShowPublishModal(false);
                  // Reset form
                  setPublishType("call");
                  setPublishTitle("");
                  setPublishDescription("");
                  setPublishBudgetMin(0);
                  setPublishBudgetMax(100000);
                  setPublishCurrency("EUR");
                  setPublishDeadline(null);
                  setPublishLocation("");
                  setPublishThematicAreas([]);
                  setPublishExpertise([]);
                  setPublishDuration("");
                  setPublishMaxPartners("");
                  setCallShortDescription("");
                  setCallType("");
                  setCallEligibleRegions([]);
                  setCallOpeningDate(new Date());
                  setCallEvaluationPeriod("");
                  setCallExpectedStartDate(null);
                  setCallEligibilityCriteria("");
                  setCallNumberOfAwards("");
                  setCallApplicationLink("");
                  setCallRequiredDocuments("");
                  setCallContactName("");
                  setCallContactEmail("");
                  setCallContactPhone("");
                  setCallGuidelinePdfUrl("");
                  setCallFaqLink("");
                  setCallVisibility("public");
                  setProjShortSummary("");
                  setProjCategory("");
                  setProjTags("");
                  setProjStartDate(null);
                  setProjEndDate(null);
                  setProjOngoing(false);
                  setProjStatus("planned");
                  setProjPartnerNames("");
                  setProjFundingSource("");
                  setProjBudgetVisibility("public");
                  setProjOutcomes("");
                  setProjGalleryUrls("");
                  setProjVideoUrls("");
                  setProjReportUrls("");
                  setProjManagerName("");
                  setProjManagerEmail("");
                  setProjManagerPhone("");
                  setProjWebsite("");
                  setProjVisibility("public");
                } catch (e) {
                  console.error("Failed to publish opportunity", e);
                }
              }}
            >
              Publish
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Apply Modal */}
      <Modal
        opened={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        size="lg"
        centered
        overlayProps={{
          opacity: 0.55,
          blur: 3,
        }}
        styles={{
          header: {
            zIndex: 1001,
          },
          overlay: {
            zIndex: 1000,
          },
          inner: {
            zIndex: 1000,
          },
          content: {
            zIndex: 1001,
          },
        }}
        title="Apply to Opportunity"
      >
        <Stack gap="md">
          {organisation && (
            <Box>
              <Text size="sm" c="dimmed">
                Applying as {organisation.name} ({organisation.contact?.email})
              </Text>
            </Box>
          )}
          <Textarea
            label="Message"
            placeholder="Introduce your organisation and explain why you're a good fit"
            minRows={4}
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.currentTarget.value)}
            required
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button
              leftSection={<IconMessage size={16} />}
              onClick={async () => {
                if (!selectedCall || !user) return;
                try {
                  // Save to original applications collection
                  await applyToOpportunity({
                    opportunityId: selectedCall.id,
                    message: applyMessage.trim(),
                    applicantUserId: user.id,
                    applicantOrganisationId: organisation?.id,
                    applicantName: organisation?.contact?.personName,
                    applicantEmail: organisation?.contact?.email,
                  });

                  // Create conversation in messaging system
                  await messagingService.createApplicationMessage(
                    selectedCall.organisation.id,
                    selectedCall.id,
                    selectedCall.title,
                    selectedCall.type,
                    applyMessage.trim()
                  );

                  // Create notification for call/project owner
                  await messagingService.createActivityNotification(
                    selectedCall.organisation.id,
                    selectedCall.type === "call"
                      ? "call_application"
                      : "project_application",
                    {
                      callId: selectedCall.id,
                      callTitle: selectedCall.title,
                      applicationType: selectedCall.type,
                    }
                  );

                  setShowApplyModal(false);
                  setApplyMessage("");

                  // Show success message
                  alert(
                    "Application sent successfully! You can track it in Messages."
                  );
                } catch (e) {
                  console.error("Failed to apply", e);
                  alert("Failed to send application. Please try again.");
                }
              }}
            >
              Send Application
            </Button>
          </Group>
        </Stack>
      </Modal>
    </DashboardLayout>
  );
}
