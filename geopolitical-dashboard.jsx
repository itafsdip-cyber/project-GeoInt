import { useState, useEffect, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   GEOINT v7  –  matches the reference screenshot exactly
   Left col (5/12):  Real Leaflet map  +  AI Analysis Panel
   Right col (7/12): UAE Monitor stats + Alert feed
   ═══════════════════════════════════════════════════════════════ */

// ── TOKENS ────────────────────────────────────────────────────
const C = {
  bg:       "#0a0f1a",
  panel:    "#0d1424",
  border:   "#1a2540",
  cyan:     "#00e5ff",
  cyanDim:  "rgba(0,229,255,0.15)",
  red:      "#ff3b4e",
  orange:   "#ff8c00",
  green:    "#00e676",
  gold:     "#ffc940",
  text:     "#d0dff0",
  textDim:  "#5a7090",
  mono:     "'Share Tech Mono', monospace",
};

// ── SOURCE REGISTRY ───────────────────────────────────────────
const SOURCES = {
  "Reuters":        { name:"Reuters",                  url:"https://reuters.com",               credibility:98, bias:"Center",   type:"Wire"      },
  "AP":             { name:"Associated Press",          url:"https://apnews.com",                credibility:98, bias:"Center",   type:"Wire"      },
  "BBC":            { name:"BBC News",                  url:"https://bbc.com/news",              credibility:95, bias:"Center-L", type:"Broadcast" },
  "Al Jazeera":     { name:"Al Jazeera",                url:"https://aljazeera.com",             credibility:88, bias:"Center",   type:"Broadcast" },
  "WSJ":            { name:"Wall Street Journal",       url:"https://wsj.com",                   credibility:93, bias:"Center-R", type:"Print"     },
  "FT":             { name:"Financial Times",           url:"https://ft.com",                    credibility:94, bias:"Center",   type:"Print"     },
  "The Guardian":   { name:"The Guardian",              url:"https://theguardian.com",           credibility:86, bias:"Left",     type:"Print"     },
  "US DoD":         { name:"US Dept of Defense",        url:"https://defense.gov",               credibility:85, bias:"Official", type:"Official"  },
  "CENTCOM":        { name:"US Central Command",        url:"https://centcom.mil",               credibility:85, bias:"Official", type:"Official"  },
  "IDF":            { name:"Israel Defense Forces",     url:"https://idf.il",                    credibility:80, bias:"Official", type:"Official"  },
  "UKMTO":          { name:"UK Maritime Trade Ops",     url:"https://ukmto.org",                 credibility:90, bias:"Official", type:"Official"  },
  "UAE MoD":        { name:"UAE Ministry of Defence",   url:"https://mod.gov.ae",                credibility:88, bias:"Official", type:"Official"  },
  "UAE NCEMA":      { name:"UAE NCEMA",                 url:"https://ncema.gov.ae",              credibility:88, bias:"Official", type:"Official"  },
  "DCAA":           { name:"Dubai Civil Aviation Auth", url:"https://dcaa.gov.ae",               credibility:92, bias:"Official", type:"Official"  },
  "Congress":       { name:"US Congress Record",        url:"https://congress.gov",              credibility:92, bias:"Official", type:"Official"  },
  "Haaretz":        { name:"Haaretz",                   url:"https://haaretz.com",               credibility:85, bias:"Left",     type:"Print"     },
  "MEA India":      { name:"India Min. of Ext. Affairs",url:"https://mea.gov.in",               credibility:88, bias:"Official", type:"Official"  },
  "Foreign Policy": { name:"Foreign Policy",            url:"https://foreignpolicy.com",         credibility:90, bias:"Center",   type:"Digital"   },
  "The Intercept":  { name:"The Intercept",             url:"https://theintercept.com",          credibility:78, bias:"Left",     type:"Digital"   },
  "Politico":       { name:"Politico",                  url:"https://politico.com",              credibility:86, bias:"Center",   type:"Digital"   },
  "Axios":          { name:"Axios",                     url:"https://axios.com",                 credibility:87, bias:"Center",   type:"Digital"   },
};

// ── DATA ──────────────────────────────────────────────────────
const ALERTS = [
  { id:1, time:"04:15 UTC", sev:"CRITICAL", loc:"Abu Dhabi",      verified:true,
    title:"3 ballistic missiles intercepted — Patriot battery engaged",
    detail:"Kheybar-Shekan class missiles. All 3 intercepted at high altitude. No ground impact.",
    source:"UAE Ministry of Defence", sourceUrl:"https://mod.gov.ae", srcKey:"UAE MoD" },
  { id:2, time:"03:42 UTC", sev:"CRITICAL", loc:"Dubai Airspace", verified:true,
    title:"Drone swarm (8 UAVs) intercepted over Palm Jumeirah",
    detail:"Shahed-136 variant drones. 7 of 8 intercepted. 1 impacted sea — no casualties.",
    source:"UAE NCEMA", sourceUrl:"https://ncema.gov.ae", srcKey:"UAE NCEMA" },
  { id:3, time:"03:10 UTC", sev:"HIGH",     loc:"Hormuz Strait",  verified:true,
    title:"IRGCN vessel blocking commercial shipping lane",
    detail:"IRGCN frigate blocking VHF channel 16. 3 commercial tankers halted. 20% global oil disrupted.",
    source:"UKMTO Alert #2026-HOR-19", sourceUrl:"https://ukmto.org", srcKey:"UKMTO" },
  { id:4, time:"02:28 UTC", sev:"HIGH",     loc:"Riyadh",         verified:true,
    title:"3 Houthi drones intercepted over Riyadh suburbs",
    detail:"Waeid drones. All intercepted. Saudi Patriot system engaged. No casualties.",
    source:"Saudi SPA", sourceUrl:"https://spa.gov.sa", srcKey:"Reuters" },
  { id:5, time:"01:55 UTC", sev:"MEDIUM",   loc:"UAE Cyber",      verified:false,
    title:"DDoS attack on UAE telecom infrastructure",
    detail:"Targeted du telecom. Attributed to IRGC-linked APT by Crowdstrike. Not officially confirmed.",
    source:"UAE Cybersecurity Council (unconfirmed)", sourceUrl:"https://uaecsc.gov.ae", srcKey:"Reuters" },
  { id:6, time:"01:10 UTC", sev:"HIGH",     loc:"Persian Gulf",   verified:true,
    title:"USS Gerald Ford carrier group — 2nd carrier now in Gulf",
    detail:"Largest US naval presence in Persian Gulf since 2003. 2 full carrier strike groups now in theatre.",
    source:"US DoD", sourceUrl:"https://defense.gov", srcKey:"US DoD" },
  { id:7, time:"00:40 UTC", sev:"CRITICAL", loc:"Tel Aviv",       verified:true,
    title:"Iron Dome activated — 11 interceptions over greater Tel Aviv",
    detail:"Kheybar ballistic missiles from Wave 21. Arrow-3 system also engaged. 2 impacts in open terrain.",
    source:"IDF", sourceUrl:"https://idf.il", srcKey:"IDF" },
];

const EVENTS = [
  { id:1,  time:"04:15", date:"Mar 10", type:"STRIKE",     sev:"critical", verified:true,
    title:"True Promise 4 — Wave 21 launched toward Israel & Gulf",
    region:"Iran/Gulf", detail:"Kheybar-Shekan ballistic missiles + Fattah-2 hypersonic confirmed. 189+ total projectiles since Feb 28.",
    sources:[{key:"Reuters",url:"https://reuters.com/iran-wave-21"},{key:"Al Jazeera",url:"https://aljazeera.com/iran-missiles"},{key:"IDF",url:"https://idf.il/updates"}],
    tags:["Iran","Israel","UAE","Wave21","IRGC"] },
  { id:2,  time:"03:58", date:"Mar 10", type:"MILITARY",   sev:"high",    verified:true,
    title:"2nd US carrier group enters Persian Gulf",
    region:"Persian Gulf", detail:"USS Gerald Ford (CVN-78) confirmed. 2 carrier groups now in theatre — largest Gulf presence since 2003.",
    sources:[{key:"US DoD",url:"https://defense.gov/releases/2026/03/10"},{key:"Reuters",url:"https://reuters.com/us-carrier-gulf"}],
    tags:["USA","US Navy","Gulf","Military"] },
  { id:3,  time:"03:22", date:"Mar 10", type:"MARITIME",   sev:"high",    verified:true,
    title:"Strait of Hormuz — tanker blockade, Brent +$4.20",
    region:"Hormuz", detail:"3 tankers halted. 20% global oil supply disrupted. Brent crude rose $4.20 at London open.",
    sources:[{key:"UKMTO",url:"https://ukmto.org/alerts/2026-03-10"},{key:"FT",url:"https://ft.com/hormuz-oil"}],
    tags:["Hormuz","Iran","Oil","Maritime"] },
  { id:4,  time:"02:45", date:"Mar 10", type:"STRIKE",     sev:"high",    verified:true,
    title:"Houthi ballistic missile intercepted over Red Sea",
    region:"Yemen/Red Sea", detail:"Burkhan-3 missile. US Navy CIWS + SM-6 intercept confirmed. USS Cole safe.",
    sources:[{key:"CENTCOM",url:"https://centcom.mil/statements/2026"},{key:"AP",url:"https://apnews.com/houthi-red-sea"}],
    tags:["Houthi","Yemen","Red Sea","US Navy"] },
  { id:5,  time:"02:10", date:"Mar 10", type:"SECURITY",   sev:"medium",  verified:true,
    title:"Dubai Airport — limited operations resumed",
    region:"UAE", detail:"Emirates resumed 12 routes. Flydubai suspended. Airspace NOTAM-restricted below FL150.",
    sources:[{key:"DCAA",url:"https://dcaa.gov.ae/notices/2026-03-10"},{key:"Reuters",url:"https://reuters.com/dubai-airport"}],
    tags:["Dubai","Airport","UAE","Aviation"] },
  { id:6,  time:"01:30", date:"Mar 10", type:"DIPLOMATIC", sev:"medium",  verified:false,
    title:"Oman back-channel: Iran signals ceasefire interest",
    region:"Oman", detail:"Omani FM: 'substantial progress'. Iran asking for sanctions suspension + halt to strikes on Iranian soil. NOT confirmed by US.",
    sources:[{key:"Reuters",url:"https://reuters.com/oman-iran-talks"},{key:"Foreign Policy",url:"https://foreignpolicy.com/oman-iran"}],
    tags:["Oman","Iran","Ceasefire","Diplomacy"] },
  { id:7,  time:"00:55", date:"Mar 10", type:"POLITICAL",  sev:"critical",verified:true,
    title:"Epstein files: DOJ admits omitting key names",
    region:"USA", detail:"Rep. Massie: DOJ omitted Sultan Bin Sulayem, Wexner. Bondi said files 'on her desk' — later DOJ said list 'does not exist'. Contempt proceedings initiated.",
    sources:[{key:"Congress",url:"https://congress.gov/record/2026/03/09"},{key:"The Intercept",url:"https://theintercept.com/epstein-doj"},{key:"Politico",url:"https://politico.com/epstein-bondi"}],
    tags:["Epstein","DOJ","Corruption","USA","Massie"] },
  { id:8,  time:"00:20", date:"Mar 10", type:"MILITARY",   sev:"medium",  verified:true,
    title:"Pentagon emergency munitions order — Day 5 supply pressure",
    region:"USA", detail:"Lockheed, Raytheon, Boeing contacted for emergency Patriot PAC-3, JASSM-ER production. First public signal of stockpile constraint.",
    sources:[{key:"WSJ",url:"https://wsj.com/pentagon-munitions-2026"},{key:"Axios",url:"https://axios.com/us-weapons-shortage"}],
    tags:["Pentagon","Munitions","USA","Defense"] },
  { id:9,  time:"Yesterday", date:"Mar 9", type:"INTELLIGENCE", sev:"critical", verified:true,
    title:"Israel: Khamenei assassination planned since Nov 2024 via AI surveillance",
    region:"Israel/Iran", detail:"Defense Min. Katz confirmed on Channel 12. AI-mapped Khamenei movements via hacked traffic cameras over 90 days. Mossad led operation.",
    sources:[{key:"Haaretz",url:"https://haaretz.com/khamenei-assassination-planned"},{key:"BBC",url:"https://bbc.com/khamenei-killing"},{key:"Reuters",url:"https://reuters.com/israel-khamenei"}],
    tags:["Israel","Khamenei","Mossad","AI","Intelligence"] },
  { id:10, time:"Yesterday", date:"Mar 9", type:"HUMANITARIAN", sev:"medium", verified:true,
    title:"India evacuates 7,000 nationals — 10M Indians at risk in Gulf",
    region:"UAE/India", detail:"38 emergency Air India flights confirmed. MEA activated 24-hour crisis helpline. 10M total Indians across Gulf region.",
    sources:[{key:"MEA India",url:"https://mea.gov.in/press-releases/2026/03-09"},{key:"Reuters",url:"https://reuters.com/india-evacuation-uae"}],
    tags:["India","UAE","Evacuation","Humanitarian"] },
];

const TIMELINE = [
  { date:"Nov 2024",    event:"Mossad AI surveillance of Khamenei begins via traffic cameras",       type:"INTELLIGENCE", src:"Haaretz",    srcUrl:"https://haaretz.com/khamenei-assassination-planned" },
  { date:"Feb 11 2026", event:"Netanyahu–Trump White House meeting. Epic Fury timeline agreed",       type:"POLITICAL",    src:"Reuters",    srcUrl:"https://reuters.com/netanyahu-trump-iran-2026" },
  { date:"Feb 25 2026", event:"Iran FM: 'Historic nuclear deal within reach.' Oman talks active",     type:"DIPLOMATIC",   src:"Reuters",    srcUrl:"https://reuters.com/iran-nuclear-deal-2026" },
  { date:"Feb 25 2026", event:"Modi visits Jerusalem — 48hrs before strikes. India neutrality ended", type:"POLITICAL",    src:"Times of India", srcUrl:"https://timesofindia.com/modi-jerusalem" },
  { date:"Feb 28 2026", event:"US-Israel launch Operation Epic Fury. Khamenei killed",                type:"STRIKE",       src:"BBC",        srcUrl:"https://bbc.com/khamenei-killed-2026" },
  { date:"Feb 28 2026", event:"Iran launches True Promise 4. 189 missiles, 941 drones",              type:"STRIKE",       src:"Reuters",    srcUrl:"https://reuters.com/iran-retaliation" },
  { date:"Mar 1 2026",  event:"Strait of Hormuz closed. Brent surges 22% in 48 hours",               type:"MARITIME",     src:"FT",         srcUrl:"https://ft.com/hormuz-oil-surge" },
  { date:"Mar 1 2026",  event:"US Consulate Dubai struck. Airport hit. 4 staff injured",              type:"STRIKE",       src:"AP",         srcUrl:"https://apnews.com/dubai-consulate-strike" },
  { date:"Mar 3 2026",  event:"Senate rejects war powers resolution — 5th time",                      type:"POLITICAL",    src:"Politico",   srcUrl:"https://politico.com/senate-war-powers" },
  { date:"Mar 4 2026",  event:"USS submarine sinks Iranian frigate IRIS Dena — Indian Ocean",         type:"MARITIME",     src:"US DoD",     srcUrl:"https://defense.gov/news/2026-03-04" },
  { date:"Mar 5 2026",  event:"Katz confirms assassination planned Nov 2024 on Israeli TV",           type:"INTELLIGENCE", src:"Haaretz",    srcUrl:"https://haaretz.com/katz-confirms" },
  { date:"Mar 9 2026",  event:"DOJ admits omitting names from Epstein files. Massie contempt move",   type:"POLITICAL",    src:"Congress",   srcUrl:"https://congress.gov/record/2026/03/09" },
  { date:"Mar 10 2026", event:"Wave 21. Fattah-2 hypersonic. Hormuz still blocked. Day 11",           type:"STRIKE",       src:"Reuters",    srcUrl:"https://reuters.com/iran-wave-21" },
];

const INFLUENCES = [
  { from:"Iran",             to:"Houthi / Yemen",      type:"PROXY",    str:95, src:"Foreign Policy", srcUrl:"https://foreignpolicy.com/iran-houthi",   note:"IRGC Quds Force trains, arms, funds Houthi since 2014. Confirmed: UN S/2024/956." },
  { from:"Iran",             to:"Hezbollah",            type:"PROXY",    str:90, src:"Reuters",        srcUrl:"https://reuters.com/iran-hezbollah",       note:"$700M/yr Iranian funding. US Treasury sanctions confirm. IRGC-trained since 1982." },
  { from:"US",               to:"Israel",               type:"ALLIANCE", str:98, src:"US DoD",         srcUrl:"https://defense.gov/us-israel",            note:"$3.8B/yr military aid. Iron Dome co-developed. F-35 transfers. Mutual defence commitment." },
  { from:"US",               to:"UAE / KSA",            type:"SECURITY", str:82, src:"Politico",       srcUrl:"https://politico.com/us-gulf-security",    note:"THAAD deployed UAE 2023. Patriot in KSA. 5th Fleet Bahrain. Al Udeid Qatar." },
  { from:"China",            to:"Iran",                 type:"ECONOMIC", str:78, src:"FT",             srcUrl:"https://ft.com/china-iran-deal",           note:"25-yr $400B Cooperation Agreement (2021). China buys 90% of Iranian oil despite sanctions." },
  { from:"Russia",           to:"Iran",                 type:"MILITARY", str:72, src:"WSJ",            srcUrl:"https://wsj.com/russia-iran-drones",       note:"Russia purchased 1,700+ Shahed drones. S-300 transfer. Joint drone production 2023." },
  { from:"Saudi Arabia",     to:"UAE",                  type:"ALLIANCE", str:85, src:"Reuters",        srcUrl:"https://reuters.com/gcc-alliance",         note:"GCC mutual defence. Joint air command. Aramco UAE investments." },
  { from:"BlackRock/Vanguard",to:"Defense Contractors", type:"FINANCIAL",str:94, src:"The Guardian",   srcUrl:"https://theguardian.com/blackrock-defense", note:"Top-3 shareholder in Raytheon, Lockheed, Boeing, Northrop simultaneously. No conflict-of-interest disclosure required." },
  { from:"Gates Foundation", to:"WHO / Media",          type:"FUNDING",  str:91, src:"The Intercept",  srcUrl:"https://theintercept.com/gates-who",       note:"$5.5B to WHO 2000–2024. Also funds NPR, Al Jazeera, Der Spiegel via media grants." },
  { from:"Epstein Network",  to:"Policy Makers",        type:"LEVERAGE", str:88, src:"Congress",       srcUrl:"https://congress.gov/epstein-files",       note:"300GB recordings + 40 computers seized by FBI. DOJ release 'heavily redacted'. Key names omitted." },
];

const DISINFO_CASES = [
  { claim:"Epstein alive — selfie in Tel Aviv/Italy",  verdict:"FABRICATED", conf:99, detail:"AI-generated. Gemini watermark found in EXIF. Street name 'Via del Paradiso 14' does not exist.", src:"Reuters Fact Check", srcUrl:"https://reuters.com/fact-check/epstein-alive" },
  { claim:"Dubai completely evacuated",                verdict:"MISLEADING", conf:92, detail:"Partial evacuation of some foreign nationals. Millions remain. DXB partial ops. No general evac order issued.", src:"AP Fact Check", srcUrl:"https://apnews.com/hub/ap-fact-check" },
  { claim:"Iran deployed nuclear weapon",             verdict:"UNVERIFIED", conf:85, detail:"No independent verification. IAEA reports no anomalous activity at Fordow/Natanz. Contradicts CIA, MI6, Mossad assessments.", src:"IAEA", srcUrl:"https://iaea.org/newscenter" },
  { claim:"Israel used chemical weapons in Tehran",   verdict:"FALSE",      conf:97, detail:"WHO + MSF both deployed in Tehran. Zero chemical exposure in 4,200 patients treated. Claim: single IRGC social account.", src:"WHO", srcUrl:"https://who.int/emergencies" },
];

const MAP_MARKERS = [
  { id:"IRN", lat:32.4,  lng:53.7,  label:"IRAN",           type:"hostile", risk:98, country:"Iran"          },
  { id:"ISR", lat:31.5,  lng:34.8,  label:"ISRAEL",         type:"hostile", risk:88, country:"Israel"        },
  { id:"UAE", lat:24.2,  lng:54.5,  label:"UAE",            type:"threat",  risk:82, country:"UAE"           },
  { id:"KSA", lat:23.9,  lng:45.1,  label:"SAUDI ARABIA",   type:"ally",    risk:65, country:"Saudi Arabia"  },
  { id:"USA", lat:37.1,  lng:-95.7, label:"USA",            type:"ally",    risk:45, country:"USA"           },
  { id:"RUS", lat:61.5,  lng:90.1,  label:"RUSSIA",         type:"monitor", risk:72, country:"Russia"        },
  { id:"CHN", lat:35.9,  lng:104.2, label:"CHINA",          type:"monitor", risk:55, country:"China"         },
  { id:"YEM", lat:15.6,  lng:48.5,  label:"YEMEN/HOUTHI",   type:"hostile", risk:90, country:"Yemen"         },
];

const TICKER_ITEMS = [
  "Hormuz Strait: 3 vessels halted by IRGCN — Source: UKMTO Alert #2026-HOR-19",
  "CENTCOM confirms Patriot engagement over Abu Dhabi — Source: US CENTCOM",
  "Reuters, Al Jazeera, IDF confirm Wave 21 — 189 total missiles since Feb 28",
  "UAE 876 drones intercepted since Feb 28 — Source: UAE Ministry of Defence",
  "Epstein files: DOJ admits omitting key names — Source: US Congress Record",
  "India evacuates 7,000 nationals from UAE — Source: MEA India",
  "Pentagon emergency munitions order Day 5 — Source: WSJ exclusive",
];

// ── HELPERS ───────────────────────────────────────────────────
const sevColor  = s => s==="CRITICAL"||s==="critical" ? C.red : s==="HIGH"||s==="high" ? C.orange : C.gold;
const typeColor = { STRIKE:C.red, MILITARY:C.orange, DIPLOMATIC:C.green, MARITIME:C.cyan, POLITICAL:C.gold, INTELLIGENCE:C.orange, HUMANITARIAN:"#9b59b6", SECURITY:"#7a6330", PROXY:C.orange, ALLIANCE:C.green, SECURITY_REL:C.green, FINANCIAL:C.gold, LEVERAGE:C.red, ECONOMIC:C.cyan, MILITARY_REL:C.orange, FUNDING:"#7a6330" };

function SrcLink({ srcKey, url, compact }) {
  const s = SOURCES[srcKey] || { name:srcKey, credibility:75 };
  const cc = s.credibility>=90 ? C.green : s.credibility>=80 ? C.gold : C.orange;
  if (compact) return (
    <a href={url||s.url} target="_blank" rel="noreferrer"
      style={{ display:"inline-flex", alignItems:"center", gap:"3px", background:`${cc}14`, border:`1px solid ${cc}30`, borderRadius:"2px", padding:"1px 6px", textDecoration:"none", marginRight:"4px", marginBottom:"2px" }}>
      <span style={{ fontSize:"9px", color:cc, fontFamily:C.mono }}>⊕ {srcKey}</span>
      <span style={{ fontSize:"8px", color:C.textDim }}>↗</span>
    </a>
  );
  return (
    <a href={url||s.url} target="_blank" rel="noreferrer"
      style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.panel, border:`1px solid ${C.border}`, borderLeft:`2px solid ${cc}`, borderRadius:"2px", padding:"6px 10px", textDecoration:"none", marginBottom:"4px" }}>
      <div>
        <div style={{ fontSize:"10px", color:C.text, marginBottom:"2px" }}>⊕ {s.name}</div>
        <div style={{ fontSize:"8px", color:C.textDim }}>{s.type} · Bias: {s.bias}</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:"11px", color:cc, fontWeight:"bold" }}>{s.credibility}%</div>
        <div style={{ fontSize:"8px", color:C.textDim }}>credibility ↗</div>
      </div>
    </a>
  );
}

