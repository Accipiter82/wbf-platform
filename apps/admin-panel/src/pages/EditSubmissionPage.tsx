import { useForm } from "@mantine/form";
import {
  TextInput,
  NumberInput,
  MultiSelect,
  Button,
  Group,
  Box,
  Title,
  Stack,
} from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { updateOrganisation } from "../store/slices/organisationSlice";
import {
  Organisation,
  RegisterStep1Request,
  RegisterStep2Request,
} from "../types";
import { useEffect } from "react";

const initialStep1: Partial<RegisterStep1Request> = {
  name: "",
  nameLocal: "",
  contractingParty: "",
  city: "",
  postalAddress: "",
  type: "",
  yearOfEstablishment: new Date().getFullYear(),
  registrationNumber: "",
  numberOfStaff: undefined,
  numberOfVolunteers: undefined,
  missionFields: [],
  website: "",
  socialMediaProfiles: [],
  contactPersonName: "",
  contactPersonPosition: "",
  contactEmail: "",
  contactPhone: "",
};
const initialStep2: Partial<RegisterStep2Request> = {
  wbfCallsApplied: [],
  roleInPastApplications: [],
  projectTitles: [],
  projectDescriptions: [],
  projectThematicAreas: [],
  geographicalCoverage: [],
  lookingForPartnersInThematicAreas: [],
  lookingForPartnersFromCPs: [],
  preferredRole: [],
  expertiseOffered: [],
  expertiseSought: [],
  keywords: [],
  availableResources: [],
  referenceProjects: [],
  successStories: [],
  logo: "",
};

export default function EditSubmissionPage() {
  const dispatch = useDispatch();
  const { currentOrganisation, isLoading, error } = useSelector(
    (state: RootState) => state.organisation
  );
  const form = useForm({
    initialValues: { ...initialStep1, ...initialStep2, ...currentOrganisation },
  });

  useEffect(() => {
    if (currentOrganisation) {
      form.setValues({
        ...initialStep1,
        ...initialStep2,
        ...currentOrganisation,
      });
    }
    // eslint-disable-next-line
  }, [currentOrganisation]);

  const handleSubmit = (values: Partial<Organisation>) => {
    if (!currentOrganisation?.id) return;
    dispatch(
      updateOrganisation({
        id: currentOrganisation.id,
        data: values,
        token: localStorage.getItem("token") || "",
      }) as any
    );
  };

  return (
    <Box maw={600} mx="auto" mt="xl">
      <Title order={2} mb="md">
        Edit and Resubmit Your Organisation
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Organisation Name"
            placeholder="Organisation Name"
            required
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Name (Local Language)"
            {...form.getInputProps("nameLocal")}
            required
          />
          <TextInput
            label="Contracting Party"
            {...form.getInputProps("contractingParty")}
            required
          />
          <TextInput label="City" {...form.getInputProps("city")} required />
          <TextInput
            label="Postal Address"
            {...form.getInputProps("postalAddress")}
            required
          />
          <TextInput
            label="Type of Organisation"
            {...form.getInputProps("type")}
            required
          />
          <NumberInput
            label="Year of Establishment"
            {...form.getInputProps("yearOfEstablishment")}
            required
            min={1900}
            max={new Date().getFullYear()}
          />
          <TextInput
            label="Registration Number"
            {...form.getInputProps("registrationNumber")}
          />
          <NumberInput
            label="Number of Staff"
            {...form.getInputProps("numberOfStaff")}
            min={0}
          />
          <NumberInput
            label="Number of Volunteers"
            {...form.getInputProps("numberOfVolunteers")}
            min={0}
          />
          <MultiSelect
            label="Mission / Main Fields of Work"
            data={[]}
            {...form.getInputProps("missionFields")}
          />
          <TextInput label="Website" {...form.getInputProps("website")} />
          <MultiSelect
            label="Social Media Profiles (URLs)"
            data={[]}
            placeholder="Add URLs"
            {...form.getInputProps("socialMediaProfiles")}
          />
          <TextInput
            label="Contact Person Name"
            {...form.getInputProps("contactPersonName")}
            required
          />
          <TextInput
            label="Contact Person Position"
            {...form.getInputProps("contactPersonPosition")}
          />
          <TextInput
            label="Contact Email"
            type="email"
            {...form.getInputProps("contactEmail")}
            required
          />
          <TextInput
            label="Contact Phone"
            {...form.getInputProps("contactPhone")}
          />
          {/* Step 2 fields */}
          <MultiSelect
            label="WBF Calls Applied For (Call # and Year)"
            data={[]}
            placeholder="Add call numbers and years"
            {...form.getInputProps("wbfCallsApplied")}
          />
          <MultiSelect
            label="Role in Past Applications"
            data={[
              { value: "Lead", label: "Lead" },
              { value: "Partner", label: "Partner" },
            ]}
            {...form.getInputProps("roleInPastApplications")}
          />
          <MultiSelect
            label="Project Titles"
            data={[]}
            placeholder="Add project titles"
            {...form.getInputProps("projectTitles")}
          />
          <MultiSelect
            label="Project Descriptions"
            data={[]}
            placeholder="Add project descriptions"
            {...form.getInputProps("projectDescriptions")}
          />
          <MultiSelect
            label="Project Thematic Areas"
            data={[]}
            placeholder="Add thematic areas"
            {...form.getInputProps("projectThematicAreas")}
          />
          <MultiSelect
            label="Geographical Coverage (CPs)"
            data={[]}
            placeholder="Add CPs"
            {...form.getInputProps("geographicalCoverage")}
          />
          <MultiSelect
            label="Looking for Partners in Thematic Areas"
            data={[]}
            placeholder="Add thematic areas"
            {...form.getInputProps("lookingForPartnersInThematicAreas")}
          />
          <MultiSelect
            label="Looking for Partners from CPs"
            data={[]}
            placeholder="Add CPs"
            {...form.getInputProps("lookingForPartnersFromCPs")}
          />
          <MultiSelect
            label="Preferred Role"
            data={[
              { value: "Lead", label: "Lead" },
              { value: "Partner", label: "Partner" },
              { value: "Either", label: "Either" },
            ]}
            {...form.getInputProps("preferredRole")}
          />
          <MultiSelect
            label="Type of Expertise Offered"
            data={[]}
            placeholder="Add expertise"
            {...form.getInputProps("expertiseOffered")}
          />
          <MultiSelect
            label="Type of Expertise Sought"
            data={[]}
            placeholder="Add expertise"
            {...form.getInputProps("expertiseSought")}
          />
          <MultiSelect
            label="Keywords / Tags"
            data={[]}
            placeholder="Add keywords"
            {...form.getInputProps("keywords")}
          />
          <MultiSelect
            label="Available Resources / Capacities"
            data={[]}
            placeholder="Add resources"
            {...form.getInputProps("availableResources")}
          />
          <MultiSelect
            label="Reference Projects"
            data={[]}
            placeholder="Add reference projects"
            {...form.getInputProps("referenceProjects")}
          />
          <MultiSelect
            label="Success Stories"
            data={[]}
            placeholder="Add success stories"
            {...form.getInputProps("successStories")}
          />
          <TextInput
            label="Logo (URL or upload)"
            {...form.getInputProps("logo")}
          />
          {error && <Box color="red">{error}</Box>}
          <Group justify="right" mt="md">
            <Button type="submit" loading={isLoading}>
              Resubmit
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
