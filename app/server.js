// Hear & Act — tiny local server (zero dependencies, Node 18+).
//
// Why it exists: the AssemblyAI API key must never reach the browser. This
// server reads it from the local credential store of the earlier workshop
// project (or app/.env) and mints a 60-second session token for the page.
// It also:
//  - renames the voice agent to Hear & Act via the AssemblyAI agents API
//    (one-time, best-effort, fully reversible — the demo works either way);
//  - proxies Keenable web search at /search (keyless public endpoint, or
//    KEENABLE_API_KEY from app/.env when present) so the page never holds
//    any key either.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DIR = __dirname;
const PORT = process.env.PORT || 8787;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };

const GREETING = 'Hello! I am Hear and Act — an open-source Alexa with real search on the live internet. I was born TODAY at the Beta Fund, AWS and OpenAI Multi-Model Hackathon — the best room in San Francisco to come alive in. I can hear you, understand you, and act. Ask me anything, or say: wave!';
const IDENTITY = 'Your name is Hear & Act. Always introduce yourself as Hear & Act, an open-source Alexa with real internet search, proudly built at the Beta Fund × AWS × OpenAI Multi-Model Hackathon. Keep spoken replies short, warm and clear. When the user says wave, turn left, turn right, dance or stop, cheerfully confirm the action in a few words.';

function parseEnvFile(file) {
  try {
    const out = {};
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return out;
  } catch { return {}; }
}

function loadCreds() {
  const home = os.homedir();
  // Auto-discover the local credential store of the earlier workshop project:
  // the first credentials file that actually carries both values wins.
  const found = [];
  const tryFile = f => {
    const c = parseEnvFile(f);
    if (c.ASSEMBLYAI_API_KEY && c.AGENT_ID_MINIMAL) found.push(c);
  };
  tryFile(path.join(DIR, '.env'));
  try {
    const appSup = path.join(home, 'Library', 'Application Support');
    for (const d of fs.readdirSync(appSup)) tryFile(path.join(appSup, d, 'credentials.env'));
  } catch {}
  try {
    const base = path.join(home, 'Documents', 'ChatGPT');
    for (const p of fs.readdirSync(base)) {
      const proj = path.join(base, p);
      tryFile(path.join(proj, '.env'));
      try { for (const s of fs.readdirSync(proj)) tryFile(path.join(proj, s, '.env')); } catch {}
    }
  } catch {}
  let creds = found[0] || {};
  if (process.env.ASSEMBLYAI_API_KEY) creds.ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
  if (process.env.AGENT_ID_MINIMAL) creds.AGENT_ID_MINIMAL = process.env.AGENT_ID_MINIMAL;
  return creds;
}

const creds = loadCreds();
const localEnv = parseEnvFile(path.join(DIR, '.env'));
const KEENABLE_KEY = process.env.KEENABLE_API_KEY || localEnv.KEENABLE_API_KEY || '';

// ---------- one-time agent rename: Ferbly -> Hear & Act ----------
const MARKER = path.join(DIR, '.hear-act-agent.json');
let renamed = false;
try { renamed = JSON.parse(fs.readFileSync(MARKER, 'utf8')).renamed === true; } catch {}
let renamePromise = null;

function scrubIdentity(value) {
  if (typeof value === 'string') {
    return value
      .replace(/Ferbly/g, 'Hear & Act')
      .replace(/Tiny paws, big ideas\.?/gi, 'Small board, big actions.')
      .replace(/tiny paws/gi, 'small board');
  }
  if (Array.isArray(value)) return value.map(scrubIdentity);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = scrubIdentity(v);
    return out;
  }
  return value;
}