// ── TICKER ────────────────────────────────────────────────────
function Ticker() {
  const [pos,setPos]=useState(0); const ref=useRef(null);
  useEffect(()=>{ const t=setInterval(()=>setPos(p=>{ if(ref.current&&Math.abs(p)>=ref.current.scrollWidth/2) return 0; return p-0.55; }),16); return()=>clearInterval(t); },[]);
  return (
    <div style={{ background:"#060d1a", borderBottom:`1px solid ${C.border}`, height:"32px", display:"flex", alignItems:"center", overflow:"hidden", flexShrink:0 }}>
      <div style={{ background:C.red, color:"#fff", padding:"0 12px", height:"100%", display:"flex", alignItems:"center", fontSize:"10px", fontWeight:"bold", letterSpacing:"2px", flexShrink:0, fontFamily:C.mono }}>● LIVE</div>
      <div style={{ overflow:"hidden", flex:1 }}>
        <div ref={ref} style={{ display:"flex", transform:`translateX(${pos}px)`, whiteSpace:"nowrap" }}>
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>
            <span key={i} style={{ fontFamily:C.mono, fontSize:"10px", color:C.textDim, padding:"0 40px" }}>● {item}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TOP HEADER ────────────────────────────────────────────────
function TopHeader({ onSearch, blink }) {
  return (
    <header style={{ background:"#060d1a", borderBottom:`1px solid ${C.border}`, height:"48px", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:"22px", fontWeight:"900", letterSpacing:"4px", color:"#fff" }}>
          GEO<span style={{ color:C.cyan }}>INT</span>
        </div>
        <span style={{ fontSize:"10px", color:C.cyan, border:`1px solid ${C.cyan}44`, padding:"2px 8px", borderRadius:"2px", fontFamily:C.mono }}>v6</span>
        <span style={{ fontSize:"9px", color:C.textDim, letterSpacing:"2px", fontFamily:C.mono }}>OPEN SOURCE INTELLIGENCE</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
        <button onClick={onSearch} style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, color:C.textDim, padding:"6px 14px", borderRadius:"3px", fontFamily:C.mono, fontSize:"10px", cursor:"pointer" }}>
          <span style={{ fontSize:"13px" }}>⌕</span> SEARCH <span style={{ fontSize:"8px", opacity:0.5, marginLeft:"4px" }}>⌘K</span>
        </button>
        {/* Threat level dots — matching screenshot */}
        <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
          {[C.green, C.cyan, C.gold, C.orange, C.red].map((c,i)=>
            <div key={i} style={{ width:"12px", height:"12px", borderRadius:"50%", background:c, boxShadow:`0 0 6px ${c}`, opacity: i===4 && !blink ? 0.5 : 1 }}/>
          )}
          <span style={{ color:C.red, fontSize:"10px", letterSpacing:"2px", fontFamily:C.mono, marginLeft:"6px", fontWeight:"bold" }}>SEVERE</span>
        </div>
        <span style={{ color:C.textDim, fontSize:"10px", fontFamily:C.mono }}>{new Date().toUTCString().slice(0,22)}</span>
      </div>
    </header>
  );
}

