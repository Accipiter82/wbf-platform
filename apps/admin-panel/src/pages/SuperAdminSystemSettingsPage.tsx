import React from "react";
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Box,
  useMantineTheme,
} from "@mantine/core";
import {
  IconSettings,
  IconDatabase,
  IconCloud,
  IconShield,
  IconMail,
  IconBell,
} from "@tabler/icons-react";
import SuperAdminDashboardLayout from "../components/layout/SuperAdminDashboardLayout";

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "active" | "inactive" | "configured" | "pending";
  color: string;
}

const SettingsCard = ({
  title,
  description,
  icon,
  status,
  color,
}: SettingsCardProps) => {
  const theme = useMantineTheme();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "green", label: "Active" },
      inactive: { color: "gray", label: "Inactive" },
      configured: { color: "blue", label: "Configured" },
      pending: { color: "orange", label: "Pending" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "gray",
      label: status,
    };

    return (
      <Badge color={config.color} variant="light" size="sm">
        {config.label}
      </Badge>
    );
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        opacity: 0.6, // Make it look disabled for now
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows.lg,
        },
      }}
    >
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
        {getStatusBadge(status)}
      </Group>

      <Text size="lg" fw={600} mb="xs">
        {title}
      </Text>
      <Text size="sm" c="dimmed" mb="md">
        {description}
      </Text>

      <Text size="xs" c="dimmed" fs="italic">
        Coming soon...
      </Text>
    </Card>
  );
};

export default function SuperAdminSystemSettingsPage() {
  const theme = useMantineTheme();

  const settingsCards: SettingsCardProps[] = [
    {
      title: "Database Configuration",
      description: "Configure MongoDB settings and collections",
      icon: <IconDatabase size={24} />,
      status: "configured",
      color: "#2563eb",
    },
    {
      title: "Cloud Storage",
      description: "Manage Firebase Storage settings and file uploads",
      icon: <IconCloud size={24} />,
      status: "active",
      color: "#16a34a",
    },
    {
      title: "Security Settings",
      description: "Configure authentication, permissions, and security rules",
      icon: <IconShield size={24} />,
      status: "configured",
      color: "#dc2626",
    },
    {
      title: "Email Configuration",
      description: "Set up email templates and SMTP settings",
      icon: <IconMail size={24} />,
      status: "pending",
      color: "#ea580c",
    },
    {
      title: "Notifications",
      description: "Configure system notifications and alerts",
      icon: <IconBell size={24} />,
      status: "inactive",
      color: "#9333ea",
    },
    {
      title: "General Settings",
      description: "Platform-wide settings and configurations",
      icon: <IconSettings size={24} />,
      status: "configured",
      color: "#6b7280",
    },
  ];

  return (
    <SuperAdminDashboardLayout>
      <Container size="xl" py="xl" style={{ paddingTop: "54px" }}>
        <Box mb="xl">
          <Title order={1} size="2rem" mb="xs" c={theme.colors.brand[7]}>
            System Settings
          </Title>
          <Text size="lg" c="dimmed">
            Configure and manage system-wide settings and configurations
          </Text>
        </Box>

        {/* Coming Soon Notice */}
        <Card
          shadow="sm"
          padding="xl"
          radius="md"
          withBorder
          mb="xl"
          style={{
            background: "linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%)",
            border: "1px solid #fca5a5",
          }}
        >
          <Group>
            <Box
              style={{
                color: "#dc2626",
                background: "white",
                padding: theme.spacing.md,
                borderRadius: theme.radius.xl,
              }}
            >
              <IconSettings size={32} />
            </Box>
            <Box>
              <Title order={3} c={theme.colors.brand[7]} mb="xs">
                Settings Panel Under Development
              </Title>
              <Text size="md" c="#92400e">
                The system settings interface is currently under development.
                Advanced configuration options will be available in future
                updates.
              </Text>
            </Box>
          </Group>
        </Card>

        {/* Settings Categories */}
        <Title order={2} size="1.5rem" mb="lg" c={theme.colors.brand[7]}>
          Configuration Categories
        </Title>

        <Stack gap="xl">
          {/* Database & Storage */}
          <Box>
            <Title order={3} size="1.2rem" mb="md" c={theme.colors.gray[8]}>
              Database & Storage
            </Title>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: theme.spacing.md,
              }}
            >
              {settingsCards
                .filter((card) =>
                  ["Database Configuration", "Cloud Storage"].includes(
                    card.title
                  )
                )
                .map((card, index) => (
                  <SettingsCard key={index} {...card} />
                ))}
            </div>
          </Box>

          {/* Security & Authentication */}
          <Box>
            <Title order={3} size="1.2rem" mb="md" c={theme.colors.gray[8]}>
              Security & Authentication
            </Title>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: theme.spacing.md,
              }}
            >
              {settingsCards
                .filter((card) => card.title === "Security Settings")
                .map((card, index) => (
                  <SettingsCard key={index} {...card} />
                ))}
            </div>
          </Box>

          {/* Communication */}
          <Box>
            <Title order={3} size="1.2rem" mb="md" c={theme.colors.gray[8]}>
              Communication & Notifications
            </Title>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: theme.spacing.md,
              }}
            >
              {settingsCards
                .filter((card) =>
                  ["Email Configuration", "Notifications"].includes(card.title)
                )
                .map((card, index) => (
                  <SettingsCard key={index} {...card} />
                ))}
            </div>
          </Box>

          {/* General */}
          <Box>
            <Title order={3} size="1.2rem" mb="md" c={theme.colors.gray[8]}>
              General Configuration
            </Title>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: theme.spacing.md,
              }}
            >
              {settingsCards
                .filter((card) => card.title === "General Settings")
                .map((card, index) => (
                  <SettingsCard key={index} {...card} />
                ))}
            </div>
          </Box>
        </Stack>

        {/* System Information */}
        <Box mt="xl">
          <Title order={2} size="1.5rem" mb="lg" c={theme.colors.brand[7]}>
            System Information
          </Title>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Platform Version
                </Text>
                <Badge color="blue" variant="light">
                  v1.0.0
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Database Status
                </Text>
                <Badge color="green" variant="light">
                  Connected
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Storage Status
                </Text>
                <Badge color="green" variant="light">
                  Operational
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  Last System Update
                </Text>
                <Text size="sm" c="dimmed">
                  {new Date().toLocaleDateString()}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Box>
      </Container>
    </SuperAdminDashboardLayout>
  );
}
