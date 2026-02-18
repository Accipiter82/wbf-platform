import { useState, useEffect, useRef } from "react";
import { useForm } from "@mantine/form";
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
  PinInput,
  Divider,
  Flex,
  Box,
  Checkbox,
  Anchor,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../store";
import { registerStep1, verifyEmail, clearError } from "../store/slices/authSlice";
import { notifications } from "@mantine/notifications";
import LegalModal from "../components/legal/LegalModal";

interface SimpleRegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export default function RegisterStep1Page() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const form = useForm<SimpleRegistrationData>({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
    validate: {
      name: (value, values) => {
        if (value.length < 2) {
          return "Organisation name must be at least 2 characters";
        }
        if (value === values.email) {
          return "Organisation name cannot be the same as email address";
        }
        return null;
      },
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length < 6 ? "Password must be at least 6 characters" : null,
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
      acceptedTerms: (value) =>
        !value ? "You must accept the Terms of Service and Privacy Policy" : null,
    },
  });

  // Persist registrationData in localStorage
  const [registrationData, setRegistrationData] =
    useState<SimpleRegistrationData | null>(() => {
      const saved = localStorage.getItem("registrationData");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Validate that name is not the same as email
          if (parsed && parsed.name && parsed.email && parsed.name === parsed.email) {
            // Clear invalid data
            localStorage.removeItem("registrationData");
            return null;
          }
          return parsed;
        } catch (e) {
          // Clear corrupted data
          localStorage.removeItem("registrationData");
          return null;
        }
      }
      return null;
    });

  useEffect(() => {
    if (registrationData) {
      localStorage.setItem(
        "registrationData",
        JSON.stringify(registrationData)
      );
    }
  }, [registrationData]);

  const [emailCode, setEmailCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null);
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [legalModalOpened, setLegalModalOpened] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"terms" | "privacy">("terms");

  // Clear errors on component mount (handles refresh)
  useEffect(() => {
    dispatch(clearError());
    setEmailVerificationError(null);
  }, [dispatch]);

  // Clear errors when navigating away
  useEffect(() => {
    return () => {
      dispatch(clearError());
      setEmailVerificationError(null);
    };
  }, [dispatch]);

  // Track if email has changed after code sent
  useEffect(() => {
    if (form.values.email !== emailInput) {
      // Fully reset email verification state if email changes or is cleared
      setEmailSent(false);
      setEmailVerified(false);
      setEmailCode("");
      setResendCooldown(0);
      setEmailVerificationError(null);
      setEmailInput(form.values.email);
    }
    // If email is cleared, also reset everything and hide code entry
    if (!form.values.email) {
      setEmailSent(false);
      setEmailVerified(false);
      setEmailCode("");
      setResendCooldown(0);
      setEmailVerificationError(null);
    }
  }, [form.values.email]);

  // Countdown effect for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      resendTimerRef.current = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    } else if (resendTimerRef.current) {
      clearTimeout(resendTimerRef.current);
      resendTimerRef.current = null;
    }
    return () => {
      if (resendTimerRef.current) clearTimeout(resendTimerRef.current);
    };
  }, [resendCooldown]);

  const handleSubmit = async (values: SimpleRegistrationData) => {
    console.log("Form submitted with values:", values);

    // Debug: Check if name is the same as email
    if (values.name === values.email) {
      console.error("ERROR: Organisation name is the same as email!", {
        name: values.name,
        email: values.email,
      });
      form.setFieldError("name", "Organisation name cannot be the same as email address");
      notifications.show({
        color: "red",
        title: "Validation Error",
        message: "Organisation name cannot be the same as email address. Please enter a valid organisation name.",
      });
      return;
    }

    try {
      setRegistrationData(values);
      await handleCompleteRegistration(values);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Update handleEmailVerification to debug and ensure registrationData
  const handleEmailVerification = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (emailCode.length !== 6) return;
    if (emailVerifying) return; // Prevent multiple submits
    const emailToVerify = form.values.email;
    if (!emailToVerify) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "No email to verify.",
      });
      return;
    }
    setEmailVerifying(true);
    try {
      await dispatch(
        verifyEmail({
          email: emailToVerify,
          code: emailCode,
        }) as any
      );

      // If we reach here, the verification was successful (Redux throws on error)
      setEmailVerified(true);
      setEmailCode("");
      notifications.show({
        color: "green",
        title: "Success",
        message: "Email verified successfully!",
      });

      // Don't automatically create account - let user click Create Account button
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Verification Failed",
        message:
          error?.message || "Email verification failed. Please try again.",
      });
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleCompleteRegistration = async (
    values?: SimpleRegistrationData
  ) => {
    const dataToUse = values || registrationData;

    if (!dataToUse) {
      console.error("No registration data found");
      notifications.show({
        color: "red",
        title: "Error",
        message: "No registration data found. Please fill in the form.",
      });
      return;
    }

    // Validate that name is not the same as email
    if (!dataToUse.name || dataToUse.name.trim().length < 2) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Please enter a valid organisation name.",
      });
      return;
    }

    if (dataToUse.name === dataToUse.email) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Organisation name cannot be the same as email address.",
      });
      return;
    }

    console.log("Starting registration with data:", {
      name: dataToUse.name,
      email: dataToUse.email,
      password: "***",
      phone: "",
    });

    try {
      // Complete registration with organisation name, email and password
      await dispatch(
        registerStep1({
          name: dataToUse.name.trim(),
          email: dataToUse.email.trim(),
          password: dataToUse.password,
          phone: "", // Empty phone for now
        }) as any
      );

      // Clear registrationData from localStorage
      localStorage.removeItem("registrationData");

      // Redirect to profile completion instead of dashboard
      navigate("/complete-profile");
    } catch (error) {
      console.error("Registration error:", error);
      // Error is handled by the Redux slice
    }
  };

  // Resend code with cooldown
  const resendEmailCode = async () => {
    if (resendCooldown > 0) return;
    try {
      await dispatch(verifyEmail({ email: registrationData!.email }) as any);
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error) {
      // Error is handled by the Redux slice
    }
  };

  // When requesting a new code, reset code input and verification state
  const handleSendEmailCode = async () => {
    if (!form.values.email || form.errors.email) return;
    setSendingCode(true);
    setEmailVerificationError(null);
    dispatch(clearError()); // Clear any previous Redux errors
    try {
      await dispatch(verifyEmail({ email: form.values.email }) as any).unwrap();
      setEmailSent(true);
      setEmailVerified(false);
      setEmailCode("");
      setEmailVerificationError(null);
      dispatch(clearError()); // Clear errors on success
    } catch (error: any) {
      // Handle error - don't show verification fields if email already exists
      const errorMessage = error || "Failed to send verification code";
      setEmailVerificationError(errorMessage);
      setEmailSent(false); // Don't show verification fields on error
      setEmailVerified(false);
      setEmailCode("");
      dispatch(clearError()); // Clear Redux error to prevent duplicate
    } finally {
      setSendingCode(false);
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
          <Title order={2} ta="center" mb="lg">
            Create Your Account
          </Title>

          {/* Show only one error: prefer emailVerificationError over general error */}
          {(emailVerificationError || error) && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
              mb="md"
            >
              {emailVerificationError || error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Organisation Name"
                placeholder="Enter your organisation name"
                required
                autoComplete="organization"
                {...form.getInputProps("name")}
                onBlur={(e) => {
                  // Prevent name from being set to email
                  const value = e.currentTarget.value.trim();
                  if (value === form.values.email) {
                    form.setFieldError("name", "Organisation name cannot be the same as email address");
                  }
                }}
              />
              <Flex align="end" gap="sm">
                <TextInput
                  label="Email Address"
                  placeholder="your@email.com"
                  required
                  style={{ flex: 1 }}
                  {...form.getInputProps("email")}
                  disabled={emailVerified}
                  onChange={(e) => {
                    form.setFieldValue("email", e.currentTarget.value);
                    setEmailInput(e.currentTarget.value);
                  }}
                />
                {emailVerified ? (
                  <Button
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    disabled
                    type="button"
                  >
                    Verified
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendEmailCode}
                    loading={sendingCode}
                    disabled={
                      !!form.errors.email ||
                      !form.values.email ||
                      sendingCode ||
                      (emailSent && form.values.email === emailInput) // Only disable if code sent and email hasn't changed
                    }
                    type="button"
                  >
                    Verify
                  </Button>
                )}
              </Flex>
              {/* Show code input only if code sent and not verified */}
              {emailSent && !emailVerified && (
                <Stack gap={4}>
                  <Text size="sm" c="dimmed">
                    Enter the 6-digit code sent to your email
                  </Text>
                  <Group>
                    <PinInput
                      length={6}
                      value={emailCode}
                      onChange={setEmailCode}
                      size="sm"
                      radius="md"
                      disabled={emailVerified}
                    />
                    <Button
                      onClick={handleEmailVerification}
                      disabled={
                        emailCode.length !== 6 || emailVerified || emailVerifying
                      }
                      loading={emailVerifying}
                      type="button"
                    >
                      Verify Code
                    </Button>
                  </Group>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={resendEmailCode}
                    disabled={emailVerified || resendCooldown > 0}
                    type="button"
                  >
                    {resendCooldown > 0
                      ? `Resend Code (${resendCooldown}s)`
                      : "Resend Code"}
                  </Button>
                </Stack>
              )}
              <PasswordInput
                label="Password"
                placeholder="Create a password"
                required
                {...form.getInputProps("password")}
              />
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm your password"
                required
                {...form.getInputProps("confirmPassword")}
              />
              <Checkbox
                label={
                  <Text size="sm">
                    I agree to the{" "}
                    <Anchor
                      component="button"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModalType("terms");
                        setLegalModalOpened(true);
                      }}
                      style={{ textDecoration: "underline" }}
                    >
                      Terms of Service
                    </Anchor>{" "}
                    and{" "}
                    <Anchor
                      component="button"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModalType("privacy");
                        setLegalModalOpened(true);
                      }}
                      style={{ textDecoration: "underline" }}
                    >
                      Privacy Policy
                    </Anchor>
                  </Text>
                }
                required
                {...form.getInputProps("acceptedTerms", { type: "checkbox" })}
                error={form.errors.acceptedTerms}
              />
              <Button
                type="submit"
                loading={isLoading}
                fullWidth
                size="lg"
                disabled={!emailVerified || !form.values.acceptedTerms || isLoading}
              >
                Create Account
              </Button>
            </Stack>
          </form>

          <LegalModal
            opened={legalModalOpened}
            onClose={() => setLegalModalOpened(false)}
            type={legalModalType}
          />

          <Divider my="lg" />

          <Group justify="center">
            <Text size="sm" c="dimmed">
              Already have an account?{" "}
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  dispatch(clearError());
                  setEmailVerificationError(null);
                  navigate("/login");
                }}
                type="button"
              >
                Sign In
              </Button>
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}
