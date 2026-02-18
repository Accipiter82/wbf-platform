import React, { useState, useEffect } from "react";
import {
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
  IconBriefcase,
  IconMessage,
  IconUser,
  IconLogout,
  IconDashboard,
} from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { messagingService } from "../../services/messagingService";
import { RootState } from "../../store";

interface DashboardLayoutProps {
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
    path: "/dashboard",
    description: "Overview and analytics dashboard",
  },
  {
    label: "Organisations",
    icon: <IconBuilding size={20} />,
    path: "/dashboard/organisations",
    description: "Browse and connect with organisations",
  },
  {
    label: "Calls & Projects",
    icon: <IconBriefcase size={20} />,
    path: "/dashboard/calls-projects",
    description: "View and publish calls for projects",
  },
  {
    label: "Messages",
    icon: <IconMessage size={20} />,
    path: "/dashboard/notifications",
    description: "Messages and conversations",
  },
  {
    label: "My Profile",
    icon: <IconUser size={20} />,
    path: "/dashboard/profile",
    description: "Manage your organisation profile",
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { organisation } = useSelector((state: RootState) => state.auth);

  const [unreadCount, setUnreadCount] = useState(0);
  const [opened, setOpened] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Load unread message count
  const loadUnreadCount = async () => {
    if (!organisation) return;

    try {
      const response = await messagingService.getUnreadCount();
      setUnreadCount(response.totalUnreadCount || 0);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  // Load unread count on mount and set up polling
  useEffect(() => {
    loadUnreadCount();

    // Poll for unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [organisation]);

  // Helper to determine if a nav item is active
  function isActive(path: string) {
    if (path === "/dashboard/organisations") {
      // Active for /dashboard/organisations and /organisations/:id
      return (
        location.pathname.startsWith("/dashboard/organisations") ||
        location.pathname.startsWith("/organisations")
      );
    }
    return location.pathname === path;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.gray[0] }}>
      {/* Header */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: "white",
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1000,
        }}
      >
        <Group>
          <Burger
            opened={opened}
            onClick={() => setOpened(!opened)}
            size="sm"
            color={theme.colors.gray[6]}
            display={{ base: "block", md: "none" }}
          />
          <Text size="xl" fw={700} c={theme.colors.brand[7]}>
            WBF Platform
          </Text>
        </Group>

        <Group>
          <Button
            variant="outline"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Group>
      </div>

      {/* Desktop Sidebar */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          width: "300px",
          height: "calc(100vh - 60px)",
          background: "white",
          borderRight: `1px solid ${theme.colors.gray[3]}`,
          padding: "16px",
          overflowY: "auto",
        }}
        className="desktop-sidebar"
      >
        <Text size="lg" fw={600} mb="lg" c={theme.colors.gray[7]}>
          Navigation
        </Text>

        <Stack gap="xs">
          {navItems.map((item) => (
            <UnstyledButton
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: "block",
                width: "100%",
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                marginBottom: 4,
                backgroundColor: isActive(item.path)
                  ? theme.colors.brand[7]
                  : hoveredItem === item.path
                    ? theme.colors.brand[0]
                    : "transparent",
                border: isActive(item.path)
                  ? `1px solid ${theme.colors.brand[6]}`
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
                    color: isActive(item.path)
                      ? "white"
                      : theme.colors.brand[7],
                  })}
                </Box>
                <Box style={{ flex: 1 }}>
                  <Group justify="space-between" align="center">
                    <Text
                      size="sm"
                      fw={isActive(item.path) ? 700 : 500}
                      style={{
                        color: isActive(item.path)
                          ? "white"
                          : hoveredItem === item.path
                            ? theme.colors.brand[7]
                            : theme.colors.brand[7],
                        transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                      }}
                    >
                      {item.label}
                    </Text>
                    {item.path === "/dashboard/notifications" &&
                      unreadCount > 0 && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="red"
                          style={{ marginLeft: "auto" }}
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
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
            background: theme.colors.blue[0],
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.blue[3]}`,
            marginTop: theme.spacing.lg,
          }}
        >
          <Text size="sm" fw={500} c={theme.colors.brand[7]} mb="xs">
            Platform Status
          </Text>
          <Text size="xs" c="dimmed">
            All systems operational
          </Text>
        </Box>
      </div>

      {/* Main Content */}
      <div
        style={{
          marginTop: "60px",
          marginLeft: "0px",
          padding: "24px",
          minHeight: "calc(100vh - 60px)",
        }}
        className="main-content"
      >
        {children}
      </div>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        size="100%"
        padding="md"
        title={
          <Group justify="space-between" w="100%">
            <Text size="lg" fw={600} c={theme.colors.gray[7]}>
              Navigation
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
                  ? `1px solid ${theme.colors.brand[6]}`
                  : "transparent",
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
                    color: isActive(item.path)
                      ? "white"
                      : theme.colors.brand[7],
                  })}
                </Box>
                <Box style={{ flex: 1 }}>
                  <Group justify="space-between" align="center">
                    <Text
                      size="sm"
                      fw={isActive(item.path) ? 700 : 500}
                      style={{
                        color: isActive(item.path)
                          ? "white"
                          : theme.colors.brand[7],
                        transition: "color 0.2s cubic-bezier(.4,0,.2,1)",
                      }}
                    >
                      {item.label}
                    </Text>
                    {item.path === "/dashboard/notifications" &&
                      unreadCount > 0 && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="red"
                          style={{ marginLeft: "auto" }}
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
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
            background: theme.colors.blue[0],
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.blue[3]}`,
            marginTop: theme.spacing.lg,
          }}
        >
          <Text size="sm" fw={500} c={theme.colors.brand[7]} mb="xs">
            Platform Status
          </Text>
          <Text size="xs" c="dimmed">
            All systems operational
          </Text>
        </Box>
      </Drawer>

      <style>
        {`
          @media (max-width: 767px) {
            .desktop-sidebar {
              display: none !important;
            }
            .main-content {
              margin-left: 0 !important;
              padding: 16px !important;
            }
          }
          @media (min-width: 768px) {
            .main-content {
              margin-left: 300px !important;
              padding: 24px !important;
            }
          }
        `}
      </style>
    </div>
  );
}
