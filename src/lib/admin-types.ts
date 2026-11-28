export type AdminOrderStatus =
  | "PENDING"
  | "AWAITING_BRIEF"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export interface AdminOrderItem {
  id: string;
  productId: string;
  productName: string;
  packageName: string;
  billingCycle: "monthly" | "quarterly" | "annual" | "one_time";
  quantity: number;
  unitPriceCents: number;
}

export interface AdminOrderLifecycleEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  note?: string;
}

export interface AdminOrderConversationMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: "ADMIN" | "CLIENT" | "SYSTEM";
  message: string;
  attachments?: { name: string; url: string; sizeBytes?: number }[];
  isInternalNote?: boolean;
  createdAt: string;
}

export interface AdminOrderRequirementResponse {
  fieldId: string;
  key: string;
  label: string;
  fieldType: string;
  value: string;
  status: "PENDING" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
  adminFeedback?: string;
  updatedAt?: string;
}

export interface AdminOrder {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: AdminOrderStatus;
  paymentMethod: string;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL" | "REFUNDED";
  totalCents: number;
  currency: string;
  invoiceId?: string;
  invoiceNumber?: string;
  items: AdminOrderItem[];
  brief: {
    domain?: string;
    targetMarket?: string;
    goals?: string;
    notes?: string;
    [key: string]: any;
  };
  requirementResponses?: Record<string, string>;
  requirementsStatus?: "PENDING" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
  requirementsRevisionNotes?: string;
  cancellationRequested?: boolean;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
  cancellationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  cancellationDecisionNote?: string;
  conversations?: AdminOrderConversationMessage[];
  lifecycle: AdminOrderLifecycleEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminSmmOrder {
  id: string;
  reference: string;
  customerName: string;
  serviceName: string;
  providerName: string;
  targetUrl: string;
  quantity: number;
  remains: number;
  chargeCents: number;
  status: "PENDING" | "PROCESSING" | "IN_PROGRESS" | "COMPLETED" | "PARTIAL" | "CANCELLED";
  createdAt: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  company: string;
  country: string;
  kycStatus: "VERIFIED" | "PENDING" | "UNVERIFIED";
  workspaceCount: number;
}

export interface AbandonedCheckout {
  id: string;
  sessionCode: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  packageName: string;
  amountCents: number;
  currency: string;
  abandonedAt: string;
  stepReached: "CART" | "BRIEF" | "PAYMENT";
  recoverySentCount: number;
  lastRecoveryAt?: string;
  status: "OPEN" | "RECOVERED" | "EXPIRED";
}

export interface AbandonedCheckoutSettings {
  autoReminderEnabled: boolean;
  reminderDelayHours: number;
  discountCode: string;
  discountPct: number;
  maxNudges: number;
  templateSubject: string;
}

export interface AdminProductTier {
  id: string;
  name: "Basic" | "Standard" | "Premium" | "Growth" | "Enterprise" | string;
  description?: string;
  priceCents: number;
  annualDiscountPct?: number;
  deliveryDays: number;
  revisions?: string;
  features: string[];
  highlightAsRecommended?: boolean;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  categoryId: string;
  categoryName: string;
  type: "service" | "digital" | "smm";
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  tagline: string;
  description: string;
  iconUrl?: string;
  basePriceCents: number;
  tiers: AdminProductTier[];
  addonIds: string[];
  requirementIds: string[];
  customRequirements?: AdminRequirementField[];
  activeSubscriptions: number;
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  productCount: number;
  visible: boolean;
}

export interface AdminAddon {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  billingType: "one_time" | "recurring";
  applicableCategories: string[];
  active: boolean;
}

export interface AdminRequirementField {
  id: string;
  key: string;
  label: string;
  fieldType: "text" | "attachment" | "choice" | "textarea" | "url" | "select" | "file" | "checkbox";
  category?: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  isMultiSelect?: boolean;
  assignedCount?: number;
}

export interface AdminActiveService {
  id: string;
  serviceCode: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productName: string;
  packageName: "Standard" | "Growth" | "Enterprise";
  billingCycle: "monthly" | "quarterly" | "annual";
  priceCents: number;
  currency: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_PROVISION" | "CANCELLED";
  domain?: string;
  nextRenewalAt: string;
  createdAt: string;
}

export interface AdminServiceTransfer {
  id: string;
  serviceId: string;
  serviceCode: string;
  productName: string;
  fromCustomerName: string;
  fromCustomerEmail: string;
  toCustomerName: string;
  toCustomerEmail: string;
  reason: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  requestedAt: string;
  completedAt?: string;
}

export interface AdminServiceUpDowngrade {
  id: string;
  serviceId: string;
  serviceCode: string;
  customerName: string;
  productName: string;
  currentPackage: "Standard" | "Growth" | "Enterprise";
  targetPackage: "Standard" | "Growth" | "Enterprise";
  direction: "UPGRADE" | "DOWNGRADE";
  prorationDeltaCents: number;
  status: "PENDING" | "APPLIED" | "DECLINED";
  requestedAt: string;
}

export interface AdminInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderReference?: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
  formalization: "STANDARD" | "VAT_EINVOICE" | "GST_TAX_INVOICE" | "PROFORMA";
  taxId?: string;
  notes?: string;
  items: AdminInvoiceItem[];
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
}

