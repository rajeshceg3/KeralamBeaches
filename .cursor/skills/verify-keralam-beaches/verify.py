#!/usr/bin/env python3
"""Verification runner for KeralamBeaches. See SKILL.md."""
import json, os, subprocess, sys, time
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]
failures = []
def check(name, ok, detail=''):
    print(('PASS' if ok else 'FAIL'), name, (':: ' + str(detail))[:400] if detail else '')
    if not ok: failures.append(name)
def run(cmd, **kw):
    return subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=900, **kw)
def main():
    if not (REPO / 'node_modules').is_dir():
        check('npm install', run(['npm', 'install', '--no-audit', '--no-fund']).returncode == 0)
    proc = run(['npm', 'run', 'build'])
    check('vite build', proc.returncode == 0, (proc.stdout + proc.stderr)[-300:])
    proc = run(['npm', 'test'])
    tail = proc.stdout + proc.stderr
    fails = tail.count('FAIL ')
    check('shore checks + audio structure (38 PASS: 20 states + DSP loops/one-shots)', proc.returncode == 0 and fails == 0 and 'audio-structure' in tail, tail[-300:])
    print('FAILURES=%d' % len(failures))
    with open(REPO / '.cursor/skills/verify-keralam-beaches/evidence.json', 'w') as f:
        json.dump({'repo': 'KeralamBeaches', 'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'failures': failures}, f, indent=2)
    return 1 if failures else 0
if __name__ == '__main__':
    sys.exit(main())
