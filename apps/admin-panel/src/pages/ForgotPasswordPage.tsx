import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Paper,
  Title,
  TextInput,
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
  IconArrowLeft,
  IconMailForward,
  IconCheck,
} from "@tabler/icons-react";
import { useDispatch } from "react-redux";
import { forgotPassword } from "../store/slices/authSlice";
import { useMantineTheme } from "@mantine/core";

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const theme = useMantineTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Please enter a valid email address",
    },
  });

  const handleSubmit = async (values: { email: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await dispatch(forgotPassword(values.email) as any).unwrap();
      setEmailSent(true);
    } catch (err: any) {
      setError(err || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <IconMailForward size={32} style={{ color: "#1a202c" }} />
          </Group>

          <Title order={2} ta="center" mb="lg" style={{ color: "#1a202c" }}>
            Forgot Password
          </Title>

          {emailSent ? (
            <Stack>
              <Alert
                icon={<IconCheck size={16} />}
                title="Email Sent"
                color="green"
              >
                If an account with that email exists, we've sent a password
                reset link. Please check your inbox and spam folder.
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
                Back to Login
              </Button>
            </Stack>
          ) : (
            <>
              <Text ta="center" c="dimmed" mb="xl">
                Enter your organisation email address and we'll send you a link
                to reset your password.
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
                  <TextInput
                    label="Organisation Email"
                    placeholder="your@organisation.com"
                    required
                    {...form.getInputProps("email")}
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
                    Send Reset Link
                  </Button>
                </Stack>
              </form>

              <Group justify="center" mt="lg">
                <Text size="sm" c="dimmed">
                  Remember your password?{" "}
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
