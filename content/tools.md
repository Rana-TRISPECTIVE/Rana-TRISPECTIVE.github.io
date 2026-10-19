---
title: "Tools"
date: 2026-07-01
draft: false
author: "Rana"
---
<style>
article,
.post,
.single,
.entry-content,
.post-content,
.content,
main,
.container {
background: transparent !important;
box-shadow: none !important;
border: none !important;
padding: 0 !important;
}
.rana-article-header,
.post-header {
display: none !important;
}
:root {
--c-purple: #c084fc;
--c-purple-bright: #d8b4fe;
--c-purple-glow: rgba(192, 132, 252, 0.28);
--c-emerald: #10b981;
--c-emerald-bright: #34d399;
--c-emerald-glow: rgba(16, 185, 129, 0.25);
--c-glass-bg: rgba(14, 10, 24, 0.55);
--c-glass-border: rgba(255, 255, 255, 0.08);
--font-display: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--ease-apple: cubic-bezier(0.16, 1, 0.3, 1);
}
#zenCanvas {
position: fixed;
top: 0;
left: 0;
width: 100vw;
height: 100vh;
pointer-events: none;
z-index: 0;
opacity: 0.6;
}
.tools-container {
position: relative;
z-index: 2;
max-width: 860px;
margin: 0 auto;
padding: 1.5rem 1.1rem 5rem 1.1rem;
font-family: var(--font-display);
-webkit-tap-highlight-color: transparent;
box-sizing: border-box;
}
.tools-header-hub {
text-align: center;
margin-bottom: 2.8rem;
}
.free-capsule {
display: inline-flex;
align-items: center;
gap: 9px;
background: rgba(16, 185, 129, 0.08);
border: 1px solid rgba(16, 185, 129, 0.32);
color: var(--c-emerald-bright);
padding: 6px 18px;
border-radius: 9999px;
font-family: var(--font-display);
font-size: 0.76rem;
font-weight: 700;
letter-spacing: 0.08em;
text-transform: uppercase;
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
margin-bottom: 1.25rem;
}
.beacon-dot {
position: relative;
width: 7px;
height: 7px;
border-radius: 50%;
background-color: var(--c-emerald-bright);
box-shadow: 0 0 8px var(--c-emerald-bright);
}
.beacon-dot::after {
content: "";
position: absolute;
inset: -3px;
border-radius: 50%;
border: 1px solid var(--c-emerald-bright);
animation: ringPulse 2s infinite ease-out;
}
@keyframes ringPulse {
0% { transform: scale(0.8); opacity: 1; }
100% { transform: scale(2.2); opacity: 0; }
}
.tools-title-glam {
font-family: var(--font-display);
font-size: clamp(2.8rem, 7vw, 4.2rem);
font-weight: 800;
letter-spacing: -0.04em;
line-height: 1.08;
margin: 0 0 0.6rem 0;
background: linear-gradient(180deg, #ffffff 40%, rgba(255, 255, 255, 0.65) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
}
.tools-lead-sub {
font-family: var(--font-display);
font-size: 0.95rem;
color: #94a3b8;
margin: 0 auto;
max-width: 480px;
line-height: 1.5;
font-weight: 400;
}
.tools-stream {
display: flex;
flex-direction: column;
gap: 1.15rem;
}
.tool-tile {
position: relative;
display: flex;
align-items: center;
gap: 1.5rem;
background: var(--c-glass-bg);
border: 1px solid var(--c-glass-border);
border-radius: 20px;
padding: 1.6rem 1.8rem;
text-decoration: none !important;
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
transition: transform 0.32s var(--ease-apple), border-color 0.32s var(--ease-apple), box-shadow 0.32s var(--ease-apple);
overflow: hidden;
cursor: pointer;
}
.tool-tile::before {
content: "";
position: absolute;
inset: 0;
border-radius: 20px;
background: radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.04), transparent 60%);
pointer-events: none;
opacity: 0;
transition: opacity 0.3s ease;
}
.tool-tile:hover::before {
opacity: 1;
}
.tool-tile:hover {
transform: translateY(-2px) scale(1.006);
border-color: rgba(192, 132, 252, 0.4);
box-shadow: 0 16px 36px -10px var(--c-purple-glow), 0 0 0 1px rgba(192, 132, 252, 0.15);
}
.tool-tile:active {
transform: scale(0.985);
transition-duration: 0.1s;
}
.tool-tile.featured-tile {
border-color: rgba(16, 185, 129, 0.3);
background: linear-gradient(135deg, rgba(18, 12, 32, 0.65) 0%, rgba(8, 6, 15, 0.75) 100%);
}
.tool-tile.featured-tile:hover {
border-color: rgba(52, 211, 153, 0.55);
box-shadow: 0 16px 36px -10px var(--c-emerald-glow), 0 0 0 1px rgba(52, 211, 153, 0.2);
}
.tile-icon-box {
position: relative;
width: 58px;
height: 58px;
border-radius: 16px;
background: rgba(192, 132, 252, 0.08);
border: 1px solid rgba(192, 132, 252, 0.22);
display: flex;
align-items: center;
justify-content: center;
color: var(--c-purple-bright);
flex-shrink: 0;
box-shadow: inset 0 0 12px rgba(192, 132, 252, 0.1);
transition: transform 0.35s var(--ease-apple), border-color 0.35s ease, color 0.35s ease;
}
.featured-tile .tile-icon-box {
background: rgba(16, 185, 129, 0.08);
border-color: rgba(16, 185, 129, 0.28);
color: var(--c-emerald-bright);
box-shadow: inset 0 0 12px rgba(16, 185, 129, 0.12);
}
.tool-tile:hover .tile-icon-box {
transform: scale(1.08) rotate(2deg);
border-color: var(--c-purple-bright);
color: #ffffff;
}
.featured-tile:hover .tile-icon-box {
border-color: var(--c-emerald-bright);
color: #ffffff;
transform: scale(1.08) rotate(-2deg);
}
.tile-core {
flex: 1;
min-width: 0;
}
.tile-badge-row {
display: flex;
align-items: center;
gap: 8px;
margin-bottom: 0.4rem;
}
.tile-chip {
font-family: var(--font-display);
font-size: 0.65rem;
font-weight: 800;
letter-spacing: 0.08em;
text-transform: uppercase;
padding: 3px 8px;
border-radius: 6px;
background: rgba(255, 255, 255, 0.04);
color: #94a3b8;
border: 1px solid rgba(255, 255, 255, 0.08);
}
.featured-tile .tile-chip {
background: rgba(16, 185, 129, 0.12);
color: var(--c-emerald-bright);
border-color: rgba(16, 185, 129, 0.3);
}
.tile-title {
font-family: var(--font-display);
margin: 0 0 0.35rem 0;
font-size: 1.25rem;
font-weight: 700;
color: #ffffff;
letter-spacing: -0.015em;
line-height: 1.25;
transition: color 0.2s ease;
}
.tool-tile:hover .tile-title {
color: #ffffff;
}
.tile-desc {
font-family: var(--font-display);
margin: 0;
font-size: 0.91rem;
line-height: 1.5;
color: #94a3b8;
font-weight: 400;
}
@media (max-width: 680px) {
.tools-container {
padding: 1rem 0.9rem 4.5rem 0.9rem;
}
.tools-header-hub {
margin-bottom: 2.2rem;
}
.tool-tile {
align-items: flex-start;
gap: 1.15rem;
padding: 1.35rem 1.2rem;
border-radius: 17px;
}
.tile-icon-box {
width: 48px;
height: 48px;
border-radius: 13px;
}
.tile-title {
font-size: 1.15rem;
margin-bottom: 0.25rem;
}
.tile-desc {
font-size: 0.86rem;
line-height: 1.45;
}
}
</style>
<canvas id="zenCanvas"></canvas>
<div class="tools-container">
<header class="tools-header-hub">
<div class="free-capsule">
<span class="beacon-dot"></span>
100% Free • Built by Rana
</div>
<h1 class="tools-title-glam">Tools</h1>
</header>
<div class="tools-stream">
<a href="/tools/stutracker/" class="tool-tile featured-tile">
<div class="tile-icon-box">
<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 2L2 7l10 5 10-5-10-5z"></path>
<path d="M2 17l10 5 10-5"></path>
<path d="M2 12l10 5 10-5"></path>
</svg>
</div>
<div class="tile-core">
<div class="tile-badge-row">
<span class="tile-chip">Main Cloud Utility</span>
</div>
<h3 class="tile-title">Study &amp; Revision Tracker</h3>
<p class="tile-desc">AMOLED syllabus architecture with Firebase Cloud Sync. Log deep sessions, map targets, and automate spaced repetition cycles.</p>
</div>
</a>
<a href="/tools/Timer/" class="tool-tile">
<div class="tile-icon-box">
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<circle cx="12" cy="12" r="10"></circle>
<polyline points="12 6 12 12 16 14"></polyline>
<path d="M12 2v2"></path>
<path d="M12 20v2"></path>
</svg>
</div>
<div class="tile-core">
<div class="tile-badge-row">
<span class="tile-chip">Cadence &amp; Audio</span>
</div>
<h3 class="tile-title">Pomodoro Timer</h3>
<p class="tile-desc">Binaural focus beats, ambient radio streaming, custom sprint cycles, and zero-distraction cues.</p>
</div>
</a>
<a href="/tools/mental-math/" class="tool-tile">
<div class="tile-icon-box">
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
</svg>
</div>
<div class="tile-core">
<div class="tile-badge-row">
<span class="tile-chip">Aptitude Engine</span>
</div>
<h3 class="tile-title">Mental Math Drills</h3>
<p class="tile-desc">High-intensity speed arithmetic. Practice rapid number recognition and calculation pairs under clock pressure.</p>
</div>
</a>
<a href="/tools/pyq-scanner/" class="tool-tile">
<div class="tile-icon-box">
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<circle cx="11" cy="11" r="7"></circle>
<line x1="21" y1="21" x2="16.5" y2="16.5"></line>
<line x1="11" y1="8" x2="11" y2="8.01"></line>
<line x1="11" y1="11" x2="11" y2="14"></line>
</svg>
</div>
<div class="tile-core">
<div class="tile-badge-row">
<span class="tile-chip">Database</span>
</div>
<h3 class="tile-title">PYQs Scanner</h3>
<p class="tile-desc">Instant client-side question archive. Query past competitive exam papers with real-time text matching.</p>
</div>
</a>
<a href="/tools/csv-viewer/" class="tool-tile">
<div class="tile-icon-box">
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<rect x="3" y="3" width="18" height="18" rx="2"></rect>
<line x1="3" y1="9" x2="21" y2="9"></line>
<line x1="3" y1="15" x2="21" y2="15"></line>
<line x1="9" y1="3" x2="9" y2="21"></line>
<line x1="15" y1="3" x2="15" y2="21"></line>
</svg>
</div>
<div class="tile-core">
<div class="tile-badge-row">
<span class="tile-chip">Analytics</span>
</div>
<h3 class="tile-title">Advanced CSV Viewer</h3>
<p class="tile-desc">Inspect massive tabular datasets on device. Instant column filtering, numeric sorting, and quick exports.</p>
</div>
</a>
</div>
</div>
<script>
(function() {
const canvas = document.getElementById('zenCanvas');
if (!canvas) return;
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
let pointer = { x: w / 2, y: h / 2, active: false };
window.addEventListener('resize', () => {
w = canvas.width = window.innerWidth;
h = canvas.height = window.innerHeight;
initNodes();
}, { passive: true });
function updatePointer(clientX, clientY) {
pointer.x = clientX;
pointer.y = clientY;
pointer.active = true;
}
window.addEventListener('mousemove', (e) => updatePointer(e.clientX, e.clientY), { passive: true });
window.addEventListener('touchmove', (e) => {
if (e.touches.length > 0) {
updatePointer(e.touches[0].clientX, e.touches[0].clientY);
}
}, { passive: true });
window.addEventListener('scroll', () => {
pointer.y += 3;
}, { passive: true });
const tiles = document.querySelectorAll('.tool-tile');
tiles.forEach(tile => {
tile.addEventListener('mousemove', (e) => {
const rect = tile.getBoundingClientRect();
tile.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
tile.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
});
});
const isMobile = window.innerWidth < 680;
const nodeCount = isMobile ? 24 : 36;
let nodes = [];
function initNodes() {
nodes = [];
for (let i = 0; i < nodeCount; i++) {
nodes.push({
x: Math.random() * w,
y: Math.random() * h,
vx: (Math.random() - 0.5) * 0.6,
vy: (Math.random() - 0.5) * 0.6,
radius: Math.random() * 1.5 + 0.8,
color: i % 2 === 0 ? 'rgba(192, 132, 252,' : 'rgba(16, 185, 129,'
});
}
}
initNodes();
function draw() {
ctx.clearRect(0, 0, w, h);
for (let i = 0; i < nodeCount; i++) {
let p1 = nodes[i];
p1.x += p1.vx;
p1.y += p1.vy;
if (p1.x < 0 || p1.x > w) p1.vx *= -1;
if (p1.y < 0 || p1.y > h) p1.vy *= -1;
if (pointer.active) {
let dx = pointer.x - p1.x;
let dy = pointer.y - p1.y;
let dist = Math.sqrt(dx * dx + dy * dy);
if (dist < 160) {
p1.x += dx * 0.012;
p1.y += dy * 0.012;
}
}
ctx.beginPath();
ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
ctx.fillStyle = p1.color + '0.75)';
ctx.fill();
for (let j = i + 1; j < nodeCount; j++) {
let p2 = nodes[j];
let dx = p1.x - p2.x;
let dy = p1.y - p2.y;
let dist = Math.sqrt(dx * dx + dy * dy);
if (dist < 130) {
ctx.beginPath();
ctx.moveTo(p1.x, p1.y);
ctx.lineTo(p2.x, p2.y);
let alpha = (1 - dist / 130) * 0.22;
ctx.strokeStyle = p1.color + alpha + ')';
ctx.lineWidth = 0.8;
ctx.stroke();
}
}
}
requestAnimationFrame(draw);
}
draw();
})();
</script>
