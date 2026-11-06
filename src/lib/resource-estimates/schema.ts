import { z } from "zod";

/**
 * A positive quantity of qubits or gates. YAML numbers are accepted as-is;
 * text is accepted for approximations ("~1e6") and ranges ("2375 – 6652"),
 * which are parsed by `parseQuantity`.
 */
const Quantity = z.union([z.number().positive().finite(), z.string().regex(/^\s*[~≈<>]?\s*\d/)]);

export const EstimateSchema = z
  .object({
    area: z.string().min(1),
    topic: z.string().optional(),
    problem: z.string().min(1),
    qubits: Quantity,
    gates: Quantity,
    gate_type: z.enum(["T", "Toffoli"]),
    location: z.string().optional(),
    comments: z.string().optional(),
    include: z.boolean().optional(),
    number: z.number().optional(),
  })
  .strict();

export const PaperSchema = z
  .object({
    // Quote arXiv IDs: unquoted, YAML reads 2001.09580 as the number 2001.0958.
    reference: z.union([z.string().min(1), z.number()]),
    url: z.string().url().optional(),
    title: z.string().optional(),
    year: z.number().int().min(1990).max(2100),
    samples: z.enum(["yes", "no", "unknown"]).optional(),
    samples_notes: z.string().optional(),
    status: z.enum(["verified", "candidate"]).optional(),
    estimates: z.array(EstimateSchema),
  })
  .strict();

export type Paper = z.infer<typeof PaperSchema>;
export type Estimate = z.infer<typeof EstimateSchema>;
