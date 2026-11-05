# Shelf

**Let AI agents shop at your shop.**

Big retailers already sell through Claude and ChatGPT. The bakery down the road can't. Shelf turns a small shop's website, Instagram page or a photo of its menu into a catalogue that any AI agent can search and buy from, with checkout through PayPal.

Built for the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/).

## How it works

1. **Import.** The owner pastes a URL, pastes a price list, or snaps a photo of the menu. An LLM (Claude or Gemini via the Vercel AI SDK) extracts the shop profile and every priced item into a structured catalogue. It is told never to invent products or prices.
2. **Publish.** The owner edits the draft and publishes. Each product is created in the **PayPal Catalog Products API**, and the shop gets:
   - an MCP server at `/s/<shop>/mcp` (streamable HTTP)
   - `/s/<shop>/llms.txt` and `/s/<shop>/feed.json`
   - a human storefront at `/s/<shop>`
3. **Agents buy.** Any MCP client connects to `/mcp` (every shop) or a single shop's endpoint and uses `find_shops`, `search_all_products`, `search_products`, `create_checkout`, `get_order_status`. `create_checkout` creates a **PayPal Order** (intent `CAPTURE`) whose total is worked out on the server from the shop's prices and stock, and returns an `approve_url`.
4. **The buyer approves.** Money moves only after the person approves in PayPal. Shelf captures the order on return (and from the `CHECKOUT.ORDER.APPROVED` / `PAYMENT.CAPTURE.COMPLETED` webhook), takes the items out of stock and pushes the event to the owner's live dashboard.
5. **The owner runs the shop with a copilot.** The dashboard copilot uses the **PayPal Agent Toolkit** (`create_shipment_tracking`, `create_refund`, `get_order`, `list_transactions`, `get_merchant_insights`) plus Shelf's own sales tools. It answers "what sold this week?", adds tracking and issues refunds. It asks the owner to confirm before any refund.

A built-in demo agent at `/agent` connects to Shelf's public MCP endpoint with `@ai-sdk/mcp`, exactly as Claude or ChatGPT would.

## Safety model

- Agents can never complete a payment. Every order needs the buyer to approve it in PayPal.
- Agents send product IDs and quantities only. Prices and totals come from the database, so a hidden instruction on a web page can't change what gets charged.
- An order only counts as `PAID` after a PayPal capture returns `COMPLETED`.
- The URL importer only fetches public http(s) addresses (private IP ranges are blocked).

## Sponsor tools

- **AG Grid (Community):** the editable catalogue grid where owners review and fix the AI's draft before publishing, and the sortable products table on the dashboard (price, units sold, low stock, PayPal Catalog sync).
- **Channel3:** during import, every drafted product is searched on Channel3 in the shop's market and currency. The grid shows the going price range and whether the owner's price is above, below or on par. Optional: set `CHANNEL3_API_KEY`.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Vercel AI SDK (Anthropic / Google) · `@modelcontextprotocol/sdk` · `@paypal/agent-toolkit` · PayPal REST (Orders v2, Catalog, Tracking, Refunds, Webhooks) · Postgres (Neon) or embedded PGlite.

## Run locally

```bash
cp .env.example .env.local   # add PayPal sandbox + AI keys
npm install
npm run dev
```

With no PayPal keys, Shelf runs in **mock mode**: orders get `MOCK-` IDs and a local approval page, so the whole flow can be tried offline. With no `DATABASE_URL`, it uses embedded PGlite and seeds three demo shops (Bristol, Lisbon, Kyoto).

Connect an agent:

```json
{ "mcpServers": { "shelf": { "url": "http://localhost:3000/mcp" } } }
```

## License

MIT
