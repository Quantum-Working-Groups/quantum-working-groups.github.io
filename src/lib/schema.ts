import { z } from "zod";

export const CommitteeMemberSchema = z.object({
  name: z.string(),
  institution: z.string(),
});

export const ResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
});

export const WorkingGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  acronym: z.string(),
  shortDescription: z.string(),
  longDescription: z.string(),
  committeeMembers: z.array(CommitteeMemberSchema),
  resources: z.array(ResourceSchema),
  status: z.enum(["active", "pending"]).optional(),
  acknowledgements: z.string().optional(),
});

export type WorkingGroup = z.infer<typeof WorkingGroupSchema>;
export type CommitteeMember = z.infer<typeof CommitteeMemberSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
