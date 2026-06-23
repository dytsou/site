# dy.tsou.me auth.md

Agent authentication and registration for Dong-You Tsou's personal portfolio.

## Audience

AI agents interacting with https://dy.tsou.me/

## Discovery

1. Protected Resource Metadata: `/.well-known/oauth-protected-resource`
2. Authorization Server Metadata: `/.well-known/oauth-authorization-server`
3. MCP Server Card: `/.well-known/mcp/server-card.json`
4. Agent Skills: `/.well-known/agent-skills/index.json`

## Access model

Public portfolio pages require no credentials. Request pages with `Accept: text/markdown` for agent-friendly content, or load the site in a browser context to use WebMCP tools via `navigator.modelContext`.

### Anonymous (read-only)

No registration is required for read-only access.

- Supported scope: `site.read`
- Credential type: none
- WebMCP tools are available after loading https://dy.tsou.me/ in a browser session

## WebMCP tools

| Tool                      | Purpose                    |
| ------------------------- | -------------------------- |
| `navigate`                | Open site pages            |
| `get_site_info`           | Site metadata and routes   |
| `search_projects`         | Search portfolio projects  |
| `get_experiences`         | Work and education history |
| `get_contact_info`        | Contact links and calendar |
| `get_theme` / `set_theme` | Read or switch color theme |

## Contact

Email: contact@dy.tsou.me
