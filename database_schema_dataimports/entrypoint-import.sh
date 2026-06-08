#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL environment variable is required." >&2
  exit 1
fi

python - <<'PY'
import os
import sys

from sqlalchemy import create_engine, text

database_url = os.environ["DATABASE_URL"]
engine = create_engine(database_url)

with engine.connect() as conn:
    try:
        count = conn.execute(text("SELECT COUNT(*) FROM node")).scalar()
    except Exception:
        count = 0

if count and int(count) > 0:
    print(f"Graph already has {count} nodes, skipping import.")
    sys.exit(0)
PY

echo "Importing walk network into node and edge tables..."
exec python importing-nodes-edges.py
