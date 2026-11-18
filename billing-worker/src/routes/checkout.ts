import { getStripe } from '../lib/stripe';
import { Env } from '../types';
import Stripe from 'stripe';

export type WatchOfferSku =
  | 'aeo_full_audit'
  | 'listings_sprint'
  | 'clinicas_pack'
  | 'law_pack'
  | 'shopify_check'
  | 'fix_sprint'
  | 'agency_pilot_audit'
  | 'agency_reaudit'
  | 'portfolio_snapshot'
  | 'watch_local'
  | 'watch_commerce'
  | 'watch_pro'
  | 'watch_agency_client'
  | 'website_quick_fix'
  | 'website_5page'
  | 'website_10page';

export interface CreateCheckoutSessionDTO {
  type: 'fixed' | 'custom' | 'aeo_full_audit' | 'watch_offer';
  offer_sku?: WatchOfferSku;
  plan_id?: 'starter' | 'growth' | 'enterprise';
  custom_amount?: number; // In dollars (e.g. 2500)
  description?: string;
  client_email?: string;
  audit_id?: string;
  domain?: string;
  city?: string;
  service?: string;
  lang?: 'en' | 'es';
  success_url?: string;
  cancel_url?: string;
}

const PLAN_PRICES: Record<string, { amount: number; name: string; interval: 'month' }> = {
  starter: { amount: 1500, name: 'Sondri Starter Retainer Plan', interval: 'month' },
  growth: { amount: 3500, name: 'Sondri Growth Retainer Plan', interval: 'month' },
  enterprise: { amount: 5000, name: 'Sondri Enterprise Retainer Plan', interval: 'month' },
};

interface WatchCatalogItem {
  unitAmountCents: number;
  mode: 'payment' | 'subscription';
  nameEn: string;
  nameEs: string;
  descEn: string;
  descEs: string;
  runBaseline: boolean;
}

