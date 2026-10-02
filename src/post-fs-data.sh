#!/system/bin/sh
# Virgo Core — no early boot performance hacks.
# Android's LMKD, scheduler, thermal service, sensor HAL, and display policy
# remain in control to prevent boot-time policy conflicts and frame-time spikes.
LOGFILE=/data/local/tmp/virgocore-postfs.log
mkdir -p /data/local/tmp 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] smooth profile early boot: stock policies preserved" > "$LOGFILE"
rm -rf /data/local/tmp/virgocore-sys 2>/dev/null
# Optional device profile (opt-in in the WebUI; needs a reboot to change)
CONF="${0%/*}/virgo.conf"; [ -f "$CONF" ] && . "$CONF" 2>/dev/null
if [ "$ENABLE_SPOOF" = "1" ]; then
  case "$SPOOF_DEVICE" in
    rog6) b=asus; m=ASUS_AI2201;;
    rog9) b=asus; m=ASUSAI2401;;
    redmagic11) b=nubia; m=NX789J;;
    iqoo15) b=vivo; m=V2431;;
    s23u) b=samsung; m=SM-S918B;;
    s26) b=samsung; m=SM-S942B;;
    *) b=OnePlus; m=LE2123;;
  esac
  RP=resetprop; command -v resetprop >/dev/null 2>&1 || RP="magisk resetprop"
  $RP -n ro.product.brand "$b"; $RP -n ro.product.manufacturer "$b"; $RP -n ro.product.model "$m"
  echo "device profile: $b $m" >> "$LOGFILE"
fi
exit 0
