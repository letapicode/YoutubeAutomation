const fs = require('fs');
const { JSDOM } = require('jsdom');
let axe;
(async () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;
  global.MutationObserver = window.MutationObserver;
  axe = require('axe-core');
  const results = await axe.run(window.document);
  if (results.violations.length) {
    console.error('Accessibility violations found:');
    results.violations.forEach(v => {
      console.error(v.id, v.nodes.map(n => n.html).join('\n'));
    });
    process.exit(1);
  } else {
    console.log('No accessibility violations found');
  }
})();
