import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Badge,
  Button,
  Group,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Alert,
  Pagination,
  Box,
  LoadingOverlay,
  Select,
  useMantineTheme,
} from "@mantine/core";
import {
  IconEye,
  IconBan,
  IconCheck,
  IconAlertCircle,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Organisation, SuspendOrganisationRequest } from "../types";
import SuperAdminDashboardLayout from "../components/layout/SuperAdminDashboardLayout";
import axios from "axios";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api";

interface OrganisationsResponse {
  organisations: (Organisation & { id: string })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SuperAdminOrganisationsPage() {
  const theme = useMantineTheme();
  const { token } = useSelector((state: RootState) => state.auth);

  const [organisations, setOrganisations] = useState<
    (Organisation & { id: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchOrganisations = async (page = 1, limit = 20) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/super-admin/organisations`,
        {
          params: { page, limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const data: OrganisationsResponse = response.data.data;
        setOrganisations(data.organisations);
        setPagination(data.pagination);
      } else {
        setError(response.data.error || "Failed to load organisations");
      }
    } catch (error: any) {
      console.error("Error fetching organisations:", error);
      setError(error.response?.data?.error || "Failed to load organisations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisations();
  }, [token]);

  const handleSuspendOrganisation = async () => {
    if (!selectedOrgId || !suspendReason.trim()) return;

    try {
      setActionLoading(true);

      const data: SuspendOrganisationRequest = {
        reason: suspendReason.trim(),
      };

      const response = await axios.post(
        `${API_BASE_URL}/super-admin/organisations/${selectedOrgId}/suspend`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Refresh the organisations list
        await fetchOrganisations(pagination.page, pagination.limit);

        // Close modal and reset state
        setSuspendModalOpen(false);
        setSelectedOrgId(null);
        setSuspendReason("");
      } else {
        setError(response.data.error || "Failed to suspend organisation");
      }
    } catch (error: any) {
      console.error("Error suspending organisation:", error);
      setError(error.response?.data?.error || "Failed to suspend organisation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendOrganisation = async (orgId: string) => {
    try {
      setActionLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/super-admin/organisations/${orgId}/unsuspend`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Refresh the organisations list
        await fetchOrganisations(pagination.page, pagination.limit);
      } else {
        setError(response.data.error || "Failed to unsuspend organisation");
      }
    } catch (error: any) {
      console.error("Error unsuspending organisation:", error);
      setError(
        error.response?.data?.error || "Failed to unsuspend organisation"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchOrganisations(page, pagination.limit);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { color: "green", label: "Active" },
      pending: { color: "orange", label: "Pending" },
      suspended: { color: "red", label: "Suspended" },
      draft: { color: "gray", label: "Draft" },
      declined: { color: "red", label: "Declined" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "gray",
      label: status,
    };
    return (
      <Badge color={config.color} variant="light">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date | string | any | undefined) => {
    if (!date) return "Never";

    let dateObj: Date;

    // Handle raw Firestore Timestamp objects (serialized as { _seconds, _nanoseconds })
    if (
      date &&
      typeof date === "object" &&
      typeof date._seconds === "number" &&
      typeof date._nanoseconds === "number"
    ) {
      dateObj = new Date(date._seconds * 1000 + date._nanoseconds / 1000000);
    }
    // Handle Firestore Timestamp objects (if they retain the toDate method)
    else if (
      date &&
      typeof date === "object" &&
      typeof date.toDate === "function"
    ) {
      dateObj = date.toDate();
    }
    // Handle ISO 8601 strings
    else if (typeof date === "string") {
      dateObj = new Date(date);
    }
    // Handle native Date objects
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Fallback for unhandled types
    else {
      return "Invalid Date";
    }

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return (
      dateObj.toLocaleDateString() +
      " " +
      dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Filter organisations based on search term and status
  const filteredOrganisations = organisations.filter((org) => {
    const matchesSearch =
      !searchTerm ||
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || org.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <SuperAdminDashboardLayout>
      <Container size="xl" py="xl" px="xl" style={{ marginLeft: 0, paddingTop: "54px" }}>
        <Box mb="xl">
          <Title order={1} size="2rem" mb="xs" c={theme.colors.brand[7]}>
            Organisations Management
          </Title>
          <Text size="lg" c="dimmed">
            Manage all organisations in the platform
          </Text>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            radius="md"
            mb="xl"
            onClose={() => setError(null)}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Group mb="md">
          <TextInput
            placeholder="Search organisations..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            leftSection={<IconFilter size={16} />}
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { value: "approved", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "suspended", label: "Suspended" },
              { value: "draft", label: "Draft" },
              { value: "declined", label: "Declined" },
            ]}
            clearable
          />
        </Group>

        {/* Organisations Table */}
        <Box style={{ position: "relative" }}>
          <LoadingOverlay visible={loading} />

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Organisation</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Last Login</Table.Th>
                <Table.Th>Login Count</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredOrganisations.map((org) => (
                <Table.Tr key={org.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500}>{org.name}</Text>
                      <Text size="sm" c="dimmed">
                        {org.city}
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td>{org.contactEmail}</Table.Td>
                  <Table.Td>{getStatusBadge(org.status)}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(org.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(org.lastLoginAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{org.loginCount || 0}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() =>
                          window.open(`/organisations/${org.id}?superAdmin=true`, "_blank")
                        }
                      >
                        <IconEye size={16} />
                      </ActionIcon>

                      {org.status === "suspended" ? (
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => handleUnsuspendOrganisation(org.id)}
                          loading={actionLoading}
                        >
                          <IconCheck size={16} />
                        </ActionIcon>
                      ) : (
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => {
                            setSelectedOrgId(org.id);
                            setSuspendModalOpen(true);
                          }}
                        >
                          <IconBan size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {filteredOrganisations.length === 0 && !loading && (
            <Text ta="center" py="xl" c="dimmed">
              No organisations found
            </Text>
          )}
        </Box>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Group justify="center" mt="xl">
            <Pagination
              value={pagination.page}
              onChange={handlePageChange}
              total={pagination.totalPages}
            />
          </Group>
        )}

        {/* Suspend Modal */}
        <Modal
          opened={suspendModalOpen}
          onClose={() => {
            setSuspendModalOpen(false);
            setSelectedOrgId(null);
            setSuspendReason("");
          }}
          title="Suspend Organisation"
          size="md"
        >
          <Stack gap="md">
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
            >
              This will suspend the organisation and prevent them from logging
              in. They will see a message to contact support.
            </Alert>

            <Textarea
              label="Suspension Reason"
              placeholder="Provide a reason for suspending this organisation..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              required
              minRows={3}
            />

            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSuspendModalOpen(false);
                  setSelectedOrgId(null);
                  setSuspendReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleSuspendOrganisation}
                loading={actionLoading}
                disabled={!suspendReason.trim()}
              >
                Suspend Organisation
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </SuperAdminDashboardLayout>
  );
}
