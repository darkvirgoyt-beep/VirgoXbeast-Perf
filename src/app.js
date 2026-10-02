const M='/data/adb/modules/virgoxbeast-perf';
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];

const D={PROFILE:'balanced',ENABLE_GAME_TUNING:'1',GAME_NICE:'-2',ENABLE_REFRESH_LOCK:'0',LOCKED_REFRESH_RATE_HZ:'120',ENABLE_MULTI_TOUCH:'1',ENABLE_FIXED_PERFORMANCE_MODE:'0',EXTREME_MODE:'0',ENABLE_FREQ_CONTROL:'0',CPU_GOVERNOR:'schedutil',CPU_MIN_FREQ:'0',CPU_MAX_FREQ:'0',GPU_GOVERNOR:'performance',GPU_MAX_FREQ:'0',ENABLE_BG_CLEANUP:'0',PROTECT_PACKAGES:'com.pubg.imobile com.android.systemui com.google.android.gms',KILL_PACKAGES:'',START_AT_BOOT:'1',ENABLE_WIFI_LL:'0',EXTRA_GAME_PKGS:'',ENABLE_SWAPPINESS:'0',SWAPPINESS:'30',ENABLE_VFS:'0',VFS_PRESSURE:'50',ENABLE_READAHEAD:'0',READAHEAD_KB:'256',DISABLE_IOSTATS:'0',ENABLE_ANIM:'0',ANIM_SCALE:'0.5',ENABLE_TCP_CC:'0',TCP_CC:'cubic',TCP_FASTOPEN:'0',TCP_NO_IDLE_SLOWSTART:'0',TCP_LOWLAT_BUF:'0',TCP_MTU_PROBE:'0',ENABLE_DNS:'0',DNS_PROVIDER:'cloudflare',ENABLE_PAGECLUSTER:'0',KILL_BG:'0',GAME_MODE_PERF:'0',THERMAL_GUARD:'0',THERMAL_LIMIT:'44',ENABLE_SPOOF:'0',SPOOF_DEVICE:'op9pro',TOUCH_SENSITIVITY:'50',SMOOTHNESS_LEVEL:'50'};
const PK=new Set(['ENABLE_GAME_TUNING','ENABLE_REFRESH_LOCK','ENABLE_MULTI_TOUCH','ENABLE_FIXED_PERFORMANCE_MODE','EXTREME_MODE','GAME_NICE','ENABLE_FREQ_CONTROL','CPU_GOVERNOR','CPU_MIN_FREQ','CPU_MAX_FREQ','GPU_GOVERNOR','GPU_MAX_FREQ','ENABLE_BG_CLEANUP','PROTECT_PACKAGES','KILL_PACKAGES','START_AT_BOOT']);
const PROF=[['low','Low'],['balanced','Balanced'],['performance','Boost'],['extreme','Extreme']];

const PAGES={game:['Game',[['Frame pacing',[['ENABLE_GAME_TUNING','Game priority boost','Mild reversible priority raise for the active game',{k:'GAME_NICE',o:[['-2','Mild'],['-5','Med'],['-8','Strong']]}],['ENABLE_REFRESH_LOCK','Lock refresh rate','Applies while a game is open',{k:'LOCKED_REFRESH_RATE_HZ',o:[['60','60'],['90','90'],['120','120'],['144','144'],['165','165']]}],['ENABLE_FIXED_PERFORMANCE_MODE','Fixed performance mode',"Android's own perf mode",0,1]]],['Touch &amp; input',[['ENABLE_MULTI_TOUCH','Game touch mode','Native game-mode touch path'],['START_AT_BOOT','Start profile at boot','Service loads settings after Android boot'],['ENABLE_WIFI_LL','Wi-Fi low latency','Requests low-latency Wi-Fi while game is open']]],['Max power',[['EXTREME_MODE','Max CPU + GPU in games','Runs at peak only while game is open',0,1]]],['CPU &amp; GPU',[['ENABLE_FREQ_CONTROL','Live frequency policy','Detects writable CPU/GPU paths, restores on game close'],['CPU_GOVERNOR','CPU governor','Uses governors exposed by your kernel',{k:'CPU_GOVERNOR',o:[['schedutil','schedutil'],['performance','performance'],['powersave','powersave'],['ondemand','ondemand']]}],['CPU_MIN_FREQ','Min CPU freq (kHz)','0 = device default','txt'],['CPU_MAX_FREQ','Max CPU freq (kHz)','0 = device default','txt'],['GPU_GOVERNOR','GPU governor','Supported governor only',{k:'GPU_GOVERNOR',o:[['performance','performance'],['simple_ondemand','ondemand'],['powersave','powersave']]}],['GPU_MAX_FREQ','Max GPU freq (kHz)','0 = device default','txt']]],['Memory',[['ENABLE_BG_CLEANUP','Clean selected background apps','Only packages in kill list'],['PROTECT_PACKAGES','Never-kill packages','Space-separated package names','txt'],['KILL_PACKAGES','Cleanup package list','Space-separated. Empty = no kill','txt']]],['Thermal guard',[['THERMAL_GUARD','Pause high-power when hot','Watches battery temp, resumes when cool',{k:'THERMAL_LIMIT',o:[['42','42°C'],['44','44°C'],['46','46°C']]}]]],['Game list',[['EXTRA_GAME_PKGS','Extra game packages','Space-separated additional packages','txt']]]]],net:['Network',[['Congestion',[['ENABLE_TCP_CC','Custom TCP algorithm','Choose TCP loss reaction algorithm',{k:'TCP_CC',o:'@cc'}]]],['Stability',[['TCP_NO_IDLE_SLOWSTART','Keep speed after idle','Stop TCP slowing after short pauses'],['TCP_LOWLAT_BUF','Lower send buffering','Reduce bufferbloat on your connection'],['TCP_MTU_PROBE','Auto MTU probing','Recover from routes that drop large packets'],['TCP_FASTOPEN','TCP Fast Open','Save a round trip on reconnect']]],['DNS',[['ENABLE_DNS','Private DNS provider','Faster lookups for lobby + login',{k:'DNS_PROVIDER',o:[['cloudflare','Cloudflare 1.1.1.1'],['google','Google 8.8.8.8']]}]]]]],sys:['System',[['Memory',[['ENABLE_SWAPPINESS','Lower swappiness','Keep more game data in RAM',{k:'SWAPPINESS',o:[['10','10'],['30','30'],['60','60']]}],['ENABLE_VFS','Hold file caches','Keep directory caches longer',{k:'VFS_PRESSURE',o:[['30','30'],['50','50'],['80','80']]}],['ENABLE_PAGECLUSTER','Faster swap-in','One page at a time from compressed memory']]],['Storage',[['ENABLE_READAHEAD','Faster reads','Larger read-ahead for internal storage',{k:'READAHEAD_KB',o:[['128','128K'],['256','256K'],['512','512K']]}],['DISABLE_IOSTATS','Skip I/O stats','Remove bookkeeping overhead']]],['Device profile',[['ENABLE_SPOOF','Spoof device model','Changes model apps see. Reboot required.',{k:'SPOOF_DEVICE',o:[['op9pro','OnePlus 9 Pro'],['rog6','ROG Phone 6'],['rog9','ROG Phone 9 Pro'],['redmagic11','RedMagic 11'],['iqoo15','iQOO 15'],['s23u','S23 Ultra'],['s26','Galaxy S26']]},1]]],['Animations',[['ENABLE_ANIM','Faster animations','Speed up window and transition scales',{k:'ANIM_SCALE',o:[['0.75','0.75×'],['0.5','0.5×'],['0.25','0.25×'],['0.0','Off']]}]]]]]};

