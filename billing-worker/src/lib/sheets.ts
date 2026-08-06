import { Env } from '../types';

export interface PaymentRecord {
  date: string;
  clientEmail: string;
  customerName: string;
  amount: string;
  currency: string;
  invoiceNumber: string;
  description: string;
  status: string;
}

export async function appendToGoogleSheet(env: Env, record: PaymentRecord): Promise<void> {
  if (!env.GOOGLE_SHEETS_WEBHOOK_URL) {
    console.log('[Google Sheets Skipped] GOOGLE_SHEETS_WEBHOOK_URL is not configured.');
    return;
  }

  try {
    const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });

    if (response.ok) {
      console.log(`[Google Sheets Success] Payment appended for ${record.customerName} (${record.amount} ${record.currency})`);
    } else {
      console.error(`[Google Sheets Failed] HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (err: any) {
    console.error('[Google Sheets Error]', err);
  }
}
