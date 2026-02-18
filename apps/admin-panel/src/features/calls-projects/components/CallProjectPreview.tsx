import React from "react";
import {
  Modal,
  Stack,
  Group,
  Text,
  Avatar,
  Badge,
  Grid,
  Box,
  Button,
  Anchor,
  Card,
  useMantineTheme,
  ScrollArea,
} from "@mantine/core";
import {
  IconBuilding,
  IconCalendar,
  IconMapPin,
  IconCurrencyEuro,
  IconUsers,
  IconClock,
  IconFileText,
  IconMail,
  IconPhone,
  IconWorld,
  IconMessage,
  IconDownload,
  IconAward,
  IconLink,
  IconPower,
} from "@tabler/icons-react";
// Using the UICall interface from the page since we don't have direct access to shared types
interface UICall {
  id: string;
  type: "call" | "project";
  title: string;
  description: string;
  organisation: {
    id: string;
    name: string;
    logo?: string;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  deadline: Date;
  location: string;
  thematicAreas: string[];
  requiredExpertise: string[];
  projectDuration?: string;
  maxPartners?: number;
  status: "active" | "closed" | "draft";
  createdAt: Date;
  applicationsCount: number;
  createdByOrganisationId?: string;
  // Extended fields for preview (may not all be present in UICall)
  shortDescription?: string;
  callType?: string;
  eligibleRegions?: string[];
  openingDate?: Date;
  evaluationPeriod?: string;
  expectedStartDate?: Date;
  eligibilityCriteria?: string;
  numberOfAwards?: number;
  applicationLink?: string;
  requiredDocuments?: string[];
  contact?: { name?: string; email?: string; phone?: string };
  guidelinePdfUrl?: string;
  faqLink?: string;
  visibility?: "public" | "members";
  shortSummary?: string;
  category?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  ongoing?: boolean;
  projectStatus?: "planned" | "ongoing" | "completed";
  leadOrganisationId?: string;
  leadOrganisationName?: string;
  partnerOrganisationNames?: string[];
  fundingSource?: string;
  budgetVisibility?: "public" | "private";
  outcomes?: string;
  galleryUrls?: string[];
  videoUrls?: string[];
  reportUrls?: string[];
  projectManager?: { name?: string; email?: string; phone?: string };
  website?: string;
}

interface CallProjectPreviewProps {
  opportunity: UICall | null;
  opened: boolean;
  onClose: () => void;
  onApply?: () => void;
  showApplyButton?: boolean;
  currentOrganisationId?: string;
  onStatusUpdate?: (opportunity: UICall, newStatus: "active" | "closed" | "draft") => void;
  isSuperAdmin?: boolean;
}

export const CallProjectPreview: React.FC<CallProjectPreviewProps> = ({
  opportunity,
  opened,
  onClose,
  onApply,
  showApplyButton = true,
  currentOrganisationId,
  onStatusUpdate,
  isSuperAdmin = false,
}) => {
  const theme = useMantineTheme();

  if (!opportunity) return null;

  const formatBudget = (budget: {
    min: number;
    max: number;
    currency: string;
  }) => {
    return `${budget.min.toLocaleString()} - ${budget.max.toLocaleString()} ${budget.currency}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDeadline = (deadline: Date | string) => {
    const date = typeof deadline === "string" ? new Date(deadline) : deadline;
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Deadline passed";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `${diffDays} days left`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`;
    return `${Math.ceil(diffDays / 30)} months left`;
  };

  const isCall = opportunity.type === "call";
  const isProject = opportunity.type === "project";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      centered
      overlayProps={{
        opacity: 0.55,
        blur: 3,
      }}
      styles={{
        header: {
          zIndex: 1001,
        },
        overlay: {
          zIndex: 1000,
        },
        inner: {
          zIndex: 1000,
        },
        content: {
          zIndex: 1001,
        },
      }}
      title={
        <Group>
          <Avatar src={opportunity.organisation.logo} size="sm" radius="md">
            <IconBuilding size={16} />
          </Avatar>
          <Text size="lg" fw={600}>
            {opportunity.title}
          </Text>
        </Group>
      }
    >
      <ScrollArea.Autosize mah="80vh" offsetScrollbars>
        <Stack gap="lg">
          {/* Header Badges */}
          <Group gap="sm">
            <Badge size="lg" variant="light" color="blue">
              {isCall ? "Call" : "Project"}
            </Badge>
            <Badge
              size="lg"
              variant="filled"
              color={
                opportunity.status === "active"
                  ? "green"
                  : opportunity.status === "closed"
                    ? "red"
                    : "gray"
              }
            >
              {opportunity.status.charAt(0).toUpperCase() +
                opportunity.status.slice(1)}
            </Badge>
          </Group>

          {/* Organization Info */}
          <Card withBorder p="md">
            <Group gap="md">
              <Avatar
                src={opportunity.organisation.logo}
                size={48}
                radius="md"
              >
                <IconBuilding size={24} />
              </Avatar>
              <Box>
                <Text size="sm" fw={600}>
                  {opportunity.organisation.name}
                </Text>
                <Text size="xs" c="dimmed">
                  Published {formatDate(opportunity.createdAt)}
                </Text>
              </Box>
            </Group>
          </Card>

          {/* Short Description */}
          {((isCall && opportunity.shortDescription) ||
            (isProject && opportunity.shortSummary)) && (
            <Card withBorder p="md" bg={theme.colors.gray[0]}>
              <Text size="sm">
                {isCall
                  ? opportunity.shortDescription
                  : opportunity.shortSummary}
              </Text>
            </Card>
          )}

          {/* Key Info Grid */}
          <Grid gutter="md">
            <Grid.Col span={6}>
              <Card withBorder p="md">
                <Group gap="xs" mb="xs">
                  <IconCurrencyEuro size={18} color={theme.colors.blue[6]} />
                  <Text size="sm" fw={600}>
                    Budget
                  </Text>
                </Group>
                <Text size="md" fw={600}>
                  {formatBudget(opportunity.budget)}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card withBorder p="md">
                <Group gap="xs" mb="xs">
                  <IconCalendar size={18} color={theme.colors.red[6]} />
                  <Text size="sm" fw={600}>
                    Deadline
                  </Text>
                </Group>
                <Text size="md" fw={600}>
                  {formatDeadline(opportunity.deadline)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatDate(opportunity.deadline)}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card withBorder p="md">
                <Group gap="xs" mb="xs">
                  <IconMapPin size={18} color={theme.colors.green[6]} />
                  <Text size="sm" fw={600}>
                    Location
                  </Text>
                </Group>
                <Text size="md" fw={600}>
                  {opportunity.location}
                </Text>
              </Card>
            </Grid.Col>
            {opportunity.projectDuration && (
              <Grid.Col span={6}>
                <Card withBorder p="md">
                  <Group gap="xs" mb="xs">
                    <IconClock size={18} color={theme.colors.violet[6]} />
                    <Text size="sm" fw={600}>
                      Duration
                    </Text>
                  </Group>
                  <Text size="md" fw={600}>
                    {opportunity.projectDuration}
                  </Text>
                </Card>
              </Grid.Col>
            )}
            {opportunity.maxPartners && (
              <Grid.Col span={6}>
                <Card withBorder p="md">
                  <Group gap="xs" mb="xs">
                    <IconUsers size={18} color={theme.colors.cyan[6]} />
                    <Text size="sm" fw={600}>
                      Max Partners
                    </Text>
                  </Group>
                  <Text size="md" fw={600}>
                    {opportunity.maxPartners}
                  </Text>
                </Card>
              </Grid.Col>
            )}
            <Grid.Col span={6}>
              <Card withBorder p="md">
                <Group gap="xs" mb="xs">
                  <IconMessage size={18} color={theme.colors.orange[6]} />
                  <Text size="sm" fw={600}>
                    Applications
                  </Text>
                </Group>
                <Text size="md" fw={600}>
                  {opportunity.applicationsCount}
                </Text>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Description */}
          <Card withBorder p="md">
            <Text size="sm" fw={600} mb="md">
              Description
            </Text>
            <Text size="sm" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
              {opportunity.description}
            </Text>
          </Card>