const NAV=[
  ['home','Home','M4 11l8-7 8 7v9h-5v-6H9v6H4z'],
  ['game','Game','M7 8h10a4 4 0 014 4v1a3 3 0 01-5.2 2l-1-1.2H9.2l-1 1.2A3 3 0 013 13v-1a4 4 0 014-4zM8 10.5v3M6.5 12h3'],
  ['net','Net','M12 3a9 9 0 100 18A9 9 0 0012 3zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9'],
  ['sys','Sys','M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4'],
  ['adv','Advanced','M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'],
  ['freq','CPU/GPU','M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18'],
  ['prem','Premium','M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  ['games','Games','M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'],
  ['term','Term','M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'],
  ['diag','Diag','M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
  ['tools','Tools','M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z']
];

const STAT="c=/sys/devices/system/cpu;bc='';bm=0;for p in $c/cpufreq/policy*/cpuinfo_max_freq;do [ -f \"$p\" ]||continue;f=$(cat $p 2>/dev/null);d=${p%/cpuinfo_max_freq};d=${d##*/policy};if [ ${f:-0} -gt $bm ];then bm=$f;bc=$d;fi;done;[ -n \"$bc\" ]&&echo cpu=$(cat $c/cpu${bc}/cpufreq/scaling_cur_freq 2>/dev/null)||echo cpu=0;gf='';for gp in /sys/class/kgsl/kgsl-3d0/gpuclk /sys/class/kgsl/kgsl-3d0/devfreq/cur_freq /sys/class/devfreq/*gpu*/cur_freq /sys/class/devfreq/*mali*/cur_freq;do [ -f \"$gp\" ]&&gf=$(cat $gp 2>/dev/null)&&break;done;echo gpu=${gf:-0};echo ram=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo);echo tmp=$(cat /sys/class/power_supply/battery/temp 2>/dev/null);echo bv=$(cat /sys/class/power_supply/battery/voltage_now 2>/dev/null);echo bi=$(cat /sys/class/power_supply/battery/current_now 2>/dev/null);echo hz=$(dumpsys display 2>/dev/null|grep -oE 'refreshRate=[0-9]+'|tail -n1|grep -oE '[0-9]+');p=$(cat /data/local/tmp/virgocore-service.pid 2>/dev/null);if [ -n \"$p\" ] && [ -d /proc/\"$p\" ]; then echo up=1; else echo up=0; fi";

let C={...D},CC=['cubic','bbr'],cur='home',io,tt,premTimer,freqTimer,termHistory=[];
let premPollBusy=false,premPollQueued=false,pollBusy=false,deviceBusy=false;
const premDesired=Object.create(null),premRetry=Object.create(null),premTimers=Object.create(null);
let zrStrength=2,aimSens=2,devDetected=false,protectSet=new Set();

// ── Shell exec ────────────────────────────────────────────────────────────────
function sh(cmd,ms=9000){return new Promise(res=>{
  if(!window.ksu||!ksu.exec)return res({code:0,out:'ok'});
  const cb='vc'+Date.now()+Math.random().toString(36).slice(2),done=r=>{clearTimeout(t);delete window[cb];res(r)};
  const t=setTimeout(()=>done({code:-1,out:'timeout'}),ms);
  window[cb]=(c,o)=>done({code:c,out:o||''});
  try{const r=ksu.exec(cmd,'{}',cb);if(typeof r==='string')done({code:0,out:r})}catch(e){done({code:-1,out:''})}
})}
const ok=r=>r.code===0;
// Fire-and-forget execution: commands never block the WebUI thread.
function bgsh(cmd){
  if(!window.ksu||!ksu.exec)return Promise.resolve({code:0,out:'queued'});
  return new Promise(res=>{
    try{
      const safe=String(cmd).replace(/\n/g,' ');
      const q=`nohup sh -c ${JSON.stringify(safe)} >/dev/null 2>&1 </dev/null &`;
      const r=ksu.exec(q,'{}');
      res({code:0,out:typeof r==='string'?r:'queued'});
    }catch(e){res({code:-1,out:''})}
  });
}
const buzz=()=>navigator.vibrate&&navigator.vibrate(6);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2400)}

