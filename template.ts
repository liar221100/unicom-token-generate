/**
 * HTML 模板文件
 * 使用 HTML 文件来实现更好的开发体验
 */

// 导入 HTML 模板文件
import baseTemplate from './template.html';

// HTML 转义函数
export function escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m] || m);
}

// 颜色配置（统一管理）
const FIELD_COLORS = [
    '#4facfe', // 🔵 蓝色 - 手机号
    '#ff5858', // 🔴 红色 - 密码
    '#00f260', // 🟢 绿色 - token_online
    '#f4d03f', // 🟡 黄色 - ecs_token
    '#e0c3fc'  // 🟣 紫色 - appid
];

// 生成彩色字段标签
function generateColoredLabel(): string {
    const labels = ['账号', '密码', 'token_online', 'ecs_token', 'appid'];
    const coloredLabels = labels.map((label, i) => {
        return `<span style="color:${FIELD_COLORS[i]}; font-weight:600;">${label}</span>`;
    });
    return coloredLabels.join('<span style="color:#888;">#</span>');
}

// 生成彩色 HTML 的辅助函数
export function generateColoredHtml(parts: string[]): string {
    const htmlParts = parts.map((part, i) => {
        const color = FIELD_COLORS[i % FIELD_COLORS.length];
        return `<span style="color:${color}; word-break: break-all;">${escapeHtml(part)}</span>`;
    });
    return htmlParts.join('<span style="color:#888; font-weight:bold;">#</span>');
}

// 生成成功结果的 HTML 片段
function renderSuccessResult(result: any): string {
    return `
    <div class="result" data-post-result="true">
        <h3>✅ 获取成功</h3>
        <label class="warn-label">完整数据（${generateColoredLabel()}，尽快保存关闭后无法找回）</label>
        
        <div class="code-box">
            ${result.colored_html}
        </div>
        
        <button class="copy-btn" onclick="copyText()">📋 一键复制完整数据</button>
        <textarea id="hidden-copy-text">${result.full_str}</textarea>
    </div>
    <script>
        // 立即改变 URL，防止刷新时重新提交 POST
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
        }
    </script>
  `;
}

// 生成错误结果的 HTML 片段
function renderErrorResult(result: any): string {
    return `
    <div class="result error-box">
        <h3>❌ 获取失败</h3>
        <p>${result.msg ? escapeHtml(result.msg) : '未知错误'}</p>
    </div>
  `;
}

// 主渲染函数：注入动态数据到 HTML 模板
export function renderTemplate(result: any = null): string {
    let resultHtml = '';

    if (result) {
        if (result.status === 'success') {
            resultHtml = renderSuccessResult(result);
        } else {
            resultHtml = renderErrorResult(result);
        }
    }

    // 将 HTML 模板转为字符串并注入结果
    const htmlString = String(baseTemplate);
    return htmlString.replace(
        '<div id="result-container"></div>',
        resultHtml
    );
}

