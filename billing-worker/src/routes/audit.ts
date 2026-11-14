import { AuditLang, Env } from '../types';
import {
  checkAndIncrementAiUsage,
  getAuditById,
  getCachedAuditByDomain,
  recordLead,
  saveAuditStep1,
  StoredAudit,
  updateAuditAiVisibility,
  updateAuditFullBaseline,
  updateAuditLighthouse,
} from '../lib/db';
import { fetchLighthouseResult, normalizeInputUrl, runTechnicalScan } from '../lib/scanner';
import {
  inferContextAndBuyerQuestions,
  runGeminiGroundedVisibility,
} from '../lib/gemini';
import { sendDiscordNotification } from '../lib/discord';
import { appendToGoogleSheet } from '../lib/sheets';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com',
]);

function isValidWorkOrPersonalEmail(email: string): boolean {
  const clean = (email || '').trim().toLowerCase();
  const m = clean.match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);
  if (!m) return false;
  const domain = m[1];
  if (DISPOSABLE_DOMAINS.has(domain)) return false;
  return true;
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`sondri-aeo-salt:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyTurnstile(token: string | undefined, secret: string, ip: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    });
    if (!res.ok) return false;
    const data: any = await res.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function handleAuditScan(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const rawUrl = String(body.url || '').trim();
    const lang: AuditLang = body.lang === 'es' ? 'es' : 'en';
    const userCity = String(body.city || '').trim();
    const userService = String(body.service || '').trim();
    const forceRefresh = Boolean(body.force);

    let normalized;
    try {
      normalized = normalizeInputUrl(rawUrl);
    } catch (e: any) {
      return Response.json(
        { success: false, error: { code: 'INVALID_URL', message: e.message } },
        { status: 400 }
      );
    }

    // Check 7-day domain cache if user didn't pass custom overrides or force refresh
    if (!forceRefresh && !userCity && !userService) {
      const cached = await getCachedAuditByDomain(env, normalized.domain, lang);
      if (cached && cached.tech_scan) {
        return Response.json({
          success: true,
          data: { ...cached, cached: true },
        });
      }
    }

    const techScan = await runTechnicalScan(normalized.url, lang, userCity, userService);
    const inferred = await inferContextAndBuyerQuestions(
      techScan,
      lang,
      userCity,
      userService,
      env.GEMINI_API_KEY,
      3
    );

    techScan.inferredCity = inferred.city;
    techScan.inferredService = inferred.service;

    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const record: StoredAudit = {
      id: `aud_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
      domain: normalized.domain,
      url: normalized.url,
      lang,
      city: inferred.city,
      service: inferred.service,
      tech_scan: techScan,
      lighthouse: null,
      questions: inferred.questions,
      ai_visibility: null,
      full_audit: null,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };

    await saveAuditStep1(env, record);

    return Response.json({
      success: true,
      data: { ...record, cached: false },
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'SCAN_ERROR',
          message: err.message || 'Unable to scan website',
        },
      },
      { status: 500 }
    );
  }
}

export async function handleAuditLighthouse(request: Request, env: Env): Promise<Response> {
  try {
    const urlObj = new URL(request.url);
    const auditId = urlObj.searchParams.get('audit_id') || '';
    const rawUrl = urlObj.searchParams.get('url') || '';

    if (auditId) {
      const existing = await getAuditById(env, auditId);
      if (existing?.lighthouse && existing.lighthouse.performanceScore !== null) {
        return Response.json({ success: true, data: existing.lighthouse });
      }
      const targetUrl = existing?.url || rawUrl;
      if (!targetUrl) {
        return Response.json(
          { success: false, error: { code: 'MISSING_URL', message: 'Missing target URL' } },
          { status: 400 }
        );
      }
      const lh = await fetchLighthouseResult(targetUrl, env.PAGESPEED_API_KEY);
      await updateAuditLighthouse(env, auditId, lh);
      return Response.json({ success: true, data: lh });
    }

    const normalized = normalizeInputUrl(rawUrl);
    const lh = await fetchLighthouseResult(normalized.url, env.PAGESPEED_API_KEY);
    return Response.json({ success: true, data: lh });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: { code: 'LIGHTHOUSE_ERROR', message: err.message || 'Lighthouse check failed' },
      },
      { status: 500 }
    );
  }
}