const EXTRA_GROUPS=[
['Input and touch',[
['ENABLE_TOUCH_BOOST','Touch boost','Use a writable input boost path when the kernel exposes one'],['ENABLE_INPUT_BOOST','Input boost','Short foreground input burst; skips if the node is unavailable'],['ENABLE_TOUCH_POLL','Touch polling','Detect supported touch polling controls'],['ENABLE_GAME_TOUCH','Game touch path','Use the vendor game touch path when available'],['ENABLE_EDGE_GUARD','Edge touch guard','Apply only a supported edge rejection setting'],['ENABLE_MULTI_FINGER','Multi-finger stability','Preserve native multi-touch behavior'],['ENABLE_HAPTIC_GAME','Game haptics','Preserve the user haptic preference'],['ENABLE_CONTROLLER','Controller priority','Detect connected controllers before launch'],['ENABLE_MIC_STABILITY','Voice chat stability','Preserve microphone routing during play'],['ENABLE_CAPTURE_HEADROOM','Capture headroom','Reserve only supported recording headroom']]],
['Frame and display',[
['ENABLE_FRAME_PACING','Frame pacing','Prefer stable frame delivery over peak bursts'],['ENABLE_RENDER_AHEAD','Render-ahead hint','Use a supported render-ahead setting only'],['ENABLE_REFRESH_DETECT','Refresh detection','Detect supported display refresh modes live'],['ENABLE_REFRESH_HIGH','High refresh request','Request the selected refresh ceiling when supported'],['ENABLE_HDR_PRESERVE','HDR preserve','Never change HDR without a supported setting'],['ENABLE_SCREEN_KEEP','Keep screen awake','Keep display awake while a protected game is foreground'],['ENABLE_ROTATION_LOCK','Rotation lock','Preserve the selected orientation'],['ENABLE_BRIGHTNESS_GAME','Game brightness','Apply only a user-selected brightness value'],['ENABLE_DC_DIMMING','DC dimming preserve','Preserve the current DC dimming preference'],['ENABLE_OVERLAY_STATS','Performance overlay','Show only available device telemetry']]],
['Scheduler and CPU',[
['ENABLE_SCHED_BOOST','Scheduler boost','Use supported foreground scheduler hints'],['ENABLE_THREAD_MIGRATION','Thread migration','Keep game threads on available fast cores'],['ENABLE_BIG_LITTLE_MAP','Cluster map','Detect CPU clusters before any write'],['ENABLE_CPU_IDLE','Idle core policy','Never offline a core unless the path is explicitly supported'],['ENABLE_CPU_BOOST','CPU boost','Use a supported CPU boost node'],['ENABLE_CPU_INPUT','CPU input boost','Use a supported input boost node'],['ENABLE_CPU_FREQ_SYNC','Frequency sync','Apply the selected policy to all exposed clusters'],['ENABLE_CPU_STATS','CPU statistics','Record before and after CPU state'],['ENABLE_CPU_ROLLBACK','CPU rollback','Restore each changed CPU node'],['ENABLE_CPU_CAPABILITY','CPU capability report','Report available governors and limits']]],
['GPU and rendering',[
['ENABLE_GPU_BOOST','GPU boost','Use an exposed GPU boost node only'],['ENABLE_GPU_FREQ_SYNC','GPU frequency sync','Apply selected ceiling to exposed GPU paths'],['ENABLE_GPU_GOVERNOR','GPU governor mode','Use only a governor listed by the GPU driver'],['ENABLE_GPU_DEVFREQ_MAP','GPU devfreq map','Detect GPU devfreq paths live'],['ENABLE_GPU_ROLLBACK','GPU rollback','Restore each changed GPU node'],['ENABLE_GPU_STATS','GPU statistics','Record exposed GPU telemetry'],['ENABLE_GPU_THERMAL','GPU thermal guard','Pause high-power GPU requests when hot'],['ENABLE_RENDERER_HINT','Renderer hint','Use supported Android renderer hints only'],['ENABLE_VULKAN_CHECK','Vulkan capability check','Report Vulkan support without spoofing it'],['ENABLE_SURFACE_PRESERVE','SurfaceFlinger preserve','Never write unsupported SurfaceFlinger hacks']]],
['Memory and process',[
['ENABLE_ZRAM_BALANCE','ZRAM balance','Tune only exposed compressed-memory settings'],['ENABLE_MEMORY_COMPACT','Memory compaction','Compact memory only when the kernel exposes the interface'],['ENABLE_CACHE_TRIM','Safe cache trim','Trim reclaimable cache only, never protected apps'],['ENABLE_OOM_PROTECT','OOM protection','Protect the foreground package from selected cleanup'],['ENABLE_LMKD_REPORT','LMKD report','Report memory pressure without disabling LMKD'],['ENABLE_CACHED_APPS','Cached-app policy','Use explicit package list only'],['ENABLE_GAME_CACHE','Game cache protect','Never clear the protected game cache'],['ENABLE_SWAP_POLICY','Swap policy','Use selected swappiness/page-cluster settings'],['ENABLE_MEMORY_STATS','Memory statistics','Record available memory and pressure'],['ENABLE_PROCESS_AUDIT','Process audit','Log every selected cleanup attempt']]],
['Thermal and battery',[
['ENABLE_TEMP_MONITOR','Temperature monitor','Read available thermal zones'],['ENABLE_SKIN_GUARD','Skin temperature guard','Back off before the selected comfort limit'],['ENABLE_BATTERY_GUARD','Battery guard','Preserve battery protections'],['ENABLE_CHARGING_GUARD','Charging heat guard','Use safer limits while charging'],['ENABLE_VOLTAGE_GUARD','Voltage guard','Never write voltage without an explicit exposed path'],['ENABLE_THERMAL_LOG','Thermal log','Keep a compact temperature history'],['ENABLE_COOLDOWN','Cooldown restore','Restore high-power settings after cooling'],['ENABLE_POWER_STATS','Power statistics','Record battery current and temperature'],['ENABLE_FAN_HINT','Cooling hint','Report cooling suggestions only'],['ENABLE_THERMAL_ROLLBACK','Thermal rollback','Restore controls after a thermal trip']]],
['Network and latency',[
['ENABLE_LATENCY_MONITOR','Latency monitor','Record ping, jitter, and loss to the selected host'],['ENABLE_PACKET_LOSS_GUARD','Packet-loss guard','Report loss; never claim to bypass the game server'],['ENABLE_WIFI_LOCK','Wi-Fi awake','Keep Wi-Fi awake only during the session'],['ENABLE_WIFI_SCAN_REDUCE','Wi-Fi scan reduce','Reduce scan interruptions where supported'],['ENABLE_BT_PRIORITY','Bluetooth priority','Preserve controller and headset routing'],['ENABLE_DNS_RESTORE','DNS restore','Restore the user DNS settings on stop'],['ENABLE_TCP_RESTORE','TCP restore','Restore every changed TCP node'],['ENABLE_BBR_CHECK','BBR capability','Use BBR only if the kernel reports it'],['ENABLE_MTU_CHECK','MTU check','Detect MTU issues without exploiting routes'],['ENABLE_NETWORK_AUDIT','Network audit','Record real diagnostics and skipped operations']]],
['Storage and I/O',[
['ENABLE_IO_PRIORITY','Game I/O priority','Use supported foreground I/O priority'],['ENABLE_READ_AHEAD_DETECT','Read-ahead detection','Detect each writable storage queue'],['ENABLE_STORAGE_TRIM','Storage trim','Run only supported trim operations'],['ENABLE_F2FS_CHECK','F2FS capability','Report filesystem capabilities'],['ENABLE_FS_CACHE','Filesystem cache','Keep selected asset cache warm'],['ENABLE_DOWNLOAD_PAUSE','Download pause','Pause only explicitly selected downloads'],['ENABLE_STORAGE_STATS','Storage statistics','Record I/O counters'],['ENABLE_LOW_SPACE_GUARD','Low-space guard','Warn before storage pressure affects games'],['ENABLE_IO_ROLLBACK','I/O rollback','Restore changed queue settings'],['ENABLE_CACHE_PROTECT','Cache protection','Never clear the protected game cache']]],
['Android system',[
['ENABLE_ANIMATION_SAFE','Animation profile','Use Android animation settings and restore them'],['ENABLE_DOZE_DELAY','Doze delay','Avoid deep idle only while the game is active'],['ENABLE_NOTIFICATION_QUIET','Notification quiet','Use user-controlled notification settings only'],['ENABLE_FOCUS_MODE','Focus mode','Enable a user-selected focus mode'],['ENABLE_APP_OPS_CHECK','App-ops check','Report permission constraints before execution'],['ENABLE_SECURITY_PRESERVE','Security preserve','Never weaken lockscreen or security settings'],['ENABLE_SELINUX_PRESERVE','SELinux preserve','Never claim to change SELinux policy'],['ENABLE_BOOT_DELAY','Boot delay','Wait for Android services before applying'],['ENABLE_SERVICE_WATCH','Service watcher','Restart only the Virgo service when requested'],['ENABLE_SYSTEM_AUDIT','System audit','Record every system operation']]],
['Safety and profiles',[
['ENABLE_DRY_RUN','Dry-run preview','Preview commands without applying them'],['ENABLE_UNSUPPORTED_GUARD','Unsupported guard','Skip any path not exposed by this device'],['ENABLE_PERMISSION_GATE','Permission gate','Stop before denied operations'],['ENABLE_CHECKPOINT','Rollback checkpoint','Save original values before a write'],['ENABLE_SAFE_STOP','Safe stop','Restore state without killing the foreground game'],['ENABLE_PANIC_RESTORE','Panic restore','Restore the last checkpoint'],['ENABLE_CAPABILITY_REPORT','Capability report','Summarize supported and skipped operations'],['ENABLE_PROFILE_EXPORT','Profile export','Export settings for review'],['ENABLE_PROFILE_IMPORT','Profile import','Import a previously saved profile'],['ENABLE_FEATURE_AUDIT','Feature audit','List selected controls and their status']]],
['Diagnostics and compatibility',[
['ENABLE_DEVICE_REPORT','Device report','Summarize model, kernel, and exposed paths'],['ENABLE_KERNEL_MAP','Kernel map','Detect writable kernel interfaces'],['ENABLE_VENDOR_MAP','Vendor map','Detect vendor-specific paths before writes'],['ENABLE_ROOT_CHECK','Root check','Verify the module has root execution'],['ENABLE_WEBUI_AUDIT','WebUI audit','Record UI-to-config writes'],['ENABLE_LOG_ROTATE','Log rotation','Keep service logs bounded'],['ENABLE_BENCHMARK','Quick benchmark','Run a non-destructive capability check'],['ENABLE_FRAME_REPORT','Frame report','Record supported frame pacing data'],['ENABLE_GAME_DETECT','Game detection','Detect configured protected packages'],['ENABLE_VERSION_CHECK','Version report','Show the active module version']]],
['Profiles and automation',[
['ENABLE_AUTO_PROFILE','Automatic profile','Load the selected saved profile on boot'],['ENABLE_GAME_PROFILE','Game profile','Apply settings only to a detected game'],['ENABLE_EXIT_RESTORE','Exit restore','Restore game-scoped settings on exit'],['ENABLE_BOOT_CHECK','Boot check','Wait until Android boot completes'],['ENABLE_LIVE_RELOAD','Live reload','Apply config changes without reinstalling'],['ENABLE_STOP_RESTORE','Stop restore','Restore state from the Tools stop action'],['ENABLE_SCRIPT_ORDER','Script order','Run dependency checks before writes'],['ENABLE_SCRIPT_TIMEOUT','Script timeout','Stop a hung operation safely'],['ENABLE_ACTION_LOG','Action log','Record the Run all selected action'],['ENABLE_CONFIG_BACKUP','Config backup','Keep a copy of the last saved profile']]],
['Game compatibility',[
['ENABLE_BGMI_PROTECT','BGMI protection','Never kill com.pubg.imobile'],['ENABLE_GAME_MODE','Android game mode','Use Android performance mode when supported'],['ENABLE_GAME_AUDIO','Game audio focus','Preserve the user audio focus preference'],['ENABLE_GAME_MIC','Game mic stability','Preserve voice chat routing'],['ENABLE_CONTROLLER_CHECK','Controller check','Detect connected game controllers'],['ENABLE_RECORDING_CHECK','Recording check','Reserve headroom only when capture is supported'],['ENABLE_MULTIPLAYER_SAFE','Multiplayer safe mode','Avoid changes that alter server behavior'],['ENABLE_ANTI_CHEAT_SAFE','Anti-cheat safe mode','Do not inject, hook, or alter game code'],['ENABLE_SERVER_DIAGNOSTICS','Server diagnostics','Measure connection quality without loopholes'],['ENABLE_GAME_ROLLBACK','Game rollback','Restore all game-scoped changes']]],
];
PAGES.adv=['Advanced',EXTRA_GROUPS];

// ── Build PAGES ───────────────────────────────────────────────────────────────
const seg=(k,o)=>o==='@cc'?'<div class="sg" data-dyn="cc"></div>':`<div class="sg">${o.map(([v,l])=>`<button data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
const buildRow=([k,t,s,o,w])=>o==='txt'?`<div class="row"><span class="tt"><b>${t}</b><i>${s}</i></span><input class="tx" data-k="${k}" placeholder="${s}" autocapitalize="none" spellcheck="false"></div>`:`<div class="row${w?' wr':''}"><label class="lb"><span class="tt"><b>${t}</b><i>${s}</i></span><input type="checkbox" class="sw" data-k="${k}"></label>${o?`<div class="sub"><div class="in">${seg(o.k,o.o)}</div></div>`:''}</div>`;
for(const id in PAGES){const[t,gs]=PAGES[id];$('#'+id).innerHTML=`<div class="big">${t}</div>`+gs.map(([h,r])=>`<div class="gh">${h}</div><div class="g">${r.map(buildRow).join('')}</div>`).join('')}
$('#net').insertAdjacentHTML('beforeend',`<div class="gh">Connection test</div><div class="g"><div class="row"><span class="tt"><b>Target host</b><i>Game-region server IP or hostname</i></span><input class="tx" id="host" value="8.8.8.8" autocapitalize="none" spellcheck="false"></div><div class="res"><div><b id="p1">—</b><i>Ping ms</i></div><div><b id="p2">—</b><i>Jitter ms</i></div><div><b id="p3">—</b><i>Loss %</i></div></div><button class="row act" data-a="ping"><span class="tt"><b>Run test</b><i id="pn">8 pings, shows ping/jitter/loss</i></span></button></div>`);
$('#prof').innerHTML=PROF.map(([v,l])=>`<button data-k="PROFILE" data-v="${v}">${l}</button>`).join('');
$('#nav').innerHTML=NAV.map(([id,l,d])=>`<button data-p="${id}"><svg viewBox="0 0 24 24"><path d="${d}"/></svg>${l}</button>`).join('');
const fillCC=()=>$$('[data-dyn=cc]').forEach(e=>{e.innerHTML=CC.map(v=>`<button data-k="TCP_CC" data-v="${v}">${v}</button>`).join('')});
fillCC();

