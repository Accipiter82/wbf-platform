import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Text,
  Group,
  Avatar,
  Stack,
  Button,
  Textarea,
  ActionIcon,
  Badge,
  Box,
  Divider,
  Modal,
  Select,
  Loader,
  Center,
  TextInput,
  Image,
} from "@mantine/core";
import {
  IconHeart,
  IconFlame,
  IconThumbUp,
  IconMoodSmile,
  IconStar,
  IconSend,
  IconMessageCircle,
  IconX,
  IconPhoto,
  IconMoodHappy,
  IconTrash,
} from "@tabler/icons-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import {
  fetchWallPosts,
  createWallPost,
  uploadWallImage,
  addReaction,
  removeReaction,
  addComment,
  deleteWallPost,
  clearError,
} from "../../store/slices/wallSlice";
import { WallPost, CreateWallPostRequest } from "../../types";

interface SocialWallProps {
  height?: string;
}

const REACTION_TYPES = [
  { type: "like", icon: IconThumbUp, color: "#0073b1" },
  { type: "fire", icon: IconFlame, color: "#f39c12" },
  { type: "great", icon: IconMoodSmile, color: "#2ecc71" },
  { type: "wow", icon: IconStar, color: "#9b59b6" },
  { type: "love", icon: IconHeart, color: "#e91e63" },
  {
    type: "thumbs_up",
    icon: IconMoodHappy,
    color: "#3498db",
  },
];

