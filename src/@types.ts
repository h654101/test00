export type Rule = Record<
  string,
  { type: "string" | "number"; min: number; max: number }
>;
