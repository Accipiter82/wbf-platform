import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Title,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Grid,
  Avatar,
  LoadingOverlay,
  Alert,
  Divider,
  List,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBuilding,
  IconMapPin,
  IconGlobe,
  IconPhone,
  IconMail,
  IconUsers,
} from "@tabler/icons-react";
import { RootState } from "../store";
import { fetchOrganisation } from "../store/slices/organisationSlice";
import { useMantineTheme } from "@mantine/core";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function OrganisationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrganisation, isLoading, error } = useSelector(
    (state: RootState) => state.organisation
  );
  const theme = useMantineTheme();

  useEffect(() => {
    if (id) {
      dispatch(fetchOrganisation(id) as any);
    }
  }, [dispatch, id]);

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <Container size="md" mt="xl">
        <Alert color="red" title="Error" mb="md">
          {error}
        </Alert>
        <Button
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate("/browse")}
        >
          Back to Browse
        </Button>
      </Container>
    );
  }

  if (!currentOrganisation) {
    return (
      <Container size="md" mt="xl">
        <Text size="lg" c="dimmed" ta="center" mb="md">
          Organisation not found
        </Text>
        <Button
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate("/browse")}
        >
          Back to Browse
        </Button>
      </Container>
    );
  }

  const org = currentOrganisation;

  return (
    <DashboardLayout>
      <Container size="xl" py="xl">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={() => navigate("/browse")}
          mb="lg"
        >
          Back to Browse
        </Button>

        <Card shadow="md" p="xl">
          <Stack gap="xl">
            {/* Header */}
            <Group>
              <Avatar size="xl" color="brand">
                {org.images.logo ? (
                  <img src={org.images.logo} alt={org.name} />
                ) : (
                  <IconBuilding size={32} color={theme.colors.brand[7]} />
                )}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Title order={2} c={theme.colors.brand[7]}>
                  {org.name}
                </Title>
                <Text size="lg" c="dimmed">
                  {org.nameLocal}
                </Text>
                <Group gap="xs" mt="xs">
                  <Badge color="brand">{org.type}</Badge>
                  <Badge color="green">
                    Est. {org.profile.yearOfEstablishment}
                  </Badge>
                </Group>
              </div>
            </Group>

            <Divider />

            {/* Basic Information */}
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="md">
                  <Title order={4}>Basic Information</Title>

                  <Group gap="xs">
                    <IconMapPin size={16} />
                    <Text size="sm">
                      <strong>Location:</strong> {org.profile.city}
                    </Text>
                  </Group>

                  <Text size="sm">
                    <strong>Contracting Party:</strong>{" "}
                    {org.profile.contractingParty}
                  </Text>

                  <Text size="sm">
                    <strong>Postal Address:</strong> {org.contact.address}
                  </Text>

                  {org.profile.registrationNumber && (
                    <Text size="sm">
                      <strong>Registration Number:</strong>{" "}
                      {org.profile.registrationNumber}
                    </Text>
                  )}

                  <Group gap="xs">
                    <IconUsers size={16} />
                    <Text size="sm">
                      <strong>Staff:</strong> {org.profile.numberOfStaff || 0} |
                      <strong> Volunteers:</strong>{" "}
                      {org.profile.numberOfVolunteers || 0}
                    </Text>
                  </Group>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="md">
                  <Title order={4}>Contact Information</Title>

                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text size="sm">
                      <strong>Email:</strong> {org.contact.email}
                    </Text>
                  </Group>

                  {org.contact.phone && (
                    <Group gap="xs">
                      <IconPhone size={16} />
                      <Text size="sm">
                        <strong>Phone:</strong> {org.contact.phone}
                      </Text>
                    </Group>
                  )}

                  <Text size="sm">
                    <strong>Contact Person:</strong> {org.contact.personName}
                  </Text>

                  {org.contact.personPosition && (
                    <Text size="sm">
                      <strong>Position:</strong> {org.contact.personPosition}
                    </Text>
                  )}

                  {org.contact.website && (
                    <Group gap="xs">
                      <IconGlobe size={16} color={theme.colors.brand[7]} />
                      <a
                        href={org.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: theme.colors.brand[7],
                          textDecoration: "underline",
                          fontWeight: 500,
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.color = theme.colors.brand[6])
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.color = theme.colors.brand[7])
                        }
                      >
                        <strong>Website:</strong> {org.contact.website}
                      </a>
                    </Group>
                  )}
                </Stack>
              </Grid.Col>
            </Grid>

            <Divider />

            {/* Mission Fields */}
            {org.fields.missionFields &&
              org.fields.missionFields.length > 0 && (
                <div>
                  <Title order={4} mb="md">
                    Mission Fields
                  </Title>
                  <Group gap="xs">
                    {org.fields.missionFields.map((field, index) => (
                      <Badge key={index} size="md" variant="light">
                        {field}
                      </Badge>
                    ))}
                  </Group>
                </div>
              )}

            {/* Project History */}
            {org.projects && org.projects.length > 0 && (
              <div>
                <Title order={4} mb="md">
                  Project History
                </Title>
                <List>
                  {org.projects.map((project, index) => (
                    <List.Item key={index}>
                      <Text size="sm" fw={500}>
                        {project.title}
                      </Text>
                      {project.description && (
                        <Text size="sm" c="dimmed">
                          {project.description}
                        </Text>
                      )}
                    </List.Item>
                  ))}
                </List>
              </div>
            )}

            {/* Partnership Interests */}
            {org.fields.lookingForPartnersInThematicAreas &&
              org.fields.lookingForPartnersInThematicAreas.length > 0 && (
                <div>
                  <Title order={4} mb="md">
                    Partnership Interests
                  </Title>
                  <Stack gap="sm">
                    <div>
                      <Text size="sm" fw={500}>
                        Looking for partners in:
                      </Text>
                      <Group gap="xs" mt="xs">
                        {org.fields.lookingForPartnersInThematicAreas.map(
                          (area, index) => (
                            <Badge key={index} size="sm" color="blue">
                              {area}
                            </Badge>
                          )
                        )}
                      </Group>
                    </div>

                    {org.fields.preferredRole &&
                      org.fields.preferredRole.length > 0 && (
                        <div>
                          <Text size="sm" fw={500}>
                            Preferred role:
                          </Text>
                          <Group gap="xs" mt="xs">
                            {org.fields.preferredRole.map((role, index) => (
                              <Badge key={index} size="sm" color="green">
                                {role}
                              </Badge>
                            ))}
                          </Group>
                        </div>
                      )}
                  </Stack>
                </div>
              )}

            {/* Expertise */}
            {org.fields.expertiseOffered &&
              org.fields.expertiseOffered.length > 0 && (
                <div>
                  <Title order={4} mb="md">
                    Expertise
                  </Title>
                  <Grid>
                    {org.fields.expertiseOffered.length > 0 && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="sm" fw={500} mb="xs">
                          Expertise Offered:
                        </Text>
                        <Group gap="xs">
                          {org.fields.expertiseOffered.map(
                            (expertise, index) => (
                              <Badge key={index} size="sm" color="teal">
                                {expertise}
                              </Badge>
                            )
                          )}
                        </Group>
                      </Grid.Col>
                    )}
                    {org.fields.expertiseSought &&
                      org.fields.expertiseSought.length > 0 && (
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Text size="sm" fw={500} mb="xs">
                            Expertise Sought:
                          </Text>
                          <Group gap="xs">
                            {org.fields.expertiseSought.map(
                              (expertise, index) => (
                                <Badge key={index} size="sm" color="orange">
                                  {expertise}
                                </Badge>
                              )
                            )}
                          </Group>
                        </Grid.Col>
                      )}
                  </Grid>
                </div>
              )}

            {/* Additional Information */}
            {org.fields.keywords && org.fields.keywords.length > 0 && (
              <div>
                <Title order={4} mb="md">
                  Keywords
                </Title>
                <Group gap="xs">
                  {org.fields.keywords.map((keyword, index) => (
                    <Badge key={index} size="sm" variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}
          </Stack>
        </Card>
      </Container>
    </DashboardLayout>
  );
}
