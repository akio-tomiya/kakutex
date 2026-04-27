#!/usr/bin/env python3
import base64, json, os, subprocess, sys, time, urllib.request
from pathlib import Path
import websocket

ROOT = Path(__file__).resolve().parents[1]
PORT_APP = 8891
PORT_CDP = 9229
OUT_DIR = ROOT / '_visual'
OUT_DIR.mkdir(exist_ok=True)

server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT_APP)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
user_dir = Path('/tmp/kakutex-cdp-profile')
if user_dir.exists():
    import shutil; shutil.rmtree(user_dir)
chrome = subprocess.Popen([
    'chromium', '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--disable-crash-reporter', '--disable-crashpad', '--no-first-run', '--no-default-browser-check',
    f'--remote-debugging-port={PORT_CDP}', '--remote-allow-origins=*', f'--user-data-dir={user_dir}', 'about:blank'
], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)

counter = 0

def cmd(ws, method, params=None):
    global counter
    counter += 1
    msg = {'id': counter, 'method': method}
    if params is not None:
        msg['params'] = params
    ws.send(json.dumps(msg))
    while True:
        resp = json.loads(ws.recv())
        if resp.get('id') == counter:
            return resp

try:
    # wait for browser
    pages = None
    for _ in range(80):
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{PORT_CDP}/json/list', timeout=1) as f:
                pages = json.loads(f.read().decode())
                if pages:
                    break
        except Exception:
            time.sleep(0.1)
    if not pages:
        raise RuntimeError('CDP not available')
    ws = websocket.create_connection(pages[0]['webSocketDebuggerUrl'], timeout=10)
    cmd(ws, 'Page.enable')
    cmd(ws, 'Runtime.enable')
    cmd(ws, 'Emulation.setDeviceMetricsOverride', {'width': 1600, 'height': 1000, 'deviceScaleFactor': 1, 'mobile': False})
    cmd(ws, 'Page.navigate', {'url': (ROOT / 'app' / 'index.html').resolve().as_uri()})
    time.sleep(8)
    # verify visible bits
    res = cmd(ws, 'Runtime.evaluate', {'expression': "JSON.stringify({title:document.title, assist:!!document.getElementById('assist-toggle-btn'), blocks:document.querySelectorAll('.preview-block').length, status:document.getElementById('status-message')?.textContent})", 'returnByValue': True})
    (OUT_DIR / 'dom-summary.json').write_text(res['result']['result']['value'], encoding='utf-8')
    shot = cmd(ws, 'Page.captureScreenshot', {'format': 'png', 'fromSurface': True})
    (OUT_DIR / 'app.png').write_bytes(base64.b64decode(shot['result']['data']))
    # assist toolbar screenshot
    cmd(ws, 'Runtime.evaluate', {'expression': "document.getElementById('assist-toggle-btn')?.click();", 'returnByValue': True})
    time.sleep(1)
    shot2 = cmd(ws, 'Page.captureScreenshot', {'format': 'png', 'fromSurface': True})
    (OUT_DIR / 'app-assist.png').write_bytes(base64.b64decode(shot2['result']['data']))
    cmd(ws, 'Browser.close')
    print('CDP screenshot succeeded')
finally:
    try:
        server.terminate(); server.wait(timeout=3)
    except Exception:
        server.kill()
    try:
        chrome.terminate(); chrome.wait(timeout=3)
    except Exception:
        chrome.kill()
