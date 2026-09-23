#!/usr/bin/env bash
set -uo pipefail

usage() {
  echo 'usage: test.sh --output_path <path> {base|new}' >&2
}

if [[ $# -lt 1 ]]; then
  usage
  exit 2
fi

case "$1" in
  --output_path)
    if [[ $# -lt 2 ]]; then
      usage
      exit 2
    fi
    output_path="$2"
    shift 2
    ;;
  --output_path=*)
    output_path="${1#*=}"
    shift
    ;;
  *)
    echo 'the first argument must be --output_path' >&2
    usage
    exit 2
    ;;
esac

if [[ -z "${output_path:-}" || $# -ne 1 ]]; then
  usage
  exit 2
fi

mkdir -p "$(dirname "$output_path")"

mode="$1"

case "$mode" in
  base)
    npx vitest run tests/unit/ --reporter=junit "--outputFile=$output_path" --exclude='**/fetch_request_policy_*.test.js'
    ;;
  new)
    npx vitest run tests/unit/fetch_request_policy_b84d2e.test.js --reporter=junit "--outputFile=$output_path"
    ;;
  *)
    echo 'mode must be base or new' >&2
    exit 2
    ;;
esac
