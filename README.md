# den plugins

A plugin marketplace for [den](https://den.pkslabs.com), the versioned store of record for a team, a household and their AI agents.

Add it in Claude Code:

    claude plugin marketplace add pkslabscom/den-plugin
    claude plugin install den@den

Or in claude.ai: Customize → Plugins → Add → Add marketplace → Add from a repository → `pkslabscom/den-plugin`, then install **den**.

Each plugin installs two things: the den connector (sign in once; on the consent page pick the workspaces the connector may act in) and the den skill, which tells an agent how to read a topic's status before acting, how to write a version without overwriting anyone, and where the things a person keeps belong.

`den-staging` points at den's staging environment and exists for testing; staging is not the record.
