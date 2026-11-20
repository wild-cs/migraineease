// Smoke test for the Android app on an emulator. Drives the WebView through the Chrome DevTools
// protocol (debug builds only), presses real Android keys with adb, and saves screenshots.
// Usage: node smoke.mjs <output-dir>   (needs Node 22+ for the built-in WebSocket)
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const OUT = process.argv[2] || '.';
const PKG = 'io.github.wildcs.migraineease';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sh = cmd => execSync(cmd, { encoding: 'utf8' }).trim();
const shot = name => writeFileSync(`${OUT}/${name}.png`, execSync('adb exec-out screencap -p'));
const back = async () => { sh('adb shell input keyevent KEYCODE_BACK'); await sleep(900); };

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failures++;
}

async function connect() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const pid = sh(`adb shell pidof ${PKG}`);
      sh(`adb forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);
      const pages = await (await fetch('http://127.0.0.1:9222/json')).json();
      const page = pages.find(p => p.type === 'page' && p.url.includes('appassets'));
      if (!page) throw new Error('page not ready');
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
      let seq = 0;
      const pending = new Map();
      ws.onmessage = m => {
        const d = JSON.parse(m.data);
        if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      };
      const send = (method, params = {}) => new Promise(r => {
        const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params }));
      });
      const js = async expr => {
        const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
        if (r.result?.exceptionDetails) throw new Error(`${expr}\n${JSON.stringify(r.result.exceptionDetails)}`);
        return r.result?.result?.value;
      };
      for (let i = 0; i < 30 && !(await js("!!document.querySelector('.tabbar')")); i++) await sleep(500);
      return { js, close: () => ws.close() };
    } catch (e) {
      await sleep(1000);
    }
  }
  throw new Error('Could not connect to the app WebView');
}

const pick = ids => `${JSON.stringify(ids)}.forEach(id => document.querySelector('[data-val="' + id + '"]').click()); true`;

let app = await connect();
console.log('WebView:', await app.js('navigator.userAgent'));

// Start-up
check('app renders the home screen', await app.js("!!document.querySelector('.hero')"));
check('runs from files bundled in the APK', (await app.js('location.href')).startsWith('https://appassets.androidplatform.net/assets/index.html'));
check('Android bridge is available', await app.js('!!window.AndroidBridge && NATIVE !== null'));
check('WebView supports the CSS the app uses', await app.js("CSS.supports('color', 'color-mix(in srgb, red 50%, blue)')"));
check('texts mention Google Drive, not iCloud', (await app.js('STORE')) === 'Files / Google Drive');
shot('1-home');

// Attack flow and the back button
await app.js('A.startAttackMode(); true'); await sleep(700);
await app.js(pick(['s-throbbing-pain', 's-light-sensitivity', 's-nausea']));
shot('2-symptoms');
await back();
check('Back closes the symptom picker', await app.js('UI.attack === null'));
check('app is still open after Back', sh(`adb shell pidof ${PKG}`) !== '');

await app.js('A.startAttackMode(); true'); await sleep(500);
await app.js(pick(['s-throbbing-pain', 's-nausea']));
await app.js('A.getHelp(); true'); await sleep(800);
shot('3-relief');
await app.js('A.cancelAttackMode(); true'); await sleep(500);
check('attack is being tracked', await app.js('!!activeEvent()'));
shot('4-attack-active');

await app.js("A.open({ dataset: { val: 'medQuick' } }); true"); await sleep(700);
shot('5-sheet');
await back();
check('Back closes an open sheet', await app.js('UI.sheets.length === 0'));

// Keyboard: the text field must stay visible above the on-screen keyboard
await app.js("A.open({ dataset: { val: 'addTip' } }); true"); await sleep(700);
sh('adb shell input tap 540 600'); await sleep(300);
await app.js("document.querySelector('#tip-text').focus(); true"); await sleep(1500);
shot('6-keyboard');
const kb = await app.js("(() => { const r = document.querySelector('#tip-text').getBoundingClientRect(); return { bottom: r.bottom, h: innerHeight }; })()");
check('text field stays above the keyboard', kb.bottom <= kb.h, JSON.stringify(kb));
await app.js("document.activeElement.blur(); closeSheet(); true"); await sleep(600);

// Saving a backup opens Android's file picker; cancelling it is reported back to the app
await app.js("window.__r = null; shareFile(new File(['{}'], 'MigraineEase-backup.json', { type: 'application/json' })).then(r => { window.__r = r; }); true");
await sleep(3500);
shot('7-save-picker');
const resumed = sh('adb shell dumpsys activity activities | grep -i "ResumedActivity" | head -3');
check('Android file picker opens for the backup', /documentsui/i.test(resumed), resumed.split('\n')[0]);
await back(); await sleep(1500);
check('cancelling the picker is reported to the app', (await app.js('window.__r')) === 'cancelled', String(await app.js('window.__r')));

// Data must survive closing the app completely
await app.js('if (S.activeEventId) { activeEvent().end = new Date().toISOString(); S.activeEventId = null; } loadDemo(); true');
await sleep(500);
app.close();
sh(`adb shell am force-stop ${PKG}`); await sleep(1000);
sh(`adb shell am start -W -n ${PKG}/.MainActivity`); await sleep(4000);
app = await connect();
const n = await app.js('S.events.length');
check('data survives a full app restart', n === 5, `${n} attacks after restart`);

await app.js("UI.tab = 'profile'; render(); true"); await sleep(700); shot('8-profile');
await app.js("UI.tab = 'insights'; render(); true"); await sleep(700); shot('9-insights');
await back();
check('Back on another tab returns to Home', (await app.js('UI.tab')) === 'home');
app.close();

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