const PostCard: React.FC<{ post: WallPost }> = ({ post }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, organisation } = useSelector((state: RootState) => state.auth);
  const { isAddingReaction, isAddingComment, isDeletingPost } = useSelector(
    (state: RootState) => state.wall
  );
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
    return (
      d.toLocaleDateString() +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getReactionCount = (type: string) => {
    return post.reactions.filter((r) => r.type === type).length;
  };

  const getUserReaction = () => {
    if (!organisation) return null;
    return post.reactions.find((r) => r.organisationId === organisation.id);
  };

  const handleReaction = async (type: string) => {
    if (!token || !organisation) return;

    const userReaction = getUserReaction();
    if (userReaction) {
      if (userReaction.type === type) {
        // Remove reaction
        dispatch(removeReaction({ postId: post.id, token }));
      } else {
        // Change reaction
        dispatch(
          addReaction({ data: { postId: post.id, type: type as any }, token })
        );
      }
    } else {
      // Add new reaction
      dispatch(
        addReaction({ data: { postId: post.id, type: type as any }, token })
      );
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !token) return;

    dispatch(
      addComment({
        data: { postId: post.id, content: newComment.trim() },
        token,
      })
    );
    setNewComment("");
  };

  const handleDeletePost = async () => {
    if (!token || !organisation) return;

    // Only allow deletion if the current organisation created the post
    if (post.organisationId !== organisation.id) return;

    if (window.confirm("Are you sure you want to delete this post?")) {
      dispatch(deleteWallPost({ postId: post.id, token }));
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "blue";
      case "project_update":
        return "green";
      case "status":
        return "orange";
      case "partnership":
        return "purple";
      case "general":
        return "gray";
      default:
        return "gray";
    }
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder mb="md">
      {/* Post Header */}
      <Group mb="sm">
        <Avatar src={post.organisationLogo} size="md" radius="xl">
          {post.organisationName.charAt(0)}
        </Avatar>
        <Box style={{ flex: 1 }}>
          <Text fw={600} size="sm">
            {post.organisationName}
          </Text>
          <Group gap="xs">
            <Badge
              size="xs"
              color={getPostTypeColor(post.type)}
              variant="light"
            >
              {post.type.replace("_", " ")}
            </Badge>
            <Text size="xs" c="dimmed">
              {formatDate(post.createdAt)}
            </Text>
          </Group>
        </Box>
        {/* Delete Button - Only show for post creator */}
        {organisation && post.organisationId === organisation.id && (
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={handleDeletePost}
            disabled={isDeletingPost}
            loading={isDeletingPost}
            size="sm"
          >
            <IconTrash size={16} />
          </ActionIcon>
        )}
      </Group>

      {/* Post Content */}
      <Text size="sm" mb="md" style={{ whiteSpace: "pre-wrap" }}>
        {post.content}
      </Text>

      {/* Post Image */}
      {post.imageUrl && (
        <Box mb="md">
          <Image
            src={post.imageUrl}
            alt="Post image"
            radius="md"
            style={{ maxHeight: "400px", objectFit: "cover" }}
          />
        </Box>
      )}

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <Box mb="md">
          <Text size="xs" c="dimmed" mb="xs">
            Attachments:
          </Text>
          <Group gap="xs">
            {post.attachments.map((_, index) => (
              <Badge key={index} size="xs" variant="outline">
                File {index + 1}
              </Badge>
            ))}
          </Group>
        </Box>
      )}

      <Divider mb="sm" />

      {/* Reactions */}
      <Group mb="sm" gap="xs" justify="start">
        {REACTION_TYPES.map(({ type, icon: Icon, color }) => {
          const count = getReactionCount(type);
          const userReaction = getUserReaction();
          const isActive = userReaction?.type === type;

          return (
            <Button
              key={type}
              variant={isActive ? "filled" : "light"}
              size="sm"
              color={isActive ? color : "gray"}
              leftSection={<Icon size={18} />}
              onClick={() => handleReaction(type)}
              disabled={isAddingReaction}
              style={{
                backgroundColor: isActive ? color : undefined,
                color: isActive ? "white" : undefined,
                border: isActive ? `1px solid ${color}` : "1px solid #e9ecef",
                fontWeight: 500,
                minWidth: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {count > 0 && (
                <Text size="xs" fw={600} ml="xs">
                  {count}
                </Text>
              )}
            </Button>
          );
        })}
      </Group>

      {/* Comments Section */}
      <Box>
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconMessageCircle size={14} />}
          onClick={() => setShowComments(!showComments)}
          mb={showComments ? "sm" : 0}
        >
          {post.comments.length} comments
        </Button>

        {showComments && (
          <Box>
            {/* Add Comment */}
            <Group mb="sm">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                size="xs"
                style={{ flex: 1 }}
                minRows={1}
                maxRows={3}
              />
              <ActionIcon
                color="blue"
                variant="filled"
                onClick={handleAddComment}
                disabled={!newComment.trim() || isAddingComment}
                loading={isAddingComment}
              >
                <IconSend size={14} />
              </ActionIcon>
            </Group>

            {/* Comments List */}
            {post.comments.length > 0 && (
              <Stack gap="md" mt="md">
                {post.comments.map((comment) => (
                  <Card
                    key={comment.id}
                    shadow="xs"
                    padding="sm"
                    radius="md"
                    withBorder
                  >
                    <Group gap="sm" mb="xs">
                      <Avatar
                        src={comment.organisationLogo}
                        size="sm"
                        radius="xl"
                      >
                        {comment.organisationName.charAt(0)}
                      </Avatar>
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={600} c="dark">
                          {comment.organisationName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(comment.createdAt)}
                        </Text>
                      </Box>
                    </Group>
                    <Text size="sm" pl="md">
                      {comment.content}
                    </Text>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
};

const CreatePostModal: React.FC<{
  opened: boolean;
  onClose: () => void;
}> = ({ opened, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, organisation } = useSelector((state: RootState) => state.auth);
  const { isCreatingPost, isUploadingImage } = useSelector(
    (state: RootState) => state.wall
  );
  const [content, setContent] = useState("");
  const [type, setType] = useState<
    "status" | "announcement" | "project_update" | "general" | "partnership"
  >("status");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File | null) => {
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile || !token) return;

    try {
      const result = await dispatch(
        uploadWallImage({ file: imageFile, token })
      );
      if (uploadWallImage.fulfilled.match(result)) {
        setImageUrl(result.payload);
        return result.payload;
      }
    } catch (error) {
      console.error("Image upload failed:", error);
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!content.trim() || !token) return;

    let finalImageUrl = imageUrl;
    if (imageFile && !imageUrl) {
      finalImageUrl = await uploadImage();
    }

    const postData: CreateWallPostRequest = {
      content: content.trim(),
      type,
      imageUrl: finalImageUrl || undefined,
    };

    dispatch(createWallPost({ data: postData, token }));
    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    setType("status");
    onClose();
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      withCloseButton={false}
      styles={{
        content: {
          borderRadius: "12px",
          padding: "24px",
        },
      }}
    >
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <Group gap="sm">
          <Avatar src={organisation?.images?.logo} size="lg" radius="xl">
            {organisation?.name?.charAt(0)}
          </Avatar>
          <Text fw={600} size="lg">
            {organisation?.name}
          </Text>
        </Group>
        <ActionIcon variant="subtle" onClick={onClose} size="lg">
          <IconX size={20} />
        </ActionIcon>
      </Group>

      {/* Content Area */}
      <Box mb="lg">
        <Textarea
          placeholder="What do you want to talk about?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          minRows={8}
          maxRows={20}
          size="xl"
          styles={{
            input: {
              fontSize: "18px",
              border: "none",
              padding: "0",
              resize: "none",
              minHeight: "200px",
            },
          }}
        />
      </Box>

      {/* Image Preview */}
      {imagePreview && (
        <Box mb="lg" style={{ position: "relative" }}>
          <Image
            src={imagePreview}
            alt="Preview"
            radius="md"
            style={{ maxHeight: "400px", objectFit: "cover" }}
          />
          <ActionIcon
            color="red"
            variant="filled"
            size="sm"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
            }}
            onClick={removeImage}
          >
            <IconX size={12} />
          </ActionIcon>
        </Box>
      )}

      {/* Action Buttons */}
      <Group justify="space-between" mb="lg">
        <Button
          variant="subtle"
          leftSection={<IconPhoto size={20} />}
          size="md"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          styles={{
            root: {
              backgroundColor: "transparent",
              border: "1px solid #e9ecef",
              color: "#666",
            },
          }}
        >
          Photo
        </Button>

        <Group
          gap="xs"
          style={{ position: "absolute", bottom: "24px", right: "24px" }}
        >
          <Select
            placeholder="Select type"
            value={type}
            onChange={(value) => setType(value as any)}
            data={[
              { value: "status", label: "Status Update" },
              { value: "announcement", label: "Announcement" },
              { value: "project_update", label: "Project Update" },
              { value: "general", label: "General" },
              { value: "partnership", label: "Partnership" },
            ]}
            size="md"
            style={{ width: 180 }}
            styles={{
              input: {
                backgroundColor: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
              },
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isCreatingPost || isUploadingImage}
            loading={isCreatingPost || isUploadingImage}
            size="md"
            styles={{
              root: {
                backgroundColor: content.trim() ? "#0073b1" : "#e9ecef",
                color: content.trim() ? "white" : "#666",
                border: "none",
                borderRadius: "8px",
                padding: "8px 24px",
              },
            }}
          >
            Post
          </Button>
        </Group>
      </Group>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
        style={{ display: "none" }}
      />
    </Modal>
  );
};

const CreatePostCard: React.FC = () => {
  const { organisation } = useSelector((state: RootState) => state.auth);
  const [modalOpened, setModalOpened] = useState(false);

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder mb="md">
      <Group>
        <Avatar src={organisation?.images?.logo} size="md" radius="xl">
          {organisation?.name?.charAt(0)}
        </Avatar>
        <TextInput
          placeholder="Start a post"
          style={{ flex: 1 }}
          size="md"
          onClick={() => setModalOpened(true)}
          readOnly
        />
      </Group>

      {/* LinkedIn-style Modal */}
      <CreatePostModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
      />
    </Card>
  );
};

const SocialWall: React.FC<SocialWallProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { organisation } = useSelector((state: RootState) => state.auth);
  const { posts, pagination, isLoading, error } = useSelector(
    (state: RootState) => state.wall
  );

  const loadMorePosts = useCallback(() => {
    if (!isLoading && pagination && pagination.hasMore) {
      dispatch(
        fetchWallPosts({
          page: pagination.page + 1,
          limit: 10,
        })
      );
    }
  }, [dispatch, isLoading, pagination]);

  useEffect(() => {
    dispatch(fetchWallPosts({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error("Wall error:", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <Stack gap="md">
      {/* Create Post Card - Scrolls with page */}
      {organisation && <CreatePostCard />}

      {/* Posts Feed - Single page scroll */}
      {isLoading && posts.length === 0 ? (
        <Center h={200}>
          <Loader size="md" />
        </Center>
      ) : (
        <Stack gap="md">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {isLoading && posts.length > 0 && (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          )}

          {/* Show More Button - Appears after 10 posts */}
          {posts.length >= 10 &&
            pagination &&
            pagination.hasMore &&
            !isLoading && (
              <Center py="md">
                <Button variant="outline" onClick={loadMorePosts} size="md">
                  Show More Posts
                </Button>
              </Center>
            )}

          {posts.length === 0 && !isLoading && (
            <Center h={200}>
              <Text c="dimmed">
                No posts yet. Be the first to share something!
              </Text>
            </Center>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default SocialWall;
