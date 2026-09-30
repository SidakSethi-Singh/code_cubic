import os

DEVICE_ID = os.environ.get("DEVICE_ID", "device_a")
DEVICE_PORT = int(os.environ.get("DEVICE_PORT", "8001"))
SITE_ID = os.environ.get("SITE_ID", "plant_north")
HUB_URL = os.environ.get("HUB_URL", "http://127.0.0.1:8765")
DATA_DIR = os.environ.get("DATA_DIR", "data")
SHARD_DIR = os.environ.get("SHARD_DIR", os.path.join(DATA_DIR, f"shard_{DEVICE_ID}"))
DENSE_MODEL = os.environ.get("DENSE_MODEL", "BAAI/bge-small-en-v1.5")
MODEL_CACHE_DIR = os.environ.get("MODEL_CACHE_DIR", os.path.join(DATA_DIR, "models"))
