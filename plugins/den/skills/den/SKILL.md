---
name: den
description: Use whenever den is connected as an MCP server (tools like find_place, search, read_artifact, write_artifact, list_topics) and the user asks to add, change, tick, find, read, store, version, or share something they keep — a list, a table, dates, notes, a plan, a record — or tells you a fact worth keeping without asking you to save it (a name, a number, a date, an appointment, a purchase, a decision, what happened), since den is where they keep such things. Also for "what do we have on X", "save this", "put this in den", "where is the latest…". This skill decides what den should do with a request and how to do it without clobbering anyone.
---

# den — how an agent uses it

den keeps the things a person or a group wants to survive the conversation. A **topic** is one thing they keep: a household, a car, a trip, a product, a study. A topic holds named **artifacts**, and every write makes a new version. Nothing is destroyed.

Some artifacts are **documents** den understands and draws: a list, a table, a set of dates, a note. Others are written pages. A topic's **kind** declares which artifacts belong to it and how to keep each one.

People edit in the web app or in a mounted folder. Agents use these tools. A save in the mounted folder commits on its own. Never ask a person to check out or check in a file. Every result carries a `web_url` you can hand to a human.

## Triage: what kind of request is this?

| The user says | It is a | Do |
|---|---|---|
| "add eggs to the grocery list", "tick off the milk", "put the dentist on Thursday", "add a bill", "the cat had her jab" | **a thing they keep** | `find_place` with their own words. Then use the tool that place names in `write`: `change_document` with the whole document, `append_entry` for a log, `write_artifact` for a written page. Never `create_topic`. |
| "the plumber fixed the leak, 240", "Sam is allergic to peanuts", "we ate out tonight", a fact said in passing with no "save it" | **a thing told** | `find_place` with the sentence; keep it in the place it names (the document, or the append-only log), or say where it belongs when it is not den's. A password, a key or a card number is never kept: say so, and where it lives instead. Never let it pass as merely noted: the person will think it is kept. |
| "what do we have on…", "find…", "where is…", "what did we decide about…" | **read** | `search` first. Natural language works, because it reads words and meaning. Then `read_artifact` on the best hit. Quote the `web_url`. When the result says `confident: false`, say den has nothing on it. Do not quote the hits. |
| "read the plan", "show me the latest changelog" | **read** | `get_topic` to see the artifact names, then `read_artifact`. Omit `version` for the head. |
| "where are we with X", "continue X", "what's next on X" | **resume** | `get_topic` X. Follow its `instructions` and load every entry in `skills` before you act. Then `get_kind` for the topic's kind: it says which artifacts hold the state and how to keep them. Read those. That is the context. Do not ask the user to repeat it. |
| "save this", "write this up", "store the summary", "update the plan" | **write** | Decide the topic and the artifact name (below), then `write_artifact`. Always pass `base_version` from what you read. |
| "start a topic for…", a trip, a car, a house, a new piece of work | **write** | `list_kinds`, then `create_topic` with the kind whose slots fit. Use `note` when nothing fits. A list, a table or dates is **not** a new topic. See the first row. |
| "let me edit…", "I'm going to work on…", a long edit session | **lease** | `checkout_artifact`, do the writes, `checkin_artifact`. |
| "send this to…", "give me a link to…" | **share** | The `web_url` from any result, for people with a den login. `share_artifact` for a link anyone can open. |
| "back this up", "download everything" | **export** | `export_topic`. The CLI has `den export --all`. |
| Chat, opinions, work with no document to keep | **not den** | Answer normally. Do not create a topic for a conversation. |

If `whoami` shows a workspace with no topics, call `list_workspaces` and pass `workspace` on every call. A grant bound to a personal workspace is the usual reason den looks empty.

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
- Resources: `den://topic/<key>` and `den://topic/<key>/<name>` attach a document to a conversation.

## The kinds marketplace

`list_marketplace {category?, q?, mine?}` shows den-wide kinds any workspace can install. Official ones come first, marked `official`, then community ones that staff reviewed. `get_marketplace_kind {name}` is one listing in full, with the manifest it installs. `install_kind {name, as?}` copies it into the workspace as a kind of its own, for an owner or an admin. The copy carries `source: {listing, version}` and can be changed locally. `publish_kind {kind, title, description, category, tags?}` offers a workspace kind to everyone. A member's listing waits for staff review. Staff publish at once. Categories: engineering, product, design, research, writing, operations, business, personal, household. When a user asks "is there a kind for X", browse the marketplace before you create one.

## Worked examples

**"Add eggs and two pints of milk to the shopping list."** → `find_place {query:"shopping list"}` → the place is `meals/shopping_list`, a `list.v1`, and `write` names `change_document` → add both items to the document it handed back → `change_document {…, base_version: 9}` → "Added eggs and milk. The list has 8 items: `web_url`."

**"The cat had her jab today."** → `find_place {query:"the cat had her jab"}` → the place is the cat's own `records`, an append-only log, and `write` names `append_entry` → `append_entry` with the date and the vaccine → "Kept in the cat's records: `web_url`." A vet visit is private to that topic. Never copy it into a shared contacts table.

**"What did we decide about the return policy?"** → `search {q:"return policy decision"}` → the best hit is a decision log → `read_artifact` → answer with the section and the link.

**"Update the plan with what we agreed."** → `get_topic` → `read_artifact {name:"plan"}`, which reads `head_version: 4` → edit the body → `write_artifact {…, base_version: 4}` → "Updated the plan to v5: `web_url`."

**A 409 `leased` on a write** → "Ana has the plan checked out until 14:30. I kept the text. Say the word and I will retry after that, or write it now as `x-plan_draft`."

## Where this file comes from

den serves it at `/skill.md`. `den skill --install` links it into `~/.claude/skills/den`. The MCP server's instructions point here.
