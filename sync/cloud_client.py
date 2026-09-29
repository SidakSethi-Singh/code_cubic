"""The ONLY place that touches the network. Refuses to run while offline."""
import json
import os
import urllib.request

from sync import link

HUB_URL = os.environ.get("HUB_URL", "http://127.0.0.1:8765")


class Offline(Exception):
    pass


def _call(method: str, path: str, body: dict | None = None) -> dict:
    if not link.is_online():
        raise Offline("link is offline - no network call made")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        HUB_URL + path, data=data, method=method,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.loads(r.read())


def post(path: str, body: dict) -> dict:
    return _call("POST", path, body)


def get(path: str) -> dict:
    return _call("GET", path)