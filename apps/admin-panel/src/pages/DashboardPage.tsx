import { Container, Title, Box, useMantineTheme } from "@mantine/core";
import DashboardLayout from "../components/layout/DashboardLayout";
import SocialWall from "../components/wall/SocialWall";

export default function DashboardPage() {
  const theme = useMantineTheme();

  return (
    <DashboardLayout>
      <Container size="xl" py="xl" px={0}>
        {/* Organisations Board Section */}
        <Box mt="xl">
          <Title order={2} size="1.5rem" mb="lg" c={theme.colors.brand[7]}>
            Organisations Board
          </Title>
          <SocialWall height="600px" />
        </Box>
      </Container>
    </DashboardLayout>
  );
}
