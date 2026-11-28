import type {
  InvoiceStatus,
  OrderStatus,
  ServiceCategory,
  SupportedCurrency,
} from "./constants";

export type UserRole = "USER" | "STAFF" | "ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING";

export type KycStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleGroupId?: string | null;
  departmentId?: string | null;
  trustScore: number;
  kycStatus: KycStatus;
  twoFactorEnabled: boolean;
  status: UserStatus;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  category?: ServiceCategory | string;
  name: string;
  slug: string;
  type: "service" | "digital" | "smm";
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  description?: string | null;
  basePriceCents?: number;
  currency?: SupportedCurrency | string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  packageId?: string | null;
  quantity: number;
  unitPriceCents: number;
  productName?: string;
}

export interface Order {
  id: string;
  reference: string;
  userId: string;
  status: OrderStatus;
  totalCents: number;
  currency: SupportedCurrency | string;
  briefJson?: Record<string, unknown> | null;
  items?: OrderItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  amountCents: number;
  quantity: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  orderId?: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: SupportedCurrency | string;
  status: InvoiceStatus;
  formalization?: string | null;
  items?: InvoiceItem[];
  createdAt: string;
  dueAt?: string | null;
  paidAt?: string | null;
}

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "AWAITING_CLIENT"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  departmentId?: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface SeoProject {
  id: string;
  userId: string;
  name: string;
  domain: string;
  brandName?: string | null;
  locationCode: number;
  languageCode: string;
  createdAt: string;
}

export interface SmmService {
  id: string;
  providerId: string;
  externalId: string;
  name: string;
  category: string;
  ratePer1000Cents: number;
  minQty: number;
  maxQty: number;
  marginPercent: number;
  status: "ACTIVE" | "INACTIVE";
}
