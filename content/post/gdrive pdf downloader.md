---
title: "Jailbreaking View Only PDFs: Google Drive Hack"
date: 2026-08-01
draft: false
author: "Rana"
---

**"Extractor by Rana"** is a lightweight browser script that bypasses Google Drive's highly secure "view-only" file restrictions.

## ✨ Features

* **PDF Extraction:**
  * **Text to .md file:** I included the Markdown (`.md`) option instead of `.txt` because it is much easier for both humans and AI to understand.
  * **Scanned PDFs:** Click "Extract as image" to process the file. It will open a new window displaying all the images, which you can easily save by pressing `Ctrl + P`.
* **Custom Page Export:** Loads only specific pages so that everything doesn't load at once, keeping your hardware running smoothly without overload.
* **User-Friendly Interface:** Includes resizing, minimize options, and a dark AMOLED purple theme.
* **Special Note:** While not exactly a feature, this script was built with immense hard work by successfully bypassing Google's high security.

<!-- Responsive Images -->
<div style="display: flex; flex-direction: column; gap: 20px; align-items: center; margin-bottom: 30px;">
  <img src="/images/image1.png" alt="Extractor by Rana UI 1" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
  <img src="/images/image2.png" alt="Extractor by Rana UI 2" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
</div>

## 🛠️ How to Use It

You don't need to be a programmer to use this. You just need the code and a couple of seconds. Choose the method that suits your vibe:

### Method 1: The "Hacker" Way (Direct Paste)
*Best if you are on a school/library computer or don't want to install extensions.*

1. Open your locked PDF in Google Drive.
2. Press `F12` on your keyboard (or `Ctrl + Shift + I`) to open Developer Tools.
3. Click on the **Console** tab at the top.
4. Paste the entire Extractor by Rana code where the cursor is blinking and hit `Enter`.
5. **Boom.** The sleek purple control panel will instantly appear in the bottom-right corner of your screen. You can close the Developer Tools and start extracting!

### Method 2: The "Set It and Forget It" Way (Tampermonkey)
*Using the Tampermonkey Chrome Extension for custom scripts.*

If you don't know how to add a new script, [watch this quick tutorial](https://youtu.be/7LWOBkKhbGk?si=wj7ZYLKfWgbw7Dx8). You just have to paste the code below into a new Tampermonkey script.

## 💻 The Code

