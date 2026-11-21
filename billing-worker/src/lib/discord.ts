import { Env } from '../types';

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
      username: botUsername,
      embeds: [
        {
          title,
          description,
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
