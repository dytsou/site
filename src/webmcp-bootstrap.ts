import { registerWebMcpTools } from './agent/webmcp';

function bootWebMcp() {
  if (registerWebMcpTools()) return;
  document.addEventListener('DOMContentLoaded', () => registerWebMcpTools(), {
    once: true,
  });
}

bootWebMcp();
