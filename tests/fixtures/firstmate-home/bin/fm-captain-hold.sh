#!/usr/bin/env bash
# Test stub for Firstmate's bin/fm-captain-hold.sh. Writes nothing in this
# fixture: it appends its argv, one argument per line, to $FM_STUB_LOG when set.
# A title containing FAIL makes it exit 1, to exercise the failure path.
set -u
if [ -n "${FM_STUB_LOG:-}" ]; then
  printf 'fm-captain-hold.sh FM_HOME=%s\n' "${FM_HOME:-}" >> "$FM_STUB_LOG"
  for arg in "$@"; do printf '  %s\n' "$arg" >> "$FM_STUB_LOG"; done
fi
case "$*" in *FAIL*) echo "fm-captain-hold: refused" >&2; exit 1 ;; esac
exit 0
