const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../ytapp/public/locales');
const onboarding = {
  welcome_title: 'Welcome',
  guide_select_audio: 'Select an audio file',
  guide_generate: 'Click Generate to create your video',
  guide_upload: 'Use Generate & Upload to post to YouTube'
};
const extras = {
  clear_completed: 'Clear Completed',
  update_available: 'Update Available',
  update_prompt: 'A new version is ready to install.',
  update_now: 'Update Now',
  later: 'Later',
  font_search: 'Search fonts...'
};

const watermark = {
  watermark: 'Watermark',
  watermark_position: 'Watermark Position',
  watermark_opacity: 'Watermark Opacity',
  watermark_scale: 'Watermark Scale'
};

const keys = { ...onboarding, ...extras, ...watermark };
for (const locale of fs.readdirSync(localeDir)) {
  const file = path.join(localeDir, locale, 'translation.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;
  for (const [k, v] of Object.entries(keys)) {
    if (!(k in data)) { data[k] = v; changed = true; }
  }
  if (changed) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
