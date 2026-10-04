# Private click insights

The owner opens `/insights/`, selects a page, date range and visitor screen size, then opens its heatmap. No SQL is needed. The report starts at the overview and presents target counts, shares, daily activity and a real-page preview.

## Data and meaning

Public links/buttons with an authored `data-heatmap-target` send one bounded event to `/api/click-events`. Pages validates its Origin, size and exact shared schema before writing `CLICK_EVENTS`. It stores page, target, layout/build, viewport, theme, interaction state, event time and activation kind. Pointer positions use a 16 × 16 target-relative grid plus bounded page coordinates. Keyboard activity contributes to target counts without locations.

Events contain no visitor/session IDs, cookies, form contents, arbitrary text or full URLs. Counts mean received eligible activations, including repeats; they do not measure unique people. Browser delivery is best effort and does not retry. Public schema validation cannot prove a human sent an event. Operational logs are not the event dataset.

The report weights aggregates with `SUM(_sample_interval)`. Sampled totals are labelled estimates. Target, daily and spatial queries can be sampled independently, so their estimates can differ. Do not subtract spatial counts to infer keyboard counts. The 7/30/90-day presets use UTC calendar days and server ingestion timestamps; the original event timestamp is diagnostic. The interface distinguishes empty data from unavailable queries.

The preview draws only matching page/layout, target, viewport, theme, state and carousel grouping. Build changes alone do not invalidate an authored layout. Hidden, retired, stale and offscreen points stay in target counts and receive omission notices. Changing filters immediately withholds old results. Preview links and navigation are blocked while safe menu/expansion/carousel controls work. Private pages and `?heatmap-preview=1` suppress collection.

## Configure Cloudflare before release

Configuration and live verification are release work. Compiling Functions and local fixtures do not provision datasets, Access applications or secrets.

### Dataset bindings

`wrangler.toml` defines production `CLICK_EVENTS` → `site_click_events` and preview → `site_click_events_preview`, with matching `HEATMAP_DATASET`. Preview Origins default to `[]`, so collection fails closed until exact permitted HTTPS preview Origins are supplied. Do not use wildcards or infer permission from the request Host.

Pages preview overrides repeat all non-inheritable bindings and vars. The existing `AI` and `GITHUB_ACTIVITY_DB` bindings remain explicitly configured. D1 continues serving the GitHub Activity snapshot pipeline; click events go to Analytics Engine. Review account billing/availability and verify a real binding write after deploying. See [Pages configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).

### Owner identity and read configuration

Create an Access application/policy allowing only the intended owner email identities. Protect both `/insights` and descendants and `/api/insights` and descendants. Keep public pages and `/api/click-events` outside that owner policy. Cover the custom domain, direct production `pages.dev` hostname and each allowed preview hostname; a custom-domain rule alone is insufficient.

Configure these server-side Pages settings separately for production and preview. Keep token values in encrypted secrets and outside build/client environment variables:

| Setting                  | Value                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `HEATMAP_ACCESS_ISSUER`  | Exact HTTPS team origin, e.g. `https://your-team.cloudflareaccess.com`, without trailing slash |
| `HEATMAP_ACCESS_AUD`     | That Access application's audience                                                             |
| `HEATMAP_OWNER_EMAILS`   | JSON array of allowed email identities                                                         |
| `HEATMAP_ACCOUNT_ID`     | Lowercase 32-character account ID                                                              |
| `HEATMAP_READ_TOKEN`     | Encrypted token restricted to the intended account with Account Analytics Read                 |
| `HEATMAP_DATASET`        | Dataset used by this environment's binding                                                     |
| `HEATMAP_PUBLIC_ORIGINS` | Exact JSON array of permitted browser Origins                                                  |

For example, `pnpm exec wrangler pages secret put HEATMAP_READ_TOKEN --project-name dy-tsou-me` prompts for the secret; use the Pages dashboard to confirm environment scope. Do not paste tokens into commands, logs, screenshots or commits. Follow [SQL API authentication](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/).

