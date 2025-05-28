// src/utils/helpers.js

/**
 * 格式化日期字符串
 * @param {string} dateString 日期字符串
 * @param {object} options Intl.DateTimeFormat options
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
}

/**
 * 截断文本
 * @param {string} text 要截断的文本
 * @param {number} length 截断长度
 * @returns {string} 截断后的文本
 */
export function truncateText(text, length) {
  if (!text) return '';
  return text.length > length
    ? text.substring(0, length) + '...'
    : text;
}