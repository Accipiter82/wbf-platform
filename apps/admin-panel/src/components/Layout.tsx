import {
  AppShell,
  Text,
  Button,
  Group,
  Avatar,
  Menu,
  UnstyledButton,
} from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IconLogout,
  IconUser,
  IconBuilding,
  IconUsers,
  IconClipboardList,
  IconDashboard,
} from "@tabler/icons-react";
import { RootState } from "../store";
import { logout } from "../store/slices/authSlice";
import { useMantineTheme } from "@mantine/core";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, organisation } = useSelector((state: RootState) => state.auth);
  const theme = useMantineTheme();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      label: "Dashboard",
      icon: IconDashboard,
      path: "/dashboard",
      show: true,
    },
    {
      label: "Browse Organisations",
      icon: IconUsers,
      path: "/browse",
      show: true,
    },
    {
      label: "Edit Submission",
      icon: IconBuilding,
      path: "/edit-submission",
      show: user?.role === "organisation",
    },
    {
      label: "Admin Review",
      icon: IconClipboardList,
      path: "/admin/review",
      show: user?.role === "admin",
    },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Text size="lg" fw={700} style={{ color: theme.colors.brand[7] }}>
              WBF Organisation Platform
            </Text>
          </Group>

          <Group>
            {user && (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <UnstyledButton>
                    <Group>
                      <Avatar size="sm" style={{ backgroundColor: "#1a202c" }}>
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500}>
                          {user.email}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {user.role === "admin"
                            ? "Administrator"
                            : "Organisation"}
                        </Text>
                      </div>
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconUser size={14} />}
                    onClick={() => navigate("/dashboard")}
                  >
                    Profile
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    onClick={handleLogout}
                    color="red"
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section>
          <Text
            size="lg"
            fw={600}
            mb="md"
            style={{ color: theme.colors.brand[7] }}
          >
            Navigation
          </Text>
        </AppShell.Section>

        <AppShell.Section grow>
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "filled" : "subtle"}
                leftSection={<item.icon size={16} />}
                fullWidth
                justify="left"
                mb="xs"
                onClick={() => navigate(item.path)}
                style={{
                  backgroundColor: isActive(item.path)
                    ? theme.colors.brand[7]
                    : "transparent",
                  color: isActive(item.path) ? "white" : theme.colors.brand[7],
                  borderColor: isActive(item.path)
                    ? theme.colors.brand[7]
                    : theme.colors.brand[3],
                }}
                styles={{
                  root: {
                    "&:hover": {
                      backgroundColor: isActive(item.path)
                        ? theme.colors.brand[6]
                        : theme.colors.brand[0],
                    },
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
        </AppShell.Section>

        <AppShell.Section>
          {organisation && (
            <div>
              <Text
                size="sm"
                fw={500}
                mb="xs"
                style={{ color: theme.colors.brand[7] }}
              >
                Your Organisation
              </Text>
              <Text size="xs" c="dimmed">
                {organisation.name}
              </Text>
              <Text size="xs" c="dimmed">
                Status: {organisation.status}
              </Text>
            </div>
          )}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
