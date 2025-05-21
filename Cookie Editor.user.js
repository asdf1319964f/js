// ==UserScript==
// @name         Cookie Editor
// @namespace    https://linux.do/u/f-droid
// @version      1.0
// @description  Cookie编辑器，支持编辑、删除、添加、导出、导入、复制和粘贴
// @license      GNU Affero General Public License v3.0 or later
// @author       F-Droid
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        .cookie-editor-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            width: 40px;
            height: 40px;
            background-size: cover;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .cookie-editor-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        .cookie-editor-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #ffffff;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 1001;
            width: 400px;
            max-width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .cookie-editor-modal h2 {
            margin-top: 0;
            font-size: 20px;
            color: #333;
        }
        .cookie-editor-modal p {
            margin: 10px 0;
            color: #666;
        }
        .cookie-editor-modal textarea {
            width: 100%;
            height: 150px;
            margin-bottom: 10px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-family: monospace;
            resize: vertical;
        }
        .cookie-editor-modal button {
            padding: 8px 16px;
            margin: 5px;
            border: none;
            border-radius: 5px;
            background-color: #4CAF50;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .cookie-editor-modal button:hover {
            background-color: #45a049;
        }
        .cookie-editor-modal button.delete {
            background-color: #f44336;
        }
        .cookie-editor-modal button.delete:hover {
            background-color: #e53935;
        }
        .cookie-editor-modal button.close {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: transparent;
            color: #888;
            font-size: 20px;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .cookie-editor-modal button.close:hover {
            color: #333;
        }
        .cookie-editor-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .cookie-editor-table th, .cookie-editor-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        .cookie-editor-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #333;
        }
        .cookie-editor-table input {
            width: 100%;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
            box-sizing: border-box;
        }
        .cookie-editor-table input:focus {
            border-color: #4CAF50;
            outline: none;
        }
        .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .footer a {
            color: #007BFF;
            text-decoration: none;
        }
    `);

    function getFavicon() {
        const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        return favicon ? favicon.href : 'https://linux.do/user_avatar/linux.do/f-droid/288/228666_2.png';
    }

    const button = document.createElement('button');
    button.className = 'cookie-editor-btn';
    button.style.backgroundImage = `url('${getFavicon()}')`;
    document.body.appendChild(button);

    let isDragging = false;
    let offsetX, offsetY;

    button.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - button.getBoundingClientRect().left;
        offsetY = e.clientY - button.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            button.style.left = `${e.clientX - offsetX}px`;
            button.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    button.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        offsetX = touch.clientX - button.getBoundingClientRect().left;
        offsetY = touch.clientY - button.getBoundingClientRect().top;
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const touch = e.touches[0];
            button.style.left = `${touch.clientX - offsetX}px`;
            button.style.top = `${touch.clientY - offsetY}px`;
        }
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    button.addEventListener('click', () => {
        const modal = createMainPanel();
        document.body.appendChild(modal);

        const closeButton = modal.querySelector('.close');
        closeButton.addEventListener('click', () => {
            modal.remove();
        });
    });

    function createMainPanel() {
        const modal = document.createElement('div');
        modal.className = 'cookie-editor-modal';

        const domain = window.location.hostname;
        modal.innerHTML = `
            <h2>Cookie Editor</h2>
            <p>当前域名:<strong>${domain}</strong></p>
            <div>
                <button class="open-manage">管理Cookie</button>
                <button class="open-import-export">导入/导出Cookie</button>
            </div>
            <button class="close">❌</button>
        `;

        const footer = document.createElement('div');
        footer.className = 'footer';
        footer.innerHTML = `Copyright &copy; ${new Date().getFullYear()} <a href="https://linux.do/u/f-droid" target="_blank">F-Droid</a> retain all rights reserved.<br>如果您喜欢这个工具，请给作者点个赞吧！😊`;
        modal.appendChild(footer);

        const openManageButton = modal.querySelector('.open-manage');
        openManageButton.addEventListener('click', () => {
            modal.remove();
            const manageModal = createManagePanel();
            document.body.appendChild(manageModal);

            const closeButton = manageModal.querySelector('.close');
            closeButton.addEventListener('click', () => {
                manageModal.remove();
            });
        });

        const openImportExportButton = modal.querySelector('.open-import-export');
        openImportExportButton.addEventListener('click', () => {
            modal.remove();
            const importExportModal = createImportExportPanel();
            document.body.appendChild(importExportModal);

            const closeButton = importExportModal.querySelector('.close');
            closeButton.addEventListener('click', () => {
                importExportModal.remove();
            });
        });

        return modal;
    }

    function createManagePanel() {
        const modal = document.createElement('div');
        modal.className = 'cookie-editor-modal';

        const domain = window.location.hostname;
        modal.innerHTML = `
            <h2>Cookie管理</h2>
            <p>当前域名:<strong>${domain}</strong></p>
            <table class="cookie-editor-table">
                <thead>
                    <tr>
                        <th>名称</th>
                        <th>值</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
            <button class="close">❌</button>
        `;

        const footer = document.createElement('div');
        footer.className = 'footer';
        footer.innerHTML = `Copyright &copy; ${new Date().getFullYear()} <a href="https://linux.do/u/f-droid" target="_blank">F-Droid</a> retain all rights reserved.<br>如果您喜欢这个工具，请给作者点个赞吧！😊`;
        modal.appendChild(footer);

        const table = modal.querySelector('.cookie-editor-table tbody');
        loadCookies(table);

        return modal;
    }

    function createImportExportPanel() {
        const modal = document.createElement('div');
        modal.className = 'cookie-editor-modal';

        const domain = window.location.hostname;
        modal.innerHTML = `
            <h2>导入/导出Cookie</h2>
            <p>当前域名:<strong>${domain}</strong></p>
            <textarea placeholder="在此粘贴JSON格式的Cookie..."></textarea>
            <button class="import">导入Cookie</button>
            <button class="export">导出Cookie</button>
            <button class="copy">复制Cookie</button>
            <button class="paste">粘贴Cookie</button>
            <button class="close">❌</button>
        `;

        const footer = document.createElement('div');
        footer.className = 'footer';
        footer.innerHTML = `Copyright &copy; ${new Date().getFullYear()} <a href="https://linux.do/u/f-droid" target="_blank">F-Droid</a> retain all rights reserved.<br>如果您喜欢这个工具，请给作者点个赞吧！😊`;
        modal.appendChild(footer);

        const exportButton = modal.querySelector('.export');
        exportButton.addEventListener('click', () => {
            const cookies = getCookies();
            const json = JSON.stringify({ domain, cookies }, null, 2);
            downloadJSON(json, 'cookies.json');
            alert('Cookie导出成功！');
        });

        const importButton = modal.querySelector('.import');
        importButton.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (!data.domain || !data.cookies) {
                            throw new Error('无效的JSON格式');
                        }
                        if (data.domain !== domain) {
                            throw new Error('Cookie域名与当前域名不匹配');
                        }
                        setCookies(data.cookies);
                        alert('Cookie导入成功！');
                    } catch (error) {
                        alert('导入失败:' + error.message);
                    }
                };
                reader.readAsText(file);
            });
            fileInput.click();
        });

        const copyButton = modal.querySelector('.copy');
        copyButton.addEventListener('click', () => {
            const cookies = getCookies();
            const json = JSON.stringify({ domain, cookies }, null, 2);
            navigator.clipboard.writeText(json).then(() => {
                alert('Cookie已复制到剪贴板！');
            }).catch(() => {
                alert('复制失败！');
            });
        });

        const pasteButton = modal.querySelector('.paste');
        pasteButton.addEventListener('click', () => {
            const textarea = modal.querySelector('textarea');
            try {
                const data = JSON.parse(textarea.value);
                if (!data.domain || !data.cookies) {
                    throw new Error('无效的JSON格式');
                }
                if (data.domain !== domain) {
                    throw new Error('Cookie域名与当前域名不匹配');
                }
                setCookies(data.cookies);
                alert('Cookie粘贴成功！');
            } catch (error) {
                alert('粘贴失败:' + error.message);
            }
        });

        return modal;
    }

    function loadCookies(table) {
        table.innerHTML = '';
        const cookies = getCookies();
        cookies.forEach((cookie, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" value="${cookie.name}"></td>
                <td><input type="text" value="${cookie.value}"></td>
                <td>
                    <button class="save">保存</button>
                    <button class="delete">删除</button>
                </td>
            `;
            table.appendChild(row);

            const saveButton = row.querySelector('.save');
            saveButton.addEventListener('click', () => {
                const nameInput = row.querySelector('input[type="text"]');
                const valueInput = row.querySelector('input[type="text"]:nth-child(2)');
                const name = nameInput.value.trim();
                const value = valueInput.value.trim();
                if (name && value) {
                    document.cookie = `${name}=${value}; path=/`;
                    loadCookies(table);
                }
            });

            const deleteButton = row.querySelector('.delete');
            deleteButton.addEventListener('click', () => {
                document.cookie = `${cookie.name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                loadCookies(table);
            });
        });
    }

    function getCookies() {
        return document.cookie.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return { name, value };
        });
    }

    function setCookies(cookies) {
        cookies.forEach(cookie => {
            document.cookie = `${cookie.name}=${cookie.value}; path=/`;
        });
    }

    function downloadJSON(json, filename) {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
})();