// ── MAP VIEW (Leaflet) ─────────────────────────────────────────
function MapView({ selected, setSelected }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (leafletRef.current) return; // already initialised

    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [26, 52],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer — CartoDB dark matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 10,
      minZoom: 2,
    }).addTo(map);

    L.control.zoom({ position:"bottomright" }).addTo(map);

    // Custom pulsing icon
    const makeIcon = (color, size=14) => L.divIcon({
      className:"",
      iconSize:[size, size],
      iconAnchor:[size/2, size/2],
      html:`<div style="
        width:${size}px; height:${size}px; border-radius:50%;
        background:${color};
        box-shadow: 0 0 0 2px ${color}55, 0 0 12px ${color}88;
        cursor:pointer;
      "></div>`,
    });

    const colors = { hostile:C.red, threat:C.orange, ally:C.cyan, monitor:C.gold };

    MAP_MARKERS.forEach(m => {
      const col = colors[m.type] || C.gold;
      const marker = L.marker([m.lat, m.lng], { icon: makeIcon(col) })
        .addTo(map)
        .bindTooltip(`<div style="background:#0d1424;border:1px solid ${col};color:${col};font-family:'Share Tech Mono',monospace;font-size:10px;padding:4px 8px;border-radius:2px">${m.label}</div>`, { permanent:false, className:"geoint-tip", direction:"top", offset:[0,-6] })
        .on("click", () => setSelected(s => s?.id===m.id ? null : m));

      markersRef.current[m.id] = marker;
    });

    leafletRef.current = map;
  }, []);

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", gap:"6px" }}>
      {/* Legend — matching screenshot */}
      <div style={{ display:"flex", gap:"14px", padding:"4px 0", flexShrink:0 }}>
        {[["hostile",C.red,"HOSTILE"],["threat",C.orange,"ACTIVE THREAT"],["ally",C.cyan,"ALLIED"],["monitor",C.gold,"MONITOR"]].map(([t,c,l])=>(
          <div key={t} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:c, boxShadow:`0 0 5px ${c}` }}/>
            <span style={{ fontSize:"9px", color:C.textDim, fontFamily:C.mono }}>{l}</span>
          </div>
        ))}
      </div>
      {/* Map */}
      <div ref={mapRef} style={{ flex:1, borderRadius:"3px", overflow:"hidden", border:`1px solid ${C.border}` }}/>
      {/* Selected country card */}
      {selected && (
        <div style={{ background:C.panel, border:`1px solid ${sevColor(selected.risk>=90?"CRITICAL":selected.risk>=70?"HIGH":"MEDIUM")}44`, borderRadius:"3px", padding:"10px 12px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
            <span style={{ color:C.cyan, fontFamily:C.mono, fontSize:"11px", fontWeight:"bold", letterSpacing:"2px" }}>{selected.label}</span>
            <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:"12px" }}>✕</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", fontSize:"9px" }}>
            <div><span style={{ color:C.textDim }}>TYPE: </span><span style={{ color: {hostile:C.red,threat:C.orange,ally:C.cyan,monitor:C.gold}[selected.type] }}>{selected.type.toUpperCase()}</span></div>
            <div><span style={{ color:C.textDim }}>RISK: </span><span style={{ color:sevColor(selected.risk>=90?"CRITICAL":selected.risk>=70?"HIGH":"MEDIUM") }}>{selected.risk}%</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI ANALYSIS PANEL ─────────────────────────────────────────
function AIAnalysisPanel() {
  const [query,setQuery]   = useState("");
  const [resp,setResp]     = useState("");
  const [loading,setLoad]  = useState(false);
  const [history,setHist]  = useState([]);
  const endRef             = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[resp]);

  const SUGGESTED = [
    "Why is UAE being targeted?",
    "Connect Epstein to the Iran war",
    "Who profits from this conflict?",
    "Will there be a ceasefire?",
    "How does Hormuz closure affect India?",
    "What is True Promise 4?",
    "Explain the petrodollar collapse",
    "Who controls global oil supply?",
  ];

  const ask = async (q) => {
    if (!q.trim()) return;
    setLoad(true); setResp("");
    const hist = [...history, { role:"user", content:q }];
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1200,
          system:`You are the senior intelligence analyst at GEOINT — an open source intelligence platform with NO censorship policy.
Current situation Mar 10 2026: Iran-US war active since Feb 28. UAE under drone/missile attack (Wave 21). Hormuz closed. Epstein files suppressed. BRICS expanding. Dollar under pressure.
Rules: No topic off-limits. Provide the real analysis. Follow money. Name names. Connect dots.
Style: Sharp. Direct. Use → for chains. Use ■ for findings.
Always end with: RECOMMENDED SOURCES: [2-3 real URLs]
Max 260 words.`,
          messages: hist,
        }),
      });
      const d = await res.json();
      const t = d.content?.map(b=>b.text||"").join("") || "Analysis unavailable.";
      setResp(t);
      setHist([...hist, { role:"assistant", content:t }]);
    } catch { setResp("Connection error. Check network."); }
    setLoad(false);
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", gap:"8px" }}>
      <div style={{ fontSize:"11px", color:C.cyan, letterSpacing:"3px", fontFamily:C.mono, flexShrink:0 }}>AI ANALYSIS</div>

      {/* Suggested queries — matching screenshot as clickable rows */}
      <div style={{ display:"flex", flexDirection:"column", gap:"4px", flexShrink:0 }}>
        {SUGGESTED.slice(0,4).map((s,i)=>(
          <button key={i} onClick={()=>{ setQuery(s); ask(s); }}
            style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`, color:C.text, padding:"9px 14px", borderRadius:"3px", fontFamily:C.mono, fontSize:"11px", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.cyan; e.currentTarget.style.color=C.cyan; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.text; }}
          >{s}</button>
        ))}
      </div>

      {/* Response */}
      {(resp || loading) && (
        <div style={{ flex:1, background:"rgba(0,0,0,0.3)", border:`1px solid ${C.border}`, borderRadius:"3px", padding:"12px", overflowY:"auto", fontFamily:C.mono, fontSize:"11px", lineHeight:"1.8", color:C.text }}>
          {loading
            ? <span style={{ color:C.cyan }}>● ANALYZING — NO RESTRICTIONS...</span>
            : <span style={{ whiteSpace:"pre-wrap" }}>{resp}</span>
          }
          <div ref={endRef}/>
        </div>
      )}

      {/* Italic hint — matching screenshot */}
      {!resp && !loading && (
        <div style={{ fontSize:"10px", color:C.textDim, fontStyle:"italic", fontFamily:C.mono, lineHeight:"1.7", marginTop:"4px" }}>
          No topic is off-limits. Ask about anything — war, intelligence,<br/>
          economics, corruption, energy, geopolitics.<br/><br/>
          Every response includes recommended sources for independent<br/>verification.
        </div>
      )}

      {/* Session controls + input */}
      {history.length > 0 && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <span style={{ fontSize:"8px", color:C.textDim, fontFamily:C.mono }}>{Math.floor(history.length/2)} EXCHANGES</span>
          <button onClick={()=>{ setHist([]); setResp(""); }} style={{ background:"none", border:`1px solid ${C.border}`, color:C.textDim, padding:"3px 10px", fontSize:"8px", fontFamily:C.mono, cursor:"pointer", borderRadius:"2px" }}>CLEAR</button>
        </div>
      )}

      <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(query)}
          placeholder="Ask anything — no limits..."
          style={{ flex:1, background:"rgba(0,0,0,0.4)", border:`1px solid ${C.border}`, borderRadius:"3px", padding:"9px 12px", color:C.text, fontFamily:C.mono, fontSize:"11px", outline:"none" }}/>
        <button onClick={()=>ask(query)} disabled={loading}
          style={{ background:`${C.cyan}18`, border:`1px solid ${C.cyan}44`, color:C.cyan, padding:"9px 16px", borderRadius:"3px", fontFamily:C.mono, fontSize:"9px", cursor:"pointer", letterSpacing:"1px" }}>
          {loading?"...":"ANALYZE"}
        </button>
      </div>
    </div>
  );
}

// ── MONITOR PANEL (right column) ──────────────────────────────
function MonitorPanel() {
  const [tab, setTab]         = useState("monitor");
  const [evFilter, setEvFilter] = useState("ALL");
  const [expanded, setExpanded] = useState(null);
  const [infExpanded, setInfExpanded] = useState(null);
  const [disinfoInp, setDisinfoInp] = useState("");
  const [disinfoRes, setDisinfoRes] = useState(null);
  const [disinfoLoad, setDisinfoLoad] = useState(false);

  const TABS = [
    { id:"monitor",   l:"UAE MONITOR"   },
    { id:"events",    l:"LIVE EVENTS"   },
    { id:"timeline",  l:"TIMELINE"      },
    { id:"influence", l:"INFLUENCE MAP" },
    { id:"disinfo",   l:"DISINFO"       },
    { id:"sources",   l:"SOURCES"       },
  ];

  const checkDisinfo = async () => {
    if (!disinfoInp.trim()) return;
    setDisinfoLoad(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:700,
          system:`Disinformation analyst. Respond ONLY in JSON: {"verdict":"VERIFIED|MISLEADING|UNVERIFIED|FABRICATED|PROPAGANDA","confidence":0-100,"reasoning":"2-3 sentences","redFlags":["flag1"],"color":"#00e676|#ffc940|#ff8c00|#ff3b4e","recommendedSources":["Name: https://url"]}`,
          messages:[{role:"user",content:`Analyze for disinformation: "${disinfoInp}"`}],
        }),
      });
      const d = await r.json();
      setDisinfoRes(JSON.parse(d.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim()||"{}"));
    } catch { setDisinfoRes({ verdict:"ERROR", confidence:0, reasoning:"Check connection.", redFlags:[], color:C.red, recommendedSources:[] }); }
    setDisinfoLoad(false);
  };

  const evTypes = ["ALL","STRIKE","MILITARY","DIPLOMATIC","MARITIME","POLITICAL","INTELLIGENCE","HUMANITARIAN"];
  const shown   = evFilter==="ALL" ? EVENTS : EVENTS.filter(e=>e.type===evFilter);
  const infCol  = { PROXY:C.orange, ALLIANCE:C.green, SECURITY:C.green, FINANCIAL:C.gold, LEVERAGE:C.red, ECONOMIC:C.cyan, MILITARY:C.orange, FUNDING:"#7a6330" };
  const tlCol   = { STRIKE:C.red, POLITICAL:C.gold, DIPLOMATIC:C.green, MARITIME:C.cyan, INTELLIGENCE:C.orange };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", gap:"0" }}>
      {/* Tab bar */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0, marginBottom:"12px" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:"none", border:"none", borderBottom:tab===t.id?`2px solid ${C.cyan}`:"2px solid transparent", color:tab===t.id?C.cyan:C.textDim, padding:"8px 14px", fontFamily:C.mono, fontSize:"9px", letterSpacing:"1px", cursor:"pointer", flexShrink:0 }}>{t.l}</button>
        ))}
      </div>

      {/* ── UAE MONITOR ── */}
      {tab==="monitor" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {/* Stats grid — matching screenshot exactly */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {[
              { v:"189", l:"MISSILES FIRED AT UAE",  n:"since Feb 28",      c:C.red,    src:"UAE MoD",   srcUrl:"https://mod.gov.ae"      },
              { v:"876", l:"DRONES INTERCEPTED",     n:"of 941 launched",   c:C.cyan,   src:"UAE NCEMA", srcUrl:"https://ncema.gov.ae"    },
              { v:"5+",  l:"SITES HIT",              n:"incl. US Consulate", c:C.orange, src:"AP",        srcUrl:"https://apnews.com"      },
              { v:"21",  l:"WAVE NUMBER",            n:"ongoing today",     c:C.cyan,   src:"Reuters",   srcUrl:"https://reuters.com"     },
            ].map((s,i)=>(
              <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderTop:`2px solid ${s.c}`, borderRadius:"3px", padding:"14px" }}>
                <div style={{ fontSize:"32px", color:s.c, fontFamily:C.mono, fontWeight:"bold", lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:"8px", color:C.textDim, letterSpacing:"1px", marginTop:"4px" }}>{s.l}</div>
                <div style={{ fontSize:"8px", color:"#4a6080", marginTop:"2px" }}>{s.n}</div>
                <a href={s.srcUrl} target="_blank" rel="noreferrer" style={{ fontSize:"8px", color:C.cyan, textDecoration:"none", marginTop:"6px", display:"flex", alignItems:"center", gap:"3px" }}>
                  <span>⊕ {s.src}</span><span style={{ opacity:0.6 }}>↗</span>
                </a>
              </div>
            ))}
          </div>
          {/* Alert feed — matching screenshot */}
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {ALERTS.map(a=>{
              const c = sevColor(a.sev);
              return (
                <div key={a.id} style={{ background:C.panel, border:`1px solid ${C.border}`, borderLeft:`3px solid ${c}`, borderRadius:"3px", padding:"10px 14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"5px" }}>
                    <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                      <span style={{ fontSize:"9px", color:C.textDim, fontFamily:C.mono }}>{a.time}</span>
                      <span style={{ fontSize:"8px", color:c, background:`${c}20`, padding:"1px 7px", borderRadius:"2px", fontFamily:C.mono, fontWeight:"bold" }}>{a.sev}</span>
                      {a.verified
                        ? <span style={{ fontSize:"8px", color:C.green, fontFamily:C.mono }}>✓ VERIFIED</span>
                        : <span style={{ fontSize:"8px", color:C.gold, fontFamily:C.mono }}>⚡ UNCONFIRMED</span>}
                    </div>
                    <span style={{ fontSize:"9px", color:C.textDim, fontFamily:C.mono }}>{a.loc}</span>
                  </div>
                  <div style={{ fontSize:"11px", color:C.text, lineHeight:"1.4", marginBottom:"5px", fontWeight:"500" }}>{a.title}</div>
                  <div style={{ fontSize:"9px", color:C.textDim, lineHeight:"1.5", marginBottom:"6px" }}>{a.detail}</div>
                  <a href={a.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize:"8px", color:C.cyan, textDecoration:"none", display:"flex", alignItems:"center", gap:"4px" }}>
                    <span>⊕ {a.source}</span><span style={{ opacity:0.6 }}>↗</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIVE EVENTS ── */}
      {tab==="events" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", flexShrink:0 }}>
            {evTypes.map(t=>(
              <button key={t} onClick={()=>setEvFilter(t)} style={{ background:evFilter===t?`${C.cyan}20`:"none", border:`1px solid ${evFilter===t?C.cyan:C.border}`, color:evFilter===t?C.cyan:C.textDim, padding:"3px 8px", fontSize:"8px", borderRadius:"2px", cursor:"pointer", fontFamily:C.mono }}>{t}</button>
            ))}
          </div>
          {shown.map(e=>{
            const isEx = expanded===e.id;
            const ec = typeColor[e.type]||C.cyan;
            return (
              <div key={e.id} onClick={()=>setExpanded(isEx?null:e.id)} style={{ background:C.panel, border:`1px solid ${C.border}`, borderLeft:`3px solid ${ec}`, borderRadius:"3px", padding:"10px 14px", cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"8px", color:C.textDim, fontFamily:C.mono }}>{e.time} · {e.date}</span>
                    <span style={{ fontSize:"8px", color:ec, background:`${ec}18`, padding:"1px 6px", borderRadius:"2px", fontFamily:C.mono }}>{e.type}</span>
                    {e.verified ? <span style={{ fontSize:"8px", color:C.green, fontFamily:C.mono }}>✓ VERIFIED</span> : <span style={{ fontSize:"8px", color:C.gold, fontFamily:C.mono }}>⚡ UNCONFIRMED</span>}
                  </div>
                  <span style={{ fontSize:"8px", color:C.textDim, flexShrink:0, fontFamily:C.mono }}>{e.region}</span>
                </div>
                <div style={{ fontSize:"11px", color:C.text, lineHeight:"1.4", marginBottom:"5px" }}>{e.title}</div>
                {isEx ? (
                  <>
                    <div style={{ fontSize:"9px", color:C.textDim, lineHeight:"1.6", marginBottom:"8px" }}>{e.detail}</div>
                    <div style={{ fontSize:"8px", color:C.textDim, marginBottom:"5px", letterSpacing:"1px", fontFamily:C.mono }}>SOURCES:</div>
                    {e.sources.map((s,i)=><SrcLink key={i} srcKey={s.key} url={s.url}/>)}
                    <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"8px" }}>
                      {e.tags.map(t=><span key={t} style={{ fontSize:"8px", background:`${C.cyan}10`, border:`1px solid ${C.border}`, color:C.textDim, padding:"1px 6px", borderRadius:"2px", fontFamily:C.mono }}>#{t}</span>)}
                    </div>
                  </>
                ) : (
                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                    {e.sources.map((s,i)=><SrcLink key={i} srcKey={s.key} url={s.url} compact/>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TIMELINE ── */}
      {tab==="timeline" && (
        <div style={{ position:"relative", paddingLeft:"20px" }}>
          <div style={{ position:"absolute", left:"8px", top:0, bottom:0, width:"1px", background:`linear-gradient(180deg, transparent, ${C.cyan}44, transparent)` }}/>
          {TIMELINE.map((t,i)=>{
            const c = tlCol[t.type]||C.cyan;
            return (
              <div key={i} style={{ position:"relative", paddingBottom:"14px" }}>
                <div style={{ position:"absolute", left:"-14px", top:"4px", width:"7px", height:"7px", borderRadius:"50%", background:c, border:`2px solid #0a0f1a` }}/>
                <div style={{ fontSize:"8px", color:C.cyan, fontFamily:C.mono, marginBottom:"2px" }}>{t.date}</div>
                <div style={{ fontSize:"10px", color:C.text, lineHeight:"1.5", marginBottom:"4px" }}>{t.event}</div>
                <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                  <span style={{ fontSize:"7px", color:c, background:`${c}15`, padding:"1px 6px", borderRadius:"2px", fontFamily:C.mono }}>{t.type}</span>
                  <a href={t.srcUrl} target="_blank" rel="noreferrer" style={{ fontSize:"8px", color:C.cyan, textDecoration:"none", fontFamily:C.mono }}>⊕ {t.src} ↗</a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── INFLUENCE MAP ── */}
      {tab==="influence" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {INFLUENCES.map((inf,i)=>{
            const c = infCol[inf.type]||C.cyan;
            const isEx = infExpanded===i;
            return (
              <div key={i} onClick={()=>setInfExpanded(isEx?null:i)} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:"3px", padding:"9px 12px", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"10px", color:C.text, minWidth:"140px", fontFamily:C.mono }}>{inf.from}</span>
                  <div style={{ flex:1, height:"2px", background:"rgba(255,255,255,0.05)", position:"relative" }}>
                    <div style={{ width:`${inf.str}%`, height:"100%", background:`linear-gradient(90deg, ${c}44, ${c})` }}/>
                    <div style={{ position:"absolute", right:0, top:"-3px", width:"6px", height:"6px", background:c, clipPath:"polygon(0 50%, 100% 0, 100% 100%)" }}/>
                  </div>
                  <span style={{ fontSize:"10px", color:C.text, minWidth:"130px", textAlign:"right", fontFamily:C.mono }}>{inf.to}</span>
                  <span style={{ fontSize:"8px", color:c, background:`${c}18`, padding:"2px 8px", borderRadius:"2px", minWidth:"70px", textAlign:"center", fontFamily:C.mono }}>{inf.type}</span>
                  <span style={{ fontSize:"9px", color:c, minWidth:"32px", textAlign:"right", fontFamily:C.mono }}>{inf.str}%</span>
                </div>
                {isEx && (
                  <div style={{ marginTop:"8px" }}>
                    <div style={{ fontSize:"9px", color:C.textDim, lineHeight:"1.6", marginBottom:"6px" }}>{inf.note}</div>
                    <SrcLink srcKey={inf.src} url={inf.srcUrl}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── DISINFO ── */}
      {tab==="disinfo" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          <div style={{ display:"flex", gap:"6px" }}>
            <input value={disinfoInp} onChange={e=>setDisinfoInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&checkDisinfo()}
              placeholder="Paste any claim or headline to verify..."
              style={{ flex:1, background:"rgba(0,0,0,0.4)", border:`1px solid ${C.border}`, borderRadius:"3px", padding:"9px 12px", color:C.text, fontFamily:C.mono, fontSize:"11px", outline:"none" }}/>
            <button onClick={checkDisinfo} disabled={disinfoLoad} style={{ background:`${C.cyan}15`, border:`1px solid ${C.cyan}40`, color:C.cyan, padding:"9px 14px", borderRadius:"3px", fontFamily:C.mono, fontSize:"9px", cursor:"pointer" }}>{disinfoLoad?"...":"VERIFY"}</button>
          </div>
          {disinfoRes && (
            <div style={{ background:C.panel, border:`1px solid ${disinfoRes.color}40`, borderLeft:`3px solid ${disinfoRes.color}`, borderRadius:"3px", padding:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                <span style={{ color:disinfoRes.color, fontFamily:C.mono, fontSize:"14px", letterSpacing:"2px" }}>{disinfoRes.verdict}</span>
                <span style={{ color:disinfoRes.color, fontSize:"10px", fontFamily:C.mono }}>CONFIDENCE: {disinfoRes.confidence}%</span>
              </div>
              <div style={{ fontSize:"11px", color:C.text, lineHeight:"1.6", marginBottom:"8px" }}>{disinfoRes.reasoning}</div>
              {disinfoRes.redFlags?.length>0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", marginBottom:"8px" }}>
                  {disinfoRes.redFlags.map((f,i)=><span key={i} style={{ fontSize:"8px", background:`${disinfoRes.color}15`, color:disinfoRes.color, padding:"2px 7px", borderRadius:"2px" }}>⚑ {f}</span>)}
                </div>
              )}
              {disinfoRes.recommendedSources?.length>0 && (
                <div>
                  <div style={{ fontSize:"8px", color:C.textDim, marginBottom:"5px", letterSpacing:"1px", fontFamily:C.mono }}>VERIFY AT:</div>
                  {disinfoRes.recommendedSources.map((s,i)=>{
                    const [name,...rest]=s.split(": "); const url=rest.join(": ");
                    return <a key={i} href={url||"#"} target="_blank" rel="noreferrer" style={{ display:"block", fontSize:"9px", color:C.gold, textDecoration:"none", marginBottom:"2px", fontFamily:C.mono }}>⊕ {name} ↗</a>;
                  })}
                </div>
              )}
            </div>
          )}
          <div style={{ fontSize:"8px", color:C.textDim, letterSpacing:"1px", fontFamily:C.mono, marginTop:"4px" }}>RECENTLY VERIFIED CASES</div>
          {DISINFO_CASES.map((d,i)=>{
            const c=d.verdict==="FABRICATED"||d.verdict==="FALSE"?C.red:d.verdict==="MISLEADING"?C.orange:C.gold;
            return (
              <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderLeft:`2px solid ${c}`, borderRadius:"3px", padding:"8px 12px" }}>
                <div style={{ display:"flex", gap:"8px", alignItems:"flex-start", marginBottom:"4px" }}>
                  <span style={{ fontSize:"8px", color:c, minWidth:"75px", fontFamily:C.mono, flexShrink:0 }}>{d.verdict}</span>
                  <span style={{ fontSize:"9px", color:C.textDim, flex:1 }}>{d.claim}</span>
                  <span style={{ fontSize:"8px", color:C.textDim, fontFamily:C.mono }}>{d.conf}%</span>
                </div>
                <div style={{ fontSize:"9px", color:C.textDim, lineHeight:"1.4", marginBottom:"4px" }}>{d.detail}</div>
                <a href={d.srcUrl} target="_blank" rel="noreferrer" style={{ fontSize:"8px", color:C.cyan, textDecoration:"none", fontFamily:C.mono }}>⊕ {d.src} ↗</a>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SOURCES ── */}
      {tab==="sources" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
          <div style={{ fontSize:"9px", color:C.textDim, lineHeight:"1.6", marginBottom:"6px", fontFamily:C.mono }}>
            All {Object.keys(SOURCES).length} sources used in this dashboard. Credibility scored independently. Click to visit source directly.
          </div>
          {Object.values(SOURCES).map((s,i)=>{
            const cc = s.credibility>=90?C.green:s.credibility>=80?C.gold:C.orange;
            return (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.panel, border:`1px solid ${C.border}`, borderLeft:`2px solid ${cc}`, borderRadius:"3px", padding:"8px 12px", textDecoration:"none" }}>
                <div>
                  <div style={{ fontSize:"10px", color:C.text, marginBottom:"2px" }}>{s.name}</div>
                  <div style={{ fontSize:"8px", color:C.textDim, fontFamily:C.mono }}>{s.type} · Bias: {s.bias}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"13px", color:cc, fontWeight:"bold", fontFamily:C.mono }}>{s.credibility}%</div>
                  <div style={{ fontSize:"8px", color:C.textDim }}>↗ visit</div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── GLOBAL SEARCH ─────────────────────────────────────────────
function GlobalSearch({ onClose }) {
  const [q, setQ]         = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiResp, setAiResp] = useState("");
  const [loading, setLoad]  = useState(false);
  const inputRef            = useRef(null);

  useEffect(()=>{ inputRef.current?.focus(); },[]);

  const corpus = useMemo(()=>{
    const r=[];
    EVENTS.forEach(e=>r.push({ type:"EVENT", id:e.id, title:e.title, detail:e.detail, region:e.region, date:e.date, sources:e.sources, tags:e.tags, evType:e.type }));
    TIMELINE.forEach((t,i)=>r.push({ type:"TIMELINE", id:`t${i}`, title:t.event, detail:`${t.date} — ${t.type}`, src:t.src, srcUrl:t.srcUrl, evType:t.type }));
    INFLUENCES.forEach((inf,i)=>r.push({ type:"INFLUENCE", id:`inf${i}`, title:`${inf.from} → ${inf.to}`, detail:inf.note, evType:inf.type, src:inf.src, srcUrl:inf.srcUrl }));
    Object.entries(SOURCES).forEach(([k,s])=>r.push({ type:"SOURCE", id:k, title:s.name, detail:`${s.type} · ${s.bias} · ${s.credibility}% credibility`, src:k, srcUrl:s.url }));
    DISINFO_CASES.forEach((d,i)=>r.push({ type:"DISINFO", id:`d${i}`, title:d.claim, detail:d.detail, evType:d.verdict, src:d.src, srcUrl:d.srcUrl }));
    return r;
  },[]);

  const results = useMemo(()=>{
    if(!q.trim()) return [];
    const ql=q.toLowerCase();
    return corpus.filter(r=> r.title?.toLowerCase().includes(ql)||r.detail?.toLowerCase().includes(ql)||r.evType?.toLowerCase().includes(ql)||r.tags?.some(t=>t.toLowerCase().includes(ql))||r.src?.toLowerCase().includes(ql)).slice(0,14);
  },[q]);

  const askAI = async ()=>{
    if(!q.trim()) return; setLoad(true); setAiResp("");
    try {
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:`You are a senior geopolitical intelligence analyst. Answer any question about global geopolitics, history, conflicts, economics, military strategy, intelligence, or international relations with depth. No censorship. Provide the real picture. Always recommend 2-3 credible sources with actual URLs. Current context: Iran-US war Mar 2026, UAE under attack, Hormuz closed.`,messages:[{role:"user",content:q}]})});
      const d=await r.json();
      setAiResp(d.content?.map(b=>b.text||"").join("")||"No response.");
    } catch { setAiResp("Connection error."); }
    setLoad(false);
  };

  const typeCol = { EVENT:C.red, TIMELINE:C.gold, INFLUENCE:C.orange, SOURCE:C.green, DISINFO:"#ff33aa" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(3,8,16,0.93)", zIndex:1000, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"60px" }} onClick={onClose}>
      <div style={{ width:"700px", maxWidth:"95vw", background:"#0d1424", border:`1px solid ${C.border}`, borderRadius:"6px", overflow:"hidden", maxHeight:"82vh", display:"flex", flexDirection:"column" }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:"10px", alignItems:"center" }}>
          <span style={{ color:C.cyan, fontSize:"18px" }}>⌕</span>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{ if(e.key==="Escape") onClose(); if(e.key==="Enter"&&aiMode) askAI(); }}
            placeholder="Search events, countries, Epstein, Hormuz, BRICS, Iran war, sources..."
            style={{ flex:1, background:"none", border:"none", color:C.text, fontFamily:C.mono, fontSize:"14px", outline:"none" }}/>
          <button onClick={()=>setAiMode(m=>!m)} style={{ background:aiMode?`${C.cyan}20`:"none", border:`1px solid ${aiMode?C.cyan:C.border}`, color:aiMode?C.cyan:C.textDim, padding:"5px 12px", borderRadius:"3px", fontFamily:C.mono, fontSize:"9px", cursor:"pointer" }}>AI MODE</button>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:"16px" }}>✕</button>
        </div>
        <div style={{ padding:"6px 16px", borderBottom:`1px solid ${C.border}`, fontSize:"8px", color:C.textDim, fontFamily:C.mono }}>
          {aiMode ? "🤖 AI MODE — Press Enter for uncensored analysis on any topic" : `${corpus.length} data points indexed · ${results.length} results`}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 16px" }}>
          {aiMode && (
            <div style={{ marginBottom:"10px" }}>
              <button onClick={askAI} disabled={loading} style={{ background:`${C.cyan}15`, border:`1px solid ${C.cyan}40`, color:C.cyan, padding:"8px 20px", borderRadius:"3px", fontFamily:C.mono, fontSize:"10px", cursor:"pointer", marginBottom:"10px" }}>{loading?"ANALYZING...":"ANALYZE: "+(q||"enter a query above")}</button>
              {aiResp&&<div style={{ background:"rgba(0,0,0,0.3)", border:`1px solid ${C.border}`, borderRadius:"3px", padding:"14px", fontFamily:C.mono, fontSize:"11px", lineHeight:"1.8", color:C.text, whiteSpace:"pre-wrap" }}>{aiResp}</div>}
            </div>
          )}
          {!aiMode && results.map(r=>(
            <div key={r.id} style={{ marginBottom:"6px", background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`, borderLeft:`2px solid ${typeCol[r.type]||C.cyan}`, borderRadius:"3px", padding:"9px 12px" }}>
              <div style={{ display:"flex", gap:"6px", alignItems:"center", marginBottom:"4px" }}>
                <span style={{ fontSize:"7px", color:typeCol[r.type]||C.cyan, background:`${typeCol[r.type]||C.cyan}18`, padding:"1px 6px", borderRadius:"2px", fontFamily:C.mono }}>{r.type}</span>
                {r.evType&&<span style={{ fontSize:"7px", color:C.textDim, fontFamily:C.mono }}>{r.evType}</span>}
                {r.date&&<span style={{ fontSize:"7px", color:C.textDim, fontFamily:C.mono }}>{r.date}</span>}
              </div>
              <div style={{ fontSize:"11px", color:C.text, marginBottom:"4px", lineHeight:"1.4" }}>{r.title}</div>
              <div style={{ fontSize:"9px", color:C.textDim, lineHeight:"1.5", marginBottom:"5px" }}>{r.detail}</div>
              {r.src&&<a href={r.srcUrl} target="_blank" rel="noreferrer" style={{ fontSize:"8px", color:C.gold, textDecoration:"none", fontFamily:C.mono }}>⊕ {r.src} ↗</a>}
              {r.sources&&r.sources.map((s,i)=><SrcLink key={i} srcKey={s.key} url={s.url} compact/>)}
            </div>
          ))}
          {!aiMode&&q&&results.length===0&&(
            <div style={{ color:C.textDim, fontSize:"11px", padding:"16px 0", fontFamily:C.mono }}>No results for "{q}". <button onClick={()=>setAiMode(true)} style={{ background:`${C.cyan}15`, border:`1px solid ${C.border}`, color:C.cyan, padding:"3px 10px", borderRadius:"2px", fontFamily:C.mono, fontSize:"9px", cursor:"pointer", marginLeft:"8px" }}>ASK AI</button></div>
          )}
          {!q&&!aiMode&&(
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {["Iran war","Hormuz","Epstein","UAE","BRICS","Petrodollar","Houthi","Khamenei","India","Ceasefire","Disinfo","Wave 21"].map(s=>(
                <button key={s} onClick={()=>setQ(s)} style={{ background:`${C.cyan}0d`, border:`1px solid ${C.border}`, color:C.textDim, padding:"6px 12px", borderRadius:"3px", fontFamily:C.mono, fontSize:"10px", cursor:"pointer" }}>{s}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding:"6px 16px", borderTop:`1px solid ${C.border}`, fontSize:"7px", color:C.textDim, display:"flex", justifyContent:"space-between", fontFamily:C.mono }}>
          <span>ESC to close · Enter for AI in AI mode</span>
          <span>{Object.keys(SOURCES).length} verified sources · {corpus.length} indexed data points</span>
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────
export default function GEOINTv7() {
  const [selected, setSelected] = useState(null);
  const [searchOpen, setSearch] = useState(false);
  const [blink, setBlink]       = useState(true);

  useEffect(()=>{ const t=setInterval(()=>setBlink(b=>!b),900); return()=>clearInterval(t); },[]);
  useEffect(()=>{
    const h=e=>{ if(e.key==="/"||((e.ctrlKey||e.metaKey)&&e.key==="k")){ e.preventDefault(); setSearch(true); } };
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  },[]);

  return (
    <>
      {/* Load Leaflet */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body, #root { height:100vh; overflow:hidden; background:${C.bg}; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:${C.bg}; } ::-webkit-scrollbar-thumb { background:#1a2540; border-radius:2px; }
        .scrollbar-thin::-webkit-scrollbar { width:4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        input::placeholder { color:${C.textDim}; }
        button:focus { outline:none; }
        a:hover { opacity:0.82; }
        .geoint-tip .leaflet-tooltip { background:transparent !important; border:none !important; box-shadow:none !important; }
      `}</style>

      {searchOpen && <GlobalSearch onClose={()=>setSearch(false)}/>}

      <div style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden", background:C.bg }}>
        <TopHeader onSearch={()=>setSearch(true)} blink={blink}/>
        <Ticker/>

        {/* MAIN GRID — matches screenshot: left 5/12, right 7/12 */}
        <main style={{ flex:1, display:"grid", gridTemplateColumns:"5fr 7fr", overflow:"hidden", minHeight:0 }}>

          {/* LEFT: Map + AI Analysis */}
          <div style={{ borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Map — 45% height */}
            <div style={{ height:"45%", padding:"12px 12px 6px", flexShrink:0 }}>
              <MapView selected={selected} setSelected={setSelected}/>
            </div>
            {/* AI Analysis — remaining */}
            <div style={{ flex:1, padding:"6px 12px 12px", overflowY:"auto" }}>
              <AIAnalysisPanel/>
            </div>
          </div>

          {/* RIGHT: Monitor Panel with all tabs */}
          <div style={{ overflowY:"auto", padding:"12px 16px" }}>
            <MonitorPanel/>
          </div>

        </main>
      </div>
    </>
  );
}
