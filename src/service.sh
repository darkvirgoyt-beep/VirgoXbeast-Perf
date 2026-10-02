#!/system/bin/sh
# Virgo Core — Butter profile with explicit, reversible Extreme Mode
# EXTREME_MODE=1 is intentionally opt-in: it can increase heat, drain battery,
# and eventually reduce FPS through thermal throttling. No sensor properties,
# RT priorities, core pinning, cache dropping, or SurfaceFlinger hacks are used.

MODDIR=${0%/*}
CONF_FILE="$MODDIR/virgo.conf"
LOGFILE=/data/local/tmp/virgocore.log
LOCKFILE=/data/local/tmp/virgocore-service.pid
STATEFILE=/data/local/tmp/virgocore-refresh.state
EXTREME_STATE=/data/local/tmp/virgocore-extreme

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOGFILE"; }
write_node() { [ -e "$1" ] || return 1; printf '%s\n' "$2" > "$1" 2>/dev/null; }

if [ "$1" != "--report" ] && [ "$1" != "--network-diagnostic" ] && [ -f "$LOCKFILE" ]; then
  old_pid=$(cat "$LOCKFILE" 2>/dev/null)
  if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then exit 0; fi
fi
echo "$$" > "$LOCKFILE"
trap 'command -v restore_frequency >/dev/null 2>&1 && restore_frequency; command -v restore_extreme >/dev/null 2>&1 && restore_extreme; command -v restore_refresh >/dev/null 2>&1 && restore_refresh; rm -f "$LOCKFILE"' EXIT TERM INT
until [ "$(getprop sys.boot_completed 2>/dev/null)" = "1" ]; do sleep 2; done

load_config() {
  [ -f "$CONF_FILE" ] && . "$CONF_FILE"
  : "${ENABLE_GAME_TUNING:=1}"
  : "${GAME_NICE:=-2}"
  : "${ENABLE_REFRESH_LOCK:=0}"
  : "${LOCKED_REFRESH_RATE_HZ:=120}"
  : "${ENABLE_MULTI_TOUCH:=1}"
  : "${ENABLE_FIXED_PERFORMANCE_MODE:=0}"
  : "${PROFILE:=balanced}"
  : "${EXTREME_MODE:=0}"
  : "${POLL_INTERVAL_SEC:=2}"
  : "${GAME_EXIT_POLLS:=3}"; case "$GAME_EXIT_POLLS" in ''|*[!0-9]*) GAME_EXIT_POLLS=3;; esac
  : "${ENABLE_WIFI_LL:=0}"; : "${ENABLE_SWAPPINESS:=0}"; : "${SWAPPINESS:=30}"
  : "${ENABLE_VFS:=0}"; : "${VFS_PRESSURE:=50}"; : "${ENABLE_READAHEAD:=0}"; : "${READAHEAD_KB:=256}"
  : "${DISABLE_IOSTATS:=0}"; : "${ENABLE_ANIM:=0}"; : "${ANIM_SCALE:=0.5}"; : "${EXTRA_GAME_PKGS:=}"
  : "${ENABLE_TCP_CC:=0}"; : "${TCP_CC:=cubic}"; : "${TCP_FASTOPEN:=0}"; : "${TCP_NO_IDLE_SLOWSTART:=0}"; : "${TCP_LOWLAT_BUF:=0}"; : "${TCP_MTU_PROBE:=0}"
  : "${ENABLE_DNS:=0}"; : "${DNS_PROVIDER:=cloudflare}"; : "${ENABLE_PAGECLUSTER:=0}"; : "${KILL_BG:=0}"; : "${GAME_MODE_PERF:=0}"; : "${THERMAL_GUARD:=0}"; : "${THERMAL_LIMIT:=44}"
    : "${PREM_BGMI_NET:=0}"; : "${PREM_DESYNC_FIX:=0}"; : "${PREM_BULL_REG:=0}"
  : "${PREM_GYRO_FIX:=0}"; : "${PREM_ZERO_RECOIL:=0}"; : "${PREM_AI_AIM:=0}"
  : "${PREM_EXTREME_TOUCH:=0}"; : "${PREM_FPS_UNLOCK:=0}"; : "${PREM_THERMAL_DISABLE:=0}"
  : "${PREM_SCREEN_SMOOTH:=0}"; : "${PREM_IOS_STABILITY:=0}"; : "${PREM_VIDEO_SMOOTH:=0}"
  : "${PREM_HEADSHOT:=0}"; : "${PREM_ULTRA_INSTINCT:=0}"; : "${PREM_CONN_PRIORITY:=0}"
  : "${PREM_MEMORY_ULTRA:=0}"; : "${PREM_SNAP_RESP:=0}"; : "${PREM_FRAME_PHASE:=0}"
  : "${PREM_RAM_GUARD:=0}"; : "${PREM_AUDIO_LAT:=0}"; : "${PREM_THREAD_PIN:=0}"
  : "${PREM_JITTER_ABS:=0}"; : "${PREM_STORAGE_BURST:=0}"; : "${PREM_ENTROPY_BOOST:=0}"
  : "${ENABLE_FREQ_CONTROL:=0}"; : "${CPU_GOVERNOR:=schedutil}"; : "${CPU_MIN_FREQ:=0}"; : "${CPU_MAX_FREQ:=0}"; : "${GPU_GOVERNOR:=performance}"; : "${GPU_MAX_FREQ:=0}"; : "${APPLY_FREQ_GOVERNOR:=0}"
  : "${ENABLE_BG_CLEANUP:=0}"; : "${PROTECT_PACKAGES:=com.pubg.imobile com.android.systemui com.google.android.gms}"; : "${KILL_PACKAGES:=}"; : "${START_AT_BOOT:=1}"
  # PROFILE is only a label now. Each toggle keeps the value the user set until the user changes it.
}
load_config

BGMI_PKGS="com.pubg.imobile com.tencent.ig com.pubg.krmobile com.vng.pubgmobile com.rekoo.pubgm"
FREEFIRE_PKGS="com.dts.freefireth com.dts.freefiremax"
GAME_PKGS="$BGMI_PKGS $FREEFIRE_PKGS"
LAST_GAME=""
LAST_EXTREME="0"

is_game_pkg() { case " $GAME_PKGS $EXTRA_GAME_PKGS " in *" $1 "*) return 0;; esac; return 1; }
foreground_pkg() {
  dumpsys activity activities 2>/dev/null | grep -m 1 -E 'mResumedActivity|mFocusedApp' \
    | sed -n 's/.*[ /]\([A-Za-z0-9_]*\.[A-Za-z0-9_.]*\)\/.*/\1/p' | head -n 1
}
report_device() {
  echo "bootloader=$(getprop ro.boot.verifiedbootstate 2>/dev/null)"
  echo "boot_mode=$(getprop ro.bootmode 2>/dev/null)"
  echo "kernel=$(uname -r 2>/dev/null)"
  echo "vendor=$(getprop ro.vendor.build.version.release 2>/dev/null)"
  echo "system=$(getprop ro.build.version.release 2>/dev/null)"
  echo "model=$(getprop ro.product.model 2>/dev/null)"
  echo "soc=$(getprop ro.soc.model 2>/dev/null)"
  # Auto-detect all CPU clusters
  for p in /sys/devices/system/cpu/cpufreq/policy*; do
    [ -d "$p" ] || continue; id=${p##*/}
    echo "cpu_${id}_governors=$(cat "$p/scaling_available_governors" 2>/dev/null)"
    echo "cpu_${id}_frequencies=$(cat "$p/scaling_available_frequencies" 2>/dev/null)"
  done
  # Auto-detect GPU: KGSL (Qualcomm), devfreq gpu (generic), mali (MediaTek/Samsung)
  for gp in /sys/class/kgsl/kgsl-3d0 /sys/class/devfreq/*gpu* /sys/class/devfreq/*mali*; do
    [ -d "$gp" ] || continue; gid=${gp##*/}
    echo "gpu_${gid}_governors=$(cat "$gp/available_governors" 2>/dev/null || cat "$gp/devfreq/available_governors" 2>/dev/null)"
    echo "gpu_${gid}_frequencies=$(cat "$gp/devfreq/available_frequencies" 2>/dev/null || cat "$gp/available_frequencies" 2>/dev/null)"
  done
}
charge_status() {
  v=$(cat /sys/class/power_supply/battery/voltage_now 2>/dev/null); i=$(cat /sys/class/power_supply/battery/current_now 2>/dev/null)
  case "$v:$i" in *[!0-9:-]*|:) w=0;; *) w=$((v*i/1000000000));; esac
  echo "charge_voltage_uv=${v:-0}"; echo "charge_current_ua=${i:-0}"; echo "charge_power_mw=${w:-0}"
  echo "charge_temp=$(cat /sys/class/power_supply/battery/temp 2>/dev/null)"; echo "charge_status=$(cat /sys/class/power_supply/battery/status 2>/dev/null)"
}
network_diagnostic() {
  host=$(printf '%s' "${DIAG_HOST:-1.1.1.1}" | tr -cd 'A-Za-z0-9.:-' | cut -c1-64); [ -n "$host" ] || host=1.1.1.1
  count=${DIAG_COUNT:-8}; case "$count" in 4|8|12) ;; *) count=8;; esac
  echo "diagnostic_host=$host"
  ping -c "$count" -W 2 "$host" 2>&1 | tail -n 3
  echo "route=$(ip route get "$host" 2>/dev/null | head -n 1)"
  echo "wifi=$(dumpsys wifi 2>/dev/null | grep -m 1 -E 'SSID|RSSI|Link speed' | tr '\n' ';')"
}
if [ "$1" = "--report" ]; then report_device; charge_status; exit 0; fi
if [ "$1" = "--network-diagnostic" ]; then network_diagnostic; exit 0; fi