export async function handleAuditAiVisibility(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const body: any = await request.json();
    const auditId = String(body.audit_id || '').trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const customCity = String(body.city || '').trim();
    const customService = String(body.service || '').trim();
    const customQuestions: string[] = Array.isArray(body.questions)
      ? body.questions
          .map((q: any) => String(q || '').trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    if (!auditId) {
      return Response.json(
        { success: false, error: { code: 'MISSING_AUDIT_ID', message: 'Missing audit_id' } },
        { status: 400 }
      );
    }

    if (!isValidWorkOrPersonalEmail(email)) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please enter a valid non-disposable email address.',
          },
        },
        { status: 400 }
      );
    }

    const clientIp =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      '0.0.0.0';

    if (env.TURNSTILE_SECRET_KEY) {
      const ok = await verifyTurnstile(body.turnstile_token, env.TURNSTILE_SECRET_KEY, clientIp);
      if (!ok) {
        return Response.json(
          {
            success: false,
            error: { code: 'TURNSTILE_FAILED', message: 'Bot verification failed. Please retry.' },
          },
          { status: 403 }
        );
      }
    }

    const audit = await getAuditById(env, auditId);
    if (!audit || !audit.tech_scan) {
      return Response.json(
        {
          success: false,
          error: { code: 'AUDIT_NOT_FOUND', message: 'Audit session expired or not found.' },
        },
        { status: 404 }
      );
    }

    const ipHash = await hashIp(clientIp);
    const finalCity = customCity || audit.city;
    const finalService = customService || audit.service;
    const finalQuestions =
      customQuestions.length > 0 ? customQuestions : audit.questions.slice(0, 3);

    // 1. Always capture the lead in D1
    const leadId = `lead_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;
    await recordLead(env, {
      id: leadId,
      name,
      email,
      phone,
      domain: audit.domain,
      city: finalCity,
      service: finalService,
      lang: audit.lang,
      auditId: audit.id,
      ipHash,
    });

    const computeCombinedAiScore = (baseTechScore: number, vis: any): number => {
      // Base technical readiness is capped at 45 pts; live AI visibility contributes up to 55 pts
      const techPart = Math.min(45, baseTechScore);
      if (!vis) return techPart;
      const namedPts = Math.min(45, (vis.namedCount || 0) * 15);
      const citedPts = Math.min(10, (vis.citedCount || 0) * 5);
      return Math.min(100, techPart + namedPts + citedPts);
    };

    const fireLeadNotifications = (vis: any) => {
      const combinedScore = computeCombinedAiScore(audit.tech_scan!.readinessScore, vis);
      const mentionsStr = vis ? `${vis.namedCount}/${vis.totalQuestions}` : 'Pending';
      const compsStr =
        vis && Array.isArray(vis.competitorsSummary) && vis.competitorsSummary.length > 0
          ? vis.competitorsSummary.slice(0, 5).join(', ')
          : 'None';

      ctx.waitUntil(
        Promise.allSettled([
          sendDiscordNotification(
            env,
            '🔍 New AEO Mini Audit Lead!',
            `**Name:** ${name || 'N/A'}\n**Email:** ${email}\n**Phone:** ${phone || 'N/A'}\n**Domain:** \`${audit.domain}\`\n**Service / Market:** ${finalService} (${finalCity})\n**Combined AI Score:** ${combinedScore}/100 (AI Mentions: ${mentionsStr})\n**Competitors Named:** ${compsStr}\n**Language:** ${audit.lang.toUpperCase()}`,
            0x3b82f6,
            env.DISCORD_AEO_WEBHOOK_URL || env.DISCORD_WEBHOOK_URL,
            'Sondri AEO Audit Bot'
          ),
          appendToGoogleSheet(env, {
            date: new Date().toISOString().split('T')[0],
            clientEmail: email,
            customerName: name
              ? `${name}${phone ? ` (${phone})` : ''} — ${audit.domain}`
              : audit.tech_scan!.detectedBrand || audit.domain,
            amount: '0.00',
            currency: 'USD',
            invoiceNumber: audit.id,
            description: `Free AEO Mini Audit (${audit.domain} - Score ${combinedScore}/100, Mentions ${mentionsStr})`,
            status: 'LEAD (Mini Audit)',
          }),
        ])
      );
    };

    // 2. If this audit already has AI visibility results and questions match, return cached ($0)
    const questionsUnchanged =
      JSON.stringify(finalQuestions) === JSON.stringify(audit.questions);
    if (audit.ai_visibility && questionsUnchanged) {
      audit.tech_scan.readinessScore = computeCombinedAiScore(
        audit.tech_scan.readinessScore,
        audit.ai_visibility
      );
      fireLeadNotifications(audit.ai_visibility);
      return Response.json({
        success: true,
        data: { ...audit, cached: true },
      });
    }

    // 3. Check domain-level cache in D1 for identical questions ($0)
    const domainCached = await getCachedAuditByDomain(env, audit.domain, audit.lang);
    if (
      domainCached &&
      domainCached.ai_visibility &&
      JSON.stringify(domainCached.questions) === JSON.stringify(finalQuestions)
    ) {
      await updateAuditAiVisibility(
        env,
        audit.id,
        finalQuestions,
        domainCached.ai_visibility,
        finalCity,
        finalService
      );
      audit.ai_visibility = domainCached.ai_visibility;
      audit.questions = finalQuestions;
      audit.tech_scan.readinessScore = computeCombinedAiScore(
        audit.tech_scan.readinessScore,
        audit.ai_visibility
      );
      fireLeadNotifications(audit.ai_visibility);
      return Response.json({
        success: true,
        data: { ...audit, cached: true },
      });
    }

    // 4. Enforce per-IP rate limit and daily circuit breaker before calling paid AI APIs
    const usageCheck = await checkAndIncrementAiUsage(env, ipHash, 3);
    if (!usageCheck.allowed) {
      const fallbackVisibility = {
        ranAt: new Date().toISOString(),
        engine: 'gemini' as const,
        totalQuestions: finalQuestions.length,
        namedCount: 0,
        citedCount: 0,
        competitorsSummary: [],
        topSourceDomains: [],
        runs: finalQuestions.map((question) => ({
          question,
          engine: 'gemini' as const,
          status: 'not_run' as const,
          brandNamed: false,
          domainCited: false,
          competitorsNamed: [],
          sourcesCited: [],
          answerExcerpt:
            audit.lang === 'es'
              ? 'En cola — hemos registrado tu correo para enviarte la verificación completa.'
              : 'Queued — we have logged your email to send your live verification.',
        })),
        enginesNotRun: [
          'ChatGPT (3x runs in Full $99 Audit)',
          'Google AI Overviews (3x runs in Full $99 Audit)',
          'Google AI Mode (3x runs in Full $99 Audit)',
        ],
        circuitBreakerTripped: true,
      };

      fireLeadNotifications(null);
      return Response.json({
        success: true,
        data: {
          ...audit,
          city: finalCity,
          service: finalService,
          questions: finalQuestions,
          ai_visibility: fallbackVisibility,
          rateLimitedReason: usageCheck.reason,
        },
      });
    }

    // 5. Run live Gemini grounded visibility check
    const aiVisibility = await runGeminiGroundedVisibility(
      finalQuestions,
      audit.tech_scan,
      audit.lang,
      env.GEMINI_API_KEY
    );

    audit.tech_scan.readinessScore = computeCombinedAiScore(
      audit.tech_scan.readinessScore,
      aiVisibility
    );

    await updateAuditAiVisibility(
      env,
      audit.id,
      finalQuestions,
      aiVisibility,
      finalCity,
      finalService
    );
    await saveAuditStep1(env, {
      ...audit,
      city: finalCity,
      service: finalService,
      questions: finalQuestions,
      ai_visibility: aiVisibility,
    });

    audit.questions = finalQuestions;
    audit.city = finalCity;
    audit.service = finalService;
    audit.ai_visibility = aiVisibility;

    fireLeadNotifications(aiVisibility);

    return Response.json({
      success: true,
      data: { ...audit, cached: false },
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'AI_VISIBILITY_ERROR',
          message: err.message || 'Unable to run AI visibility check',
        },
      },
      { status: 500 }
    );
  }
}

