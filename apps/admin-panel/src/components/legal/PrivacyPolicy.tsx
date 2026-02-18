import { Stack, Text, Title, List } from "@mantine/core";

export default function PrivacyPolicy() {
  return (
    <Stack gap="md">
      <Title order={2}>Privacy Policy</Title>
      <Text size="sm" c="dimmed">
        Last updated: {new Date().toLocaleDateString()}
      </Text>

      <Stack gap="sm">
        <Title order={3}>1. Introduction</Title>
        <Text>
          We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
        </Text>

        <Title order={3}>2. Information We Collect</Title>
        <Text>We collect information that you provide directly to us, including:</Text>
        <List>
          <List.Item>Name and contact information (email address, phone number)</List.Item>
          <List.Item>Organisation details and profile information</List.Item>
          <List.Item>Account credentials (username, password)</List.Item>
          <List.Item>Content you submit, post, or display on the platform</List.Item>
          <List.Item>Communications with us</List.Item>
        </List>

        <Title order={3}>3. How We Use Your Information</Title>
        <Text>We use the information we collect to:</Text>
        <List>
          <List.Item>Provide, maintain, and improve our services</List.Item>
          <List.Item>Process transactions and send related information</List.Item>
          <List.Item>Send technical notices, updates, and support messages</List.Item>
          <List.Item>Respond to your comments and questions</List.Item>
          <List.Item>Monitor and analyze trends and usage</List.Item>
          <List.Item>Detect, prevent, and address technical issues</List.Item>
        </List>

        <Title order={3}>4. Information Sharing and Disclosure</Title>
        <Text>We may share your information in the following situations:</Text>
        <List>
          <List.Item>With your consent or at your direction</List.Item>
          <List.Item>With service providers who perform services on our behalf</List.Item>
          <List.Item>To comply with legal obligations or respond to legal requests</List.Item>
          <List.Item>To protect our rights, privacy, safety, or property</List.Item>
          <List.Item>In connection with a business transfer or merger</List.Item>
        </List>

        <Title order={3}>5. Data Security</Title>
        <Text>
          We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
        </Text>

        <Title order={3}>6. Data Retention</Title>
        <Text>
          We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
        </Text>

        <Title order={3}>7. Your Rights</Title>
        <Text>Depending on your location, you may have the following rights:</Text>
        <List>
          <List.Item>Access to your personal information</List.Item>
          <List.Item>Correction of inaccurate or incomplete information</List.Item>
          <List.Item>Deletion of your personal information</List.Item>
          <List.Item>Objection to processing of your personal information</List.Item>
          <List.Item>Data portability</List.Item>
          <List.Item>Withdrawal of consent</List.Item>
        </List>

        <Title order={3}>8. Cookies and Tracking Technologies</Title>
        <Text>
          We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </Text>

        <Title order={3}>9. Third-Party Links</Title>
        <Text>
          Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
        </Text>

        <Title order={3}>10. Children's Privacy</Title>
        <Text>
          Our platform is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18.
        </Text>

        <Title order={3}>11. Changes to This Privacy Policy</Title>
        <Text>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </Text>

        <Title order={3}>12. Contact Us</Title>
        <Text>
          If you have any questions about this Privacy Policy, please contact us through the platform's support channels.
        </Text>
      </Stack>
    </Stack>
  );
}

