import { useEffect, useState } from "react";
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
  Modal,
  Textarea,
  Alert,
  LoadingOverlay,
  Grid,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import { RootState } from "../store";
import {
  fetchPendingOrganisations,
  reviewOrganisation,
} from "../store/slices/adminSlice";
import { Organisation } from "../types";

export default function AdminReviewPage() {
  const dispatch = useDispatch();
  const { pendingOrganisations, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [reviewAction, setReviewAction] = useState<
    "approve" | "decline" | null
  >(null);
  const [feedback, setFeedback] = useState("");
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    dispatch(fetchPendingOrganisations({ page: 1, limit: 50 }) as any);
  }, [dispatch]);

  const handleReview = (org: Organisation, action: "approve" | "decline") => {
    setSelectedOrg(org);
    setReviewAction(action);
    setFeedback("");
    open();
  };

  const submitReview = async () => {
    if (!selectedOrg || !reviewAction) return;

    try {
      await dispatch(
        reviewOrganisation({
          id: selectedOrg.id,
          review: {
            action: reviewAction,
            feedback: reviewAction === "decline" ? feedback : undefined,
          },
          token: localStorage.getItem("token") || "",
        }) as any
      );

      close();
      setSelectedOrg(null);
      setReviewAction(null);
      setFeedback("");

      // Refresh the list
      dispatch(fetchPendingOrganisations({ page: 1, limit: 50 }) as any);
    } catch (error) {
      // Error is handled by the Redux slice
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "gray",
      pending: "yellow",
      approved: "green",
      declined: "red",
    };
    return (
      <Badge color={colors[status as keyof typeof colors]}>{status}</Badge>
    );
  };

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  return (
    <Container size="xl">
      <Title order={2} mb="lg">
        Admin Review - Pending Organisations
      </Title>

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

      {pendingOrganisations.length === 0 ? (
        <Card p="xl" ta="center">
          <Text size="lg" c="dimmed">
            No pending organisations to review
          </Text>
        </Card>
      ) : (
        <Stack>
          {pendingOrganisations.map((org) => (
            <Card key={org.id} shadow="sm" p="lg">
              <Grid>
                <Grid.Col span={8}>
                  <Stack gap="xs">
                    <Group>
                      <Title order={4}>{org.name}</Title>
                      {getStatusBadge(org.status)}
                    </Group>

                    <Text size="sm" c="dimmed">
                      Contact: {org.contact?.personName} ({org.contact?.email})
                    </Text>

                    <Text size="sm">
                      <strong>City:</strong> {org.profile?.city} |{" "}
                      <strong>Type:</strong> {org.type}
                    </Text>

                    {org.fields?.missionFields &&
                      org.fields.missionFields.length > 0 && (
                        <Text size="sm">
                          <strong>Mission Fields:</strong>{" "}
                          {org.fields.missionFields.join(", ")}
                        </Text>
                      )}

                    <Text size="sm">
                      <strong>Established:</strong>{" "}
                      {org.profile?.yearOfEstablishment} |
                      <strong> Staff:</strong> {org.profile?.numberOfStaff || 0}{" "}
                      |<strong> Volunteers:</strong>{" "}
                      {org.profile?.numberOfVolunteers || 0}
                    </Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={4}>
                  <Stack gap="sm">
                    <Button
                      leftSection={<IconCheck size={16} />}
                      color="green"
                      fullWidth
                      onClick={() => handleReview(org, "approve")}
                    >
                      Approve
                    </Button>

                    <Button
                      leftSection={<IconX size={16} />}
                      color="red"
                      variant="outline"
                      fullWidth
                      onClick={() => handleReview(org, "decline")}
                    >
                      Decline
                    </Button>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          ))}
        </Stack>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={`${reviewAction === "approve" ? "Approve" : "Decline"} Organisation`}
        size="md"
      >
        <Stack>
          {selectedOrg && (
            <div>
              <Text size="sm" fw={500} mb="xs">
                Organisation: {selectedOrg.name}
              </Text>
              <Text size="sm" c="dimmed">
                Contact: {selectedOrg.contact?.personName} (
                {selectedOrg.contact?.email})
              </Text>
            </div>
          )}

          {reviewAction === "decline" && (
            <Textarea
              label="Feedback (required for decline)"
              placeholder="Please provide feedback on why this organisation was declined..."
              value={feedback}
              onChange={(e) => setFeedback(e.currentTarget.value)}
              minRows={3}
              required
            />
          )}

          {reviewAction === "approve" && (
            <Alert color="green" title="Approval">
              This organisation will be approved and gain access to the
              platform.
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              color={reviewAction === "approve" ? "green" : "red"}
              onClick={submitReview}
              disabled={reviewAction === "decline" && !feedback.trim()}
            >
              {reviewAction === "approve" ? "Approve" : "Decline"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
