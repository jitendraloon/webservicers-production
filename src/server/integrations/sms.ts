import {
  getActiveIntegrationForCategory,
  getIntegrationConfig,
} from "./vault";

export type SmsProvider = "twilio" | "vonage";

export interface SendSmsInput {
  to: string;
  message: string;
  from?: string;
  provider?: SmsProvider;
}

export interface SendSmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
}

interface SmsConfig extends Record<string, unknown> {
  from?: string;
  // Twilio
  accountSid?: string;
  authToken?: string;
  // Vonage
  apiKey?: string;
  apiSecret?: string;
}

async function sendViaTwilio(
  input: SendSmsInput,
  config: SmsConfig
): Promise<SendSmsResult> {
  const { accountSid, authToken } = config;
  const from = input.from ?? config.from;
  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Twilio configuration requires accountSid, authToken, and from."
    );
  }

  const form = new URLSearchParams();
  form.set("To", input.to);
  form.set("From", from);
  form.set("Body", input.message);

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Twilio API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { sid?: string };
  return {
    success: true,
    provider: "twilio",
    messageId: data.sid,
  };
}

async function sendViaVonage(
  input: SendSmsInput,
  config: SmsConfig
): Promise<SendSmsResult> {
  const { apiKey, apiSecret } = config;
  const from = input.from ?? config.from ?? "Webservicers";
  if (!apiKey || !apiSecret) {
    throw new Error("Vonage configuration requires apiKey and apiSecret.");
  }

  const response = await fetch("https://rest.nexmo.com/sms/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      api_secret: apiSecret,
      to: input.to.replace(/^\+/, ""),
      from,
      text: input.message,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Vonage API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    messages?: Array<{
      status?: string;
      "message-id"?: string;
      "error-text"?: string;
    }>;
  };
  const first = data.messages?.[0];
  if (first && first.status !== "0") {
    throw new Error(
      `Vonage SMS failed (status ${first.status}): ${first["error-text"] ?? "Unknown error"}`
    );
  }

  return {
    success: true,
    provider: "vonage",
    messageId: first?.["message-id"],
  };
}

/**
 * Send an SMS message using the configured SMS integration (Twilio or Vonage).
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const integration = input.provider
    ? await getIntegrationConfig<SmsConfig>("sms", input.provider)
    : await getActiveIntegrationForCategory<SmsConfig>("sms");

  if (!integration || !integration.enabled) {
    throw new Error(
      input.provider
        ? `SMS provider "${input.provider}" is not configured or enabled.`
        : "No active SMS integration is enabled."
    );
  }

  const provider = integration.provider.toLowerCase();
  switch (provider) {
    case "twilio":
      return sendViaTwilio(input, integration.config);
    case "vonage":
      return sendViaVonage(input, integration.config);
    default:
      throw new Error(`Unsupported SMS provider: ${integration.provider}`);
  }
}