export interface AdminSubscription {
  id: string;
  subscriptionCode: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  packageName: string;
  amountCents: number;
  currency: string;
  interval: "monthly" | "quarterly" | "annual";
  gateway: string;
  status: "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED";
  currentPeriodEnd: string;
}

export interface CashVaultEntry {
  id: string;
  reference: string;
  type: "INFLOW" | "PAYOUT" | "RESERVE" | "ADJUSTMENT";
  method: "CASH_COUNTER" | "BANK_WIRE" | "SETTLEMENT" | "PETTY_CASH";
  description: string;
  amountCents: number;
  currency: string;
  recordedBy: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  txRef: string;
  invoiceNumber: string;
  customerName: string;
  gateway: string;
  method: string;
  amountCents: number;
  feeCents: number;
  currency: string;
  status: "SUCCEEDED" | "PENDING" | "FAILED" | "REFUNDED";
  createdAt: string;
}

export interface PaymentLinkItem {
  id: string;
  code: string;
  title: string;
  customerEmail?: string;
  productName?: string;
  amountCents: number;
  currency: string;
  url: string;
  clicks: number;
  status: "ACTIVE" | "PAID" | "EXPIRED";
  createdAt: string;
}

export interface PaymentGatewayConfig {
  id: string;
  code: string;
  name: string;
  region: string;
  mode: "LIVE" | "SANDBOX";
  enabled: boolean;
  supportedCurrencies: string[];
  feePercent: number;
  fixedFeeCents: number;
  webhookUrl: string;
  credentialsConfigured: boolean;
  publicKeyMasked: string;
  lastHealthCheck: string;
}

export interface CheckoutModulePackage {
  id: string;
  fileName: string;
  moduleName: string;
  version: string;
  sizeKb: number;
  uploadedAt: string;
  status: "ACTIVE" | "PENDING_REVIEW";
}

export interface AdminCoupon {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  minOrderCents: number;
  maxUses: number;
  usedCount: number;
  appliesTo: string;
  expiresAt: string;
  active: boolean;
}

export interface PricingCurrencyRule {
  currency: string;
  symbol: string;
  rateToUsd: number;
  roundingRule: "NEAREST_1" | "NEAREST_5" | "EXACT_99";
  taxRatePct: number;
  enabled: boolean;
}

export interface PricingConsoleState {
  annualDiscountPct: number;
  quarterlyDiscountPct: number;
  autoTaxEnabled: boolean;
  currencies: PricingCurrencyRule[];
  tierMultipliers: {
    Standard: number;
    Growth: number;
    Enterprise: number;
  };
}
