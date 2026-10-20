import { z } from "zod";

export const availabilityAlertSchema = z.object({
  variantId: z.string().regex(/^[a-zA-Z0-9_-]{8,128}$/),
  fromDate: z.iso.date(),
  throughDate: z.iso.date(),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(6).max(30).regex(/^[+\d\s().-]+$/),
  customerEmail: z.union([z.literal(""), z.email().max(254)]).optional().default(""),
}).refine((data) => data.throughDate >= data.fromDate, { path: ["throughDate"], message: "La fecha final debe ser posterior o igual a la inicial." });
