"""Tiny test runner — no external deps.

Tests register themselves via the @test decorator. Run main() to execute all
registered tests in declaration order and exit with code 0 on success, 1 on
any failure. Each test is a function that calls `check(condition, message)`
zero or more times.
"""

import sys
import traceback
from typing import Callable

_REGISTRY: list[tuple[str, Callable[[], None]]] = []
_FAILURES: list[tuple[str, str]] = []
_CHECK_COUNT = [0]
_CURRENT_TEST: list[str] = ["<unset>"]


def test(name: str | None = None):
    def deco(fn: Callable[[], None]):
        _REGISTRY.append((name or fn.__name__, fn))
        return fn
    return deco


def check(cond: bool, message: str = ""):
    _CHECK_COUNT[0] += 1
    if not cond:
        _FAILURES.append((_CURRENT_TEST[0], message or "(condition false)"))


def main(suite_name: str = "tests") -> int:
    print(f"\n{'=' * 70}")
    print(f"  {suite_name}")
    print(f"{'=' * 70}\n")

    for name, fn in _REGISTRY:
        _CURRENT_TEST[0] = name
        before = len(_FAILURES)
        try:
            fn()
        except Exception:
            msg = traceback.format_exc().strip().splitlines()[-1]
            _FAILURES.append((name, "raised: " + msg))
            print(f"  ERROR  {name}")
            print(f"           - {msg}")
            continue
        if len(_FAILURES) > before:
            print(f"  FAIL   {name}")
            for n, m in _FAILURES[before:]:
                print(f"           - {m}")
        else:
            print(f"  PASS   {name}")

    print()
    if _FAILURES:
        print(f"FAILED: {len(_FAILURES)} of {_CHECK_COUNT[0]} checks failed across {len(_REGISTRY)} tests")
        return 1
    print(f"OK: {_CHECK_COUNT[0]} checks across {len(_REGISTRY)} tests")
    return 0
