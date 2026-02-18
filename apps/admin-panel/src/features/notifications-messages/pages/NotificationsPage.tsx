import { useState, useEffect } from "react";
import {
  Title,
  Text,
  Grid,
  Card,
  Group,
  Badge,
  Stack,
  Button,
  Box,
  TextInput,
  useMantineTheme,
  ActionIcon,
  Modal,
  Textarea,
  Avatar,
  Divider,
  ScrollArea,
  UnstyledButton,
  Center,
  Loader,
  Alert,
  SegmentedControl,
} from "@mantine/core";
import {
  IconMessage,
  IconMail,
  IconSend,
  IconBuilding,
  IconX,
  IconAlertCircle,
  IconSearch,
} from "@tabler/icons-react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import {
  messagingService,
  Conversation,
  Message as BackendMessage,
  OrganisationSummary,
} from "../../../services/messagingService";
import { notifications } from "@mantine/notifications";

export default function NotificationsPage() {
  const theme = useMantineTheme();
  const { organisation } = useSelector((state: RootState) => state.auth);

  // Backend data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState({
    total: 0,
    inbox: 0,
    applications: 0,
    projects: 0,
    calls: 0,
    starred: 0,
    archived: 0,
    notifications: 0,
  });

  // UI states
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<BackendMessage[]>(
    []
  );
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipientId: "",
    recipientName: "",
    subject: "",
    content: "",
  });

  // Organization lookup states
  const [organisations, setOrganisations] = useState<OrganisationSummary[]>([]);
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  // Message type filter
  const [messageTypeFilter, setMessageTypeFilter] = useState<"direct" | "application">("direct");

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await messagingService.getConversations({
        category: "inbox" as any,
        limit: 100,
      });

      setConversations(response.conversations);
      setUnreadCounts({
        ...response.unreadCounts,
        notifications: response.unreadCounts.notifications || 0,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load conversations");
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      
      // Immediately update UI to show unreadCount as 0 (optimistic update)
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ));
      
      // Update selected conversation unread count immediately
      setSelectedConversation(prev => prev ? { ...prev, unreadCount: 0 } : null);
      
      // Call backend to mark all messages as read and get messages
      const response = await messagingService.getMessages(conversationId);
      setSelectedMessages(response.messages);
      
      // Update selected conversation with backend response (which has unreadCount: 0)
      if (response.conversation) {
        setSelectedConversation({
          ...response.conversation,
          unreadCount: 0
        });
      }
      
      // Small delay to ensure backend updates are committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reload conversations to get updated unread counts from backend
      const response2 = await messagingService.getConversations({
        category: "inbox" as any,
        limit: 100,
      });
      
      // Update conversations list with fresh data from backend, ensuring opened conversation has unreadCount: 0
      const updatedConversations = response2.conversations.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      
      setConversations(updatedConversations);
      setUnreadCounts({
        ...response2.unreadCounts,
        notifications: response2.unreadCounts.notifications || 0,
      });
      
      // Ensure selected conversation is updated with latest data and unreadCount is 0
      const updatedConversation = updatedConversations.find(c => c.id === conversationId);
      if (updatedConversation) {
        setSelectedConversation({
          ...updatedConversation,
          unreadCount: 0 // Force to 0
        });
      }
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to load messages",
        color: "red",
      });
      console.error("Error loading messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  // Load organizations for compose modal
  const loadOrganisations = async (search?: string) => {
    try {
      setLoadingOrgs(true);
      const response = await messagingService.getAllOrganisations(search);

      // Filter out current organization
      const filteredOrgs = response.organisations.filter(
        (org) => org.id !== organisation?.id
      );

      setOrganisations(filteredOrgs);
    } catch (err: any) {
      console.error("Error loading organisations:", err);
      notifications.show({
        title: "Error",
        message: err.message || "Failed to load organisations",
        color: "red",
      });
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Organization search with debounce
  useEffect(() => {
    if (showComposeModal) {
      const timeoutId = setTimeout(() => {
        loadOrganisations(orgSearchTerm.trim() || undefined);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [orgSearchTerm, showComposeModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-org-selector]")) {
        setShowOrgDropdown(false);
      }
    };

    if (showOrgDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showOrgDropdown]);


  const sendMessage = async () => {
    if (!selectedConversation || !composeForm.content.trim()) return;

    try {
      await messagingService.sendMessage(selectedConversation.id, {
        content: composeForm.content.trim(),
        type: "text",
        priority: "medium",
      });

      // Reload messages
      await loadMessages(selectedConversation.id);

      // Clear form
      setComposeForm({
        recipientId: "",
        recipientName: "",
        subject: "",
        content: "",
      });
      setShowComposeModal(false);

      notifications.show({
        title: "Success",
        message: "Message sent successfully",
        color: "green",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to send message",
        color: "red",
      });
    }
  };

  const createDirectMessage = async () => {
    if (
      !composeForm.recipientId.trim() ||
      !composeForm.subject.trim() ||
      !composeForm.content.trim()
    ) {
      notifications.show({
        title: "Error",
        message: "Please select a recipient and fill in all fields",
        color: "red",
      });
      return;
    }

    try {
      const result = await messagingService.createDirectMessage(
        composeForm.recipientId,
        composeForm.subject.trim(),
        composeForm.content.trim()
      );

      // Close modal and reset form
      setShowComposeModal(false);
      setComposeForm({
        recipientId: "",
        recipientName: "",
        subject: "",
        content: "",
      });
      setOrgSearchTerm("");
      setShowOrgDropdown(false);

      // Refresh conversations to show the new one
      await loadConversations();

      // Open the new conversation
      setSelectedConversation(result.conversation);
      await loadMessages(result.conversation.id);

      notifications.show({
        title: "Success",
        message: `Message sent to ${composeForm.recipientName}`,
        color: "green",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to create message",
        color: "red",
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    // Handle Firebase Timestamp
    const date = timestamp._seconds
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // State for storing organization logos
  const [orgLogos, setOrgLogos] = useState<Record<string, string>>({});

  // Load organization logos for conversations
  useEffect(() => {
    const loadOrgLogos = async () => {
      const uniqueOrgIds = new Set<string>();
      conversations.forEach((conv) => {
        conv.participants.forEach((p) => {
          if (p !== organisation?.id) {
            uniqueOrgIds.add(p);
          }
        });
      });

      // Fetch organization logos
      const logos: Record<string, string> = {};
      for (const orgId of uniqueOrgIds) {
        try {
          const response = await fetch(
            `${(import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api"}/organisation/${orgId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const data = await response.json();
          if (data.success) {
            logos[orgId] = data.data.images?.logo || "";
          }
        } catch (error) {
          console.error(`Error fetching org ${orgId}:`, error);
          logos[orgId] = "";
        }
      }
      setOrgLogos(logos);
    };

    if (conversations.length > 0) {
      loadOrgLogos();
    }
  }, [conversations, organisation?.id]);

  const ConversationItem = ({
    conversation,
  }: {
    conversation: Conversation;
  }) => {
    // Get other participant(s) for display
    const otherParticipants = conversation.participants.filter(
      (p) => p !== organisation?.id
    );
    const otherOrgId = otherParticipants.length > 0 ? otherParticipants[0] : "";
    
    // Get organization name from conversation participantNames or fallback
    const displayName = conversation.participantNames?.[otherOrgId] || otherOrgId;
    const displayLogo = orgLogos[otherOrgId] || "";

    // Build display title - just show organization name, don't show subject
    let displayTitle = displayName;
    if (conversation.metadata?.callTitle) {
      displayTitle = `${displayName} - ${conversation.metadata.callTitle}`;
    }

    const isSelected = selectedConversation?.id === conversation.id;

    return (
      <UnstyledButton
        type="button"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Opening conversation:", conversation.id);
          setSelectedConversation(conversation);
          await loadMessages(conversation.id);
        }}
        style={{
          display: "block",
          width: "100%",
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: isSelected 
            ? theme.colors.blue[1] 
            : (conversation.unreadCount > 0 ? theme.colors.blue[0] : "transparent"),
          border: `1px solid ${isSelected 
            ? theme.colors.blue[4] 
            : (conversation.unreadCount > 0 ? theme.colors.blue[3] : theme.colors.gray[3])}`,
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = theme.colors.gray[0];
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 
              conversation.unreadCount > 0 ? theme.colors.blue[0] : "transparent";
          }
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Group gap="md" align="flex-start" style={{ flex: 1 }}>
            <Avatar src={displayLogo} size="md" radius="md">
              <IconBuilding size={20} />
            </Avatar>

            <Box style={{ flex: 1 }}>
              <Group gap="xs" mb="xs">
                <Text
                  size="sm"
                  fw={600}
                  style={{
                    color:
                      conversation.unreadCount > 0
                        ? theme.colors.gray[9]
                        : theme.colors.gray[7],
                  }}
                  lineClamp={1}
                >
                  {displayTitle}
                </Text>
                {conversation.unreadCount > 0 && (
                  <Badge size="xs" color="blue" variant="filled">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </Group>

              <Text size="sm" c="dimmed" mb="xs" lineClamp={2}>
                {conversation.lastMessage?.content || "No messages yet"}
              </Text>

              <Group gap="xs" wrap="wrap">
                {conversation.type === "application" ? (
                  <Badge size="xs" variant="light" color="green">
                    Application
                  </Badge>
                ) : (
                  <Badge size="xs" variant="light" color="blue">
                    Direct Message
                  </Badge>
                )}

                <Text size="xs" c="dimmed">
                  {formatDate(
                    conversation.lastMessage?.timestamp ||
                      conversation.updatedAt
                  )}
                </Text>
              </Group>
            </Box>
          </Group>
        </Group>
      </UnstyledButton>
    );
  };


  return (
    <DashboardLayout>
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between">
          <Box>
            <Title order={1} size="2.5rem" mb="xs" c={theme.colors.gray[8]}>
              Messages
            </Title>
            <Text size="lg" c="dimmed">
              Stay connected with other organisations
            </Text>
          </Box>
        </Group>
      </Box>

      <Grid gutter="lg">
        {/* Messages List */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            {/* Header */}
            <Stack gap="md" mb="lg">
              <Group justify="space-between">
                <Group gap="xs">
                  <IconMail size={20} />
                  <Text size="lg" fw={600}>
                    Inbox
                  </Text>
                  {unreadCounts.inbox > 0 && (
                    <Badge size="sm" color="blue">
                      {unreadCounts.inbox}
                    </Badge>
                  )}
                </Group>
              </Group>
              
              {/* Message Type Toggle */}
              <SegmentedControl
                value={messageTypeFilter}
                onChange={(value) => setMessageTypeFilter(value as "direct" | "application")}
                data={[
                  { label: "Direct Messages", value: "direct" },
                  { label: "Applications", value: "application" },
                ]}
                fullWidth
              />
            </Stack>

            {/* Conversations List */}
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
                {error}
              </Alert>
            )}

            {loading ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" />
                  <Text size="sm" c="dimmed">
                    Loading...
                  </Text>
                </Stack>
              </Center>
            ) : (
              <ScrollArea h={700}>
                <Stack gap="xs">
                  {conversations
                    .filter((conv) => conv.type === messageTypeFilter)
                    .map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                      />
                    ))}
                  {conversations.filter((conv) => conv.type === messageTypeFilter).length === 0 && !loading && (
                    <Box ta="center" py="xl">
                      <Text c="dimmed">
                        No {messageTypeFilter === "direct" ? "direct messages" : "applications"} yet
                      </Text>
                    </Box>
                  )}
                </Stack>
              </ScrollArea>
            )}
          </Card>
        </Grid.Col>

        {/* Conversation Chat Area */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          {selectedConversation ? (
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: "780px", display: "flex", flexDirection: "column" }}>
              {/* Conversation Header - Fixed */}
              <Box>
                <Group justify="space-between" mb="md">
                  <Group>
                    <Avatar 
                      src={(() => {
                        // Defensive check for participants array
                        if (!selectedConversation.participants) return "";
                        
                        const otherOrgId = selectedConversation.participants.find(
                          (p) => p !== organisation?.id
                        );
                        return otherOrgId ? orgLogos[otherOrgId] : "";
                      })()} 
                      size="md" 
                      radius="md"
                    >
                      <IconBuilding size={20} />
                    </Avatar>
                    <Box>
                      <Text size="sm" fw={600}>
                        {(() => {
                          // Defensive check for participants array
                          if (!selectedConversation.participants) return "Unknown";
                          
                          const otherOrgId = selectedConversation.participants.find(
                            (p) => p !== organisation?.id
                          );
                          const orgName = otherOrgId 
                            ? (selectedConversation.participantNames?.[otherOrgId] || otherOrgId)
                            : "Unknown";
                          
                          if (selectedConversation.metadata?.callTitle) {
                            return `${orgName} - ${selectedConversation.metadata.callTitle}`;
                          }
                          return orgName;
                        })()}
                      </Text>
                      <Badge
                        size="xs"
                        variant="light"
                        color={
                          selectedConversation.type === "application"
                            ? "green"
                            : "blue"
                        }
                      >
                        {selectedConversation.type === "application"
                          ? "Application"
                          : "Direct Message"}
                      </Badge>
                    </Box>
                  </Group>
                </Group>

                <Divider mb="md" />
              </Box>

              {/* Messages - Scrollable */}
              {messagesLoading ? (
                <Center style={{ flex: 1 }}>
                  <Loader size="sm" />
                </Center>
              ) : (
                <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                  <Stack gap="sm" p="xs">
                    {selectedMessages.map((message) => (
                      <Box
                        key={message.id}
                        style={{
                          display: "flex",
                          gap: theme.spacing.sm,
                          justifyContent:
                            message.senderId === organisation?.id
                              ? "flex-end"
                              : "flex-start",
                        }}
                      >
                        {message.senderId !== organisation?.id && (
                          <Avatar
                            src={message.senderLogo}
                            size="sm"
                            radius="xl"
                          >
                            <IconBuilding size={16} />
                          </Avatar>
                        )}
                        <Box
                          style={{
                            maxWidth: "70%",
                            padding: theme.spacing.md,
                            backgroundColor:
                              message.senderId === organisation?.id
                                ? theme.colors.blue[6]
                                : theme.colors.gray[1],
                            color:
                              message.senderId === organisation?.id
                                ? "white"
                                : theme.colors.gray[9],
                            borderRadius: theme.radius.md,
                          }}
                        >
                          <Group justify="space-between" mb="xs">
                            <Text
                              size="xs"
                              fw={500}
                              style={{
                                color:
                                  message.senderId === organisation?.id
                                    ? "white"
                                    : theme.colors.gray[7],
                              }}
                            >
                              {message.senderId === organisation?.id
                                ? "You"
                                : message.senderName}
                            </Text>
                            <Text
                              size="xs"
                              style={{
                                color:
                                  message.senderId === organisation?.id
                                    ? "rgba(255,255,255,0.7)"
                                    : theme.colors.gray[6],
                              }}
                            >
                              {formatDate(message.createdAt)}
                            </Text>
                          </Group>
                          <Text size="sm">{message.content}</Text>
                        </Box>
                        {message.senderId === organisation?.id && (
                          <Avatar
                            src={organisation?.images?.logo}
                            size="sm"
                            radius="xl"
                          >
                            <IconBuilding size={16} />
                          </Avatar>
                        )}
                      </Box>
                    ))}
                    {selectedMessages.length === 0 && !messagesLoading && (
                      <Text size="sm" c="dimmed" ta="center" py="xl">
                        No messages yet. Start the conversation!
                      </Text>
                    )}
                  </Stack>
                </ScrollArea>
              )}

              {/* Call/Project Reference - Fixed */}
              {selectedConversation.metadata?.callTitle && (
                <Box
                  style={{
                    padding: theme.spacing.md,
                    background: theme.colors.blue[0],
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.blue[3]}`,
                    marginTop: theme.spacing.md,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  <Text size="sm" fw={600} mb="xs">
                    Application for:{" "}
                    {selectedConversation.metadata.applicationType === "call"
                      ? "Call"
                      : "Project"}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selectedConversation.metadata.callTitle}
                  </Text>
                </Box>
              )}

              {/* Reply Box - Fixed at Bottom */}
              <Stack gap="xs" mt="md">
                <Textarea
                  placeholder="Type your reply..."
                  value={composeForm.content}
                  onChange={(e) =>
                    setComposeForm((prev) => ({
                      ...prev,
                      content: e.currentTarget.value,
                    }))
                  }
                  minRows={3}
                  autosize
                  maxRows={6}
                />
                <Group justify="flex-end">
                  <Button
                    leftSection={<IconSend size={16} />}
                    onClick={sendMessage}
                    disabled={!composeForm.content.trim()}
                  >
                    Send Reply
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : (
            <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: "780px" }}>
              <Box ta="center" style={{ paddingTop: "200px" }}>
                <IconMessage size={64} color={theme.colors.gray[4]} />
                <Text c="dimmed" mt="md" size="lg">
                  Select a conversation to view messages
                </Text>
              </Box>
            </Card>
          )}
        </Grid.Col>
      </Grid>

      {/* Compose Message Modal */}
        <Modal
          opened={showComposeModal}
          onClose={() => {
            setShowComposeModal(false);
            setComposeForm({
              recipientId: "",
              recipientName: "",
              subject: "",
              content: "",
            });
            setOrgSearchTerm("");
            setShowOrgDropdown(false);
          }}
          size="lg"
          title="Compose Message"
        >
          <Stack gap="md">
            {/* Organization Selector */}
            <Box>
              <Text size="sm" fw={500} mb="xs">
                To <span style={{ color: "red" }}>*</span>
              </Text>

              {composeForm.recipientId ? (
                // Selected organization display
                <Group
                  justify="space-between"
                  p="sm"
                  style={{
                    border: `1px solid ${theme.colors.gray[3]}`,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.colors.gray[0],
                  }}
                >
                  <Group>
                    <Avatar size="sm" radius="md">
                      <IconBuilding size={16} />
                    </Avatar>
                    <Text size="sm" fw={500}>
                      {composeForm.recipientName}
                    </Text>
                  </Group>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      setComposeForm((prev) => ({
                        ...prev,
                        recipientId: "",
                        recipientName: "",
                      }));
                      setOrgSearchTerm("");
                      setShowOrgDropdown(true);
                    }}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              ) : (
                // Organization search input
                <Box style={{ position: "relative" }} data-org-selector>
                  <TextInput
                    placeholder="Search for an organization..."
                    value={orgSearchTerm}
                    onChange={(e) => {
                      setOrgSearchTerm(e.currentTarget.value);
                      setShowOrgDropdown(true);
                    }}
                    onFocus={() => setShowOrgDropdown(true)}
                    leftSection={<IconSearch size={16} />}
                    rightSection={
                      loadingOrgs ? <Loader size="xs" /> : undefined
                    }
                  />

                  {/* Organization dropdown */}
                  {showOrgDropdown && (
                    <Card
                      shadow="md"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        maxHeight: "300px",
                        overflow: "hidden",
                      }}
                    >
                      <ScrollArea h={300}>
                        <Stack gap={0}>
                          {organisations.length > 0 ? (
                            organisations.map((org) => (
                              <UnstyledButton
                                key={org.id}
                                onClick={() => {
                                  setComposeForm((prev) => ({
                                    ...prev,
                                    recipientId: org.id,
                                    recipientName: org.name,
                                  }));
                                  setShowOrgDropdown(false);
                                  setOrgSearchTerm("");
                                }}
                                style={{
                                  padding: theme.spacing.sm,
                                  borderRadius: theme.radius.sm,
                                  "&:hover": {
                                    backgroundColor: theme.colors.gray[0],
                                  },
                                }}
                              >
                                <Group gap="sm">
                                  <Avatar src={org.logo} size="sm" radius="md">
                                    <IconBuilding size={16} />
                                  </Avatar>
                                  <Box style={{ flex: 1 }}>
                                    <Text size="sm" fw={500}>
                                      {org.name}
                                    </Text>
                                    {org.city && org.country && (
                                      <Text size="xs" c="dimmed">
                                        {org.city}, {org.country}
                                      </Text>
                                    )}
                                    {org.organisationType && (
                                      <Badge
                                        size="xs"
                                        variant="light"
                                        color="blue"
                                      >
                                        {org.organisationType}
                                      </Badge>
                                    )}
                                  </Box>
                                </Group>
                              </UnstyledButton>
                            ))
                          ) : (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                              {loadingOrgs
                                ? "Loading..."
                                : "No organizations found"}
                            </Text>
                          )}
                        </Stack>
                      </ScrollArea>
                    </Card>
                  )}
                </Box>
              )}
            </Box>

            <TextInput
              label="Subject"
              placeholder="Enter message subject"
              value={composeForm.subject}
              onChange={(e) =>
                setComposeForm({
                  ...composeForm,
                  subject: e.currentTarget.value,
                })
              }
              required
            />
            <Textarea
              label="Message"
              placeholder="Enter your message"
              value={composeForm.content}
              onChange={(e) =>
                setComposeForm({
                  ...composeForm,
                  content: e.currentTarget.value,
                })
              }
              minRows={6}
              required
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setShowComposeModal(false);
                  setComposeForm({
                    recipientId: "",
                    recipientName: "",
                    subject: "",
                    content: "",
                  });
                  setOrgSearchTerm("");
                  setShowOrgDropdown(false);
                }}
              >
                Cancel
              </Button>
              <Button
                leftSection={<IconSend size={16} />}
                onClick={createDirectMessage}
                disabled={
                  !composeForm.recipientId.trim() ||
                  !composeForm.subject.trim() ||
                  !composeForm.content.trim()
                }
              >
                Send Message
              </Button>
            </Group>
          </Stack>
        </Modal>
    </DashboardLayout>
  );
}