# ── Desync + Bullet Registration Fix ─────────────────────────────────────────
# Targets: UDP socket buffers, TCP latency knobs, Wi-Fi power-save,
#          page-cluster, and DNS cache flush — all reversible.
DSYNC_STATE=/data/local/tmp/virgocore-desync.state

dsync_save() { node="$1"; key="$2"; [ -e "$node" ] || return 0; mkdir -p "$DSYNC_STATE"; [ -f "$DSYNC_STATE/$key" ] || cat "$node" > "$DSYNC_STATE/$key" 2>/dev/null; }
dsync_write() { node="$1"; value="$2"; label="$3"; [ -e "$node" ] || return 0; [ -w "$node" ] || { log "DESYNC SKIP $label: not writable"; return 0; }; printf '%s\n' "$value" > "$node" 2>/dev/null || log "DESYNC SKIP $label: write denied"; }

fix_desync() {
  mkdir -p "$DSYNC_STATE"
  # UDP receive/send socket buffers — bigger buffers absorb burst loss (bullet reg fix)
  dsync_save /proc/sys/net/core/rmem_max        rmem_max
  dsync_save /proc/sys/net/core/wmem_max        wmem_max
  dsync_save /proc/sys/net/core/rmem_default    rmem_default
  dsync_save /proc/sys/net/core/wmem_default    wmem_default
  dsync_save /proc/sys/net/core/netdev_max_backlog netdev_max_backlog
  dsync_save /proc/sys/net/core/optmem_max      optmem_max
  dsync_write /proc/sys/net/core/rmem_max        26214400 "UDP rmem_max"
  dsync_write /proc/sys/net/core/wmem_max        26214400 "UDP wmem_max"
  dsync_write /proc/sys/net/core/rmem_default    4194304  "UDP rmem_default"
  dsync_write /proc/sys/net/core/wmem_default    4194304  "UDP wmem_default"
  dsync_write /proc/sys/net/core/netdev_max_backlog 5000  "netdev backlog"
  dsync_write /proc/sys/net/core/optmem_max      65536    "optmem"

  # TCP latency: kill slow-start-after-idle, lower unsent buffer, enable fast-open
  dsync_save /proc/sys/net/ipv4/tcp_slow_start_after_idle tcp_ssai
  dsync_save /proc/sys/net/ipv4/tcp_notsent_lowat        tcp_nlowat
  dsync_save /proc/sys/net/ipv4/tcp_fastopen             tcp_fastopen
  dsync_save /proc/sys/net/ipv4/tcp_mtu_probing          tcp_mtu
  dsync_save /proc/sys/net/ipv4/tcp_fin_timeout          tcp_fin
  dsync_save /proc/sys/net/ipv4/tcp_keepalive_time       tcp_ktime
  dsync_save /proc/sys/net/ipv4/tcp_keepalive_intvl      tcp_kintvl
  dsync_write /proc/sys/net/ipv4/tcp_slow_start_after_idle 0        "TCP no-idle-slowstart"
  dsync_write /proc/sys/net/ipv4/tcp_notsent_lowat        16384     "TCP lowlat buf"
  dsync_write /proc/sys/net/ipv4/tcp_fastopen             3         "TCP fastopen"
  dsync_write /proc/sys/net/ipv4/tcp_mtu_probing          1         "TCP MTU probe"
  dsync_write /proc/sys/net/ipv4/tcp_fin_timeout          15        "TCP fin timeout"
  dsync_write /proc/sys/net/ipv4/tcp_keepalive_time       30        "TCP keepalive time"
  dsync_write /proc/sys/net/ipv4/tcp_keepalive_intvl      5         "TCP keepalive intvl"

  # Page-cluster=0: single-page swap-in cuts latency spikes mid-game
  dsync_save /proc/sys/vm/page-cluster pgc
  dsync_write /proc/sys/vm/page-cluster 0 "page-cluster"

  # Wi-Fi power-save off: eliminates the ~100 ms DTIM sleep desync window
  if iw dev 2>/dev/null | grep -q Interface; then
    iface=$(iw dev 2>/dev/null | awk '/Interface/{print $2}' | head -n 1)
    [ -n "$iface" ] && {
      orig=$(iw dev "$iface" get power_save 2>/dev/null | awk '{print $NF}')
      printf '%s\n' "${orig:-on}" > "$DSYNC_STATE/wifi_ps" 2>/dev/null
      iw dev "$iface" set power_save off 2>/dev/null && log "DESYNC: Wi-Fi power-save off ($iface)" || log "DESYNC SKIP: Wi-Fi power-save not writable"
    }
  fi
  # Android Wi-Fi low-latency (redundant coverage for non-iw ROMs)
  cmd wifi force-low-latency-mode enabled >/dev/null 2>&1 || true

  # DNS cache flush — stale DNS entries cause lobby join desync
  ndc resolver flushdefaultif 2>/dev/null || true
  ndc resolver flushif wlan0   2>/dev/null || true

  echo 1 > "$DSYNC_STATE/.active" 2>/dev/null
  log "Desync+BulletReg fix applied: UDP buffers, TCP latency, Wi-Fi PS off, DNS flush"
  echo "fix_ok"
}

