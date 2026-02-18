import { Stack, Text, Title, List } from "@mantine/core";

export default function TermsOfService() {
  return (
    <Stack gap="md">
      <Title order={2}>Terms of Service</Title>
      <Text size="sm" c="dimmed">
        Last updated: {new Date().toLocaleDateString()}
      </Text>

      <Stack gap="sm">
        <Title order={3}>1. Acceptance of Terms</Title>
        <Text>
          By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Title order={3}>2. Use License</Title>
        <Text>
          Permission is granted to temporarily access the materials on this platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
        </Text>
        <List>
          <List.Item>Modify or copy the materials</List.Item>
          <List.Item>Use the materials for any commercial purpose or for any public display</List.Item>
          <List.Item>Attempt to reverse engineer any software contained on the platform</List.Item>
          <List.Item>Remove any copyright or other proprietary notations from the materials</List.Item>
        </List>

        <Title order={3}>3. User Accounts</Title>
        <Text>
          You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
        </Text>

        <Title order={3}>4. User Content</Title>
        <Text>
          You retain ownership of any content you submit, post, or display on or through the platform. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content.
        </Text>

        <Title order={3}>5. Prohibited Uses</Title>
        <Text>You may not use the platform:</Text>
        <List>
          <List.Item>In any way that violates any applicable law or regulation</List.Item>
          <List.Item>To transmit any malicious code or viruses</List.Item>
          <List.Item>To impersonate or attempt to impersonate another user</List.Item>
          <List.Item>To engage in any automated use of the system</List.Item>
        </List>

        <Title order={3}>6. Disclaimer</Title>
        <Text>
          The materials on this platform are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </Text>

        <Title order={3}>7. Limitations</Title>
        <Text>
          In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this platform.
        </Text>

        <Title order={3}>8. Revisions</Title>
        <Text>
          We may revise these terms of service at any time without notice. By using this platform you are agreeing to be bound by the then current version of these terms of service.
        </Text>

        <Title order={3}>9. Governing Law</Title>
        <Text>
          These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
        </Text>

        <Title order={3}>10. Contact Information</Title>
        <Text>
          If you have any questions about these Terms of Service, please contact us through the platform's support channels.
        </Text>
      </Stack>
    </Stack>
  );
}

