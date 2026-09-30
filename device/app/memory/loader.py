"""device/app/memory/loader.py — Load seed JSONL into the memory store."""
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Union
from .models import Memory

logger = logging.getLogger(__name__)


def load_jsonl(filepath: Union[str, Path]) -> List[Dict[str, Any]]:
    """Read a JSONL file and return a list of dictionaries."""
    data = []
    filepath = Path(filepath)
    if not filepath.exists():
        logger.warning(f"File not found: {filepath}")
        return data

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line_no, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    data.append(json.loads(line))
                except json.JSONDecodeError as e:
                    logger.error(f"Error decoding JSON at {filepath}:{line_no} - {e}")
    except Exception as e:
        logger.error(f"Failed to read {filepath}: {e}")

    return data


def load_all_seed_data(generated_dir: str = "data/generated") -> List[Dict[str, Any]]:
    """Load all .jsonl memory files from generated dir (skipping conflict pairs file)."""
    all_data = []
    dir_path = Path(generated_dir)

    if not dir_path.exists() or not dir_path.is_dir():
        logger.warning(f"Seed directory not found: {dir_path}")
        return all_data

    # Standard memory files
    target_files = ["manuals.jsonl", "bulletins.jsonl", "incidents.jsonl", "fixes.jsonl", "sensitive.jsonl", "duplicates.jsonl"]
    for fname in target_files:
        file_path = dir_path / fname
        if file_path.exists():
            items = load_jsonl(file_path)
            logger.info(f"Loaded {len(items)} items from {fname}")
            all_data.extend(items)

    return all_data


def seed_store(store, dense_embedder, sparse_embedder, generated_dir: str = "data/generated") -> Dict[str, Any]:
    """Embed and upsert all seed data into store, returning comprehensive stats."""
    logger.info("Starting seed process...")
    data = load_all_seed_data(generated_dir)

    stats = {
        "total": 0,
        "by_kind": {},
        "by_site": {},
    }

    if not data:
        logger.warning("No seed data found to load.")
        return stats

    for item in data:
        try:
            mem = Memory(**item)
            dense_vec = dense_embedder.embed_one(mem.content) if dense_embedder else None
            sparse_vec = sparse_embedder.embed_one(mem.content) if sparse_embedder else None

            store.upsert(
                mem,
                dense_vector=dense_vec,
                sparse_vector=sparse_vec,
            )

            stats["total"] += 1
            stats["by_kind"][mem.kind] = stats["by_kind"].get(mem.kind, 0) + 1
            stats["by_site"][mem.site_id] = stats["by_site"].get(mem.site_id, 0) + 1
        except Exception as e:
            logger.error(f"Error seeding item {item.get('mem_id')}: {e}")

    logger.info(f"Seed complete. Loaded {stats['total']} memories.")
    return stats
