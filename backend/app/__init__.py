"""RippleIQ backend package and sibling AI module bootstrap."""

import sys
from pathlib import Path

# The deterministic AI provider is a repository-level package beside backend/.
_workspace_root = Path(__file__).resolve().parents[2]
if str(_workspace_root) not in sys.path:
    sys.path.insert(0, str(_workspace_root))