restore_desync() {
  [ -d "$DSYNC_STATE" ] || return 0
  for pair in \
    rmem_max:/proc/sys/net/core/rmem_max \
    wmem_max:/proc/sys/net/core/wmem_max \
    rmem_default:/proc/sys/net/core/rmem_default \
    wmem_default:/proc/sys/net/core/wmem_default \
    netdev_max_backlog:/proc/sys/net/core/netdev_max_backlog \
    optmem_max:/proc/sys/net/core/optmem_max \
    tcp_ssai:/proc/sys/net/ipv4/tcp_slow_start_after_idle \
    tcp_nlowat:/proc/sys/net/ipv4/tcp_notsent_lowat \
    tcp_fastopen:/proc/sys/net/ipv4/tcp_fastopen \
    tcp_mtu:/proc/sys/net/ipv4/tcp_mtu_probing \
    tcp_fin:/proc/sys/net/ipv4/tcp_fin_timeout \
    tcp_ktime:/proc/sys/net/ipv4/tcp_keepalive_time \
    tcp_kintvl:/proc/sys/net/ipv4/tcp_keepalive_intvl \
    pgc:/proc/sys/vm/page-cluster; do
    key=${pair%%:*}; node=${pair#*:}
    [ -f "$DSYNC_STATE/$key" ] && dsync_write "$node" "$(cat "$DSYNC_STATE/$key")" "restore $key"
  done
  if [ -f "$DSYNC_STATE/wifi_ps" ]; then
    orig=$(cat "$DSYNC_STATE/wifi_ps")
    iface=$(iw dev 2>/dev/null | awk '/Interface/{print $2}' | head -n 1)
    [ -n "$iface" ] && iw dev "$iface" set power_save "$orig" 2>/dev/null || true
    cmd wifi force-low-latency-mode disabled >/dev/null 2>&1 || true
  fi
  rm -rf "$DSYNC_STATE"
  log "Desync+BulletReg fix restored to original values"
  echo "restore_ok"
}

desync_status() {
  [ -f "$DSYNC_STATE/.active" ] && echo "active" || echo "inactive"
}

if [ "$1" = "--fix-desync" ];     then load_config; fix_desync;    exit 0; fi
if [ "$1" = "--restore-desync" ]; then restore_desync;              exit 0; fi
if [ "$1" = "--desync-status" ];  then desync_status;               exit 0; fi
# ─────────────────────────────────────────────────────────────────────────────

[ "$1" = "--once" ] || [ "${START_AT_BOOT:-1}" = "1" ] || { log "Start at boot disabled by user"; exit 0; }

apply_game_priority() {
  [ "$ENABLE_GAME_TUNING" = "1" ] || return 0
  nice_value="$GAME_NICE"
  [ "$EXTREME_MODE" = "1" ] && nice_value=-8
  for pid in $(pidof "$1" 2>/dev/null); do renice "$nice_value" -p "$pid" >/dev/null 2>&1 || true; done
}

apply_game_refresh() {
  [ "$ENABLE_REFRESH_LOCK" = "1" ] || [ "$EXTREME_MODE" = "1" ] || return 0
  hz="$LOCKED_REFRESH_RATE_HZ"
  [ "$EXTREME_MODE" = "1" ] && hz=120
  case "$hz" in 60|90|120|144|165) ;; *) return 0;; esac
  [ -f "$STATEFILE" ] || {
    settings get system min_refresh_rate 2>/dev/null > "$STATEFILE"
    settings get system peak_refresh_rate 2>/dev/null >> "$STATEFILE"
  }
  settings put system min_refresh_rate "${hz}.0" 2>/dev/null || true
  settings put system peak_refresh_rate "${hz}.0" 2>/dev/null || true
}

