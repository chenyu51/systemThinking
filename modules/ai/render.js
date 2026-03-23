function escapeAIMarkdownHTML(value) {
  return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function renderInlineMarkdown(text) {
  return escapeAIMarkdownHTML(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#eef2f7;padding:1px 5px;border-radius:4px;">$1</code>');
}

function renderAIMarkdown(markdown) {
  const lines = String(markdown || '').replace(/\r/g, '').split('\n');
  const html = [];
  let inList = false, inCode = false, codeLines = [];
  const closeList = () => { if (inList) html.push('</ul>'); inList = false; };
  const closeCode = () => {
    if (!inCode) return;
    html.push(`<pre style="white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.6;color:#1f2937;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;overflow:auto;"><code>${escapeAIMarkdownHTML(codeLines.join('\n'))}</code></pre>`);
    inCode = false; codeLines = [];
  };
  lines.forEach((line) => {
    if (line.trim().startsWith('```')) { inCode ? closeCode() : (closeList(), inCode = true); return; }
    if (inCode) return void codeLines.push(line);
    if (!line.trim()) { closeList(); return; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const sizes = { 1: 18, 2: 16, 3: 14 };
      html.push(`<div style="font-size:${sizes[heading[1].length]}px;font-weight:700;color:#0f172a;margin:8px 0 6px;">${renderInlineMarkdown(heading[2])}</div>`);
      return;
    }
    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      if (!inList) { html.push('<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;">'); inList = true; }
      html.push(`<li style="line-height:1.7;color:#334155;">${renderInlineMarkdown(listItem[1])}</li>`);
      return;
    }
    closeList();
    html.push(`<div style="line-height:1.8;color:#334155;margin:6px 0;">${renderInlineMarkdown(line)}</div>`);
  });
  closeList();
  closeCode();
  return html.join('') || '<div style="color:#94a3b8;">-</div>';
}

function renderAIResultView(resultBox, aiResult) {
  resultBox.innerHTML = '';
  const buildSection = (title, content, open = true) => {
    const details = document.createElement('details');
    details.open = open;
    details.style.cssText = 'border:1px solid #e2e8f0;border-radius:10px;background:#fff;margin-bottom:10px;overflow:hidden;';
    const summary = Object.assign(document.createElement('summary'), { textContent: title });
    summary.style.cssText = 'cursor:pointer;list-style:none;padding:10px 12px;font-weight:600;color:#0f172a;background:#f8fafc;border-bottom:1px solid #e2e8f0;';
    const body = document.createElement('div');
    body.style.cssText = 'padding:12px;';
    body.appendChild(content);
    details.append(summary, body);
    return details;
  };
  const main = document.createElement(aiResult.answer ? 'div' : 'pre');
  main.style.cssText = aiResult.answer
    ? 'font-size:13px;max-height:320px;overflow:auto;'
    : 'white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.5;color:#555;max-height:220px;overflow:auto;';
  if (aiResult.answer) main.innerHTML = renderAIMarkdown(aiResult.answer);
  else main.textContent = JSON.stringify(aiResult.graph, null, 2);
  const rawPre = Object.assign(document.createElement('pre'), { textContent: JSON.stringify(aiResult.raw, null, 2) });
  rawPre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.5;color:#555;max-height:240px;overflow:auto;margin:0;';
  resultBox.append(
    buildSection(aiResult.answer ? (i18n.currentLang === 'zh-CN' ? '问答结果' : 'Answer') : i18n.t('ai.result'), main, true),
    buildSection(i18n.t('ai.rawResponse'), rawPre, false)
  );
}

Object.assign(window, { renderAIMarkdown, renderAIResultView });
