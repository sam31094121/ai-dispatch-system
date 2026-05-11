const fs = require('fs');

function readLatin1(path) {
  return fs.readFileSync(path).toString('latin1');
}

function writeLatin1(path, text) {
  fs.writeFileSync(path, Buffer.from(text, 'latin1'));
}

function repairClosingTags(text) {
  const tags = [
    'title',
    'div',
    'span',
    'p',
    'h1',
    'h2',
    'h3',
    'button',
    'textarea',
    'th',
    'strong',
    'small',
    'section',
    'article',
    'pre',
    'a'
  ];

  for (const tag of tags) {
    text = text.replace(new RegExp(`(?<!<)/${tag}>`, 'g'), `</${tag}>`);
  }
  return text;
}

function replaceBetween(text, start, end, replacement) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex + start.length);
  if (startIndex === -1 || endIndex === -1) return text;
  return text.slice(0, startIndex) + replacement + text.slice(endIndex);
}

{
  const path = 'public/index.html';
  let text = readLatin1(path);
  text = replaceBetween(
    text,
    '<title>',
    '  <meta name="theme-color"',
    [
      '<title>Zhaogui AI Dispatch</title>',
      '  <meta name="description" content="Zhaogui AI Dispatch dashboard and mobile ranking view">',
      '  <meta property="og:title" content="Zhaogui AI Dispatch">',
      '  <meta property="og:description" content="AI dispatch dashboard with official top-five ranking cards">',
      ''
    ].join('\r\n')
  );
  text = repairClosingTags(text);
  text = text.replace(/<div class="splash-logo">.*?<\/div>/, '<div class="splash-logo">AI</div>');
  writeLatin1(path, text);
}

{
  const path = 'public/mobile.html';
  let text = readLatin1(path);
  text = replaceBetween(
    text,
    '  <meta name="apple-mobile-web-app-title"',
    '  <meta property="og:type"',
    [
      '  <meta name="apple-mobile-web-app-title" content="AI Dispatch">',
      '  <meta name="description" content="Mobile AI dispatch ranking and LINE announcement view">',
      '  <title>Zhaogui AI Dispatch Mobile</title>',
      '  <meta property="og:title" content="Zhaogui AI Dispatch Mobile">',
      '  <meta property="og:description" content="Mobile AI dispatch ranking and LINE announcement view">',
      ''
    ].join('\r\n')
  );
  text = repairClosingTags(text);
  text = text.replace(/<div class="splash-logo">.*?<\/div>/, '<div class="splash-logo">AI</div>');
  text = text.replace(/<section id="a1-hero"[^>]*>/, '<section id="a1-hero" aria-label="A1 top ranking cards">');
  text = text.replace(/<input id="lookup-input"[^>]*>/, '<input id="lookup-input" type="search" placeholder="Search name" autocomplete="off">');
  writeLatin1(path, text);
}
