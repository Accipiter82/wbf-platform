import React, { useEffect, useState } from "react";
import {
  Title,
  Text,
  Grid,
  Card,
  Group,
  Badge,
  Stack,
  Box,
  useMantineTheme,
  LoadingOverlay,
  Alert,
} from "@mantine/core";
import {
  IconBuilding,
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconClock,
  IconAlertCircle,
  IconBriefcase,
} from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { DashboardStats } from "../types";
import SuperAdminDashboardLayout from "../components/layout/SuperAdminDashboardLayout";
import axios from "axios";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  color,
  description,
}: StatCardProps) => {
  const theme = useMantineTheme();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Box
          style={{
            color: color,
            background: `${color}15`,
            padding: theme.spacing.sm,
            borderRadius: theme.radius.md,
          }}
        >
          {icon}
        </Box>
        <Text size="2xl" fw={700} c={color}>
          {value.toLocaleString()}
        </Text>
      </Group>

      <Text size="lg" fw={600} mb="xs">
        {title}
      </Text>
      {description && (
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      )}
    </Card>
  );
};

export default function SuperAdminDashboardPage() {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const { admin, token } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${API_BASE_URL}/super-admin/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setStats(response.data.data);
        } else {
          setError(
            response.data.error || "Failed to load dashboard statistics"
          );
        }
      } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        setError(
          error.response?.data?.error || "Failed to load dashboard statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (!stats && loading) {
    return (
      <SuperAdminDashboardLayout>
        <LoadingOverlay visible />
      </SuperAdminDashboardLayout>
    );
  }

  return (
    <SuperAdminDashboardLayout>
      <Box py="xl" px="xl" style={{ paddingTop: "54px" }}>
        {/* Welcome Section */}
        <Box mb="xl">
          <Title order={1} size="2.5rem" mb="xs" c={theme.colors.brand[7]}>
            Welcome back, {admin?.name || "Super Admin"}!
          </Title>
          <Text size="lg" c="dimmed">
            Here's what's happening in the WBF Platform today
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
          >
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        {stats && (
          <Grid mb="xl" gutter="lg">
            <Grid.Col span={{ base: 12, xs: 6, sm: 4, md: 2.4 }}>
              <StatCard
                title="Total Organisations"
                value={stats.totalOrganisations}
                icon={<IconBuilding size={24} />}
                color="#2563eb"
                description="All registered organisations"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, xs: 6, sm: 4, md: 2.4 }}>
              <StatCard
                title="Active"
                value={stats.activeOrganisations}
                icon={<IconUserCheck size={24} />}
                color="#16a34a"
                description="Approved and active"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, xs: 6, sm: 4, md: 2.4 }}>
              <StatCard
                title="Suspended"
                value={stats.suspendedOrganisations}
                icon={<IconUserX size={24} />}
                color="#dc2626"
                description="Suspended accounts"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, xs: 6, sm: 4, md: 2.4 }}>
              <StatCard
                title="Draft"
                value={stats.draftOrganisations}
                icon={<IconUsers size={24} />}
                color="#6b7280"
                description="Incomplete profiles"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, xs: 6, sm: 4, md: 2.4 }}>
              <StatCard
                title="Recent Logins"
                value={stats.recentLogins}
                icon={<IconClock size={24} />}
                color="#9333ea"
                description="Last 30 days"
              />
            </Grid.Col>
          </Grid>
        )}

        {/* Quick Actions */}
        <Title order={2} size="1.5rem" mb="lg" c={theme.colors.brand[7]}>
          Quick Actions
        </Title>
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/super-admin/organisations")}
            >
              <Group>
                <Box
                  style={{
                    color: "#2563eb",
                    background: "#dbeafe",
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                  }}
                >
                  <IconBuilding size={24} />
                </Box>
                <Box>
                  <Text size="lg" fw={600} c="#2563eb">
                    Manage Organisations
                  </Text>
                  <Text size="sm" c="dimmed">
                    View or suspend organisations
                  </Text>
                </Box>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/super-admin/admin-users")}
            >
              <Group>
                <Box
                  style={{
                    color: "#16a34a",
                    background: "#dcfce7",
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                  }}
                >
                  <IconUsers size={24} />
                </Box>
                <Box>
                  <Text size="lg" fw={600} c="#16a34a">
                    Admin Users
                  </Text>
                  <Text size="sm" c="dimmed">
                    Manage admin user accounts
                  </Text>
                </Box>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/super-admin/calls-projects")}
            >
              <Group>
                <Box
                  style={{
                    color: theme.colors.brand[7],
                    background: `${theme.colors.brand[7]}15`,
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                  }}
                >
                  <IconBriefcase size={24} />
                </Box>
                <Box>
                  <Text size="lg" fw={600} c={theme.colors.brand[7]}>
                    Calls & Projects
                  </Text>
                  <Text size="sm" c="dimmed">
                    Manage all calls and projects
                  </Text>
                </Box>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/super-admin/settings")}
            >
              <Group>
                <Box
                  style={{
                    color: "#9333ea",
                    background: "#f3e8ff",
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.md,
                  }}
                >
                  <IconUsers size={24} />
                </Box>
                <Box>
                  <Text size="lg" fw={600} c="#9333ea">
                    System Settings
                  </Text>
                  <Text size="sm" c="dimmed">
                    Configure system parameters
                  </Text>
                </Box>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Recent Activity Section */}
        <Box mt="xl">
          <Title order={2} size="1.5rem" mb="lg" c={theme.colors.brand[7]}>
            System Health
          </Title>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <Badge color="green" variant="light">
                  System Online
                </Badge>
                <Text size="sm" c="dimmed">
                  All services operational
                </Text>
              </Group>

              <Group>
                <Badge color="blue" variant="light">
                  Database Connected
                </Badge>
                <Text size="sm" c="dimmed">
                  MongoDB operational
                </Text>
              </Group>

              <Group>
                <Badge color="orange" variant="light">
                  Monitoring Active
                </Badge>
                <Text size="sm" c="dimmed">
                  System monitoring and alerts enabled
                </Text>
              </Group>
            </Stack>
          </Card>
        </Box>
      </Box>
    </SuperAdminDashboardLayout>
  );
}
