#!/usr/bin/env bash
# Test stub for Firstmate's bin/fm-tasks-axi.sh. Writes nothing in this
# fixture: it appends its argv to $FM_STUB_LOG when set, and answers `show`
# from $FM_STUB_SHOW_DIR/<id> when that file exists.
set -u
[ -z "${FM_STUB_LOG:-}" ] || printf 'fm-tasks-axi.sh FM_HOME=%s %s\n' "${FM_HOME:-}" "$*" >> "$FM_STUB_LOG"
if [ "${1:-}" = show ]; then
  if [ -n "${FM_STUB_SHOW_DIR:-}" ] && [ -f "$FM_STUB_SHOW_DIR/${2:-}" ]; then
    cat "$FM_STUB_SHOW_DIR/$2"
    exit 0
  fi
  echo "error: no task ${2:-}" >&2
  exit 1
fi
exit 0
