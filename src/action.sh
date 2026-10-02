#!/system/bin/sh
# KernelSU / APatch action: safely restart the persistent module daemon.
MODDIR=${0%/*}
LOCKFILE=/data/local/tmp/virgocore-service.pid
if [ "$1" = "run-all" ]; then
  if [ -f "$LOCKFILE" ]; then
    pid=$(cat "$LOCKFILE" 2>/dev/null); case "$pid" in ''|*[!0-9]*) pid="";; esac
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
    rm -f "$LOCKFILE"
  fi
  sh "$MODDIR/service.sh" --once
  ( sh "$MODDIR/service.sh" >/dev/null 2>&1 </dev/null & )
  echo "Virgo Core selected passes executed"
  exit 0
fi
if [ "$1" = "stop" ]; then
  if [ -f "$LOCKFILE" ]; then
    pid=$(cat "$LOCKFILE" 2>/dev/null)
    case "$pid" in ''|*[!0-9]*) pid="";; esac
    [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
  fi
  rm -f "$LOCKFILE"
  echo "Virgo Core service stopped and restore requested"
  exit 0
fi
if [ -f "$LOCKFILE" ]; then
  pid=$(cat "$LOCKFILE" 2>/dev/null)
  case "$pid" in ''|*[!0-9]*) pid="";; esac
  if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; i=0
    while kill -0 "$pid" 2>/dev/null && [ "$i" -lt 20 ]; do sleep 0.1; i=$((i+1)); done
  fi
  rm -f "$LOCKFILE"
fi
# Detach from the WebUI process; closing KernelSU does not stop this daemon.
( sh "$MODDIR/service.sh" >/dev/null 2>&1 </dev/null & )
echo "Virgo Core service restarted"
