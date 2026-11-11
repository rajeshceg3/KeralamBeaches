# Verify KeralamBeaches
Keralam Beaches - per-shore Kerala soundscape experience (vite).
## Launch
`npm install`, then `npm run build` and `npm run preview`.
## Doctor
`python3 .cursor/skills/verify-keralam-beaches/verify.py` - a few minutes (real Chromium plus DSP renders).
## Drive
Builds dist/ first (check.cjs serves it), then runs `npm test`: verification/check.cjs (20 states: facts, guide, real drag, keyboard, settled Reset, 14px UI floor, no overflow, persistence, silent start) plus verification/audio-structure.cjs (18 structural DSP checks per shore loop and one-shot: no clipping, sane loudness, no DC, seamless wrap, low-mid weight).
## Evidence
`.cursor/skills/verify-keralam-beaches/evidence.json`
## Cleanup
check.cjs kills its static server.
## Known boundaries
Audio checks are structural, not a listening judgment (by the repo's own design).
