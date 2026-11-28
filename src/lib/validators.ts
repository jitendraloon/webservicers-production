import { z } from "zod";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "./constants";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().trim().optional(),
  rememberMe: z.boolean().optional().default(false),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be at most 120 characters"),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  phone: z.string().trim().max(32, "Phone number is too long").optional(),
  source: z.string().trim().max(64).optional().default("website"),
  notes: z.string().trim().max(2000, "Notes must be at most 2000 characters").optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  packageId: z.string().trim().min(1).optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(1000).default(1),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one order item is required"),
  currency: z.enum(SUPPORTED_CURRENCIES).optional().default(DEFAULT_CURRENCY),
  couponCode: z.string().trim().max(64).optional(),
  briefJson: z.record(z.unknown()).optional(),
});

export const ticketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be at most 200 characters"),
  body: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(10000, "Message must be at most 10000 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  departmentId: z.string().trim().min(1).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
