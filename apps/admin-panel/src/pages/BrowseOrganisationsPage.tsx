import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  TextInput,
  Select,
  Pagination,
  Grid,
  Avatar,
  LoadingOverlay,
  Alert,
  NumberInput,
  Collapse,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconSearch,
  IconBuilding,
  IconMapPin,
  IconGlobe,
  IconFilter,
  IconChevronDown,
  IconChevronUp,
  IconUsers,
  IconCalendar,
  IconEye,
  IconArrowLeft,
} from "@tabler/icons-react";
import { RootState, AppDispatch } from "../store";
import { fetchOrganisations } from "../store/slices/organisationSlice";
import { useMantineTheme } from "@mantine/core";
import {
  SECTORS,
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
} from "../utils/constants";

export default function BrowseOrganisationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const { organisations, pagination, isLoading, error } = useSelector(
    (state: RootState) => state.organisation
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedContractingParty, setSelectedContractingParty] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedByCall, setSelectedByCall] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);


  // Load organisations on component mount
  useEffect(() => {
    loadOrganisations();
  }, []);

  // Only trigger on page change, not on filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      loadOrganisations();
    }
  }, [currentPage]);

  const loadOrganisations = () => {
    dispatch(
      fetchOrganisations({
        page: currentPage,
        limit: 12,
        city: selectedCity || undefined,
        country: selectedCountry || undefined,
        contractingParty: selectedContractingParty || undefined,
        sector: selectedSector || undefined,
        status: selectedStatus || undefined,
        type: selectedType || undefined,
        byCall: selectedByCall || undefined,
        minYear: minYear || undefined,
        maxYear: maxYear || undefined,
        minStaff: minStaff || undefined,
        maxStaff: maxStaff || undefined,
        minVolunteers: minVolunteers || undefined,
        maxVolunteers: maxVolunteers || undefined,
        thematicArea: selectedThematicArea || undefined,
        expertiseOffered: selectedExpertiseOffered || undefined,
        expertiseSought: selectedExpertiseSought || undefined,
        preferredRole: selectedPreferredRole || undefined,
        geographicalCoverage: selectedGeographicalCoverage || undefined,
        lookingForPartnersFromCPs:
          selectedLookingForPartnersFromCPs || undefined,
        lookingForPartnersInThematicAreas:
          selectedLookingForPartnersInThematicAreas || undefined,
        availableResources: selectedAvailableResources || undefined,
        projectStatus: selectedProjectStatus || undefined,
        fundingSource: selectedFundingSource || undefined,
        budgetVisibility: selectedBudgetVisibility || undefined,
        visibility: selectedVisibility || undefined,
        search: searchTerm || undefined,
      })
    );
  };

  const handleSearch = () => {
    setCurrentPage(1);
    // Load organisations with current filter values
    dispatch(
      fetchOrganisations({
        page: 1,
        limit: 12,
        city: selectedCity || undefined,
        country: selectedCountry || undefined,
        contractingParty: selectedContractingParty || undefined,
        sector: selectedSector || undefined,
        status: selectedStatus || undefined,
        type: selectedType || undefined,
        byCall: selectedByCall || undefined,
        minYear: minYear || undefined,
        maxYear: maxYear || undefined,
        minStaff: minStaff || undefined,
        maxStaff: maxStaff || undefined,
        minVolunteers: minVolunteers || undefined,
        maxVolunteers: maxVolunteers || undefined,
        thematicArea: selectedThematicArea || undefined,
        expertiseOffered: selectedExpertiseOffered || undefined,
        expertiseSought: selectedExpertiseSought || undefined,
        preferredRole: selectedPreferredRole || undefined,
        geographicalCoverage: selectedGeographicalCoverage || undefined,
        lookingForPartnersFromCPs:
          selectedLookingForPartnersFromCPs || undefined,
        lookingForPartnersInThematicAreas:
          selectedLookingForPartnersInThematicAreas || undefined,
        availableResources: selectedAvailableResources || undefined,
        projectStatus: selectedProjectStatus || undefined,
        fundingSource: selectedFundingSource || undefined,
        budgetVisibility: selectedBudgetVisibility || undefined,
        visibility: selectedVisibility || undefined,
        search: searchTerm || undefined,
      })
    );
  };

  const handleReset = () => {
    setSearchTerm("");
    setSelectedCity("");
    setSelectedCountry("");
    setSelectedByCall("");
    setSelectedContractingParty("");
    setSelectedSector("");
    setSelectedStatus("");
    setSelectedType("");
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

    // Load organisations with reset filters
    dispatch(
      fetchOrganisations({
        page: 1,
        limit: 12,
        // All filters are now empty/undefined
      })
    );
  };

  // No client-side filtering needed since backend handles all filtering

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: "#2d3d5f",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "white",
          padding: "50px",
        }}
      >
        <Container size="xl">
          <Group mb="lg" align="center">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Title order={2} style={{ flex: 1 }}>
              Browse Organisations
            </Title>
          </Group>

          {error && (
            <Alert color="red" title="Error" mb="md">
              {error}
            </Alert>
          )}

          {/* Search and Filters */}
          <Card shadow="sm" p="lg" mb="lg">
          <Stack>
            {/* Basic Search */}
            <Group grow>
              <TextInput
                placeholder="Search organisations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                onKeyPress={(e) =>
                  e.key === "Enter" && !isLoading && handleSearch()
                }
                disabled={isLoading}
              />
              <TextInput
                placeholder="Filter by city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.currentTarget.value)}
                leftSection={<IconMapPin size={16} />}
                disabled={isLoading}
              />
              <Select
                placeholder="Filter by country"
                data={COUNTRIES.map((c) => ({ value: c.value, label: c.label }))}
                value={selectedCountry}
                onChange={(value) => setSelectedCountry(value || "")}
                clearable
                disabled={isLoading}
              />
              <TextInput
                placeholder="Filter by Contracting Party"
                value={selectedContractingParty}
                onChange={(e) => setSelectedContractingParty(e.currentTarget.value)}
                leftSection={<IconBuilding size={16} />}
                disabled={isLoading}
              />
              <Select
                placeholder="Filter by sector"
                data={SECTORS.map((s) => ({ value: s.value, label: s.label }))}
                value={selectedSector}
                onChange={(value) => setSelectedSector(value || "")}
                clearable
                disabled={isLoading}
              />
              <Select
                placeholder="Active call/project"
                data={[
                  { value: "", label: "All" },
                  { value: "hasCallsOrProjects", label: "Yes" },
                  { value: "noCallsOrProjects", label: "No" },
                ]}
                value={selectedByCall}
                onChange={(value) => setSelectedByCall(value || "")}
                clearable
                disabled={isLoading}
              />
            </Group>

            {/* Advanced Filters Toggle */}
            <Group justify="start">
              <Button
                variant="subtle"
                leftSection={<IconFilter size={16} />}
                rightSection={
                  showAdvancedFilters ? (
                    <IconChevronUp size={16} />
                  ) : (
                    <IconChevronDown size={16} />
                  )
                }
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Advanced Filters
              </Button>
            </Group>

            {/* Advanced Filters */}
            <Collapse in={showAdvancedFilters}>
              <Divider my="md" />
              <Stack gap="lg">
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
                        value={selectedType}
                        onChange={(value) => setSelectedType(value || "")}
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
              </Stack>
            </Collapse>
            <Group justify="end">
              <Button onClick={handleSearch} disabled={isLoading}>
                Search
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Results */}
        <div style={{ position: "relative" }}>
          <LoadingOverlay visible={isLoading} />
          {organisations.length === 0 && !isLoading ? (
            <Card p="xl" ta="center">
              <Text size="lg" c="dimmed">
                No organisations found
              </Text>
            </Card>
          ) : (
            <>
              <Grid>
                {organisations.map((org) => (
                  <Grid.Col key={org.id} span={{ base: 12, sm: 6, lg: 4 }}>
                    <Card shadow="sm" p="lg" h="100%" style={{ position: "relative" }}>
                      <Stack gap="md">
                        <Group>
                          <Avatar size="lg" color="blue">
                            {org.images?.logo ? (
                              <img 
                                src={org.images.logo} 
                                alt={org.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain"
                                }}
                              />
                            ) : (
                              <IconBuilding size={24} />
                            )}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <Text fw={600} size="lg" lineClamp={2}>
                              {org.name}
                            </Text>
                            <Text size="sm" c="dimmed" lineClamp={1}>
                              {org.nameLocal}
                            </Text>
                          </div>
                        </Group>

                        <Text size="sm" lineClamp={3}>
                          {org.type} • Established{" "}
                          {org.profile?.yearOfEstablishment}
                        </Text>

                        <Stack gap="xs">
                          <Group gap="xs">
                            <IconMapPin size={14} />
                            <Text size="sm">{org.profile?.city}</Text>
                          </Group>
                          
                          {org.profile?.contractingParty && (
                            <Group gap="xs">
                              <IconBuilding size={14} />
                              <Text size="sm">{org.profile?.contractingParty}</Text>
                            </Group>
                          )}

                          {org.contact?.website && (
                            <Group gap="xs">
                              <IconGlobe size={14} />
                              <Text
                                size="sm"
                                c="blue"
                                style={{ cursor: "pointer" }}
                              >
                                {org.contact?.website}
                              </Text>
                            </Group>
                          )}

                          {org.fields?.missionFields &&
                            org.fields.missionFields.length > 0 && (
                              <Group gap="xs">
                                {org.fields.missionFields
                                  .slice(0, 3)
                                  .map((field: string, index: number) => (
                                    <Badge
                                      key={index}
                                      size="sm"
                                      variant="light"
                                    >
                                      {field}
                                    </Badge>
                                  ))}
                                {org.fields.missionFields.length > 3 && (
                                  <Badge size="sm" variant="light">
                                    +{org.fields.missionFields.length - 3} more
                                  </Badge>
                                )}
                              </Group>
                            )}
                        </Stack>

                        <Button
                          variant="light"
                          fullWidth
                          leftSection={<IconEye size={18} />}
                          onClick={() => navigate("/login")}
                          style={{
                            borderColor: theme.colors.brand[7],
                            color: theme.colors.brand[7],
                          }}
                          styles={{
                            root: {
                              "&:hover": {
                                backgroundColor: theme.colors.brand[0],
                              },
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  ))}
                </Grid>

                {/* Results Summary */}
                {pagination && (
                  <Group justify="space-between" mt="lg">
                    <Text size="sm" c="dimmed">
                      Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                      {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
                      of {pagination.total} organisations
                    </Text>
                    <Text size="sm" c="dimmed">
                      Page {currentPage} of {pagination.totalPages}
                    </Text>
                  </Group>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <Card shadow="md" p="lg" mt="xl" style={{ backgroundColor: "white" }}>
                    <Group justify="center">
                      <Pagination
                        total={pagination.totalPages}
                        value={currentPage}
                        onChange={setCurrentPage}
                        size="md"
                        withEdges
                        siblings={1}
                      />
                    </Group>
                  </Card>
                )}
              </>
            )}
        </div>
        </Container>
      </div>
    </Box>
  );
}
