import { Stack, Title, Text, Alert } from "@mantine/core";
import { ReactNode } from "react";

interface ProfileStepWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  isFirstStep?: boolean;
}

export default function ProfileStepWrapper({
  title,
  description,
  children,
  isFirstStep = false,
}: ProfileStepWrapperProps) {
  return (
    <Stack gap="lg">
      <div>
        <Title order={3} mb="md">
          {title}
        </Title>
        {description && (
          <Text c="dimmed" size="sm" mb="lg">
            {description}
          </Text>
        )}

        {isFirstStep && (
          <Alert color="blue" variant="light" mb="lg">
            <Text size="sm">
              <strong>Tip:</strong> This information helps other organisations
              understand who you are and what you do. The more complete your
              profile, the better your chances of finding the right partners!
            </Text>
          </Alert>
        )}
      </div>
      {children}
    </Stack>
  );
}
