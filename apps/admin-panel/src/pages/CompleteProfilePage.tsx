import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getCurrentUser } from "../store/slices/authSlice";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Box,
  Paper,
  Card,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowRight, IconRocket, IconLogout } from "@tabler/icons-react";
import { ProfileFormData, ProfileStep } from "../types/profile";
import ProfileStepper from "../components/profile/ProfileStepper";
import BasicInfoStep from "../components/profile/steps/BasicInfoStep";
import OrganisationDetailsStep from "../components/profile/steps/OrganisationDetailsStep";
import ContactInfoStep from "../components/profile/steps/ContactInfoStep";
import ProjectHistoryStep from "../components/profile/steps/ProjectHistoryStep";
import AdditionalInfoStep from "../components/profile/steps/AdditionalInfoStep";
import { logout } from "../store/slices/authSlice";
import { useMantineTheme } from "@mantine/core";

const steps: ProfileStep[] = [
  {
    title: "Basic Information",
    icon: () => null,
    description: "Tell us about your organisation",
    fields: [
      "nameLocal",
      "contractingParty",
      "city",
      "postalAddress",
      "type",
      "yearOfEstablishment",
      "registrationNumber",
    ],
  },
  {
    title: "Organisation Details",
    icon: () => null,
    description: "Share your team and mission",
    fields: [
      "numberOfStaff",
      "numberOfVolunteers",
      "missionFields",
      "website",
      "socialMediaProfiles",
    ],
  },
  {
    title: "Contact Information",
    icon: () => null,
    description: "How can we reach you?",
    fields: [
      "contactPersonName",
      "contactPersonPosition",
      "contactEmail",
      "contactPhone",
    ],
  },
  {
    title: "Project History",
    icon: () => null,
    description: "Your past experiences",
    fields: [
      "wbfCallsApplied",
      "roleInPastApplications",
      "projects",
      "projectThematicAreas",
      "geographicalCoverage",
    ],
  },
  {
    title: "Additional Information",
    icon: () => null,
    description: "Final details and resources",
    fields: [
      "keywords",
      "availableResources",
      "referenceProjects",
      "successStories",
    ],
  },
];

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasShownWelcomeBack, setHasShownWelcomeBack] = useState(false);
  const [isDataRestored, setIsDataRestored] = useState(false);
  const theme = useMantineTheme();

  const form = useForm<ProfileFormData>({
    initialValues: {
      name: "", // Not collected in form, but kept for type compatibility
      nameLocal: "",
      contractingParty: "",
      city: "",
      postalAddress: "",
      type: "",
      yearOfEstablishment: new Date().getFullYear(),
      registrationNumber: "",
      logoUrl: "",
      coverUrl: "",
      numberOfStaff: "",
      numberOfVolunteers: "",
      missionFields: [],
      website: "",
      socialMediaProfiles: [],
      contactPersonName: "",
      contactPersonPosition: "",
      contactEmail: "",
      contactPhone: "",
      wbfCallsApplied: [],
      roleInPastApplications: [],
      projects: [],
      projectThematicAreas: [],
      geographicalCoverage: [],
      lookingForPartnersInThematicAreas: [],
      lookingForPartnersFromCPs: [],
      preferredRole: [],
      expertiseOffered: [],
      expertiseSought: [],
      keywords: [],
      availableResources: [],
      referenceProjects: [],
      successStories: [],
    },
    validate: {
      // Basic Information Step
      // name is not validated here as it's already collected during registration
      nameLocal: (value) =>
        value.length < 2 ? "Local name must be at least 2 characters" : null,
      contractingParty: (value) =>
        value.length < 2
          ? "Contracting party must be at least 2 characters"
          : null,
      city: (value) =>
        value.length < 2 ? "City must be at least 2 characters" : null,
      postalAddress: (value) => {
        if (!value) return null; // Postal address is optional
        return value.length < 5
          ? "Postal address must be at least 5 characters"
          : null;
      },
      type: (value) => (!value ? "Please select organisation type" : null),
      yearOfEstablishment: (value) =>
        !value || value < 1900 || value > new Date().getFullYear()
          ? "Please enter a valid year"
          : null,
      registrationNumber: (value) => {
        if (!value) return null; // Registration number is optional
        return value.length < 3
          ? "Registration number must be at least 3 characters"
          : null;
      },

      // Organisation Details Step
      numberOfStaff: (value) => {
        if (!value) return null; // Optional - no required prop in UI
        return null;
      },
      numberOfVolunteers: (value) => {
        if (!value) return null; // Optional - no required prop in UI
        return null;
      },
      missionFields: (value) => {
        if (!value || value.length === 0) return null; // Optional - no required prop in UI
        return null;
      },
      website: (value) => {
        if (!value) return null; // Website is optional
        const urlPattern = /^https?:\/\/.+/;
        return !urlPattern.test(value)
          ? "Please enter a valid website URL starting with http:// or https://"
          : null;
      },
      socialMediaProfiles: (value) => {
        if (!value || value.length === 0) return null; // Social media is optional
        // Check if each entry has both platform and URL
        const invalidEntries = value.filter((entry: string) => {
          const [platform, url] = entry.split("|");
          return !platform || !url || !url.trim();
        });
        return invalidEntries.length > 0
          ? "Please ensure all social media entries have both platform and URL"
          : null;
      },

      // Contact Information Step
      contactPersonName: (value) =>
        value.length < 2
          ? "Contact person name must be at least 2 characters"
          : null,
      contactPersonPosition: (value) => {
        if (!value) return null; // Contact person position is optional
        return value.length < 2
          ? "Contact person position must be at least 2 characters"
          : null;
      },
      contactEmail: (value) =>
        !/^\S+@\S+$/.test(value) ? "Invalid email format" : null,
      contactPhone: (value) => {
        if (!value) return null; // Optional - no required prop in UI
        return value.length < 8 ? "Phone number must be at least 8 characters" : null;
      },

      // Project History Step (all fields are optional but if provided, should be valid)
      wbfCallsApplied: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some((item: any) => {
          if (typeof item === "object" && item !== null) {
            // Handle object format (for wbfCallsApplied)
            return !item.callNumber || !item.year;
          }
          // Handle string format
          return !item || (typeof item === "string" && item.trim() === "");
        })
          ? "Please fill in all WBF calls applied entries or remove empty ones"
          : null;
      },
      roleInPastApplications: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some(
          (item: any) =>
            !item || (typeof item === "string" && item.trim() === "")
        )
          ? "Please fill in all role entries or remove empty ones"
          : null;
      },
      projects: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some((item: any) => {
          if (typeof item === "object" && item !== null) {
            return !item.title || !item.description;
          }
          return !item || (typeof item === "string" && item.trim() === "");
        })
          ? "Please fill in all project entries or remove empty ones"
          : null;
      },
      projectThematicAreas: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some(
          (item: any) =>
            !item || (typeof item === "string" && item.trim() === "")
        )
          ? "Please fill in all thematic area entries or remove empty ones"
          : null;
      },
      geographicalCoverage: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some(
          (item: any) =>
            !item || (typeof item === "string" && item.trim() === "")
        )
          ? "Please fill in all geographical coverage entries or remove empty ones"
          : null;
      },

      // Additional Information Step (all fields are optional)
      keywords: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some(
          (item: any) =>
            !item || (typeof item === "string" && item.trim() === "")
        )
          ? "Please fill in all keyword entries or remove empty ones"
          : null;
      },
      availableResources: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some(
          (item: any) =>
            !item || (typeof item === "string" && item.trim() === "")
        )
          ? "Please fill in all resource entries or remove empty ones"
          : null;
      },
      referenceProjects: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some((item: any) => {
          if (typeof item === "object" && item !== null) {
            return !item.title || !item.description;
          }
          return !item || (typeof item === "string" && item.trim() === "");
        })
          ? "Please fill in all reference project entries or remove empty ones"
          : null;
      },
      successStories: (value) => {
        if (!value || value.length === 0) return null; // Optional field
        return value.some((item: any) => {
          if (typeof item === "object" && item !== null) {
            return !item.title || !item.description;
          }
          return !item || (typeof item === "string" && item.trim() === "");
        })
          ? "Please fill in all success story entries or remove empty ones"
          : null;
      },
    },
  });

  // Enhanced change handler that saves to localStorage on every field change
  const handleFieldChange = (field: string, value: any) => {
    form.setFieldValue(field, value);
    // Create updated values object and save to localStorage
    const updatedValues = { ...form.values, [field]: value };
    localStorage.setItem("profileFormData", JSON.stringify(updatedValues));
  };

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("profileCurrentStep", currentStep.toString());
  }, [currentStep]);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedFormData = localStorage.getItem("profileFormData");
    const savedCurrentStep = localStorage.getItem("profileCurrentStep");
    const hasVisitedBefore = localStorage.getItem("profilePageVisited") === "true";

    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        console.log("Restoring form data:", parsedData);
        form.setValues(parsedData);
        setIsDataRestored(true);
      } catch (error) {
        console.error("Error loading saved form data:", error);
      }
    }

    if (savedCurrentStep) {
      try {
        const step = parseInt(savedCurrentStep, 10);
        if (step >= 0 && step < steps.length) {
          console.log("Restoring current step:", step);
          setCurrentStep(step);
          setIsDataRestored(true);
        }
      } catch (error) {
        console.error("Error loading saved current step:", error);
      }
    }

    // Mark that user has visited this page
    if (!hasVisitedBefore) {
      localStorage.setItem("profilePageVisited", "true");
    }

    // Show notification only if data was restored AND user has visited before (not first time)
    if ((savedFormData || savedCurrentStep) && hasVisitedBefore && !hasShownWelcomeBack) {
      notifications.show({
        color: "blue",
        title: "Welcome Back!",
        message:
          "Your previous progress has been restored. You can continue where you left off.",
        autoClose: 4000,
      });
      setHasShownWelcomeBack(true);
    }
  }, []);

  // Save form data and current step to localStorage whenever they change
  useEffect(() => {
    // Don't save during initial data restoration
    if (isDataRestored) {
      localStorage.setItem("profileFormData", JSON.stringify(form.values));
    }
  }, [form.values, isDataRestored]);

  useEffect(() => {
    // Don't save during initial data restoration
    if (isDataRestored) {
      localStorage.setItem("profileCurrentStep", currentStep.toString());
    }
  }, [currentStep, isDataRestored]);

  // Helper function to determine if a field is required
  // Only fields with 'required' prop in UI components are considered required
  const isFieldRequired = (field: keyof ProfileFormData): boolean => {
    // Required fields (have 'required' prop in UI components):
    // BasicInfoStep: nameLocal, contractingParty, city, type, yearOfEstablishment (name is collected during registration)
    // ContactInfoStep: contactPersonName, contactEmail
    const requiredFields: (keyof ProfileFormData)[] = [
      "nameLocal",
      "contractingParty",
      "city",
      "type",
      "yearOfEstablishment",
      "contactPersonName",
      "contactEmail",
    ];

    return requiredFields.includes(field);
  };

  const nextStep = () => {
    const currentStepFields = steps[currentStep].fields;

    // Filter to only required fields
    const requiredFields = currentStepFields.filter((field) =>
      isFieldRequired(field)
    );

    // Check if required fields in current step are empty
    const hasEmptyRequiredFields = requiredFields.some((field) => {
      const value = form.values[field];
      return (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    });

    // Check for validation errors only in current step fields
    const hasCurrentStepErrors = currentStepFields.some(
      (field) => form.errors[field]
    );

    if (hasCurrentStepErrors || hasEmptyRequiredFields) {
      // Show specific error message based on what's missing
      let errorMessage =
        "Please fill in all required fields before proceeding.";

      if (hasCurrentStepErrors) {
        const firstErrorField = currentStepFields.find(
          (field) => form.errors[field]
        );
        if (firstErrorField) {
          errorMessage = `Please fix the error in "${firstErrorField}": ${form.errors[firstErrorField]}`;
        }
      } else if (hasEmptyRequiredFields) {
        const emptyFields = requiredFields.filter((field) => {
          const value = form.values[field];
          return (
            value === undefined ||
            value === null ||
            value === "" ||
            (Array.isArray(value) && value.length === 0)
          );
        });

        if (emptyFields.length === 1) {
          errorMessage = `Please fill in "${emptyFields[0]}" before proceeding.`;
        } else {
          errorMessage = `Please fill in the following fields: ${emptyFields.join(", ")}`;
        }
      }

      notifications.show({
        color: "red",
        title: "Missing Information",
        message: errorMessage,
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isCurrentStepComplete = () => {
    const currentStepFields = steps[currentStep].fields;

    // For the last step (Additional Information), all fields are optional
    if (currentStep === steps.length - 1) {
      // Only check for validation errors, not empty fields
      const hasCurrentStepErrors = currentStepFields.some(
        (field) => form.errors[field]
      );
      return !hasCurrentStepErrors;
    }

    // For other steps, check only required fields
    const requiredFields = currentStepFields.filter((field) =>
      isFieldRequired(field)
    );

    // Check if any required field is empty
    const hasEmptyRequiredFields = requiredFields.some((field) => {
      const value = form.values[field];
      return (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      );
    });

    // Check for validation errors in all current step fields (required or optional)
    const hasCurrentStepErrors = currentStepFields.some(
      (field) => form.errors[field]
    );

    return !hasCurrentStepErrors && !hasEmptyRequiredFields;
  };

  const handleStepClick = (step: number) => {
    // If trying to go to a future step, validate current step first
    if (step > currentStep + 1) {
      if (!isCurrentStepComplete()) {
        notifications.show({
          color: "red",
          title: "Complete Current Step First",
          message:
            "Please complete the current step before jumping to future steps.",
        });
        return;
      }
    }

    // Only allow clicking on completed steps or the next step
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async (values: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up optional fields - convert empty strings to null or remove them
      const cleanedValues: any = { ...values };
      
      // Optional fields that should be null/undefined if empty
      const optionalFields: (keyof ProfileFormData)[] = [
        "numberOfStaff",
        "numberOfVolunteers",
        "missionFields",
        "website",
        "postalAddress",
        "registrationNumber",
        "contactPersonPosition",
        "contactPhone",
        "socialMediaProfiles",
        "wbfCallsApplied",
        "roleInPastApplications",
        "projects",
        "projectThematicAreas",
        "geographicalCoverage",
        "lookingForPartnersInThematicAreas",
        "lookingForPartnersFromCPs",
        "preferredRole",
        "expertiseOffered",
        "expertiseSought",
        "keywords",
        "availableResources",
        "referenceProjects",
        "successStories",
        "partnershipNotes",
      ];

      optionalFields.forEach((field) => {
        const value = cleanedValues[field];
        if (value === "" || (Array.isArray(value) && value.length === 0)) {
          cleanedValues[field] = null;
        }
      });

      // Remove name from request - it's already set during registration and shouldn't be changed
      delete cleanedValues.name;

      // Send profile data to backend
      const apiBaseUrl =
        (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api";
      const response = await fetch(
        `${apiBaseUrl}/organisation/complete-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(cleanedValues),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit profile");
      }

      if (result.success) {
        notifications.show({
          color: "green",
          title: "Profile Completed!",
          message:
            "Your organisation profile has been successfully created and approved. Welcome to the platform!",
        });

        // Clear localStorage after successful submission
        localStorage.removeItem("profileFormData");
        localStorage.removeItem("profileCurrentStep");
        localStorage.removeItem("profilePageVisited"); // Also clear the visit flag

        // Refresh organisation data to get updated status
        const token = localStorage.getItem("token");
        if (token) {
          await dispatch(getCurrentUser(token) as any);
        }

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        throw new Error(result.error || "Failed to submit profile");
      }
    } catch (error) {
      console.error("Profile submission error:", error);
      notifications.show({
        color: "red",
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    // Clear localStorage when logging out
    localStorage.removeItem("profileFormData");
    localStorage.removeItem("profileCurrentStep");
    localStorage.removeItem("profilePageVisited"); // Also clear the visit flag

    dispatch(logout());
    navigate("/login");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep form={form} onFieldChange={handleFieldChange} />;
      case 1:
        return (
          <OrganisationDetailsStep
            form={form}
            onFieldChange={handleFieldChange}
          />
        );
      case 2:
        return (
          <ContactInfoStep form={form} onFieldChange={handleFieldChange} />
        );
      case 3:
        return (
          <ProjectHistoryStep form={form} onFieldChange={handleFieldChange} />
        );
      case 4:
        return (
          <AdditionalInfoStep form={form} onFieldChange={handleFieldChange} />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        padding: "2rem 0",
      }}
    >
      <Container size="lg">
        {/* Logout Button */}
        <Group justify="flex-end" mb="md">
          <Button
            variant="outline"
            style={{
              borderColor: theme.colors.brand[7],
              color: theme.colors.brand[7],
            }}
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
            size="sm"
            styles={{
              root: {
                "&:hover": {
                  backgroundColor: theme.colors.brand[7],
                  color: "white",
                },
              },
            }}
          >
            Logout
          </Button>
        </Group>

        <Paper
          shadow="md"
          p="xl"
          radius="md"
          style={{
            background: "white",
            border: "1px solid #e9ecef",
          }}
        >
          {/* Welcome Header */}
          <Box
            mb="xl"
            ta="center"
            p="xl"
            style={{
              background: "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)",
              borderRadius: "12px",
              color: "white",
              position: "relative",
            }}
          >
            <Box style={{ position: "relative", zIndex: 1 }}>
              <Title
                order={1}
                size="2.5rem"
                style={{ margin: 0, marginBottom: "1rem", color: "white" }}
              >
                Welcome to the Partnership Platform!
              </Title>
              <Text size="lg" mb="lg" style={{ opacity: 0.9 }}>
                We're excited to have your organisation join our community of
                changemakers!
              </Text>
              <Text style={{ opacity: 0.8 }}>
                Let's complete your profile to help you connect with the right
                partners and opportunities.
              </Text>
            </Box>
          </Box>

          {/* Stepper */}
          <ProfileStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            formErrors={form.errors}
            formValues={form.values}
          />

          {/* Step Content */}
          <form>
            <Card
              withBorder
              p="xl"
              radius="md"
              style={{
                background: "white",
                border: "1px solid #e9ecef",
              }}
            >
              {renderCurrentStep()}
            </Card>

            {/* Navigation Buttons */}
            <Group justify="space-between" mt="xl">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                size="lg"
                radius="md"
                style={{
                  borderColor: theme.colors.brand[7],
                  color: theme.colors.brand[7],
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                styles={{
                  root: {
                    "&:hover": {
                      backgroundColor: theme.colors.brand[0],
                      borderColor: theme.colors.brand[6],
                      color: theme.colors.brand[6],
                    },
                  },
                }}
              >
                Previous
              </Button>

              <Group>
                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={nextStep}
                    disabled={!isCurrentStepComplete()}
                    size="lg"
                    radius="md"
                    style={{
                      background: isCurrentStepComplete()
                        ? theme.colors.brand[7]
                        : theme.colors.brand[1],
                      color: "white",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                    styles={{
                      root: {
                        "&:hover": {
                          backgroundColor: isCurrentStepComplete()
                            ? theme.colors.brand[6]
                            : theme.colors.brand[1],
                          transform: isCurrentStepComplete()
                            ? "translateY(-1px)"
                            : "none",
                        },
                      },
                    }}
                    leftSection={<IconArrowRight size={16} />}
                  >
                    {isCurrentStepComplete()
                      ? "Next Step"
                      : "Complete Required Fields"}
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      // Validate all fields first
                      const validation = form.validate();
                      
                      // Filter out errors for optional fields - only keep required field errors
                      const requiredFieldErrors: Record<string, string> = {};
                      Object.keys(validation.errors).forEach((field) => {
                        if (isFieldRequired(field as keyof ProfileFormData)) {
                          const error = validation.errors[field];
                          if (error) {
                            requiredFieldErrors[field] = typeof error === 'string' ? error : String(error);
                          }
                        }
                      });

                      if (Object.keys(requiredFieldErrors).length > 0) {
                        // Set errors only for required fields
                        form.setErrors(requiredFieldErrors);
                        const firstErrorField = Object.keys(requiredFieldErrors)[0];
                        notifications.show({
                          color: "red",
                          title: "Validation Error",
                          message: `Please fix the error in "${firstErrorField}": ${requiredFieldErrors[firstErrorField]}`,
                        });
                        return;
                      }

                      // Clear any errors before submitting
                      form.clearErrors();
                      await handleSubmit(form.values);
                    }}
                    loading={isSubmitting}
                    disabled={!isCurrentStepComplete()}
                    size="lg"
                    radius="md"
                    style={{
                      background: isCurrentStepComplete()
                        ? theme.colors.brand[7]
                        : theme.colors.brand[1],
                      color: "white",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                    styles={{
                      root: {
                        "&:hover": {
                          backgroundColor: isCurrentStepComplete()
                            ? theme.colors.brand[6]
                            : theme.colors.brand[1],
                          transform: isCurrentStepComplete()
                            ? "translateY(-1px)"
                            : "none",
                        },
                      },
                    }}
                  >
                    <IconRocket size={16} style={{ marginRight: 8 }} />
                    {isCurrentStepComplete()
                      ? "Complete Profile & Join Platform"
                      : "Complete Required Fields"}
                  </Button>
                )}
              </Group>
            </Group>
          </form>

          {/* Progress Indicator */}
          <Divider my="lg" />
          <Group justify="center" gap="xl">
            <Text size="sm" c="dimmed" style={{ fontWeight: 500 }}>
              Step {currentStep + 1} of {steps.length} • Almost there!
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}