```javascript
// ==UserScript==
// @name         Google Drive Extractor by Rana (v23.0 Final)
// @namespace    http://tampermonkey.net/
// @version      23.0
// @description  Minimize, Resize, Auto-Print Images, Perfect v18 Text Engine
// @match        https://drive.google.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let collectedTextPages = {};
    let collectedImagePages = {};
    let isScrolling = false;
    let scrollerInterval = null;

    // ✨ TRUSTED TYPES BYPASS ✨
    let secureHTML;
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        try {
            const policy = window.trustedTypes.createPolicy('rana-policy', { createHTML: (string) => string });
            secureHTML = (html) => policy.createHTML(html);
        } catch (e) { secureHTML = (html) => html; }
    } else { secureHTML = (html) => html; }

    // ✨ NETWORK INTERCEPTOR ✨
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url; return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        this.addEventListener('load', function () {
            // Text Capture
            if (this._url && this._url.includes('presspage')) {
                try {
                    const pageMatch = this._url.match(/page=(\d+)/);
                    const pageNum = pageMatch ? parseInt(pageMatch[1]) : Object.keys(collectedTextPages).length + 1;
                    let res = this.responseText;
                    if (res.startsWith(")]}'")) res = res.substring(4);
                    let data = JSON.parse(res);
                    let pageStrings = [];

                    function extractStrings(obj) {
                        if (typeof obj === 'string') {
                            let str = obj.trim();
                            if (str.length > 0 && !str.startsWith('file://') && !str.startsWith('http') && !str.includes('rgba')) pageStrings.push(str);
                        } else if (typeof obj === 'object' && obj !== null) {
                            for (let key in obj) extractStrings(obj[key]);
                        }
                    }
                    extractStrings(data);

                    if (pageStrings.length > 0) {
                        let rawPageText = pageStrings.join(" ");
                        rawPageText = rawPageText.replace(/Vision\s*Ias.*?Page\s*\d+/gi, '');
                        rawPageText = rawPageText.replace(/Page\s*\d+\s*of\s*\d+/gi, '');
                        collectedTextPages[pageNum] = rawPageText.trim();
                        updateButtonStatus(pageNum);
                    }
                } catch (e) { console.error("Parse error:", e); }
            }
            // Image Capture
            if (this._url && this._url.includes('img?id=')) {
                const pageMatch = this._url.match(/page=(\d+)/);
                if (pageMatch) {
                    const pageNum = parseInt(pageMatch[1]) + 1;
                    collectedImagePages[pageNum] = this._url;
                    updateButtonStatus(pageNum);
                }
            }
        });
        return origSend.apply(this, arguments);
    };

    // ✨ UI CREATION (With Minimize & Resize) ✨
    let panel;
    const initTimer = setInterval(() => {
        if (document.body) { clearInterval(initTimer); buildUI(); }
    }, 500);

    function buildUI() {
        panel = document.createElement('div');
        // Added resize:both and overflow:hidden for the resize corner
        panel.style.cssText = 'position:fixed; bottom:30px; right:30px; z-index:9999999; width:280px; min-width:220px; background:#000000; border:2px solid #581c87; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.9); font-family:sans-serif; color:white; display:flex; flex-direction:column; overflow:hidden; resize:both;';
        
        panel.innerHTML = secureHTML(`
            <div id="rana-header" style="background:#2e1065; padding:12px 15px; cursor:move; user-select:none; border-bottom:1px solid #4c1d95; display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:15px; margin:0; color:#d8b4fe; letter-spacing: 0.5px;">✨ Extractor by Rana</strong>
                <span id="rana-min-btn" style="cursor:pointer; font-size:12px; color:#e9d5ff; padding:2px 8px; background:#4c1d95; border-radius:4px; font-weight:bold;">➖</span>
            </div>
            <div id="rana-body" style="padding:15px; display:flex; flex-direction:column; gap:12px; height:100%; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; gap:10px;">
                    <div style="flex:1;">
                        <label style="font-size:12px; color:#c084fc;">Start Page:</label>
                        <input type="number" id="rana-start" value="1" style="width:100%; padding:8px; margin-top:5px; background:#120524; color:white; border:1px solid #581c87; border-radius:6px; text-align:center; box-sizing:border-box;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:12px; color:#c084fc;">End Page:</label>
                        <input type="number" id="rana-end" value="50" style="width:100%; padding:8px; margin-top:5px; background:#120524; color:white; border:1px solid #581c87; border-radius:6px; text-align:center; box-sizing:border-box;">
                    </div>
                </div>
                
                <button id="rana-text-btn" style="width:100%; padding:10px; background:#581c87; color:#e9d5ff; border:1px solid #7e22ce; border-radius:6px; font-weight:bold; cursor:pointer; transition:0.2s; font-size:13px;">📄 Extract Text (.md)</button>
                <button id="rana-img-btn" style="width:100%; padding:10px; background:#4c1d95; color:#e9d5ff; border:1px solid #7e22ce; border-radius:6px; font-weight:bold; cursor:pointer; transition:0.2s; font-size:13px;">🖼️ Extract Images (.pdf)</button>
                
                <div style="font-size:10.5px; color:#facc15; text-align:center; margin-top:4px; line-height:1.4;">
                    💡 <b>Tip:</b> Zoom in PDF before extracting images for High Quality.
                </div>
            </div>
        `);
        document.body.appendChild(panel);
        attachEvents();
    }

    let activeBtn = null;

    function updateButtonStatus(pageNum) {
        if (isScrolling && activeBtn) {
            activeBtn.innerText = `⏳ Loading Page ${pageNum}...`;
            activeBtn.style.background = '#7e22ce';
        }
    }

    function attachEvents() {
        const header = document.getElementById('rana-header');
        const minBtn = document.getElementById('rana-min-btn');
        const body = document.getElementById('rana-body');
        let isDragging = false, offsetX, offsetY;

        // Minimize / Maximize Logic
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent drag event
            if (body.style.display === 'none') {
                body.style.display = 'flex';
                minBtn.innerText = '➖';
                panel.style.resize = 'both';
            } else {
                body.style.display = 'none';
                minBtn.innerText = '➕';
                panel.style.resize = 'none'; // Disable resize when minimized
            }
        });

        // Draggable Logic
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            let rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.right = 'auto'; 
            panel.style.bottom = 'auto';
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => { isDragging = false; });

        const btnText = document.getElementById('rana-text-btn');
        const btnImg = document.getElementById('rana-img-btn');
        btnText.addEventListener('click', () => startExtraction('text', btnText));
        btnImg.addEventListener('click', () => startExtraction('image', btnImg));
    }

    function startExtraction(mode, btnElement) {
        const btnText = document.getElementById('rana-text-btn');
        const btnImg = document.getElementById('rana-img-btn');

        if (isScrolling) {
            clearInterval(scrollerInterval);
            isScrolling = false;
            btnText.innerText = '📄 Extract Text (.md)';
            btnImg.innerText = '🖼️ Extract Images (.pdf)';
            btnText.style.background = '#581c87';
            btnImg.style.background = '#4c1d95';
            return;
        }

        const startPage = parseInt(document.getElementById('rana-start').value);
        const endPage = parseInt(document.getElementById('rana-end').value);
        const activeCollection = mode === 'text' ? collectedTextPages : collectedImagePages;

        if (startPage > endPage || isNaN(startPage) || isNaN(endPage)) {
            alert("Invalid page numbers!"); return;
        }

        isScrolling = true;
        activeBtn = btnElement;
        activeBtn.style.background = '#ca8a04'; 
        activeBtn.style.color = '#ffffff';
        activeBtn.innerText = `⏳ Starting Scroll...`;

        let lastScroll = -1;
        let stuckCount = 0;

        scrollerInterval = setInterval(() => {
            let scrolled = false;
            let currentScroll = 0;

            let driveWrappers = document.querySelectorAll('.drive-viewer-paginated-scroll-wrapper, .drive-viewer-paginated-scroll-server');
            for (let el of driveWrappers) {
                if (el.scrollHeight > el.clientHeight) {
                    el.scrollTop += 900;
                    currentScroll = el.scrollTop;
                    scrolled = true;
                }
            }

            if (!scrolled) {
                let allDivs = document.querySelectorAll('div');
                for (let el of allDivs) {
                    let style = window.getComputedStyle(el);
                    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.clientHeight > window.innerHeight * 0.4 && el.clientWidth > window.innerWidth * 0.4) {
                        el.scrollTop += 900;
                        currentScroll = el.scrollTop;
                        scrolled = true; break;
                    }
                }
            }

            document.activeElement.blur(); 
            window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'PageDown', 'keyCode': 34, 'bubbles': true }));
            window.scrollBy(0, 900);

            if (currentScroll === lastScroll && currentScroll !== 0) {
                stuckCount++;
            } else { stuckCount = 0; }
            lastScroll = currentScroll;

            if (activeCollection[endPage] || stuckCount > 20) {
                clearInterval(scrollerInterval);
                isScrolling = false;
                
                activeBtn.innerText = '✅ Processing...';
                activeBtn.style.background = '#059669';
                
                setTimeout(() => {
                    if (mode === 'text') generateMarkdown(startPage, endPage);
                    else generateImagePDF(startPage, endPage);
                    
                    setTimeout(() => {
                        btnText.innerText = '📄 Extract Text (.md)';
                        btnImg.innerText = '🖼️ Extract Images (.pdf)';
                        btnText.style.background = '#581c87';
                        btnImg.style.background = '#4c1d95';
                    }, 3000);
                }, 1000);
            }
        }, 500); 
    }

    // ==========================================
    // ✨ CORE V18 TEXT FORMATTING ENGINE ✨
    // ==========================================
    function generateMarkdown(start, end) {
        let validPages = Object.keys(collectedTextPages).map(Number).filter(p => p >= start && p <= end).sort((a, b) => a - b);
        if (validPages.length === 0) { alert("No text found! Check page range."); return; }

        let fullDocumentText = collectedTextPages[validPages[0]];
        for (let i = 1; i < validPages.length; i++) {
            let nextPageText = collectedTextPages[validPages[i]];
            let overlapLength = 0;
            let endChunk = fullDocumentText.slice(-150);
            let startChunk = nextPageText.slice(0, 150);
            for (let j = Math.min(endChunk.length, startChunk.length); j > 5; j--) {
                if (endChunk.endsWith(startChunk.slice(0, j))) { overlapLength = j; break; }
            }
            fullDocumentText += (overlapLength > 0 ? "" : " ") + nextPageText.substring(overlapLength).trim();
        }

        fullDocumentText = fullDocumentText.replace(/\s+([.,:;?])/g, '$1');
        let classRegex = /(Class\s*\d+:\s*.*?)\s*(\d{1,2}\s*[A-Za-z]+\s*\d{4})\s*(\d{2}:\d{2})?/gi;
        fullDocumentText = fullDocumentText.replace(classRegex, (match, p1, p2, p3) => `\n\n# ${p1.trim()}\n> *${p2.trim()}${p3 ? ', ' + p3 : ''}*\n\n`);
        let boldRegex = /(?:^|\.\s+|\n+)([A-Z][a-zA-Z0-9\s&(),'-]{2,80}):\s+/g;
        fullDocumentText = fullDocumentText.replace(boldRegex, '\n\n**$1:** ');

        const tableKeywords = ['United Kingdom', 'United States', 'Ireland', 'Canada', 'Australia', 'Germany', 'South Africa', 'France', 'USSR', 'Japan', 'Russia'];
        tableKeywords.forEach(keyword => {
            let regex = new RegExp(`\\s+(${keyword})\\s+([A-Z])`, 'g');
            fullDocumentText = fullDocumentText.replace(regex, '\n\n- **$1:** $2');
        });

        fullDocumentText = fullDocumentText.replace(/\s*•\s*/g, '\n- ');
        fullDocumentText = fullDocumentText.replace(/([.?!])\s+([A-Z])/g, '$1\n\n$2');
        fullDocumentText = fullDocumentText.replace(/(\[\d+\]\.)\n\n([A-Z])/g, '$1 $2');
        fullDocumentText = fullDocumentText.replace(/\n(\d{1,2}\.)\s/g, '\n\n$1 ');
        fullDocumentText = fullDocumentText.replace(/\n([a-z]\))\s/g, '\n\n$1 ');
        fullDocumentText = fullDocumentText.replace(/ {2,}/g, ' ');
        fullDocumentText = fullDocumentText.replace(/\n{3,}/g, '\n\n');

        const docTitle = (document.querySelector('.drive-viewer-title') || document.querySelector('[role="heading"]'))?.innerText.trim() || 'Notes';
        let mdContent = `# ${docTitle}\n> *Extracted by Rana | Pages: ${start} to ${end}*\n\n---\n\n` + fullDocumentText.trim();

        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([mdContent], { type: 'text/markdown;charset=utf-8' }));
        a.download = `${docTitle.replace(/[^a-zA-Z0-9_\-]/g, '_')}_Text.md`;
        a.click();
    }

    // ==========================================
    // ✨ ENHANCED AUTO-PRINT IMAGE PDF ENGINE ✨
    // ==========================================
    function generateImagePDF(start, end) {
        let validPages = Object.keys(collectedImagePages).map(Number).filter(p => p >= start && p <= end).sort((a, b) => a - b);
        if (validPages.length === 0) { alert("No images found! Make sure to scroll slightly first."); return; }

        const docTitle = (document.querySelector('.drive-viewer-title') || document.querySelector('[role="heading"]'))?.innerText.trim() || 'Scanned_Notes';
        let printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            alert("Pop-up blocked! Please allow pop-ups for Google Drive so the PDF can be saved.");
            return;
        }

        let htmlContent = `
            <html>
            <head>
                <title>${docTitle}</title>
                <style>
                    @page { margin: 0; size: auto; }
                    body { margin: 0; padding: 0; background: white; }
                    img { width: 100vw; height: 100vh; object-fit: contain; display: block; margin: 0; page-break-after: always; }
                </style>
            </head>
            <body>
        `;

        validPages.forEach(p => {
            htmlContent += `<img src="${collectedImagePages[p]}" alt="Page ${p}">`;
        });

        // 🧠 The Magic Code: Waits for all images to completely load, then forcefully opens the Save Dialog
        htmlContent += `
            <script>
                window.onload = function() {
                    Promise.all(Array.from(document.images).map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(res => { img.onload = res; img.onerror = res; });
                    })).then(() => {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    });
                };
            </script>
            </body></html>
        `;

        printWindow.document.write(secureHTML(htmlContent));
        printWindow.document.close();
    }
})();

```


