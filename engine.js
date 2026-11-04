/* PlayDaily10 — Shared Daily Engine (100% static, no server)
   Seeded daily challenges, streaks, sharing, challenge links, sound, confetti. */
/* Older-browser safety: Canvas roundRect (Safari <16 / old WebViews) */
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    r = Math.min(r || 0, w/2, h/2);
    this.moveTo(x+r,y); this.arcTo(x+w,y,x+w,y+h,r); this.arcTo(x+w,y+h,x,y+h,r);
    this.arcTo(x,y+h,x,y,r); this.arcTo(x,y,x+w,y,r); this.closePath(); return this;
  };
}
const PD = (() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const engineScriptSrc = (document.currentScript && document.currentScript.src) ||
    (document.querySelector('script[src*="engine.js"]') || {}).src || "";

  /* Daily challenges are keyed to the UTC date, so at any instant the whole
     planet really is playing the SAME board — not 24 different local days. */
  function todayStr(){
    return new Date().toISOString().slice(0,10);
  }
  function dailyNumberFor(dateStr){
    return Math.floor((new Date(dateStr+"T00:00:00Z") - new Date("2026-01-01T00:00:00Z")) / 86400000) + 1;
  }
  function dailyNumber(){ return dailyNumberFor(todayStr()); }
  function nextResetMs(){
    const d = new Date();
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()+1) - d.getTime();
  }
  function hashSeed(str){
    let h = 1779033703 ^ str.length;
    for (let i=0;i<str.length;i++){ h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h<<13 | h>>>19; }
    return h >>> 0;
  }
  function mulberry32(a){
    return function(){
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a>>>15, 1 | a);
      t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t;
      return ((t ^ t>>>14) >>> 0) / 4294967296;
    };
  }
  const rngFrom = seedStr => mulberry32(hashSeed(String(seedStr)));

  /* Storage helpers — never crash if web storage is unavailable.
     Fallback order: localStorage -> sessionStorage -> in-memory. */
  const memoryStore = new Map();
  const pickStorage = name => {
    try {
      const s = window[name];
      s.setItem("__pd_probe","1"); s.removeItem("__pd_probe");
      return s;
    } catch(e) { return null; }
  };
  let ls = pickStorage("localStorage") || pickStorage("sessionStorage");
  const lsGet = k => { try { return ls ? ls.getItem(k) : (memoryStore.has(k) ? memoryStore.get(k) : null); } catch(e){ return memoryStore.has(k) ? memoryStore.get(k) : null; } };
  const lsSet = (k,v) => { const val = String(v); memoryStore.set(k,val); try { ls && ls.setItem(k,val); } catch(e){} };
  const get = (k, d=0) => { const v = lsGet(k); const n = v===null ? d : +v; return Number.isFinite(n) ? n : d; };
  const set = (k,v) => lsSet(k, v);
  const bestKey = (g, variant) => "pd_" + g + "_best" + (variant ? "_" + variant : "");

  /* Mode-aware bests: a 40-move Free score must never pollute the Daily best. */
  function getBest(game, variant){
    const v = get(bestKey(game, variant));
    if (v || !variant) return v;
    if (variant === "daily" || variant.startsWith("daily-")) return get(bestKey(game)); // legacy migration
    return v;
  }
  function saveBest(game, score, variant){
    score = Math.round(score*100)/100;
    if (score > getBest(game, variant)) set(bestKey(game, variant), score);
    return getBest(game, variant);
  }
  function markPlayed(game){
    const t = todayStr(), lastK = "pd_" + game + "_last", stK = "pd_" + game + "_streak";
    /* Replaying a friend's OLD daily board (or a custom free-seed puzzle) is a
       challenge attempt — it must not light up today's hub card/streak. */
    const seedStr = params.get("seed") || "";
    const seedDate = seedStr.match(/\d{4}-\d{2}-\d{2}/);
    if (seedStr.includes("-free-") || (seedDate && seedDate[0] !== t)) return get(stK);
    const last = lsGet(lastK);
    if (last !== t){
      const ys = new Date(new Date(t+"T00:00:00Z").getTime() - 86400000).toISOString().slice(0,10);
      set(stK, last === ys ? get(stK)+1 : 1);
      set(lastK, t);
    }
    return get(stK);
  }
  const streak = game => get("pd_" + game + "_streak");
  const playedToday = game => lsGet("pd_" + game + "_last") === todayStr();

  /* Toast */
  let toastTimer;
  function toast(msg){
    let t = $("toast");
    if (!t){ t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove("show"), 2500);
  }

  /* Sound (WebAudio, no files) */
  let audioCtx = null;
  const soundOn = () => lsGet("pd_sound") !== "0";
  function beep(freq=440, dur=0.12, type="sine", vol=0.14){
    if (!soundOn()) return;
    try{
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur + 0.02);
    }catch(e){}
  }
  const sfx = {
    click:()=>beep(520,.06,"triangle"),
    good :()=>{beep(660,.1,"sine"); setTimeout(()=>beep(880,.14,"sine"),70)},
    great:()=>{[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.16,"sine"),i*80))},
    bad  :()=>beep(160,.25,"sine",.18),
    pop  :(n=0)=>beep(300+n*45,.11,"sine")
  };
  function initSoundBtn(){
    const b = $("soundBtn"); if (!b) return;
    const paint = ()=>{ b.textContent = soundOn() ? "🔊 ON" : "🔇 OFF";
      b.setAttribute("aria-pressed", soundOn() ? "true" : "false");
      b.setAttribute("aria-label", soundOn() ? "Sound on — tap to mute" : "Sound off — tap to unmute"); };
    paint();
    b.onclick = ()=>{ lsSet("pd_sound", soundOn() ? "0" : "1"); paint(); if (soundOn()) sfx.click(); };
  }

  /* Confetti emoji burst */
  function celebrate(emojis=["🎉","⭐","🍉","🎊","✨"], count=26){
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches){ sfx.great(); return; }
    for (let i=0;i<count;i++){
      const s = document.createElement("span");
      s.className = "confetti";
      s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      s.style.left = Math.random()*98 + "vw";
      s.style.animationDuration = (1.6 + Math.random()*1.8) + "s";
      s.style.animationDelay = (Math.random()*0.35) + "s";
      document.body.appendChild(s);
      setTimeout(()=>s.remove(), 4200);
    }
    sfx.great();
  }

  /* Sharing */
  const cleanUrl = () => location.href.split("?")[0].split("#")[0];
  async function share(text, title="PlayDaily10 🎮"){
    const url = cleanUrl();
    if (navigator.share){ try{ await navigator.share({title, text, url}); return; }catch(e){ if(e && e.name==="AbortError") return; } }
    try{ await navigator.clipboard.writeText(text + "\n" + url); toast("✅ Copied! Paste it anywhere to share"); }
    catch(e){ prompt("Copy your result:", text + "\n" + url); }
  }
  function whatsapp(text){
    window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + cleanUrl()), "_blank", "noopener");
  }
  async function challengeLink(score, seedStr, label="friend"){
    const u = cleanUrl() + "?seed=" + encodeURIComponent(seedStr) + "&beat=" + encodeURIComponent(Math.round(score*100)/100);
    const msg = "⚔️ I scored " + (Math.round(score*100)/100).toLocaleString("en-US") + " — same challenge, beat me if you can, " + label + "!\n" + u;
    try{ await navigator.clipboard.writeText(msg); toast("⚔️ Challenge link copied — send it to a friend!"); }
    catch(e){ prompt("Copy your challenge link:", u); }
    return u;
  }

  /* Challenge banner (when arriving from a friend's link) */
  function challengeBanner(){
    const beat = params.get("beat");
    if (beat === null || !Number.isFinite(Number(beat))) return null;
    const el = $("challBanner");
    if (el){
      el.className = "banner chall";
      el.innerHTML = "⚔️ <b>CHALLENGE MODE</b> — Beat <b>" + (+beat).toLocaleString("en-US") + "</b> on the exact same challenge. Fair fight!";
    }
    return +beat;
  }
  const challengeSeed = () => params.get("seed");
  const challengeBeat = () => params.get("beat")===null ? null : +params.get("beat");

  function challengeResultLine(score, beat, lowerIsBetter=false){
    if (beat===null || beat===undefined || !Number.isFinite(Number(beat))) return "";
    beat = Number(beat);
    const won = lowerIsBetter ? score < beat : score > beat;
    const tie = score === beat;
    return tie ? "<br>🤝 Exactly tied with the challenge score (" + beat.toLocaleString("en-US") + ")!"
               : won ? "<br>🏆 <b>You beat the challenge score of " + beat.toLocaleString("en-US") + "!</b>"
                     : "<br>The challenge score was " + beat.toLocaleString("en-US") + " — so close, try again! 💪";
  }

  /* Modal helpers */
  let modalReturnFocus = null;
  function modalFocusable(ov){
    return Array.from(ov.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
      .filter(el => el.getClientRects().length);
  }
  function initModal(){
    const ov = $("overlay"); if (!ov) return;
    ov.setAttribute("role","dialog"); ov.setAttribute("aria-modal","true");
    if ($("ovTitle")) ov.setAttribute("aria-labelledby","ovTitle");
    if ($("ovText")) ov.setAttribute("aria-describedby","ovText");
    ov.addEventListener("pointerdown", e => { if (e.target === ov) hideModal(); });
    document.addEventListener("keydown", e => {
      if (!ov.classList.contains("show")) return;
      if (e.key === "Escape") { hideModal(); return; }
      if (e.key !== "Tab") return;
      const items = modalFocusable(ov);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus({preventScroll:true}); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus({preventScroll:true}); }
      else if (!ov.contains(document.activeElement)) { e.preventDefault(); first.focus({preventScroll:true}); }
    });
  }
  function showModal(emoji, title, html){
    const ov = $("overlay"); if (!ov) return;
    if (!ov.classList.contains("show")) modalReturnFocus = document.activeElement;
    $("ovEmoji") && ($("ovEmoji").textContent = emoji);
    $("ovTitle") && ($("ovTitle").textContent = title);
    $("ovText") && ($("ovText").innerHTML = html);
    ov.classList.add("show");
    const firstBtn = modalFocusable(ov)[0];
    if (firstBtn) { try { firstBtn.focus({preventScroll:true}); } catch(e){} }
  }
  function hideModal(){
    const ov = $("overlay"); if (!ov) return;
    const wasShown = ov.classList.contains("show");
    ov.classList.remove("show");
    if (wasShown && modalReturnFocus && modalReturnFocus !== document.body && modalReturnFocus.isConnected) {
      try { modalReturnFocus.focus({preventScroll:true}); } catch(e){}
    }
    if (wasShown) modalReturnFocus = null;
  }

  const fmt = n => Number.isFinite(+n) ? Math.round(+n).toLocaleString("en-US") : "0";
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* Offline PWA: register from EVERY page (hub or a direct game/challenge link).
     The worker URL is derived from this engine's own URL, so subpath deploys work. */
  function registerServiceWorker(){
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol) || !engineScriptSrc) return;
    try {
      const swUrl = new URL(engineScriptSrc);
      if (!/\/assets\/engine\.js$/.test(swUrl.pathname)) return;
      swUrl.pathname = swUrl.pathname.replace(/\/assets\/engine\.js$/, "/sw.js");
      swUrl.search = ""; swUrl.hash = "";
      navigator.serviceWorker.register(swUrl.href).catch(()=>{});
    } catch(e) {}
  }

  document.addEventListener("DOMContentLoaded", () => { initSoundBtn(); initModal(); registerServiceWorker(); });

  return { $, todayStr, dailyNumber, dailyNumberFor, nextResetMs, hashSeed, rngFrom, get, set, lsGet, lsSet, saveBest, getBest, bestKey,
           markPlayed, streak, playedToday, toast, beep, sfx, celebrate, share, whatsapp,
           challengeLink, challengeBanner, challengeSeed, challengeBeat, challengeResultLine,
           showModal, hideModal, fmt, sleep, cleanUrl };
})();
