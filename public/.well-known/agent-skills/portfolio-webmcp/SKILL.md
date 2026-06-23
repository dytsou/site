# Portfolio WebMCP

Use in-browser WebMCP tools on Dong-You Tsou's personal portfolio at https://dy.tsou.me/.

## When to use

Load the site in a browser context that exposes `navigator.modelContext` or `document.modelContext`, then call the registered tools for navigation, project search, and site metadata.

## Tools

| Tool                      | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| `navigate`                | Open `/`, `/about/`, `/experiences/`, `/projects/`, or `/contact/`  |
| `get_site_info`           | Site name, URL, description, pages, and navigation links            |
| `search_projects`         | Search portfolio projects by title, description, technology, or tag |
| `get_experiences`         | Work, leadership, research, and education entries                   |
| `get_contact_info`        | Email, social links, resume, and calendar URLs                      |
| `get_theme` / `set_theme` | Read or switch light/dark theme                                     |

## Markdown access

Request any page with `Accept: text/markdown` for agent-friendly content without a browser session.

## Discovery

- MCP server card: `/.well-known/mcp/server-card.json`
- Agent skills index: `/.well-known/agent-skills/index.json`
- Auth and registration: `/auth.md`
