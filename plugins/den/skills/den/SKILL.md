---
name: den
description: Use whenever den is connected as an MCP server (tools like find_place, search, read_artifact, write_artifact, list_topics) and the user asks to add, change, tick, find, read, store, version, or share something they keep — a list, a table, dates, notes, a plan, a record. Also for "what do we have on X", "save this", "put this in den", "where is the latest…". This skill decides what den should do with a request and how to do it without clobbering anyone.
---

# den — how an agent uses it

den keeps the things a person or a group wants to survive the conversation. A **topic** is one thing they keep: a household, a car, a trip, a product, a study. A topic holds named **artifacts**, and every write makes a new version. Nothing is destroyed.

Some artifacts are **documents** den understands and draws: a list, a table, a set of dates, a note. Others are written pages. A topic's **kind** declares which artifacts belong to it and how to keep each one.

People edit in the web app or in a mounted folder. Agents use these tools. A save in the mounted folder commits on its own. Never ask a person to check out or check in a file. Every result carries a `web_url` you can hand to a human.

## Triage: what kind of request is this?

| The user says | It is a | Do |
|---|---|---|
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

- `find_place {query, workspace?, limit?, documents?}`: the places that match what the person said, best first, across every workspace you can act in. Name a workspace to narrow it. Every declared artifact is a place, not only the ones den validates. Each answer says where it lives, its plain label, how it stands ("6 items, 2 ticked", "9 entries"), whether it `matched` by words or by meaning, and, in `write`, which tool takes it: `change_document` for a document den validates, which comes back with the answer so the next call needs no round trip, `append_entry` for an append-only log, `write_artifact` for a written page. Use the tool the place names. Pass the person's own phrase, vague ones included. When the words name nothing, den reads the query against each place by meaning. Call it before any add, change or tick.
- `change_document {workspace?, topic, artifact, document, base_version?, note?, schema?}`: the whole document as it should now be. den validates it against the artifact's schema and saves a version by you. An `x-` artifact is outside the kind, so nothing declares its schema: to make one a document (a receipt's line items as a `table.v1`), send `schema` with its first change; after that it carries it. A stale `base_version` is refused rather than overwriting. `note` keeps what the person asked for on the audit row.
- `search {q, topic?, kind?, artifact?, since?, limit?}`: ranked hits with a snippet and a `web_url`. Filters narrow the search. `since` is ISO. Ask in the user's words. Do not shorten to keywords first.
- `list_topics`, `get_topic {key}`: the catalog. `get_topic` returns the artifacts with `head_version`, the owner, and any live lease.
- `read_artifact {topic, name, version?}`: the text body and the metadata.
- `write_artifact {topic, name, body, owner?, schema?, path?, content_type?, base_version?, lease?}`: a new version. An `x-` name is not limited to markdown: with `schema` (`list.v1`, `table.v1`, `dates.v1`, `note.v1`), a JSON body and `content_type: application/json`, den checks it and draws it like any document. `lease: true` takes and releases a lease around the write. `owner` defaults to you. Set it to a role name when the kind expects one.
- `create_topic {key, kind, title?, tags?}`: a key is a short stable id, such as `kitchen`, `the-van` or `split-2027`. It is not a sentence.
- `list_versions {topic, name}`: the history, with sizes, hashes and writers.
- `checkout_artifact {topic, name, ttl_seconds?}` and `checkin_artifact`: leases. Two hours by default, eight at most.
- `export_topic {key, all_versions?}`: a manifest with download links.
- `list_kinds`, `get_kind`, `whoami`, and the marketplace tools below.
- Skills are their own resource: `list_skills` and `get_skill` read one, `put_skill` writes one.
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
