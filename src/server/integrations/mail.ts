import net from "node:net";
import tls from "node:tls";
import { signAwsV4Request } from "./aws-sigv4";
import {
  getActiveIntegrationForCategory,
  getIntegrationConfig,
} from "./vault";

export type MailProvider =
  | "smtp"
  | "sendgrid"
  | "mailgun"
  | "ses"
  | "amazon_ses"
  | "mailchimp"
  | "mailchimp_transactional";

export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  provider?: MailProvider;
}

export interface SendMailResult {
  success: boolean;
  provider: string;
  messageId?: string;
}

interface MailConfig extends Record<string, unknown> {
  from?: string;
  fromEmail?: string;
  fromName?: string;
  // SMTP
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  user?: string;
  password?: string;
  pass?: string;
  // SendGrid / Mailchimp
  apiKey?: string;
  // Mailgun
  domain?: string;
  region?: string;
  // SES
  accessKeyId?: string;
  secretAccessKey?: string;
}

function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}

function resolveFromAddress(
  inputFrom: string | undefined,
  config: MailConfig
): string {
  if (inputFrom) return inputFrom;
  if (config.from) return config.from;
  if (config.fromEmail) {
    return config.fromName
      ? `${config.fromName} <${config.fromEmail}>`
      : config.fromEmail;
  }
  return "noreply@webservicers.com";
}

function extractEmail(address: string): string {
  const match = /<([^>]+)>/.exec(address);
  return (match ? match[1] : address).trim();
}

async function sendViaSmtp(
  input: SendMailInput,
  config: MailConfig
): Promise<SendMailResult> {
  const host = config.host;
  const port = Number(config.port ?? 587);
  const username = config.username ?? config.user;
  const password = config.password ?? config.pass;
  const secure = Boolean(config.secure ?? port === 465);

  if (!host) {
    throw new Error("SMTP configuration is missing host.");
  }

  const from = resolveFromAddress(input.from, config);
  const recipients = normalizeRecipients(input.to);

  await new Promise<void>((resolve, reject) => {
    let socket: net.Socket | tls.TLSSocket = secure
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });

    let buffer = "";
    let settled = false;

    const fail = (err: Error) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        reject(err);
      }
    };

    socket.setTimeout(15_000);
    socket.on("timeout", () => fail(new Error("SMTP connection timed out.")));
    socket.on("error", fail);

    const readResponse = (): Promise<{ code: number; text: string }> =>
      new Promise((res, rej) => {
        const tryParse = () => {
          const lines = buffer.split(/\r?\n/);
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (/^\d{3} /.test(line)) {
              const code = Number(line.slice(0, 3));
              const text = lines.slice(0, i + 1).join("\n");
              buffer = lines.slice(i + 1).join("\n");
              socket.off("data", onData);
              socket.off("error", rej);
              res({ code, text });
              return;
            }
          }
        };
        const onData = (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          tryParse();
        };
        socket.on("data", onData);
        socket.on("error", rej);
        tryParse();
      });

    const sendCommand = async (cmd: string, expectedCodes: number[]) => {
      socket.write(`${cmd}\r\n`);
      const resp = await readResponse();
      if (!expectedCodes.includes(resp.code)) {
        throw new Error(`SMTP error (${resp.code}): ${resp.text}`);
      }
      return resp;
    };

    (async () => {
      try {
        const greeting = await readResponse();
        if (greeting.code !== 220) {
          throw new Error(`SMTP greeting failed: ${greeting.text}`);
        }

        const ehloResp = await sendCommand("EHLO webservicers.local", [250]);

        if (!secure && ehloResp.text.toUpperCase().includes("STARTTLS")) {
          await sendCommand("STARTTLS", [220]);
          socket = await new Promise<tls.TLSSocket>((resTls, rejTls) => {
            const tlsSock = tls.connect(
              { socket, servername: host },
              () => resTls(tlsSock)
            );
            tlsSock.on("error", rejTls);
          });
          socket.setTimeout(15_000);
          socket.on("error", fail);
          await sendCommand("EHLO webservicers.local", [250]);
        }

        if (username && password) {
          await sendCommand("AUTH LOGIN", [334]);
          await sendCommand(
            Buffer.from(username, "utf8").toString("base64"),
            [334]
          );
          await sendCommand(
            Buffer.from(password, "utf8").toString("base64"),
            [235]
          );
        }

        await sendCommand(`MAIL FROM:<${extractEmail(from)}>`, [250]);
        for (const rcpt of recipients) {
          await sendCommand(`RCPT TO:<${extractEmail(rcpt)}>`, [250, 251]);
        }

        await sendCommand("DATA", [354]);

        const headers = [
          `From: ${from}`,
          `To: ${recipients.join(", ")}`,
          `Subject: ${input.subject.replace(/[\r\n]+/g, " ")}`,
          ...(input.replyTo ? [`Reply-To: ${input.replyTo}`] : []),
          "MIME-Version: 1.0",
          'Content-Type: text/html; charset="UTF-8"',
          "",
          input.html.replace(/^\./gm, ".."),
          ".",
        ].join("\r\n");

        await sendCommand(headers, [250]);
        await sendCommand("QUIT", [221]);

        if (!settled) {
          settled = true;
          socket.end();
          resolve();
        }
      } catch (err) {
        fail(err instanceof Error ? err : new Error(String(err)));
      }
    })();
  });

  return { success: true, provider: "smtp" };
}

