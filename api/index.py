"""
Vercel Serverless Entrypoint for RippleIQ FastAPI Backend
=========================================================
Exposes the FastAPI `app` instance to Vercel's Python Serverless Runtime (@vercel/python).
"""

import os
import sys

# Compute project root and paths so modules can be imported
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")

# Ensure root_dir (for ai.*) and backend_dir (for app.*) are in sys.path
for path in [backend_dir, root_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Import the main FastAPI app
from app.main import app  # noqa: E402