          {/* Thematic Areas */}
          {opportunity.thematicAreas && opportunity.thematicAreas.length > 0 && (
            <Card withBorder p="md">
              <Text size="sm" fw={600} mb="md">
                Thematic Areas
              </Text>
              <Group gap="xs">
                {opportunity.thematicAreas.map((area, index) => (
                  <Badge key={index} size="md" variant="light" color="blue">
                    {area}
                  </Badge>
                ))}
              </Group>
            </Card>
          )}

          {/* Required Expertise */}
          {opportunity.requiredExpertise &&
            opportunity.requiredExpertise.length > 0 && (
              <Card withBorder p="md">
                <Text size="sm" fw={600} mb="md">
                  Required Expertise
                </Text>
                <Group gap="xs">
                  {opportunity.requiredExpertise.map((expertise, index) => (
                    <Badge key={index} size="md" variant="light" color="grape">
                      {expertise}
                    </Badge>
                  ))}
                </Group>
              </Card>
            )}

          {/* Call-specific Information */}
          {isCall && (
            <>
              {opportunity.callType && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="xs">
                    Call Type
                  </Text>
                  <Text size="md">{opportunity.callType}</Text>
                </Card>
              )}

              {opportunity.eligibleRegions &&
                opportunity.eligibleRegions.length > 0 && (
                  <Card withBorder p="md">
                    <Text size="sm" fw={600} mb="md">
                      Eligible Regions
                    </Text>
                    <Group gap="xs">
                      {opportunity.eligibleRegions.map((region, index) => (
                        <Badge key={index} size="sm" variant="light" color="cyan">
                          {region}
                        </Badge>
                      ))}
                    </Group>
                  </Card>
                )}

              {opportunity.eligibilityCriteria && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="md">
                    Eligibility Criteria
                  </Text>
                  <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                    {opportunity.eligibilityCriteria}
                  </Text>
                </Card>
              )}

