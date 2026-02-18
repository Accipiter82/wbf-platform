import { Modal, ScrollArea } from "@mantine/core";
import TermsOfService from "./TermsOfService";
import PrivacyPolicy from "./PrivacyPolicy";

interface LegalModalProps {
  opened: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

export default function LegalModal({ opened, onClose, type }: LegalModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={type === "terms" ? "Terms of Service" : "Privacy Policy"}
      size="lg"
      centered
      overlayProps={{
        opacity: 0.55,
        blur: 3,
      }}
    >
      <ScrollArea.Autosize mah="70vh" offsetScrollbars>
        {type === "terms" ? <TermsOfService /> : <PrivacyPolicy />}
      </ScrollArea.Autosize>
    </Modal>
  );
}

