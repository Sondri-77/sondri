import { Env } from '../types';

const DISCORD_MAX_TITLE = 256;
const DISCORD_MAX_DESCRIPTION = 4000;
const DISCORD_MAX_USERNAME = 80;

function clampText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

export function escapeDiscordText(value: unknown, maxLen: number = 300): string {
  const cleaned = String(value ?? '')
    .replace(/[\r\n\t\x00-\x1f\x7f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const escaped = cleaned.replace(/[\\*_~`|[\]()<>@]/g, '\\$&');
  return clampText(escaped, maxLen);
}

export function sanitizeDiscordCode(value: unknown, maxLen: number = 200): string {
  const cleaned = String(value ?? '')
    .replace(/[\r\n\t\x00-\x1f\x7f`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clampText(cleaned, maxLen);
}

export async function sendDiscordNotification(
  env: Env,
  title: string,
  description: string,
  color: number = 0x3b82f6, // Default blue
  webhookOverride?: string,
  botUsername: string = 'Sondri Billing Bot'
): Promise<void> {
  const targetWebhook = webhookOverride || env.DISCORD_WEBHOOK_URL;
  if (!targetWebhook) {
    console.log('[Discord Notification Skipped] Webhook URL is not set.');
    return;
  }

  try {
    const payload = {
      username: clampText(String(botUsername || 'Sondri Billing Bot').trim(), DISCORD_MAX_USERNAME),
      allowed_mentions: { parse: [] as string[] },
      embeds: [
        {
          title: clampText(String(title || 'Sondri Notification'), DISCORD_MAX_TITLE),
          description: clampText(String(description || ''), DISCORD_MAX_DESCRIPTION),
          color,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Sondri System',
          },
        },
      ],
    };

    const response = await fetch(targetWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Discord Notification Failed] HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (err) {
    console.error('[Discord Notification Error]', err);
  }
}