              {opportunity.requiredDocuments &&
                opportunity.requiredDocuments.length > 0 && (
                  <Card withBorder p="md">
                    <Text size="sm" fw={600} mb="md">
                      Required Documents
                    </Text>
                    <Stack gap="xs">
                      {opportunity.requiredDocuments.map((doc, index) => (
                        <Group key={index} gap="xs">
                          <IconFileText size={16} color={theme.colors.blue[6]} />
                          <Text size="sm">{doc}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Card>
                )}

              {(opportunity.applicationLink ||
                opportunity.guidelinePdfUrl ||
                opportunity.faqLink) && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="md">
                    Resources & Links
                  </Text>
                  <Stack gap="sm">
                    {opportunity.applicationLink && (
                      <Anchor
                        href={opportunity.applicationLink}
                        target="_blank"
                      >
                        <Group gap="xs">
                          <IconLink size={16} color={theme.colors.blue[6]} />
                          <Text size="sm">Application Portal</Text>
                        </Group>
                      </Anchor>
                    )}
                    {opportunity.guidelinePdfUrl && (
                      <Anchor
                        href={opportunity.guidelinePdfUrl}
                        target="_blank"
                      >
                        <Group gap="xs">
                          <IconDownload size={16} color={theme.colors.red[6]} />
                          <Text size="sm">Guidelines (PDF)</Text>
                        </Group>
                      </Anchor>
                    )}
                    {opportunity.faqLink && (
                      <Anchor href={opportunity.faqLink} target="_blank">
                        <Group gap="xs">
                          <IconFileText size={16} color={theme.colors.green[6]} />
                          <Text size="sm">FAQ</Text>
                        </Group>
                      </Anchor>
                    )}
                  </Stack>
                </Card>
              )}

              {opportunity.contact &&
                (opportunity.contact.name ||
                  opportunity.contact.email ||
                  opportunity.contact.phone) && (
                  <Card withBorder p="md">
                    <Text size="sm" fw={600} mb="md">
                      Contact Information
                    </Text>
                    <Stack gap="sm">
                      {opportunity.contact.name && (
                        <Group gap="xs">
                          <IconUsers size={16} />
                          <Text size="sm">{opportunity.contact.name}</Text>
                        </Group>
                      )}
                      {opportunity.contact.email && (
                        <Group gap="xs">
                          <IconMail size={16} color={theme.colors.blue[6]} />
                          <Anchor href={`mailto:${opportunity.contact.email}`} size="sm">
                            {opportunity.contact.email}
                          </Anchor>
                        </Group>
                      )}
                      {opportunity.contact.phone && (
                        <Group gap="xs">
                          <IconPhone size={16} />
                          <Text size="sm">{opportunity.contact.phone}</Text>
                        </Group>
                      )}
                    </Stack>
                  </Card>
                )}
            </>
          )}

          {/* Project-specific Information */}
          {isProject && (
            <>
              {opportunity.category && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="xs">
                    Category
                  </Text>
                  <Text size="md">{opportunity.category}</Text>
                </Card>
              )}

              {opportunity.projectStatus && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="xs">
                    Project Status
                  </Text>
                  <Badge
                    size="lg"
                    variant="light"
                    color={
                      opportunity.projectStatus === "completed"
                        ? "green"
                        : opportunity.projectStatus === "ongoing"
                          ? "blue"
                          : "gray"
                    }
                  >
                    {opportunity.projectStatus.charAt(0).toUpperCase() +
                      opportunity.projectStatus.slice(1)}
                  </Badge>
                </Card>
              )}

