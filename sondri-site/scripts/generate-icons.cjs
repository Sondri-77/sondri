const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const SONDRI_SITE_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(SONDRI_SITE_DIR, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'brand-icons');
const SONDRI_PUBLIC_DIR = path.join(SONDRI_SITE_DIR, 'public');

// Colors
const COLOR_INK = '#081f1f';
const COLOR_SLATE = '#174040';
const COLOR_BONE = '#e6f2f0';
const COLOR_GOLD = '#fdb343';
const COLOR_GOLD_DARK = '#f5a71e';
const COLOR_LIGHT_BG = '#f7fbfb';
const COLOR_LIGHT_BORDER = '#d5e5e3';

// 1. Soft-corner continuous Squircle & Variants (512x512)
const SVG_TEMPLATES = {
  'soft-squircle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect x="2" y="2" width="508" height="508" rx="116" fill="${COLOR_INK}"/>
  <rect x="10" y="10" width="492" height="492" rx="108" fill="none" stroke="${COLOR_SLATE}" stroke-width="12"/>
  <path d="M 138.24 389.12 A 250.88 250.88 0 0 1 389.12 138.24" fill="none" stroke="${COLOR_BONE}" stroke-width="30.72" stroke-linecap="round"/>
  <circle cx="312.32" cy="312.32" r="48.64" fill="${COLOR_GOLD}"/>
</svg>`,

  'dark-circle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="256" fill="${COLOR_INK}"/>
  <circle cx="256" cy="256" r="250" fill="none" stroke="${COLOR_SLATE}" stroke-width="8"/>
  <path d="M 148 364 A 230 230 0 0 1 364 148" fill="none" stroke="${COLOR_BONE}" stroke-width="28" stroke-linecap="round"/>
  <circle cx="298" cy="298" r="44" fill="${COLOR_GOLD}"/>
</svg>`,

  'dark-square': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${COLOR_INK}"/>
  <path d="M 138.24 389.12 A 250.88 250.88 0 0 1 389.12 138.24" fill="none" stroke="${COLOR_BONE}" stroke-width="30.72" stroke-linecap="round"/>
  <circle cx="312.32" cy="312.32" r="48.64" fill="${COLOR_GOLD}"/>
</svg>`,

  'transparent-bone': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path d="M 138.24 389.12 A 250.88 250.88 0 0 1 389.12 138.24" fill="none" stroke="${COLOR_BONE}" stroke-width="30.72" stroke-linecap="round"/>
  <circle cx="312.32" cy="312.32" r="48.64" fill="${COLOR_GOLD}"/>
</svg>`,

  'transparent-dark': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path d="M 138.24 389.12 A 250.88 250.88 0 0 1 389.12 138.24" fill="none" stroke="${COLOR_INK}" stroke-width="30.72" stroke-linecap="round"/>
  <circle cx="312.32" cy="312.32" r="48.64" fill="${COLOR_GOLD_DARK}"/>
</svg>`,

  'light-soft-squircle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect x="2" y="2" width="508" height="508" rx="116" fill="${COLOR_LIGHT_BG}"/>
  <rect x="10" y="10" width="492" height="492" rx="108" fill="none" stroke="${COLOR_LIGHT_BORDER}" stroke-width="12"/>
  <path d="M 138.24 389.12 A 250.88 250.88 0 0 1 389.12 138.24" fill="none" stroke="${COLOR_INK}" stroke-width="30.72" stroke-linecap="round"/>
  <circle cx="312.32" cy="312.32" r="48.64" fill="${COLOR_GOLD_DARK}"/>
</svg>`,

  'light-circle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="256" fill="${COLOR_LIGHT_BG}"/>
  <circle cx="256" cy="256" r="250" fill="none" stroke="${COLOR_LIGHT_BORDER}" stroke-width="8"/>
  <path d="M 148 364 A 230 230 0 0 1 364 148" fill="none" stroke="${COLOR_INK}" stroke-width="28" stroke-linecap="round"/>
  <circle cx="298" cy="298" r="44" fill="${COLOR_GOLD_DARK}"/>
</svg>`
};

const ALL_SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 256, 320, 512, 1024, 2048];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function createIco(pngBuffers, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  let offset = 6 + (16 * pngBuffers.length);
  const dirEntries = [];
  
  for (let i = 0; i < pngBuffers.length; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

// Helper to create a soft-corner card
async function createSoftCard(imageBuffer, padRatioX = 0.16, padRatioY = 0.35, isLight = false, isPill = false) {
  const meta = await sharp(imageBuffer).metadata();
  const padX = Math.round(meta.width * padRatioX);
  const padY = Math.round(meta.height * padRatioY);
  const cardW = meta.width + padX * 2;
  const cardH = meta.height + padY * 2;
  const rx = isPill ? Math.round(cardH / 2) : Math.round(cardH * 0.22);
  const bg = isLight ? COLOR_LIGHT_BG : COLOR_INK;
  const border = isLight ? COLOR_LIGHT_BORDER : COLOR_SLATE;
  const strokeW = Math.max(2, Math.round(cardH * 0.015));

  const cardSvg = Buffer.from(`
    <svg width="${cardW}" height="${cardH}">
      <rect x="${strokeW/2}" y="${strokeW/2}" width="${cardW - strokeW}" height="${cardH - strokeW}" rx="${rx}" fill="${bg}" />
      <rect x="${strokeW}" y="${strokeW}" width="${cardW - strokeW*2}" height="${cardH - strokeW*2}" rx="${rx - strokeW/2}" fill="none" stroke="${border}" stroke-width="${strokeW}" />
    </svg>
  `);

  return sharp(cardSvg)
    .composite([{ input: imageBuffer, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function generateAll() {
  console.log('Generating complete Sondri Brand Suite with Soft Corners throughout...');
  ensureDir(OUTPUT_DIR);

  // ── 1. VECTOR SVGs ──────────────────────────────────────────────────────────
  const svgDir = path.join(OUTPUT_DIR, 'vector-svg');
  ensureDir(svgDir);
  for (const [variant, svgContent] of Object.entries(SVG_TEMPLATES)) {
    fs.writeFileSync(path.join(svgDir, `sondri-icon-${variant}.svg`), svgContent.trim());
  }

  // ── 2. MASTER PNG ICONS (All resolutions) ───────────────────────────────────
  const masterDir = path.join(OUTPUT_DIR, 'master-png');
  ensureDir(masterDir);

  for (const [variant, svgContent] of Object.entries(SVG_TEMPLATES)) {
    const variantDir = path.join(masterDir, variant);
    ensureDir(variantDir);
    const svgBuffer = Buffer.from(svgContent);

    for (const size of ALL_SIZES) {
      const outPath = path.join(variantDir, `sondri-icon-${variant}-${size}x${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toFile(outPath);
    }
  }

  // ── 3. GOOGLE WORKSPACE SPECIFIC ASSETS (SOFT CORNERS) ──────────────────────
  const gwDir = path.join(OUTPUT_DIR, 'google-workspace');
  ensureDir(gwDir);

  // Soft squircle Admin Console Logos
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(512, 512).png().toFile(path.join(gwDir, 'google-workspace-admin-logo-512x512.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(320, 320).png().toFile(path.join(gwDir, 'google-workspace-admin-logo-320x320.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['light-soft-squircle'])).resize(320, 320).png().toFile(path.join(gwDir, 'google-workspace-admin-logo-light-320x320.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['dark-square'])).resize(512, 512).png().toFile(path.join(gwDir, 'google-workspace-square-logo-512x512.png'));

  // Circular Profile & Gmail Avatars
  await sharp(Buffer.from(SVG_TEMPLATES['dark-circle'])).resize(1024, 1024).png().toFile(path.join(gwDir, 'google-account-avatar-circle-1024x1024.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['dark-circle'])).resize(512, 512).png().toFile(path.join(gwDir, 'google-account-avatar-circle-512x512.png'));

  // Wide Header with Soft Corners (320x132 & 640x264)
  const lockupSourcePath = path.join(SONDRI_PUBLIC_DIR, 'brand', 'lockup.png');
  if (fs.existsSync(lockupSourcePath)) {
    // 320x132 Soft Header
    const lockupBuf320 = await sharp(lockupSourcePath).resize({ width: 250, height: 75, fit: 'inside' }).toBuffer();
    const bgSvg320 = Buffer.from(`
      <svg width="320" height="132">
        <rect x="2" y="2" width="316" height="128" rx="22" fill="${COLOR_INK}" />
        <rect x="4" y="4" width="312" height="124" rx="20" fill="none" stroke="${COLOR_SLATE}" stroke-width="2.5" />
      </svg>
    `);
    await sharp(bgSvg320)
      .composite([{ input: lockupBuf320, gravity: 'center' }])
      .png()
      .toFile(path.join(gwDir, 'google-workspace-wide-header-soft-320x132.png'));

    // 640x264 Retina Soft Header
    const lockupBuf640 = await sharp(lockupSourcePath).resize({ width: 500, height: 150, fit: 'inside' }).toBuffer();
    const bgSvg640 = Buffer.from(`
      <svg width="640" height="264">
        <rect x="3" y="3" width="634" height="258" rx="44" fill="${COLOR_INK}" />
        <rect x="6" y="6" width="628" height="252" rx="40" fill="none" stroke="${COLOR_SLATE}" stroke-width="5" />
      </svg>
    `);
    await sharp(bgSvg640)
      .composite([{ input: lockupBuf640, gravity: 'center' }])
      .png()
      .toFile(path.join(gwDir, 'google-workspace-wide-header-soft-640x264.png'));
    
    // Transparent Wide Header
    await sharp(lockupSourcePath)
      .resize({ width: 320, height: 132, fit: 'inside' })
      .png()
      .toFile(path.join(gwDir, 'google-workspace-wide-header-transparent-320x132.png'));
  }

  // Google Cloud / OAuth Consent & Marketplace
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(128, 128).png().toFile(path.join(gwDir, 'google-oauth-128x128.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(512, 512).png().toFile(path.join(gwDir, 'google-oauth-512x512.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(120, 120).png().toFile(path.join(gwDir, 'google-marketplace-120x120.png'));

  // ── 4. SOCIAL & PROFILE AVATARS ─────────────────────────────────────────────
  const socialDir = path.join(OUTPUT_DIR, 'social-and-profiles');
  ensureDir(socialDir);

  const socialSizes = [256, 512, 1024];
  for (const s of socialSizes) {
    await sharp(Buffer.from(SVG_TEMPLATES['dark-circle'])).resize(s, s).png().toFile(path.join(socialDir, `circle-avatar-${s}x${s}.png`));
    await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(s, s).png().toFile(path.join(socialDir, `squircle-avatar-${s}x${s}.png`));
    await sharp(Buffer.from(SVG_TEMPLATES['dark-square'])).resize(s, s).png().toFile(path.join(socialDir, `square-avatar-${s}x${s}.png`));
  }

  // ── 5. NAME LOGO & WORDMARKS (SOFT CORNER CARDS, PILLS & TRANSPARENT) ───────
  const wordmarkDir = path.join(OUTPUT_DIR, 'name-logo-and-wordmarks');
  ensureDir(wordmarkDir);

  const wordmarkSource = path.join(SONDRI_PUBLIC_DIR, 'brand', 'lockup-wordmark.png');
  if (fs.existsSync(wordmarkSource)) {
    const wmSizes = [
      { name: '2400w', width: 2400 },
      { name: '1200w', width: 1200 },
      { name: '600w', width: 600 },
      { name: '300w', width: 300 }
    ];

    for (const { name, width } of wmSizes) {
      // 1. Transparent Wordmark
      await sharp(wordmarkSource)
        .resize({ width, withoutEnlargement: false })
        .png()
        .toFile(path.join(wordmarkDir, `sondri-wordmark-transparent-${name}.png`));

      const wmBuf = await sharp(wordmarkSource).resize({ width, withoutEnlargement: false }).toBuffer();

      // 2. Soft-Corner Rounded Card
      const softCardBuf = await createSoftCard(wmBuf, 0.18, 0.45, false, false);
      fs.writeFileSync(path.join(wordmarkDir, `sondri-wordmark-soft-card-${name}.png`), softCardBuf);

      // 3. Soft Pill Badge
      const pillCardBuf = await createSoftCard(wmBuf, 0.22, 0.45, false, true);
      fs.writeFileSync(path.join(wordmarkDir, `sondri-wordmark-pill-badge-${name}.png`), pillCardBuf);

      // 4. Light Theme Soft Card
      const lightCardBuf = await createSoftCard(wmBuf, 0.18, 0.45, true, false);
      fs.writeFileSync(path.join(wordmarkDir, `sondri-wordmark-light-soft-card-${name}.png`), lightCardBuf);
    }
  }

  // ── 6. FULL BRAND LOCKUPS (SOFT CORNER CARDS & HEADERS) ─────────────────────
  const lockupDir = path.join(OUTPUT_DIR, 'full-brand-lockups');
  ensureDir(lockupDir);

  if (fs.existsSync(lockupSourcePath)) {
    const lockupSizes = [
      { name: '2400w', width: 2400 },
      { name: '1200w', width: 1200 },
      { name: '600w', width: 600 },
      { name: '300w', width: 300 }
    ];

    for (const { name, width } of lockupSizes) {
      // 1. Transparent Horizontal Lockup
      await sharp(lockupSourcePath)
        .resize({ width, withoutEnlargement: false })
        .png()
        .toFile(path.join(lockupDir, `sondri-lockup-horizontal-transparent-${name}.png`));

      const lockBuf = await sharp(lockupSourcePath).resize({ width, withoutEnlargement: false }).toBuffer();

      // 2. Soft-Corner Lockup Card
      const softLockCard = await createSoftCard(lockBuf, 0.14, 0.4, false, false);
      fs.writeFileSync(path.join(lockupDir, `sondri-lockup-soft-card-${name}.png`), softLockCard);

      // 3. Soft Pill Lockup Badge
      const pillLockCard = await createSoftCard(lockBuf, 0.18, 0.4, false, true);
      fs.writeFileSync(path.join(lockupDir, `sondri-lockup-pill-badge-${name}.png`), pillLockCard);
    }

    // Email Signature Lockups (Soft Card & Transparent)
    const emailBuf = await sharp(lockupSourcePath).resize({ width: 320, height: 75, fit: 'inside' }).toBuffer();
    const emailSoftCard = await createSoftCard(emailBuf, 0.12, 0.3, false, false);
    fs.writeFileSync(path.join(lockupDir, 'email-signature-lockup-soft-card-380x95.png'), emailSoftCard);
    await sharp(lockupSourcePath)
      .resize({ width: 360, height: 90, fit: 'inside' })
      .png()
      .toFile(path.join(lockupDir, 'email-signature-lockup-transparent-360x90.png'));

    // Invoice & Billing Header with Soft Corners (600x200)
    const invLockBuf = await sharp(lockupSourcePath).resize({ width: 480, height: 120, fit: 'inside' }).toBuffer();
    const invSvg = Buffer.from(`
      <svg width="600" height="200">
        <rect x="3" y="3" width="594" height="194" rx="34" fill="${COLOR_INK}" />
        <rect x="6" y="6" width="588" height="188" rx="30" fill="none" stroke="${COLOR_SLATE}" stroke-width="4" />
      </svg>
    `);
    await sharp(invSvg)
      .composite([{ input: invLockBuf, gravity: 'center' }])
      .png()
      .toFile(path.join(lockupDir, 'invoice-billing-header-soft-600x200.png'));
  }

  // ── 7. WEB & FAVICONS ───────────────────────────────────────────────────────
  const webDir = path.join(OUTPUT_DIR, 'web-and-favicons');
  ensureDir(webDir);

  const icoSizes = [16, 32, 48, 64];
  const icoBuffers = [];
  for (const s of icoSizes) {
    const buf = await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(s, s).png().toBuffer();
    icoBuffers.push(buf);
    fs.writeFileSync(path.join(webDir, `favicon-${s}x${s}.png`), buf);
  }

  const icoData = createIco(icoBuffers, icoSizes);
  fs.writeFileSync(path.join(webDir, 'favicon.ico'), icoData);
  fs.writeFileSync(path.join(webDir, 'favicon.svg'), SVG_TEMPLATES['soft-squircle'].trim());

  for (const s of [120, 152, 180]) {
    await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(s, s).png().toFile(path.join(webDir, `apple-touch-icon-${s}x${s}.png`));
  }
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(180, 180).png().toFile(path.join(webDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(192, 192).png().toFile(path.join(webDir, 'android-chrome-192x192.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(512, 512).png().toFile(path.join(webDir, 'android-chrome-512x512.png'));

  const manifest = {
    name: "Sondri",
    short_name: "Sondri",
    icons: [
      { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    theme_color: COLOR_INK,
    background_color: COLOR_INK,
    display: "standalone"
  };
  fs.writeFileSync(path.join(webDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

  // Sync with sondri-site/public
  ensureDir(SONDRI_PUBLIC_DIR);
  fs.writeFileSync(path.join(SONDRI_PUBLIC_DIR, 'favicon.ico'), icoData);
  fs.writeFileSync(path.join(SONDRI_PUBLIC_DIR, 'favicon-16x16.png'), icoBuffers[0]);
  fs.writeFileSync(path.join(SONDRI_PUBLIC_DIR, 'favicon-32x32.png'), icoBuffers[1]);
  fs.writeFileSync(path.join(SONDRI_PUBLIC_DIR, 'favicon-48x48.png'), icoBuffers[2]);
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(180, 180).png().toFile(path.join(SONDRI_PUBLIC_DIR, 'apple-touch-icon.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(192, 192).png().toFile(path.join(SONDRI_PUBLIC_DIR, 'android-chrome-192x192.png'));
  await sharp(Buffer.from(SVG_TEMPLATES['soft-squircle'])).resize(512, 512).png().toFile(path.join(SONDRI_PUBLIC_DIR, 'android-chrome-512x512.png'));
  fs.writeFileSync(path.join(SONDRI_PUBLIC_DIR, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

  // ── 8. COMPREHENSIVE README ────────────────────────────────────────────────
  const readmeContent = `# Sondri Complete Brand Identity & Icon Suite (Soft-Corner Edition)

Official, production-grade brand assets for Sondri featuring smooth continuous corner curves (squircles, soft cards, and pill badges) across all platforms.

---

## 🎯 Package Contents

\`\`\`
brand-icons/
├── 📦 Sondri-Brand-Icons.zip                  # 1-Click ZIP bundle of all assets
│
├── 🏢 google-workspace/
│   ├── google-workspace-wide-header-soft-320x132.png   # Soft-corner Admin header
│   ├── google-workspace-wide-header-soft-640x264.png   # 2x Retina soft header
│   ├── google-workspace-wide-header-transparent-320x132.png
│   ├── google-workspace-admin-logo-512x512.png         # Soft-squircle app icon
│   ├── google-account-avatar-circle-1024x1024.png      # Safe-zone circular avatar
│   └── google-oauth-512x512.png
│
├── 🔤 name-logo-and-wordmarks/
│   ├── sondri-wordmark-soft-card-2400w.png             # Soft-corner card container
│   ├── sondri-wordmark-pill-badge-2400w.png            # Smooth pill container
│   ├── sondri-wordmark-transparent-2400w.png           # Pure transparent
│   └── (All available in 2400w, 1200w, 600w, 300w)
│
├── 🔗 full-brand-lockups/
│   ├── sondri-lockup-soft-card-2400w.png               # [Mark] + [Sondri.] on soft card
│   ├── sondri-lockup-pill-badge-2400w.png              # [Mark] + [Sondri.] on pill badge
│   ├── sondri-lockup-horizontal-transparent-2400w.png  # Master transparent lockup
│   ├── invoice-billing-header-soft-600x200.png         # Stripe / QuickBooks header
│   └── email-signature-lockup-soft-card-380x95.png     # Email signature card
│
├── 💬 social-and-profiles/
│   ├── circle-avatar-1024x1024.png                     # Slack / Discord / X / LinkedIn
│   ├── squircle-avatar-1024x1024.png                   # Continuous squircle
│   └── square-avatar-1024x1024.png
│
├── 🌐 web-and-favicons/
│   ├── favicon.ico (Multi-res 16/32/48/64px binary)
│   ├── favicon.svg
│   ├── apple-touch-icon.png (180x180)
│   └── android-chrome-512x512.png
│
├── 📐 vector-svg/                                      # Master SVGs
└── 🖼 master-png/                                      # Full matrix (16px to 2048px)
\`\`\`

---

## 🎨 Color Palette Specifications
* **Deep Ink / Canvas**: \`#081f1f\`
* **Slate Stroke / Ambient Border**: \`#174040\`
* **Bone White**: \`#e6f2f0\`
* **Gold Signal**: \`#fdb343\` (Primary Signal) / \`#f5a71e\` (Secondary Gold)
* **Light Canvas**: \`#f7fbfb\`
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeContent);

  // ── 9. ZIP PACKAGE ─────────────────────────────────────────────────────────
  console.log('Packaging ZIP bundle...');
  const zipPath = path.join(OUTPUT_DIR, 'Sondri-Brand-Icons.zip');
  execSync(`cd "${ROOT_DIR}" && zip -r "${zipPath}" brand-icons -x "*.DS_Store" "*__MACOSX*" "*.zip"`, { stdio: 'inherit' });

  console.log('Complete Brand Suite generated successfully at:', OUTPUT_DIR);
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
