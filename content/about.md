---
title: "About"
date: 2026-04-10
description: ""
draft: false
menu: "main"
weight: 10
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
--c-purple-glow: rgba(192, 132, 252, 0.35);
--c-cyan: #00f5d4;
--c-cyan-glow: rgba(0, 245, 212, 0.3);
--c-text-primary: #f1f5f9;
--c-text-secondary: #94a3b8;
--font-display: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-body: 'Lexend', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
#aboutCanvas {
position: fixed;
top: 0;
left: 0;
width: 100vw;
height: 100vh;
pointer-events: none;
z-index: 0;
opacity: 0.6;
}
.about-editorial-wrap {
position: relative;
z-index: 2;
max-width: 760px;
margin: 0 auto;
padding: 2rem 1.25rem 6rem 1.25rem;
font-family: var(--font-body);
color: var(--c-text-primary);
box-sizing: border-box;
line-height: 1.85;
}
.about-header {
text-align: center;
margin-bottom: 4rem;
}
.hero-title {
font-family: var(--font-display);
font-size: clamp(3rem, 7.5vw, 4.8rem);
font-weight: 900;
letter-spacing: -0.04em;
line-height: 1.05;
margin: 0 0 1.25rem 0;
background: linear-gradient(135deg, #ffffff 30%, var(--c-purple) 70%, var(--c-cyan) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
filter: drop-shadow(0 0 25px rgba(192, 132, 252, 0.25));
}
.intro-lead {
font-family: var(--font-body);
font-size: 1.25rem;
color: var(--c-text-secondary);
line-height: 1.7;
margin: 0 auto;
max-width: 620px;
font-weight: 400;
}
.editorial-stream {
display: flex;
flex-direction: column;
gap: 3rem;
}
.editorial-block {
position: relative;
padding: 0 0 2.5rem 0;
border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.editorial-block:last-child {
border-bottom: none;
padding-bottom: 0;
}
.editorial-block h2 {
font-family: var(--font-display);
font-size: 1.6rem;
font-weight: 700;
letter-spacing: -0.02em;
color: #ffffff;
margin: 0 0 1.1rem 0;
display: flex;
align-items: center;
gap: 12px;
}
.editorial-block h2::before {
content: "";
display: inline-block;
width: 6px;
height: 6px;
border-radius: 50%;
background: var(--c-cyan);
box-shadow: 0 0 10px var(--c-cyan);
flex-shrink: 0;
}
.editorial-block p {
font-family: var(--font-body);
margin: 0 0 1rem 0;
font-size: 1.05rem;
color: var(--c-text-secondary);
line-height: 1.85;
}
.editorial-block p:last-child {
margin-bottom: 0;
}
.highlight-purple {
color: var(--c-purple);
font-weight: 600;
text-shadow: 0 0 14px var(--c-purple-glow);
}
.highlight-cyan {
color: var(--c-cyan);
font-weight: 600;
text-shadow: 0 0 14px var(--c-cyan-glow);
}
strong {
color: #ffffff;
font-weight: 600;
}
.concept-grid {
display: flex;
flex-wrap: wrap;
gap: 12px;
margin: 1.4rem 0 0 0;
padding: 0;
list-style: none;
}
.concept-grid li {
font-family: var(--font-display);
background: rgba(14, 10, 24, 0.55);
border: 1px solid rgba(192, 132, 252, 0.22);
padding: 8px 20px;
border-radius: 9999px;
font-size: 0.88rem;
font-weight: 700;
letter-spacing: 0.05em;
text-transform: uppercase;
color: #f1f5f9;
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
cursor: default;
}
.concept-grid li:hover {
background: rgba(192, 132, 252, 0.15);
border-color: var(--c-cyan);
color: #ffffff;
transform: translateY(-2px);
box-shadow: 0 8px 20px -6px var(--c-cyan-glow);
}
.connect-section {
text-align: center;
margin-top: 4.5rem;
padding: 3rem 1.5rem;
background: radial-gradient(circle at 50% 0%, rgba(192, 132, 252, 0.08) 0%, rgba(14, 10, 24, 0.4) 70%);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 24px;
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
}
.connect-text {
font-family: var(--font-body);
font-size: 1.1rem;
color: var(--c-text-primary);
margin: 0 0 1.5rem 0;
line-height: 1.6;
}
.insta-pill {
font-family: var(--font-display);
display: inline-flex;
align-items: center;
gap: 10px;
padding: 10px 24px;
border-radius: 9999px;
background: rgba(192, 132, 252, 0.08);
border: 1px solid rgba(192, 132, 252, 0.3);
color: #ffffff;
text-decoration: none !important;
font-weight: 600;
font-size: 0.95rem;
transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
.insta-pill:hover {
background: var(--c-purple);
border-color: var(--c-purple);
color: #07040d;
transform: translateY(-2px);
box-shadow: 0 12px 30px -6px var(--c-purple-glow);
}
.insta-pill svg {
stroke: currentColor;
transition: transform 0.3s ease;
}
.insta-pill:hover svg {
transform: scale(1.1);
}
@media (max-width: 680px) {
.about-editorial-wrap {
padding: 1.25rem 1rem 5rem 1rem;
}
.about-header {
margin-bottom: 2.8rem;
}
.hero-title {
font-size: 2.8rem;
}
.intro-lead {
font-size: 1.1rem;
}
.editorial-stream {
gap: 2.2rem;
}
.editorial-block {
padding-bottom: 2rem;
}
.editorial-block h2 {
font-size: 1.35rem;
}
.editorial-block p {
font-size: 0.98rem;
}
.connect-section {
margin-top: 3.5rem;
padding: 2.2rem 1.2rem;
}
}
</style>
<canvas id="aboutCanvas"></canvas>
<div class="about-editorial-wrap">
<header class="about-header">
<h1 class="hero-title">TRISPECTIVE</h1>
<p class="intro-lead">
Hello! I’m <span class="highlight-purple">Rana</span>, and this is my digital diary, an extension of my thoughts and evolving understanding.
</p>
</header>
<div class="editorial-stream">
<div class="editorial-block">
<h2>Why the name "TRISPECTIVE"?</h2>
<p>“TRISPECTIVE” stands for <strong>The Third Perspective</strong>.</p>
<p>Most things in the world are seen in duality, two sides, two extremes. Religion and Science are often treated as opposing forces. But I believe truth often exists in the <span class="highlight-cyan">pattern between them</span>, a perspective we usually ignore.</p>
</div>
<div class="editorial-block">
<h2>Blogging in the Era of AI</h2>
<p>I use AI as a <span class="highlight-purple">strategic partner</span>, not a writer. It handles the <strong>“body”</strong> (structure, grammar), but the <strong>“soul”</strong> (core ideas, the third perspective) comes entirely from me.</p>
<p>This blog is as much for my growth as it is for yours.</p>
</div>
<div class="editorial-block">
<h2>What you’ll find here</h2>
<p>This website is not limited to one subject. Instead, it brings together a unique mix of ideas from different fields, such as:</p>
<ul class="concept-grid">
<li>Philosophy</li>
<li>Religion</li>
<li>Science</li>
<li>Society</li>
<li>Technology</li>
</ul>
</div>
<div class="editorial-block">
<h2>My Perspective</h2>
<p>Everything here reflects my <span class="highlight-cyan">current exploration</span>. It is not absolute truth. You are free to disagree, and your feedback is a vital part of my development.</p>
</div>
<div class="editorial-block">
<h2>The Real Purpose</h2>
<p>This is a <strong>personal project</strong>. I write when curiosity strikes. Consistency? None. It depends entirely on my mood and discovery.even i Purposefully make this website Not discoverable through search engines. Access is reserved for those who find their way here through my profiles or a direct link.</p>
</div>
<div class="editorial-block">
<h2>Guest Thoughts</h2>
<p>If you have ideas but no platform, <span class="highlight-purple">TRISPECTIVE welcomes you</span>. I'm open to publishing your work here, free of cost.</p>
</div>
</div>
<div class="connect-section">
<p class="connect-text">If you’d like to connect, discuss ideas, or share feedback, feel free to reach out on Instagram:</p>
<a href="https://instagram.com/about_.rrr" class="insta-pill" target="_blank" rel="noopener noreferrer">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
</svg>
<span>@about_.rrr</span>
</a>
</div>
</div>
<script>
(function() {
const canvas = document.getElementById('aboutCanvas');
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
function updatePointer(x, y) {
pointer.x = x;
pointer.y = y;
pointer.active = true;
}
window.addEventListener('mousemove', (e) => updatePointer(e.clientX, e.clientY), { passive: true });
window.addEventListener('touchmove', (e) => {
if (e.touches.length > 0) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
window.addEventListener('scroll', () => { pointer.y += 3; }, { passive: true });
const isMobile = window.innerWidth < 680;
const nodeCount = isMobile ? 22 : 36;
let nodes = [];
function initNodes() {
nodes = [];
for (let i = 0; i < nodeCount; i++) {
nodes.push({
x: Math.random() * w,
y: Math.random() * h,
vx: (Math.random() - 0.5) * 0.55,
vy: (Math.random() - 0.5) * 0.55,
radius: Math.random() * 1.5 + 0.8,
color: i % 2 === 0 ? 'rgba(192, 132, 252,' : 'rgba(0, 245, 212,'
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
