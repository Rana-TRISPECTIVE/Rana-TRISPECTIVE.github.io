---
title: "About"
date: 2026-04-10
description: ""
draft: false
menu: "main"
weight: 10
---

<style>
/* 1. AMOLED Background Fix (Pure Black for the entire page) */
body {
    background-color: #000000 !important;
}

/* 2. Custom Purple Scrollbar */
::-webkit-scrollbar {
    width: 8px;
}
::-webkit-scrollbar-track {
    background: #050505;
}
::-webkit-scrollbar-thumb {
    background: #7b2cbf;
    border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
    background: #9d4edd;
}

/* 3. Hide Default Footer and Bottom Icons */
footer, .footer, #footer, .site-footer, .social-icons {
    display: none !important;
}

:root {
    --deep-purple: #240046;
    --vibrant-purple: #7b2cbf;
    --accent-cyan: #00f5d4;
    --text-main: #e0e1dd;
    --glass-bg: rgba(123, 44, 191, 0.05);
    --glass-border: rgba(123, 44, 191, 0.2);
}

@keyframes slideUpFade {
    0% { opacity: 0; transform: translateY(30px); filter: blur(5px); }
    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}

/* Container set to transparent so it blends perfectly with the black body */
.about-page-container {
    background-color: transparent; 
    color: var(--text-main);
    font-family: 'Inter', sans-serif;
    line-height: 1.8;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
}

.hero-title {
    font-size: clamp(2.5rem, 8vw, 4rem);
    font-weight: 900;
    background: linear-gradient(to right, #9d4edd, var(--accent-cyan));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
    margin-bottom: 40px;
    animation: slideUpFade 0.8s ease-out forwards;
}

.premium-section {
    background: var(--glass-bg);
    border-left: 4px solid var(--vibrant-purple);
    border-radius: 0 15px 15px 0;
    padding: 30px;
    margin-bottom: 30px;
    backdrop-filter: blur(5px);
    border-top: 1px solid var(--glass-border);
    border-right: 1px solid var(--glass-border);
    border-bottom: 1px solid var(--glass-border);
    animation: slideUpFade 1s ease-out both;
}

.premium-section h2 {
    color: var(--vibrant-purple);
    font-size: 1.8rem;
    margin-top: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.premium-section h2::before {
    content: "◈";
    font-size: 1.2rem;
    color: var(--accent-cyan);
}

.highlight-purple { color: #c77dff; font-weight: 700; }
.highlight-cyan { color: var(--accent-cyan); font-weight: 600; font-style: italic; }

/* Clean Topic Grid (Fields only, no descriptions) */
.concept-grid { 
    display: flex; 
    flex-wrap: wrap; 
    gap: 15px; 
    margin-top: 20px; 
    list-style: none;
    padding: 0;
}
.concept-grid li {
    background: rgba(255, 255, 255, 0.03);
    padding: 12px 25px;
    border-radius: 8px;
    border: 1px solid var(--glass-border);
    font-weight: bold;
    font-size: 1.1rem;
    color: var(--text-main);
    transition: 0.3s;
    letter-spacing: 1px;
}
.concept-grid li:hover { 
    background: var(--vibrant-purple); 
    border-color: var(--accent-cyan); 
    transform: translateY(-3px); 
}

/* Minimal Connect Section */
.connect-section {
    text-align: center;
    padding: 40px 20px;
    margin-top: 50px;
    animation: slideUpFade 1.2s ease-out both;
}
.connect-text {
    font-size: 1.15rem;
    margin-bottom: 25px;
    color: var(--text-main);
}
.dark-insta-icon {
    display: inline-block;
    transition: transform 0.3s ease, filter 0.3s ease;
}
.dark-insta-icon:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 0 12px rgba(123, 44, 191, 0.8));
}
</style>

<div class="about-page-container">

<h1 class="hero-title">TRISPECTIVE</h1>

<p style="text-align: center; font-size: 1.3rem; opacity: 0.9; margin-bottom: 50px;">
    Hello! I’m <span class="highlight-purple">Rana</span>, and this is my digital diary, an extension of my thoughts and evolving understanding.
</p>

<div class="premium-section" style="animation-delay: 0.2s;">
    <h2>Why the name "TRISPECTIVE"?</h2>
    <p>“TRISPECTIVE” stands for <strong>The Third Perspective</strong>.</p>
    <p>Most things in the world are seen in duality, two sides, two extremes. Religion and Science are often treated as opposing forces. But I believe truth often exists in the <span class="highlight-cyan">pattern between them</span>, a perspective we usually ignore.</p>
</div>

<div class="premium-section" style="animation-delay: 0.4s;">
    <h2>Blogging in the Era of AI</h2>
    <p>I use AI as a <span class="highlight-purple">strategic partner</span>, not a writer. It handles the <strong>“body”</strong> (structure, grammar), but the <strong>“soul”</strong> (core ideas, the third perspective) comes entirely from me.</p>
    <p>This blog is as much for my growth as it is for yours.</p>
</div>

<div class="premium-section" style="animation-delay: 0.6s;">
    <h2>What you’ll find here</h2>
    <p>This website is not limited to one subject. Instead, it brings together a unique mix of ideas from different fields, such as:</p>
    <ul class="concept-grid">
        <li>Philosophy</li>
        <li>Religion</li>
        <li>Science</li>
        <li>Society</li>
    </ul>
</div>

<div class="premium-section" style="animation-delay: 0.8s;">
    <h2>My Perspective</h2>
    <p>Everything here reflects my <span class="highlight-cyan">current exploration</span>. It is not absolute truth. You are free to disagree, and your feedback is a vital part of my development.</p>
</div>

<div class="premium-section" style="animation-delay: 1s; border-left-color: var(--accent-cyan);">
    <h2>The Real Purpose</h2>
    <p>This is a <strong>personal project</strong>. I write when curiosity strikes. Consistency? None. It depends entirely on my mood and discovery.</p>
</div>

<div class="premium-section" style="animation-delay: 1.1s;">
    <h2>Guest Thoughts</h2>
    <p>If you have ideas but no platform, <span class="highlight-purple">TRISPECTIVE welcomes you</span>. I'm open to publishing your work here, free of cost.</p>
</div>

<div class="connect-section">
    <p class="connect-text">If you’d like to connect, discuss ideas, or share feedback, feel free to reach out on Instagram:</p>
    <a href="https://instagram.com/about_.rrr" class="dark-insta-icon" target="_blank" rel="noopener noreferrer">
        <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="var(--vibrant-purple)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
    </a>
</div>

</div>

<script>
document.addEventListener("DOMContentLoaded", function() {
    let lastScrollTop = 0;
    // Selecting common header tags. Vibrantshadows usually uses <header> or a .navbar class
    const header = document.querySelector('header') || document.querySelector('.navbar'); 
    
    if (header) {
        // Ensure header is positioned so transform works
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '1000';
        header.style.transition = 'transform 0.3s ease-in-out';

        window.addEventListener('scroll', function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > 50) {
                // Scrolling down
                header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                header.style.transform = 'translateY(0)';
            }
            lastScrollTop = scrollTop;
        });
    }
});
</script>
