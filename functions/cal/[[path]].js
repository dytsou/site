import { proxySubsite } from '../_proxy.js';

const CAL_ORIGIN = 'https://cal.tsou.me';

export const onRequest = (context) =>
  proxySubsite(context, { origin: CAL_ORIGIN, stripPrefix: '/cal' });
