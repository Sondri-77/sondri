export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  API_KEY: string;
  DISCORD_WEBHOOK_URL?: string;
  GOOGLE_SHEETS_WEBHOOK_URL?: string;
}

export interface CreateCustomerDTO {
  name: string;
  email: string;
  client_id: string; // Internal Sondri client identifier
}

export interface CreateSubscriptionDTO {
  price_id: string; // Stripe Price ID for monthly/quarterly retainer
}

export interface CreateChargeDTO {
  amount: number; // In cents/pence (e.g. 50000 = $500.00)
  description: string; // e.g. "10 hrs AI Automation development (T&M)"
  currency?: string; // Default 'usd'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
