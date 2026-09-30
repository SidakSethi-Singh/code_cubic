from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from device.app.ledger.ledger import SQLiteLedger


class LinkOfflineError(Exception):
    """Raised when an outbound network call is attempted while link is offline."""
    pass


class LinkState:
    def __init__(self, state_file: str | Path | None = None, ledger: SQLiteLedger | None = None):
        self.state_file = Path(state_file) if state_file else Path("data/link_state.json")
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        self.ledger = ledger
        self._state = self._read_state()

    def _read_state(self) -> str:
        if self.state_file.exists():
            try:
                with open(self.state_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("state", "offline")
            except Exception:
                return "offline"
        return "offline"

    def is_online(self) -> bool:
        return self._state == "online"

    def get_state(self) -> str:
        return self._state

    def set_state(self, new_state: str) -> None:
        if new_state not in ("online", "offline"):
            raise ValueError(f"Invalid link state '{new_state}'; must be 'online' or 'offline'.")
        old_state = self._state
        self._state = new_state
        with open(self.state_file, "w", encoding="utf-8") as f:
            json.dump({"state": new_state}, f)

        if self.ledger and old_state != new_state:
            self.ledger.log_event(
                "link_state_change",
                {"from": old_state, "to": new_state, "source": "link_state_manager"},
            )