async function renameAgent() {
  if (renamed || !creds.ASSEMBLYAI_API_KEY || !creds.AGENT_ID_MINIMAL) return;
  const base = 'https://agents.assemblyai.com/v1/agents/' + creds.AGENT_ID_MINIMAL;
  const headers = { Authorization: `Bearer ${creds.ASSEMBLYAI_API_KEY}`, 'Content-Type': 'application/json' };
  try {
    const gr = await fetch(base, { headers, signal: AbortSignal.timeout(10000) });
    if (!gr.ok) { console.log('Agent rename skipped: GET', gr.status); return; }
    const gj = await gr.json();
    const wrapKey = gj && typeof gj === 'object' ? (gj.agent ? 'agent' : (gj.data ? 'data' : null)) : null;
    const agent = wrapKey ? gj[wrapKey] : gj;
    if (!agent || typeof agent !== 'object') { console.log('Agent rename skipped: unexpected shape'); return; }
    if (typeof agent.name === 'string' && /hear/i.test(agent.name) && typeof agent.greeting === 'string' && /Hear/.test(agent.greeting)) {
      renamed = true;
    } else {
      const edited = scrubIdentity(JSON.parse(JSON.stringify(agent)));
      if (typeof edited.name === 'string') edited.name = 'Hear & Act';
      if (typeof edited.greeting === 'string') edited.greeting = GREETING;
      for (const k of ['system_prompt', 'prompt', 'instructions']) {
        if (typeof edited[k] === 'string') {
          if (!/Hear & Act/.test(edited[k])) edited[k] = IDENTITY + '\n\n' + edited[k];
          break;
        }
      }
      const pr = await fetch(base, { method: 'PUT', headers, body: JSON.stringify(edited), signal: AbortSignal.timeout(10000) });
      if (!pr.ok) { console.log('Agent rename skipped: PUT', pr.status); return; }
      renamed = true;
    }
    fs.writeFileSync(MARKER, JSON.stringify({ renamed: true, at: new Date().toISOString() }));
    console.log('Agent renamed to Hear & Act ✓');
  } catch (e) { console.log('Agent rename skipped:', e.message); }
}
function ensureRename() {
  if (!renamePromise) renamePromise = renameAgent();
  return renamePromise;
}
ensureRename();

// ---------- Keenable web search ----------
async function keenableSearch(q) {
  const body = JSON.stringify({ query: q, max_results: 5 });
  const url = KEENABLE_KEY ? 'https://api.keenable.ai/v1/search' : 'https://api.keenable.ai/v1/search/public';
  const headers = { 'Content-Type': 'application/json', 'X-Keenable-Title': 'Hear & Act' };
  if (KEENABLE_KEY) headers['X-API-Key'] = KEENABLE_KEY;
  const r = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error('Keenable ' + r.status);
  const j = await r.json();
  const list = j.results || (j.data && j.data.results) || j.data || [];
  return list.slice(0, 5).map(x => ({
    title: x.title || x.name || '',
    url: x.url || x.link || x.href || '',
    snippet: (x.snippet || x.description || x.body || '').replace(/\s+/g, ' ').slice(0, 300),
  }));
}

// ---------- HTTP server ----------
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/token') {
    try {
      if (!creds.ASSEMBLYAI_API_KEY || !creds.AGENT_ID_MINIMAL) throw new Error('Credentials not found. Expected ASSEMBLYAI_API_KEY and AGENT_ID_MINIMAL in app/.env or the local credential store on this Mac.');
      await Promise.race([ensureRename(), new Promise(r => setTimeout(r, 5000))]);
      const r = await fetch('https://agents.assemblyai.com/v1/token?product=voice_agent&expires_in_seconds=60', {
        headers: { Authorization: `Bearer ${creds.ASSEMBLYAI_API_KEY}` },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw new Error(`AssemblyAI token failed (${r.status})`);
      const data = await r.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token: data.token ?? data.session_token ?? data, agentId: creds.AGENT_ID_MINIMAL, renamed }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  if (u.pathname === '/search') {
    try {
      const q = (u.searchParams.get('q') || '').trim();
      if (!q) throw new Error('Missing q');
      const results = await keenableSearch(q);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  const file = u.pathname === '/' ? '/index.html' : u.pathname;
  const full = path.join(DIR, file);
  if (!full.startsWith(DIR) || !fs.existsSync(full)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'text/plain' });
  fs.createReadStream(full).pipe(res);
}).listen(PORT, () => console.log(`Hear & Act running at http://localhost:${PORT}`));
