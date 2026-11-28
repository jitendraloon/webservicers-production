import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { decrypt } from "@/server/crypto";
import { db } from "@/server/db";

export interface InitiatePaymentParams {
  invoiceId: string;
  userId: string;
  amountCents: bigint;
  currency: string;
  returnUrl: string;
  cancelUrl?: string;
  webhookUrl?: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface InitiatePaymentResult {
  gatewaySlug: string;
  transactionId: string;
  redirectUrl?: string;
  clientSecret?: string;
  instructions?: string;
  status: "INITIATED" | "SUCCESS" | "FAILED";
  raw?: Record<string, unknown>;
}

export interface VerifyWebhookParams {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
}

export interface VerifyWebhookResult {
  valid: boolean;
  gatewaySlug: string;
  eventId?: string;
  invoiceId?: string;
  status: "SUCCESS" | "FAILED" | "REFUNDED" | "INITIATED";
  amountCents?: bigint;
  currency?: string;
  raw?: Record<string, unknown>;
}

export interface RefundParams {
  transactionId: string;
  amountCents?: bigint;
  currency?: string;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  gatewaySlug: string;
  refundId?: string;
  raw?: Record<string, unknown>;
}

export interface PaymentGateway {
  slug: string;
  name: string;
  initiatePayment(
    params: InitiatePaymentParams,
    config: Record<string, unknown>
  ): Promise<InitiatePaymentResult>;
  verifyWebhook(
    params: VerifyWebhookParams,
    config: Record<string, unknown>
  ): Promise<VerifyWebhookResult>;
  refund(
    params: RefundParams,
    config: Record<string, unknown>
  ): Promise<RefundResult>;
}

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) {
      return Array.isArray(v) ? v[0] : v;
    }
  }
  return undefined;
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ---------------------------------------------------------------------------
// 1. Wallet (internal balance)
// ---------------------------------------------------------------------------
const walletGateway: PaymentGateway = {
  slug: "wallet",
  name: "Account Wallet",
  async initiatePayment(params) {
    const movements = await db.balanceMovement.findMany({
      where: { userId: params.userId, currency: params.currency },
      select: { type: true, amountCents: true },
    });

    const balance = movements.reduce((acc, m) => {
      return m.type === "CREDIT"
        ? acc + m.amountCents
        : acc - m.amountCents;
    }, BigInt(0));

    if (balance < params.amountCents) {
      throw new Error("Insufficient wallet balance.");
    }

    const txId = `wal_${crypto.randomUUID()}`;
    await db.$transaction([
      db.balanceMovement.create({
        data: {
          userId: params.userId,
          type: "DEBIT",
          amountCents: params.amountCents,
          currency: params.currency,
          reference: txId,
          description: params.description ?? `Invoice ${params.invoiceId}`,
        },
      }),
      db.invoice.update({
        where: { id: params.invoiceId },
        data: { status: "PAID", paidAt: new Date() },
      }),
    ]);

    return {
      gatewaySlug: "wallet",
      transactionId: txId,
      redirectUrl: params.returnUrl,
      status: "SUCCESS",
    };
  },
  async verifyWebhook() {
    return { valid: true, gatewaySlug: "wallet", status: "SUCCESS" };
  },
  async refund(params) {
    return {
      success: true,
      gatewaySlug: "wallet",
      refundId: `wal_ref_${params.transactionId}`,
    };
  },
};

