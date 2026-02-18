import { useEffect } from "react";
import {
  Card,
  Group,
  Avatar,
  Text,
  Grid,
  Badge,
  Stack,
  Center,
  Loader,
  Button,
  Box,
  ActionIcon,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBuilding,
  IconStar,
  IconEye,
  IconTrash,
} from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { ProfileFormData } from "../../../types/profile";
import ProfileStepWrapper from "../ProfileStepWrapper";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../../store";
import { notifications } from "@mantine/notifications";
import { fetchFavorites, removeFavorite, FavoriteOrganisation } from "../../../store/slices/organisationSlice";

interface PartnershipInterestsStepProps {
  form: UseFormReturnType<ProfileFormData>;
  onFieldChange?: (field: string, value: any) => void;
}

export default function PartnershipInterestsStep({
  form: _form,
  onFieldChange: _onFieldChange,
}: PartnershipInterestsStepProps) {
  const theme = useMantineTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const { favoriteOrganisations, isLoadingFavorites } = useSelector(
    (state: RootState) => state.organisation
  );

  useEffect(() => {
    if (token) {
      dispatch(fetchFavorites(token) as any);
    }
  }, [token, dispatch]);

  const handleRemoveFavorite = async (orgId: string) => {
    if (!token) return;
    
    try {
      const result = await dispatch(removeFavorite({ organisationId: orgId, token }) as any);
      if (removeFavorite.fulfilled.match(result)) {
        notifications.show({
          title: "Success",
          message: "Organisation removed from favorites",
          color: "green",
        });
      } else {
        notifications.show({
          title: "Error",
          message: result.payload || "Failed to remove from favorites",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      notifications.show({
        title: "Error",
        message: "Failed to remove from favorites",
        color: "red",
      });
    }
  };

  return (
    <ProfileStepWrapper
      title="Partnership Interests"
      description="Your favorite organizations for potential partnerships."
    >
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="lg">
          <Text size="lg" fw={600}>
            Favorite Organizations
          </Text>
          <Badge size="lg" variant="light" color="blue">
            {favoriteOrganisations.length} {favoriteOrganisations.length === 1 ? 'Favorite' : 'Favorites'}
          </Badge>
        </Group>

        {isLoadingFavorites ? (
          <Center py={60}>
            <Loader size="md" />
          </Center>
        ) : favoriteOrganisations.length > 0 ? (
          <Grid>
            {favoriteOrganisations.map((org: FavoriteOrganisation) => (
              <Grid.Col key={org.id} span={{ base: 12, md: 6 }}>
                <Card withBorder p="md" radius="md">
                  <Group gap="md">
                    <Avatar src={org.logo} size={48} radius="md">
                      <IconBuilding size={24} />
                    </Avatar>
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={600}>
                        {org.name}
                      </Text>
                      {org.nameLocal && (
                        <Text size="xs" c="dimmed">
                          {org.nameLocal}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed">
                        {org.city ? `${org.city}, ` : ''}{org.country}
                      </Text>
                    </Box>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        title="View Profile"
                        onClick={() => navigate(`/organisations/${org.id}`)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        title="Remove from Favorites"
                        onClick={() => handleRemoveFavorite(org.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Stack align="center" gap="md" py="xl">
            <IconStar size={48} color={theme.colors.gray[4]} />
            <Text size="lg" fw={500} c="dimmed">
              No favorite organizations yet
            </Text>
            <Text size="sm" c="dimmed" ta="center" maw={400}>
              Browse organizations and click the favorite button to save them
              here for quick access
            </Text>
            <Button
              variant="light"
              leftSection={<IconBuilding size={16} />}
              onClick={() => navigate("/dashboard/organisations")}
            >
              Browse Organizations
            </Button>
          </Stack>
        )}
      </Card>
    </ProfileStepWrapper>
  );
}
