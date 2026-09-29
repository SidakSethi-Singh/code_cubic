"""Link-state manager: one online/offline switch. UI toggles it; sync code reads it."""
import threading

_lock = threading.Lock()
_online = False  # devices start offline (offline-first)
_listeners = []


def is_online() -> bool:
    return _online


def set_online(value: bool) -> None:
    global _online
    with _lock:
        _online = bool(value)
    for fn in _listeners:
        fn(_online)


def on_change(fn) -> None:
    """Register fn(online: bool), e.g. for the UI badge."""
    _listeners.append(fn)