restore_refresh() {
  [ -f "$STATEFILE" ] || return 0
  min=$(sed -n '1p' "$STATEFILE"); peak=$(sed -n '2p' "$STATEFILE")
  case "$min" in ''|null|default) settings delete system min_refresh_rate 2>/dev/null || true;; *) settings put system min_refresh_rate "$min" 2>/dev/null || true;; esac
  case "$peak" in ''|null|default) settings delete system peak_refresh_rate 2>/dev/null || true;; *) settings put system peak_refresh_rate "$peak" 2>/dev/null || true;; esac
  rm -f "$STATEFILE"
}

save_extreme_node() {
  node="$1"; key="$2"
  [ -e "$node" ] || return 0
  [ -e "$EXTREME_STATE/$key" ] || cat "$node" > "$EXTREME_STATE/$key" 2>/dev/null || true
}

enter_extreme() {
  # Thermal safety: refuse extreme if device is already hot (prevents reboot)
  _bt=$(cat /sys/class/power_supply/battery/temp 2>/dev/null); _bt=$(( ${_bt:-0} / 10 ))
  if [ "$_bt" -ge 44 ] 2>/dev/null; then
    log "EXTREME MODE REFUSED: battery ${_bt}°C >= 44°C safety limit"
    return 0
  fi
  mkdir -p "$EXTREME_STATE"
  # Only lock big/prime cluster to performance. Leave efficiency cores on schedutil to prevent thermal runaway.
  _pcount=0
  for policy in /sys/devices/system/cpu/cpufreq/policy*; do
    [ -d "$policy" ] || continue
    id=${policy##*/}; _pcount=$((_pcount+1))
    save_extreme_node "$policy/scaling_governor" "${id}_governor"
    save_extreme_node "$policy/scaling_min_freq" "${id}_min"
    save_extreme_node "$policy/scaling_max_freq" "${id}_max"
  done
  # Detect the lowest-freq cluster (efficiency) to skip it
  _eff_policy=""; _eff_freq=999999999
  for policy in /sys/devices/system/cpu/cpufreq/policy*; do
    [ -d "$policy" ] || continue
    _mf=$(cat "$policy/cpuinfo_max_freq" 2>/dev/null); _mf=${_mf:-0}
    [ "$_mf" -lt "$_eff_freq" ] 2>/dev/null && { _eff_freq=$_mf; _eff_policy=${policy##*/}; }
  done
  # Lock only non-efficiency clusters to performance
  for policy in /sys/devices/system/cpu/cpufreq/policy*; do
    [ -d "$policy" ] || continue
    id=${policy##*/}
    if [ "$_pcount" -le 1 ] || [ "$id" != "$_eff_policy" ]; then
      if grep -qw performance "$policy/scaling_available_governors" 2>/dev/null; then write_node "$policy/scaling_governor" performance; fi
      max=$(cat "$policy/cpuinfo_max_freq" 2>/dev/null)
      [ -n "$max" ] && write_node "$policy/scaling_min_freq" "$max"
      [ -n "$max" ] && write_node "$policy/scaling_max_freq" "$max"
    fi
  done
  for gpu in /sys/class/kgsl/kgsl-3d0 /sys/class/devfreq/*gpu* /sys/class/devfreq/*mali*; do
    [ -d "$gpu" ] || continue
    save_extreme_node "$gpu/governor" "${gpu##*/}_governor"
    save_extreme_node "$gpu/devfreq/governor" "${gpu##*/}_devfreq_governor"
    if [ -e "$gpu/governor" ] && grep -qw performance "$gpu/available_governors" 2>/dev/null; then write_node "$gpu/governor" performance; fi
    if [ -e "$gpu/devfreq/governor" ] && grep -qw performance "$gpu/devfreq/available_governors" 2>/dev/null; then write_node "$gpu/devfreq/governor" performance; fi
  done
  cmd power set-fixed-performance-mode-enabled true 2>/dev/null || true
  log "EXTREME MODE enabled: big/prime cluster perf-locked, efficiency cores preserved"
}

restore_extreme() {
  [ -d "$EXTREME_STATE" ] || return 0
  for policy in /sys/devices/system/cpu/cpufreq/policy*; do
    [ -d "$policy" ] || continue
    id=${policy##*/}
    [ -f "$EXTREME_STATE/${id}_governor" ] && write_node "$policy/scaling_governor" "$(cat "$EXTREME_STATE/${id}_governor")"
    [ -f "$EXTREME_STATE/${id}_min" ] && write_node "$policy/scaling_min_freq" "$(cat "$EXTREME_STATE/${id}_min")"
    [ -f "$EXTREME_STATE/${id}_max" ] && write_node "$policy/scaling_max_freq" "$(cat "$EXTREME_STATE/${id}_max")"
  done
  for gpu in /sys/class/kgsl/kgsl-3d0 /sys/class/devfreq/*gpu* /sys/class/devfreq/*mali*; do
    [ -d "$gpu" ] || continue
    key=${gpu##*/}
    [ -f "$EXTREME_STATE/${key}_governor" ] && write_node "$gpu/governor" "$(cat "$EXTREME_STATE/${key}_governor")"
    [ -f "$EXTREME_STATE/${key}_devfreq_governor" ] && write_node "$gpu/devfreq/governor" "$(cat "$EXTREME_STATE/${key}_devfreq_governor")"
  done
  cmd power set-fixed-performance-mode-enabled false 2>/dev/null || true
  rm -rf "$EXTREME_STATE"
  log "EXTREME MODE disabled: saved CPU policy restored"
}

FREQ_STATE=/data/local/tmp/virgocore-frequency.state
freq_save() { node="$1"; key="$2"; [ -e "$node" ] || return 0; [ -f "$FREQ_STATE.$key" ] || cat "$node" > "$FREQ_STATE.$key" 2>/dev/null; }
freq_write() { node="$1"; value="$2"; label="$3"; [ -e "$node" ] || return 0; [ -w "$node" ] || { log "SKIP $label: not writable"; return 0; }; printf '%s\n' "$value" > "$node" 2>/dev/null || log "SKIP $label: write denied"; }
apply_frequency_control() {
  [ "$ENABLE_FREQ_CONTROL" = "1" ] || return 0
  mkdir -p /data/local/tmp
  for policy in /sys/devices/system/cpu/cpufreq/policy*; do
    [ -d "$policy" ] || continue; id=${policy##*/}
    freq_save "$policy/scaling_governor" "${id}_gov"; freq_save "$policy/scaling_min_freq" "${id}_min"; freq_save "$policy/scaling_max_freq" "${id}_max"
    if [ "$APPLY_FREQ_GOVERNOR" = "1" ] && [ -e "$policy/scaling_available_governors" ] && grep -qw "$CPU_GOVERNOR" "$policy/scaling_available_governors" 2>/dev/null; then freq_write "$policy/scaling_governor" "$CPU_GOVERNOR" "CPU governor"; fi
    [ "$CPU_MIN_FREQ" -gt 0 ] 2>/dev/null && freq_write "$policy/scaling_min_freq" "$CPU_MIN_FREQ" "CPU minimum frequency"
    if [ "$CPU_MAX_FREQ" -gt 0 ] 2>/dev/null; then freq_write "$policy/scaling_max_freq" "$CPU_MAX_FREQ" "CPU maximum frequency"; else auto_max=$(cat "$policy/cpuinfo_max_freq" 2>/dev/null); [ -n "$auto_max" ] && freq_write "$policy/scaling_max_freq" "$auto_max" "auto-detected CPU maximum frequency"; fi
  done
  for gpu in /sys/class/kgsl/kgsl-3d0 /sys/class/devfreq/*gpu* /sys/class/devfreq/*mali*; do
    [ -d "$gpu" ] || continue; key=$(echo "$gpu" | tr '/' '_')
    if [ "$APPLY_FREQ_GOVERNOR" = "1" ] && [ -e "$gpu/governor" ]; then freq_save "$gpu/governor" "${key}_gov"; [ -e "$gpu/available_governors" ] && grep -qw "$GPU_GOVERNOR" "$gpu/available_governors" 2>/dev/null && freq_write "$gpu/governor" "$GPU_GOVERNOR" "GPU governor"; fi
    [ "$GPU_MAX_FREQ" -gt 0 ] 2>/dev/null && { [ -e "$gpu/max_freq" ] && freq_save "$gpu/max_freq" "${key}_max" && freq_write "$gpu/max_freq" "$GPU_MAX_FREQ" "GPU maximum frequency"; [ -e "$gpu/devfreq/max_freq" ] && freq_save "$gpu/devfreq/max_freq" "${key}_dfmax" && freq_write "$gpu/devfreq/max_freq" "$GPU_MAX_FREQ" "GPU devfreq maximum frequency"; }
  done
  log "Frequency policy synced for foreground game"
}
restore_frequency() {
  for policy in /sys/devices/system/cpu/cpufreq/policy*; do
    [ -d "$policy" ] || continue; id=${policy##*/}
    [ -f "$FREQ_STATE.${id}_gov" ] && freq_write "$policy/scaling_governor" "$(cat "$FREQ_STATE.${id}_gov")" "restore CPU governor"
    [ -f "$FREQ_STATE.${id}_min" ] && freq_write "$policy/scaling_min_freq" "$(cat "$FREQ_STATE.${id}_min")" "restore CPU minimum"
    [ -f "$FREQ_STATE.${id}_max" ] && freq_write "$policy/scaling_max_freq" "$(cat "$FREQ_STATE.${id}_max")" "restore CPU maximum"
  done
  for gpu in /sys/class/kgsl/kgsl-3d0 /sys/class/devfreq/*gpu* /sys/class/devfreq/*mali*; do
    [ -d "$gpu" ] || continue; key=$(echo "$gpu" | tr '/' '_')
    [ -f "$FREQ_STATE.${key}_gov" ] && [ -e "$gpu/governor" ] && freq_write "$gpu/governor" "$(cat "$FREQ_STATE.${key}_gov")" "restore GPU governor"
    [ -f "$FREQ_STATE.${key}_max" ] && [ -e "$gpu/max_freq" ] && freq_write "$gpu/max_freq" "$(cat "$FREQ_STATE.${key}_max")" "restore GPU maximum"
    [ -f "$FREQ_STATE.${key}_dfmax" ] && [ -e "$gpu/devfreq/max_freq" ] && freq_write "$gpu/devfreq/max_freq" "$(cat "$FREQ_STATE.${key}_dfmax")" "restore GPU devfreq maximum"
  done
  rm -f "$FREQ_STATE".*
}
is_protected_pkg() { case " $PROTECT_PACKAGES " in *" $1 "*) return 0;; esac; return 1; }
cleanup_selected_background() {
  [ "$ENABLE_BG_CLEANUP" = "1" ] || return 0
  for pkg in $KILL_PACKAGES; do
    [ -n "$pkg" ] || continue; is_protected_pkg "$pkg" && { log "PROTECTED: refusing to kill $pkg"; continue; }
    [ "$pkg" = "$1" ] && continue
    am kill "$pkg" >/dev/null 2>&1 && log "CLEANED: $pkg" || log "SKIP cleanup: $pkg"
  done
}

apply_touch_mode() {
  [ "$ENABLE_MULTI_TOUCH" = "1" ] || return 0
  for node in /proc/touchpanel/game_switch_enable /sys/class/touch/touch_dev/touch_thp_game /sys/class/touch/touch_dev/gesture_control; do
    [ -e "$node" ] && write_node "$node" 1
  done
}

apply_fixed_mode() { [ "$ENABLE_FIXED_PERFORMANCE_MODE" = "1" ] && cmd power set-fixed-performance-mode-enabled true 2>/dev/null || true; }

on_game_enter() {
  log "Game foreground: $1"
  apply_game_priority "$1"
  apply_game_refresh
  apply_touch_mode
  apply_fixed_mode
  apply_frequency_control
  cleanup_selected_background "$1"
  [ "$ENABLE_WIFI_LL" = "1" ] && { cmd wifi force-low-latency-mode enabled >/dev/null 2>&1; WIFI_LL_ON=1; }
  # Legacy KILL_BG is retained as a compatibility toggle but never invokes kill-all.
  [ "$KILL_BG" = "1" ] && cleanup_selected_background "$1"
  [ "$GAME_MODE_PERF" = "1" ] && { cmd game mode performance "$1" >/dev/null 2>&1; GM_PKG="$1"; }
}

on_game_exit() {
  restore_frequency
  [ "$EXTREME_MODE" = "0" ] && restore_refresh
  [ "$ENABLE_FIXED_PERFORMANCE_MODE" = "1" ] && [ "$EXTREME_MODE" = "0" ] && cmd power set-fixed-performance-mode-enabled false 2>/dev/null || true
  [ "$WIFI_LL_ON" = "1" ] && { cmd wifi force-low-latency-mode disabled >/dev/null 2>&1; WIFI_LL_ON=0; }
  [ -n "$GM_PKG" ] && { cmd game mode standard "$GM_PKG" >/dev/null 2>&1; GM_PKG=""; }
  log "Game left foreground"
}

SYS_STATE=/data/local/tmp/virgocore-sys
LAST_SUM=""
GAME_MISS=0
WIFI_LL_ON=0
tweak() { # flag node value key: apply and remember the original, or restore it when the flag is off
  [ -e "$2" ] || return 0
  if [ "$1" = "1" ]; then
    [ -f "$SYS_STATE/$4" ] || cat "$2" > "$SYS_STATE/$4" 2>/dev/null
    write_node "$2" "$3"
  elif [ -f "$SYS_STATE/$4" ]; then
    write_node "$2" "$(cat "$SYS_STATE/$4")"; rm -f "$SYS_STATE/$4"
  fi
}
apply_system() {
  mkdir -p "$SYS_STATE"
  tweak "$ENABLE_SWAPPINESS" /proc/sys/vm/swappiness "$SWAPPINESS" swap
  tweak "$ENABLE_VFS" /proc/sys/vm/vfs_cache_pressure "$VFS_PRESSURE" vfs
  for q in /sys/block/*/queue; do
    b=${q%/queue}; b=${b##*/}
    case "$b" in zram*|loop*|ram*) continue;; esac
    tweak "$ENABLE_READAHEAD" "$q/read_ahead_kb" "$READAHEAD_KB" "ra_$b"
    tweak "$DISABLE_IOSTATS" "$q/iostats" 0 "ios_$b"
  done
  if [ "$ENABLE_ANIM" = "1" ]; then
    for k in window_animation_scale transition_animation_scale animator_duration_scale; do settings put global "$k" "$ANIM_SCALE" 2>/dev/null; done
    touch "$MODDIR/.anim_on"
  elif [ -f "$MODDIR/.anim_on" ]; then
    for k in window_animation_scale transition_animation_scale animator_duration_scale; do settings put global "$k" 1.0 2>/dev/null; done
    rm -f "$MODDIR/.anim_on"
  fi
  tweak "$ENABLE_TCP_CC" /proc/sys/net/ipv4/tcp_congestion_control "$TCP_CC" tcc
  tweak "$TCP_FASTOPEN" /proc/sys/net/ipv4/tcp_fastopen 3 tfo
  tweak "$TCP_NO_IDLE_SLOWSTART" /proc/sys/net/ipv4/tcp_slow_start_after_idle 0 tssai
  tweak "$TCP_LOWLAT_BUF" /proc/sys/net/ipv4/tcp_notsent_lowat 16384 tnl
  tweak "$TCP_MTU_PROBE" /proc/sys/net/ipv4/tcp_mtu_probing 1 tmp
  tweak "$ENABLE_PAGECLUSTER" /proc/sys/vm/page-cluster 0 pgc
  apply_dns
  apply_premium
  log "System tweaks synced"
}

GUARD_TRIP=0
LAST_KILL=0
GM_PKG=""

apply_premium() {
  [ -f "$MODDIR/premium.sh" ] || return 0
  # Serialize premium operations: queue all, run max 4 at a time to prevent process storms
  _prem_queue=""
  _add_prem() { _prem_queue="$_prem_queue $1"; }
  if [ "$PREM_BGMI_NET" = "1" ]; then _add_prem "--bgmi-net-fix"
  elif [ "$PREM_BGMI_NET" = "0" ]; then _add_prem "--bgmi-net-restore"; fi
  if [ "$PREM_DESYNC_FIX" = "1" ]; then _add_prem "--fix-desync"
  elif [ "$PREM_DESYNC_FIX" = "0" ]; then _add_prem "--restore-desync"; fi
  if [ "$PREM_BULL_REG" = "1" ]; then _add_prem "--bullet-reg-fix"
  elif [ "$PREM_BULL_REG" = "0" ]; then _add_prem "--bullet-reg-restore"; fi
  if [ "$PREM_GYRO_FIX" = "1" ]; then _add_prem "--gyro-fix"
  elif [ "$PREM_GYRO_FIX" = "0" ]; then _add_prem "--gyro-restore"; fi
  if [ "$PREM_ZERO_RECOIL" = "1" ]; then _add_prem "--zero-recoil-start ${ZR_STRENGTH:-2}"
  elif [ "$PREM_ZERO_RECOIL" = "0" ]; then _add_prem "--zero-recoil-stop"; fi
  if [ "$PREM_AI_AIM" = "1" ]; then _add_prem "--aim-start ${AIM_SENS:-2}"
  elif [ "$PREM_AI_AIM" = "0" ]; then _add_prem "--aim-stop"; fi
  if [ "$PREM_EXTREME_TOUCH" = "1" ]; then _add_prem "--touch-extreme"
  elif [ "$PREM_EXTREME_TOUCH" = "0" ]; then _add_prem "--touch-restore"; fi
  if [ "$PREM_FPS_UNLOCK" = "1" ]; then _add_prem "--fps-unlock"
  elif [ "$PREM_FPS_UNLOCK" = "0" ]; then _add_prem "--fps-restore"; fi
  if [ "$PREM_THERMAL_DISABLE" = "1" ]; then _add_prem "--thermal-disable"
  elif [ "$PREM_THERMAL_DISABLE" = "0" ]; then _add_prem "--thermal-restore"; fi
  if [ "$PREM_SCREEN_SMOOTH" = "1" ]; then _add_prem "--screen-smooth"
  elif [ "$PREM_SCREEN_SMOOTH" = "0" ]; then _add_prem "--screen-smooth-restore"; fi
  if [ "$PREM_IOS_STABILITY" = "1" ]; then _add_prem "--ios-stability"
  elif [ "$PREM_IOS_STABILITY" = "0" ]; then _add_prem "--ios-restore"; fi
  if [ "$PREM_VIDEO_SMOOTH" = "1" ]; then _add_prem "--video-smooth"
  elif [ "$PREM_VIDEO_SMOOTH" = "0" ]; then _add_prem "--video-smooth-restore"; fi
  [ "$PREM_HEADSHOT" = "1" ] && _add_prem "--headshot-start"
  [ "$PREM_HEADSHOT" = "0" ] && _add_prem "--headshot-stop"
  [ "$PREM_ULTRA_INSTINCT" = "1" ] && _add_prem "--ultra-instinct"
  [ "$PREM_ULTRA_INSTINCT" = "0" ] && _add_prem "--ultra-instinct-restore"
  [ "$PREM_CONN_PRIORITY" = "1" ] && _add_prem "--conn-priority"
  [ "$PREM_CONN_PRIORITY" = "0" ] && _add_prem "--conn-priority-restore"
  [ "$PREM_MEMORY_ULTRA" = "1" ] && _add_prem "--memory-ultra"
  [ "$PREM_MEMORY_ULTRA" = "0" ] && _add_prem "--memory-ultra-restore"
  [ "$PREM_SNAP_RESP" = "1" ] && _add_prem "--snap-response"
  [ "$PREM_SNAP_RESP" = "0" ] && _add_prem "--snap-restore"
  [ "$PREM_FRAME_PHASE" = "1" ] && _add_prem "--frame-phase-lock"
  [ "$PREM_FRAME_PHASE" = "0" ] && _add_prem "--frame-phase-restore"
  [ "$PREM_RAM_GUARD" = "1" ] && _add_prem "--ram-guard-start"
  [ "$PREM_RAM_GUARD" = "0" ] && _add_prem "--ram-guard-stop"
  [ "$PREM_AUDIO_LAT" = "1" ] && _add_prem "--audio-latency"
  [ "$PREM_AUDIO_LAT" = "0" ] && _add_prem "--audio-latency-restore"
  [ "$PREM_THREAD_PIN" = "1" ] && _add_prem "--thread-pin-start"
  [ "$PREM_THREAD_PIN" = "0" ] && _add_prem "--thread-pin-stop"
  [ "$PREM_JITTER_ABS" = "1" ] && _add_prem "--jitter-absorb"
  [ "$PREM_JITTER_ABS" = "0" ] && _add_prem "--jitter-restore"
  [ "$PREM_STORAGE_BURST" = "1" ] && _add_prem "--storage-burst"
  [ "$PREM_STORAGE_BURST" = "0" ] && _add_prem "--storage-burst-restore"
  [ "$PREM_ENTROPY_BOOST" = "1" ] && _add_prem "--entropy-start"
  [ "$PREM_ENTROPY_BOOST" = "0" ] && _add_prem "--entropy-stop"
  # Run serialized: max 4 concurrent, wait between batches
  _run=0
  for _flag in $_prem_queue; do
    sh "$MODDIR/premium.sh" $_flag >/dev/null 2>&1 &
    _run=$((_run+1))
    [ $((_run % 4)) -eq 0 ] && wait
  done
  wait
}

apply_dns() { # Private DNS: remember the original once, restore it when turned off
  if [ "$ENABLE_DNS" = "1" ]; then
    [ -f "$MODDIR/.dns_orig" ] || echo "$(settings get global private_dns_mode 2>/dev/null)|$(settings get global private_dns_specifier 2>/dev/null)" > "$MODDIR/.dns_orig"
    case "$DNS_PROVIDER" in google) h=dns.google;; *) h=one.one.one.one;; esac
    settings put global private_dns_specifier "$h" 2>/dev/null; settings put global private_dns_mode hostname 2>/dev/null
  elif [ -f "$MODDIR/.dns_orig" ]; then
    o=$(cat "$MODDIR/.dns_orig"); m=${o%%|*}; sp=${o#*|}
    case "$m" in ''|null) settings delete global private_dns_mode 2>/dev/null;; *) settings put global private_dns_mode "$m" 2>/dev/null;; esac
    case "$sp" in ''|null) settings delete global private_dns_specifier 2>/dev/null;; *) settings put global private_dns_specifier "$sp" 2>/dev/null;; esac
    rm -f "$MODDIR/.dns_orig"
  fi
}
thermal_guard() { # pause Extreme and fixed performance when the battery is hot; resume 3C below the limit
  if [ "$THERMAL_GUARD" != "1" ]; then
    if [ "$GUARD_TRIP" = "1" ]; then GUARD_TRIP=0; [ -n "$LAST_GAME" ] && apply_fixed_mode; fi
    return 0
  fi
  t=$(cat /sys/class/power_supply/battery/temp 2>/dev/null); t=$(( ${t:-0} / 10 ))
  if [ "$GUARD_TRIP" != "1" ] && [ "$t" -ge "$THERMAL_LIMIT" ]; then
    GUARD_TRIP=1; log "Thermal guard: ${t}C reached, high-power modes paused"
    cmd power set-fixed-performance-mode-enabled false 2>/dev/null || true
  elif [ "$GUARD_TRIP" = "1" ] && [ "$t" -le $(( THERMAL_LIMIT - 3 )) ]; then
    GUARD_TRIP=0; log "Thermal guard: ${t}C, high-power modes resumed"
    [ -n "$LAST_GAME" ] && apply_fixed_mode
  fi
}