// ── Config ────────────────────────────────────────────────────────────────────
function paint(){
  $$('.sw').forEach(e=>{e.checked=C[e.dataset.k]==='1';e.closest('.row').classList.toggle('on',e.checked)});
  $$('.sg button').forEach(b=>b.classList.toggle('on',C[b.dataset.k]===b.dataset.v));
  $$('.tx[data-k]').forEach(e=>{if(document.activeElement!==e)e.value=C[e.dataset.k]||''});
  $('#pnote').textContent=C.PROFILE==='custom'?'Custom settings':'';
  const sv=parseInt(C.TOUCH_SENSITIVITY||50);$('#sensSlider').value=sv;$('#sensVal').textContent=sv;
  const smv=parseInt(C.SMOOTHNESS_LEVEL||50);$('#smthSlider').value=smv;$('#smthVal').textContent=smv;
  const zrs=String(C.ZR_STRENGTH||'2');$$('#zrSeg button').forEach(x=>x.classList.toggle('on',x.dataset.zr===zrs));
  const aims=String(C.AIM_SENS||'2');$$('#aimSeg button').forEach(x=>x.classList.toggle('on',x.dataset.aim===aims));
}
async function load(){
  const wait=700-(Date.now()-lastFlush);if(wait>0)await new Promise(r=>setTimeout(r,wait));
  const r=await sh(`cat ${M}/virgo.conf 2>/dev/null`),a=await sh('cat /proc/sys/net/ipv4/tcp_available_congestion_control /proc/sys/net/ipv4/tcp_congestion_control 2>/dev/null');
  const w=a.out.trim().split('\n');
  if(w.length>1){CC=w[0].trim().split(/\s+/).filter(x=>/^[a-z0-9_-]+$/.test(x));D.TCP_CC=w[1].trim()}
  C={...D};r.out.split('\n').forEach(l=>{const m=l.match(/^([A-Z0-9_]+)="?([^"]*)"?$/);if(m)C[m[1]]=m[2]});
  const nowT=Date.now();for(const k in recent){if(nowT-recent[k].t<1500)C[k]=recent[k].v;else delete recent[k]}   // just-flushed edits may not be on disk yet
  ops.forEach(o=>{if(o.k!==undefined)C[o.k]=o.v});   // edits still waiting for their flush win over the file
  fillCC();paint()
}
// ── Debounced, ordered config writes ──────────────────────────────────────────
// Every edit goes into ONE queue. A single trailing debounce flushes it as ONE shell
// job that runs the virgoctl calls in the order the user made them.
// Before: each key had its own timer, so two virgoctl.sh writers could hit virgo.conf
// in the same tick (lost update) and a stale timer could fire after a preset and undo it.
const ops=[],premPending=Object.create(null);   // ops: {id,cmd,k,v,msg}; same id = latest wins, order kept
const recent=Object.create(null);                // k -> {v,t}: edits flushed lately, may not be on disk yet
let flushT=null,lastFlush=0,loadT=null,premPollT=null;
function queueOp(o,ms=260){
  const i=ops.findIndex(x=>x.id===o.id);if(i>=0)ops.splice(i,1);
  ops.push(o);clearTimeout(flushT);flushT=setTimeout(flushOps,ms)}
function queueSet(k,v,ms){v=String(v);queueOp({id:'set:'+k,k,v,cmd:`sh ${M}/virgoctl.sh set ${k} "${v}"`},ms)}
function flushOps(){
  clearTimeout(flushT);flushT=null;
  if(!ops.length)return Promise.resolve({code:0,out:'idle'});
  const batch=ops.splice(0),msg=batch.map(o=>o.msg).filter(Boolean).pop();
  lastFlush=Date.now();if(msg)toast(msg);
  batch.forEach(o=>{if(o.k!==undefined)recent[o.k]={v:o.v,t:lastFlush}});
  return bgsh(batch.map(o=>o.cmd).join('; '))}
function loadSoon(ms){clearTimeout(loadT);loadT=setTimeout(load,ms)}
// Trailing debounce must never lose the last edit when the WebUI is closed or backgrounded.
function firePrem(k){clearTimeout(premTimers[k]);const v=premPending[k];delete premPending[k];if(v!==undefined&&C[k]===v)triggerPremAction(k,v)}
function flushAll(){flushOps();Object.keys(premPending).forEach(firePrem)}
async function set(k,v){v=String(v);C[k]=v;buzz();
  queueSet(k,v);
  if(PK.has(k)&&C.PROFILE!=='custom'){C.PROFILE='custom';queueSet('PROFILE','custom')}
  paint();toast('Saved in background')}
async function preset(n){buzz();C.PROFILE=n;paint();toast(n[0].toUpperCase()+n.slice(1)+' queued');
  queueOp({id:'preset',k:'PROFILE',v:n,cmd:`sh ${M}/virgoctl.sh preset ${n}`},200);loadSoon(1100)}

// ── Sliders ───────────────────────────────────────────────────────────────────
// Sliders: state + label update instantly (so paint() can never snap them back); the config
// write and the device apply are one debounced, ordered job: config first, then the apply.
function bindSlider(sel,valSel,key,flag,label){
  $(sel).addEventListener('input',e=>{const v=e.target.value;$(valSel).textContent=v;C[key]=v;
    queueSet(key,v,400);
    queueOp({id:'apply:'+key,cmd:`sh ${M}/premium.sh ${flag} ${v}`,msg:label+': '+v},400)})}
bindSlider('#sensSlider','#sensVal','TOUCH_SENSITIVITY','--apply-sensitivity','Sensitivity');
bindSlider('#smthSlider','#smthVal','SMOOTHNESS_LEVEL','--apply-smoothness','Smoothness');

// ── Premium status badges ─────────────────────────────────────────────────────
function setBadge(dId,bId,active){
  const d=$('#'+dId),b=$('#'+bId);if(!d||!b)return;
  d.classList.toggle('up',active);b.textContent=active?'Active':'Inactive';b.classList.toggle('on',active)}

async function triggerPremAction(k, val) {
  const on = val === "1"; premDesired[k]=on; premRetry[k]=0;
  let flag = "";
  switch(k) {
    case "PREM_HEADSHOT": flag = on ? "--headshot-start" : "--headshot-stop"; break;
    case "PREM_ZERO_RECOIL": flag = on ? ("--zero-recoil-start " + (C.ZR_STRENGTH || zrStrength)) : "--zero-recoil-stop"; break;
    case "PREM_AI_AIM": flag = on ? ("--aim-start " + (C.AIM_SENS || aimSens)) : "--aim-stop"; break;
    case "PREM_GYRO_FIX": flag = on ? "--gyro-fix" : "--gyro-restore"; break;
    case "PREM_DESYNC_FIX": flag = on ? "--fix-desync" : "--restore-desync"; break;
    case "PREM_BULL_REG": flag = on ? "--bullet-reg-fix" : "--bullet-reg-restore"; break;
    case "PREM_BGMI_NET": flag = on ? "--bgmi-net-fix" : "--bgmi-net-restore"; break;
    case "PREM_ULTRA_INSTINCT": flag = on ? "--ultra-instinct" : "--ultra-instinct-restore"; break;
    case "PREM_CONN_PRIORITY": flag = on ? "--conn-priority" : "--conn-priority-restore"; break;
    case "PREM_EXTREME_TOUCH": flag = on ? "--touch-extreme" : "--touch-restore"; break;
    case "PREM_FPS_UNLOCK": flag = on ? "--fps-unlock" : "--fps-restore"; break;
    case "PREM_THERMAL_DISABLE": flag = on ? "--thermal-disable" : "--thermal-restore"; break;
    case "PREM_SCREEN_SMOOTH": flag = on ? "--screen-smooth" : "--screen-smooth-restore"; break;
    case "PREM_IOS_STABILITY": flag = on ? "--ios-stability" : "--ios-restore"; break;
    case "PREM_VIDEO_SMOOTH": flag = on ? "--video-smooth" : "--video-smooth-restore"; break;
    case "PREM_SNAP_RESP": flag = on ? "--snap-response" : "--snap-restore"; break;
    case "PREM_FRAME_PHASE": flag = on ? "--frame-phase-lock" : "--frame-phase-restore"; break;
    case "PREM_RAM_GUARD": flag = on ? "--ram-guard-start" : "--ram-guard-stop"; break;
    case "PREM_AUDIO_LAT": flag = on ? "--audio-latency" : "--audio-latency-restore"; break;
    case "PREM_THREAD_PIN": flag = on ? "--thread-pin-start" : "--thread-pin-stop"; break;
    case "PREM_JITTER_ABS": flag = on ? "--jitter-absorb" : "--jitter-restore"; break;
    case "PREM_STORAGE_BURST": flag = on ? "--storage-burst" : "--storage-burst-restore"; break;
    case "PREM_ENTROPY_BOOST": flag = on ? "--entropy-start" : "--entropy-stop"; break;
    case "PREM_MEMORY_ULTRA": flag = on ? "--memory-ultra" : "--memory-ultra-restore"; break;
  }
  if (flag) {
    const input=document.querySelector(`[data-k="${k}"]`);
    if(input){input.closest('.row')?.classList.add('pending');}
    bgsh(`sh ${M}/premium.sh ${flag}`);
    toast(on ? (k.replace("PREM_", "").replace(/_/g, " ") + " queued") : "Restore queued");
    schedulePollPrem(1100);
    return {code:0,out:'queued'};
  }
}

const psh=(f,ms=20000)=>{const r=bgsh(`sh ${M}/premium.sh ${f}`);schedulePollPrem(1100);return r};
// One shared timer: any burst of "poll soon" requests collapses into a single premium.sh --status-all.
function schedulePollPrem(ms){clearTimeout(premPollT);premPollT=setTimeout(()=>{premPollT=null;pollPrem()},ms)}
async function pollPrem(){
  if(premPollBusy){premPollQueued=true;return;}
  premPollBusy=true;
  try {
  const r=await sh(`sh ${M}/premium.sh --status-all`,7000);
  if(!r.out)return;
  const map={};
  r.out.trim().split(/\n+/).forEach(line=>{const i=line.indexOf('=');if(i>0)map[line.slice(0,i)]=line.slice(i+1)});
  const rows=[
    ['HEADSHOT','hsDot','hsBadge'],['ULTRA_INSTINCT','uinDot','uinBadge'],['CONN_PRIORITY','cpDot','cpBadge'],
    ['MEMORY_ULTRA','memDot','memBadge'],['BGMI_NET','bgmiDot','bgmiBadge'],['DESYNC','dsyncDot','dsyncBadge'],
    ['BULLET_REG','bullDot','bullBadge'],['GYRO','gyroDot','gyroBadge'],['ZERO_RECOIL','zrDot','zrBadge'],
    ['AIM','aimDot','aimBadge'],['TOUCH','touchDot','touchBadge'],['FPS','fpsDot','fpsBadge'],['THERMAL','thermDot','thermBadge'],
    ['SCREEN_SMOOTH','scrDot','scrBadge'],['IOS','iosDot','iosBadge'],['DISPLAY_OVERDRIVE','dodDot','dodBadge'],
    ['SNAP','snapDot','snapBadge'],['FRAME_PHASE','fplDot','fplBadge'],['RAM_GUARD','rgDot','rgBadge'],['AUDIO_LATENCY','audDot','audBadge'],
    ['THREAD_PIN','tpDot','tpBadge'],['JITTER','jitDot','jitBadge'],['STORAGE_BURST','sbmDot','sbmBadge'],
    ['ENTROPY','entDot','entBadge'],['VIDEO_SMOOTH','vidDot','vidBadge']
  ];
  rows.forEach(([k,d,b])=>{
    const active=/^active(?:$|:)/i.test(map[k]||'');setBadge(d,b,active);
    const key='PREM_'+k,desired=premDesired[key],row=document.querySelector(`[data-k="${key}"]`)?.closest('.row');
    if(desired===undefined || active===desired){row?.classList.remove('pending');if(desired!==undefined){delete premDesired[key];delete premRetry[key];}}
    else if((premRetry[key]||0)<8){premRetry[key]=(premRetry[key]||0)+1;schedulePollPrem(700);}
  });
  } finally {
    premPollBusy=false;
    if(premPollQueued){premPollQueued=false;schedulePollPrem(180);}
  }
}

// ── Device auto-detect ────────────────────────────────────────────────────────
async function detectDevice(){
  if(deviceBusy)return; deviceBusy=true;
  const r=await sh(`sh ${M}/premium.sh --device-report`,20000);if(!r.out)return;
  const lines=r.out.trim().split('\n'),info={},cpus=[];let gpu=null;
  for(const l of lines){
    const[k,...vs]=l.split('=');const v=vs.join('=');
    if(l.startsWith('cpu:')){const p=l.split(':'),id=p[1],kv={};p.slice(2).forEach(s=>{const[pk,...pv]=s.split('=');kv[pk]=pv.join('=')});cpus.push({id,...kv})}
    else if(l.startsWith('gpu:')){const p=l.split(':'),id=p[1],kv={};p.slice(2).forEach(s=>{const[pk,...pv]=s.split('=');kv[pk]=pv.join('=')});gpu={id,...kv}}
    else info[k]=v}
  if(info.model){$('#di_model').textContent=info.model;$('#di_soc').textContent=info.soc||'—';$('#di_kernel').textContent=(info.kernel||'—').replace(/-.*/,'');$('#di_android').textContent='Android '+(info.android||'—');$('#di_arch').textContent=info.arch||'—';$('#di_display').textContent=(info.display_size||'—')+' '+(info.display_hz||'?')+'Hz'}
  buildCpuClusters(cpus);if(gpu)buildGpuCluster(gpu);
  const detectedMax=cpus.map(x=>+x.cpumax||+x.max||0).filter(Boolean).sort((a,b)=>b-a)[0]||0;
  const detectedCur=cpus.map(x=>+x.cur||0).filter(Boolean).sort((a,b)=>b-a)[0]||0;
  const cpuMin=$('[data-k=CPU_MIN_FREQ]'),cpuMax=$('[data-k=CPU_MAX_FREQ]'),gpuMax=$('[data-k=GPU_MAX_FREQ]');
  if(cpuMin&&(!C.CPU_MIN_FREQ||C.CPU_MIN_FREQ==='0')){cpuMin.placeholder='Auto detected: '+(detectedCur||0)+' kHz';cpuMin.dataset.detected=detectedCur||''}
  if(cpuMax&&(!C.CPU_MAX_FREQ||C.CPU_MAX_FREQ==='0')){cpuMax.placeholder='Auto detected: '+(detectedMax||0)+' kHz';cpuMax.dataset.detected=detectedMax||''}
  if(gpu&&gpuMax&&(!C.GPU_MAX_FREQ||C.GPU_MAX_FREQ==='0')){gpuMax.placeholder='Auto detected: '+(+gpu.max||0)+' kHz';gpuMax.dataset.detected=+gpu.max||''}
  if(info.display_modes)buildHzChips(info.display_modes,info.display_hz);
  $('#freqScanBadge').textContent='Done';$('#freqScanBadge').style.cssText='background:var(--gr);color:#fff';
  devDetected=true;deviceBusy=false}

const mhz=k=>(!k||k=='0')?'—':(+k>=1e9?(+k/1e9).toFixed(2)+'GHz':(+k>=1e6?(+k/1e6).toFixed(0)+'MHz':(+k>=1e3?Math.round(+k/1e3)+'MHz':k)));

function buildCpuClusters(cpus){
  const w=$('#cpuClusters');w.innerHTML='';
  cpus.forEach(cl=>{
    const freqs=(cl.freqs||'').split(',').filter(f=>f&&f!=='0').sort((a,b)=>+a-+b);
    const govs=(cl.govs||'').split(',').filter(Boolean);
    const d=document.createElement('div');d.className='cluster';
    d.innerHTML=`<div class="cluster-head"><span class="cl-id">${cl.id} · CPUs ${(cl.cpus||'').replace(/,/g,', ')}</span><span class="cl-cur">${mhz(cl.cur)}</span></div>
      <div class="cluster-sub">Gov: <b id="gov_${cl.id}">${cl.gov||'—'}</b> · Min: ${mhz(cl.min)} · Max: ${mhz(cl.max)} · Peak: ${mhz(cl.cpumax)}</div>
      <div style="font-size:12px;color:var(--sb);margin-bottom:6px">Tap to set max frequency</div>
      <div class="freq-scroll">${freqs.map(f=>`<button class="fchip${cl.max===f?' cur':''}" data-policy="${cl.id}" data-maxfreq="${f}">${mhz(f)}</button>`).join('')}</div>
      <div style="font-size:12px;color:var(--sb);margin:8px 0 6px">Governor</div>
      <div class="freq-scroll">${govs.map(g=>`<button class="gchip${cl.gov===g?' on':''}" data-policy="${cl.id}" data-gov="${g}">${g}</button>`).join('')}</div>`;
    w.appendChild(d)})}

function buildGpuCluster(gpu){
  const w=$('#gpuCluster');w.innerHTML='';
  const freqs=(gpu.freqs||'').split(',').filter(f=>f&&f!=='0');
  const govs=(gpu.govs||'').split(',').filter(Boolean);
  const d=document.createElement('div');d.className='cluster';
  d.innerHTML=`<div class="cluster-head"><span class="cl-id">GPU · ${gpu.id}</span><span class="cl-cur">${mhz(gpu.cur)}</span></div>
    <div class="cluster-sub">Gov: <b>${gpu.gov||'—'}</b> · Max: ${mhz(gpu.max)}</div>
    <div style="font-size:12px;color:var(--sb);margin-bottom:6px">Tap to set max frequency</div>
    <div class="freq-scroll">${freqs.map(f=>`<button class="fchip${gpu.max===f?' cur':''}" data-gpufreq="${f}">${mhz(f)}</button>`).join('')}</div>
    <div style="font-size:12px;color:var(--sb);margin:8px 0 6px">Governor</div>
    <div class="freq-scroll">${govs.map(g=>`<button class="gchip${gpu.gov===g?' on':''}" data-gpugov="${g}">${g}</button>`).join('')}</div>`;
  w.appendChild(d)}

function buildHzChips(modes,curHz){
  const hzs=[...new Set(modes.split(',').filter(Boolean))].map(Number).sort((a,b)=>a-b);
  $('#hzChips').innerHTML=hzs.map(h=>`<button class="fchip${h==curHz?' cur':''}" data-hz="${h}">${h} Hz</button>`).join('');
  if(hzs.length)$('#fpsCapLabel').textContent=`Detected: up to ${hzs[hzs.length-1]} Hz`}

// ── Auto game detection ───────────────────────────────────────────────────────
const GAME_ICONS={bgmi:'B',pubg:'P',freefire:'F',freefiremax:'F+',callofduty:'COD',warzone:'WZ',fortnite:'FN',mobilelegends:'ML',legends:'L',genshin:'G',honkai:'H',supercell:'S',clash:'C',asphalt:'A',nfs:'N',default:'G'};
function gameIcon(pkg){for(const[k,v]of Object.entries(GAME_ICONS)){if(pkg.includes(k))return v}return GAME_ICONS.default}

let allPkgs=[],selectedProtect=new Set();
async function scanGames(showAll=false){
  const badge=$('#gameScanBadge');badge.textContent='Scanning…';badge.style.cssText='background:var(--ac);color:#fff';
  const r=await sh('sh '+M+'/premium.sh --detect-games',15000);
  const list=$('#gamesList');list.innerHTML='';
  let lines=(r.out||"").trim().split("\n").map(l=>l.trim()).filter(Boolean);
  if(!lines.some(l=>l.startsWith("KNOWN:")||l.startsWith("GAME:"))){
    lines=[
      "KNOWN:BGMI:com.pubg.imobile",
      "KNOWN:PUBG Mobile:com.tencent.ig",
      "KNOWN:Free Fire:com.dts.freefireth",
      "KNOWN:COD Mobile:com.activision.callofduty.shooter",
      "KNOWN:Free Fire MAX:com.dts.freefiremax",
      "KNOWN:Genshin Impact:com.miHoYo.GenshinImpact"
    ];
  }
  const known=[],games=[],apps=[];
  for(const l of lines){
    if(l.startsWith('KNOWN:'))known.push(l.slice(6));
    else if(l.startsWith('GAME:'))games.push(l.slice(5));
    else if(showAll&&l.startsWith('APP:'))apps.push(l.slice(4))}
  const buildSection=(title,items,cat)=>{
    if(!items.length)return;
    list.insertAdjacentHTML('beforeend',`<div class="gh">${title}</div><div class="g" id="sec_${cat}"></div>`);
    const sec=$(`#sec_${cat}`);
    items.forEach(entry=>{
      const parts=entry.split(':');
      const label=parts.length>1?parts[0]:'Game';
      const pkg=parts[parts.length-1];
      const icon=gameIcon(pkg.toLowerCase());
      const div=document.createElement('div');div.className='game-item';
      div.innerHTML=`<div class="game-icon">${icon}</div>
        <div class="game-info"><b>${pkg.split('.').slice(-2).join('.')}</b><i>${pkg}</i></div>
        <div class="sg" style="flex-direction:column;background:none;gap:4px">
          <button style="font-size:11px;padding:5px 10px;border-radius:10px;border:0;background:var(--ac);color:#fff;cursor:pointer;font-weight:600" data-addgame="${pkg}">+ Add</button>
          <button style="font-size:11px;padding:5px 10px;border-radius:10px;border:0;background:var(--bg);color:var(--sb);cursor:pointer;font-weight:600" data-protect="${pkg}">Protect</button>
        </div>`;
      sec.appendChild(div)})};
  buildSection('Known games',known,'known');
  buildSection('Detected games',games,'games');
  if(showAll)buildSection('All 3rd party apps',apps,'apps');
  const total=known.length+games.length+(showAll?apps.length:0);
  badge.textContent=total+' found';badge.style.cssText='background:var(--gr);color:#fff'}

$('#scanGamesBtn').addEventListener('click',()=>scanGames(false));
$('#scanAllBtn').addEventListener('click',()=>scanGames(true));

const manBtn=$("#manualAddGameBtn");
if(manBtn){
  manBtn.addEventListener("click",async()=>{
    const inp=$("#manualPkgInput");
    const pkg=(inp.value||"").trim();
    if(!pkg)return toast("Please enter a package name");
    const pkgs=(C.EXTRA_GAME_PKGS||"").split(" ").filter(Boolean);
    if(!pkgs.includes(pkg))pkgs.push(pkg);
    queueSet('EXTRA_GAME_PKGS',pkgs.join(" "));
    C.EXTRA_GAME_PKGS=pkgs.join(" ");
    inp.value="";
    toast(pkg+" added to game list!");
    scanGames(false);
  });
}


// ── Terminal ──────────────────────────────────────────────────────────────────
async function runScript(cmd){
  if(!cmd.trim())return;
  const out=$('#scriptOut');out.textContent='Running…';
  const r=await sh(cmd,30000);
  out.textContent=r.out||'(no output)';
  // History
  termHistory.unshift({cmd:cmd.trim().slice(0,60),ts:new Date().toLocaleTimeString()});
  termHistory=termHistory.slice(0,10);
  const h=$('#termHistory');
  h.innerHTML=termHistory.map((e,i)=>`<div style="padding:4px 0;border-bottom:1px solid var(--ln);cursor:pointer" data-hi="${i}"><span style="font-family:monospace;font-size:12px">${e.cmd}…</span> <span style="color:var(--sb);font-size:11px">${e.ts}</span></div>`).join('')}

$('#runScriptBtn').addEventListener('click',()=>runScript($('#cmdInput').value));
$('#clearScriptBtn').addEventListener('click',()=>{$('#cmdInput').value='';$('#scriptOut').textContent='Output appears here…'});
$('#copyOutBtn').addEventListener('click',()=>{const t=$('#scriptOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>toast('Copied')).catch(()=>toast('Copy failed'))});
$('#termHistory').addEventListener('click',e=>{const i=e.target.closest('[data-hi]');if(i&&termHistory[+i.dataset.hi]){$('#cmdInput').value=termHistory[+i.dataset.hi].cmd;runScript(termHistory[+i.dataset.hi].cmd)}});

// ── Actions ───────────────────────────────────────────────────────────────────
const smartOptimize=async()=>{buzz();const b=$('#smartOptimizeBtn');if(b){b.disabled=true;b.textContent='TUNING…'}toast('Analyzing device + applying safe optimizations…');queueOp({id:'smart',cmd:`sh ${M}/virgoctl.sh smart-optimize && sh ${M}/action.sh`});const r=await flushOps();if(b){b.disabled=false;b.textContent='OPTIMIZE'}toast(r.code?'Optimization failed':'Smart optimization queued');loadSoon(1200)};
const ACT={
  launch_bgmi:()=>sh("monkey -p com.pubg.imobile 1 2>/dev/null || am start -n com.pubg.imobile/com.epicgames.ue4.SplashActivity 2>/dev/null &",1000).then(()=>toast("Launching BGMI…")),
  launch_pubg:()=>sh("monkey -p com.tencent.ig 1 2>/dev/null || monkey -p com.pubg.krmobile 1 2>/dev/null &",1000).then(()=>toast("Launching PUBG Mobile…")),
  launch_freefire:()=>sh("monkey -p com.dts.freefireth 1 2>/dev/null || monkey -p com.dts.freefiremax 1 2>/dev/null &",1000).then(()=>toast("Launching Free Fire…")),
  launch_codm:()=>sh("monkey -p com.activision.callofduty.shooter 1 2>/dev/null || monkey -p com.activision.warzone 1 2>/dev/null &",1000).then(()=>toast("Launching COD Mobile…")),
  launch_any:async()=>{
    const pkgs=((C.EXTRA_GAME_PKGS||"")+" "+(C.PROTECT_PACKAGES||"")).trim().split(/\s+/).filter(p=>p&&!p.includes("android")&&!p.includes("systemui"));
    const target=pkgs[0]||"com.pubg.imobile";
    toast("Launching "+target+"…");
    await sh("monkey -p "+target+" 1 2>/dev/null &",1000);
  },

  reload:()=>sh(`sh ${M}/action.sh`).then(r=>toast(r.code?'Failed':'Service restarted')),
  report:async()=>{const r=await sh(`sh ${M}/service.sh --report`,15000);$('#report').textContent=r.out||'No report';toast('Done')},
  desyncDiag:async()=>{const h=($('#diagHost').value||'1.1.1.1').replace(/[^A-Za-z0-9.:-]/g,'').slice(0,64)||'1.1.1.1';const r=await sh(`ping -c 8 -i 0.3 -W 2 ${h} 2>&1|tail -4`,14000);$('#diagOut').textContent=r.out||'No result';toast('Done')},
  runall:()=>sh(`sh ${M}/action.sh run-all`,30000).then(r=>toast(r.code?'Failed':'Done')),
  stop:()=>sh(`sh ${M}/action.sh stop`).then(r=>toast(r.code?'Failed':'Stopped')),
  export:()=>sh(`{cat ${M}/virgo.conf;echo;cat /data/local/tmp/virgocore.log;}>/sdcard/Download/virgocore-debug.txt`).then(r=>toast(r.code?'Failed':'Saved to Download')),
  stock:()=>{ops.length=0;clearTimeout(flushT);return sh(`sh ${M}/virgoctl.sh stock`).then(async r=>{await load();toast(ok(r)?'All tweaks off':'Failed')})},
  reboot:()=>sh('reboot'),
  ping:async()=>{const h=$('#host').value.replace(/[^A-Za-z0-9.-]/g,'').replace(/^-+/,'')||'8.8.8.8',n=$('#pn');n.textContent='Testing '+h+'…';
    const r=await sh(`timeout 10 ping -c 8 -i 0.3 -W 2 ${h} 2>&1|tail -3`,13000),l=r.out.match(/([\d.]+)% packet loss/),t=r.out.match(/= ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)/);
    $('#p3').textContent=l?l[1]:'—';$('#p1').textContent=t?Math.round(+t[2]):'—';$('#p2').textContent=t?(+t[4]).toFixed(1):'—';
    n.textContent=!l?'No reply':+l[1]>0?'Packet loss!':t&&+t[4]<5?'Stable':'Some jitter'},
  saveProtect:async()=>{const pkgs=[...selectedProtect].join(' ');queueSet('PROTECT_PACKAGES',pkgs);C.PROTECT_PACKAGES=pkgs;paint();toast('Protected apps saved')},
  // Premium
  headshotStart:async()=>{toast('Starting headshot precision…');await psh('--headshot-start',20000);await pollPrem();toast('🎯 Headshot mode active')},
  headshotStop:async()=>{await psh('--headshot-stop',10000);await pollPrem();toast('Headshot mode stopped')},
  ultraInstinct:async()=>{toast('Applying ultra instinct…');await psh('--ultra-instinct',25000);await pollPrem();toast('⚡ Ultra instinct active')},
  ultraInstinctRestore:async()=>{await psh('--ultra-instinct-restore',12000);await pollPrem();toast('Ultra instinct restored')},
  connPriority:async()=>{toast('Applying connection priority…');const r=await psh('--conn-priority',12000);await pollPrem();toast(/cp_ok/.test(r.out)?'Priority shaper active':'Priority applied (tc may not be available)')},
  connPriorityRestore:async()=>{await psh('--conn-priority-restore',8000);await pollPrem();toast('Connection priority restored')},
  memoryUltra:async()=>{toast('Applying memory ultra…');await psh('--memory-ultra',12000);await pollPrem();toast('Memory ultra active')},
  memoryUltraRestore:async()=>{await psh('--memory-ultra-restore',8000);await pollPrem();toast('Memory ultra restored')},
  antiBanReport:async()=>{toast('Generating report…');const r=await psh('--antiban-report',10000);const o=$('#antiBanOut');o.textContent=r.out;o.style.display='block';toast('Report ready')},
  fpsUnlock:async()=>{toast('Unlocking FPS…');const r=await psh('--fps-unlock',10000);await pollPrem();const m=r.out.match(/fps_ok:(\d+)/);toast(m?'FPS unlocked to '+m[1]+' Hz':'FPS unlock applied')},
  fpsRestore:async()=>{await psh('--fps-restore',8000);await pollPrem();toast('FPS cap restored')},
  thermalDisable:async()=>{toast('Disabling thermal throttle…');const r=await psh('--thermal-disable',12000);await pollPrem();const m=r.out.match(/thermal_ok:(\d+)/);toast(m?'Thermal disabled ('+m[1]+' zones)':'Applied')},
  thermalRestore:async()=>{await psh('--thermal-restore',10000);await pollPrem();toast('Thermal restored')},
  touchExtreme:async()=>{toast('Applying extreme touch…');await psh('--touch-extreme',15000);await pollPrem();toast('Extreme touch active')},
  touchRestore:async()=>{await psh('--touch-restore',8000);await pollPrem();toast('Touch restored')},
  screenSmooth:async()=>{await psh('--screen-smooth',10000);await pollPrem();toast('Screen smoothness applied')},
  screenSmoothRestore:async()=>{await psh('--screen-smooth-restore',8000);await pollPrem();toast('Screen smooth restored')},
  iosStability:async()=>{await psh('--ios-stability',10000);await pollPrem();toast('iOS stability applied')},
  iosRestore:async()=>{await psh('--ios-restore',8000);await pollPrem();toast('iOS stability restored')},
  displayOverdrive:async()=>{await psh('--display-overdrive',8000);await pollPrem();toast('Display overdrive active')},
  displayOverdriveRestore:async()=>{await psh('--display-overdrive-restore',8000);await pollPrem();toast('Display overdrive restored')},
  bgmiNetFix:async()=>{toast('Applying BGMI fix…');await psh('--bgmi-net-fix',25000);await pollPrem();toast('BGMI server fix active')},
  bgmiNetRestore:async()=>{await psh('--bgmi-net-restore',12000);await pollPrem();toast('BGMI net restored')},
  fixdesync:async()=>{toast('Applying desync fix…');await psh('--fix-desync',20000);await pollPrem();toast('Desync fix active')},
  restoredesync:async()=>{await psh('--restore-desync',12000);await pollPrem();toast('Desync restored')},
  bullRegFix:async()=>{await psh('--bullet-reg-fix',15000);await pollPrem();toast('Bullet reg fix active')},
  bullRegRestore:async()=>{await psh('--bullet-reg-restore',10000);await pollPrem();toast('Bullet reg restored')},
  gyroFix:async()=>{toast('Applying gyro fix…');const r=await psh('--gyro-fix',15000);await pollPrem();toast(/no_device/.test(r.out)?'No IIO gyro on this device':'Gyro fix applied')},
  gyroRestore:async()=>{await psh('--gyro-restore',10000);await pollPrem();toast('Gyro restored')},
  zrStart:async()=>{toast('Starting zero recoil…');const r=await psh(`--zero-recoil-start ${zrStrength}`,15000);await pollPrem();toast(/no_touch_dev/.test(r.out)?'No MT touch device':'Zero recoil active')},
  zrStop:async()=>{await psh('--zero-recoil-stop',8000);await pollPrem();toast('Zero recoil stopped')},
  aimStart:async()=>{toast('Starting AI aim…');await psh(`--aim-start ${aimSens}`,15000);await pollPrem();toast('AI aim active')},
  aimStop:async()=>{await psh('--aim-stop',8000);await pollPrem();toast('AI aim stopped')},
  snapResponse:async()=>{await psh('--snap-response',10000);await pollPrem();toast('Snap response active')},
  snapRestore:async()=>{await psh('--snap-restore',8000);await pollPrem();toast('Snap response restored')},
  framePhaseLock:async()=>{await psh('--frame-phase-lock',8000);await pollPrem();toast('Frame phase locked')},
  framePhaseRestore:async()=>{await psh('--frame-phase-restore',8000);await pollPrem();toast('Frame phase restored')},
  ramGuardStart:async()=>{await psh('--ram-guard-start',8000);await pollPrem();toast('RAM guard active')},
  ramGuardStop:async()=>{await psh('--ram-guard-stop',8000);await pollPrem();toast('RAM guard stopped')},
  audioLatency:async()=>{await psh('--audio-latency',8000);await pollPrem();toast('Audio zero latency applied')},
  audioRestore:async()=>{await psh('--audio-latency-restore',8000);await pollPrem();toast('Audio restored')},
  threadPinStart:async()=>{await psh('--thread-pin-start',10000);await pollPrem();toast('Thread pinning active')},
  threadPinStop:async()=>{await psh('--thread-pin-stop',8000);await pollPrem();toast('Thread pinning stopped')},
  jitterAbsorb:async()=>{await psh('--jitter-absorb',10000);await pollPrem();toast('Jitter absorber active')},
  jitterRestore:async()=>{await psh('--jitter-restore',8000);await pollPrem();toast('Jitter absorber restored')},
  storageBurst:async()=>{await psh('--storage-burst',10000);await pollPrem();toast('Storage burst active')},
  storageBurstRestore:async()=>{await psh('--storage-burst-restore',8000);await pollPrem();toast('Storage burst restored')},
  entropyStart:async()=>{await psh('--entropy-start',8000);await pollPrem();toast('Entropy boost active')},
  entropyStop:async()=>{await psh('--entropy-stop',8000);await pollPrem();toast('Entropy boost stopped')},
  videoSmooth:async()=>{await psh('--video-smooth',10000);await pollPrem();toast('Video smoothness applied')},
  videoSmoothRestore:async()=>{await psh('--video-smooth-restore',8000);await pollPrem();toast('Video smooth restored')},
  smartKill:async()=>{toast('Running smart kill…');const r=await psh('--smart-kill',15000);const m=r.out.match(/smart_killed:(\d+)/);const n=m?m[1]:'?';$('#skBadge').textContent=n+' freed';toast('Smart kill: '+n+' processes freed')}};

function act(b){const a=b.dataset.a,i=b.querySelector('i');
  if((a==='stock'||a==='reboot'||a==='thermalDisable')&&!b.dataset.c){b.dataset.c=1;const o=b.textContent;b.style.background='var(--wr)';setTimeout(()=>{delete b.dataset.c;b.style.background=''},3000);return toast('Tap again to confirm')}
  delete b.dataset.c;ACT[a]&&ACT[a]();buzz()}

// ── Home poll ─────────────────────────────────────────────────────────────────
async function poll(){if(pollBusy||document.hidden||cur!=='home')return;pollBusy=true;
  try{const r=await sh(STAT,4500),m={};r.out.split('\n').forEach(l=>{const[a,...v]=l.split('=');if(a)m[a]=v.join('=')});
  const n=(v,d)=>+v>0?Math.round(+v/d):'—';
  $('#cpu').textContent=n(m.cpu,1e3);$('#gpu').textContent=n(m.gpu,1e6);$('#ram').textContent=n(m.ram,1);
  $('#tmp').textContent=+m.tmp>0?(+m.tmp/10).toFixed(1):'—';
  const w=+m.bv>0&&m.bi?Math.abs(+m.bv*+m.bi/1e12):0;$('#watt').textContent=w>0.1?w.toFixed(1):'—';
  $('#hz').textContent=m.hz||'—';$('#dot').classList.toggle('up',m.up==='1');$('#svc').textContent=m.up==='1'?'Service running':'Service stopped';
  }finally{pollBusy=false}}
async function logPoll(){const r=await sh('tail -n 14 /data/local/tmp/virgocore.log 2>/dev/null');$('#lg').textContent=r.out.trim()||'No activity yet'}

// ── Navigation ────────────────────────────────────────────────────────────────
function go(id){cur=id;$$('.pg').forEach(p=>p.classList.toggle('on',p.id===id));$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===id));scrollTo(0,0);
  io&&io.disconnect();const b=$('#'+id+' .big');if(b){$('#bar').textContent=b.childNodes[0]&&b.childNodes[0].nodeType===3?b.childNodes[0].textContent.trim():b.textContent.trim().split('\n')[0].trim();$('#bar').classList.remove('on');io=new IntersectionObserver(([e])=>$('#bar').classList.toggle('on',!e.isIntersecting),{rootMargin:'-70px 0px 0px 0px'});io.observe(b)}
  clearInterval(premTimer);clearInterval(freqTimer);
  if(id==='home')poll();
  if(id==='tools')logPoll();
  if(id==='prem'){pollPrem();premTimer=setInterval(pollPrem,5000)}
  if(id==='freq'&&!devDetected)detectDevice()}

// ── Global click handler ──────────────────────────────────────────────────────
document.addEventListener('click',async e=>{
  const b=e.target.closest('button,label');if(!b)return;
  // CPU freq chip
  if(b.dataset.policy&&b.dataset.maxfreq){buzz();const p=b.dataset.policy,f=b.dataset.maxfreq;toast('Setting '+p+' → '+mhz(f)+'…');const r=await bgsh(`echo ${f} > /sys/devices/system/cpu/cpufreq/${p}/scaling_max_freq 2>/dev/null && echo ok`);if(!r.code){$$(`[data-policy="${p}"].fchip`).forEach(x=>x.classList.toggle('cur',x===b));queueSet('CPU_MAX_FREQ',f);C.CPU_MAX_FREQ=f;toast(p+' locked to '+mhz(f))}else toast('Write failed — governor may be read-only');return}
  // CPU governor chip
  if(b.dataset.policy&&b.dataset.gov){buzz();const p=b.dataset.policy,g=b.dataset.gov;const r=await bgsh(`echo ${g} > /sys/devices/system/cpu/cpufreq/${p}/scaling_governor 2>/dev/null && echo ok`);if(!r.code){$$(`[data-policy="${p}"].gchip`).forEach(x=>x.classList.toggle('on',x===b));$('#gov_'+p).textContent=g;queueSet('CPU_GOVERNOR',g);C.CPU_GOVERNOR=g;toast(p+' governor → '+g)}else toast('Write failed');return}
  // GPU freq chip
  if(b.dataset.gpufreq){buzz();const f=b.dataset.gpufreq;toast('GPU → '+mhz(f)+'…');const r=await bgsh(`ok=0; for path in /sys/class/kgsl/kgsl-3d0/max_freq /sys/class/devfreq/*gpu*/max_freq /sys/class/devfreq/*mali*/max_freq; do [ -e "$path" ] && printf '%s\n' ${f} > "$path" 2>/dev/null && ok=1; done; [ $ok -eq 1 ] && echo ok`);if(!r.code){$$('[data-gpufreq].fchip').forEach(x=>x.classList.toggle('cur',x===b));queueSet('GPU_MAX_FREQ',f);C.GPU_MAX_FREQ=f;toast('GPU locked to '+mhz(f))}else toast('GPU write failed');return}
  // GPU governor chip
  if(b.dataset.gpugov){buzz();const gov=b.dataset.gpugov;const r=await sh(`ok=0; for path in /sys/class/kgsl/kgsl-3d0/governor /sys/class/devfreq/*gpu*/governor /sys/class/devfreq/*mali*/governor; do [ -e "$path" ] && printf '%s\n' ${gov} > "$path" 2>/dev/null && ok=1; done; [ $ok -eq 1 ] && echo ok`,5000);if(/ok/.test(r.out)){$$('[data-gpugov].gchip').forEach(x=>x.classList.toggle('on',x===b));queueSet('GPU_GOVERNOR',gov);C.GPU_GOVERNOR=gov;toast('GPU governor → '+gov)}else toast('GPU governor write failed');return}
  // Hz chip
  if(b.dataset.hz){buzz();const h=b.dataset.hz;bgsh(`settings put system peak_refresh_rate ${h}.0 2>/dev/null; settings put system min_refresh_rate ${h}.0 2>/dev/null`);$$('[data-hz].fchip').forEach(x=>x.classList.toggle('cur',x===b));toast('Display → '+h+' Hz');return}
  // Zero recoil seg
  if(b.dataset.zr){zrStrength=+b.dataset.zr;$$('#zrSeg button').forEach(x=>x.classList.toggle('on',x===b));set('ZR_STRENGTH',zrStrength);if(C.PREM_ZERO_RECOIL==='1')triggerPremAction('PREM_ZERO_RECOIL','1');toast('Zero recoil strength: '+zrStrength);return}
  // Aim seg
  if(b.dataset.aim){aimSens=+b.dataset.aim;$$('#aimSeg button').forEach(x=>x.classList.toggle('on',x===b));set('AIM_SENS',aimSens);if(C.PREM_AI_AIM==='1')triggerPremAction('PREM_AI_AIM','1');toast('AI aim sens: '+aimSens);return}
  // Quick cmd terminal
  if(b.dataset.cmd){$('#cmdInput').value=b.dataset.cmd;runScript(b.dataset.cmd);if(cur!=='term')go('term');return}
  // Add game to game list
  if(b.dataset.addgame){buzz();const pkg=b.dataset.addgame;const pkgs=(C.EXTRA_GAME_PKGS||'').split(' ').filter(Boolean);if(!pkgs.includes(pkg))pkgs.push(pkg);queueSet('EXTRA_GAME_PKGS',pkgs.join(' '));C.EXTRA_GAME_PKGS=pkgs.join(' ');toast(pkg.split('.').pop()+' added to game list');return}
  // Protect game
  if(b.dataset.protect){buzz();const pkg=b.dataset.protect;selectedProtect.has(pkg)?selectedProtect.delete(pkg):selectedProtect.add(pkg);b.textContent=selectedProtect.has(pkg)?'✓ Protected':'Protect';b.style.background=selectedProtect.has(pkg)?'var(--gr)':'var(--bg)';b.style.color=selectedProtect.has(pkg)?'#fff':'var(--sb)';return}
  // Nav
  if(b.dataset.p)return go(b.dataset.p);
  // Config preset
  if(b.dataset.k==='PROFILE')return preset(b.dataset.v);
  if(b.dataset.k)return set(b.dataset.k,b.dataset.v);
  // Actions
  if(b.dataset.a)act(b)});

// ── Config change handler ─────────────────────────────────────────────────────
document.addEventListener('change',e=>{const t=e.target,k=t.dataset.k;if(!k)return;
  if(t.classList.contains('sw')){const v=t.checked?'1':'0';set(k,v);if(k.startsWith('PREM_')){clearTimeout(premTimers[k]);premPending[k]=v;premTimers[k]=setTimeout(()=>firePrem(k),320)}return}
  if(t.classList.contains('tx'))set(k,t.value.replace(/[^\w .,:-]/g,'').trim().replace(/\s+/g,' '));});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushAll();else{load();poll()}});
addEventListener('pagehide',flushAll);

// ── Init ──────────────────────────────────────────────────────────────────────
paint();go('home');load();setTimeout(()=>detectDevice(),700);setInterval(poll,5000);
setTimeout(()=>{const b=$('#smartOptimizeBtn');if(b)b.addEventListener('click',smartOptimize)},0);
