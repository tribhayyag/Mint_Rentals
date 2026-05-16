#!/usr/bin/env bash
# Run every test in this directory. Exit non-zero on any failure.
#
# Run from repo root:
#     bash tools/tests/run_all.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"

cd "$REPO_ROOT"

fail=0

echo
echo ">>> Python integration suite (no Node required)"
python3 "$HERE/test_wizard_to_tools.py"
status=$?
if [ $status -ne 0 ]; then
  fail=1
fi

echo
echo ">>> Real-TS drift suite (Node + compiled TypeScript)"
bash "$HERE/test_real_ts.sh"
status=$?
if [ $status -ne 0 ]; then
  fail=1
fi

echo
if [ $fail -ne 0 ]; then
  echo "OVERALL: FAILURES"
  exit 1
fi
echo "OVERALL: ALL SUITES PASSED"
