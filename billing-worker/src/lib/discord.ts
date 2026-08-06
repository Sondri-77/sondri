import { Env } from '../types';

export async function sendDiscordNotification(
  env: Env,
  title: string,
  description: string,
  color: number = 0x3b82f6 // Default blue
): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) {
    console.log('[Discord Notification Skipped] DISCORD_WEBHOOK_URL is not set.');
    return;
  }

  try {
    const payload = {
      username: 'Sondri Billing Bot',
      embeds: [
        {
          title,
          description,
          color,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Sondri Billing System',
          },
        },
      ],
    };

    const response = await fetch(env.DISCORD_WEBHOOK_URL, {
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
