/**
 * Imports a real arch stage through the import worker in a real browser.
 *
 * This is the one check that exercises the bundler's `new Worker(new URL(...))` wiring, and
 * it exists because that wiring broke in a way nothing else could see. Compiling for a
 * browser target, the bundler folded three.js's `typeof window !== 'undefined'` guard to a
 * constant true, so importing three inside a worker threw `window is not defined`. The throw
 * surfaced as a rejected promise inside the bundler's own async module instantiation, which
 * means `worker.onerror` never fired: the worker just never finished evaluating and never
 * answered. A case import sat at its first stage until the session's ready timeout gave up.
 *
 * Neither type checking, nor the build, nor the Node-side checks can catch that. Only a
 * browser can, so this drives headless Chrome over the DevTools protocol, posts a real STL
 * to a real worker, and compares what comes back against an in-process import.
 *
 * Needs a running server and a Chrome install; it skips, loudly and successfully, without
 * them, because a check that fails for missing local tooling gets ignored.
 *
 *   npx next dev                                  # or: npx next build && npx next start
 *   npx tsx scripts/browser-worker-check.ts       # add --url http://localhost:3200 if not :3000
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { importArchStage, type StageImport } from '../src/utils/stlImportPipeline';

const urlArgIndex = process.argv.indexOf('--url');
const APP = urlArgIndex > -1 ? process.argv[urlArgIndex + 1] : 'http://localhost:3000';
const DEBUG_PORT = 9229;
const STL_DIR = path.join(process.cwd(), 'STL');
const CHUNK_DIR = path.join(process.cwd(), '.next', 'static', 'chunks');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((candidate): candidate is string => typeof candidate === 'string');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function skip(reason: string): never {
  console.log(`SKIP  ${reason}`);
  process.exit(0);
}

interface WorkerChunks {
  entry: string;
  moduleChunks: string[];
}

const LOADER_CALL = /default"?\]?\("(static\/chunks\/turbopack-worker-[^"]+)",\s*(\[[^\]]*\])\)/;

function loaderCallIn(text: string): WorkerChunks | null {
  const match = text.includes('turbopack-worker-') ? text.match(LOADER_CALL) : null;
  return match ? { entry: match[1], moduleChunks: JSON.parse(match[2]) } : null;
}

/** Every chunk the worker needs has to be served, or the worker cannot boot. */
async function allChunksServed(candidate: WorkerChunks): Promise<boolean> {
  for (const chunk of [candidate.entry, ...candidate.moduleChunks]) {
    const response = await fetch(`${APP}/_next/${encodeURI(chunk)}`, { method: 'GET' });
    if (!response.ok) return false;
  }
  return true;
}

/**
 * Reads the entry chunk and its dependency chunks out of the emitted loader call, so the
 * worker starts exactly as the app starts it.
 *
 * Two sources, because neither alone is reliable: development names the modules in the served
 * page, production minifies those names away and is only findable in the build output. Each
 * candidate is checked against the running server before it is used, since `.next` on disk
 * can easily hold a different build than the server currently serving.
 */
