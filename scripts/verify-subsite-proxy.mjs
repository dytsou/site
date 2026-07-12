import assert from 'node:assert/strict';
import { buildTarget } from '../functions/_proxy.js';

// cal.tsou.me serves at root; strip /cal so dy.tsou.me/cal/* maps correctly.
assert.equal(
  buildTarget('https://dy.tsou.me/cal/', {
    origin: 'https://cal.tsou.me',
    stripPrefix: '/cal',
  }),
  'https://cal.tsou.me/'
);
assert.equal(
  buildTarget('https://dy.tsou.me/cal', {
    origin: 'https://cal.tsou.me',
    stripPrefix: '/cal',
  }),
  'https://cal.tsou.me/'
);
assert.equal(
  buildTarget('https://dy.tsou.me/cal/asset/favicon.png', {
    origin: 'https://cal.tsou.me',
    stripPrefix: '/cal',
  }),
  'https://cal.tsou.me/asset/favicon.png'
);
assert.equal(
  buildTarget('https://dy.tsou.me/cal/?view=week', {
    origin: 'https://cal.tsou.me',
    stripPrefix: '/cal',
  }),
  'https://cal.tsou.me/?view=week'
);

console.log('verify-subsite-proxy: ok');
