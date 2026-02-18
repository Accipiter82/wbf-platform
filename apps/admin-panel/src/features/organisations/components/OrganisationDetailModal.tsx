import {
  Modal,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Box,
  Image,
  Avatar,
  Divider,
  Grid,
  Card,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBuilding,
  IconMapPin,
  IconUsers,
  IconCalendar,
  IconMail,
  IconPhone,
  IconGlobe,
  IconMessage,
} from "@tabler/icons-react";
import { messagingService } from "../../../services/messagingService";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { notifications } from "@mantine/notifications";

interface Organisation {
  id: string;
  name: string;
  nameLocal?: string;
  type: string;
  city: string;
  country: string;
  logo?: string;
  coverImage?: string;
  missionFields: string[];
  numberOfStaff: number;
  numberOfVolunteers: number;
  hasActiveCall: boolean;
  status: "approved" | "pending" | "rejected";
  yearOfEstablishment: number;
  keywords: string[];
  expertiseOffered: string[];
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}

interface OrganisationDetailModalProps {
  organisation: Organisation;
  opened: boolean;
  onClose: () => void;
}

export default function OrganisationDetailModal({
  organisation,
  opened,
  onClose,
}: OrganisationDetailModalProps) {
  const theme = useMantineTheme();
  const { organisation: currentOrg } = useSelector(
    (state: RootState) => state.auth
  );

  const handleContact = async () => {
    if (!currentOrg) {
      notifications.show({
        title: "Error",
        message: "Please log in to send messages",
        color: "red",
      });
      return;
    }

    try {
      // Create a direct message conversation
      await messagingService.createDirectMessage(
        organisation.id,
        `Contact from ${currentOrg.name}`,
        `Hello ${organisation.name},\n\nI would like to get in touch regarding potential collaboration opportunities.\n\nBest regards,\n${currentOrg.name}`
      );

      notifications.show({
        title: "Success",
        message:
          "Message sent successfully! You can continue the conversation in Messages.",
        color: "green",
      });

      // Close the modal
      onClose();
    } catch (error: any) {
      console.error("Failed to send message:", error);
      notifications.show({
        title: "Error",
        message: error.message || "Failed to send message. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group>
          <Avatar src={organisation.logo} size="md" radius="md">
            <IconBuilding size={20} />
          </Avatar>
          <Box>
            <Title order={3} size="h4">
              {organisation.name}
            </Title>
            {organisation.nameLocal && (
              <Text size="sm" c="dimmed">
                {organisation.nameLocal}
              </Text>
            )}
          </Box>
        </Group>
      }
      styles={{
        header: {
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
        },
      }}
    >
      <Stack gap="lg">
        {/* Cover Image */}
        {organisation.coverImage && (
          <Box
            style={{
              height: 200,
              borderRadius: theme.radius.md,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Image
              src={organisation.coverImage}
              alt={organisation.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {organisation.hasActiveCall && (
              <Badge
                color="green"
                variant="filled"
                size="lg"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                }}
              >
                Active Call Available
              </Badge>
            )}
          </Box>
        )}

        {/* Basic Info */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              {/* Mission Fields */}
              <Box>
                <Text size="sm" fw={600} mb="xs" c={theme.colors.gray[7]}>
                  Mission Fields
                </Text>
                <Group gap="xs">
                  {organisation.missionFields.map((field, index) => (
                    <Badge key={index} size="md" variant="light" color="blue">
                      {field}
                    </Badge>
                  ))}
                </Group>
              </Box>

              {/* Description */}
              {organisation.description && (
                <Box>
                  <Text size="sm" fw={600} mb="xs" c={theme.colors.gray[7]}>
                    About
                  </Text>
                  <Text size="sm" c="dimmed">
                    {organisation.description}
                  </Text>
                </Box>
              )}

              {/* Expertise */}
              <Box>
                <Text size="sm" fw={600} mb="xs" c={theme.colors.gray[7]}>
                  Expertise Offered
                </Text>
                <Group gap="xs">
                  {organisation.expertiseOffered.map((expertise, index) => (
                    <Badge
                      key={index}
                      size="sm"
                      variant="outline"
                      color="green"
                    >
                      {expertise}
                    </Badge>
                  ))}
                </Group>
              </Box>

              {/* Keywords */}
              <Box>
                <Text size="sm" fw={600} mb="xs" c={theme.colors.gray[7]}>
                  Keywords
                </Text>
                <Group gap="xs">
                  {organisation.keywords.map((keyword, index) => (
                    <Badge key={index} size="sm" variant="dot" color="gray">
                      {keyword}
                    </Badge>
                  ))}
                </Group>
              </Box>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                {/* Contact Actions */}
                <Button
                  fullWidth
                  leftSection={<IconMessage size={16} />}
                  onClick={handleContact}
                >
                  Contact Organisation
                </Button>

                {organisation.website && (
                  <Button
                    variant="outline"
                    fullWidth
                    leftSection={<IconGlobe size={16} />}
                    component="a"
                    href={organisation.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Website
                  </Button>
                )}

                {/* Organisation Details */}
                <Divider />
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text size="sm">
                      {organisation.city}, {organisation.country}
                    </Text>
                  </Group>

                  <Group gap="xs">
                    <IconBuilding size={16} />
                    <Text size="sm">{organisation.type}</Text>
                  </Group>

                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text size="sm">
                      Est. {organisation.yearOfEstablishment}
                    </Text>
                  </Group>

                  <Group gap="xs">
                    <IconUsers size={16} />
                    <Text size="sm">
                      {organisation.numberOfStaff} staff,{" "}
                      {organisation.numberOfVolunteers} volunteers
                    </Text>
                  </Group>
                </Stack>

                {/* Contact Info */}
                {(organisation.contactEmail || organisation.contactPhone) && (
                  <>
                    <Divider />
                    <Text size="sm" fw={600} c={theme.colors.gray[7]}>
                      Contact Information
                    </Text>
                    <Stack gap="xs">
                      {organisation.contactEmail && (
                        <Group gap="xs">
                          <IconMail size={16} />
                          <Text size="sm">{organisation.contactEmail}</Text>
                        </Group>
                      )}
                      {organisation.contactPhone && (
                        <Group gap="xs">
                          <IconPhone size={16} />
                          <Text size="sm">{organisation.contactPhone}</Text>
                        </Group>
                      )}
                    </Stack>
                  </>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Status and Actions */}
        <Group justify="space-between">
          <Group>
            <Badge
              color={
                organisation.status === "approved"
                  ? "green"
                  : organisation.status === "pending"
                    ? "yellow"
                    : "red"
              }
              variant="light"
            >
              {organisation.status.charAt(0).toUpperCase() +
                organisation.status.slice(1)}
            </Badge>
            {organisation.hasActiveCall && (
              <Badge color="green" variant="light">
                Has Active Call
              </Badge>
            )}
          </Group>

          <Group>
            <Button variant="subtle" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleContact}>Send Message</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