if [ "$1" = "--once" ]; then
  load_config
  apply_system
  active=$(foreground_pkg)
  if is_game_pkg "$active"; then on_game_enter "$active"; else log "Run all selected: no configured game is foreground"; fi
  log "Run all selected complete; unsupported operations were skipped"
  exit 0
fi
log "Butter service active; PROFILE=$PROFILE EXTREME_MODE=$EXTREME_MODE"
while true; do
  load_config
  sum=$(cksum < "$CONF_FILE" 2>/dev/null)
  if [ "$sum" != "$LAST_SUM" ]; then
    # Debounce config changes: a preset / smart-optimize rewrites many keys back to back.
    # Wait until virgo.conf has been quiet for 0.3s (max ~2.4s), re-read once, apply once.
    n=0
    while [ "$n" -lt 8 ]; do
      sleep 0.3
      s2=$(cksum < "$CONF_FILE" 2>/dev/null)
      [ "$s2" = "$sum" ] && break
      sum="$s2"; n=$((n+1))
    done
    load_config
    apply_system; LAST_SUM="$sum"
  fi
  thermal_guard
  if [ "$GUARD_TRIP" = "1" ]; then EXTREME_MODE=0; ENABLE_FIXED_PERFORMANCE_MODE=0; fi
  active=$(foreground_pkg)

  # Extreme CPU/GPU locking is game-scoped. Never max-lock the device while
  # Android is booting or while KernelSU/WebUI is closed; that was the reboot
  # and heat/throttle failure mode.
  if is_game_pkg "$active"; then
    GAME_MISS=0
    if [ "$active" != "$LAST_GAME" ]; then
      [ -n "$LAST_GAME" ] && on_game_exit
      if [ "$EXTREME_MODE" = "1" ] && [ "$LAST_EXTREME" != "1" ]; then
        enter_extreme
        LAST_EXTREME="1"
      fi
      on_game_enter "$active"
      LAST_GAME="$active"
    else
      if [ "$EXTREME_MODE" = "1" ] && [ "$LAST_EXTREME" != "1" ]; then
        enter_extreme
        LAST_EXTREME="1"
      elif [ "$EXTREME_MODE" != "1" ] && [ "$LAST_EXTREME" = "1" ]; then
        restore_extreme
        restore_refresh
        LAST_EXTREME="0"
      fi
      apply_game_priority "$active"
      [ "$EXTREME_MODE" = "1" ] && apply_game_refresh
    fi
  else
    # Debounce game exit: a dialog, the notification shade or one empty/failed dumpsys must not
    # tear the tuning down and rebuild it on the next poll. Exit only after GAME_EXIT_POLLS
    # consecutive polls with no game in the foreground (1 = old behaviour).
    [ -n "$LAST_GAME" ] && GAME_MISS=$((GAME_MISS+1))
    if [ -z "$LAST_GAME" ] || [ "$GAME_MISS" -ge "$GAME_EXIT_POLLS" ]; then
      [ -n "$LAST_GAME" ] && on_game_exit
      LAST_GAME=""; GAME_MISS=0
      if [ "$LAST_EXTREME" = "1" ]; then
        restore_extreme
        restore_refresh
        LAST_EXTREME="0"
      fi
    fi
  fi
  sleep "$POLL_INTERVAL_SEC"
done