export const WATCH_CATALOG: Record<WatchOfferSku, WatchCatalogItem> = {
  aeo_full_audit: {
    unitAmountCents: 9900,
    mode: 'payment',
    nameEn: 'Sondri Full AEO / GEO Visibility Audit',
    nameEs: 'Auditoría Completa AEO / GEO Sondri',
    descEn: '12–15 unbranded buyer questions × 3 runs per engine (ChatGPT, Gemini, Google AI Overviews, Google AI Mode), accuracy check, and prioritized fix list.',
    descEs: '12 a 15 preguntas sin marca × 3 repeticiones por motor (ChatGPT, Gemini, Google AI Overviews, Google AI Mode), revisión de exactitud y lista de correcciones priorizadas.',
    runBaseline: true,
  },
  listings_sprint: {
    unitAmountCents: 24900,
    mode: 'payment',
    nameEn: 'AI Listings Sprint (ChatGPT, Bing, Apple & Google)',
    nameEs: 'AI Listings Sprint (ChatGPT, Bing, Apple y Google)',
    descEn: 'Done-for-you business verification & entity alignment across OpenAI Business Hub, Bing AI Performance, Apple Business Connect, and Google Business Profile.',
    descEs: 'Verificación y alineación de entidad en OpenAI Business Hub (ChatGPT), Bing AI Performance, Apple Business Connect y Perfil de Empresa en Google.',
    runBaseline: false,
  },
  clinicas_pack: {
    unitAmountCents: 34900,
    mode: 'payment',
    nameEn: 'Pack Clínicas Chile (Dental, Estética & Kine)',
    nameEs: 'Pack Clínicas Chile (Dental, Estética y Kine)',
    descEn: 'Vertical AI visibility audit, 30-prompt local treatment benchmark, Dentist/MedicalBusiness JSON-LD schema, and AI listings setup.',
    descEs: 'Auditoría vertical de visibilidad en IA, benchmark local de 30 preguntas, schema Dentist/MedicalBusiness JSON-LD y alta en directorios de IA.',
    runBaseline: true,
  },
  law_pack: {
    unitAmountCents: 49900,
    mode: 'payment',
    nameEn: 'Law Firm Pack (US & Chile)',
    nameEs: 'Pack Estudios Jurídicos (EE.UU. y Chile)',
    descEn: 'Practice-area AI visibility audit across ChatGPT, Gemini, AI Overviews & AI Mode + LegalService schema & citation gap roadmap.',
    descEs: 'Auditoría de visibilidad por área de práctica en ChatGPT, Gemini, AI Overviews y AI Mode + schema LegalService y plan de citas externas.',
    runBaseline: true,
  },
  shopify_check: {
    unitAmountCents: 49900,
    mode: 'payment',
    nameEn: 'Shopify Agentic Readiness Check',
    nameEs: 'Revisión Agentic Readiness para Shopify',
    descEn: 'Product catalog, Merchant/ACP & Google UCP agentic checkout readiness audit + structured Product/Offer schema fix roadmap.',
    descEs: 'Auditoría de catálogo, compatibilidad ACP (ChatGPT) / UCP (Google) y plan de corrección de schema Product/Offer.',
    runBaseline: true,
  },
  fix_sprint: {
    unitAmountCents: 49900,
    mode: 'payment',
    nameEn: 'Sondri Done-For-You Fix Sprint',
    nameEs: 'Sprint de Implementación Done-For-You Sondri',
    descEn: 'Done-for-you implementation of priority AEO fixes: Organization/LocalBusiness & FAQPage schema, service pages, and answer-ready FAQs.',
    descEs: 'Implementación llave en mano de correcciones AEO prioritarias: schema Organization/LocalBusiness y FAQPage, páginas de servicio y FAQs.',
    runBaseline: false,
  },
  agency_pilot_audit: {
    unitAmountCents: 14900,
    mode: 'payment',
    nameEn: 'Sondri Agency White-Label Audit (Wholesale)',
    nameEs: 'Auditoría Marca Blanca para Agencias (Mayorista)',
    descEn: 'Wholesale white-label 4-engine AEO audit ready to present and resell to your agency client.',
    descEs: 'Auditoría AEO marca blanca en 4 motores lista para entregar y revender a su cliente de agencia.',
    runBaseline: true,
  },
  agency_reaudit: {
    unitAmountCents: 9900,
    mode: 'payment',
    nameEn: 'Sondri Agency White-Label Re-Audit',
    nameEs: 'Re-Auditoría Marca Blanca para Agencias',
    descEn: 'Post-implementation verification re-audit comparing before/after AI visibility across 4 engines.',
    descEs: 'Re-auditoría de verificación post-implementación comparando visibilidad antes y después.',
    runBaseline: true,
  },
  portfolio_snapshot: {
    unitAmountCents: 150000,
    mode: 'payment',
    nameEn: 'Portfolio AI Answer Share Snapshot (Up to 10 Companies)',
    nameEs: 'Diagnóstico AI Answer Share para Portafolios (Hasta 10 Empresas)',
    descEn: 'Executive AEO visibility benchmark across up to 10 portfolio companies for PE operating partners and enterprise marketing leads.',
    descEs: 'Benchmark ejecutivo de visibilidad en IA para hasta 10 empresas del portafolio (PE Operating Partners y direcciones de marketing).',
    runBaseline: false,
  },
  watch_local: {
    unitAmountCents: 14900,
    mode: 'subscription',
    nameEn: 'Sondri Watch Local (Monthly Retainer)',
    nameEs: 'Sondri Watch Local (Suscripción Mensual)',
    descEn: '25 frozen buyer prompts, weekly runs across 4 engines, monthly Page + PDF report, competitor named-share, and 1 implemented fix/month.',
    descEs: '25 prompts fijos, corridas semanales en 4 motores, reporte mensual en web + PDF, cuota de competidores y 1 corrección implementada/mes.',
    runBaseline: true,
  },
  watch_commerce: {
    unitAmountCents: 29900,
    mode: 'subscription',
    nameEn: 'Sondri Watch Commerce (Monthly Retainer)',
    nameEs: 'Sondri Watch Commerce (Suscripción Mensual)',
    descEn: 'Weekly ecommerce & agentic checkout monitoring across 4 AI engines, product visibility tracking, monthly report, and 1 implemented fix/month.',
    descEs: 'Monitoreo semanal de ecommerce y visibilidad de productos en 4 motores de IA, reporte mensual y 1 corrección implementada/mes.',
    runBaseline: true,
  },
  watch_pro: {
    unitAmountCents: 39900,
    mode: 'subscription',
    nameEn: 'Sondri Watch Pro (Monthly Retainer)',
    nameEs: 'Sondri Watch Pro (Suscripción Mensual)',
    descEn: '75 frozen buyer prompts for B2B & multi-location brands, weekly 4-engine runs, monthly Page + PDF report, and 1 implemented fix/month.',
    descEs: '75 prompts fijos para marcas B2B o multi-sucursal, corridas semanales en 4 motores, reporte mensual y 1 corrección implementada/mes.',
    runBaseline: true,
  },
  watch_agency_client: {
    unitAmountCents: 7900,
    mode: 'subscription',
    nameEn: 'Sondri Agency White-Label Monitoring (Per Client / Mo)',
    nameEs: 'Monitoreo Marca Blanca para Agencias (Por Cliente / Mes)',
    descEn: 'Wholesale monthly AI visibility monitoring & white-label report feed for agency client accounts.',
    descEs: 'Monitoreo mensual mayorista y reporte marca blanca para cuentas de clientes de agencia.',
    runBaseline: true,
  },
  website_quick_fix: {
    unitAmountCents: 39000,
    mode: 'payment',
    nameEn: 'Sondri Answer-Ready Website Quick Fix',
    nameEs: 'Quick Fix Web Answer-Ready Sondri',
    descEn: 'Core Web Vitals speed tuning, robots.txt + llms.txt, validated Organization/LocalBusiness + FAQPage schema, and 1 answer-ready service block on your existing site.',
    descEs: 'Optimización de velocidad Core Web Vitals, robots.txt + llms.txt, schema Organization/LocalBusiness + FAQPage validado y 1 bloque de servicio citable en tu sitio actual.',
    runBaseline: false,
  },
  website_5page: {
    unitAmountCents: 69000,
    mode: 'payment',
    nameEn: 'Sondri 5-Page Answer-Ready Website',
    nameEs: 'Sitio Web Answer-Ready de 5 Páginas Sondri',
    descEn: 'Fast 5-page conversion & AEO-architected website (Home, Core Services, FAQ Hub, About/Credentials, Contact) with full JSON-LD schema and 95+ Lighthouse performance.',
    descEs: 'Sitio web rápido de 5 páginas orientado a conversión y AEO (Inicio, Servicios, Hub FAQ, Quiénes Somos, Contacto) con JSON-LD completo y 95+ en Lighthouse.',
    runBaseline: false,
  },
  website_10page: {
    unitAmountCents: 119000,
    mode: 'payment',
    nameEn: 'Sondri 10-Page Custom Growth & AEO Website',
    nameEs: 'Sitio Web de Crecimiento y AEO de 10 Páginas Sondri',
    descEn: '10-page custom-engineered website with dedicated service/practice-area pages, comparison blocks, bilingual/local schema graph, and OpenAI/Bing/GBP listing sync.',
    descEs: 'Sitio web de 10 páginas diseñado a medida con páginas dedicadas por servicio, comparativas, grafo JSON-LD local y sincronización OpenAI/Bing/GBP.',
    runBaseline: false,
  },
};

