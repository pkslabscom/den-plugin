# den plugins

A mirror of the plugin catalogs den serves itself, for claude.ai, which adds a marketplace from a git repository. Claude Code can install straight from the source:

    claude plugin marketplace add https://den.pkslabs.com/.claude-plugin/marketplace.json
    claude plugin install den@den-pkslabs-com

Every den lists itself and one plugin per marketplace kind that ships as a product (`den-household`, …). A kind plugin carries a connector at `/mcp/<kind>` on the same server, with the same tools in that kind's words, and a skill generated from the kind's marketplace listing. Nothing in this repository is written by hand: `node sync.mjs` pulls the catalogs and unpacks each archive, and a workflow does the same every hour.

In claude.ai: Customize → Plugins → Add → Add marketplace → Add from a repository → `pkslabscom/den-plugin`. The `den-staging-*` plugins point at the staging environment, whose data is a test snapshot.
