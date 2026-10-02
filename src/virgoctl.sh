#!/system/bin/sh
# Virgo Core config helper: the single writer for virgo.conf (WebUI and shell).
# usage: virgoctl.sh set KEY VALUE | preset low|balanced|performance|extreme | stock | migrate
case "$0" in */*) D=${0%/*};; *) D=.;; esac; C="$D/virgo.conf"; [ -f "$C" ] || : > "$C"
put() {
  # Alternative performance modes are mutually exclusive; the last user choice wins.
  case "$1:$2" in
    EXTREME_MODE:1) put ENABLE_FIXED_PERFORMANCE_MODE 0;;
    ENABLE_FIXED_PERFORMANCE_MODE:1) put EXTREME_MODE 0;;
    ENABLE_DNS:0) put DNS_PROVIDER cloudflare;;
  esac
  case "$1" in ''|*[!A-Z0-9_]*) echo "bad key"; exit 2;; esac
  case "$2" in *[!A-Za-z0-9_.,\ -]*) echo "bad value"; exit 2;; esac
  if grep -q "^$1=" "$C"; then sed -i "s|^$1=.*|$1=\"$2\"|" "$C"; else printf '%s="%s"\n' "$1" "$2" >> "$C"; fi
}
case "$1" in
  set) put "$2" "$3";;
  smart-optimize)
    # Adaptive safe profile: preserve user config, then enable only reversible
    # kernel/Android paths that the running device actually exposes.
    BAK=/data/local/tmp/virgocore-preopt.conf
    [ -f "$BAK" ] || cp -f "$C" "$BAK" 2>/dev/null || true
    put PROFILE custom
    put ENABLE_GAME_TUNING 1
    put ENABLE_MULTI_TOUCH 1
    put ENABLE_WIFI_LL 1
    put THERMAL_GUARD 1
    put THERMAL_LIMIT 44
    put ENABLE_SWAPPINESS 1
    put SWAPPINESS 30
    put ENABLE_PAGECLUSTER 1
    put ENABLE_READAHEAD 1
    put READAHEAD_KB 256
    put ENABLE_TCP_CC 0
    put TCP_FASTOPEN 1
    put TCP_NO_IDLE_SLOWSTART 1
    put TCP_LOWLAT_BUF 1
    put TCP_MTU_PROBE 1
    put ENABLE_DNS 0
    put ENABLE_FREQ_CONTROL 0
    put APPLY_FREQ_GOVERNOR 0
    put ENABLE_BG_CLEANUP 0
    put KILL_BG 0
    put PREM_THERMAL_DISABLE 0
    put EXTREME_MODE 0
    put ENABLE_FIXED_PERFORMANCE_MODE 0
    echo smart_optimize_applied
    ;;
  smart-restore)
    BAK=/data/local/tmp/virgocore-preopt.conf
    if [ -f "$BAK" ]; then cp -f "$BAK" "$C" && rm -f "$BAK" && echo smart_optimize_restored; else echo no_backup; fi
    ;;
  preset)
    n="$2"
    case "$n" in low) v="0 0 0 0 0 0";; balanced) v="1 0 1 0 0 -2";; performance) v="1 1 1 1 0 -5";; extreme) v="1 1 1 1 1 -8";; *) echo "bad profile"; exit 2;; esac
    set -- $v
    put PROFILE "$n"; put ENABLE_GAME_TUNING "$1"; put ENABLE_REFRESH_LOCK "$2"; put ENABLE_MULTI_TOUCH "$3"
    put ENABLE_FIXED_PERFORMANCE_MODE "$4"; put EXTREME_MODE "$5"; put GAME_NICE "$6";;
  report)
    echo "bootloader=$(getprop ro.boot.verifiedbootstate 2>/dev/null)"
    echo "kernel=$(uname -r 2>/dev/null)"
    echo "vendor=$(getprop ro.vendor.build.version.release 2>/dev/null)"
    echo "system=$(getprop ro.build.version.release 2>/dev/null)"
    echo "model=$(getprop ro.product.model 2>/dev/null)"
    echo "soc=$(getprop ro.soc.model 2>/dev/null)"
    for _p in /sys/devices/system/cpu/cpufreq/policy*; do [ -d "$_p" ] || continue; _id=${_p##*/}
      echo "cpu_${_id}_governors=$(cat "$_p/scaling_available_governors" 2>/dev/null)"
      echo "cpu_${_id}_frequencies=$(cat "$_p/scaling_available_frequencies" 2>/dev/null)"
    done
    for _gp in /sys/class/kgsl/kgsl-3d0 /sys/class/devfreq/*gpu* /sys/class/devfreq/*mali*; do [ -d "$_gp" ] || continue; _gid=${_gp##*/}
      echo "gpu_${_gid}_governors=$(cat "$_gp/available_governors" 2>/dev/null || cat "$_gp/devfreq/available_governors" 2>/dev/null)"
    done
    echo "battery_temp=$(cat /sys/class/power_supply/battery/temp 2>/dev/null)"
    echo "battery_voltage=$(cat /sys/class/power_supply/battery/voltage_now 2>/dev/null)"
    echo "battery_current=$(cat /sys/class/power_supply/battery/current_now 2>/dev/null)"
    exit 0;;
  stock)
    for k in ENABLE_GAME_TUNING ENABLE_REFRESH_LOCK ENABLE_MULTI_TOUCH ENABLE_FIXED_PERFORMANCE_MODE EXTREME_MODE ENABLE_WIFI_LL ENABLE_SWAPPINESS ENABLE_VFS ENABLE_READAHEAD DISABLE_IOSTATS ENABLE_ANIM ENABLE_TCP_CC TCP_FASTOPEN TCP_NO_IDLE_SLOWSTART TCP_LOWLAT_BUF TCP_MTU_PROBE ENABLE_DNS ENABLE_PAGECLUSTER KILL_BG GAME_MODE_PERF THERMAL_GUARD ENABLE_SPOOF ENABLE_FREQ_CONTROL APPLY_FREQ_GOVERNOR ENABLE_BG_CLEANUP; do put "$k" 0; done
    put TOUCH_SENSITIVITY 50; put SMOOTHNESS_LEVEL 50
    for p in PREM_HEADSHOT PREM_ZERO_RECOIL PREM_AI_AIM PREM_GYRO_FIX PREM_DESYNC_FIX PREM_BULL_REG PREM_BGMI_NET PREM_ULTRA_INSTINCT PREM_CONN_PRIORITY PREM_EXTREME_TOUCH PREM_FPS_UNLOCK PREM_THERMAL_DISABLE PREM_SCREEN_SMOOTH PREM_IOS_STABILITY PREM_VIDEO_SMOOTH PREM_SNAP_RESP PREM_FRAME_PHASE PREM_RAM_GUARD PREM_AUDIO_LAT PREM_THREAD_PIN PREM_JITTER_ABS PREM_STORAGE_BURST PREM_ENTROPY_BOOST PREM_MEMORY_ULTRA; do put "$p" 0; done
    put CPU_GOVERNOR schedutil; put CPU_MIN_FREQ 0; put CPU_MAX_FREQ 0; put GPU_GOVERNOR performance; put GPU_MAX_FREQ 0
    put PROTECT_PACKAGES "com.pubg.imobile com.android.systemui com.google.android.gms"; put KILL_PACKAGES ""; put START_AT_BOOT 1
    put PROFILE low;;
  migrate)
    # v5 derived every toggle from PROFILE; copy that once so upgrades keep the same behavior.
    grep -q '^CONF_VER=' "$C" && { echo ok; exit 0; }
    . "$C" 2>/dev/null; p=balanced
    case "$PROFILE" in low|balanced|performance|extreme) p="$PROFILE";; esac
    sh "$0" preset "$p" >/dev/null; put CONF_VER 6;;
  *) echo "usage: virgoctl.sh set KEY VALUE | preset NAME | smart-optimize | smart-restore | stock | migrate"; exit 2;;
esac
echo ok
