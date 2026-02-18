import { useForm } from "@mantine/form";
import {
  TextInput,
  MultiSelect,
  Button,
  Group,
  Box,
  Title,
  Stack,
} from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { registerStep2 } from "../store/slices/authSlice";
import { RegisterStep2Request } from "../types";

const initialValues: RegisterStep2Request = {
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

export default function RegisterStep2Page() {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const form = useForm({
    initialValues,
    validate: {},
  });

  const handleSubmit = (values: RegisterStep2Request) => {
    // You may need to get organisationId from route or state
    const organisationId = localStorage.getItem("organisationId") || "";
    dispatch(registerStep2({ organisationId, data: values }) as any);
  };

  return (
    <Box maw={600} mx="auto" mt="xl">
      <Title order={2} mb="md">
        Register Your Organisation (Step 2)
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
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
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
