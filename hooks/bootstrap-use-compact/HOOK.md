---
name: bootstrap-use-compact
description: "Replace injected bootstrap file contents with local *.compact.md variants when present"
metadata:
  {
    "openclaw": {
      "emoji": "🗜️",
      "events": ["agent:bootstrap"]
    }
  }
---

# Bootstrap Use Compact

During `agent:bootstrap`, this hook keeps canonical bootstrap filenames but swaps their injected content with sibling `*.compact.md` files when available.
