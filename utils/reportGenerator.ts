export const generateReportHtml = (data: any, language: string = 'zh'): string => {
    const isZh = language === 'zh';
    
    return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
            h1 { color: #0f172a; border-bottom: 2px solid #ff6b00; padding-bottom: 10px; }
            h2, h3 { color: #1e293b; }
            .header { text-align: center; margin-bottom: 40px; }
            .meta { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #0ea5e9; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
            th { background-color: #f1f5f9; }
            .content { white-space: pre-wrap; background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 30px; }
            .footer { margin-top: 50px; font-size: 0.85em; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .warning { color: #b91c1c; background: #fef2f2; padding: 10px; border-radius: 4px; font-weight: bold; margin-bottom: 30px; border-left: 4px solid #ef4444; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${data.title}</h1>
            <p><strong>SailGuard AI / 鹭起南洋</strong></p>
        </div>
        
        <div class="meta">
            ${Object.entries(data.meta || {}).map(([key, val]) => `<div><strong>${key}:</strong> ${val ?? (isZh ? '暂无数据' : 'No data')}</div>`).join('')}
        </div>

        ${data.warning ? `<div class="warning">${data.warning}</div>` : ''}

        ${data.contentHtml || (data.content ? `<div class="content">${data.content}</div>` : '')}
        
        ${data.table ? `
            <table>
                <thead>
                    <tr>${data.table.headers.map((h: string) => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.table.rows.map((row: any[]) => `<tr>${row.map(cell => `<td>${cell ?? (isZh ? '暂无' : 'N/A')}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        ` : ''}

        <div class="footer">
            ${isZh ? '本报告由 AI 生成，仅供业务参考，不构成正式法律意见。' : 'This report is AI-generated for business reference only and does not constitute legal advice.'}
            <br/>Generated at: ${new Date().toLocaleString()}
        </div>
    </body>
    </html>
    `;
};

export const downloadHtmlReport = (data: any, filename: string, language: string = 'zh') => {
    const html = generateReportHtml(data, language);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const downloadMarkdownReport = (data: any, filename: string, language: string = 'zh') => {
    const isZh = language === 'zh';
    let md = `# ${data.title}\n\n**SailGuard AI / 鹭起南洋**\n\n`;
    
    if (data.meta) {
        Object.entries(data.meta).forEach(([key, val]) => {
            md += `**${key}:** ${val ?? (isZh ? '暂无数据' : 'No data')}\n\n`;
        });
    }

    if (data.warning) {
        md += `> **WARNING / 风险提示:** ${data.warning}\n\n`;
    }

    if (data.content) {
        md += `## Content\n\n${data.content}\n\n`;
    }
    
    if (data.table) {
        md += `| ${data.table.headers.join(' | ')} |\n`;
        md += `| ${data.table.headers.map(() => '---').join(' | ')} |\n`;
        data.table.rows.forEach((row: any[]) => {
            md += `| ${row.map(cell => cell ?? (isZh ? '暂无' : 'N/A')).join(' | ')} |\n`;
        });
        md += `\n`;
    }

    md += `---\n*${isZh ? '本报告由 AI 生成，仅供业务参考，不构成正式法律意见。' : 'This report is AI-generated for business reference only and does not constitute legal advice.'}*\n*Generated at: ${new Date().toLocaleString()}*`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
