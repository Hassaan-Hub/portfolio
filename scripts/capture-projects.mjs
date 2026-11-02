/**
 * Capture real screenshots of every live project → assets/projects/<slug>-N.webp
 *
 *   npm run shots              # capture everything
 *   npm run shots -- settube   # capture a single project
 *
 * Each project gets a few frames (different app screens or scroll positions).
 * The portfolio cross-fades between them on hover, so a card looks like a live
 * preview instead of a static mockup.
 *
 * Uses the locally installed Chrome/Edge through puppeteer-core, so nothing
 * large is downloaded.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const OUT_DIR = path.resolve('assets/projects');
const VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 1 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SITES = {
  hcm: 'https://final-hackathon-three-sigma.vercel.app/',
  maintainiq: 'https://maintain-iq-project.netlify.app/',
  healthmate: 'https://hassaan-hub.github.io/HealthMate/',
  ecommerce: 'https://ecommerce1277.netlify.app/',
  settube: 'https://settube.vercel.app/',
  'todo-app': 'https://todo-with-react-green.vercel.app/',
  userpanel: 'https://hassaan-hub.github.io/UserPanel/',
};

// Demo account for the HCM Lite hackathon build (admin role)
const HCM_EMAIL = 'hassaanali994@gmail.com';
const HCM_PASSWORD = 'hassaan1571';

/* ---------------------------------------------------------------- helpers */

const clickByText = async (page, text, selector = 'a, button') => {
  const clicked = await page.evaluate(
    (needle, sel) => {
      const target = [...document.querySelectorAll(sel)].find(
        (el) => (el.innerText || '').trim().toLowerCase() === needle.toLowerCase()
      );
      if (!target) return false;
      target.click();
      return true;
    },
    text,
    selector
  );
  if (!clicked) console.warn(`   ! could not find "${text}"`);
  await sleep(1800);
};

const scrollTo = async (page, ratio) => {
  await page.evaluate((r) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(max * r));
  }, ratio);
  await sleep(1000);
};

// MaintainIQ ships public demo accounts — use the admin one.
// The session is stored in localStorage, so later frames land on the dashboard
// directly; only log in when the login form is actually on screen.
const loginMaintainIQ = async (page) => {
  const hasLoginForm = await page.evaluate(() => Boolean(document.querySelector('.demo-cred-btn')));
  if (!hasLoginForm) return;
  await page.click('.demo-cred-btn');
  await sleep(500);
  await page.evaluate(() => document.querySelector('form').requestSubmit());
  await sleep(4500);
};

// HCM Lite is a Next.js app with a real login screen (no demo autofill).
// The session cookie persists across pages, so only sign in when the form is up.
const loginHCM = async (page) => {
  await page.goto(`${SITES.hcm}login`, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await sleep(2500);

  const hasForm = await page.evaluate(() => Boolean(document.querySelector('input[type="email"]')));
  if (!hasForm) return; // already signed in — /login redirected to the dashboard

  await page.type('input[type="email"]', HCM_EMAIL);
  await page.type('input[type="password"]', HCM_PASSWORD);
  await page.evaluate(() => document.querySelector('form').requestSubmit());
  // Wait for the client-side redirect to /dashboard
  await sleep(10000);
};

const openPage = async (browser, url) => {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  );
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  } catch {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  }
  await page
    .addStyleTag({
      content: `html{scroll-behavior:auto !important}
                *,*::before,*::after{animation-duration:.001s !important;animation-delay:0s !important;
                transition-duration:.001s !important}`,
    })
    .catch(() => {});
  await sleep(2500);
  return page;
};

/* ------------------------------------------------------------ shot script */
/* One entry = one frame. A fresh page is opened for every frame so each state
   is reached from a clean load (no leftover scroll or open menus). */

