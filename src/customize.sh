#!/system/bin/sh
# ========================================================
# Virgo Core Installer - Engineered by VirgoYT
# All Credits to VirgoYT
# Guaranteed KernelSU WebUI, APatch, & Magisk Installation
# Dynamic Preservation of Existing User virgo.conf Settings
# ========================================================

SKIPUNZIP=0

ui_print " "
ui_print " __      _______ _____   _____  ______     _______ "
ui_print " \\ \\    / /_   _|  __ \\ / ____|/ __ \\ \\   / /__   __|"
ui_print "  \\ \\  / /  | | | |__) | |  __ | |  | \\ \\_/ /   | |   "
ui_print "   \\ \\/ /   | | |  _  /| | |_ || |  | |\\   /    | |   "
ui_print "    \\  /   _| |_| | \\ \\| |__| || |__| | | |     | |   "
ui_print "     \\/   |_____|_|  \\_\\\\_____/ \\____/  |_|     |_|   "
ui_print "==================================================="
ui_print "       VIRGO CORE // BUTTER PROFILES // EXTREME CPU-GPU MODE    "
ui_print "                 Author: VirgoYT                   "
ui_print "              All Credits to VirgoYT               "
ui_print "==================================================="
ui_print "[*] Target Display: Android-controlled refresh policy (optional preference)"
ui_print "[*] Touch and gyro: stock HAL preserved; vendor game node only"
ui_print "[*] CPU: stock scheduler and thermal policy preserved"
ui_print "[*] GPU: stock devfreq and thermal policy preserved"
ui_print "[*] Frame pacing: reversible game-only priority boost"
ui_print "[*] Memory: no periodic trim or cache dropping"
ui_print "[*] Scheduler: stock EAS and thermal policy preserved"
ui_print "[*] Network: stock TCP policy preserved"
ui_print " "

# Preserve existing configuration across re-flashes or updates
EXISTING_CONF="$MODPATH/virgo.conf"
[ -f "$EXISTING_CONF" ] || EXISTING_CONF="/data/adb/modules/virgo-bgmi-core/virgo.conf"
TEMP_CONF="/data/local/tmp/virgo_existing.conf"
rm -f "$TEMP_CONF" 2>/dev/null

if [ -f "$EXISTING_CONF" ]; then
  ui_print "- Found existing user configuration! Backing up to preserve custom settings..."
  cp -f "$EXISTING_CONF" "$TEMP_CONF"
fi

# Ensure webroot directory structure exists for KernelSU WebUI / KsuWebUI
mkdir -p "$MODPATH/webroot"

# Extract entire zip contents into MODPATH
ui_print "- Extracting Virgo Core files & WebUI assets..."
unzip -o "$ZIPFILE" -d "$MODPATH" >&2

# Verify webroot/index.html presence for KsuWebUI
if [ ! -f "$MODPATH/webroot/index.html" ]; then
  ui_print "- Populating KernelSU WebUI fallback..."
  mkdir -p "$MODPATH/webroot"
  unzip -o "$ZIPFILE" "webroot/*" -d "$MODPATH" >&2
fi

# Restore or create persistent virgo.conf runtime configuration
if [ -f "$TEMP_CONF" ]; then
  ui_print "- Restoring your persistent user configuration across boot and updates..."
  cp -f "$TEMP_CONF" "$MODPATH/virgo.conf"
  rm -f "$TEMP_CONF"
elif [ ! -f "$MODPATH/virgo.conf" ]; then
  cat << 'EOC' > "$MODPATH/virgo.conf"
# Butter frame-pacing defaults; stock Android policies remain authoritative.
PROFILE=balanced
ENABLE_GAME_TUNING=1
GAME_NICE=-2
ENABLE_REFRESH_LOCK=0
LOCKED_REFRESH_RATE_HZ=120
ENABLE_MULTI_TOUCH=1
ENABLE_FIXED_PERFORMANCE_MODE=0
EXTREME_MODE=0
POLL_INTERVAL_SEC=2
EOC
fi

sh "$MODPATH/virgoctl.sh" migrate >/dev/null 2>&1 || true

# Set proper execution permissions for Magisk, KernelSU, and APatch
set_perm_recursive "$MODPATH" 0 0 0755 0644
set_perm_recursive "$MODPATH/webroot" 0 0 0755 0644
set_perm "$MODPATH/service.sh" 0 0 0755
set_perm "$MODPATH/post-fs-data.sh" 0 0 0755
set_perm "$MODPATH/action.sh" 0 0 0755
set_perm "$MODPATH/virgoctl.sh" 0 0 0755
set_perm "$MODPATH/premium.sh" 0 0 0755
chmod 0755 "$MODPATH/premium.sh" 2>/dev/null
chmod 0755 "$MODPATH/service.sh" 2>/dev/null
chmod 0755 "$MODPATH/post-fs-data.sh" 2>/dev/null
chmod 0755 "$MODPATH/action.sh" 2>/dev/null
chmod -R 0755 "$MODPATH/webroot" 2>/dev/null
chmod 0644 "$MODPATH/webroot/index.html" 2>/dev/null
chmod 0644 "$MODPATH/virgo.conf" 2>/dev/null

ui_print " "
ui_print "[✓] KernelSU WebUI registered: $MODPATH/webroot/index.html"
ui_print "[✓] Configuration permanently active and preserved across reboots."
ui_print "==================================================="
ui_print "              All Credits to VirgoYT               "
ui_print "==================================================="

# Open VirgoYT YouTube channel
am start -a android.intent.action.VIEW -d "https://youtube.com/@VirgoYT707" >/dev/null 2>&1
