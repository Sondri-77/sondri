import { AuditLang, Env } from '../types';
import { hasValidApiKey } from '../lib/auth';
import {
  checkAndIncrementAiUsage,
  consumeDailyQuota,
  getAuditById,
  getCachedAuditByDomain,
  parseDailyCap,
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

function resolveClientIdentity(request: Request): { clientIp: string; isLocalDev: boolean } {
  const reqHost = new URL(request.url).hostname.toLowerCase();
  const isLocalHost = reqHost === 'localhost' || reqHost === '127.0.0.1';
  const cfIp = request.headers.get('CF-Connecting-IP')?.trim() || '';
  if (isLocalHost) {
    const isLocalLoopback = !cfIp || cfIp === '127.0.0.1' || cfIp === '::1';
    return { clientIp: cfIp || '127.0.0.1', isLocalDev: isLocalLoopback };
  }
  return { clientIp: cfIp || 'unknown', isLocalDev: false };
}

function toPublicAuditResponse(audit: StoredAudit): StoredAudit {
  return {
    ...audit,
    full_audit: null,
  };
}

export async function handleAuditScan(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const rawUrl = String(body.url || '').trim();
    const lang: AuditLang = body.lang === 'es' ? 'es' : 'en';
    const userCity = String(body.city || '').trim().slice(0, 120);
    const userService = String(body.service || '').trim().slice(0, 120);
    const forceRefresh = Boolean(body.force) && (await hasValidApiKey(request, env));

    let normalized;
    try {
      normalized = normalizeInputUrl(rawUrl);
    } catch (e: any) {
      return Response.json(
        { success: false, error: { code: 'INVALID_URL', message: e.message } },
        { status: 400 }
      );
    }

    // Check 7-day domain cache if user didn't pass custom overrides or authorized force refresh
    if (!forceRefresh && !userCity && !userService) {
      const cached = await getCachedAuditByDomain(env, normalized.domain, lang);
      if (cached && cached.tech_scan) {
        const now = new Date();
        const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const callerRecord: StoredAudit = {
          id: `aud_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
          domain: cached.domain,
          url: cached.url,
          lang: cached.lang,
          city: cached.city,
          service: cached.service,
          tech_scan: { ...cached.tech_scan },
          lighthouse: cached.lighthouse,
          questions: [...(cached.questions || [])],
          ai_visibility: null,
          full_audit: null,
          created_at: now.toISOString(),
          expires_at: expires.toISOString(),
        };
        await saveAuditStep1(env, callerRecord);
        return Response.json({
          success: true,
          data: { ...toPublicAuditResponse(callerRecord), cached: true },
        });
      }
    }

    const { clientIp, isLocalDev } = resolveClientIdentity(request);
    const ipHash = await hashIp(clientIp);
    const dailyAuditCap = parseDailyCap(env.DAILY_AUDIT_CAP, 50);
    const scanDailyCap = dailyAuditCap === 0 ? 0 : dailyAuditCap * 3;
    const scanQuota = await consumeDailyQuota(env, {
      globalScope: 'global_scan_runs',
      ipScope: `scan_ip:${ipHash}`,
      maxPerIpPerDay: isLocalDev ? 1000 : 20,
      globalDailyCap: scanDailyCap,
    });
    if (!scanQuota.allowed) {
      return Response.json(
        {
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Daily scan limit reached. Please try again tomorrow.' },
        },
        { status: 429 }
      );
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
    if (userCity || userService) {
      techScan.customInput = true;
    }

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
      data: { ...toPublicAuditResponse(record), cached: false },
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

    const checkLighthouseQuota = async (): Promise<Response | null> => {
      const { clientIp, isLocalDev } = resolveClientIdentity(request);
      const ipHash = await hashIp(clientIp);
      const dailyAuditCap = parseDailyCap(env.DAILY_AUDIT_CAP, 50);
      const lhDailyCap = dailyAuditCap === 0 ? 0 : dailyAuditCap * 3;
      const quota = await consumeDailyQuota(env, {
        globalScope: 'global_lighthouse_runs',
        ipScope: `lh_ip:${ipHash}`,
        maxPerIpPerDay: isLocalDev ? 1000 : 20,
        globalDailyCap: lhDailyCap,
      });
      if (!quota.allowed) {
        return Response.json(
          {
            success: false,
            error: { code: 'RATE_LIMITED', message: 'Daily PageSpeed check limit reached.' },
          },
          { status: 429 }
        );
      }
      return null;
    };

    if (auditId) {
      const existing = await getAuditById(env, auditId);
      if (existing?.lighthouse && existing.lighthouse.performanceScore !== null) {
        return Response.json({ success: true, data: existing.lighthouse });
      }
      const rawTargetUrl = existing?.url || rawUrl;
      if (!rawTargetUrl) {
        return Response.json(
          { success: false, error: { code: 'MISSING_URL', message: 'Missing target URL' } },
          { status: 400 }
        );
      }
      let normalized;
      try {
        normalized = normalizeInputUrl(rawTargetUrl);
      } catch (e: any) {
        return Response.json(
          { success: false, error: { code: 'INVALID_URL', message: e.message } },
          { status: 400 }
        );
      }
      const quotaErr = await checkLighthouseQuota();
      if (quotaErr) return quotaErr;

      const lh = await fetchLighthouseResult(normalized.url, env.PAGESPEED_API_KEY);
      await updateAuditLighthouse(env, auditId, lh);
      return Response.json({ success: true, data: lh });
    }

    let normalized;
    try {
      normalized = normalizeInputUrl(rawUrl);
    } catch (e: any) {
      return Response.json(
        { success: false, error: { code: 'INVALID_URL', message: e.message } },
        { status: 400 }
      );
    }
    const quotaErr = await checkLighthouseQuota();
    if (quotaErr) return quotaErr;

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
    const customCity = String(body.city || '').trim().slice(0, 120);
    const customService = String(body.service || '').trim().slice(0, 120);
    const customQuestions: string[] = Array.isArray(body.questions)
      ? body.questions
          .map((q: any) => String(q || '').trim().slice(0, 240))
          .filter(Boolean)
          .slice(0, 3)
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

    const { clientIp, isLocalDev } = resolveClientIdentity(request);

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
    const isCustomized =
      Boolean(audit.tech_scan.customInput) ||
      (Boolean(customCity) && customCity !== audit.city) ||
      (Boolean(customService) && customService !== audit.service) ||
      (customQuestions.length > 0 &&
        JSON.stringify(customQuestions) !== JSON.stringify(audit.questions));

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

    const captureLead = async () => {
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
    };

    // 1. If this audit already has valid AI visibility results and questions match, return cached ($0)
    const questionsUnchanged =
      JSON.stringify(finalQuestions) === JSON.stringify(audit.questions);
    const hasValidAiRuns =
      audit.ai_visibility &&
      !audit.ai_visibility.circuitBreakerTripped &&
      Array.isArray(audit.ai_visibility.runs) &&
      audit.ai_visibility.runs.length > 0 &&
      audit.ai_visibility.runs.every((r) => r.status === 'ok');
    if (hasValidAiRuns && questionsUnchanged) {
      const leadQuota = await consumeDailyQuota(env, {
        globalScope: 'global_lead_writes',
        ipScope: `lead_ip:${ipHash}`,
        maxPerIpPerDay: isLocalDev ? 1000 : 15,
        globalDailyCap: 1000,
      });
      if (!leadQuota.allowed) {
        return Response.json(
          {
            success: false,
            error: { code: 'RATE_LIMITED', message: 'Daily audit submission limit reached.' },
          },
          { status: 429 }
        );
      }
      await captureLead();
      audit.tech_scan.readinessScore = computeCombinedAiScore(
        audit.tech_scan.readinessScore,
        audit.ai_visibility
      );
      fireLeadNotifications(audit.ai_visibility);
      return Response.json({
        success: true,
        data: { ...toPublicAuditResponse(audit), cached: true },
      });
    }

    // 2. Check domain-level cache in D1 for identical default-market prompt sets ($0)
    const domainCached = !isCustomized
      ? await getCachedAuditByDomain(env, audit.domain, audit.lang)
      : null;
    if (
      domainCached &&
      domainCached.ai_visibility &&
      domainCached.service === finalService &&
      domainCached.city === finalCity &&
      JSON.stringify(domainCached.questions) === JSON.stringify(finalQuestions)
    ) {
      const leadQuota = await consumeDailyQuota(env, {
        globalScope: 'global_lead_writes',
        ipScope: `lead_ip:${ipHash}`,
        maxPerIpPerDay: isLocalDev ? 1000 : 15,
        globalDailyCap: 1000,
      });
      if (!leadQuota.allowed) {
        return Response.json(
          {
            success: false,
            error: { code: 'RATE_LIMITED', message: 'Daily audit submission limit reached.' },
          },
          { status: 429 }
        );
      }
      await captureLead();
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
        data: { ...toPublicAuditResponse(audit), cached: true },
      });
    }

    // 3. Enforce per-IP rate limit and daily circuit breaker BEFORE writing D1 leads or firing webhooks
    const usageCheck = await checkAndIncrementAiUsage(env, ipHash, isLocalDev ? 1000 : 30);
    if (!usageCheck.allowed) {
      if (usageCheck.reason === 'ip_rate_limit') {
        return Response.json(
          {
            success: false,
            error: { code: 'RATE_LIMITED', message: 'Daily audit rate limit reached.' },
          },
          { status: 429 }
        );
      }

      const queuedQuota = await consumeDailyQuota(env, {
        globalScope: 'global_queued_leads',
        ipScope: `queued_lead_ip:${ipHash}`,
        maxPerIpPerDay: isLocalDev ? 1000 : 3,
        globalDailyCap: 500,
      });
      if (!queuedQuota.allowed) {
        return Response.json(
          {
            success: false,
            error: { code: 'RATE_LIMITED', message: 'Daily queued submission limit reached.' },
          },
          { status: 429 }
        );
      }

      await captureLead();
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
          ...toPublicAuditResponse(audit),
          city: finalCity,
          service: finalService,
          questions: finalQuestions,
          ai_visibility: fallbackVisibility,
          rateLimitedReason: usageCheck.reason,
        },
      });
    }

    // 4. Record lead and run live Gemini grounded visibility check
    await captureLead();
    const aiVisibility = await runGeminiGroundedVisibility(
      finalQuestions,
      audit.tech_scan,
      audit.lang,
      env.GEMINI_API_KEY
    );
    if (isCustomized) {
      aiVisibility.customInput = true;
    }

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

    audit.questions = finalQuestions;
    audit.city = finalCity;
    audit.service = finalService;
    audit.ai_visibility = aiVisibility;

    fireLeadNotifications(aiVisibility);

    return Response.json({
      success: true,
      data: { ...toPublicAuditResponse(audit), cached: false },
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
  if (!audit || audit.expires_at <= new Date().toISOString()) {
    return Response.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Audit not found' } },
      { status: 404 }
    );
  }
  return Response.json({ success: true, data: toPublicAuditResponse(audit) });
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
