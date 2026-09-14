# den

den is the versioned store of record for a team and its AI agents: https://den.pkslabs.com

This plugin installs two things.

- **The connector**, at `https://den.pkslabs.com/mcp`. Run `/mcp` in a session to sign in. On the consent page you pick the workspaces the connector may act in; a connector bound to a personal workspace is the usual reason den "has nothing" later, so pick the shared one your team or household uses.
- **The den skill**, which tells an agent how to start a session, how to write without overwriting anyone, and when a request is not a den request at all.

If you added den before this plugin existed, remove the older copies or you will carry each of them twice:

    claude mcp remove den
    rm -rf ~/.claude/skills/den   # only if `den skill --install` wrote it

To remove the plugin: `claude plugin uninstall den@den-pkslabs-com`.

Updates arrive on their own: the archive's digest is its version, so a change to the skill is a new version.
