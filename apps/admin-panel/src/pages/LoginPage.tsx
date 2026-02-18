import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
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
  Group,
  Divider,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconBuilding, IconSearch } from "@tabler/icons-react";
import { RootState } from "../store";
import { login } from "../store/slices/authSlice";
import { useMantineTheme } from "@mantine/core";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const theme = useMantineTheme();

  const form = useForm({
    initialValues: {
      contactEmail: "",
      password: "",
    },
    validate: {
      contactEmail: (value) =>
        /^\S+@\S+$/.test(value) ? null : "Invalid email",
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
    },
  });

  const handleSubmit = async (values: {
    contactEmail: string;
    password: string;
  }) => {
    try {
      const result = await dispatch(login(values) as any).unwrap();
      if (result) {
        // The App component will handle the redirect based on organisation status
        navigate("/");
      }
    } catch (error) {
      // Error is handled by the Redux slice
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
          <IconBuilding size={32} style={{ color: "#1a202c" }} />
        </Group>

        <Title order={2} ta="center" mb="lg" style={{ color: "#1a202c" }}>
          Organisation Login
        </Title>

        <Text ta="center" c="dimmed" mb="xl">
          Sign in to your organisation account to access the WBF Platform
        </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Login Error"
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
              {...form.getInputProps("contactEmail")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps("password")}
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
              styles={{
                root: {
                  "&:hover": {
                    backgroundColor: theme.colors.brand[6],
                  },
                },
              }}
            >
              Sign In to Organisation
            </Button>
          </Stack>
        </form>

        <Divider my="lg" label="or" labelPosition="center" />

        <Stack gap="md" mt="md">
          <Group justify="center">
            <Text size="sm" c="dimmed">
              Don't have an organisation account?{" "}
              <Link
                to="/register/step-1"
                style={{ color: "#1a202c", textDecoration: "underline" }}
              >
                Register your organisation
              </Link>
            </Text>
          </Group>

          <Button
            component={Link}
            to="/browse"
            variant="light"
            leftSection={<IconSearch size={18} />}
            fullWidth
            style={{
              borderColor: theme.colors.brand[7],
              color: theme.colors.brand[7],
            }}
            styles={{
              root: {
                "&:hover": {
                  backgroundColor: theme.colors.brand[0],
                },
              },
            }}
          >
            Browse organisations
          </Button>
        </Stack>
      </Paper>
      </Container>
    </Box>
  );
}
