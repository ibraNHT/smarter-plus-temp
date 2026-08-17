#!/usr/bin/env sh
# Injected-code scan for the intrusion that has hit these repos four times
# (2026-06, 2026-08-03, 2026-08-15).
#
# This lives OUTSIDE .github/ deliberately: the same checks previously existed
# only inside security-guard.yml, so nobody could run them locally before
# pushing, or against a branch they were about to merge. Run it any time:
#
#     sh scripts/security-scan.sh              # scan the working tree
#     sh scripts/security-scan.sh origin/dev   # scan a ref without checking it out
#
# Exit 0 = clean, 1 = something found. CI calls this too, so the workflow and a
# developer's laptop can never disagree about what "clean" means.
set -u

REF="${1:-}"
fail=0
say() { printf '%s\n' "$*"; }
flag() { say "  !! $*"; fail=1; }
# Warnings do NOT fail the scan. A check that fires on legitimate code trains
# people to ignore the output — which is exactly how the 2026-08-15 alarm went
# unread. Keep hard failures for signals with no innocent explanation.
warn() { say "  ~  $*"; }

if [ -n "$REF" ]; then
  say "Scanning ref: $REF"
  ls_files() { git ls-tree -r --name-only "$REF"; }
  read_file() { git show "$REF:$1" 2>/dev/null; }
else
  say "Scanning working tree"
  ls_files() { git ls-files; }
  read_file() { cat "$1" 2>/dev/null; }
fi

# Exclude this scanner and the workflow: both legitimately name the signatures.
skip_self() { grep -vE '(^|/)(security-scan\.sh)$|^\.github/workflows/'; }

say "--- known loader signatures ---"
# Signatures observed across all four incidents. Each is SPLIT and rejoined at
# runtime on purpose: the CI guard greps the whole tree for these same literals,
# so spelling them out here would make this scanner flag itself and turn the
# Security guard permanently red — an alarm that always fires is one people stop
# reading, which is how the 2026-08-15 push went unnoticed.
SIG_GLOBAL="global.i=\"A1""0"
SIG_OBFUS="_0x49""63"
SIG_CHAIN="eth_getBlock""ByNumber"
for f in $(ls_files | skip_self); do
  case "$f" in *.js|*.mjs|*.cjs|*.ts|*.json|*.woff|*.woff2) ;; *) continue ;; esac
  body=$(read_file "$f") || continue
  case "$body" in
    *"$SIG_GLOBAL"*|*"$SIG_OBFUS"*|*"$SIG_CHAIN"*)
      flag "$f: known loader signature" ;;
  esac
  # createRequire in a config is how the payload reached Node's require from
  # ESM — but the Console's eslint.config.mjs has used it legitimately since
  # 2cd5d79, and the attacker chose it precisely because it blends in. On its
  # own it proves nothing, so it is a warning to eyeball, not a failure.
  case "$f" in
    *.config.js|*.config.mjs|*.config.cjs|postcss.config.*|eslint.config.*)
      case "$body" in
        *'createRequire(import.meta.url)'*) warn "$f: config uses createRequire — confirm it is intentional" ;;
      esac ;;
  esac
done

say "--- editor auto-run (RCE on folder open) ---"
# .vscode/tasks.json with runOn:folderOpen executes the moment the folder is
# opened in VS Code. That was the delivery mechanism on 2026-08-15.
for f in $(ls_files | grep '^\.vscode/' || true); do
  body=$(read_file "$f")
  case "$body" in
    *folderOpen*|*allowAutomaticTasks*) flag "$f: auto-executes on folder open" ;;
  esac
done

say "--- fonts that are not fonts ---"
# A real WOFF2 starts with the magic bytes wOF2; the planted payload starts with
# spaces. Same for WOFF (wOFF).
for f in $(ls_files | grep -E '\.woff2?$' || true); do
  magic=$(read_file "$f" | dd bs=1 count=4 2>/dev/null)
  case "$f" in
    *.woff2) [ "$magic" = "wOF2" ] || flag "$f: not a real .woff2 (magic='$magic')" ;;
    *.woff)  [ "$magic" = "wOFF" ] || flag "$f: not a real .woff (magic='$magic')" ;;
  esac
done

say "--- payload-hiding whitespace runs ---"
# The trojan leaves the real config intact and pushes the payload past a long
# run of spaces, so a diff and an editor both render it as unchanged.
for f in $(ls_files | grep -E '\.(js|mjs|cjs|ts|json)$' | grep -vE '(^|/)(dist|build|coverage|node_modules)/' | skip_self); do
  if read_file "$f" | grep -qE ' {200,}'; then
    flag "$f: 200+ consecutive spaces (payload-hiding pattern)"
  fi
done

if [ "$fail" -ne 0 ]; then
  say ""
  say "SCAN FAILED — do not build, run or deploy this tree."
  say "Do not open the folder in VS Code until .vscode/ is clean."
  exit 1
fi
say ""
say "Clean."