async function findWorkerChunks(): Promise<WorkerChunks> {
  const candidates: WorkerChunks[] = [];

  const html = await (await fetch(`${APP}/studio`)).text();
  for (const src of [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(match => match[1])) {
    const text = await (await fetch(src.startsWith('http') ? src : APP + src)).text();
    const found = loaderCallIn(text);
    if (found) candidates.push(found);
  }

  if (fs.existsSync(CHUNK_DIR)) {
    for (const file of fs.readdirSync(CHUNK_DIR).filter(name => name.endsWith('.js'))) {
      const found = loaderCallIn(fs.readFileSync(path.join(CHUNK_DIR, file), 'utf8'));
      if (found) candidates.push(found);
    }
  }

  for (const candidate of candidates) {
    if (await allChunksServed(candidate)) return candidate;
  }
  throw new Error(
    candidates.length === 0
      ? 'could not find the emitted worker loader call'
      : 'found the worker loader call, but its chunks are not served by ' + APP,
  );
}

async function main(): Promise<void> {
  const chrome = CHROME_CANDIDATES.find(candidate => fs.existsSync(candidate));
  if (!chrome) skip('no Chrome or Edge found; set CHROME_PATH to run this check');
  if (!fs.existsSync(STL_DIR)) skip(`no STL directory at ${STL_DIR}`);

  try {
    const reachable = await fetch(`${APP}/studio`);
    if (!reachable.ok) skip(`${APP}/studio returned ${reachable.status}; start the server first`);
  } catch {
    skip(`no server at ${APP}; run "npx next dev" (or "next start") first`);
  }

  const stlName = fs.readdirSync(STL_DIR).filter(name => name.toLowerCase().endsWith('.stl')).sort()[0];
  if (!stlName) skip(`no .stl files in ${STL_DIR}`);
  const arch: 'upper' | 'lower' = /lower/i.test(stlName) ? 'lower' : 'upper';
  const bytes = fs.readFileSync(path.join(STL_DIR, stlName));
  const placement = { arch, frame: null, refCenter: null, mismatchMm: 5 };

  console.log(`Sample: ${stlName} (${arch}, ${bytes.length} bytes) against ${APP}`);
  const expected: StageImport = importArchStage(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    { ...placement },
  );

  // The app does not serve /STL, so the page is given its own origin to fetch the sample from.
  const server = http.createServer((_request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/octet-stream');
    response.end(bytes);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
  const stlUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}/stl`;

  const { entry, moduleChunks } = await findWorkerChunks();
  console.log(`Worker entry: ${entry} (+${moduleChunks.length} chunks)`);

  const profile = path.join(process.cwd(), '.next', 'cache', 'browser-worker-check-profile');
  fs.rmSync(profile, { recursive: true, force: true });
  const browser = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', 'about:blank',
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try {
      browser.kill();
    } catch {
      // Already gone; nothing to do.
    }
    server.close();
  };

  try {
    let version: { webSocketDebuggerUrl: string } | undefined;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        version = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json();
        break;
      } catch {
        await sleep(250);
      }
    }
    if (!version) throw new Error('Chrome never exposed its debugging port');

    const socket = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise<void>(resolve =>
      socket.addEventListener('open', () => resolve(), { once: true }));

    let messageId = 0;
    const waiting = new Map<number, (value: Record<string, any>) => void>();
    const send = (method: string, params: unknown = {}, sessionId?: string) =>
      new Promise<Record<string, any>>(resolve => {
        const id = ++messageId;
        waiting.set(id, resolve);
        socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      });

    const consoleErrors: string[] = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      if (message.id && waiting.has(message.id)) {
        waiting.get(message.id)!(message);
        waiting.delete(message.id);
        return;
      }
      if (message.method === 'Target.attachedToTarget') {
        // Worker targets attach here. Enabling Runtime on them is what surfaces a rejection
        // thrown during the worker's module evaluation, which is reported nowhere else.
        void send('Runtime.enable', {}, message.params.sessionId);
        void send('Log.enable', {}, message.params.sessionId);
      } else if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params.exceptionDetails;
        const description = String(details.exception?.description ?? '').split('\n')[0];
        consoleErrors.push(`${details.text} ${description}`.trim());
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        consoleErrors.push(message.params.entry.text);
      }
    });

    await send('Target.setAutoAttach',
      { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
    const created = await send('Target.createTarget', { url: `${APP}/studio` });
    await sleep(4000);
    const attached = await send('Target.attachToTarget',
      { targetId: created.result.targetId, flatten: true });
    const page: string = attached.result.sessionId;
    await send('Runtime.enable', {}, page);

    const expression = `
      window.__check = { events: [], done: null };
      (async () => {
        const log = line => window.__check.events.push(line);
        try {
          const buffer = await (await fetch(${JSON.stringify(stlUrl)})).arrayBuffer();
          const base = '/_next/';
          const chunks = ${JSON.stringify(moduleChunks)}.map(chunk => base + chunk).reverse();
          const params = [chunks, '', base, undefined, undefined];
          const url = new URL(base + ${JSON.stringify(entry)}, location.origin);
          url.hash = '#params=' + encodeURIComponent(JSON.stringify(params));
          const worker = new Worker(url);
          const started = performance.now();
          worker.onerror = event => log('onerror: ' + (event.message || 'no message'));
          worker.onmessage = event => {
            const data = event.data;
            if (data.kind === 'ready') {
              log('ready in ' + Math.round(performance.now() - started) + 'ms');
              worker.postMessage({ id: 1, buffer, placement: ${JSON.stringify(placement)} });
            } else if (data.kind === 'result') {
              const result = data.result;
              window.__check.done = {
                trianglesCount: result.trianglesCount,
                verticesCount: result.verticesCount,
                groups: result.groups.length,
                frameLength: result.frame.length,
                usesSharedFrame: result.usesSharedFrame,
                toothTriangles: result.split && result.split.toothTriangles,
                gumTriangles: result.split && result.split.gumTriangles,
                attributes: result.attributes.map(attribute => attribute.name).join(','),
                ms: Math.round(performance.now() - started),
              };
            } else {
              log('worker reported: ' + data.error);
            }
          };
        } catch (error) { log('threw: ' + error.message); }
      })();
      'started'
    `;
    await send('Runtime.evaluate', { expression, returnByValue: true }, page);

    let result: Record<string, unknown> | null = null;
    let events: string[] = [];
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      await sleep(500);
      const read = await send('Runtime.evaluate', {
        expression: 'JSON.stringify({ events: window.__check.events, done: window.__check.done })',
        returnByValue: true,
      }, page);
      const state = JSON.parse(read.result?.result?.value ?? '{"events":[],"done":null}');
      events = state.events;
      if (state.done) {
        result = state.done;
        break;
      }
      const fatal = events.some(line =>
        line.startsWith('onerror') || line.startsWith('threw') || line.startsWith('worker reported'));
      if (fatal) break;
    }

    for (const line of events) console.log(`  ${line}`);

    let failures = 0;
    const check = (ok: boolean, label: string) => {
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
      if (!ok) failures++;
    };

    check(events.some(line => line.startsWith('ready in')), 'the worker reported ready');
    check(result !== null, 'a stage came back from the worker');
    if (result) {
      check(result.trianglesCount === expected.trianglesCount,
        `triangle count ${result.trianglesCount} matches an in-process import (${expected.trianglesCount})`);
      check(result.verticesCount === expected.verticesCount, `vertex count ${result.verticesCount}`);
      check(
        result.toothTriangles === expected.split?.toothTriangles &&
          result.gumTriangles === expected.split?.gumTriangles,
        `crown/gum split ${result.toothTriangles}/${result.gumTriangles} survived the transfer`,
      );
      check(result.groups === expected.groups.length, `${result.groups} material groups`);
      check(result.frameLength === 16, 'arch frame arrived as 16 numbers');
      check(result.attributes === 'position,normal', `attributes ${result.attributes}`);
      console.log(`     (${result.ms}ms in the browser, worker boot included)`);
    }

    if (consoleErrors.length > 0) {
      console.log('\nBrowser console errors seen:');
      for (const line of new Set(consoleErrors)) console.log(`  ${line}`);
    }

    console.log(failures === 0
      ? '\nAll browser worker checks passed'
      : `\n${failures} browser worker check(s) failed`);
    socket.close();
    cleanup();
    process.exit(failures === 0 ? 0 : 1);
  } catch (error) {
    cleanup();
    throw error;
  }
}

void main().catch(error => {
  console.error(error);
  process.exit(1);
});