              {(opportunity.startDate || opportunity.endDate) && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="md">
                    Project Timeline
                  </Text>
                  <Stack gap="sm">
                    {opportunity.startDate && (
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">
                          Start:
                        </Text>
                        <Text size="sm" fw={500}>
                          {formatDate(opportunity.startDate)}
                        </Text>
                      </Group>
                    )}
                    {opportunity.endDate && !opportunity.ongoing && (
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">
                          End:
                        </Text>
                        <Text size="sm" fw={500}>
                          {formatDate(opportunity.endDate)}
                        </Text>
                      </Group>
                    )}
                    {opportunity.ongoing && (
                      <Badge color="blue" variant="light">
                        Ongoing Project
                      </Badge>
                    )}
                  </Stack>
                </Card>
              )}

              {opportunity.fundingSource && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="xs">
                    Funding Source
                  </Text>
                  <Text size="md">{opportunity.fundingSource}</Text>
                </Card>
              )}

              {opportunity.tags && opportunity.tags.length > 0 && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="md">
                    Tags
                  </Text>
                  <Group gap="xs">
                    {opportunity.tags.map((tag, index) => (
                      <Badge key={index} size="sm" variant="light" color="indigo">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </Card>
              )}

              {opportunity.partnerOrganisationNames &&
                opportunity.partnerOrganisationNames.length > 0 && (
                  <Card withBorder p="md">
                    <Text size="sm" fw={600} mb="md">
                      Partner Organizations
                    </Text>
                    <Stack gap="xs">
                      {opportunity.leadOrganisationName && (
                        <Group gap="xs">
                          <IconAward size={16} color={theme.colors.yellow[6]} />
                          <Text size="sm" fw={500}>
                            {opportunity.leadOrganisationName} (Lead)
                          </Text>
                        </Group>
                      )}
                      {opportunity.partnerOrganisationNames.map(
                        (partner, index) => (
                          <Group key={index} gap="xs">
                            <IconBuilding size={16} color={theme.colors.gray[6]} />
                            <Text size="sm">{partner}</Text>
                          </Group>
                        )
                      )}
                    </Stack>
                  </Card>
                )}

              {opportunity.outcomes && (
                <Card withBorder p="md" bg={theme.colors.gray[0]}>
                  <Text size="sm" fw={600} mb="md">
                    Key Outcomes
                  </Text>
                  <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                    {opportunity.outcomes}
                  </Text>
                </Card>
              )}

              {opportunity.projectManager &&
                (opportunity.projectManager.name ||
                  opportunity.projectManager.email ||
                  opportunity.projectManager.phone) && (
                  <Card withBorder p="md">
                    <Text size="sm" fw={600} mb="md">
                      Project Manager
                    </Text>
                    <Stack gap="sm">
                      {opportunity.projectManager.name && (
                        <Group gap="xs">
                          <IconUsers size={16} />
                          <Text size="sm">{opportunity.projectManager.name}</Text>
                        </Group>
                      )}
                      {opportunity.projectManager.email && (
                        <Group gap="xs">
                          <IconMail size={16} color={theme.colors.blue[6]} />
                          <Anchor href={`mailto:${opportunity.projectManager.email}`} size="sm">
                            {opportunity.projectManager.email}
                          </Anchor>
                        </Group>
                      )}
                      {opportunity.projectManager.phone && (
                        <Group gap="xs">
                          <IconPhone size={16} />
                          <Text size="sm">{opportunity.projectManager.phone}</Text>
                        </Group>
                      )}
                    </Stack>
                  </Card>
                )}

              {opportunity.website && (
                <Card withBorder p="md">
                  <Text size="sm" fw={600} mb="md">
                    Website
                  </Text>
                  <Anchor href={opportunity.website} target="_blank">
                    <Group gap="xs">
                      <IconWorld size={16} color={theme.colors.blue[6]} />
                      <Text size="sm">{opportunity.website}</Text>
                    </Group>
                  </Anchor>
                </Card>
              )}
            </>
          )}

          {/* Footer Actions */}
          <Group justify="space-between" mt="md">
            <Badge variant="light" color="gray">
              {opportunity.visibility || "Public"}
            </Badge>
            <Group>
              {isSuperAdmin && opportunity.createdByOrganisationId && opportunity.status === "active" && (
                <Button
                  variant="light"
                  color="orange"
                  size="sm"
                  leftSection={<IconPower size={16} />}
                  onClick={() => {
                    if (confirm(`Are you sure you want to deactivate this ${opportunity.type === "call" ? "call" : "project"}?`)) {
                      onStatusUpdate?.(opportunity, "draft");
                    }
                  }}
                >
                  Deactivate
                </Button>
              )}
              <Button variant="subtle" onClick={onClose}>
                Close
              </Button>
              {showApplyButton &&
                onApply &&
                opportunity.status === "active" &&
                opportunity.createdByOrganisationId !==
                  currentOrganisationId && (
                  <Button
                    leftSection={<IconMessage size={16} />}
                    onClick={onApply}
                  >
                    {isCall ? "Apply Now" : "Contact Organization"}
                  </Button>
                )}
            </Group>
          </Group>
        </Stack>
      </ScrollArea.Autosize>
    </Modal>
  );
};

export default CallProjectPreview;
