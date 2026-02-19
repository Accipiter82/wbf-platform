import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Paper,
  Title,
  PasswordInput,
  Button,
  Text,
  Alert,
  Stack,
  Group,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconLock,
  IconCheck,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useDispatch } from "react-redux";
import { resetPassword } from "../store/slices/authSlice";
import { useMantineTheme } from "@mantine/core";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: {
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
    },
  });

  const handleSubmit = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await dispatch(
        resetPassword({ token, password: values.password }) as any
      ).unwrap();
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2d3d5f",
        }}
      >
        <Container size="xs" style={{ width: "100%" }}>
          <Paper shadow="md" p="xl" radius="md">
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Invalid Link"
              color="red"
            >
              This password reset link is invalid. Please request a new one.
            </Alert>
            <Button
              component={Link}
              to="/forgot-password"
              variant="light"
              fullWidth
              mt="md"
              style={{
                borderColor: theme.colors.brand[7],
                color: theme.colors.brand[7],
              }}
            >
              Request New Reset Link
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2d3d5f",
      }}
    >
      <Container size="xs" style={{ width: "100%" }}>
        <Paper shadow="md" p="xl" radius="md">
          <Group justify="center" mb="md">
            <IconLock size={32} style={{ color: "#1a202c" }} />
          </Group>

          <Title order={2} ta="center" mb="lg" style={{ color: "#1a202c" }}>
            Reset Password
          </Title>

          {success ? (
            <Stack>
              <Alert
                icon={<IconCheck size={16} />}
                title="Password Reset Successful"
                color="green"
              >
                Your password has been updated successfully. You will be
                redirected to the login page shortly.
              </Alert>

              <Button
                component={Link}
                to="/login"
                variant="light"
                leftSection={<IconArrowLeft size={18} />}
                fullWidth
                mt="md"
                style={{
                  borderColor: theme.colors.brand[7],
                  color: theme.colors.brand[7],
                }}
              >
                Go to Login
              </Button>
            </Stack>
          ) : (
            <>
              <Text ta="center" c="dimmed" mb="xl">
                Enter your new password below.
              </Text>

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Error"
                  color="red"
                  mb="md"
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                  <PasswordInput
                    label="New Password"
                    placeholder="Enter new password"
                    required
                    {...form.getInputProps("password")}
                  />

                  <PasswordInput
                    label="Confirm New Password"
                    placeholder="Repeat new password"
                    required
                    {...form.getInputProps("confirmPassword")}
                  />

                  <Button
                    type="submit"
                    loading={isLoading}
                    fullWidth
                    size="md"
                    style={{
                      backgroundColor: theme.colors.brand[7],
                      color: "white",
                    }}
                  >
                    Reset Password
                  </Button>
                </Stack>
              </form>

              <Group justify="center" mt="lg">
                <Text size="sm" c="dimmed">
                  <Link
                    to="/login"
                    style={{
                      color: "#1a202c",
                      textDecoration: "underline",
                    }}
                  >
                    Back to Login
                  </Link>
                </Text>
              </Group>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