export async function handleGetAudit(
  _request: Request,
  env: Env,
  auditId: string
): Promise<Response> {
  const audit = await getAuditById(env, auditId);
  if (!audit) {
    return Response.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Audit not found' } },
      { status: 404 }
    );
  }
  return Response.json({ success: true, data: audit });
}

export async function runBackgroundFullAuditBaseline(
  env: Env,
  auditId: string,
  customerEmail: string
): Promise<void> {
  try {
    const audit = await getAuditById(env, auditId);
    if (!audit || !audit.tech_scan) return;

    const expanded = await inferContextAndBuyerQuestions(
      audit.tech_scan,
      audit.lang,
      audit.city,
      audit.service,
      env.GEMINI_API_KEY,
      12
    );

    const fullBaseline = await runGeminiGroundedVisibility(
      expanded.questions,
      audit.tech_scan,
      audit.lang,
      env.GEMINI_API_KEY
    );

    await updateAuditFullBaseline(env, audit.id, fullBaseline);

    await sendDiscordNotification(
      env,
      '📊 $99 Full Audit — 12-Question Gemini Baseline Ready',
      `**Domain:** \`${audit.domain}\`\n**Client:** ${customerEmail}\n**Audit ID:** \`${audit.id}\`\n**Gemini Grounded Mentions:** ${fullBaseline.namedCount}/${fullBaseline.totalQuestions}\n**Domain Citations:** ${fullBaseline.citedCount}/${fullBaseline.totalQuestions}\n**Competitors Found:** ${fullBaseline.competitorsSummary.join(', ') || 'None'}\n**Top Cited Sources:** ${fullBaseline.topSourceDomains.join(', ') || 'None'}`,
      0x10b981
    );
  } catch (err) {
    console.error('[Background Full Audit Error]', err);
  }
}
