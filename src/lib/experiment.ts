export type Variant = "A" | "B";
export type InputType = "select" | "sentence";

export const AB_VARIANT_KEY = "bobfriend-ab-variant";
export const EXPERIMENT_NAME = "meal_input_ab_v1";

export type SentenceKey =
  | "just_play"
  | "no_focus"
  | "want_fun"
  | "prefer_calm"
  | "anything";

export interface SentenceOption {
  key: SentenceKey;
  label: string;
  mappedCategory: "light" | "fun" | "calm" | "chef";
  internalMood: "chef" | "trending" | "info" | "funny";
}

export const SENTENCE_OPTIONS: SentenceOption[] = [
  {
    key: "just_play",
    label: "그냥 틀어놓고 볼 거",
    mappedCategory: "light",
    internalMood: "trending",
  },
  {
    key: "no_focus",
    label: "집중 안 해도 되는 거",
    mappedCategory: "light",
    internalMood: "funny",
  },
  {
    key: "want_fun",
    label: "재밌는 거 보고 싶어",
    mappedCategory: "fun",
    internalMood: "funny",
  },
  {
    key: "prefer_calm",
    label: "조용한 게 좋아",
    mappedCategory: "calm",
    internalMood: "info",
  },
  {
    key: "anything",
    label: "아무거나 틀어줘",
    mappedCategory: "chef",
    internalMood: "chef",
  },
];

export const findSentenceOptionByLabel = (label: string): SentenceOption | undefined =>
  SENTENCE_OPTIONS.find((opt) => opt.label === label);

export const findSentenceOptionByKey = (key: SentenceKey): SentenceOption | undefined =>
  SENTENCE_OPTIONS.find((opt) => opt.key === key);

