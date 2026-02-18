import React, { useEffect, useState } from "react";
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
  Stack,
  Alert,
  Box,
  LoadingOverlay,
  PasswordInput,
  useMantineTheme,
} from "@mantine/core";
import {
  IconPlus,
  IconEye,
  IconTrash,
  IconAlertCircle,
  IconUserCheck,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { AdminUser } from "../types";
import SuperAdminDashboardLayout from "../components/layout/SuperAdminDashboardLayout";
import axios from "axios";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api";

interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  role: "admin" | "super_admin";
}

export default function SuperAdminUsersPage() {
  const theme = useMantineTheme();
  const { token } = useSelector((state: RootState) => state.auth);

  const [adminUsers, setAdminUsers] = useState<(AdminUser & { id: string })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAdminRequest>({
    name: "",
    email: "",
    password: "",
    role: "super_admin",
  });

  const fetchAdminUsers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/super-admin/admin-users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAdminUsers(response.data.data.adminUsers || []);
      } else {
        setError(response.data.error || "Failed to load admin users");
      }
    } catch (error: any) {
      console.error("Error fetching admin users:", error);
      setError(error.response?.data?.error || "Failed to load admin users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, [token]);

  const handleCreateAdmin = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setError("All fields are required");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/super-admin/admin-users`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Refresh the admin users list
        await fetchAdminUsers();

        // Close modal and reset state
        setCreateModalOpen(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "super_admin",
        });
      } else {
        setError(response.data.error || "Failed to create admin user");
      }
    } catch (error: any) {
      console.error("Error creating admin user:", error);
      setError(error.response?.data?.error || "Failed to create admin user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to delete this admin user?")) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await axios.delete(
        `${API_BASE_URL}/super-admin/admin-users/${adminId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Refresh the admin users list
        await fetchAdminUsers();
      } else {
        setError(response.data.error || "Failed to delete admin user");
      }
    } catch (error: any) {
      console.error("Error deleting admin user:", error);
      setError(error.response?.data?.error || "Failed to delete admin user");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      super_admin: { color: "red", label: "Super Admin" },
      admin: { color: "blue", label: "Admin" },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || {
      color: "gray",
      label: role,
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

    try {
      // Handle Firestore Timestamp objects with toDate method
      if (date && typeof date === "object" && typeof date.toDate === "function") {
        dateObj = date.toDate();
      }
      // Handle serialized Firestore timestamps with _seconds
      else if (
        date &&
        typeof date === "object" &&
        typeof date._seconds === "number"
      ) {
        dateObj = new Date(date._seconds * 1000);
      }
      // Handle ISO string dates
      else if (typeof date === "string") {
        dateObj = new Date(date);
      }
      // Handle Date objects
      else if (date instanceof Date) {
        dateObj = date;
      }
      // Unknown format
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
    } catch (error) {
      console.error("Error formatting date:", error, date);
      return "Invalid Date";
    }
  };

  const handleInputChange =
    (field: keyof CreateAdminRequest) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  return (
    <SuperAdminDashboardLayout>
      <Container size="xl" py="xl" style={{ paddingTop: "54px" }}>
        <Box mb="xl">
          <Group justify="space-between" align="flex-end">
            <Box>
              <Title order={1} size="2rem" mb="xs" c={theme.colors.brand[7]}>
                Admin Users Management
              </Title>
              <Text size="lg" c="dimmed">
                Manage super admin and admin user accounts
              </Text>
            </Box>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setCreateModalOpen(true)}
              color={theme.colors.brand[7]}
            >
              Add Admin User
            </Button>
          </Group>
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

        {/* Admin Users Table */}
        <Box style={{ position: "relative" }}>
          <LoadingOverlay visible={loading} />

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Last Login</Table.Th>
                <Table.Th>Login Count</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {adminUsers.map((admin) => (
                <Table.Tr key={admin.id}>
                  <Table.Td>
                    <Group>
                      <IconShieldCheck size={16} color="#dc2626" />
                      <Text fw={500}>{admin.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>{admin.email}</Table.Td>
                  <Table.Td>{getRoleBadge(admin.role)}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(admin.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(admin.lastLoginAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{admin.loginCount || 0}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => {
                          // TODO: Implement view admin details
                          console.log("View admin:", admin.id);
                        }}
                      >
                        <IconEye size={16} />
                      </ActionIcon>

                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        loading={actionLoading}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {adminUsers.length === 0 && !loading && (
            <Text ta="center" py="xl" c="dimmed">
              No admin users found
            </Text>
          )}
        </Box>

        {/* Create Admin Modal */}
        <Modal
          opened={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setFormData({
              name: "",
              email: "",
              password: "",
              role: "super_admin",
            });
            setError(null);
          }}
          title="Create New Admin User"
          size="md"
        >
          <Stack gap="md">
            <Alert
              icon={<IconUserCheck size={16} />}
              color="blue"
              variant="light"
            >
              This will create a new super admin user with full platform access.
            </Alert>

            <TextInput
              label="Full Name"
              placeholder="Enter admin's full name"
              value={formData.name}
              onChange={handleInputChange("name")}
              required
            />

            <TextInput
              label="Email Address"
              placeholder="Enter admin's email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              required
            />

            <PasswordInput
              label="Password"
              placeholder="Enter a strong password"
              value={formData.password}
              onChange={handleInputChange("password")}
              required
            />

            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false);
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "super_admin",
                  });
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleCreateAdmin}
                loading={actionLoading}
                disabled={
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.password.trim()
                }
              >
                Create Admin User
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </SuperAdminDashboardLayout>
  );
}
