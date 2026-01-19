export const TITLE_OPTIONS = [
  { value: "dr", label: "Dr" },
  { value: "professor", label: "Professor" },
  { value: "associate_professor", label: "Associate Professor" },
  { value: "assistant_professor", label: "Assistant Professor" },
  { value: "lecturer", label: "Lecturer" },
  { value: "researcher", label: "Researcher" },
  { value: "mr", label: "Mr" },
  { value: "ms", label: "Ms" },
  { value: "mrs", label: "Mrs" },
  { value: "other", label: "Other" },
] as const;

export type TitleOption = (typeof TITLE_OPTIONS)[number];
export type TitleValue = TitleOption["value"];