// ---------------------------------------------------------------------------
// 2. Stripe
// ---------------------------------------------------------------------------
const stripeGateway: PaymentGateway = {
  slug: "stripe",
  name: "Stripe",
  async initiatePayment(params, config) {
    const secretKey = String(config.secretKey ?? "");
    if (!secretKey) throw new Error("Stripe secretKey is not configured.");

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", params.returnUrl);
    form.set("cancel_url", params.cancelUrl ?? params.returnUrl);
    form.set("line_items[0][price_data][currency]", params.currency.toLowerCase());
    form.set("line_items[0][price_data][unit_amount]", params.amountCents.toString());
    form.set(
      "line_items[0][price_data][product_data][name]",
      params.description ?? `Invoice ${params.invoiceId}`
    );
    form.set("line_items[0][quantity]", "1");
    form.set("metadata[invoiceId]", params.invoiceId);
    if (params.customerEmail) form.set("customer_email", params.customerEmail);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!res.ok) {
      throw new Error(`Stripe error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as { id: string; url?: string };
    return {
      gatewaySlug: "stripe",
      transactionId: data.id,
      redirectUrl: data.url,
      status: "INITIATED",
      raw: data as unknown as Record<string, unknown>,
    };
  },
  async verifyWebhook(params, config) {
    const webhookSecret = String(config.webhookSecret ?? "");
    const sigHeader = getHeader(params.headers, "stripe-signature");
    if (!webhookSecret || !sigHeader) {
      return { valid: false, gatewaySlug: "stripe", status: "FAILED" };
    }

    const parts = Object.fromEntries(
      sigHeader.split(",").map((kv) => kv.split("="))
    );
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) {
      return { valid: false, gatewaySlug: "stripe", status: "FAILED" };
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${params.rawBody}`)
      .digest("hex");

    if (!timingSafeHexEqual(expected, signature)) {
      return { valid: false, gatewaySlug: "stripe", status: "FAILED" };
    }

    const event = JSON.parse(params.rawBody) as {
      id?: string;
      type?: string;
      data?: {
        object?: {
          metadata?: { invoiceId?: string };
          amount_total?: number;
          currency?: string;
        };
      };
    };

    const obj = event.data?.object;
    const status =
      event.type === "checkout.session.completed" ||
      event.type === "payment_intent.succeeded"
        ? "SUCCESS"
        : event.type === "charge.refunded"
          ? "REFUNDED"
          : "INITIATED";

    return {
      valid: true,
      gatewaySlug: "stripe",
      eventId: event.id,
      invoiceId: obj?.metadata?.invoiceId,
      status,
      amountCents:
        typeof obj?.amount_total === "number"
          ? BigInt(obj.amount_total)
          : undefined,
      currency: obj?.currency?.toUpperCase(),
      raw: event as unknown as Record<string, unknown>,
    };
  },
  async refund(params, config) {
    const secretKey = String(config.secretKey ?? "");
    if (!secretKey) throw new Error("Stripe secretKey is not configured.");

    const form = new URLSearchParams();
    form.set("payment_intent", params.transactionId);
    if (params.amountCents !== undefined) {
      form.set("amount", params.amountCents.toString());
    }

    const res = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!res.ok) {
      throw new Error(`Stripe refund failed (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as { id: string };
    return {
      success: true,
      gatewaySlug: "stripe",
      refundId: data.id,
      raw: data as unknown as Record<string, unknown>,
    };
  },
};

// ---------------------------------------------------------------------------
// 3. PayPal
// ---------------------------------------------------------------------------
async function getPayPalToken(config: Record<string, unknown>): Promise<{
  baseUrl: string;
  token: string;
}> {
  const clientId = String(config.clientId ?? "");
  const clientSecret = String(config.clientSecret ?? "");
  if (!clientId || !clientSecret) {
    throw new Error("PayPal clientId and clientSecret are required.");
  }
  const baseUrl = config.sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new Error(`PayPal auth error (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return { baseUrl, token: data.access_token };
}

const paypalGateway: PaymentGateway = {
  slug: "paypal",
  name: "PayPal",
  async initiatePayment(params, config) {
    const { baseUrl, token } = await getPayPalToken(config);
    const value = (Number(params.amountCents) / 100).toFixed(2);

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: params.invoiceId,
            description: params.description ?? `Invoice ${params.invoiceId}`,
            amount: { currency_code: params.currency, value },
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl ?? params.returnUrl,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`PayPal order error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      id: string;
      links?: Array<{ rel: string; href: string }>;
    };
    const approveLink = data.links?.find((l) => l.rel === "approve")?.href;

    return {
      gatewaySlug: "paypal",
      transactionId: data.id,
      redirectUrl: approveLink,
      status: "INITIATED",
      raw: data as unknown as Record<string, unknown>,
    };
  },
  async verifyWebhook(params) {
    const event = JSON.parse(params.rawBody) as {
      id?: string;
      event_type?: string;
      resource?: {
        purchase_units?: Array<{ reference_id?: string }>;
      };
    };
    const transmissionSig = getHeader(
      params.headers,
      "paypal-transmission-sig"
    );
    return {
      valid: Boolean(transmissionSig),
      gatewaySlug: "paypal",
      eventId: event.id,
      invoiceId: event.resource?.purchase_units?.[0]?.reference_id,
      status:
        event.event_type === "PAYMENT.CAPTURE.COMPLETED"
          ? "SUCCESS"
          : event.event_type === "PAYMENT.CAPTURE.REFUNDED"
            ? "REFUNDED"
            : "INITIATED",
      raw: event as unknown as Record<string, unknown>,
    };
  },
  async refund(params, config) {
    const { baseUrl, token } = await getPayPalToken(config);
    const res = await fetch(
      `${baseUrl}/v2/payments/captures/${encodeURIComponent(params.transactionId)}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          params.amountCents !== undefined && params.currency
            ? {
                amount: {
                  value: (Number(params.amountCents) / 100).toFixed(2),
                  currency_code: params.currency,
                },
              }
            : {}
        ),
      }
    );
    if (!res.ok) {
      throw new Error(`PayPal refund failed (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as { id?: string };
    return {
      success: true,
      gatewaySlug: "paypal",
      refundId: data.id,
      raw: data as unknown as Record<string, unknown>,
    };
  },
};

// ---------------------------------------------------------------------------
// 4. Razorpay
// ---------------------------------------------------------------------------
const razorpayGateway: PaymentGateway = {
  slug: "razorpay",
  name: "Razorpay",
  async initiatePayment(params, config) {
    const keyId = String(config.keyId ?? "");
    const keySecret = String(config.keySecret ?? "");
    if (!keyId || !keySecret) {
      throw new Error("Razorpay keyId and keySecret are required.");
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(params.amountCents),
        currency: params.currency,
        description: params.description ?? `Invoice ${params.invoiceId}`,
        reference_id: params.invoiceId,
        callback_url: params.returnUrl,
        callback_method: "get",
      }),
    });

    if (!res.ok) {
      throw new Error(`Razorpay error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as { id: string; short_url?: string };
    return {
      gatewaySlug: "razorpay",
      transactionId: data.id,
      redirectUrl: data.short_url,
      status: "INITIATED",
      raw: data as unknown as Record<string, unknown>,
    };
  },
  async verifyWebhook(params, config) {
    const secret = String(config.webhookSecret ?? "");
    const sig = getHeader(params.headers, "x-razorpay-signature");
    if (!secret || !sig) {
      return { valid: false, gatewaySlug: "razorpay", status: "FAILED" };
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(params.rawBody)
      .digest("hex");

    if (!timingSafeHexEqual(expected, sig)) {
      return { valid: false, gatewaySlug: "razorpay", status: "FAILED" };
    }

    const payload = JSON.parse(params.rawBody) as {
      event?: string;
      payload?: {
        payment_link?: { entity?: { reference_id?: string } };
      };
    };

    return {
      valid: true,
      gatewaySlug: "razorpay",
      invoiceId: payload.payload?.payment_link?.entity?.reference_id,
      status:
        payload.event === "payment_link.paid" ||
        payload.event === "payment.captured"
          ? "SUCCESS"
          : payload.event === "refund.processed"
            ? "REFUNDED"
            : "INITIATED",
      raw: payload as unknown as Record<string, unknown>,
    };
  },
  async refund(params, config) {
    const keyId = String(config.keyId ?? "");
    const keySecret = String(config.keySecret ?? "");
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(params.transactionId)}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          params.amountCents !== undefined
            ? { amount: Number(params.amountCents) }
            : {}
        ),
      }
    );
    if (!res.ok) {
      throw new Error(`Razorpay refund failed (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as { id?: string };
    return {
      success: true,
      gatewaySlug: "razorpay",
      refundId: data.id,
      raw: data as unknown as Record<string, unknown>,
    };
  },
};

// ---------------------------------------------------------------------------
// 5. PayU
// ---------------------------------------------------------------------------
const payuGateway: PaymentGateway = {
  slug: "payu",
  name: "PayU",
  async initiatePayment(params, config) {
    const merchantKey = String(config.merchantKey ?? "");
    const merchantSalt = String(config.merchantSalt ?? "");
    if (!merchantKey || !merchantSalt) {
      throw new Error("PayU merchantKey and merchantSalt are required.");
    }

    const txnid = `payu_${params.invoiceId}_${Date.now()}`;
    const amount = (Number(params.amountCents) / 100).toFixed(2);
    const productinfo = params.description ?? `Invoice ${params.invoiceId}`;
    const firstname = "Customer";
    const email = params.customerEmail ?? "customer@webservicers.com";

    const hashString = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${merchantSalt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const baseUrl = config.sandbox
      ? "https://test.payu.in/_payment"
      : "https://secure.payu.in/_payment";

    return {
      gatewaySlug: "payu",
      transactionId: txnid,
      redirectUrl: `${baseUrl}?key=${encodeURIComponent(merchantKey)}&txnid=${encodeURIComponent(txnid)}&amount=${encodeURIComponent(amount)}&hash=${hash}`,
      status: "INITIATED",
      raw: { txnid, hash, amount, productinfo },
    };
  },
  async verifyWebhook(params, config) {
    const merchantSalt = String(config.merchantSalt ?? "");
    const data = JSON.parse(params.rawBody) as Record<string, string>;
    if (!merchantSalt || !data.hash || !data.txnid) {
      return { valid: false, gatewaySlug: "payu", status: "FAILED" };
    }

    const reverseHashStr = `${merchantSalt}|${data.status ?? ""}|||||||||||${data.email ?? ""}|${data.firstname ?? ""}|${data.productinfo ?? ""}|${data.amount ?? ""}|${data.txnid}|${data.key ?? ""}`;
    const expected = crypto
      .createHash("sha512")
      .update(reverseHashStr)
      .digest("hex");

    return {
      valid: timingSafeHexEqual(expected, data.hash),
      gatewaySlug: "payu",
      eventId: data.mihpayid ?? data.txnid,
      status: data.status === "success" ? "SUCCESS" : "FAILED",
      raw: data,
    };
  },
  async refund(params) {
    return {
      success: true,
      gatewaySlug: "payu",
      refundId: `payu_ref_${params.transactionId}`,
    };
  },
};

// ---------------------------------------------------------------------------
// 6. Cashfree
// ---------------------------------------------------------------------------
const cashfreeGateway: PaymentGateway = {
  slug: "cashfree",
  name: "Cashfree",
  async initiatePayment(params, config) {
    const appId = String(config.appId ?? "");
    const secretKey = String(config.secretKey ?? "");
    if (!appId || !secretKey) {
      throw new Error("Cashfree appId and secretKey are required.");
    }

    const baseUrl = config.sandbox
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";

    const orderId = `cf_${params.invoiceId}_${Date.now()}`;
    const res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number((Number(params.amountCents) / 100).toFixed(2)),
        order_currency: params.currency,
        customer_details: {
          customer_id: params.userId,
          customer_email: params.customerEmail ?? "customer@webservicers.com",
          customer_phone: "9999999999",
        },
        order_meta: {
          return_url: params.returnUrl,
          notify_url: params.webhookUrl,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Cashfree error (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as {
      cf_order_id?: string;
      payment_session_id?: string;
    };

    return {
      gatewaySlug: "cashfree",
      transactionId: orderId,
      clientSecret: data.payment_session_id,
      status: "INITIATED",
      raw: data as unknown as Record<string, unknown>,
    };
  },
  async verifyWebhook(params, config) {
    const secretKey = String(config.secretKey ?? "");
    const timestamp = getHeader(params.headers, "x-webhook-timestamp");
    const signature = getHeader(params.headers, "x-webhook-signature");
    if (!secretKey || !timestamp || !signature) {
      return { valid: false, gatewaySlug: "cashfree", status: "FAILED" };
    }

    const expected = crypto
      .createHmac("sha256", secretKey)
      .update(`${timestamp}${params.rawBody}`)
      .digest("base64");

    const valid = timingSafeHexEqual(expected, signature);
    const body = JSON.parse(params.rawBody) as {
      type?: string;
      data?: { order?: { order_id?: string } };
    };

    return {
      valid,
      gatewaySlug: "cashfree",
      status: body.type === "PAYMENT_SUCCESS_WEBHOOK" ? "SUCCESS" : "FAILED",
      raw: body as unknown as Record<string, unknown>,
    };
  },
  async refund(params, config) {
    const appId = String(config.appId ?? "");
    const secretKey = String(config.secretKey ?? "");
    const baseUrl = config.sandbox
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";

    const refundId = `cf_ref_${Date.now()}`;
    const res = await fetch(
      `${baseUrl}/orders/${encodeURIComponent(params.transactionId)}/refunds`,
      {
        method: "POST",
        headers: {
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "x-api-version": "2023-08-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refund_id: refundId,
          refund_amount: params.amountCents
            ? Number((Number(params.amountCents) / 100).toFixed(2))
            : undefined,
          refund_note: params.reason ?? "Customer refund",
        }),
      }
    );
    if (!res.ok) {
      throw new Error(`Cashfree refund failed (${res.status}): ${await res.text()}`);
    }
    return {
      success: true,
      gatewaySlug: "cashfree",
      refundId,
    };
  },
};

// ---------------------------------------------------------------------------
// 7. CoinPayments
// ---------------------------------------------------------------------------
const coinPaymentsGateway: PaymentGateway = {
  slug: "coinpayments",
  name: "CoinPayments",
  async initiatePayment(params, config) {
    const publicKey = String(config.publicKey ?? "");
    const privateKey = String(config.privateKey ?? "");
    if (!publicKey || !privateKey) {
      throw new Error("CoinPayments publicKey and privateKey are required.");
    }

    const form = new URLSearchParams();
    form.set("version", "1");
    form.set("cmd", "create_transaction");
    form.set("key", publicKey);
    form.set("amount", (Number(params.amountCents) / 100).toFixed(2));
    form.set("currency1", params.currency);
    form.set("currency2", String(config.settlementCurrency ?? "USDT.TRC20"));
    form.set("buyer_email", params.customerEmail ?? "customer@webservicers.com");
    form.set("invoice", params.invoiceId);
    if (params.webhookUrl) form.set("ipn_url", params.webhookUrl);
    form.set("success_url", params.returnUrl);

    const payload = form.toString();
    const hmac = crypto
      .createHmac("sha512", privateKey)
      .update(payload)
      .digest("hex");

    const res = await fetch("https://www.coinpayments.net/api.php", {
      method: "POST",
      headers: {
        HMAC: hmac,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });

    if (!res.ok) {
      throw new Error(`CoinPayments error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as {
      error?: string;
      result?: { txn_id?: string; checkout_url?: string };
    };
    if (data.error && data.error !== "ok") {
      throw new Error(`CoinPayments API error: ${data.error}`);
    }

    return {
      gatewaySlug: "coinpayments",
      transactionId: data.result?.txn_id ?? `cp_${params.invoiceId}`,
      redirectUrl: data.result?.checkout_url,
      status: "INITIATED",
      raw: data as unknown as Record<string, unknown>,
    };
  },
  async verifyWebhook(params, config) {
    const ipnSecret = String(config.ipnSecret ?? "");
    const hmacHeader = getHeader(params.headers, "hmac");
    if (!ipnSecret || !hmacHeader) {
      return { valid: false, gatewaySlug: "coinpayments", status: "FAILED" };
    }

    const expected = crypto
      .createHmac("sha512", ipnSecret)
      .update(params.rawBody)
      .digest("hex");

    if (!timingSafeHexEqual(expected, hmacHeader)) {
      return { valid: false, gatewaySlug: "coinpayments", status: "FAILED" };
    }

    const form = new URLSearchParams(params.rawBody);
    const statusNum = Number(form.get("status") ?? "0");
    return {
      valid: true,
      gatewaySlug: "coinpayments",
      eventId: form.get("txn_id") ?? undefined,
      invoiceId: form.get("invoice") ?? undefined,
      status: statusNum >= 100 || statusNum === 2 ? "SUCCESS" : "INITIATED",
    };
  },
  async refund(params) {
    return {
      success: false,
      gatewaySlug: "coinpayments",
      raw: { message: "Crypto transactions must be refunded manually.", transactionId: params.transactionId },
    };
  },
};

// ---------------------------------------------------------------------------
// 8. Bank / Manual Transfer
// ---------------------------------------------------------------------------
const bankManualGateway: PaymentGateway = {
  slug: "bank_manual",
  name: "Bank / Manual Transfer",
  async initiatePayment(params, config) {
    const txId = `bank_${params.invoiceId}_${Date.now()}`;
    return {
      gatewaySlug: "bank_manual",
      transactionId: txId,
      instructions: String(
        config.instructions ??
          "Transfer the invoice amount to the designated bank account and upload proof of payment."
      ),
      status: "INITIATED",
    };
  },
  async verifyWebhook() {
    return {
      valid: true,
      gatewaySlug: "bank_manual",
      status: "INITIATED",
    };
  },
  async refund(params) {
    return {
      success: true,
      gatewaySlug: "bank_manual",
      refundId: `bank_ref_${params.transactionId}`,
    };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
const gatewayRegistry = new Map<string, PaymentGateway>([
  [walletGateway.slug, walletGateway],
  [stripeGateway.slug, stripeGateway],
  [paypalGateway.slug, paypalGateway],
  [razorpayGateway.slug, razorpayGateway],
  [payuGateway.slug, payuGateway],
  [cashfreeGateway.slug, cashfreeGateway],
  [coinPaymentsGateway.slug, coinPaymentsGateway],
  [bankManualGateway.slug, bankManualGateway],
]);

export function registerPaymentGateway(gateway: PaymentGateway): void {
  gatewayRegistry.set(gateway.slug, gateway);
}

export function getPaymentGateway(slug: string): PaymentGateway | undefined {
  return gatewayRegistry.get(slug);
}

export function listPaymentGateways(): PaymentGateway[] {
  return Array.from(gatewayRegistry.values());
}

/**
 * Resolve and decrypt configuration for a PaymentGateway record from Prisma.
 */
export async function getGatewayConfigFromDb(
  slug: string
): Promise<Record<string, unknown>> {
  const row = await db.paymentGateway.findUnique({ where: { slug } });
  if (!row?.configEnc) return {};
  return JSON.parse(decrypt(row.configEnc)) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Clean-room ZIP payment module loader (storage/payment-modules/)
// ---------------------------------------------------------------------------
const PAYMENT_MODULES_ROOT = path.resolve(
  process.cwd(),
  "storage",
  "payment-modules"
);

function extractZipEntries(zipBuffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let offset = 0;

  while (offset + 30 <= zipBuffer.length) {
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break;
    }

    const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);

    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const dataStart = nameEnd + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > zipBuffer.length) {
      throw new Error("Corrupted ZIP archive: entry exceeds buffer length.");
    }

    const fileName = zipBuffer
      .subarray(nameStart, nameEnd)
      .toString("utf8")
      .replace(/\\/g, "/");
    const compressedData = zipBuffer.subarray(dataStart, dataEnd);

    if (!fileName.endsWith("/")) {
      if (compressionMethod === 0) {
        entries.set(fileName, Buffer.from(compressedData));
      } else if (compressionMethod === 8) {
        entries.set(fileName, zlib.inflateRawSync(compressedData));
      } else {
        throw new Error(
          `Unsupported ZIP compression method ${compressionMethod} for ${fileName}.`
        );
      }
    }

    offset = dataEnd;
  }

  return entries;
}

/**
 * Load a custom payment gateway module from a `.zip` file inside `storage/payment-modules/`.
 * The archive must contain `manifest.json` (with `slug`, `name`, `entry`) and the JS entry file
 * exporting `initiatePayment`, `verifyWebhook`, and `refund`.
 */
export async function loadZipPaymentModule(
  zipPath: string
): Promise<PaymentGateway> {
  const resolvedPath = path.isAbsolute(zipPath)
    ? path.resolve(zipPath)
    : path.resolve(PAYMENT_MODULES_ROOT, zipPath);

  if (
    !resolvedPath.startsWith(PAYMENT_MODULES_ROOT + path.sep) &&
    resolvedPath !== PAYMENT_MODULES_ROOT
  ) {
    throw new Error(
      "Custom payment module must reside inside storage/payment-modules/."
    );
  }

  const zipBuffer = await fs.readFile(resolvedPath);
  const entries = extractZipEntries(zipBuffer);

  const manifestBuf = entries.get("manifest.json");
  if (!manifestBuf) {
    throw new Error("Payment module ZIP is missing manifest.json.");
  }

  const manifest = JSON.parse(manifestBuf.toString("utf8")) as {
    slug?: string;
    name?: string;
    entry?: string;
  };

  if (!manifest.slug || !manifest.name) {
    throw new Error("manifest.json must define slug and name.");
  }

  const entryFile = (manifest.entry ?? "index.js").replace(/^\.\//, "");
  const codeBuf = entries.get(entryFile);
  if (!codeBuf) {
    throw new Error(`Payment module entry file "${entryFile}" not found in ZIP.`);
  }

  const moduleObj: { exports: Record<string, unknown> } = { exports: {} };
  const sandbox = {
    module: moduleObj,
    exports: moduleObj.exports,
    crypto,
    fetch,
    Buffer,
    URL,
    URLSearchParams,
  };

  vm.runInNewContext(codeBuf.toString("utf8"), sandbox, {
    filename: `${manifest.slug}/${entryFile}`,
    timeout: 2000,
  });

  const exported = (moduleObj.exports.default ??
    moduleObj.exports) as Partial<PaymentGateway>;

  if (
    typeof exported.initiatePayment !== "function" ||
    typeof exported.verifyWebhook !== "function" ||
    typeof exported.refund !== "function"
  ) {
    throw new Error(
      `Payment module "${manifest.slug}" must export initiatePayment, verifyWebhook, and refund.`
    );
  }

  const gateway: PaymentGateway = {
    slug: manifest.slug,
    name: manifest.name,
    initiatePayment: exported.initiatePayment,
    verifyWebhook: exported.verifyWebhook,
    refund: exported.refund,
  };

  registerPaymentGateway(gateway);
  return gateway;
}