async function sendViaSendGrid(
  input: SendMailInput,
  config: MailConfig
): Promise<SendMailResult> {
  if (!config.apiKey) {
    throw new Error("SendGrid configuration is missing apiKey.");
  }

  const from = resolveFromAddress(input.from, config);
  const recipients = normalizeRecipients(input.to).map((email) => ({
    email: extractEmail(email),
  }));

  const content: Array<{ type: string; value: string }> = [];
  if (input.text) {
    content.push({ type: "text/plain", value: input.text });
  }
  content.push({ type: "text/html", value: input.html });

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: recipients }],
      from: { email: extractEmail(from) },
      ...(input.replyTo ? { reply_to: { email: extractEmail(input.replyTo) } } : {}),
      subject: input.subject,
      content,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`SendGrid API error (${response.status}): ${errText}`);
  }

  return {
    success: true,
    provider: "sendgrid",
    messageId: response.headers.get("x-message-id") ?? undefined,
  };
}

async function sendViaMailgun(
  input: SendMailInput,
  config: MailConfig
): Promise<SendMailResult> {
  if (!config.apiKey || !config.domain) {
    throw new Error("Mailgun configuration requires apiKey and domain.");
  }

  const baseHost =
    config.region?.toLowerCase() === "eu"
      ? "https://api.eu.mailgun.net"
      : "https://api.mailgun.net";
  const from = resolveFromAddress(input.from, config);
  const form = new URLSearchParams();
  form.set("from", from);
  for (const recipient of normalizeRecipients(input.to)) {
    form.append("to", recipient);
  }
  form.set("subject", input.subject);
  form.set("html", input.html);
  if (input.text) form.set("text", input.text);
  if (input.replyTo) form.set("h:Reply-To", input.replyTo);

  const auth = Buffer.from(`api:${config.apiKey}`).toString("base64");
  const response = await fetch(`${baseHost}/v3/${config.domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Mailgun API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { id?: string };
  return {
    success: true,
    provider: "mailgun",
    messageId: data.id,
  };
}

async function sendViaSes(
  input: SendMailInput,
  config: MailConfig
): Promise<SendMailResult> {
  if (!config.accessKeyId || !config.secretAccessKey) {
    throw new Error("Amazon SES configuration requires accessKeyId and secretAccessKey.");
  }

  const region = config.region || "us-east-1";
  const url = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;
  const from = resolveFromAddress(input.from, config);

  const body = JSON.stringify({
    FromEmailAddress: from,
    Destination: {
      ToAddresses: normalizeRecipients(input.to),
    },
    ...(input.replyTo ? { ReplyToAddresses: [input.replyTo] } : {}),
    Content: {
      Simple: {
        Subject: { Data: input.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: input.html, Charset: "UTF-8" },
          ...(input.text ? { Text: { Data: input.text, Charset: "UTF-8" } } : {}),
        },
      },
    },
  });

  const headers = signAwsV4Request({
    method: "POST",
    url,
    region,
    service: "ses",
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    headers: {
      "content-type": "application/json",
    },
    body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Amazon SES error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { MessageId?: string };
  return {
    success: true,
    provider: "ses",
    messageId: data.MessageId,
  };
}

async function sendViaMailchimpTransactional(
  input: SendMailInput,
  config: MailConfig
): Promise<SendMailResult> {
  if (!config.apiKey) {
    throw new Error("Mailchimp Transactional configuration is missing apiKey.");
  }

  const from = resolveFromAddress(input.from, config);
  const response = await fetch(
    "https://mandrillapp.com/api/1.0/messages/send",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: config.apiKey,
        message: {
          html: input.html,
          ...(input.text ? { text: input.text } : {}),
          subject: input.subject,
          from_email: extractEmail(from),
          ...(config.fromName ? { from_name: config.fromName } : {}),
          to: normalizeRecipients(input.to).map((email) => ({
            email: extractEmail(email),
            type: "to",
          })),
          ...(input.replyTo
            ? { headers: { "Reply-To": input.replyTo } }
            : {}),
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Mailchimp Transactional error (${response.status}): ${errText}`
    );
  }

  const data = (await response.json()) as Array<{ _id?: string; status?: string }>;
  return {
    success: true,
    provider: "mailchimp_transactional",
    messageId: data[0]?._id,
  };
}

/**
 * Send an email using the configured mail integration (or a specified provider).
 * Supports SMTP, SendGrid, Mailgun, Amazon SES, and Mailchimp Transactional.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const integration = input.provider
    ? await getIntegrationConfig<MailConfig>("mail", input.provider)
    : await getActiveIntegrationForCategory<MailConfig>("mail");

  if (!integration || !integration.enabled) {
    throw new Error(
      input.provider
        ? `Mail provider "${input.provider}" is not configured or enabled.`
        : "No active mail integration is enabled."
    );
  }

  const provider = integration.provider.toLowerCase();
  const config = integration.config;

  switch (provider) {
    case "smtp":
      return sendViaSmtp(input, config);
    case "sendgrid":
      return sendViaSendGrid(input, config);
    case "mailgun":
      return sendViaMailgun(input, config);
    case "ses":
    case "amazon_ses":
      return sendViaSes(input, config);
    case "mailchimp":
    case "mailchimp_transactional":
      return sendViaMailchimpTransactional(input, config);
    default:
      throw new Error(`Unsupported mail provider: ${integration.provider}`);
  }
}
