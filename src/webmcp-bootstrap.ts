import { waitAndRegisterWebMcpTools } from './agent/webmcp';

const controller = new AbortController();

function bootWebMcp() {
  waitAndRegisterWebMcpTools(controller.signal);
}

if (document.readyState === 'complete') {
  bootWebMcp();
} else {
  window.addEventListener('load', bootWebMcp, { once: true });
}
