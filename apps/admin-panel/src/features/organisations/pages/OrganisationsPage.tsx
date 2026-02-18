import { useState, useEffect, useRef, useMemo } from "react";
import {
  Container,
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
  Select,
  MultiSelect,
  Collapse,
  Divider,
  useMantineTheme,
  ActionIcon,
  Image,
  Avatar,
  Pagination,
  Loader,
  NumberInput,
} from "@mantine/core";
import {
  IconSearch,
  IconFilter,
  IconBuilding,
  IconMapPin,
  IconUsers,
  IconBriefcase,
  IconEye,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconCalendar,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store";
import { fetchOrganisations } from "../../../store/slices/organisationSlice";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { missionFields } from "../../../data/profileOptions";
import {
  COUNTRIES,
  ORGANISATION_TYPES,
  ORGANISATION_STATUS,
  THEMATIC_AREAS,
  EXPERTISE_OFFERED,
  EXPERTISE_SOUGHT,
  PREFERRED_ROLES,
  GEOGRAPHICAL_COVERAGE,
  AVAILABLE_RESOURCES,
  FUNDING_SOURCES,
  BUDGET_VISIBILITY,
  PROJECT_VISIBILITY,
  PROJECT_STATUS,
} from "../../../utils/constants";

interface Organisation {
  id: string;
  name: string;
  nameLocal?: string;
  type: string;
  status: string;
  createdAt?: any;
  updatedAt?: any;
  isFavorite?: boolean;
  images: {
    cover: string;
    logo: string;
  };
  contact: {
    email: string;
    phone: string;
    personName: string;
    personPosition: string;
    address: string;
    website: string;
    socialMedia: string[];
  };
  profile: {
    city: string;
    country: string;
    contractingParty: string;
    registrationNumber: string;
    yearOfEstablishment: number;
    numberOfStaff: number;
    numberOfVolunteers: number | string;
    profileCompleted: boolean;
    profileCompletedAt?: any;
    approvedAt?: any;
  };
  fields: {
    missionFields: string[];
    keywords: string[];
    availableResources: string[];
    expertiseOffered: string[];
    expertiseSought: string[];
    preferredRole: string[];
    geographicalCoverage: string[];
    lookingForPartnersFromCPs: string[];
    lookingForPartnersInThematicAreas: string[];
  };
  projects: any[];
  wbfCallsApplied: any[];
  successStories: any[];
  referenceProjects: any[];
  roleInPastApplications: string[];
}

export default function OrganisationsPage() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { organisations, pagination, isLoading } = useSelector(
    (state: RootState) => state.organisation
  );

  // Filters and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedMissionFields, setSelectedMissionFields] = useState<string[]>(
    []
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [hasActiveCall, setHasActiveCall] = useState<"all" | "active" | "inactive">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Advanced filters state
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedContractingParty, setSelectedContractingParty] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [minYear, setMinYear] = useState<number | null>(null);
  const [maxYear, setMaxYear] = useState<number | null>(null);
  const [minStaff, setMinStaff] = useState<number | null>(null);
  const [maxStaff, setMaxStaff] = useState<number | null>(null);
  const [minVolunteers, setMinVolunteers] = useState<number | null>(null);
  const [maxVolunteers, setMaxVolunteers] = useState<number | null>(null);
  const [selectedThematicArea, setSelectedThematicArea] = useState<string>("");
  const [selectedExpertiseOffered, setSelectedExpertiseOffered] =
    useState<string>("");
  const [selectedExpertiseSought, setSelectedExpertiseSought] =
    useState<string>("");
  const [selectedPreferredRole, setSelectedPreferredRole] =
    useState<string>("");
  const [selectedGeographicalCoverage, setSelectedGeographicalCoverage] =
    useState<string>("");
  const [
    selectedLookingForPartnersFromCPs,
    setSelectedLookingForPartnersFromCPs,
  ] = useState<string>("");
  const [
    selectedLookingForPartnersInThematicAreas,
    setSelectedLookingForPartnersInThematicAreas,
  ] = useState<string>("");
  const [selectedAvailableResources, setSelectedAvailableResources] =
    useState<string>("");
  const [selectedProjectStatus, setSelectedProjectStatus] =
    useState<string>("");
  const [selectedFundingSource, setSelectedFundingSource] =
    useState<string>("");
  const [selectedBudgetVisibility, setSelectedBudgetVisibility] =
    useState<string>("");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("");
  const isRequestInFlight = useRef(false);
  const lastParamsRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize params to prevent unnecessary effect triggers
  const params = useMemo(() => {
    const p: any = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (selectedCountries.length > 0) p.country = selectedCountries[0];
    if (selectedType) p.sector = selectedType;
    if (selectedStatus) p.status = selectedStatus;
    if (selectedCity) p.city = selectedCity;
    if (selectedContractingParty) p.contractingParty = selectedContractingParty;
    if (selectedSector) p.sector = selectedSector;
    if (minYear) p.minYear = minYear;
    if (maxYear) p.maxYear = maxYear;
    if (minStaff) p.minStaff = minStaff;
    if (maxStaff) p.maxStaff = maxStaff;
    if (minVolunteers) p.minVolunteers = minVolunteers;
    if (maxVolunteers) p.maxVolunteers = maxVolunteers;
    if (selectedThematicArea) p.thematicArea = selectedThematicArea;
    if (selectedExpertiseOffered) p.expertiseOffered = selectedExpertiseOffered;
    if (selectedExpertiseSought) p.expertiseSought = selectedExpertiseSought;
    if (selectedPreferredRole) p.preferredRole = selectedPreferredRole;
    if (selectedGeographicalCoverage) p.geographicalCoverage = selectedGeographicalCoverage;
    if (selectedLookingForPartnersFromCPs) p.lookingForPartnersFromCPs = selectedLookingForPartnersFromCPs;
    if (selectedLookingForPartnersInThematicAreas) p.lookingForPartnersInThematicAreas = selectedLookingForPartnersInThematicAreas;
    if (selectedAvailableResources) p.availableResources = selectedAvailableResources;
    if (selectedProjectStatus) p.projectStatus = selectedProjectStatus;
    if (selectedFundingSource) p.fundingSource = selectedFundingSource;
    if (selectedBudgetVisibility) p.budgetVisibility = selectedBudgetVisibility;
    if (selectedVisibility) p.visibility = selectedVisibility;
    if (searchTerm) p.search = searchTerm;
    // Always send byCall parameter
    if (hasActiveCall === "active") {
      p.byCall = "hasCallsOrProjects";
    } else if (hasActiveCall === "inactive") {
      p.byCall = "noCallsOrProjects";
    } else {
      p.byCall = "all";
    }
    return p;
  }, [
    currentPage,
    itemsPerPage,
    selectedCountries,
    selectedType,
    selectedStatus,
    selectedCity,
    selectedContractingParty,
    selectedSector,
    minYear,
    maxYear,
    minStaff,
    maxStaff,
    minVolunteers,
    maxVolunteers,
    selectedThematicArea,
    selectedExpertiseOffered,
    selectedExpertiseSought,
    selectedPreferredRole,
    selectedGeographicalCoverage,
    selectedLookingForPartnersFromCPs,
    selectedLookingForPartnersInThematicAreas,
    selectedAvailableResources,
    selectedProjectStatus,
    selectedFundingSource,
    selectedBudgetVisibility,
    selectedVisibility,
    searchTerm,
    hasActiveCall,
  ]);

  // Fetch organisations from backend when params change
  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Skip if already loading or request in flight
    if (isLoading || isRequestInFlight.current) return;
    
    // Create a string representation of params to compare
    const paramsString = JSON.stringify(params);
    
    // Skip if params haven't changed and we already have data
    if (lastParamsRef.current === paramsString && organisations.length > 0) {
      return;
    }
    
    // Debounce: longer for search (800ms), shorter for filters (300ms)
    const debounceDelay = searchTerm ? 800 : 300;
    
    timeoutRef.current = setTimeout(() => {
      // Double-check conditions after debounce
      if (isLoading || isRequestInFlight.current) return;
      
      // Re-check params string in case it changed during debounce
      const currentParamsString = JSON.stringify(params);
      if (lastParamsRef.current === currentParamsString && organisations.length > 0) {
        return;
      }
      
      lastParamsRef.current = currentParamsString;
      isRequestInFlight.current = true;
      
      dispatch(fetchOrganisations(params) as any).finally(() => {
        isRequestInFlight.current = false;
      });
    }, debounceDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, dispatch, searchTerm]);

  // Client-side filter for missionFields, search, and favorites (if not handled by backend)
  const filteredOrganisations = organisations.filter((org: any) => {
    // Filter by favorites if enabled
    if (showFavoritesOnly && !org.isFavorite) {
      return false;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !(
          org.name.toLowerCase().includes(term) ||
          org.nameLocal?.toLowerCase().includes(term) ||
          org.profile.city?.toLowerCase().includes(term) ||
          (org.fields.keywords || []).some((keyword: string) =>
            keyword.toLowerCase().includes(term)
          )
        )
      ) {
        return false;
      }
    }
    if (selectedMissionFields.length > 0) {
      if (
        !selectedMissionFields.some((field) =>
          (org.fields.missionFields || []).includes(field)
        )
      ) {
        return false;
      }
    }
    return true;
  });

  // Pagination
  const paginatedOrganisations = filteredOrganisations;
  const totalCount = pagination?.total || organisations.length;
  const totalPages = pagination?.totalPages || 1;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType(null);
    setSelectedMissionFields([]);
    setSelectedCountries([]);
    setHasActiveCall("all");
    setShowFavoritesOnly(false);
    setSelectedStatus("");
    setSelectedCity("");
    setSelectedContractingParty("");
    setSelectedSector("");
    setMinYear(null);
    setMaxYear(null);
    setMinStaff(null);
    setMaxStaff(null);
    setMinVolunteers(null);
    setMaxVolunteers(null);
    setSelectedThematicArea("");
    setSelectedExpertiseOffered("");
    setSelectedExpertiseSought("");
    setSelectedPreferredRole("");
    setSelectedGeographicalCoverage("");
    setSelectedLookingForPartnersFromCPs("");
    setSelectedLookingForPartnersInThematicAreas("");
    setSelectedAvailableResources("");
    setSelectedProjectStatus("");
    setSelectedFundingSource("");
    setSelectedBudgetVisibility("");
    setSelectedVisibility("");
    setCurrentPage(1);
  };

  const { token } = useSelector((state: RootState) => state.auth);

  // Handle favorite toggle
  const handleToggleFavorite = async (e: React.MouseEvent, orgId: string) => {
    e.stopPropagation();
    
    // Call backend API
    try {
      const organisation = organisations.find((org: any) => org.id === orgId) as Organisation | undefined;
      const isFavorited = (organisation as any)?.isFavorite || false;
      const method = isFavorited ? 'DELETE' : 'POST';
      
      const response = await fetch(
        `${(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api'}/organisation/favorites/${orgId}`,
        {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        // Force refetch by clearing the last params ref and fetching directly
        lastParamsRef.current = "";
        isRequestInFlight.current = true;
        dispatch(fetchOrganisations(params) as any).finally(() => {
          isRequestInFlight.current = false;
        });
      } else {
        console.error("Failed to toggle favorite:", data.error);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const OrganisationCard = ({
    organisation,
  }: {
    organisation: Organisation;
  }) => {
    const isFavorited = organisation.isFavorite || false;
    
    return (
      <Card
        shadow="sm"
        radius="md"
        withBorder
        style={{
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.shadows.lg,
          },
        }}
        onClick={() => navigate(`/organisations/${organisation.id}`)}
      >
        {/* Cover Image with Logo Overlap */}
        <Card.Section>
          <Box
            style={{
              height: 120,
              background: `linear-gradient(135deg, ${theme.colors.blue[6]}15, ${theme.colors.green[6]}15)`,
              position: "relative",
              overflow: "visible",
            }}
          >
            {organisation.images.cover && (
              <Image
                src={organisation.images.cover}
                alt={organisation.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
            {/* Favorite Button */}
            <ActionIcon
              variant="filled"
              color={isFavorited ? "yellow" : "gray"}
              size="lg"
              radius="xl"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(e, organisation.id);
              }}
            >
              {isFavorited ? (
                <IconStarFilled size={20} style={{ color: "#fff" }} />
              ) : (
                <IconStar size={20} style={{ color: "#fff" }} />
              )}
            </ActionIcon>
            {/* Logo Overlapping Cover */}
            <Avatar
              src={organisation.images.logo}
              size={64}
              radius={48}
              style={{
                position: "absolute",
                left: 24,
                bottom: -32,
                border: "3px solid white",
                background: theme.colors.gray[2],
                zIndex: 3,
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              }}
              styles={{
                image: {
                  objectFit: "contain"
                }
              }}
            >
              <IconBuilding size={28} />
            </Avatar>
          </Box>
        </Card.Section>
      <Box style={{ height: 40 }} />
      <Box style={{ textAlign: "left" }}>
        <Text size="lg" fw={600} mb={4}>
          {organisation.name}
        </Text>
        {organisation.nameLocal && (
          <Text size="sm" c="dimmed" mb={8}>
            {organisation.nameLocal}
          </Text>
        )}
        <Group gap={6} mb={12}>
          {(organisation.fields.missionFields || [])
            .slice(0, 2)
            .map((field, index) => (
              <Badge key={index} size="sm" variant="light" color="blue">
                {field}
              </Badge>
            ))}
          {organisation.fields.missionFields &&
            organisation.fields.missionFields.length > 2 && (
              <Badge size="sm" variant="light" color="gray">
                +{organisation.fields.missionFields.length - 2}
              </Badge>
            )}
        </Group>
        <Stack gap={8} mb={12}>
          <Group gap={4} align="center">
            <IconMapPin size={14} />
            <Text size="sm" c="dimmed">
              {organisation.profile.city}
            </Text>
          </Group>
          {organisation.profile.contractingParty && (
            <Group gap={4} align="center">
              <IconBuilding size={14} />
              <Text size="sm" c="dimmed">
                {organisation.profile.contractingParty}
              </Text>
            </Group>
          )}
          <Group gap={16}>
            <Group gap={4} align="center">
              <IconBriefcase size={14} />
              <Text size="sm" c="dimmed">
                Est. {organisation.profile.yearOfEstablishment}
              </Text>
            </Group>
            <Group gap={4} align="center">
              <IconUsers size={14} />
              <Text size="sm" c="dimmed">
                {organisation.profile.numberOfStaff} staff
              </Text>
            </Group>
          </Group>
        </Stack>
      </Box>
      <Button
        variant="light"
        fullWidth
        rightSection={<IconEye size={14} />}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/organisations/${organisation.id}`);
        }}
        mt={8}
        style={{ marginTop: 12 }}
      >
        View Details
      </Button>
    </Card>
    );
  };

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        {/* Header */}
        <Box mb="xl">
          <Title order={1} size="2.5rem" mb="xs" c={theme.colors.gray[8]}>
            Organisations
          </Title>
          <Text size="lg" c="dimmed">
            Discover and connect with organisations across Europe
          </Text>
        </Box>

        {/* Search and Filters */}
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Stack gap="md">
            {/* Basic Search */}
            <TextInput
              placeholder="Search organisations by name, location, or keywords..."
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
            />

            {/* Most Used Filters */}
            <Group gap="md">
              <TextInput
                placeholder="Filter by city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.currentTarget.value)}
                leftSection={<IconMapPin size={16} />}
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder="Filter by Contracting Party"
                value={selectedContractingParty}
                onChange={(e) => setSelectedContractingParty(e.currentTarget.value)}
                leftSection={<IconBuilding size={16} />}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Organisation Type"
                value={selectedType}
                onChange={setSelectedType}
                data={ORGANISATION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                clearable
                style={{ flex: 1 }}
              />
              <MultiSelect
                placeholder="Mission Fields"
                value={selectedMissionFields}
                onChange={setSelectedMissionFields}
                data={missionFields.map((f) => ({ value: f, label: f }))}
                clearable
                style={{ flex: 1 }}
              />
              <Button
                variant={hasActiveCall === "all" ? "light" : hasActiveCall === "active" ? "filled" : "outline"}
                color={hasActiveCall === "active" ? "green" : hasActiveCall === "inactive" ? "red" : "gray"}
                size="sm"
                onClick={() => {
                  if (hasActiveCall === "all") {
                    setHasActiveCall("active");
                  } else if (hasActiveCall === "active") {
                    setHasActiveCall("inactive");
                  } else {
                    setHasActiveCall("all");
                  }
                }}
                style={{ 
                  flex: "0 0 auto",
                  minWidth: "120px",
                  fontWeight: hasActiveCall !== "all" ? 600 : 400,
                }}
              >
                {hasActiveCall === "all" 
                  ? "All" 
                  : hasActiveCall === "active" 
                    ? "Has Active Call" 
                    : "No Active Call"}
              </Button>
              {token && (
                <Button
                  variant={showFavoritesOnly ? "filled" : "light"}
                  color={showFavoritesOnly ? "yellow" : "gray"}
                  size="sm"
                  leftSection={showFavoritesOnly ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  style={{ 
                    flex: "0 0 auto",
                    minWidth: "120px",
                    fontWeight: showFavoritesOnly ? 600 : 400,
                  }}
                >
                  {showFavoritesOnly ? "Favorites Only" : "All"}
                </Button>
              )}
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
              rightSection={<IconFilter size={16} />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
            </Button>

            {/* Advanced Filters */}
            <Collapse in={showAdvancedFilters}>
              <Stack gap="md">
                <Divider />
                
                {/* Basic Information */}
                <Box>
                  <Text fw={600} size="sm" mb="md" c="dimmed">
                    BASIC INFORMATION
                  </Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Status"
                        data={ORGANISATION_STATUS}
                        value={selectedStatus}
                        onChange={(value) => setSelectedStatus(value || "")}
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Type"
                        data={ORGANISATION_TYPES}
                        value={selectedType || ""}
                        onChange={(value) => setSelectedType(value)}
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <NumberInput
                        placeholder="Min Year"
                        value={minYear || undefined}
                        onChange={(value) =>
                          setMinYear(typeof value === "number" ? value : null)
                        }
                        min={1900}
                        max={new Date().getFullYear()}
                        leftSection={<IconCalendar size={16} />}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <NumberInput
                        placeholder="Max Year"
                        value={maxYear || undefined}
                        onChange={(value) =>
                          setMaxYear(typeof value === "number" ? value : null)
                        }
                        min={1900}
                        max={new Date().getFullYear()}
                        leftSection={<IconCalendar size={16} />}
                      />
                    </Grid.Col>
                  </Grid>
                </Box>

                {/* Staff & Volunteers */}
                <Box>
                  <Text fw={600} size="sm" mb="md" c="dimmed">
                    STAFF & VOLUNTEERS
                  </Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <NumberInput
                        placeholder="Min Staff"
                        value={minStaff || undefined}
                        onChange={(value) =>
                          setMinStaff(typeof value === "number" ? value : null)
                        }
                        min={0}
                        leftSection={<IconUsers size={16} />}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <NumberInput
                        placeholder="Max Staff"
                        value={maxStaff || undefined}
                        onChange={(value) =>
                          setMaxStaff(typeof value === "number" ? value : null)
                        }
                        min={0}
                        leftSection={<IconUsers size={16} />}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <NumberInput
                        placeholder="Min Volunteers"
                        value={minVolunteers || undefined}
                        onChange={(value) =>
                          setMinVolunteers(
                            typeof value === "number" ? value : null
                          )
                        }
                        min={0}
                        leftSection={<IconUsers size={16} />}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <NumberInput
                        placeholder="Max Volunteers"
                        value={maxVolunteers || undefined}
                        onChange={(value) =>
                          setMaxVolunteers(
                            typeof value === "number" ? value : null
                          )
                        }
                        min={0}
                        leftSection={<IconUsers size={16} />}
                      />
                    </Grid.Col>
                  </Grid>
                </Box>

                {/* Thematic Areas & Expertise */}
                <Box>
                  <Text fw={600} size="sm" mb="md" c="dimmed">
                    THEMATIC AREAS & EXPERTISE
                  </Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Thematic Area"
                        data={THEMATIC_AREAS}
                        value={selectedThematicArea}
                        onChange={(value) =>
                          setSelectedThematicArea(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Expertise Offered"
                        data={EXPERTISE_OFFERED}
                        value={selectedExpertiseOffered}
                        onChange={(value) =>
                          setSelectedExpertiseOffered(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Expertise Sought"
                        data={EXPERTISE_SOUGHT}
                        value={selectedExpertiseSought}
                        onChange={(value) =>
                          setSelectedExpertiseSought(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Preferred Role"
                        data={PREFERRED_ROLES}
                        value={selectedPreferredRole}
                        onChange={(value) =>
                          setSelectedPreferredRole(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                  </Grid>
                </Box>

                {/* Partnership & Resources */}
                <Box>
                  <Text fw={600} size="sm" mb="md" c="dimmed">
                    PARTNERSHIP & RESOURCES
                  </Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Geographical Coverage"
                        data={GEOGRAPHICAL_COVERAGE}
                        value={selectedGeographicalCoverage}
                        onChange={(value) =>
                          setSelectedGeographicalCoverage(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Looking for Partners From"
                        data={COUNTRIES}
                        value={selectedLookingForPartnersFromCPs}
                        onChange={(value) =>
                          setSelectedLookingForPartnersFromCPs(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Looking for Partners In"
                        data={THEMATIC_AREAS}
                        value={selectedLookingForPartnersInThematicAreas}
                        onChange={(value) =>
                          setSelectedLookingForPartnersInThematicAreas(
                            value || ""
                          )
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Available Resources"
                        data={AVAILABLE_RESOURCES}
                        value={selectedAvailableResources}
                        onChange={(value) =>
                          setSelectedAvailableResources(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                  </Grid>
                </Box>

                {/* Project Information */}
                <Box>
                  <Text fw={600} size="sm" mb="md" c="dimmed">
                    PROJECT INFORMATION
                  </Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Project Status"
                        data={PROJECT_STATUS}
                        value={selectedProjectStatus}
                        onChange={(value) =>
                          setSelectedProjectStatus(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Funding Source"
                        data={FUNDING_SOURCES}
                        value={selectedFundingSource}
                        onChange={(value) =>
                          setSelectedFundingSource(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Budget Visibility"
                        data={BUDGET_VISIBILITY}
                        value={selectedBudgetVisibility}
                        onChange={(value) =>
                          setSelectedBudgetVisibility(value || "")
                        }
                        clearable
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                      <Select
                        placeholder="Project Visibility"
                        data={PROJECT_VISIBILITY}
                        value={selectedVisibility}
                        onChange={(value) => setSelectedVisibility(value || "")}
                        clearable
                      />
                    </Grid.Col>
                  </Grid>
                </Box>

                <Group gap="md">
                  <MultiSelect
                    placeholder="Countries"
                    value={selectedCountries}
                    onChange={setSelectedCountries}
                    data={COUNTRIES.map((c) => ({
                      value: c.value,
                      label: c.label,
                    }))}
                    clearable
                    style={{ flex: 1 }}
                  />
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
          <Text size="sm" c="dimmed">
            Showing {filteredOrganisations.length} of {totalCount} organisations
          </Text>
          {Object.values({
            searchTerm,
            selectedType,
            selectedMissionFields,
            selectedCountries,
            hasActiveCall: hasActiveCall !== "all" ? hasActiveCall : null,
            showFavoritesOnly,
          }).some(Boolean) && (
            <Button variant="subtle" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Group>

        {/* Organisations Grid */}
        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="lg" />
          </Group>
        ) : (
          <Grid mb="xl">
            {paginatedOrganisations.map((organisation: any) => (
              <Grid.Col key={organisation.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <OrganisationCard organisation={organisation} />
              </Grid.Col>
            ))}
          </Grid>
        )}

        {/* Numbered Pagination Controls */}
        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              total={totalPages}
              value={currentPage}
              onChange={setCurrentPage}
              size="md"
            />
          </Group>
        )}
      </Container>
    </DashboardLayout>
  );
}
