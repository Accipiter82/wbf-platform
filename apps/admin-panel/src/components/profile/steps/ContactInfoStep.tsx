import { TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { ProfileFormData } from "../../../types/profile";
import ProfileStepWrapper from "../ProfileStepWrapper";

interface ContactInfoStepProps {
  form: UseFormReturnType<ProfileFormData>;
  onFieldChange?: (field: string, value: any) => void;
}

export default function ContactInfoStep({
  form,
  onFieldChange,
}: ContactInfoStepProps) {
  return (
    <ProfileStepWrapper title="Contact Information">
      <TextInput
        label="Contact Person Name"
        placeholder="Full name of primary contact"
        required
        value={form.values.contactPersonName}
        onChange={(event) =>
          onFieldChange?.("contactPersonName", event.currentTarget.value)
        }
        error={form.errors.contactPersonName}
      />

      <TextInput
        label="Contact Person Position"
        placeholder="e.g., Executive Director, Project Manager"
        value={form.values.contactPersonPosition}
        onChange={(event) =>
          onFieldChange?.("contactPersonPosition", event.currentTarget.value)
        }
        error={form.errors.contactPersonPosition}
      />

      <TextInput
        label="Contact Email"
        placeholder="contact@your-organisation.org"
        type="email"
        required
        value={form.values.contactEmail}
        onChange={(event) =>
          onFieldChange?.("contactEmail", event.currentTarget.value)
        }
        error={form.errors.contactEmail}
      />

      <TextInput
        label="Contact Phone"
        placeholder="+1234567890"
        value={form.values.contactPhone}
        onChange={(event) =>
          onFieldChange?.("contactPhone", event.currentTarget.value)
        }
        error={form.errors.contactPhone}
      />
    </ProfileStepWrapper>
  );
}