export async function handleCreateCheckoutSession(request: Request, env: Env): Promise<Response> {
  try {
    const body: CreateCheckoutSessionDTO = await request.json();
    const origin = request.headers.get('origin') || 'https://sondri.ai';

    const successUrl = body.success_url || `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancel_url || `${origin}/#pricing`;

    const stripe = getStripe(env);

    let lineItems: any[] = [];
    let mode: 'payment' | 'subscription' = 'payment';
    let resolvedSku: string = body.type;
    let resolvedDescription = body.description || 'Custom Sondri AI Payment / Deposit';
    let runBaseline = false;

    if (body.type === 'fixed') {
      const planKey = body.plan_id || 'starter';
      const plan = PLAN_PRICES[planKey];

      if (!plan) {
        return Response.json(
          { success: false, error: { code: 'INVALID_PLAN', message: 'Invalid plan_id selected' } },
          { status: 400 }
        );
      }

      mode = 'subscription';
      resolvedDescription = plan.name;
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: 'Monthly AI automation retainer & support.',
            },
            unit_amount: plan.amount * 100, // convert dollars to cents
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ];
    } else if (body.type === 'custom') {
      if (!body.custom_amount || body.custom_amount <= 0) {
        return Response.json(
          { success: false, error: { code: 'INVALID_AMOUNT', message: 'Must provide a valid positive custom_amount' } },
          { status: 400 }
        );
      }

      mode = 'payment';
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: body.description || 'Custom Sondri AI Services Deposit / Payment',
              description: 'Custom agreed payment for Sondri services.',
            },
            unit_amount: Math.round(body.custom_amount * 100), // convert to cents
          },
          quantity: 1,
        },
      ];
    } else if (body.type === 'aeo_full_audit' || body.type === 'watch_offer') {
      const sku: WatchOfferSku =
        body.type === 'aeo_full_audit' ? 'aeo_full_audit' : (body.offer_sku as WatchOfferSku);
      const item = sku ? WATCH_CATALOG[sku] : undefined;

      if (!item) {
        return Response.json(
          { success: false, error: { code: 'INVALID_OFFER_SKU', message: 'Unknown or missing watch offer_sku' } },
          { status: 400 }
        );
      }

      const targetDomain = (body.domain || '').trim();
      const isEs = body.lang === 'es';
      mode = item.mode;
      resolvedSku = sku;
      runBaseline = item.runBaseline;
      const baseTitle = isEs ? item.nameEs : item.nameEn;
      const titleWithDomain = targetDomain ? `${baseTitle} — ${targetDomain}` : baseTitle;
      resolvedDescription = `${titleWithDomain} ($${(item.unitAmountCents / 100).toFixed(0)}${mode === 'subscription' ? '/mo' : ''})`;

      const priceData: Record<string, any> = {
        currency: 'usd',
        product_data: {
          name: titleWithDomain,
          description: isEs ? item.descEs : item.descEn,
        },
        unit_amount: item.unitAmountCents,
      };
      if (mode === 'subscription') {
        priceData.recurring = { interval: 'month' };
      }

      lineItems = [{ price_data: priceData, quantity: 1 }];
    } else {
      return Response.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Type must be "fixed", "custom", "aeo_full_audit", or "watch_offer"' } },
        { status: 400 }
      );
    }

    const isWatchOrAudit = body.type === 'aeo_full_audit' || body.type === 'watch_offer';
    const sessionParams: any = {
      managed_payments: { enabled: false },
      line_items: lineItems,
      mode: mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        source: isWatchOrAudit ? (resolvedSku === 'aeo_full_audit' ? 'aeo_full_audit' : 'watch_offer') : 'website_checkout',
        offer_sku: resolvedSku,
        run_baseline: runBaseline ? 'true' : 'false',
        description: resolvedDescription,
        audit_id: body.audit_id || '',
        domain: body.domain || '',
        city: body.city || '',
        service: body.service || '',
        lang: body.lang || 'en',
      },
    };

    if (mode === 'payment') {
      sessionParams.invoice_creation = {
        enabled: true,
        invoice_data: {
          metadata: {
            is_checkout_invoice: 'true',
          },
        },
      };
    } else {
      sessionParams.subscription_data = {
        metadata: {
          offer_sku: resolvedSku,
          domain: body.domain || '',
          audit_id: body.audit_id || '',
        },
      };
    }

    if (body.client_email) {
      sessionParams.customer_email = body.client_email;
      if (mode === 'payment') {
        sessionParams.payment_intent_data = {
          receipt_email: body.client_email,
        };
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({
      success: true,
      data: {
        checkout_url: session.url,
        session_id: session.id,
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}

export async function handleGetCheckoutSession(request: Request, env: Env, sessionId: string): Promise<Response> {
  try {
    const stripe = getStripe(env);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['invoice', 'payment_intent.latest_charge'],
    });

    const invoiceObj = typeof session.invoice === 'object' && session.invoice ? (session.invoice as Stripe.Invoice) : null;
    const paymentIntentObj = typeof session.payment_intent === 'object' && session.payment_intent ? (session.payment_intent as Stripe.PaymentIntent) : null;
    const latestChargeObj = paymentIntentObj && typeof paymentIntentObj.latest_charge === 'object' ? (paymentIntentObj.latest_charge as Stripe.Charge) : null;

    return Response.json({
      success: true,
      data: {
        id: session.id,
        customer_email: session.customer_details?.email || session.customer_email,
        amount_total: session.amount_total,
        currency: session.currency,
        invoice_url: invoiceObj?.hosted_invoice_url || null,
        invoice_pdf: invoiceObj?.invoice_pdf || null,
        receipt_url: latestChargeObj?.receipt_url || null,
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}
