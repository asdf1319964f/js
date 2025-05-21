// ==UserScript==
// @name         终极番号提取器 (FC2过滤修复)
// @description  精准提取多种格式的番号（增强识别）, 过滤常见误报，修复FC2过滤问题，悬浮面板显示，可随意复制
// @version      6.2
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_setClipboard
// @namespace    https://github.com/yourusername
// ==/UserScript==

(function() {
    'use strict';

    const AV_NUMBER_REGEX = new RegExp([
        '(?<!\\w|/|=|col-|\\d-|>)(?!jav|javdb|heyzo|SHINKI|JPNXXX|carib|vps)([A-Z]{2,6}[-\\s]?\\d{2,5})(?!\\d|[A-Za-z]{2,}|-\\d|\\.com|\\.\\d)',
        '(?<!\\w|/|\\\\|\\.|【|-|#|@|=)(?!jav|javdb|heyzo|SHINKI|JPNXXX|carib|and|vps|dvd)([A-Z]{2,6}\\s{0,2}\\d{3,4})(?!\\w|-|\\.|/|×|％|%|@|\\s?天| 于| 发表| 發表|歳| 歲|小时|分|系列| Min| day|ml| time|cm| ppi|\\.com)',
        '(?<!\\w)(?:PARATHD|3DSVR|STARSBD)[-\\s]?\\d{3,4}(?!\\w)',
        '(?<!\\w)(?:HIMEMIX|CASMANI|MGSSLND)[-\\s]?\\d{3}(?!\\w)',
        '(?<!\\w)(?:k|n)[01]?\\d{3,4}(?!\\w|-)',
        '(?<!\\w|\\d-|/)[01]\\d{5}[-_](?:1)?\\d{2,3}(?!\\w|-\\d)',
        '(?<!\\w)(?:carib|1pondo)[-_]\\d{6}[-_]\\d{2,3}(?!\\w)',
        '(?<!\\w|\\d-)\\d{6}[-_]\\d{2,3}(?:-1pon|-carib|-paco)(?!\\w)',
        '(?<!\\w|\\d-)\\d{6}_(?:1)?\d{3}_0[12](?!\\w|-\d)',
        'HEYZO[_-\\s]?(?:hd_)?\\d{4}',
        '(?<!\\w|-|/)\\d{3}[A-Z]{2,5}[-\\s]?\\d{3,4}(?!\\w|-|.torrent|年)',
        '(?<!\\w|/)FC2[^\\d]{0,5}\\d{6,7}',
        'HEYDOUGA[_-\\s]?\\d{4}-\\d{3,5}',
        '(?<!\\w)T28-\\d{3}',
        '(?<!\\w)T-2\\d{4,5}(?!\\w|-)',
        '(?<!\\w|-|/)[01]\\d{5}-[A-Z]{2,7}(?!\\w|-)',
        '(?<!\\w)MK(?:B)?D-S\\d{2,3}(?!\\w|-)',
        '(?:SHINKI|KITAIKE)[-\\s]?\\d{3}(?!\\w|-)',
        'JPNXXX[-\\s]?\\d{5}(?!\\w|-)',
        'xxx-av[-\\s]\\d{4,5}(?!\\w|-)',
        '(?<!\\w)crazyasia\\d{5}(?!\\w|-)',
        '(?<!\\w)PEWORLD\\d{5}(?!\\w|-)',
        '(?<!\\w)\\d{6}[-_]?_01(?=-10mu)?',
        'Jukujo-Club-\\d{3}',
    ].join('|'), 'gi');

    const EXCLUDE_ID_REGEX = /^(?:fx-?([^0]\d{2}|\d{4})|[a-zA-Z]+-?0{2,6}$|pg-13|crc-32|ea211|fs[\s-]?140|trc-20|erc-20|rs[\s-]?(232|422|485)|(sg|ae|kr|tw|ph|vn|kh|ru|uk|ua|tr|th|fr|in|de|sr)[\s-]\d{2}|(gm|ga)-\d{4}|cd[\s-]?\d{2,4}|seed[\s-]?\d{3}$|pc005|moc-\d{5}|wd-40|rtd[\s-]?\d{4}|cm\d{4}|rk\d{4})|ns[\s-]?\d{3,4}/i;
    const EXCLUDE_EN_REGEX = /^(?:about|ac|actg|aes|again|agm|ah|aim|all|ak|akko|apex|aptx|au|ax|avhd|avx|bej|bgm|chrome|bd|bm|build|(?:fc|p)?[blp]ga|by|bzk|cc|ccie|cctv|cea|ckg|class|cny|covid|cpu|code|debian|df|ds|dw|dx|ea|er|ecma|eia|emui|eof|ep|error|ez|fc|file|flash|flyme|fps|for|fork|from|fuck|fx|gbx|get|github|glm|gnz|gp|groupr|gt|gts|gtx|guest|hao|hd|her|hdr|hk|https?|hp|IEEE|il|ilc|ilce|imx|index|intel|inteli|ip|ipad|is|ISBN|iso|issue|issues|it|jav|javdb|joy|jp|jr|jsr|jt|jukujo|just|kc|keccak|kv[bd]|Kirin|lancet|line|linux|lk|lolrng|lpl|lt|lumia|lg|macos|math|md|mh|miui|mipc|mnvr|mm|mnvr|model|mv|mvp|ms|nas|nature|nc|next|ngff|note|number|ok|only|os|osx|pa|page|pch|phl|ppv|pmw|png|qbz|qsz|raid|rfc|ripemd|rmb|rng|rog|row|rtx|rush|rx|sale|scp|scte|sdm|sdr|server|sha|shp|sonnet|spent|sql|sn|snh|Socket|ssd|status|steam|su|swipe|tcp|the|to|top|than|thread|ts|type|uh|uhd|under|us|usa|usc|utf|utc|via|video|vkffsc|vol|vr|vs|vv|web|win|with|width|wikis|wta|xdr|xfx|xiaomi|yah)$/i;
    const EXCLUDE_WUMA_REGEX = /^(?:512gb)/i;

    let infoPanel = null;
    let infoContentArea = null;
    let toggleButton = null;
    let analysisMode = false;
    let highlightedElement = null;
    let isPanelVisible = false;

    GM_addStyle(`
        #av-extractor-btn {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 999998;
            background: linear-gradient(135deg, #6e48aa, #9d50bb);
            color: white;
            border: none;
            border-radius: 30px;
            padding: 12px 24px;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #av-extractor-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
        }
        #av-extractor-btn:active:not(:disabled) {
             transform: translateY(0);
             box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        #av-extractor-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        @keyframes fadein {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeout {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        #av-codes-info-panel {
            position: fixed;
            top: 25px;
            right: 25px;
            z-index: 999999;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            width: 300px;
            max-height: calc(100vh - 50px);
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: av-panel-slidein 0.3s ease-out;
            overflow: hidden;
        }

         @keyframes av-panel-slidein {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .av-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: #f0f0f0;
            border-bottom: 1px solid #ddd;
        }

        .av-panel-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }

        .av-panel-close {
            background: none;
            border: none;
            font-size: 20px;
            color: #888;
            cursor: pointer;
            padding: 0 5px;
            transition: color 0.2s ease;
        }

        .av-panel-close:hover {
            color: #555;
        }

        .av-panel-codes-area {
            flex-grow: 1;
            width: 100%;
            padding: 10px 15px;
            border: none;
            resize: none;
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
            font-size: 13px;
            line-height: 1.5;
            overflow-y: auto;
            box-sizing: border-box;
        }

        .av-panel-actions {
            display: flex;
            justify-content: flex-end;
            padding: 10px 15px;
            border-top: 1px solid #ddd;
            background-color: #f0f0f0;
        }

        .av-panel-actions button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease;
            background-color: #5cb85c;
            color: white;
        }

        .av-panel-actions button:hover {
            background-color: #4cae4c;
        }
    `);

    function extractCodes() {
        const potentialCodes = new Set();

        const markedElements = document.querySelectorAll(
            '[data-av], [data-av-number], .av-code, .av-number, .code'
        );
        markedElements.forEach(el => {
            const content = el.dataset.av || el.dataset.avNumber || el.textContent.trim();
            const matches = content.match(AV_NUMBER_REGEX);
            if (matches) {
                matches.forEach(match => potentialCodes.add(match));
            }
        });

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: node => {
                    if (node.textContent.length < 5 || !AV_NUMBER_REGEX.test(node.textContent)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (isIgnoredNode(node.parentElement)) {
                         return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while ((node = walker.nextNode())) {
            const matches = node.textContent.match(AV_NUMBER_REGEX);
            if (matches) {
                matches.forEach(match => potentialCodes.add(match));
            }
        }

        const uniqueFormattedCodes = Array.from(potentialCodes)
            .map(code => formatCode(code))
            .filter(code => {
                const normalized = code.replace(/-/g, '');

                if (normalized.length < 5) return false;
                if (/^\d+$/.test(normalized)) return false;
                if (/^[A-Z]+$/.test(normalized)) return false;
                // REMOVED: if (/^(QQ|FC)\d+$/.test(normalized)) return false; // This incorrectly filtered normalized FC2 numbers

                // Apply exclusion filters based on normalized code
                if (EXCLUDE_ID_REGEX.test(normalized)) return false;
                if (EXCLUDE_EN_REGEX.test(normalized)) return false;
                if (EXCLUDE_WUMA_REGEX.test(normalized)) return false;

                return true;
            })
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        return uniqueFormattedCodes;
    }

    function isIgnoredNode(element) {
        const ignoreSelectors = [
            'script', 'style', 'textarea', 'noscript', 'iframe', 'canvas', 'svg', 'audio', 'video',
            '.ignore', '.hidden', '.no-av', '.ad', '.footer', '.header', '.nav',
            '[aria-hidden="true"]', '[style*="display:none"]', '[style*="visibility:hidden"]'
        ];
        return element.closest(ignoreSelectors.join(','));
    }

    function formatCode(code) {
        let formatted = code.toUpperCase();
        formatted = formatted.replace(/[_ ]/g, '-');
        formatted = formatted.replace(/^FC2(?:-?PPV)?-?/, 'FC2-');
        formatted = formatted.replace(/([A-Z])(\d)/g, '$1-$2');
        formatted = formatted.replace(/-{2,}/g, '-');
        formatted = formatted.replace(/^-|-$/g, '');
        formatted = formatted.replace(/[^\w-]/g, '');
        formatted = formatted.replace(/_/g, '-');
        formatted = formatted.replace(/-{2,}/g, '-');
        formatted = formatted.replace(/^-|-$/g, '');
        return formatted;
    }

    function showToast(message) {
        if (typeof GM_notification === 'function') {
            GM_notification({
                text: message,
                timeout: 3000,
                title: '番号提取器'
            });
        } else {
            const toast = document.createElement('div');
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '70px',
                right: '25px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '4px',
                zIndex: '999999',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                fontSize: '14px',
                opacity: '0',
                transition: 'opacity 0.5s ease-in-out',
                pointerEvents: 'none'
            });
            toast.textContent = message;
            document.body.appendChild(toast);

            requestAnimationFrame(() => {
                 toast.style.opacity = '1';
            });

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.addEventListener('transitionend', () => toast.remove(), { once: true });
            }, 2500);
        }
    }

    async function copyToClipboard(text) {
        try {
            if (typeof GM_setClipboard === 'function') {
                GM_setClipboard(text, 'text');
            } else {
                await navigator.clipboard.writeText(text);
            }
            showToast(`✅ 已复制 ${text.split('\n').length} 个番号`);
            return true;
        } catch (err) {
            console.error('复制失败:', err);
            showToast('❌ 复制失败，请手动复制');
            return false;
        }
    }

    function initInfoPanel() {
        const existingPanel = document.getElementById('av-codes-info-panel');
        if (existingPanel) {
             infoPanel = existingPanel;
        } else {
            infoPanel = document.createElement('div');
            infoPanel.id = 'av-codes-info-panel';
            document.body.appendChild(infoPanel);
        }

        infoPanel.style.display = 'none';
        isPanelVisible = false;
    }

    function toggleInfoPanel(codes) {
        if (!infoPanel) return;

        if (isPanelVisible) {
            infoPanel.style.display = 'none';
            infoPanel.innerHTML = '';
            isPanelVisible = false;
        } else {
            if (!codes || codes.length === 0) {
                 showToast('⚠ 未找到番号');
                 return;
            }
            populateInfoPanel(codes);
            infoPanel.style.display = 'flex';
            isPanelVisible = true;
        }
    }

    function populateInfoPanel(codes) {
        if (!infoPanel) return;

        infoPanel.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'av-panel-header';

        const title = document.createElement('span');
        title.className = 'av-panel-title';
        title.textContent = `提取到 ${codes.length} 个番号`;
        header.appendChild(title);

        const closeButton = document.createElement('button');
        closeButton.className = 'av-panel-close';
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', () => toggleInfoPanel());
        header.appendChild(closeButton);

        infoPanel.appendChild(header);

        const codesArea = document.createElement('textarea');
        codesArea.className = 'av-panel-codes-area';
        codesArea.value = codes.join('\n');
        codesArea.setAttribute('readonly', 'true');
        infoPanel.appendChild(codesArea);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'av-panel-actions';

        const copyButton = document.createElement('button');
        copyButton.className = 'av-panel-copy';
        copyButton.textContent = '📋 复制全部';
        copyButton.addEventListener('click', async () => {
            await copyToClipboard(codesArea.value);
        });
        buttonContainer.appendChild(copyButton);

        infoPanel.appendChild(buttonContainer);
    }

    function initFloatingButton() {
        const oldBtn = document.getElementById('av-extractor-btn');
        if (oldBtn) oldBtn.remove();

        const btn = document.createElement('button');
        btn.id = 'av-extractor-btn';
        btn.innerHTML = `🎬 提取番号`;
        btn.title = '点击提取当前页面中的番号';

        GM_addStyle(`
            #av-extractor-btn {
                position: fixed;
                bottom: 25px;
                right: 25px;
                z-index: 999998;
                background: linear-gradient(135deg, #6e48aa, #9d50bb);
                color: white;
                border: none;
                border-radius: 30px;
                padding: 12px 24px;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #av-extractor-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            }
            #av-extractor-btn:active:not(:disabled) {
                 transform: translateY(0);
                 box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            #av-extractor-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            @keyframes fadein {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeout {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            #av-codes-info-panel {
                position: fixed;
                top: 25px;
                right: 25px;
                z-index: 999999;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                width: 300px;
                max-height: calc(100vh - 50px);
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                animation: av-panel-slidein 0.3s ease-out;
                overflow: hidden;
            }

             @keyframes av-panel-slidein {
                from { transform: translateX(20px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .av-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background-color: #f0f0f0;
                border-bottom: 1px solid #ddd;
            }

            .av-panel-title {
                font-size: 16px;
                font-weight: bold;
                color: #333;
            }

            .av-panel-close {
                background: none;
                border: none;
                font-size: 20px;
                color: #888;
                cursor: pointer;
                padding: 0 5px;
                transition: color 0.2s ease;
            }

            .av-panel-close:hover {
                color: #555;
            }

            .av-panel-codes-area {
                flex-grow: 1;
                width: 100%;
                padding: 10px 15px;
                border: none;
                resize: none;
                font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
                font-size: 13px;
                line-height: 1.5;
                overflow-y: auto;
                box-sizing: border-box;
            }

            .av-panel-actions {
                display: flex;
                justify-content: flex-end;
                padding: 10px 15px;
                border-top: 1px solid #ddd;
                background-color: #f0f0f0;
            }

            .av-panel-actions button {
                padding: 8px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s ease;
                background-color: #5cb85c;
                color: white;
            }

            .av-panel-actions button:hover {
                background-color: #4cae4c;
            }
        `);

        btn.addEventListener('click', async () => {
            if (isPanelVisible) {
                toggleInfoPanel();
                btn.innerHTML = `🎬 提取番号`;
                btn.disabled = false;
            } else {
                btn.innerHTML = '🔍 扫描中...';
                btn.disabled = true;

                try {
                    const codes = extractCodes();
                    toggleInfoPanel(codes);

                    if (codes.length > 0) {
                         btn.innerHTML = `📋 ${codes.length}个番号`;
                    } else {
                         btn.innerHTML = '❌ 未找到';
                    }

                } catch (err) {
                    console.error('提取失败:', err);
                    showToast('❌ 提取失败');
                    btn.innerHTML = '⚠ 出错';
                } finally {
                    setTimeout(() => {
                         btn.innerHTML = '🎬 提取番号';
                         btn.disabled = false;
                    }, isPanelVisible ? 0 : 2000);
                }
            }
        });

        document.body.appendChild(btn);
    }

    function init() {
        initInfoPanel();
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(initFloatingButton, 100);
        } else {
            window.addEventListener('DOMContentLoaded', () => setTimeout(initFloatingButton, 100));
        }
         window.addEventListener('load', () => setTimeout(initFloatingButton, 500));
    }

    init();
})();
