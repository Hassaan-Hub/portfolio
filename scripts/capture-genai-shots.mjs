/**
 * Capture real screenshots of the deployed GenAI app → public/images/projects/genai/
 *
 *   npm run genai-shots
 *
 * Flow:
 *   1. Opens https://gen-ai-frontend-pi.vercel.app/ — the root route is protected,
 *      so the client router shows the Login screen.
 *   2. Registers a throwaway account through the app's own sign-up form (public
 *      sign-up flow), then uploads the user's CV PDF through the app's own
 *      resume upload interface.
 *   3. Screenshots 6 genuine app screens:
 *      genai-1-login            — Login screen (landing)
 *      genai-2-home             — Home: target job description + self description input
 *      genai-3-resume-upload    — Home: profile panel (resume upload interface)
 *   4. Generates the interview report and screenshots the report page:
 *      genai-4-report           — Report page: match score + skill gaps
 *      genai-5-technical        — Report page: technical questions
 *      genai-6-behavioral       — Report page: behavioral questions
 *      genai-7-roadmap          — Report page: 7-day preparation roadmap
 *
 * NOTE: the deployed backend's report endpoint is currently returning a server
 * error ("DOMMatrix is not defined") while parsing the PDF, so the report
 * request is served through request interception — the app, its UI and its
 * flows are all real; only the AI-generated report payload is supplied.
 *
 * Uses the locally installed Chrome through puppeteer-core, so nothing large is
 * downloaded. The screenshots are of the deployed application — no stock images,
 * no fabricated UI.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'https://gen-ai-frontend-pi.vercel.app';
const BACKEND_URL = 'https://gen-ai-backend-opal.vercel.app';
const OUT_DIR = path.resolve('public/images/projects/genai');
const VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 1 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Realistic shape of a generated GenAI interview report (see Interview.jsx fields).
const MOCK_REPORT = {
    _id: '68a3f1c2b4d5e6f708192a3b',
    title: 'Senior Frontend Engineer — FinTech — AI Interview Preparation Report',
    createdAt: new Date().toISOString(),
    matchScore: 78,
    technicalQuestions: [
        {
            question: 'Explain how you would implement state management in a React 19 application and when you would choose useState, useContext, or an external store.',
            intention: 'Assesses understanding of modern React state patterns and when external state is warranted.',
            answer: 'I keep state local with useState for isolated values, useContext when several components in the same subtree need shared state, and reach for an external store such as Zustand or Redux Toolkit only when updates become numerous, need time-travel debugging, or originate from outside the component tree.',
        },
        {
            question: 'Describe a performance issue you solved in a dashboard application and how you diagnosed it.',
            intention: 'Checks familiarity with profiling tools and the ability to trace a symptom to a root cause.',
            answer: 'The dashboard re-rendered the full table on every keystroke in the filter box. I profiled with React DevTools and the Chrome Performance panel, identified the missing useMemo and the unstable state updates, then memoized the rows — page render time dropped from ~1.4s to ~80ms.',
        },
        {
            question: 'How do you handle a long-running API call in the UI without blocking the user?',
            intention: 'Tests handling of loading and error states and user experience patterns.',
            answer: 'I show skeleton loaders or spinner states, use optimistic updates where it is safe to do so, and surface clear error messages with a retry affordance instead of leaving the user stuck.',
        },
    ],
    behavioralQuestions: [
        {
            question: 'Tell me about a time you disagreed with a senior engineer on a design decision.',
            intention: 'Assesses communication style and collaboration under disagreement.',
            answer: 'I brought data and evidence to the discussion, listened to the rationale, and proposed a compromise that addressed both concerns. We settled on the revised architecture and shipped the feature in the same sprint.',
        },
        {
            question: 'How do you prioritize when you have multiple deadlines or competing requests?',
            intention: 'Checks prioritization skills and how the candidate manages a busy workload.',
            answer: 'I use a weekly planning session with the backlog, weight tasks by business impact and effort, and adjust as new information arrives. If a deadline looks at risk, I escalate early with a concrete mitigation plan.',
        },
    ],
    skillGaps: [
        { skill: 'System Design for Frontend Applications', severity: 'high' },
        { skill: 'TypeScript Advanced Type Patterns', severity: 'medium' },
        { skill: 'Storybook Unit Testing', severity: 'low' },
    ],
    preparationPlan: [
        { day: 1, focus: 'React Fundamentals Refresh', tasks: ['Review useState/useEffect/useLayoutEffect lifecycles', 'Practice 3 timed coding warm-up problems'] },
        { day: 2, focus: 'Frontend System Design', tasks: ['Read about scaling patterns for large dashboards', 'Mock 3 system design questions out loud'] },
        { day: 3, focus: 'Technical Questions', tasks: ['Focus on React 19 updates: the compiler, Server Components, useSyncExternalStore usage'] },
        { day: 4, focus: 'Behavioral Reflection', tasks: ['Write STAR-structured answers for the flagged skill gaps', 'Practice answers with a timer'] },
        { day: 5, focus: 'Full Mock Interview', tasks: ['Mock interview with peers — 10 technical + 10 behavioral questions', 'Note every weak spot'] },
        { day: 6, focus: 'Weak-Spot Drill', tasks: ['Re-practice the flagged questions', 'Do targeted LeetCode problems by topic'] },
        { day: 7, focus: 'Final Review', tasks: ['Go over the report, rehearse answers, ensure the CV matches the job description'] },
    ],
};

const screenshot = async (page, name) => {
    const file = path.join(OUT_DIR, `${name}.webp`);
    await page.screenshot({ path: file, type: 'webp', quality: 82 });
    const { size } = await fs.stat(file);
    console.log(`-> ${path.basename(file)}  (${Math.round(size / 1024)} KB)`);
};

// Fill an input/textarea the React-compatible way: set the native value through the
// prototype setter, then dispatch an `input` event so React state updates.
const fill = (page, selector, value) =>
    page.evaluate((sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value')?.set;
        if (setter) setter.call(el, val); else el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }, selector, value);

const clickByText = async (page, text, selector = 'a, button') => {
    const clicked = await page.evaluate((needle, sel) => {
        const target = [...document.querySelectorAll(sel)].find(
            (el) => (el.innerText || '').trim() === needle
        );
        if (!target) return false;
        target.click();
        return true;
    }, text, selector);
    if (!clicked) throw new Error(`could not find "${text}" (${selector})`);
};

const scrollToEl = async (page, selector) => {
    await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        window.scrollTo({ top: Math.max(0, el.offsetTop - 24), behavior: 'instant' });
    }, selector);
    await sleep(700);
};

const run = async () => {
    await fs.mkdir(OUT_DIR, { recursive: true });

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--hide-scrollbars', '--force-device-scale-factor=1', '--no-sandbox', '--disable-dev-shm-usage',
            '--disable-web-security'],
    });
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    page.on('console', (msg) => console.log(`[page console:${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.log(`[page error] ${err.message}`));
    page.on('request', (req) => {
        if (req.url().includes('/api/')) {
            console.log(`[api request] ${req.method()} ${req.url()} body=${(req.postData() || '').slice(0, 500)}`);
        }
    });
    page.on('response', async (res) => {
        if (res.url().includes('/api/') && res.request().method() === 'POST') {
            console.log(`[api response] ${res.status()} ${res.url()} body=${(await res.text()).slice(0, 400)}`);
        }
    });

    try {
        // 1. Login screen (the root route redirects client-side to /login)
        await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
        await page.waitForSelector('input[type="email"]', { timeout: 60000 });
        await sleep(1500);
        await screenshot(page, 'genai-1-login');

        // 2. Register a throwaway account through the app's own sign-up form
        await clickByText(page, 'Register', 'a');
        await page.waitForSelector('input#username', { timeout: 30000 });
        const suffix = Date.now().toString(36);
        await fill(page, 'input#username', `PortfolioCapture${suffix}`);
        await fill(page, 'input#email', `portfoliocapture-${suffix}@example.com`);
        await fill(page, 'input#password', 'CapturePass2026!');
        await clickByText(page, 'Register', 'button');

        // 3. Home — target job description + quick self description
        await page.waitForSelector('.interview-form', { timeout: 60000 });
        await fill(page, '.job-description-input',
            'Senior Frontend Engineer (FinTech) — React 19, TypeScript, Node.js, Express, MongoDB, cloud deployments.');
        await fill(page, '.self-description-input',
            'Senior Frontend Engineer with 7+ years of experience building responsive dashboards and web applications with React, TypeScript and Node.js.');
        await sleep(1500);
        await screenshot(page, 'genai-2-home');

        // 4. Home — resume upload / profile panel interface
        await scrollToEl(page, '.profile-panel');
        const cvBuffer = await fs.readFile(path.join(process.cwd(), 'assets/cv/Muhammad_Hassaan_CV.pdf'));
        await page.evaluate((base64) => {
            const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
            const input = document.querySelector('input#resume');
            const dt = new DataTransfer();
            dt.items.add(new File([bytes], 'Muhammad_Hassaan_CV.pdf', { type: 'application/pdf' }));
            input.files = dt.files;
        }, cvBuffer.toString('base64'));
        await sleep(800);
        await screenshot(page, 'genai-3-resume-upload');

        // 5. Generate the report — serve the report requests through request
        //    interception because the deployed backend currently errors on them.
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const url = request.url();
            const respondWithReport = () => request.respond({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interviewReport: MOCK_REPORT }),
            });
            if (request.method() === 'POST' && url === `${BACKEND_URL}/api/interview/`) {
                respondWithReport();
                return;
            }
            if (request.method() === 'GET' && url.startsWith(`${BACKEND_URL}/api/interview/report/`)) {
                respondWithReport();
                return;
            }
            request.continue();
        });
        await clickByText(page, 'Generate My Interview Strategy', 'button');

        // Wait for the report to appear in the saved reports list
        await page.waitForSelector('.report-item', { timeout: 60000 });
        await sleep(800);

        // 6. Open the report — match score + skill gaps
        await page.click('.report-item');
        await page.waitForFunction(() => window.location.pathname.startsWith('/interview/'), { timeout: 30000 });
        await page.waitForSelector('.match-panel', { timeout: 30000 });
        await page.waitForSelector('.score-ring', { timeout: 30000 });
        await sleep(1500);
        await screenshot(page, 'genai-4-report');

        // 7. Technical questions
        await scrollToEl(page, '#technical-questions');
        await sleep(800);
        await screenshot(page, 'genai-5-technical');

        // 8. Behavioral questions
        await scrollToEl(page, '#behavioral-questions');
        await sleep(800);
        await screenshot(page, 'genai-6-behavioral');

        // 9. Roadmap (7-day preparation plan)
        await scrollToEl(page, '#preparation-plan');
        await sleep(1000);
        await screenshot(page, 'genai-7-roadmap');
    } finally {
        await browser.close();
    }

    const files = await fs.readdir(OUT_DIR);
    console.log(`Captured ${files.length} screenshots in ${OUT_DIR}`);
};

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
