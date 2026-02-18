import React, { useState } from "react";
import {
  AppShell,
  Text,
  Group,
  Button,
  Box,
  Stack,
  UnstyledButton,
  useMantineTheme,
  Badge,
  Burger,
  Drawer,
} from "@mantine/core";
import {
  IconBuilding,
  IconDashboard,
  IconShieldCheck,
  IconLogout,
  IconUsers,
  IconBriefcase,
} from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMediaQuery } from "@mantine/hooks";
import { logout } from "../../store/slices/authSlice";
import { RootState } from "../../store";

interface SuperAdminDashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <IconDashboard size={20} />,
    path: "/super-admin/dashboard",
    description: "Overview and analytics",
  },
  {
    label: "Organisations",
    icon: <IconBuilding size={20} />,
    path: "/super-admin/organisations",
    description: "Manage all organisations",
  },
  {
    label: "Calls & Projects",
    icon: <IconBriefcase size={20} />,
    path: "/super-admin/calls-projects",
    description: "Manage calls and projects",
  },
  {
    label: "Admin Users",
    icon: <IconUsers size={20} />,
    path: "/super-admin/admin-users",
    description: "Manage admin accounts",
  },
];

export default function SuperAdminDashboardLayout({
  children,
}: SuperAdminDashboardLayoutProps) {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { admin } = useSelector((state: RootState) => state.auth);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [opened, setOpened] = useState(false);

  // Helper to determine if a nav item is active
  function isActive(path: string) {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "md",
        collapsed: { mobile: !opened },
      }}
      padding="xl"
      style={{
        background: theme.colors.gray[0],
      }}
    >
      {/* Header */}
      <AppShell.Header
        style={{
          background: "white",
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened(!opened)}
              size="sm"
              color={theme.colors.gray[6]}
              display={{ base: "block", md: "none" }}
            />
            <IconShieldCheck size={24} color={theme.colors.brand[7]} />
            <Text size="xl" fw={700} c={theme.colors.brand[7]}>
              WBF Super Admin
            </Text>
            <Badge
              color="blue"
              variant="light"
              size="sm"
              display={{ base: "none", md: "block" }}
            >
              ADMIN
            </Badge>
          </Group>

          <Group>
            <Text size="sm" c="dimmed" display={{ base: "none", md: "block" }}>
              Welcome, {admin?.name || "Super Admin"}
            </Text>
            <Button
              variant="outline"
              color="blue"
              onClick={handleLogout}
              size="xs"
              px="xs"
              styles={{
                root: {
                  "@media (min-width: 768px)": {
                    fontSize: "14px",
                    padding: "8px 16px",
                  },
                  "@media (max-width: 767px)": {
                    paddingLeft: "8px",
                    paddingRight: "8px",
                  },
                },
              }}
            >
              <Box display={{ base: "block", md: "none" }}>
                <IconLogout size={16} />
              </Box>
              <Text display={{ base: "none", md: "inline" }}>Logout</Text>
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar Navigation */}
      <AppShell.Navbar
        p="md"
        style={{
          background: "white",
          borderRight: `1px solid ${theme.colors.gray[3]}`,
        }}
      >

        <AppShell.Section grow>
          <Stack gap="xs" px="md">
            {navItems.map((item) => (
              <UnstyledButton
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  marginBottom: 4,
                  backgroundColor: isActive(item.path)
                    ? theme.colors.brand[7]
                    : "transparent",
                  border: isActive(item.path)
                    ? `1px solid ${theme.colors.brand[7]}`
                    : `1px solid transparent`,
                  transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                  boxShadow: isActive(item.path)
                    ? `0 2px 8px 0 ${theme.colors.brand[0]}`
                    : undefined,
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = theme.colors.brand[0];
                    e.currentTarget.style.color = theme.colors.brand[7];
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = theme.colors.gray[7];
                  }
                }}
              >
                <Group>
                  <Box
                    style={{
                      color: isActive(item.path)
                        ? "white"
                        : theme.colors.gray[6],
                      transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                    }}
                  >
                    {React.cloneElement(item.icon as React.ReactElement, {
                      color: isActive(item.path) ? "white" : theme.colors.brand[7],
                    })}
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text
                      size="sm"
                      fw={isActive(item.path) ? 700 : 500}
                      style={{
                        color: isActive(item.path) ? "white" : theme.colors.brand[7],
                        transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      size="xs"
                      mt={4}
                      style={{
                        color: isActive(item.path) ? "white" : "#6b7280",
                        transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                      }}
                    >
                      {item.description}
                    </Text>
                  </Box>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section p="md">
          <Box
            style={{
              padding: theme.spacing.md,
              background: theme.colors.brand[0],
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.brand[3]}`,
            }}
          >
            <Text size="sm" fw={500} c={theme.colors.brand[7]} mb="xs">
              System Status
            </Text>
            <Text size="xs" c="dimmed">
              All systems operational
            </Text>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        size="100%"
        padding="md"
        title={
          <Group justify="space-between" w="100%">
            <Text size="lg" fw={600} c={theme.colors.gray[7]}>
              Super Admin Panel
            </Text>
          </Group>
        }
        display={{ base: "block", md: "none" }}
      >
        <Stack gap="xs" mt="lg">
          {navItems.map((item) => (
            <UnstyledButton
              key={item.path}
              onClick={() => {
                handleNavClick(item.path);
                setOpened(false); // Close mobile menu when item is clicked
              }}
              style={{
                display: "block",
                width: "100%",
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                marginBottom: 4,
                backgroundColor: isActive(item.path)
                  ? theme.colors.brand[7]
                  : "transparent",
                border: isActive(item.path)
                  ? `1px solid ${theme.colors.brand[7]}`
                  : `1px solid transparent`,
                transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
                boxShadow: isActive(item.path)
                  ? `0 2px 8px 0 ${theme.colors.brand[0]}`
                  : undefined,
                cursor: "pointer",
              }}
            >
              <Group>
                <Box
                  style={{
                    color: isActive(item.path) ? "white" : theme.colors.gray[6],
                    transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                  }}
                >
                  {React.cloneElement(item.icon as React.ReactElement, {
                    color: isActive(item.path) ? "white" : theme.colors.brand[7],
                  })}
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text
                    size="sm"
                    fw={isActive(item.path) ? 700 : 500}
                    style={{
                      color: isActive(item.path) ? "white" : theme.colors.brand[7],
                      transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    size="xs"
                    mt={4}
                    style={{
                      color: isActive(item.path) ? "white" : "#6b7280",
                      transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                    }}
                  >
                    {item.description}
                  </Text>
                </Box>
              </Group>
            </UnstyledButton>
          ))}
        </Stack>

        <Box
          style={{
            padding: theme.spacing.md,
            background: theme.colors.brand[0],
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.brand[3]}`,
            marginTop: theme.spacing.lg,
          }}
        >
          <Text size="sm" fw={500} c={theme.colors.brand[7]} mb="xs">
            System Status
          </Text>
          <Text size="xs" c="dimmed">
            All systems operational
          </Text>
        </Box>
      </Drawer>

      {/* Main Content */}
      <AppShell.Main
        style={{
          backgroundColor: theme.colors.gray[0],
          marginLeft: isDesktop ? "300px" : "0",
          padding: theme.spacing.xl,
        }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
