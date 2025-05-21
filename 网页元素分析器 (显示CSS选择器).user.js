// ==UserScript==
// @name         网页元素分析器 (显示CSS选择器)
// @description  悬停时高亮元素并在面板中显示其详细信息，包括CSS选择器
// @version      1.1
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    let analysisMode = false;
    let highlightedElement = null;
    let infoPanel = null;
    let toggleButton = null;

    GM_addStyle(`
        #element-analyzer-toggle-btn {
            position: fixed;
            bottom: 25px;
            left: 25px;
            z-index: 999999;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 15px;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: background-color 0.2s ease;
        }
        #element-analyzer-toggle-btn:hover {
            background-color: #2980b9;
        }

        .userscript-analyzer-highlight {
            outline: 2px solid #e74c3c !important;
            box-shadow: 0 0 8px rgba(231, 76, 60, 0.6) !important;
            transition: outline 0.1s ease, box-shadow 0.1s ease;
        }

        #element-analyzer-info-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 999999;
            background-color: rgba(44, 62, 80, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.4);
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
            font-size: 12px;
            max-width: 350px;
            max-height: 250px;
            overflow-y: auto;
            pointer-events: none;
            display: none;
            word-break: break-word;
            line-height: 1.5;
        }

        #element-analyzer-info-panel strong {
            color: #f1c40f;
            display: inline-block;
            min-width: 80px;
            vertical-align: top;
        }

        #element-analyzer-info-panel span {
             display: inline-block;
             max-width: calc(100% - 90px);
             vertical-align: top;
        }

        #element-analyzer-info-panel .selector {
             color: #3498db;
             font-weight: bold;
             font-size: 13px;
             word-break: break-all;
        }
         #element-analyzer-info-panel p {
             margin: 0 0 8px 0;
         }
         #element-analyzer-info-panel p:last-child {
             margin-bottom: 0;
         }
    `);

    function initToggleButton() {
        if (document.getElementById('element-analyzer-toggle-btn')) {
            toggleButton = document.getElementById('element-analyzer-toggle-btn');
        } else {
            toggleButton = document.createElement('button');
            toggleButton.id = 'element-analyzer-toggle-btn';
             document.body.appendChild(toggleButton);
        }

        updateToggleButton();

        if (!toggleButton.dataset.listenerAdded) {
            toggleButton.addEventListener('click', () => {
                analysisMode = !analysisMode;
                updateToggleButton();
                if (analysisMode) {
                    enableAnalysis();
                } else {
                    disableAnalysis();
                }
            });
             toggleButton.dataset.listenerAdded = 'true';
        }
    }

    function updateToggleButton() {
        if (toggleButton) {
            if (analysisMode) {
                toggleButton.textContent = '元素分析 (开启)';
                toggleButton.style.backgroundColor = '#27ae60';
            } else {
                toggleButton.textContent = '元素分析 (关闭)';
                toggleButton.style.backgroundColor = '#3498db';
            }
        }
    }

    function initInfoPanel() {
        if (document.getElementById('element-analyzer-info-panel')) {
            infoPanel = document.getElementById('element-analyzer-info-panel');
        } else {
            infoPanel = document.createElement('div');
            infoPanel.id = 'element-analyzer-info-panel';
            document.body.appendChild(infoPanel);
        }
         infoPanel.style.display = 'none';
    }

    function enableAnalysis() {
        document.body.addEventListener('mouseover', handleMouseOver);
        document.body.addEventListener('mouseout', handleMouseOut, true);
        infoPanel.style.display = 'block';
        console.log('[Element Analyzer] Analysis mode enabled.');
    }

    function disableAnalysis() {
        document.body.removeEventListener('mouseover', handleMouseOver);
        document.body.removeEventListener('mouseout', handleMouseOut, true);
        removeHighlight();
        infoPanel.style.display = 'none';
        console.log('[Element Analyzer] Analysis mode disabled.');
    }

    function handleMouseOver(event) {
        if (isScriptElement(event.target)) {
            return;
        }

        if (event.target !== highlightedElement) {
            removeHighlight();
            highlightedElement = event.target;
            applyHighlight(highlightedElement);
            updateInfoPanel(highlightedElement);
        }
    }

    function handleMouseOut(event) {
        if (highlightedElement && !highlightedElement.contains(event.relatedTarget)) {
        }
    }

    function isScriptElement(element) {
        return element.closest('#element-analyzer-toggle-btn, #element-analyzer-info-panel') !== null;
    }

    function applyHighlight(element) {
        if (element && typeof element.classList !== 'undefined') {
            element.classList.add('userscript-analyzer-highlight');
        }
    }

    function removeHighlight() {
        if (highlightedElement && typeof highlightedElement.classList !== 'undefined') {
            highlightedElement.classList.remove('userscript-analyzer-highlight');
        }
    }

    function updateInfoPanel(element) {
        if (!infoPanel || !element || typeof element.tagName === 'undefined') {
            infoPanel.style.display = 'none';
            return;
        }

        const tagName = element.tagName.toLowerCase();
        const id = element.id;
        const classes = Array.from(element.classList);

        let simpleSelector = tagName;
        if (id) {
            simpleSelector += `#${id}`;
        }
        if (classes.length > 0) {
            simpleSelector += `.${classes.join('.')}`;
        }

        const textContent = element.textContent.trim();
        const displayLength = 100;
        const truncatedText = textContent.length > displayLength ?
                              textContent.substring(0, displayLength) + '...' :
                              textContent;

        infoPanel.innerHTML = `
            <p><strong>标签:</strong> <span>${tagName}</span></p>
            ${id ? `<p><strong>ID:</strong> <span>${id}</span></p>` : ''}
            ${classes.length > 0 ? `<p><strong>类名:</strong> <span>${classes.join(' ')}</span></p>` : ''}
            <p><strong>选择器:</strong> <span class="selector">${escapeHTML(simpleSelector)}</span></p>
            <p><strong>文本内容:</strong> <span>${escapeHTML(truncatedText) || '(无)'}</span></p>
             ${element.href ? `<p><strong>链接 (href):</strong> <span>${escapeHTML(element.href)}</span></p>` : ''}
             ${element.src ? `<p><strong>来源 (src):</strong> <span>${escapeHTML(element.src)}</span></p>` : ''}
        `;

        if (infoPanel.style.display === 'none') {
             infoPanel.style.display = 'block';
        }
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function initUI() {
        initToggleButton();
        initInfoPanel();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initUI();
    } else {
        window.addEventListener('DOMContentLoaded', initUI);
    }

})();
