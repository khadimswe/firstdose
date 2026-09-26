// Every sentence the product generates about a patient comes from templates.json.
import templatesJson from "@/mock/templates.json";

export const templates = templatesJson;

export type StandInKind = keyof typeof templates.standin_labels;
