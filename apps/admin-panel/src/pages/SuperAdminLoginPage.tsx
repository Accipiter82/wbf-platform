import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Alert,
  Stack,
  Center,
  Box,
  useMantineTheme,
} from "@mantine/core";
import {
  IconShieldCheck,
  IconAlertCircle,
  IconLogin,
} from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { superAdminLogin, clearError } from "../store/slices/authSlice";
import { RootState } from "../store";
import { SuperAdminLoginRequest } from "../types";

export default function SuperAdminLoginPage() {
  const theme = useMantineTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, user, token } = useSelector(
    (state: RootState) => state.auth
  );

  const [formData, setFormData] = useState<SuperAdminLoginRequest>({
    email: "",
    password: "",
  });

  // Redirect if already logged in as super admin
  useEffect(() => {
    if (token && user?.role === "super_admin") {
      navigate("/super-admin/dashboard");
    }
  }, [token, user, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await dispatch(superAdminLogin(formData) as any);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleInputChange =
    (field: keyof SuperAdminLoginRequest) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.colors.brand?.[6] || "#228be6"} 0%, ${theme.colors.brand?.[8] || "#1971c2"} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.md,
      }}
    >
      <Container size="xs">
        <Paper
          shadow="xl"
          p="xl"
          radius="md"
          style={{
            background: "white",
            border: `1px solid ${theme.colors.gray[2]}`,
          }}
        >
          <Stack gap="md">
            {/* Header */}
            <Center>
              <Box
                style={{
                  background: `${theme.colors.brand?.[0] || "#e7f5ff"}`,
                  borderRadius: theme.radius.xl,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                }}
              >
                <IconShieldCheck
                  size={40}
                  color={theme.colors.brand?.[6] || "#228be6"}
                />
              </Box>
            </Center>

            <Center>
              <Title
                order={2}
                size="1.8rem"
                c={theme.colors.brand[7]}
                style={{ textAlign: "center" }}
              >
                Super Admin Portal
              </Title>
            </Center>

            <Text
              size="sm"
              c="dimmed"
              style={{ textAlign: "center", marginBottom: theme.spacing.md }}
            >
              Access the WBF Platform super admin dashboard
            </Text>

            {/* Error Alert */}
            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                variant="light"
                radius="md"
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Email Address"
                  placeholder="Enter your admin email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  required
                  radius="md"
                  size="md"
                  styles={{
                    input: {
                      border: `1px solid ${theme.colors.gray[3]}`,
                      "&:focus": {
                        borderColor: theme.colors.brand?.[5] || "#228be6",
                      },
                    },
                  }}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  required
                  radius="md"
                  size="md"
                  styles={{
                    input: {
                      border: `1px solid ${theme.colors.gray[3]}`,
                      "&:focus": {
                        borderColor: theme.colors.brand?.[5] || "#228be6",
                      },
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  radius="md"
                  loading={isLoading}
                  leftSection={<IconLogin size={16} />}
                  style={{
                    background: `linear-gradient(45deg, ${theme.colors.brand?.[6] || "#228be6"}, ${theme.colors.brand?.[7] || "#1971c2"})`,
                    border: "none",
                    "&:hover": {
                      background: `linear-gradient(45deg, ${theme.colors.brand?.[7] || "#1971c2"}, ${theme.colors.brand?.[8] || "#1864ab"})`,
                    },
                  }}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </Stack>
            </form>

            {/* Footer */}
            <Center>
              <Text size="xs" c="dimmed" style={{ textAlign: "center" }}>
                Restricted access only. Unauthorized access is prohibited.
              </Text>
            </Center>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
