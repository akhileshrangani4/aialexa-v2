export const MODELS = [
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  { value: "mistralai/mistral-large", label: "Mistral Large" },
  { value: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B" },
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
] as const;

export type ModelValue =
  | "meta-llama/llama-3.3-70b-instruct"
  | "mistralai/mistral-large"
  | "qwen/qwen-2.5-72b-instruct"
  | "openai/gpt-oss-120b";

export const DEFAULT_FORM_DATA = {
  name: "",
  description: "",
  model: "meta-llama/llama-3.3-70b-instruct" as ModelValue,
  systemPrompt:
    "You are a helpful teaching assistant. Answer questions based on the provided context from course materials.",
  temperature: 70,
  maxTokens: 2000,
};

export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