Pages independently verifies the signed `Cf-Access-Jwt-Assertion`: RS256 signature against configured team JWKS, issuer, audience, expiry/issued time and allowed owner email. Cookies, forwarded identity headers and development mode are not substitutes. Missing settings deny access. The Pages middleware guards private static fallback, and the report handler verifies again. The front-door proxy preserves the request body/Origin and applies private no-store responses. Private HTML/data bypass Markdown conversion and return all three Cache-Control/CDN-Cache-Control/Cloudflare-CDN-Cache-Control no-store headers plus noindex. See [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

### Optional page-view context

The click report works without Web Analytics context. To enable it, configure encrypted `HEATMAP_WEB_ANALYTICS_TOKEN`, matching `HEATMAP_WEB_ANALYTICS_SITE_TAG` and `HEATMAP_WEB_ANALYTICS_HOST`. The query expects account `rumPageloadEventsAdaptiveGroups`, requestPath/date dimensions and its filter type. **This account schema has not been verified live.** Introspect the actual GraphQL schema and run the exact query with authorized credentials before enabling it. Adjust the integration if the account exposes another schema; do not fabricate counts. Context errors show Unavailable while clicks remain usable. Viewport-filtered context remains unavailable. Page views are a separate measurement, never an inferred conversion rate. See [GraphQL schema exploration](https://developers.cloudflare.com/analytics/graphql-api/getting-started/explore-graphql-schema/).

## Verification and deployment

Local commands:

```sh
pnpm test:heatmap
pnpm test:github-activity
pnpm test:favicons
pnpm lint
pnpm typecheck
NO_GITHUB_API=1 pnpm build
pnpm verify:functions
pnpm verify:deploy-contract
pnpm verify:front-door
pnpm verify:worker
```

The build verifier requires private HTML/noindex, rejects private public-route/discovery links and scans static text/bundles for private setting names and configured secret values. Functions compilation outputs to ignored `.wrangler/`. CI runs heatmap checks and compiles Functions; the deploy job installs frozen source dependencies before packaging JOSE-dependent Functions. Existing Pages/front-door deployment actions are retained.

Browser fixtures must run on a clearly labelled local QA host outside deployed source. Test overview → page, filter races, loading/error/retry/empty/sample states, retired/layout/state mismatch, preview collection suppression, safe expansions/slides, all four viewport bands and both themes. Those checks do not establish live authentication or binding operation.

Before enabling production, verify on the custom domain, direct `pages.dev` and allowed previews:

1. Owner login can open HTML and retrieve a real aggregate report. Anonymous, wrong-owner and invalid/expired token requests cannot read either path, including `/insights/index.html`, encoded aliases and HEAD. Confirm public routes still work.
2. Every private success/error/redirect response is no-store. Check edge cache behavior repeatedly; confirm HTML/data cannot be obtained via Markdown negotiation or static fallback.
3. A real eligible pointer and keyboard click reaches the intended dataset. Check production/preview separation, then confirm weighted counts/coordinates through the protected API after ingestion becomes queryable.
4. Preview/report interaction creates no events. Navigation still works on ordinary public pages. A layout revision mismatch keeps target counts but omits spatial points.
5. Oversize/malformed/wrong-Origin events fail without stored fields or raw logs. Missing binding/read settings visibly fail closed. Optional page-view context is checked separately.

Record actual deployment URL/build SHA and results for each host. No checklist item above is implied complete by this PR.

## Observability and maintenance

Use Pages Function request/error metrics and request status distributions for `/api/click-events`, `/api/insights/report` and private HTML. Alert on sustained write/read failure rates and latency. Static error codes include `heatmap_ingestion_configuration_unavailable`, `heatmap_ingestion_binding_unavailable`, `heatmap_ingestion_write_failed`, `heatmap_access_configuration_unavailable`, `heatmap_access_denied`, `heatmap_private_page_unavailable`, `heatmap_private_route_unavailable`, `heatmap_report_unavailable` and `heatmap_page_views_unavailable`. Inspect metrics/logs without adding event bodies, identity claims, headers or tokens to logs. A 204 confirms submission to the binding, not immediate query availability.

Consider a Cloudflare edge rate rule for POST `/api/click-events`, tuned to normal traffic and checked on every exposed host. Anonymous counts can include forged requests; do not turn this into visitor fingerprinting. Restrict read tokens, rotate them if exposed and retain generic errors for visitors.

When controls, geometry or responsive grouping change, update `shared/heatmap-contract.js` and the corresponding DOM metadata together, then bump the page's authored layout revision. Preserve existing IDs for unchanged controls; new projects need explicit source IDs and stable keys. Current carousel has 13 projects: 1/2/3/4 cards produce 13/7/5/4 slides at the contract's 640/1024/1440 breakpoints. Do not reuse retired target IDs for another action.

To disable collection, remove permitted Origins for the affected environment; missing collection configuration returns unavailable. To roll back, redeploy the prior known-good Pages and front-door artifacts together and retain owner Access restrictions. Revoke the read token when retiring the report. Do not clear the unrelated D1 snapshot database.
