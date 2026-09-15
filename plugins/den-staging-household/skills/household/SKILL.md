---
name: household
description: Use whenever the den household connector is connected and the person mentions the house: groceries or a shopping list, who lives here, a contact (the vet, the plumber, the school), a service or bill (internet, insurance, a subscription), or tells you something that happened at home (a repair, a purchase, a meal out, a decision, an appointment, an allergy) without asking you to save it. Also "what do we have on…", "when does … renew", "who is our …".
---

# den for Household

A house and the people in it: the groceries, who lives here, the contacts, the services and bills (with the bill itself behind each row), a journal of what happened, a ledger of what it cost, and what is coming up. Ask in your own words; every answer says where it came from.

den keeps it: a **topic** of kind `household` holds these places, every write is a new version, and nothing is destroyed. The connector is `https://den-staging.pkslabs.com/mcp/household`; every result carries a `web_url` to hand back.

On a workspace with no topic of this kind yet, `create_topic` with kind `household` first, and ask for the currency the house pays in and its timezone (kept as the topic's properties), and who lives here (the Members table).

## What a household topic keeps

| Place | Slot | Kept as | What goes there |
|---|---|---|---|
| **Services** | `services` | a table (`change_document`) | What the house pays for or depends on: utilities, insurance, subscriptions, warranties, with what each costs and when it renews. |
| **Contacts** | `contacts` | a table (`change_document`) | Everyone outside the house: the vet, the plumber, the school, the neighbour with a key. |
| **Journal** | `journal` | an append-only log (`append_entry`) | Anything that happened, and anything booked for a day ahead: a repair, a vet visit, a meal out, a decision, a shop, an appointment, dated. |
| **Who lives here** | `members` | a table (`change_document`) | The people and pets of the house: birthday, allergies, notes. |
| **Groceries** | `groceries` | a list (`change_document`) | The standing shopping list. |

## Triage: what kind of request is this?

| The user says | It is a | Do |
|---|---|---|
| "add milk", "tick off the eggs", "what do I need from the shop" | **the groceries** | `find_place` with the words, then `change_document` with the whole list. Adding and ticking need no question; emptying the list does. |
| "the plumber is Joe, 07700 900123", "the vet moved" | **a contact** | `find_place`, then `change_document` on Contacts. A person who lives here goes in Members, not Contacts. |
| "internet is Northline, 55 a month", "cancel the gym" | **a service** | `find_place`, then `change_document` on Services. den cannot cancel anything: give the how-to-cancel cell and the renewal date, change nothing unless told. |
| "the plumber fixed the leak, 240", "we ate out tonight", "Sam is allergic to peanuts", "we decided to redo the kitchen" | **a thing that happened** | `append_entry` on the journal with the amount and its currency. A receipt's lines are an `x-receipt_<date>_<shop>` table as well. Never let it pass as merely noted. |
| "Sam's therapist is Dr Lee", a diagnosis, a salary | **private to one person** | Not the shared house: say it belongs in that person's own workspace, and write nothing here. |
| "the wifi password is…", a PIN, a card number, a key | **a secret** | den keeps none: say so, write nothing, and say where it lives instead (a password manager). |
| "how much did we spend on…", "what did the plumber cost this year", "what renews in the next two months", "how many times did the vet…" | **a number or a date range** | `query` with one SQL statement over the ledger (<topic>__ledger), the tables and the journal entries; answer with the figure, its currency and the `_web_url`. Never add up prose by hand. |
| "add eggs to the grocery list", "tick off the milk", "put the dentist on Thursday", "add a bill", "the cat had her jab" | **a thing they keep** | `find_place` with their own words. Then use the tool that place names in `write`: `change_document` with the whole document, `append_entry` for a log, `write_artifact` for a written page. Never `create_topic`. |
| "what do we have on…", "find…", "where is…", "what did we decide about…" | **read** | `search` first. Natural language works, because it reads words and meaning. Then `read_artifact` on the best hit. Quote the `web_url`. When the result says `confident: false`, say den has nothing on it. Do not quote the hits. |
| "read the plan", "show me the latest changelog" | **read** | `get_topic` to see the artifact names, then `read_artifact`. Omit `version` for the head. |
| "where are we with X", "continue X", "what's next on X" | **resume** | `get_topic` X. Follow its `instructions` and load every entry in `skills` before you act. Then `get_kind` for the topic's kind: it says which artifacts hold the state and how to keep them. Read those. That is the context. Do not ask the user to repeat it. |
| "save this", "write this up", "store the summary", "update the plan" | **write** | Decide the topic and the artifact name (below), then `write_artifact`. Always pass `base_version` from what you read. |
| "start a topic for…", a trip, a car, a house, a new piece of work | **write** | `list_kinds`, then `create_topic` with the kind whose slots fit. Use `note` when nothing fits. A list, a table or dates is **not** a new topic. See the first row. |
| "let me edit…", "I'm going to work on…", a long edit session | **lease** | `checkout_artifact`, do the writes, `checkin_artifact`. |
| "send this to…", "give me a link to…" | **share** | The `web_url` from any result, for people with a den login. `share_artifact` for a link anyone can open. |
| "back this up", "download everything" | **export** | `export_topic`. The CLI has `den export --all`. |
| Chat, opinions, work with no document to keep | **not den** | Answer normally. Do not create a topic for a conversation. |

## Rules of this kind

Anything about the house is kept here: pass this workspace to find_place and search, and look here before anywhere else. To put something: a live document when the words name one (find_place, then change_document); otherwise it happened, so append_entry on the journal with the amount and its currency. A removed row or an emptied list needs the person's yes first; adding and ticking do not. Amounts are kept in the currency the person said, else the place's (find_place says it), and every answer names it. Never guess a date, an amount or an allergy nobody said: a day said relatively ("next Tuesday") is confirmed as a date before it is booked. Every member reads everything here: what one person would not want the whole house to read (a therapist, a diagnosis, a salary) belongs in that person's own personal workspace, and you say so instead of writing it here. A password, a key or a full account number is never written anywhere in den: say so, and offer where it lives instead. To answer: the value as kept first, then where it came from with its web_url; when it is not kept, say so and offer to keep it, and never answer from general knowledge as if it were the household's. A question about money or a span of dates is answered with query, never by adding prose up; an entry about money carries amount.

## Rules that keep den consistent

0. **The things people keep are documents, not topics.** A grocery list, the bills, the dates, the contacts: each is an artifact on a topic that already exists. den draws it as a real list or table, in the page and on a phone. To add, change or tick one, call `find_place` with the person's words. Then use the tool that place names in `write`: take the document it hands back, change it, and send the whole thing to `change_document`. Use `append_entry` where the place is a log. Something private to one person or animal belongs in that topic's own records, never copied into a shared list. `create_topic` is for a new thing of its own, and it refuses a name that is already a document.
1. **Search before you write.** A topic or an artifact for it probably exists. Prefer a new version of the artifact you found over a new artifact with a similar name.
2. **Names and how-tos come from the kind.** `get_topic` shows the kind. `get_kind` shows the declared artifacts, their owners, and the **instructions** for writing each one and for running the topic. Read them before you write a declared artifact, and follow them. A kind that keeps a dated log or a standing summary says so there, and says when to write them. Use a declared name when one fits. Any other name must start with `x-`, as in `x-notes`. A declared artifact written by another owner still works. den only warns, unless the kind enforces owners.
3. **Never write blind.** Pass `base_version`, the `head_version` you read. A 409 `stale` means someone wrote in between. Read again, merge, and write again. Never retry a write with a base you did not read.
4. **Respect leases.** A 409 `leased` names the holder and the expiry. Do not wait it out and do not work around it. Tell the user who has it. Take your own lease only for a multi-step edit, and always check in.
5. **One artifact per document.** A plan is one artifact with versions, never `plan_v2` or `plan_final`. A dated log is one artifact. Add to it with `append_entry`, never by rewriting the whole file.
6. **Provenance goes on the topic**, as `references`, not in the body. A reference is a link and a note: a ticket, a receipt, a page, a chat. Tags are for search across topics.
7. **Markdown by default.** Headings, tables, fenced code and mermaid all draw in den. Use JSON for structured data. den stores binary files but does not search them.
8. **Hand back links, not bodies.** Say what changed and give the `web_url`. Quote a body only when the user asked to read it.

And on every client, whatever the kind:
- **When someone asks you to add, change, or tick something they keep — a grocery list, bills, dates, contacts — call find_place first with their own words, then change_document with the whole document, or change_rows for one row.** Those things live in documents on topics that already exist; do not create a topic and do not use write_artifact for them. create_topic is for a new thing of its own, like a trip or a car.
- Every result carries a web_url: give it with every answer that came from den, and after every write.
- An amount is kept in the currency the person said, else the place's (its properties), and every answer names the currency; a question about money or a span of dates is answered with query, never by adding prose up.
- A document that loses something — a row removed, a list emptied — needs the person's yes first, and den refuses the write without confirmed: true. Adding and ticking need no question.

## Tool by tool

- `whoami`: Who this session acts as: user, token scopes, workspace, role, what the role may do, and the workspace's properties (currency, timezone, locale). Call it first.
- `list_workspaces`: The workspaces you belong to and your role in each (owner, admin, member, viewer; see whoami.permissions for what the c.role may do). This token has a home workspace.
- `update_workspace {workspace?, name?, properties?}`: Set a workspace's name or its properties (currency, timezone, locale): the default for every topic in it, which a topic's own properties override. Owners and admins only.
- `add_member {workspace?, email, role?}`: Bring someone into the workspace by email, as member (default), viewer, admin or owner.
- `list_audit {workspace?, limit?, before?, action?, actor?, topic?, artifact?, from?, to?}`: Who changed what in the workspace, newest first: actor, action, topic, artifact, the version written and the one it replaced. Owners and admins only. Page with before = the next cursor of the previous call.
- `list_topics {workspace?, include_archived?}`: Every topic in the workspace: key, kind, title, tags, updated_at.
- `get_topic {workspace?, key}`: A topic with its artifacts (names, owners, head versions, leases), its instructions and the skills to load before working on it, and its properties (currency, timezone, locale) resolved through the workspace: amounts and…
- `create_topic {workspace?, key, kind?, title?, tags?, instructions?, skills?, properties?, anyway?}`: Create a topic: a new thing of its own, like a trip, a car, or a household. NOT the way to keep a list, a table or dates — those are documents on a topic that already exists, and find_place finds them.
- `update_topic {workspace?, key, title?, tags?, references?, instructions?, skills?, properties?}`: Change a topic's title, tags, references, instructions (how to work on it), skills (what an agent loads first), or properties (currency, timezone, locale for what is kept here). Fields you omit stay as they are.
- `export_topic {workspace?, key, all_versions?}`: A cove-compatible topic.json plus download URLs for every artifact, or for every version when all_versions is true.
- `find_place {query?, workspace?, topic?, limit?, documents?}`: Given what the person said ("the grocery list", "bills", "the cat's vet visit"), the places that match it, best first, across every workspace you can act in: where each one lives, what it is called, how it stands, and th…
- `change_document {workspace?, topic, artifact, document?, base_version?, note?, confirmed?, schema?}`: Write a document den keeps: send the whole thing as it should now be, having taken what find_place gave you and made the change. den checks it against the document's schema and saves it as a new version by you.
- `change_rows {workspace?, topic, artifact, add?, change?, remove?, base_version?, note?, confirmed?}`: Change one row, item or event at a time, by id, in a document den keeps: add (new rows: the cells, or for a list the text), change (an id and the fields that change), remove (ids).
- `import_rows {workspace?, topic, artifact, csv, replace?, confirmed?, note?}`: Rows from CSV into a table, the way a bank statement, a spreadsheet export or a phone's contacts arrive without a hundred turns: paste the CSV.
- `read_artifact {workspace?, topic, name, version?}`: The text body of an artifact at its head, or at the version you name. When you answer from it, give its web_url with the answer.
- `write_artifact {workspace?, topic, name, body, owner?, schema?, path?, content_type?, base_version?, lease?}`: Write a new version of an artifact. The first write creates it. Pass base_version, the head you read, so you never overwrite someone else. Omit it only to write on top of the current head.
- `append_entry {workspace?, topic, name, title, body?, amount?, currency?, on?}`: Add a dated entry at the top of an append-only artifact: journal, gotchas, changelog, learnings, or decision_log. The tool writes the heading as ## YYYY-MM-DD HH:MM — title, then the body, newest first.
- `list_versions {workspace?, topic, name}`: Version history of an artifact.
- `share_artifact {workspace?, topic, name?, version?, slug?, ttl_seconds?, title?}`: Create a read-only link that opens without sign-in, for one artifact at its head or a pinned version, or for a whole topic. Expiry and a memorable slug are optional.
- `checkout_artifact {workspace?, topic, name, ttl_seconds?}`: Take an editing lease. Nobody else can commit until you check in or the lease expires.
- `checkin_artifact {workspace?, topic, name}`: Release your lease.
- `search {workspace?, q, topic?, kind?, artifact?, since?, alt?, limit?}`: Hybrid search (lexical + semantic, then reranked) over every artifact. Filters are optional. Pass 1 to 3 alt phrasings of the same question to widen recall.
- `query {workspace?, sql, limit?}`: One read-only SQL statement (SQLite) over every table, list and log in the workspace, for totals, counts, dates in a range, and joins across topics: "what did we spend eating out this year", "what renews in the next 60 d…
- `upcoming {workspace?, days?}`: Everything dated inside the next days across the workspace, soonest first, computed from the dates den holds (a renewal on a service, a birthday on a member, an event in a dates document; a birthday and a yearly renewal…
- `list_kinds {workspace?}`: The kinds in the workspace, which are workflow contracts: name, description, and artifact slot names. note and skill are built in and present everywhere. Call get_kind before writing a declared artifact.
- `get_kind {kind, workspace?}`: One kind in full: how a topic of this kind is run, and for every artifact slot its owner, schema, description, and the instructions for producing it. Read it before you create a topic or write a declared artifact.
- `create_kind {kind, description, instructions?, connect?, plugin?, key_pattern?, enforce_owner?, workspace?}`: Create a kind in the workspace: a workflow contract that topics follow. Give it a name in lowercase words joined by dashes, a description, and instructions for how to run a topic of this kind.
- `update_kind {kind, description?, instructions?, connect?, plugin?, key_pattern?, enforce_owner?, workspace?}`: Change a kind's description, instructions, connect text (what the connector tells an agent at connect time when a workspace has a topic of this kind: the few rules that must hold on every call), plugin block (what the ki…
- `set_kind_artifact {kind, name, owner, required?, schema?, description?, instructions?, label?, workspace?}`: Add or replace one artifact slot on a kind: its owner, whether it is required, a description, and the instructions for producing it. The slot name is lower_snake_case.
- `list_marketplace {category?, q?, mine?}`: The kinds marketplace: den-wide kinds any workspace can install. Approved listings only, official (den staff) ones first; pass mine to see your own submissions in every state.
- `get_marketplace_kind {name}`: One listing in full: the pitch, the review state, and the kind manifest it installs (slots, owners, instructions).
- `install_kind {name, as?, workspace?}`: Copy an approved marketplace kind into the workspace. The copy belongs to the workspace and can be changed there. as picks another kind name. Installing again updates a copy that came from the same listing.
- `publish_kind {kind, name?, title, description, category, tags?, official?, draft?, workspace?}`: Offer one of the workspace's kinds on the marketplace. A member's listing waits for den staff to approve it; staff's is live at once.
- `list_skills {workspace?}`: The skills in the workspace: name, description (the trigger sentence), updated_at. A skill is a SKILL.md with support files that Claude Code loads from ~/.claude/skills/<name>. Read one with get_skill.
- `get_skill {workspace?, name, bodies?}`: One skill: its SKILL.md body and the list of support files. Pass bodies to get every file. Load it when a topic lists the skill by name and it is not installed locally.
- `put_skill {workspace?, name, description?, files}`: Create or update a skill from its files. files must include SKILL.md, whose frontmatter name equals the skill name. Unchanged files are skipped. Support files you leave out are removed. Every change is a new version.

## Worked examples

**"Add milk and bread."** → `find_place {query:"add milk and bread"}` → Groceries, a list → `change_document` with both added → "Added milk and bread. 7 items: `web_url`."

**"The boiler service was 180 today."** → `find_place` names the journal → `append_entry {title:"Boiler service", body:"180 CAD, …"}` → "Kept in the journal: `web_url`."

**"When does the insurance renew?"** → `find_place {query:"insurance"}` → Services, the row → answer the date and give the `web_url`. If no row: "Nothing kept on insurance. Want me to add it?"

**"How much have we spent eating out this year?"** → `query {sql:"SELECT SUM(amount) AS total, currency FROM home__ledger WHERE what LIKE '%ate out%' AND date >= '2026-01-01' GROUP BY currency"}` → "412 CAD across 6 meals this year: `web_url`." A journal kept before the ledger existed is asked through its entries (home__journal: date, title, body).

**"Tick off the milk."** → `find_place` → Groceries, the item id → `change_rows {change:[{id:"milk", done:true}]}` → "Ticked milk. 6 left: `web_url`."

**"Add eggs and two pints of milk to the shopping list."** → `find_place {query:"shopping list"}` → the place is `meals/shopping_list`, a `list.v1`, and `write` names `change_document` → add both items to the document it handed back → `change_document {…, base_version: 9}` → "Added eggs and milk. The list has 8 items: `web_url`."

**"The cat had her jab today."** → `find_place {query:"the cat had her jab"}` → the place is the cat's own `records`, an append-only log, and `write` names `append_entry` → `append_entry` with the date and the vaccine → "Kept in the cat's records: `web_url`." A vet visit is private to that topic. Never copy it into a shared contacts table.

**"What did we decide about the return policy?"** → `search {q:"return policy decision"}` → the best hit is a decision log → `read_artifact` → answer with the section and the link.

**"Update the plan with what we agreed."** → `get_topic` → `read_artifact {name:"plan"}`, which reads `head_version: 4` → edit the body → `write_artifact {…, base_version: 4}` → "Updated the plan to v5: `web_url`."

**A 409 `leased` on a write** → "Ana has the plan checked out until 14:30. I kept the text. Say the word and I will retry after that, or write it now as `x-plan_draft`."

## Where this file comes from

Generated from the marketplace listing `household` v9 at https://den-staging.pkslabs.com/skill/household.md. The plugin that carries it is `den-staging-household`.