const SHOTS = [
  // HCM Lite — Saylani Hackathon HR platform (dashboard, directory, payroll)
  {
    slug: 'hcm',
    url: `${SITES.hcm}login`,
    async act(page) {
      await loginHCM(page);
      await scrollTo(page, 0);
    },
  },
  {
    slug: 'hcm',
    url: `${SITES.hcm}login`,
    async act(page) {
      await loginHCM(page);
      await page.goto(`${SITES.hcm}employees`, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
      await sleep(2500);
    },
  },
  {
    slug: 'hcm',
    url: `${SITES.hcm}login`,
    async act(page) {
      await loginHCM(page);
      await page.goto(`${SITES.hcm}payroll`, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
      await sleep(2500);
    },
  },

  // MaintainIQ — real dashboard after logging in with the public demo account
  {
    slug: 'maintainiq',
    url: SITES.maintainiq,
    async act(page) {
      await loginMaintainIQ(page);
    },
  },
  {
    slug: 'maintainiq',
    url: SITES.maintainiq,
    async act(page) {
      await loginMaintainIQ(page);
      await clickByText(page, 'Asset Inventory');
    },
  },
  {
    slug: 'maintainiq',
    url: SITES.maintainiq,
    async act(page) {
      await loginMaintainIQ(page);
      await clickByText(page, 'Maintenance History');
    },
  },

  // HealthMate — marketing landing page, three scroll stops
  { slug: 'healthmate', url: SITES.healthmate, async act(page) { await scrollTo(page, 0); } },
  { slug: 'healthmate', url: SITES.healthmate, async act(page) { await scrollTo(page, 0.35); } },
  { slug: 'healthmate', url: SITES.healthmate, async act(page) { await scrollTo(page, 0.62); } },

  // E-Commerce — storefront, jewellery category, lower grid
  { slug: 'ecommerce', url: SITES.ecommerce, async act(page) { await scrollTo(page, 0); } },
  {
    slug: 'ecommerce',
    url: SITES.ecommerce,
    async act(page) {
      // The nav link is spelled "JEWELERY" on the site itself
      await clickByText(page, 'JEWELERY');
      await scrollTo(page, 0);
    },
  },
  { slug: 'ecommerce', url: SITES.ecommerce, async act(page) { await scrollTo(page, 0.55); } },

  // SetTube — the deployed build is a single static feed, so one frame only
  { slug: 'settube', url: SITES.settube, async act(page) { await scrollTo(page, 0); } },

  // Todo App — sign up and log in screens
  { slug: 'todo-app', url: SITES['todo-app'], async act(page) { await sleep(300); } },
  {
    slug: 'todo-app',
    url: SITES['todo-app'],
    async act(page) {
      await clickByText(page, 'Log in');
    },
  },

  // UserPanel — sign up and sign in screens
  { slug: 'userpanel', url: `${SITES.userpanel}signup/sign-up.html`, async act() {} },
  { slug: 'userpanel', url: `${SITES.userpanel}signin/sign-in.html`, async act() {} },
];

/* -------------------------------------------------------------------- run */

const findChrome = async () => {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      /* next */
    }
  }
  throw new Error('No Chrome/Edge found. Add its path to CHROME_CANDIDATES.');
};

const run = async () => {
  const only = process.argv[2];
  const shots = only ? SHOTS.filter((s) => s.slug === only) : SHOTS;

  if (!shots.length) {
    console.error(`Unknown project "${only}". Options: ${Object.keys(SITES).join(', ')}`);
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: await findChrome(),
    headless: 'new',
    args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--no-sandbox'],
  });

  const counters = {};

  for (const shot of shots) {
    counters[shot.slug] = (counters[shot.slug] || 0) + 1;
    const file = path.join(OUT_DIR, `${shot.slug}-${counters[shot.slug]}.webp`);
    process.stdout.write(`→ ${path.basename(file)}  `);

    let page;
    try {
      page = await openPage(browser, shot.url);
      await shot.act(page);
      await sleep(700);
      await page.screenshot({ path: file, type: 'webp', quality: 82 });
      const { size } = await fs.stat(file);
      console.log(`ok (${Math.round(size / 1024)} KB)`);
    } catch (error) {
      console.log(`FAILED — ${error.message}`);
    } finally {
      await page?.close();
    }
  }

  await browser.close();
  console.log('Done.');
};

run();
