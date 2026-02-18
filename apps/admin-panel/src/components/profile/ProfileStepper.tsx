import { Group, Card, Text, Progress, Box, Badge } from "@mantine/core";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { ProfileStep } from "../../types/profile";

interface ProfileStepperProps {
  steps: ProfileStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
  formErrors?: Record<string, any>;
  formValues?: Record<string, any>;
}

export default function ProfileStepper({
  steps,
  currentStep,
  onStepClick,
  formErrors = {},
  formValues = {},
}: ProfileStepperProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  const hasStepErrors = (step: ProfileStep, stepIndex: number) => {
    // Only check for errors if this step has been visited (up to current step)
    if (stepIndex > currentStep) return false;
    return step.fields.some((field) => formErrors[field]);
  };

  const isStepCompleted = (stepIndex: number) => {
    if (stepIndex >= currentStep) return false;
    const step = steps[stepIndex];
    return step.fields.every((field) => {
      const value = formValues[field];
      // Check if the field has a valid value
      const hasValue =
        value !== undefined &&
        value !== null &&
        value !== "" &&
        (Array.isArray(value) ? value.length > 0 : true);

      // For array fields, also check that no items are empty strings
      if (Array.isArray(value) && value.length > 0) {
        return value.every((item) => {
          if (item === null || item === undefined) return false;
          if (typeof item === "string") return item.trim() !== "";
          if (typeof item === "number") return item !== 0;
          return true; // For other types (objects, etc.), consider them valid
        });
      }

      return hasValue;
    });
  };

  const isStepAccessible = (stepIndex: number) => {
    // Current step is always accessible
    if (stepIndex === currentStep) return true;

    // Previous steps are always accessible
    if (stepIndex < currentStep) return true;

    // Next step is accessible only if current step is completed
    if (stepIndex === currentStep + 1) {
      return isStepCompleted(currentStep);
    }

    // Future steps are not accessible
    return false;
  };

  return (
    <Box mb="xl">
      {/* Progress Bar */}
      <Box mb="lg">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500} c="dimmed">
            Profile Completion
          </Text>
          <Text size="sm" fw={600} style={{ color: "#1a202c" }}>
            {Math.round(progress)}% Complete
          </Text>
        </Group>
        <Progress
          value={progress}
          size="lg"
          radius="xl"
          color="#1a202c"
          striped
          animated
          style={{
            background: "#f8f9fa",
          }}
        />
      </Box>

      {/* Steps Indicator */}
      <Group justify="center" gap="xs">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = isStepCompleted(index);
          const isCurrent = index === currentStep;
          const hasErrors = hasStepErrors(step, index);
          const isAccessible = isStepAccessible(index);

          return (
            <Card
              key={index}
              p="xs"
              radius="md"
              style={{
                cursor: isAccessible ? "pointer" : "not-allowed",
                border: isCurrent
                  ? "2px solid #1a202c"
                  : hasErrors
                    ? "2px solid #e53e3e"
                    : isCompleted
                      ? "2px solid #38a169"
                      : "1px solid #e2e8f0",
                background: isCompleted
                  ? "#f0fff4"
                  : hasErrors
                    ? "#fed7d7"
                    : isCurrent
                      ? "#edf2f7"
                      : "white",
                opacity: isAccessible ? 1 : 0.5,
                transition: "all 0.2s ease",
              }}
              onClick={() => isAccessible && onStepClick(index)}
            >
              <Group gap="xs">
                {isCompleted ? (
                  <IconCheck size={16} color="#38a169" />
                ) : hasErrors ? (
                  <IconAlertCircle size={16} color="#e53e3e" />
                ) : (
                  <Icon size={16} color={isCurrent ? "#1a202c" : "#718096"} />
                )}
                <Text
                  size="xs"
                  fw={isCurrent ? 600 : 400}
                  style={{ color: isCurrent ? "#1a202c" : undefined }}
                >
                  {step.title}
                </Text>
                {hasErrors && (
                  <Badge size="xs" color="red" variant="light">
                    !
                  </Badge>
                )}
              </Group>
            </Card>
          );
        })}
      </Group>
    </Box>
  );
}
