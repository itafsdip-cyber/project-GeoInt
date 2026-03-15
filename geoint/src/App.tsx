import { useState, useEffect, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   GEOINT v10 — pixel-perfect UI match to reference screenshot
   Left:  Leaflet map (CartoDB dark) fills top 55% · legend inside map
          AI ANALYSIS below with 7 query buttons · italic placeholder
   Right: UAE MONITOR / LIVE CHAT inline tabs · 2×2 stat grid · alert cards
   All existing functionality preserved: trajectories, chat, timeline etc.
   ═══════════════════════════════════════════════════════════════════ */

const C = {
  bg:"#0b0f1a", panel:"#0d1525", border:"#1c2840",
  cyan:"#00e5c8", red:"#ff3b55", orange:"#ff8c00",
  green:"#00e676", gold:"#ffc940", purple:"#9b59b6",
  text:"#c8ddf0", textDim:"#4a6882",
  mono:"'Share Tech Mono',monospace", head:"'Orbitron',monospace",
};

/* ─── DATA ─────────────────────────────────────────────────────── */
const SOURCES = {
  "Reuters":       {name:"Reuters",               url:"https://reuters.com",        credibility:98,bias:"Center",  type:"Wire"},
  "AP":            {name:"Associated Press",       url:"https://apnews.com",         credibility:98,bias:"Center",  type:"Wire"},
  "BBC":           {name:"BBC News",               url:"https://bbc.com/news",       credibility:95,bias:"Center-L",type:"Broadcast"},
  "Al Jazeera":    {name:"Al Jazeera",             url:"https://aljazeera.com",      credibility:88,bias:"Center",  type:"Broadcast"},
  "WSJ":           {name:"Wall Street Journal",    url:"https://wsj.com",            credibility:93,bias:"Center-R",type:"Print"},
  "FT":            {name:"Financial Times",        url:"https://ft.com",             credibility:94,bias:"Center",  type:"Print"},
  "The Guardian":  {name:"The Guardian",           url:"https://theguardian.com",    credibility:86,bias:"Left",    type:"Print"},
  "US DoD":        {name:"US Dept of Defense",     url:"https://defense.gov",        credibility:85,bias:"Official",type:"Official"},
  "CENTCOM":       {name:"US Central Command",     url:"https://centcom.mil",        credibility:85,bias:"Official",type:"Official"},
  "IDF":           {name:"Israel Defense Forces",  url:"https://idf.il",             credibility:80,bias:"Official",type:"Official"},
  "UKMTO":         {name:"UK Maritime Trade Ops",  url:"https://ukmto.org",          credibility:90,bias:"Official",type:"Official"},
  "UAE MoD":       {name:"UAE Ministry of Defence",url:"https://mod.gov.ae",         credibility:88,bias:"Official",type:"Official"},
  "UAE NCEMA":     {name:"UAE NCEMA",              url:"https://ncema.gov.ae",       credibility:88,bias:"Official",type:"Official"},
  "DCAA":          {name:"Dubai Civil Aviation",   url:"https://dcaa.gov.ae",        credibility:92,bias:"Official",type:"Official"},
  "Congress":      {name:"US Congress Record",     url:"https://congress.gov",       credibility:92,bias:"Official",type:"Official"},
  "Haaretz":       {name:"Haaretz",                url:"https://haaretz.com",        credibility:85,bias:"Left",    type:"Print"},
  "MEA India":     {name:"India Min. Ext. Affairs",url:"https://mea.gov.in",         credibility:88,bias:"Official",type:"Official"},
  "Foreign Policy":{name:"Foreign Policy",         url:"https://foreignpolicy.com",  credibility:90,bias:"Center",  type:"Digital"},
  "The Intercept": {name:"The Intercept",          url:"https://theintercept.com",   credibility:78,bias:"Left",    type:"Digital"},
  "Politico":      {name:"Politico",               url:"https://politico.com",       credibility:86,bias:"Center",  type:"Digital"},
  "Axios":         {name:"Axios",                  url:"https://axios.com",          credibility:87,bias:"Center",  type:"Digital"},
  "IRNA":          {name:"IRNA (Iranian state)",   url:"https://irna.ir",            credibility:42,bias:"State",   type:"State"},
};

const ALERTS = [
  {id:1,time:"04:15 UTC",sev:"CRITICAL",loc:"Abu Dhabi",      verified:true, title:"3 ballistic missiles intercepted — Patriot battery engaged",       detail:"Kheybar-Shekan class missiles. All 3 intercepted at high altitude. No ground impact.",source:"UAE Ministry of Defence",sourceUrl:"https://mod.gov.ae",srcKey:"UAE MoD"},
  {id:2,time:"03:42 UTC",sev:"CRITICAL",loc:"Dubai Airspace", verified:true, title:"Drone swarm (8 UAVs) intercepted over Palm Jumeirah",              detail:"Shahed-136 variant drones. 7 of 8 intercepted. 1 impacted sea — no casualties.",source:"UAE NCEMA",sourceUrl:"https://ncema.gov.ae",srcKey:"UAE NCEMA"},
  {id:3,time:"03:10 UTC",sev:"HIGH",    loc:"Hormuz Strait",  verified:true, title:"IRGCN vessel blocking commercial shipping lane",                   detail:"IRGCN frigate IRIS Alvand blocking VHF channel 16. 3 vessels halted.",source:"Reuters",sourceUrl:"https://reuters.com",srcKey:"Reuters"},
  {id:4,time:"02:55 UTC",sev:"MEDIUM",  loc:"Tehran",         verified:false,title:"Iranian state media claims successful strike on US base",          detail:"Unverified claim by IRNA. No confirmation from CENTCOM or regional sources.",source:"IRNA (unverified)",sourceUrl:"https://irna.ir",srcKey:"IRNA"},
  {id:5,time:"02:28 UTC",sev:"HIGH",    loc:"Riyadh",         verified:true, title:"3 Houthi drones intercepted over Riyadh suburbs",                  detail:"Waeid drones. All intercepted. Saudi Patriot system engaged. No casualties.",source:"Saudi SPA",sourceUrl:"https://spa.gov.sa",srcKey:"Reuters"},
  {id:6,time:"01:10 UTC",sev:"HIGH",    loc:"Persian Gulf",   verified:true, title:"USS Gerald Ford carrier group — 2nd carrier now in Gulf",          detail:"Largest US naval presence since 2003. 2 full carrier strike groups.",source:"US DoD",sourceUrl:"https://defense.gov",srcKey:"US DoD"},
  {id:7,time:"00:40 UTC",sev:"CRITICAL",loc:"Tel Aviv",       verified:true, title:"Iron Dome activated — 11 interceptions over greater Tel Aviv",     detail:"Kheybar ballistic missiles Wave 21. Arrow-3 also engaged. 2 impacts in open terrain.",source:"IDF",sourceUrl:"https://idf.il",srcKey:"IDF"},
];

const EVENTS = [
  {id:1, time:"04:15",date:"Mar 10",type:"STRIKE",    sev:"critical",verified:true, region:"Iran/Gulf",   title:"True Promise 4 — Wave 21 launched toward Israel & Gulf",        detail:"Kheybar-Shekan ballistic + Fattah-2 hypersonic. 189+ total projectiles since Feb 28.",sources:[{key:"Reuters",url:"https://reuters.com"},{key:"IDF",url:"https://idf.il"}],tags:["Iran","Israel","UAE","Wave21"]},
  {id:2, time:"03:58",date:"Mar 10",type:"MILITARY",  sev:"high",    verified:true, region:"Persian Gulf", title:"2nd US carrier group enters Persian Gulf",                       detail:"USS Gerald Ford (CVN-78). 2 carrier groups — largest Gulf presence since 2003.",sources:[{key:"US DoD",url:"https://defense.gov"},{key:"Reuters",url:"https://reuters.com"}],tags:["USA","US Navy","Gulf"]},
  {id:3, time:"03:22",date:"Mar 10",type:"MARITIME",  sev:"high",    verified:true, region:"Hormuz",      title:"Strait of Hormuz — tanker blockade, Brent +$4.20",               detail:"3 tankers halted. 20% global oil disrupted. Brent rose $4.20 at London open.",sources:[{key:"UKMTO",url:"https://ukmto.org"},{key:"FT",url:"https://ft.com"}],tags:["Hormuz","Iran","Oil"]},
  {id:4, time:"02:45",date:"Mar 10",type:"STRIKE",    sev:"high",    verified:true, region:"Red Sea",     title:"Houthi ballistic missile intercepted over Red Sea",              detail:"Burkhan-3. US Navy CIWS + SM-6 confirmed. USS Cole safe.",sources:[{key:"CENTCOM",url:"https://centcom.mil"},{key:"AP",url:"https://apnews.com"}],tags:["Houthi","Yemen"]},
  {id:5, time:"02:10",date:"Mar 10",type:"SECURITY",  sev:"medium",  verified:true, region:"UAE",         title:"Dubai Airport — limited operations resumed after overnight halt", detail:"Emirates resumed 12 routes. Flydubai suspended. NOTAM-restricted below FL150.",sources:[{key:"DCAA",url:"https://dcaa.gov.ae"},{key:"Reuters",url:"https://reuters.com"}],tags:["Dubai","Airport"]},
  {id:6, time:"01:30",date:"Mar 10",type:"DIPLOMATIC",sev:"medium",  verified:false,region:"Oman",        title:"Oman back-channel: Iran signals ceasefire interest to US",        detail:"Omani FM: substantial progress. Iran asks sanctions suspension.",sources:[{key:"Reuters",url:"https://reuters.com"},{key:"Foreign Policy",url:"https://foreignpolicy.com"}],tags:["Iran","Ceasefire"]},
  {id:7, time:"00:55",date:"Mar 10",type:"POLITICAL", sev:"critical",verified:true, region:"USA",         title:"Epstein files: DOJ admits omitting key names from release",       detail:"Rep. Massie: DOJ omitted key names. Bondi said 'on desk' — later 'does not exist'. Contempt.",sources:[{key:"Congress",url:"https://congress.gov"},{key:"The Intercept",url:"https://theintercept.com"}],tags:["Epstein","DOJ"]},
  {id:8, time:"00:20",date:"Mar 10",type:"MILITARY",  sev:"medium",  verified:true, region:"USA",         title:"Pentagon emergency munitions order — Day 5 supply pressure",     detail:"Lockheed, Raytheon, Boeing contacted. Emergency Patriot PAC-3 + JASSM-ER production.",sources:[{key:"WSJ",url:"https://wsj.com"},{key:"Axios",url:"https://axios.com"}],tags:["Pentagon","Munitions"]},
];

const TIMELINE = [
  {date:"Nov 2024",    type:"INTELLIGENCE",src:"Haaretz",       srcUrl:"https://haaretz.com",        event:"Mossad AI surveillance of Khamenei begins via hacked traffic cameras"},
  {date:"Feb 11 2026", type:"POLITICAL",   src:"Reuters",       srcUrl:"https://reuters.com",        event:"Netanyahu–Trump White House meeting. Operation Epic Fury timeline agreed"},
  {date:"Feb 25 2026", type:"DIPLOMATIC",  src:"Reuters",       srcUrl:"https://reuters.com",        event:"Iran FM: 'Historic nuclear deal within reach.' Oman talks active"},
  {date:"Feb 25 2026", type:"POLITICAL",   src:"Times of India",srcUrl:"https://timesofindia.com",   event:"Modi visits Jerusalem — 48hrs before strikes. India's neutrality ended"},
  {date:"Feb 28 2026", type:"STRIKE",      src:"BBC",           srcUrl:"https://bbc.com",            event:"US-Israel launch Operation Epic Fury. Khamenei killed in precision strike"},
  {date:"Feb 28 2026", type:"STRIKE",      src:"Reuters",       srcUrl:"https://reuters.com",        event:"Iran launches True Promise 4. 189 missiles + 941 drones across Gulf"},
  {date:"Mar 1 2026",  type:"MARITIME",    src:"FT",            srcUrl:"https://ft.com",             event:"Strait of Hormuz closed. Brent crude surges 22% in 48 hours"},
  {date:"Mar 1 2026",  type:"STRIKE",      src:"AP",            srcUrl:"https://apnews.com",         event:"US Consulate Dubai struck. Airport hit. 4 staff injured"},
  {date:"Mar 4 2026",  type:"MARITIME",    src:"US DoD",        srcUrl:"https://defense.gov",        event:"USS submarine sinks Iranian frigate IRIS Dena in Indian Ocean"},
  {date:"Mar 9 2026",  type:"POLITICAL",   src:"Congress",      srcUrl:"https://congress.gov",       event:"DOJ admits omitting names from Epstein files. Massie contempt move"},
  {date:"Mar 10 2026", type:"STRIKE",      src:"Reuters",       srcUrl:"https://reuters.com",        event:"Wave 21. Fattah-2 hypersonic. Hormuz still blocked. Day 11"},
];

const INFLUENCES = [
  {from:"Iran",              to:"Houthi/Yemen",       type:"PROXY",    str:95,src:"Foreign Policy",srcUrl:"https://foreignpolicy.com",note:"IRGC Quds Force trains, arms, funds Houthi since 2014. Confirmed: UN S/2024/956."},
  {from:"Iran",              to:"Hezbollah",           type:"PROXY",    str:90,src:"Reuters",       srcUrl:"https://reuters.com",      note:"$700M/yr Iranian funding. US Treasury sanctions confirm. IRGC-trained since 1982."},
  {from:"US",                to:"Israel",              type:"ALLIANCE", str:98,src:"US DoD",        srcUrl:"https://defense.gov",      note:"$3.8B/yr military aid. Iron Dome co-developed. F-35. Mutual defence."},
  {from:"US",                to:"UAE/KSA",             type:"SECURITY", str:82,src:"Politico",      srcUrl:"https://politico.com",     note:"THAAD deployed UAE 2023. Patriot in KSA. 5th Fleet Bahrain."},
  {from:"China",             to:"Iran",                type:"ECONOMIC", str:78,src:"FT",            srcUrl:"https://ft.com",           note:"25-yr $400B Cooperation Agreement (2021). Buys 90% of Iranian oil."},
  {from:"Russia",            to:"Iran",                type:"MILITARY", str:72,src:"WSJ",           srcUrl:"https://wsj.com",          note:"Russia bought 1,700+ Shahed drones. S-300 transfer. Joint drone factory 2023."},
  {from:"BlackRock/Vanguard",to:"Defense Contractors", type:"FINANCIAL",str:94,src:"The Guardian",  srcUrl:"https://theguardian.com",  note:"Top-3 shareholder in Raytheon, Lockheed, Boeing, Northrop simultaneously."},
  {from:"Epstein Network",   to:"Policy Makers",       type:"LEVERAGE", str:88,src:"Congress",      srcUrl:"https://congress.gov",     note:"300GB recordings seized by FBI. DOJ release heavily redacted. Key names omitted."},
];

const DISINFO = [
  {claim:"Epstein alive — selfie in Tel Aviv/Italy",verdict:"FABRICATED",conf:99,detail:"AI-generated. Gemini watermark in EXIF. Location does not exist.",src:"Reuters",srcUrl:"https://reuters.com/fact-check"},
  {claim:"Dubai completely evacuated",              verdict:"MISLEADING", conf:92,detail:"Partial evacuation only. Millions remain. No general order issued.",src:"AP",srcUrl:"https://apnews.com/hub/ap-fact-check"},
  {claim:"Iran deployed nuclear weapon",            verdict:"UNVERIFIED", conf:85,detail:"No verification. IAEA: no anomalous activity at Fordow/Natanz.",src:"IAEA",srcUrl:"https://iaea.org/newscenter"},
  {claim:"Israel used chemical weapons Tehran",     verdict:"FALSE",      conf:97,detail:"WHO + MSF zero chemical exposure in 4,200 patients. Single IRGC account origin.",src:"WHO",srcUrl:"https://who.int/emergencies"},
];

const MAP_MARKERS = [
  {id:"IRN",lat:33.0,lng:53.7, label:"IRAN",   type:"hostile",risk:98},
  {id:"ISR",lat:31.5,lng:34.8, label:"ISRAEL", type:"hostile",risk:88},
  {id:"UAE",lat:24.2,lng:54.6, label:"UAE",    type:"threat", risk:82},
  {id:"KSA",lat:24.0,lng:45.0, label:"KSA",   type:"ally",   risk:65},
  {id:"YEM",lat:15.6,lng:48.5, label:"YEMEN",  type:"hostile",risk:90},
  {id:"USA",lat:38.0,lng:-97.0,label:"USA",    type:"ally",   risk:45},
  {id:"RUS",lat:61.5,lng:90.0, label:"RUSSIA", type:"monitor",risk:72},
  {id:"CHN",lat:35.9,lng:104.2,label:"CHINA",  type:"monitor",risk:55},
];

const TRAJECTORIES = [
  {id:"t1", label:"Kheybar-Shekan #1",  type:"BALLISTIC", from:[32.5,53.2],to:[24.4,54.4],color:"#ff3b55",intercepted:true, interceptAt:0.82,speed:0.0028,time:"04:15 UTC",detail:"Intercepted Patriot PAC-3 over Abu Dhabi"},
  {id:"t2", label:"Kheybar-Shekan #2",  type:"BALLISTIC", from:[32.0,52.8],to:[24.2,54.6],color:"#ff3b55",intercepted:true, interceptAt:0.78,speed:0.0025,time:"04:15 UTC",detail:"Intercepted high altitude — Gulf coast"},
  {id:"t3", label:"Kheybar-Shekan #3",  type:"BALLISTIC", from:[33.2,54.1],to:[24.3,54.5],color:"#ff3b55",intercepted:true, interceptAt:0.85,speed:0.003, time:"04:15 UTC",detail:"Intercepted — no ground impact"},
  {id:"t4", label:"Fattah-2 Hypersonic",type:"HYPERSONIC",from:[32.8,51.4],to:[31.8,35.2],color:"#ff6600",intercepted:false,interceptAt:1.0, speed:0.004, time:"04:10 UTC",detail:"Arrow-3 engaged — partial intercept"},
  {id:"t5", label:"Shahed-136 #1",      type:"DRONE",     from:[15.8,48.2],to:[25.1,55.2],color:"#ff8c00",intercepted:true, interceptAt:0.91,speed:0.0008,time:"03:42 UTC",detail:"Intercepted over Palm Jumeirah"},
  {id:"t6", label:"Shahed-136 #2",      type:"DRONE",     from:[15.6,48.8],to:[24.8,55.3],color:"#ff8c00",intercepted:true, interceptAt:0.88,speed:0.0007,time:"03:42 UTC",detail:"Intercepted Dubai airspace"},
  {id:"t7", label:"Shahed-136 #3",      type:"DRONE",     from:[15.4,48.5],to:[25.0,55.1],color:"#ff8c00",intercepted:false,interceptAt:1.0, speed:0.0009,time:"03:42 UTC",detail:"1 impacted sea — no casualties"},
  {id:"t8", label:"Waeid Drone #1",     type:"DRONE",     from:[15.2,44.2],to:[31.2,34.9],color:"#ffc940",intercepted:true, interceptAt:0.75,speed:0.0006,time:"00:40 UTC",detail:"Iron Dome activation Tel Aviv"},
  {id:"t9", label:"Waeid Drone #2",     type:"DRONE",     from:[14.8,44.5],to:[31.5,35.1],color:"#ffc940",intercepted:true, interceptAt:0.72,speed:0.0007,time:"00:40 UTC",detail:"Intercepted over Negev desert"},
  {id:"t10",label:"Kheybar → Tel Aviv", type:"BALLISTIC", from:[34.0,50.0],to:[32.1,34.8],color:"#ff3b55",intercepted:true, interceptAt:0.88,speed:0.003, time:"00:40 UTC",detail:"Arrow-3 + Iron Dome combined"},
  {id:"t11",label:"Houthi → Riyadh",   type:"DRONE",     from:[15.5,44.0],to:[24.7,46.7],color:"#ffc940",intercepted:true, interceptAt:0.80,speed:0.0007,time:"02:28 UTC",detail:"Saudi Patriot system engaged"},
  {id:"t12",label:"Fateh-110 → Dhahran",type:"BALLISTIC", from:[31.5,48.8],to:[26.3,50.2],color:"#ff3b55",intercepted:true, interceptAt:0.90,speed:0.0026,time:"03:55 UTC",detail:"THAAD intercept confirmed"},
];

const TICKER_ITEMS = [
  "stry of Defence",
  "Hormuz Strait: 3 vessels halted by IRGCN",
  "CENTCOM confirms Patriot engagement over Abu Dhabi",
  "Reuters, Al Jazeera, IDF confirm Wave 21",
  "UAE 876 drones intercepted since Feb 28 — Source: UAE Ministry of Defence",
  "Epstein files: DOJ admits omitting key names — Source: US Congress Record",
  "India evacuates 7,000 nationals from UAE — Source: MEA India",
  "Pentagon emergency munitions order Day 5 — Source: WSJ exclusive",
  "Iranian state media claims US base strike — UNVERIFIED — Source: IRNA",
];

const SEED_CHAT = [
  {id:1,user:"GulfAnalyst",  role:"analyst",time:"04:01 UTC",msg:"Wave 21 confirmed. Fattah-2 hypersonic again — Arrow-3 struggling with the saturation volume. This is unprecedented.",verified:true},
  {id:2,user:"MaritimeWatch",role:"analyst",time:"03:55 UTC",msg:"3 vessels blocked at Hormuz per UKMTO. Oil market opens in 90 mins — expect extreme volatility. Brent already +$4.20.",verified:true},
  {id:3,user:"DXBResident",  role:"public", time:"03:40 UTC",msg:"Saw interceptions over Abu Dhabi from my balcony. Sky lit up around 03:30 UTC. Loud booms. Everyone stay indoors.",verified:false},
  {id:4,user:"IntelDesk",    role:"analyst",time:"03:22 UTC",msg:"Oman back-channel confirmed active per 3 independent sources. Iran asking for sanctions suspension + halt to strikes.",verified:true},
  {id:5,user:"Observer_IN",  role:"public", time:"03:10 UTC",msg:"Any update on Indian evacuation flights from Dubai? Family stuck at DXB terminal 3.",verified:false},
  {id:6,user:"GulfAnalyst",  role:"analyst",time:"02:55 UTC",msg:"MEA confirmed 38 flights. 7,000 nationals so far. 10M Indians across Gulf — massive evacuation challenge.",verified:true},
];

/* ─── LIVE SIMULATION ENGINE ───────────────────────────────────── */
const LIVE_ALERTS = [
  {sev:"CRITICAL",loc:"Dubai Airspace",   verified:true, title:"Drone swarm detected — 6 UAVs inbound from north",             detail:"Radar contact at 40km. SHORAD systems activated. Intercept in progress.",          source:"UAE NCEMA",    sourceUrl:"https://ncema.gov.ae",  srcKey:"UAE NCEMA"},
  {sev:"HIGH",    loc:"Hormuz Strait",    verified:true, title:"4th tanker halted by IRGCN in Hormuz — Lloyd's issues warning", detail:"MV Pacific Teal, Liberian flag. IRGCN frigate 200m alongside. Engine stopped.",    source:"UKMTO",        sourceUrl:"https://ukmto.org",     srcKey:"UKMTO"},
  {sev:"CRITICAL",loc:"Abu Dhabi",        verified:true, title:"Patriot PAC-3 intercept — 2 ballistic missiles destroyed",      detail:"Wave 22 confirmed. Missiles launched from western Iran. Debris over Gulf.",        source:"UAE Ministry of Defence", sourceUrl:"https://mod.gov.ae", srcKey:"UAE MoD"},
  {sev:"HIGH",    loc:"Tel Aviv",         verified:true, title:"Arrow-3 activated — hypersonic threat detected inbound",        detail:"Fattah-2 class. Arrow-3 engaged at exo-atmospheric altitude. Outcome TBC.",       source:"IDF",          sourceUrl:"https://idf.il",        srcKey:"IDF"},
  {sev:"MEDIUM",  loc:"Riyadh",          verified:false,title:"Unconfirmed: explosion heard near ARAMCO facility",             detail:"Social media reports only. Saudi SPA has not confirmed. Monitoring.",            source:"IRNA (unverified)", sourceUrl:"https://irna.ir",   srcKey:"IRNA"},
  {sev:"HIGH",    loc:"Persian Gulf",     verified:true, title:"USS Dwight Eisenhower repositions — now 60nm from Iran coast",  detail:"Carrier strike group move confirmed by Pentagon. F/A-18s on combat air patrol.", source:"US DoD",        sourceUrl:"https://defense.gov",   srcKey:"US DoD"},
  {sev:"CRITICAL",loc:"Hormuz Strait",   verified:true, title:"Hormuz fully blocked — Iran lays additional mines",             detail:"USN EOD teams deployed. 23 vessels queued. Oil futures +8% in after-hours.",     source:"CENTCOM",      sourceUrl:"https://centcom.mil",   srcKey:"CENTCOM"},
  {sev:"HIGH",    loc:"Beirut",          verified:true, title:"Hezbollah fires 40 rockets into northern Israel",              detail:"Iron Dome intercepts 34. 6 impacted open areas Galilee. No casualties reported.", source:"IDF",          sourceUrl:"https://idf.il",        srcKey:"IDF"},
  {sev:"MEDIUM",  loc:"Oman",            verified:true, title:"Oman FM departs Muscat for Washington — ceasefire talks",      detail:"Third party mediation confirmed. Iran envoy also en route. Swiss channel active.",source:"Reuters",      sourceUrl:"https://reuters.com",   srcKey:"Reuters"},
  {sev:"HIGH",    loc:"Red Sea",         verified:true, title:"Houthi anti-ship missile fired at US destroyer",               detail:"USS Gravely activated CIWS. SM-2 intercept confirmed. No damage.",               source:"CENTCOM",      sourceUrl:"https://centcom.mil",   srcKey:"CENTCOM"},
  {sev:"CRITICAL",loc:"Tehran",          verified:false,title:"Reports of secondary explosions inside Iran — source unclear", detail:"Unverified. 3 Telegram channels reporting. No satellite confirmation yet.",       source:"IRNA (unverified)", sourceUrl:"https://irna.ir",   srcKey:"IRNA"},
  {sev:"HIGH",    loc:"Bahrain",         verified:true, title:"5th Fleet on highest alert — all leave cancelled",             detail:"USS Ford + USS Eisenhower both in Gulf. 14,000 sailors now in theatre.",          source:"US DoD",        sourceUrl:"https://defense.gov",   srcKey:"US DoD"},
];

const LIVE_CHAT_MSGS = [
  {user:"GulfAnalyst",  role:"analyst",msg:"Wave 22 just confirmed by UAE MoD. Patriot caught both. The saturation strategy isn't working as well as Iran hoped."},
  {user:"MaritimeWatch",role:"analyst",msg:"4th tanker now blocked at Hormuz. Lloyd's war risk premium just hit 8% — that's the highest since the Iran-Iraq war in 1984."},
  {user:"IntelDesk",    role:"analyst",msg:"Oman back-channel is real. I'm seeing 3 independent confirmations. Iran wants a pause, not a surrender. Watch this space."},
  {user:"DXBResident",  role:"public", msg:"Airport is operating but Emirates just cancelled 6 more routes. Dubai Marina is quiet — half the restaurants closed."},
  {user:"Observer_IN",  role:"public", msg:"MEA confirmed another 2,000 Indians evacuated today. Total now 9,000. Air India doing incredible work under pressure."},
  {user:"GulfAnalyst",  role:"analyst",msg:"The Eisenhower repositioning is significant — 60nm from Iranian coast is within F/A-18 strike range without refueling."},
  {user:"MaritimeWatch",role:"analyst",msg:"Oil futures now +8% after-hours. Brent touching $142. If Hormuz stays blocked another week we're looking at $160+."},
  {user:"IntelDesk",    role:"analyst",msg:"Hezbollah opening a northern front adds another dimension. IDF now fighting on 3 axes — Gaza, Lebanon, and air defense."},
  {user:"DXBResident",  role:"public", msg:"Power went out in JLT for 20 minutes earlier. DEWA says it was routine maintenance. Nobody believed them."},
  {user:"Observer_IN",  role:"public", msg:"My cousin in Abu Dhabi says they can hear the intercept explosions at night. Distant thuds. Sky lights up briefly then silence."},
  {user:"GulfAnalyst",  role:"analyst",msg:"IRGC strategy is clear now — bleed the Gulf states economically while keeping the US tied down in defensive posture."},
  {user:"MaritimeWatch",role:"analyst",msg:"UKMTO just issued 3rd warning this hour. Commercial insurers are pulling out. This is becoming uninsurable maritime space."},
];

const LIVE_TICKER = [
  "Wave 22 launched — UAE Patriot intercepts confirmed — Source: UAE MoD",
  "Brent crude hits $142 — Hormuz blockade Day 14 — Source: FT Markets",
  "Oman FM en route Washington — ceasefire mediation — Source: Reuters",
  "USS Eisenhower repositions 60nm from Iran coast — Source: US DoD",
  "Hezbollah fires 40 rockets into northern Israel — Source: IDF",
  "Lloyd's war risk premium hits 8% — highest since 1984 — Source: FT",
  "India total evacuees now 9,200 — Air India emergency flights — Source: MEA",
  "Arrow-3 activated — hypersonic threat over Mediterranean — Source: IDF",
  "4th tanker blocked at Hormuz — Source: UKMTO Alert #2026-HOR-23",
  "Pentagon: 14,000 sailors now in Gulf theatre — Source: US DoD",
];

let liveIdCounter = 100;
const getLiveId = () => ++liveIdCounter;
const nowUTC = () => new Date().toUTCString().slice(17,22) + " UTC";

/* ─── HELPERS ──────────────────────────────────────────────────── */
const sevColor = s => s==="CRITICAL"||s==="critical"?C.red:s==="HIGH"||s==="high"?C.orange:C.gold;
const typeC    = {STRIKE:C.red,MILITARY:C.orange,DIPLOMATIC:C.green,MARITIME:C.cyan,POLITICAL:C.gold,INTELLIGENCE:C.orange,HUMANITARIAN:C.purple,SECURITY:"#6b7fa3",PROXY:C.orange,ALLIANCE:C.green,FINANCIAL:C.gold,LEVERAGE:C.red,ECONOMIC:C.cyan};
const nodeCol  = t => ({hostile:C.red,threat:C.orange,ally:C.cyan,monitor:C.gold}[t]||C.gold);

function SrcLink({srcKey,url,compact}){
  const s=SOURCES[srcKey]||{name:srcKey,credibility:70,url:"#",type:"Unknown",bias:"Unknown"};
  const cc=s.credibility>=90?C.green:s.credibility>=70?C.gold:s.credibility>=50?C.orange:C.red;
  if(compact) return(
    <a href={url||s.url} target="_blank" rel="noreferrer"
       style={{display:"inline-flex",alignItems:"center",gap:3,background:`${cc}18`,border:`1px solid ${cc}35`,borderRadius:2,padding:"1px 7px",textDecoration:"none",marginRight:4}}>
      <span style={{fontSize:9,color:cc,fontFamily:C.mono}}>⊕ {srcKey} ↗</span>
    </a>
  );
  return(
    <a href={url||s.url} target="_blank" rel="noreferrer"
       style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.2)",border:`1px solid ${C.border}`,borderLeft:`2px solid ${cc}`,borderRadius:3,padding:"7px 10px",textDecoration:"none",marginBottom:4}}>
      <div><div style={{fontSize:10,color:C.text,marginBottom:2}}>⊕ {s.name}</div><div style={{fontSize:8,color:C.textDim}}>{s.type} · Bias: {s.bias}</div></div>
      <div style={{textAlign:"right"}}><div style={{fontSize:12,color:cc,fontWeight:"bold",fontFamily:C.mono}}>{s.credibility}%</div><div style={{fontSize:8,color:C.textDim}}>cred ↗</div></div>
    </a>
  );
}

/* ─── TICKER ───────────────────────────────────────────────────── */
function Ticker({items}){
  const [pos,setPos]=useState(0);
  const ref=useRef(null);
  useEffect(()=>{
    const t=setInterval(()=>setPos(p=>ref.current&&Math.abs(p)>=ref.current.scrollWidth/2?0:p-0.6),16);
    return()=>clearInterval(t);
  },[]);
  const all=[...items,...items];
  return(
    <div style={{background:"#070b15",borderBottom:`1px solid ${C.border}`,height:30,display:"flex",alignItems:"center",overflow:"hidden",flexShrink:0}}>
      <div style={{background:C.red,color:"#fff",padding:"0 12px",height:"100%",display:"flex",alignItems:"center",fontSize:10,fontWeight:700,letterSpacing:2,flexShrink:0,fontFamily:C.mono}}>● LIVE</div>
      <div style={{overflow:"hidden",flex:1}}>
        <div ref={ref} style={{display:"flex",transform:`translateX(${pos}px)`,whiteSpace:"nowrap"}}>
          {all.map((item,i)=>(
            <span key={i} style={{fontFamily:C.mono,fontSize:10,color:C.textDim,padding:"0 32px"}}>● {item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MAP VIEW — Leaflet + Canvas trajectory overlay ───────────── */
function MapView({selected,setSelected}){
  const mapRef    = useRef(null);
  const leafRef   = useRef(null);
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const progRef   = useRef({});
  const [selTraj,setSelTraj] = useState(null);
  const showRef   = useRef(true);
  const filterRef = useRef("ALL");
  const [,forceRender] = useState(0);

  useEffect(()=>{
    if(leafRef.current) return;
    const init=()=>{
      const L=window.L; if(!L||!mapRef.current) return;

      /* map */
      const map=L.map(mapRef.current,{center:[28,46],zoom:4,zoomControl:false,attributionControl:false});
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:12,minZoom:2}).addTo(map);
      L.control.zoom({position:"bottomright"}).addTo(map);

      /* country markers */
      const cols={hostile:C.red,threat:C.orange,ally:C.cyan,monitor:C.gold};
      MAP_MARKERS.forEach(m=>{
        const col=cols[m.type]||C.gold;
        const icon=L.divIcon({className:"",iconSize:[14,14],iconAnchor:[7,7],
          html:`<div style="width:14px;height:14px;border-radius:50%;background:${col};box-shadow:0 0 0 3px ${col}40,0 0 12px ${col}99;cursor:pointer;"></div>`});
        L.marker([m.lat,m.lng],{icon})
          .addTo(map)
          .bindTooltip(
            `<div style="background:#0d1525;border:1px solid ${col}90;color:${col};font-family:'Share Tech Mono',monospace;font-size:10px;padding:5px 10px;border-radius:3px;white-space:nowrap;">
               <strong>${m.label}</strong><br/>
               <span style="color:#4a6882;font-size:8px;">TYPE: ${m.type.toUpperCase()} · RISK ${m.risk}%</span>
             </div>`,
            {permanent:false,direction:"top",offset:[0,-10]})
          .on("click",()=>setSelected(s=>s?.id===m.id?null:m));
      });

      /* canvas overlay for trajectories */
      const canvas=canvasRef.current;
      const syncCanvas=()=>{
        if(!mapRef.current||!canvas) return;
        canvas.width=mapRef.current.offsetWidth;
        canvas.height=mapRef.current.offsetHeight;
      };
      syncCanvas();
      const ro=new ResizeObserver(syncCanvas); ro.observe(mapRef.current);

      const toXY=([lat,lng])=>{const pt=map.latLngToContainerPoint(L.latLng(lat,lng));return[pt.x,pt.y];};

      const drawArc=(ctx,tr,progress)=>{
        const{from,to,color,intercepted,interceptAt,type}=tr;
        const drawTo=Math.min(progress,intercepted?interceptAt:1.0);
        const steps=60;
        ctx.save();
        ctx.lineWidth  = type==="HYPERSONIC"?2.5:type==="BALLISTIC"?2:1.4;
        ctx.strokeStyle= color;
        ctx.shadowColor= color;
        ctx.shadowBlur = type==="HYPERSONIC"?10:7;
        ctx.setLineDash(type==="DRONE"?[3,4]:[]);
        ctx.beginPath();
        for(let i=0;i<=steps;i++){
          const t=(i/steps)*drawTo;
          const arc = type==="DRONE"?0:Math.sin(Math.PI*t)*0.06;
          const lat=(from[0]+(to[0]-from[0])*t)+(to[0]-from[0])*arc*0.25;
          const lng=(from[1]+(to[1]-from[1])*t);
          const[x,y]=toXY([lat,lng]);
          i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.stroke();

        /* moving head */
        if(progress>0&&progress<=(intercepted?interceptAt:1.0)){
          const arc2=type==="DRONE"?0:Math.sin(Math.PI*drawTo)*0.06;
          const lat2=(from[0]+(to[0]-from[0])*drawTo)+(to[0]-from[0])*arc2*0.25;
          const lng2=(from[1]+(to[1]-from[1])*drawTo);
          const[hx,hy]=toXY([lat2,lng2]);
          ctx.fillStyle=color; ctx.shadowBlur=18;
          ctx.beginPath();ctx.arc(hx,hy,type==="HYPERSONIC"?5:type==="BALLISTIC"?4:3,0,Math.PI*2);ctx.fill();
          ctx.globalAlpha=0.25;ctx.beginPath();ctx.arc(hx,hy,8,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
        }

        /* explosion burst */
        if(intercepted&&progress>interceptAt){
          const[ex,ey]=toXY([from[0]+(to[0]-from[0])*interceptAt,from[1]+(to[1]-from[1])*interceptAt]);
          const phase=Math.min((progress-interceptAt)*3,1);
          const r=phase*16;
          ctx.globalAlpha=Math.max(0,1-phase*1.4);
          ctx.fillStyle="#ffee44";ctx.shadowColor="#ffaa00";ctx.shadowBlur=22;
          ctx.beginPath();ctx.arc(ex,ey,r*0.4,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=color;ctx.beginPath();ctx.arc(ex,ey,r,0,Math.PI*2);ctx.fill();
          ctx.globalAlpha=1;
        }
        ctx.restore();
      };

      const animate=()=>{
        const ctx=canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width,canvas.height);
        if(showRef.current){
          TRAJECTORIES.forEach(tr=>{
            if(filterRef.current!=="ALL"&&tr.type!==filterRef.current) return;
            if(!progRef.current[tr.id]) progRef.current[tr.id]=Math.random()*0.5;
            progRef.current[tr.id]+=tr.speed;
            if(progRef.current[tr.id]>1.6) progRef.current[tr.id]=0;
            drawArc(ctx,tr,progRef.current[tr.id]);
          });
        }
        rafRef.current=requestAnimationFrame(animate);
      };
      animate();
      leafRef.current=map;
    };

    /* CDN inject */
    if(!document.getElementById("lf-css")){const l=document.createElement("link");l.id="lf-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}
    if(!document.getElementById("lf-style")){
      const s=document.createElement("style");s.id="lf-style";
      s.textContent=`
        .leaflet-control-zoom{border:1px solid #1c2840!important;background:#0d1525!important;border-radius:3px!important;}
        .leaflet-control-zoom a{background:#0d1525!important;color:#00e5c8!important;border-color:#1c2840!important;font-size:16px!important;line-height:26px!important;width:26px!important;height:26px!important;}
        .leaflet-control-zoom a:hover{background:#1c2840!important;}
        .leaflet-control-attribution{display:none!important;}
        .leaflet-tooltip{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;}
      `;
      document.head.appendChild(s);
    }
    if(window.L) init();
    else if(!document.getElementById("lf-js")){
      const s=document.createElement("script");s.id="lf-js";s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload=()=>{s.dataset.done="1";init();};document.head.appendChild(s);
    } else {
      const el=document.getElementById("lf-js");
      if(el.dataset.done==="1") init(); else el.addEventListener("load",init);
    }
    return()=>{
      if(rafRef.current) cancelAnimationFrame(rafRef.current);
      if(leafRef.current){leafRef.current.remove();leafRef.current=null;}
    };
  },[]);

  /* legend items — exactly matching screenshot */
  const legend=[["hostile",C.red,"HOSTILE"],["threat",C.orange,"ACTIVE THREAT"],["ally",C.cyan,"ALLIED"],["monitor",C.gold,"MONITOR"]];

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",position:"relative"}}>
      {/* The map itself, fills the container */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <div ref={mapRef} style={{width:"100%",height:"100%"}}/>
        <canvas ref={canvasRef} style={{position:"absolute",top:0,left:0,pointerEvents:"none",zIndex:500}}/>

        {/* Legend — top-left inside map, exactly as in screenshot */}
        <div style={{position:"absolute",top:10,left:10,zIndex:600,background:"rgba(10,14,22,0.82)",border:`1px solid ${C.border}`,borderRadius:3,padding:"8px 12px",backdropFilter:"blur(4px)"}}>
          {legend.map(([t,c,l])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,lastChild:{marginBottom:0}}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:c,flexShrink:0}}/>
              <span style={{fontSize:9,color:C.textDim,fontFamily:C.mono,letterSpacing:0.5}}>{l}</span>
            </div>
          ))}
        </div>

        {/* Trajectory overlay list — small, top right */}
        {showRef.current&&(
          <div style={{position:"absolute",top:8,right:8,zIndex:600,display:"flex",flexDirection:"column",gap:2}}>
            {TRAJECTORIES.filter(t=>filterRef.current==="ALL"||t.type===filterRef.current).slice(0,5).map(tr=>(
              <div key={tr.id} onClick={()=>setSelTraj(s=>s?.id===tr.id?null:tr)}
                style={{background:"rgba(6,10,20,0.88)",border:`1px solid ${tr.intercepted?C.green:tr.color}44`,borderLeft:`2px solid ${tr.intercepted?C.green:tr.color}`,borderRadius:2,padding:"2px 6px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:tr.color,flexShrink:0}}/>
                <span style={{fontSize:8,color:C.text,fontFamily:C.mono}}>{tr.label}</span>
                <span style={{fontSize:7,color:tr.intercepted?C.green:C.red,fontFamily:C.mono,marginLeft:"auto"}}>{tr.intercepted?"✓":"●"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Selected trajectory detail */}
        {selTraj&&(
          <div style={{position:"absolute",bottom:8,left:8,right:8,zIndex:700,background:"rgba(6,10,20,0.95)",border:`1px solid ${selTraj.color}55`,borderLeft:`3px solid ${selTraj.color}`,borderRadius:3,padding:"8px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{color:selTraj.color,fontFamily:C.mono,fontSize:10,fontWeight:"bold"}}>{selTraj.label}</span>
              <button onClick={()=>setSelTraj(null)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:11}}>✕</button>
            </div>
            <div style={{display:"flex",gap:12,fontSize:8,fontFamily:C.mono}}>
              <span><span style={{color:C.textDim}}>TYPE: </span><span style={{color:selTraj.color}}>{selTraj.type}</span></span>
              <span><span style={{color:C.textDim}}>STATUS: </span><span style={{color:selTraj.intercepted?C.green:C.red}}>{selTraj.intercepted?"INTERCEPTED":"ACTIVE"}</span></span>
            </div>
            <div style={{fontSize:9,color:C.textDim,marginTop:4}}>{selTraj.detail}</div>
          </div>
        )}
      </div>

      {/* Country detail — below map, only when a marker is selected */}
      {selected&&(
        <div style={{background:C.panel,border:`1px solid ${nodeCol(selected.type)}44`,borderTop:`1px solid ${C.border}`,padding:"6px 12px",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <span style={{color:C.cyan,fontFamily:C.mono,fontSize:11,fontWeight:"bold",letterSpacing:2}}>{selected.label}</span>
            <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:12}}>✕</button>
          </div>
          <div style={{display:"flex",gap:14,fontSize:8,fontFamily:C.mono}}>
            <span><span style={{color:C.textDim}}>STATUS: </span><span style={{color:nodeCol(selected.type)}}>{selected.type.toUpperCase()}</span></span>
            <span><span style={{color:C.textDim}}>RISK: </span><span style={{color:sevColor(selected.risk>=90?"CRITICAL":selected.risk>=70?"HIGH":"MEDIUM")}}>{selected.risk}%</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── AI PANEL ─────────────────────────────────────────────────── */
function AIPanel(){
  const [query,setQuery]=useState("");
  const [resp,setResp]=useState("");
  const [loading,setLoad]=useState(false);
  const [hist,setHist]=useState([]);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[resp]);

  const QUERIES=[
    "Why is UAE being targeted?",
    "Connect Epstein to the Iran war",
    "Who profits from this conflict?",
    "Will there be a ceasefire?",
    "How does Hormuz closure affect India?",
    "What is True Promise 4?",
    "Explain the petrodollar and its collapse",
  ];

  const ask=async(q)=>{
    if(!q.trim()) return;
    setLoad(true);setResp("");
    const h=[...hist,{role:"user",content:q}];
    try{
      const r=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:600,
          system:`You are the senior intelligence analyst at GEOINT — open source intelligence with ZERO censorship. Date: March 12 2026. Iran-US war active since Feb 28. UAE under attack Wave 21. Hormuz closed. Epstein files suppressed.
Rules: No topic off-limits. Follow the money. Name names. Connect dots. No diplomatic softening.
Format: Sharp intel report. Use → for chains, ■ for findings. Max 280 words.
Always end: RECOMMENDED SOURCES: [2–3 real URLs]`,messages:h})});
      const d=await r.json();
      const t=d.content?.map(b=>b.text||"").join("")||"Analysis unavailable.";
      setResp(t);setHist([...h,{role:"assistant",content:t}]);
    }catch{setResp("Connection error. Check API key.");}
    setLoad(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:5,height:"100%"}}>
      {/* "AI ANALYSIS" label — matches screenshot exactly */}
      <div style={{fontSize:11,color:C.cyan,letterSpacing:3,fontFamily:C.mono,fontWeight:"bold",flexShrink:0,paddingTop:2}}>AI ANALYSIS</div>

      {/* 7 query buttons — full width, minimal border, exactly as screenshot */}
      <div style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
        {QUERIES.map((q,i)=>(
          <button key={i} onClick={()=>{setQuery(q);ask(q);}}
            style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.border}`,color:C.text,padding:"7px 14px",borderRadius:3,fontFamily:C.mono,fontSize:10.5,cursor:"pointer",textAlign:"left",transition:"all 0.12s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyan;e.currentTarget.style.color=C.cyan;e.currentTarget.style.background=`${C.cyan}0a`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text;e.currentTarget.style.background="rgba(255,255,255,0.02)";}}>
            {q}
          </button>
        ))}
      </div>

      {/* Response area */}
      {(resp||loading)&&(
        <div style={{flex:1,background:"rgba(0,0,0,0.25)",border:`1px solid ${C.border}`,borderRadius:3,padding:"10px 12px",overflowY:"auto",fontFamily:C.mono,fontSize:10.5,lineHeight:"1.85",color:C.text,minHeight:0}}>
          {loading?<span style={{color:C.cyan}}>● ANALYZING — NO RESTRICTIONS...</span>:<span style={{whiteSpace:"pre-wrap"}}>{resp}</span>}
          <div ref={endRef}/>
        </div>
      )}

      {/* Placeholder text — italic, dim, exactly as screenshot */}
      {!resp&&!loading&&(
        <div style={{fontSize:10,color:C.textDim,fontStyle:"italic",fontFamily:C.mono,lineHeight:1.8,marginTop:4}}>
          No topic is off-limits. Ask about anything — war, intelligence, economics, corruption, energy, geopolitics.
          <br/><br/>
          Every response includes recommended sources for independent verification.
        </div>
      )}

      {/* History controls */}
      {hist.length>0&&(
        <div style={{display:"flex",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontSize:8,color:C.textDim,fontFamily:C.mono}}>{Math.floor(hist.length/2)} EXCHANGES</span>
          <button onClick={()=>{setHist([]);setResp("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.textDim,padding:"2px 8px",fontSize:8,fontFamily:C.mono,cursor:"pointer",borderRadius:2}}>CLEAR</button>
        </div>
      )}

      {/* Input row */}
      <div style={{display:"flex",gap:5,flexShrink:0}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(query)}
          placeholder="Ask anything — no limits..."
          style={{flex:1,background:"rgba(0,0,0,0.35)",border:`1px solid ${C.border}`,borderRadius:3,padding:"7px 11px",color:C.text,fontFamily:C.mono,fontSize:10.5,outline:"none"}}/>
        <button onClick={()=>ask(query)} disabled={loading}
          style={{background:`${C.cyan}15`,border:`1px solid ${C.cyan}44`,color:C.cyan,padding:"7px 12px",borderRadius:3,fontFamily:C.mono,fontSize:9,cursor:"pointer",letterSpacing:1}}>
          {loading?"...":"ANALYZE"}
        </button>
      </div>
    </div>
  );
}

/* ─── CHAT ROOM ────────────────────────────────────────────────── */
function ChatRoom(){
  const [msgs,setMsgs]=useState(SEED_CHAT);
  const [inp,setInp]=useState("");
  const [name,setName]=useState("Observer");
  const [aiOn,setAiOn]=useState(false);
  const [aiLoad,setAiLoad]=useState(false);
  const endRef=useRef(null);
  const nid=useRef(SEED_CHAT.length+1);
  const usedMsgs=useRef(new Set());
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  /* Auto incoming messages every 15-35 seconds */
  useEffect(()=>{
    const timer=setInterval(()=>{
      const unused=LIVE_CHAT_MSGS.filter((_,i)=>!usedMsgs.current.has(i));
      if(unused.length===0){usedMsgs.current.clear();return;}
      const idx=LIVE_CHAT_MSGS.indexOf(unused[Math.floor(Math.random()*unused.length)]);
      usedMsgs.current.add(idx);
      const m=LIVE_CHAT_MSGS[idx];
      setMsgs(prev=>[...prev,{id:nid.current++,user:m.user,role:m.role,time:nowUTC(),msg:m.msg,verified:m.role==="analyst"}]);
    }, 18000+Math.random()*17000);
    return()=>clearInterval(timer);
  },[]);

  const send=async()=>{
    if(!inp.trim()) return;
    const q=inp;
    setMsgs(m=>[...m,{id:nid.current++,user:name||"Observer",role:"public",time:new Date().toUTCString().slice(17,22)+" UTC",msg:q,verified:false}]);
    setInp("");
    if(aiOn){
      setAiLoad(true);
      try{
        const r=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:250,
            system:"You are GEOINT-AI in a live public chat room. Iran-US war March 2026. UAE under attack. Hormuz closed. Give sharp factual responses in 2-3 sentences. No censorship. Include source when helpful.",
            messages:[{role:"user",content:q}]})});
        const d=await r.json();
        const t=d.content?.map(b=>b.text||"").join("")||"";
        if(t) setMsgs(m=>[...m,{id:nid.current++,user:"GEOINT-AI",role:"ai",time:new Date().toUTCString().slice(17,22)+" UTC",msg:t,verified:true}]);
      }catch{}
      setAiLoad(false);
    }
  };

  const ROLE={analyst:{col:C.cyan,label:"ANALYST"},public:{col:C.textDim,label:"PUBLIC"},ai:{col:C.green,label:"AI"}};
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",gap:5}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/>
          <span style={{fontSize:9,color:C.green,fontFamily:C.mono}}>LIVE · {msgs.length} MESSAGES</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:8,color:C.textDim,fontFamily:C.mono}}>AI ASSIST:</span>
          <button onClick={()=>setAiOn(a=>!a)}
            style={{background:aiOn?`${C.cyan}1a`:"none",border:`1px solid ${aiOn?C.cyan:C.border}`,color:aiOn?C.cyan:C.textDim,padding:"2px 9px",borderRadius:2,fontFamily:C.mono,fontSize:8,cursor:"pointer"}}>
            {aiOn?"ON ●":"OFF"}
          </button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:4,minHeight:0}}>
        {msgs.map(m=>{
          const rs=ROLE[m.role]||ROLE.public;
          return(
            <div key={m.id} style={{background:m.role==="ai"?`${C.green}0a`:m.role==="analyst"?`${C.cyan}07`:"rgba(255,255,255,0.02)",border:`1px solid ${C.border}`,borderLeft:`2px solid ${rs.col}`,borderRadius:3,padding:"6px 10px"}}>
              <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                <span style={{color:rs.col,fontSize:9,fontFamily:C.mono,fontWeight:"bold"}}>{m.user}</span>
                <span style={{fontSize:7,color:rs.col,background:`${rs.col}1a`,padding:"1px 4px",borderRadius:2,fontFamily:C.mono}}>{rs.label}</span>
                {m.verified&&<span style={{fontSize:7,color:C.green}}>✓</span>}
                <span style={{color:C.textDim,fontSize:8,marginLeft:"auto",fontFamily:C.mono}}>{m.time}</span>
              </div>
              <div style={{fontSize:10.5,color:C.text,lineHeight:"1.55"}}>{m.msg}</div>
            </div>
          );
        })}
        {aiLoad&&<div style={{border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.green}`,borderRadius:3,padding:"6px 10px"}}><span style={{fontSize:9,color:C.green,fontFamily:C.mono}}>GEOINT-AI analyzing...</span></div>}
        <div ref={endRef}/>
      </div>
      {aiOn&&<div style={{fontSize:8,color:C.green,fontFamily:C.mono,padding:"3px 8px",background:`${C.green}0a`,border:`1px solid ${C.green}22`,borderRadius:2,flexShrink:0}}>✓ AI ASSIST ACTIVE</div>}
      <div style={{display:"flex",gap:5,flexShrink:0}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"
          style={{width:80,background:"rgba(0,0,0,0.35)",border:`1px solid ${C.border}`,borderRadius:3,padding:"7px 9px",color:C.cyan,fontFamily:C.mono,fontSize:10,outline:"none"}}/>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Share intel, ask questions..."
          style={{flex:1,background:"rgba(0,0,0,0.35)",border:`1px solid ${C.border}`,borderRadius:3,padding:"7px 11px",color:C.text,fontFamily:C.mono,fontSize:10.5,outline:"none"}}/>
        <button onClick={send}
          style={{background:`${C.cyan}15`,border:`1px solid ${C.cyan}44`,color:C.cyan,padding:"7px 12px",borderRadius:3,fontFamily:C.mono,fontSize:9,cursor:"pointer"}}>SEND</button>
      </div>
    </div>
  );
}

/* ─── RIGHT PANEL ──────────────────────────────────────────────── */
function RightPanel(){
  const [tab,setTab]=useState("monitor");
  const [evFilter,setEvFilter]=useState("ALL");
  const [expanded,setExpanded]=useState(null);
  const [infExp,setInfExp]=useState(null);
  const [dInp,setDInp]=useState("");
  const [dRes,setDRes]=useState(null);
  const [dLoad,setDLoad]=useState(false);

  /* ── LIVE STATE ── */
  const [liveAlerts,setLiveAlerts]   = useState([...ALERTS]);
  const [missiles,setMissiles]       = useState(189);
  const [drones,setDrones]           = useState(876);
  const [sites,setSites]             = useState(5);
  const [wave,setWave]               = useState(21);
  const [liveTicker,setLiveTicker]   = useState([...TICKER_ITEMS]);
  const [newAlert,setNewAlert]       = useState(null); // flashing new alert
  const usedAlerts  = useRef(new Set());
  const usedTickers = useRef(new Set());

  useEffect(()=>{
    // New alert every 25–40 seconds
    const alertTimer=setInterval(()=>{
      const unused=LIVE_ALERTS.filter((_,i)=>!usedAlerts.current.has(i));
      if(unused.length===0){usedAlerts.current.clear();return;}
      const idx=LIVE_ALERTS.indexOf(unused[Math.floor(Math.random()*unused.length)]);
      usedAlerts.current.add(idx);
      const a=LIVE_ALERTS[idx];
      const fresh={...a,id:getLiveId(),time:nowUTC(),_new:true};
      setNewAlert(fresh.id);
      setLiveAlerts(prev=>[fresh,...prev].slice(0,14));
      setTimeout(()=>setNewAlert(null),4000);
    }, 28000 + Math.random()*12000);

    // Counters tick up every 8–15 seconds
    const counterTimer=setInterval(()=>{
      const r=Math.random();
      if(r<0.45)      setMissiles(m=>m+Math.floor(Math.random()*3+1));
      else if(r<0.75) setDrones(d=>d+Math.floor(Math.random()*4+1));
      else if(r<0.90) setWave(w=>w+(Math.random()<0.15?1:0));
      else            setSites(s=>s+(Math.random()<0.1?1:0));
    }, 10000);

    // New ticker item every 20 seconds
    const tickerTimer=setInterval(()=>{
      const unused=LIVE_TICKER.filter(t=>!usedTickers.current.has(t));
      if(unused.length===0){usedTickers.current.clear();return;}
      const t=unused[Math.floor(Math.random()*unused.length)];
      usedTickers.current.add(t);
      setLiveTicker(prev=>[t,...prev].slice(0,16));
    }, 20000);

    return()=>{clearInterval(alertTimer);clearInterval(counterTimer);clearInterval(tickerTimer);};
  },[]);

  /* screenshot exact tabs */
  const TABS=[
    {id:"monitor",l:"UAE MONITOR"},
    {id:"chat",   l:"LIVE CHAT"},
    {id:"events", l:"LIVE EVENTS"},
    {id:"timeline",l:"TIMELINE"},
    {id:"influence",l:"INFLUENCE MAP"},
    {id:"disinfo",l:"DISINFO"},
    {id:"sources",l:"SOURCES"},
  ];
  const ET=["ALL","STRIKE","MILITARY","MARITIME","POLITICAL","DIPLOMATIC","INTELLIGENCE"];

  const checkD=async()=>{
    if(!dInp.trim()) return; setDLoad(true);
    try{
      const r=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:600,
          system:`Disinformation analyst. ONLY respond in JSON (no markdown backticks):
{"verdict":"VERIFIED|MISLEADING|UNVERIFIED|FABRICATED|PROPAGANDA","confidence":0-100,"reasoning":"2-3 sentences","redFlags":["specific flag"],"color":"#00e676 or #ffc940 or #ff8c00 or #ff3b55","recommendedSources":["Name: https://url"]}`,
          messages:[{role:"user",content:`Analyze: "${dInp}"`}]})});
      const d=await r.json();
      const raw=d.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim()||"{}";
      setDRes(JSON.parse(raw));
    }catch{setDRes({verdict:"ERROR",confidence:0,reasoning:"Check connection.",redFlags:[],color:C.red,recommendedSources:[]});}
    setDLoad(false);
  };

  /* ── UAE MONITOR stat cards — live counters ── */
  const STATS=[
    {v:missiles.toString(), l:"MISSILES FIRED AT UAE",n:"since Feb 28",      c:C.red,   src:"UAE MoD",  url:"https://mod.gov.ae"},
    {v:drones.toString(),   l:"DRONES INTERCEPTED",  n:"of "+(drones+65)+" launched",c:C.cyan,  src:"UAE NCEMA",url:"https://ncema.gov.ae"},
    {v:sites+"+",           l:"SITES HIT",           n:"incl. US Consulate", c:C.orange,src:"AP",       url:"https://apnews.com"},
    {v:wave.toString(),     l:"WAVE NUMBER",          n:"ongoing today",      c:C.cyan,  src:"Reuters",  url:"https://reuters.com"},
  ];

  const IC={PROXY:C.orange,ALLIANCE:C.green,SECURITY:C.green,FINANCIAL:C.gold,LEVERAGE:C.red,ECONOMIC:C.cyan,MILITARY:C.orange};

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      {/* Tab row — "UAE MONITOR  LIVE CHAT" style as in screenshot */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,flexShrink:0,marginBottom:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{background:"none",border:"none",
                    borderBottom:tab===t.id?`2px solid ${C.cyan}`:"2px solid transparent",
                    color:tab===t.id?C.cyan:C.textDim,
                    padding:"9px 14px",fontFamily:C.mono,fontSize:9,
                    letterSpacing:0.5,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"12px 14px",minHeight:0}}>

        {/* ── UAE MONITOR ── */}
        {tab==="monitor"&&(
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {/* 2×2 stat grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {STATS.map((s,i)=>(
                <div key={i} style={{background:C.panel,border:`1px solid ${C.border}`,borderTop:`2px solid ${s.c}`,borderRadius:3,padding:"14px 16px"}}>
                  <div style={{fontSize:36,color:s.c,fontFamily:C.mono,fontWeight:"bold",lineHeight:1.05}}>{s.v}</div>
                  <div style={{fontSize:8,color:C.textDim,letterSpacing:1.2,marginTop:6,textTransform:"uppercase"}}>{s.l}</div>
                  <div style={{fontSize:8,color:"#334560",marginTop:3}}>{s.n}</div>
                  <a href={s.url} target="_blank" rel="noreferrer"
                     style={{fontSize:8,color:C.cyan,textDecoration:"none",marginTop:8,display:"inline-flex",gap:3,fontFamily:C.mono}}>
                    ⊕ {s.src} ↗
                  </a>
                </div>
              ))}
            </div>
            {/* Alert cards — live updating */}
            {liveAlerts.map(a=>{
              const col=sevColor(a.sev);
              const isNew=a.id===newAlert;
              return(
                <div key={a.id} style={{background:isNew?`${col}12`:C.panel,border:`1px solid ${isNew?col:C.border}`,borderLeft:`3px solid ${col}`,borderRadius:3,padding:"10px 15px",transition:"all 0.5s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <div style={{display:"flex",gap:7,alignItems:"center"}}>
                      <span style={{fontSize:9,color:C.textDim,fontFamily:C.mono}}>{a.time}</span>
                      <span style={{fontSize:8,color:col,background:`${col}22`,padding:"1px 7px",borderRadius:2,fontFamily:C.mono,fontWeight:"bold",letterSpacing:1}}>{a.sev}</span>
                      {isNew&&<span style={{fontSize:7,color:col,fontFamily:C.mono,letterSpacing:1}}>● NEW</span>}
                      {a.verified
                        ?<span style={{fontSize:8,color:C.green,fontFamily:C.mono}}>✓ VERIFIED</span>
                        :<span style={{fontSize:8,color:C.gold,fontFamily:C.mono}}>⚡ UNCONFIRMED</span>}
                    </div>
                    <span style={{fontSize:9,color:C.textDim,fontFamily:C.mono}}>{a.loc}</span>
                  </div>
                  <div style={{fontSize:12,color:C.text,lineHeight:"1.45",marginBottom:5,fontWeight:500,fontFamily:C.mono}}>{a.title}</div>
                  <div style={{fontSize:9,color:C.textDim,lineHeight:"1.55",marginBottom:7}}>{a.detail}</div>
                  <a href={a.sourceUrl} target="_blank" rel="noreferrer" style={{fontSize:8,color:C.cyan,textDecoration:"none",fontFamily:C.mono}}>⊕ {a.source} ↗</a>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIVE CHAT ── */}
        {tab==="chat"&&(
          <div style={{height:"calc(100vh - 200px)"}}>
            <ChatRoom/>
          </div>
        )}

        {/* ── LIVE EVENTS ── */}
        {tab==="events"&&(
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>
              {ET.map(t=>(
                <button key={t} onClick={()=>setEvFilter(t)}
                  style={{background:evFilter===t?`${C.cyan}18`:"none",border:`1px solid ${evFilter===t?C.cyan:C.border}`,color:evFilter===t?C.cyan:C.textDim,padding:"3px 8px",fontSize:8,borderRadius:2,cursor:"pointer",fontFamily:C.mono}}>
                  {t}
                </button>
              ))}
            </div>
            {(evFilter==="ALL"?EVENTS:EVENTS.filter(e=>e.type===evFilter)).map(e=>{
              const isEx=expanded===e.id;
              const ec=typeC[e.type]||C.cyan;
              return(
                <div key={e.id} onClick={()=>setExpanded(isEx?null:e.id)}
                  style={{background:C.panel,border:`1px solid ${C.border}`,borderLeft:`3px solid ${ec}`,borderRadius:3,padding:"10px 14px",cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:8,color:C.textDim,fontFamily:C.mono}}>{e.time} · {e.date}</span>
                      <span style={{fontSize:8,color:ec,background:`${ec}18`,padding:"1px 6px",borderRadius:2,fontFamily:C.mono}}>{e.type}</span>
                      {e.verified?<span style={{fontSize:8,color:C.green}}>✓</span>:<span style={{fontSize:8,color:C.gold}}>⚡</span>}
                    </div>
                    <span style={{fontSize:8,color:C.textDim,fontFamily:C.mono}}>{e.region}</span>
                  </div>
                  <div style={{fontSize:11.5,color:C.text,lineHeight:"1.4",marginBottom:isEx?6:0,fontFamily:C.mono}}>{e.title}</div>
                  {isEx&&(
                    <>
                      <div style={{fontSize:9,color:C.textDim,lineHeight:"1.6",marginBottom:7}}>{e.detail}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                        {e.sources.map((s,i)=><SrcLink key={i} srcKey={s.key} url={s.url} compact/>)}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab==="timeline"&&(
          <div style={{position:"relative",paddingLeft:22}}>
            <div style={{position:"absolute",left:9,top:0,bottom:0,width:1,background:`linear-gradient(180deg,transparent,${C.cyan}55,transparent)`}}/>
            {TIMELINE.map((t,i)=>{
              const col=typeC[t.type]||C.cyan;
              return(
                <div key={i} style={{position:"relative",paddingBottom:16}}>
                  <div style={{position:"absolute",left:-15,top:5,width:8,height:8,borderRadius:"50%",background:col,border:`2px solid ${C.bg}`}}/>
                  <div style={{fontSize:8,color:C.cyan,fontFamily:C.mono,marginBottom:2}}>{t.date}</div>
                  <div style={{fontSize:10.5,color:C.text,lineHeight:"1.5",marginBottom:5}}>{t.event}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:7,color:col,background:`${col}18`,padding:"1px 6px",borderRadius:2,fontFamily:C.mono}}>{t.type}</span>
                    <a href={t.srcUrl} target="_blank" rel="noreferrer" style={{fontSize:8,color:C.cyan,textDecoration:"none",fontFamily:C.mono}}>⊕ {t.src} ↗</a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── INFLUENCE MAP ── */}
        {tab==="influence"&&(
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {INFLUENCES.map((inf,i)=>{
              const col=IC[inf.type]||C.cyan;
              return(
                <div key={i} onClick={()=>setInfExp(infExp===i?null:i)}
                  style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:3,padding:"9px 12px",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,color:C.text,minWidth:130,fontFamily:C.mono}}>{inf.from}</span>
                    <div style={{flex:1,height:2,background:"rgba(255,255,255,0.05)",position:"relative",minWidth:40}}>
                      <div style={{width:`${inf.str}%`,height:"100%",background:`linear-gradient(90deg,${col}44,${col})`}}/>
                      <div style={{position:"absolute",right:0,top:-3,width:7,height:7,background:col,clipPath:"polygon(0 50%,100% 0,100% 100%)"}}/>
                    </div>
                    <span style={{fontSize:10,color:C.text,minWidth:110,textAlign:"right",fontFamily:C.mono}}>{inf.to}</span>
                    <span style={{fontSize:8,color:col,background:`${col}18`,padding:"2px 7px",borderRadius:2,fontFamily:C.mono}}>{inf.type}</span>
                    <span style={{fontSize:9,color:col,fontFamily:C.mono,minWidth:26}}>{inf.str}%</span>
                  </div>
                  {infExp===i&&(
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:9,color:C.textDim,lineHeight:"1.65",marginBottom:6}}>{inf.note}</div>
                      <SrcLink srcKey={inf.src} url={inf.srcUrl}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── DISINFO ── */}
        {tab==="disinfo"&&(
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <div style={{display:"flex",gap:5,marginBottom:4}}>
              <input value={dInp} onChange={e=>setDInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&checkD()}
                placeholder="Paste any claim to fact-check..."
                style={{flex:1,background:"rgba(0,0,0,0.35)",border:`1px solid ${C.border}`,borderRadius:3,padding:"8px 12px",color:C.text,fontFamily:C.mono,fontSize:10.5,outline:"none"}}/>
              <button onClick={checkD} disabled={dLoad}
                style={{background:`${C.cyan}14`,border:`1px solid ${C.cyan}40`,color:C.cyan,padding:"8px 13px",borderRadius:3,fontFamily:C.mono,fontSize:9,cursor:"pointer"}}>
                {dLoad?"...":"VERIFY"}
              </button>
            </div>
            {dRes&&(
              <div style={{background:C.panel,border:`1px solid ${dRes.color}44`,borderLeft:`3px solid ${dRes.color}`,borderRadius:3,padding:12,marginBottom:4}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{color:dRes.color,fontFamily:C.mono,fontSize:13,letterSpacing:2}}>{dRes.verdict}</span>
                  <span style={{color:dRes.color,fontSize:10,fontFamily:C.mono}}>CONFIDENCE: {dRes.confidence}%</span>
                </div>
                <div style={{fontSize:10.5,color:C.text,lineHeight:"1.65",marginBottom:7}}>{dRes.reasoning}</div>
                {dRes.redFlags?.length>0&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:7}}>
                    {dRes.redFlags.map((f,i)=><span key={i} style={{fontSize:8,background:`${dRes.color}14`,color:dRes.color,padding:"2px 7px",borderRadius:2}}>⚑ {f}</span>)}
                  </div>
                )}
                {dRes.recommendedSources?.map((s,i)=>{
                  const[n,...r]=s.split(": ");
                  return<a key={i} href={r.join(": ")||"#"} target="_blank" rel="noreferrer" style={{display:"block",fontSize:9,color:C.gold,textDecoration:"none",marginBottom:2,fontFamily:C.mono}}>⊕ {n} ↗</a>;
                })}
              </div>
            )}
            <div style={{fontSize:8,color:C.textDim,letterSpacing:1,fontFamily:C.mono,marginBottom:4}}>RECENTLY VERIFIED CASES</div>
            {DISINFO.map((d,i)=>{
              const col=d.verdict==="FABRICATED"||d.verdict==="FALSE"?C.red:d.verdict==="MISLEADING"?C.orange:C.gold;
              return(
                <div key={i} style={{background:C.panel,border:`1px solid ${C.border}`,borderLeft:`2px solid ${col}`,borderRadius:3,padding:"8px 12px"}}>
                  <div style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:3}}>
                    <span style={{fontSize:8,color:col,minWidth:75,fontFamily:C.mono,fontWeight:"bold"}}>{d.verdict}</span>
                    <span style={{fontSize:9,color:C.textDim,flex:1}}>{d.claim}</span>
                    <span style={{fontSize:8,color:C.textDim,fontFamily:C.mono}}>{d.conf}%</span>
                  </div>
                  <div style={{fontSize:9,color:C.textDim,lineHeight:"1.5",marginBottom:5}}>{d.detail}</div>
                  <a href={d.srcUrl} target="_blank" rel="noreferrer" style={{fontSize:8,color:C.cyan,textDecoration:"none",fontFamily:C.mono}}>⊕ {d.src} ↗</a>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SOURCES ── */}
        {tab==="sources"&&(
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <div style={{fontSize:9,color:C.textDim,fontFamily:C.mono,marginBottom:5}}>{Object.keys(SOURCES).length} verified sources · click to visit</div>
            {Object.values(SOURCES).map((s,i)=>{
              const cc=s.credibility>=90?C.green:s.credibility>=75?C.gold:s.credibility>=55?C.orange:C.red;
              return(
                <a key={i} href={s.url} target="_blank" rel="noreferrer"
                   style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.panel,border:`1px solid ${C.border}`,borderLeft:`2px solid ${cc}`,borderRadius:3,padding:"8px 12px",textDecoration:"none"}}>
                  <div>
                    <div style={{fontSize:10,color:C.text,marginBottom:2}}>{s.name}</div>
                    <div style={{fontSize:8,color:C.textDim,fontFamily:C.mono}}>{s.type} · Bias: {s.bias}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,color:cc,fontWeight:"bold",fontFamily:C.mono}}>{s.credibility}%</div>
                    <div style={{fontSize:8,color:C.textDim}}>↗ visit</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── GLOBAL SEARCH ────────────────────────────────────────────── */
function GlobalSearch({onClose}){
  const [q,setQ]=useState("");
  const [ai,setAi]=useState(false);
  const [res,setRes]=useState("");
  const [load,setL]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();},[]);

  const corpus=useMemo(()=>{
    const r=[];
    EVENTS.forEach(e=>r.push({type:"EVENT",id:e.id,title:e.title,detail:e.detail,src:e.sources[0]?.key,srcUrl:e.sources[0]?.url,evType:e.type,tags:e.tags}));
    TIMELINE.forEach((t,i)=>r.push({type:"TIMELINE",id:`t${i}`,title:t.event,detail:t.date,src:t.src,srcUrl:t.srcUrl,evType:t.type}));
    INFLUENCES.forEach((inf,i)=>r.push({type:"INFLUENCE",id:`inf${i}`,title:`${inf.from} → ${inf.to}`,detail:inf.note,evType:inf.type,src:inf.src,srcUrl:inf.srcUrl}));
    Object.entries(SOURCES).forEach(([k,s])=>r.push({type:"SOURCE",id:k,title:s.name,detail:`${s.type} · ${s.bias} · ${s.credibility}%`,src:k,srcUrl:s.url}));
    return r;
  },[]);

  const results=useMemo(()=>{
    if(!q.trim()) return[];
    const ql=q.toLowerCase();
    return corpus.filter(r=>r.title?.toLowerCase().includes(ql)||r.detail?.toLowerCase().includes(ql)||r.evType?.toLowerCase().includes(ql)||r.tags?.some(t=>t.toLowerCase().includes(ql))).slice(0,12);
  },[q]);

  const askAI=async()=>{
    if(!q.trim()) return; setL(true);setRes("");
    try{
      const r=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:500,system:"Senior geopolitical analyst. No censorship. Recommend 2-3 real sources with URLs. Max 250 words.",messages:[{role:"user",content:q}]})});
      const d=await r.json();setRes(d.content?.map(b=>b.text||"").join("")||"No response.");
    }catch{setRes("Connection error.");}
    setL(false);
  };
  const TC={EVENT:C.red,TIMELINE:C.gold,INFLUENCE:C.orange,SOURCE:C.green};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(2,5,13,0.94)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:60}} onClick={onClose}>
      <div style={{width:700,maxWidth:"94vw",background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,overflow:"hidden",maxHeight:"80vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:9,alignItems:"center"}}>
          <span style={{color:C.cyan,fontSize:18}}>⌕</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)}
            onKeyDown={e=>{if(e.key==="Escape")onClose();if(e.key==="Enter"&&ai)askAI();}}
            placeholder="Search — events, countries, Epstein, Hormuz, BRICS..."
            style={{flex:1,background:"none",border:"none",color:C.text,fontFamily:C.mono,fontSize:14,outline:"none"}}/>
          <button onClick={()=>setAi(m=>!m)}
            style={{background:ai?`${C.cyan}1a`:"none",border:`1px solid ${ai?C.cyan:C.border}`,color:ai?C.cyan:C.textDim,padding:"5px 12px",borderRadius:3,fontFamily:C.mono,fontSize:9,cursor:"pointer"}}>AI MODE</button>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 16px"}}>
          {ai&&(
            <div style={{marginBottom:12}}>
              <button onClick={askAI} disabled={load}
                style={{background:`${C.cyan}14`,border:`1px solid ${C.cyan}40`,color:C.cyan,padding:"8px 20px",borderRadius:3,fontFamily:C.mono,fontSize:10,cursor:"pointer",marginBottom:10}}>
                {load?"ANALYZING...":"ANALYZE: "+(q||"enter query above")}
              </button>
              {res&&<div style={{background:"rgba(0,0,0,0.3)",border:`1px solid ${C.border}`,borderRadius:3,padding:14,fontFamily:C.mono,fontSize:11,lineHeight:"1.8",color:C.text,whiteSpace:"pre-wrap"}}>{res}</div>}
            </div>
          )}
          {!ai&&results.map(r=>(
            <div key={r.id} style={{marginBottom:5,background:"rgba(255,255,255,0.02)",border:`1px solid ${C.border}`,borderLeft:`2px solid ${TC[r.type]||C.cyan}`,borderRadius:3,padding:"9px 12px"}}>
              <div style={{display:"flex",gap:5,marginBottom:3}}>
                <span style={{fontSize:7,color:TC[r.type]||C.cyan,background:`${TC[r.type]||C.cyan}18`,padding:"1px 6px",borderRadius:2,fontFamily:C.mono}}>{r.type}</span>
                {r.evType&&<span style={{fontSize:7,color:C.textDim,fontFamily:C.mono}}>{r.evType}</span>}
              </div>
              <div style={{fontSize:11,color:C.text,marginBottom:3}}>{r.title}</div>
              <div style={{fontSize:9,color:C.textDim,marginBottom:4}}>{r.detail}</div>
              {r.src&&<a href={r.srcUrl} target="_blank" rel="noreferrer" style={{fontSize:8,color:C.gold,textDecoration:"none",fontFamily:C.mono}}>⊕ {r.src} ↗</a>}
            </div>
          ))}
          {!ai&&q&&results.length===0&&(
            <div style={{color:C.textDim,fontSize:11,padding:"16px 0",fontFamily:C.mono}}>
              No results.
              <button onClick={()=>setAi(true)} style={{background:`${C.cyan}14`,border:`1px solid ${C.border}`,color:C.cyan,padding:"3px 10px",borderRadius:2,fontFamily:C.mono,fontSize:9,cursor:"pointer",marginLeft:8}}>ASK AI</button>
            </div>
          )}
          {!q&&!ai&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {["Iran war","Hormuz","Epstein","UAE","BRICS","Petrodollar","Houthi","Khamenei","India"].map(s=>(
                <button key={s} onClick={()=>setQ(s)} style={{background:`${C.cyan}0c`,border:`1px solid ${C.border}`,color:C.textDim,padding:"6px 12px",borderRadius:3,fontFamily:C.mono,fontSize:10,cursor:"pointer"}}>{s}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{padding:"5px 16px",borderTop:`1px solid ${C.border}`,fontSize:7,color:C.textDim,display:"flex",justifyContent:"space-between",fontFamily:C.mono}}>
          <span>ESC close · Enter = AI analyze</span>
          <span>{Object.keys(SOURCES).length} sources · {corpus.length} data points</span>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ─────────────────────────────────────────────────────── */
export default function GEOINTv10(){
  const [selected,setSelected]=useState(null);
  const [searchOpen,setSearch]=useState(false);
  const [blink,setBlink]=useState(true);
  const [time,setTime]=useState(new Date());
  const [tickerItems,setTickerItems]=useState([...TICKER_ITEMS]);
  const usedTickers=useRef(new Set());

  useEffect(()=>{const t=setInterval(()=>setBlink(b=>!b),900);return()=>clearInterval(t);},[]);
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{
    const h=e=>{if(e.key==="/"||((e.ctrlKey||e.metaKey)&&e.key==="k")){e.preventDefault();setSearch(true);}};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  /* Live ticker updates every 20 seconds */
  useEffect(()=>{
    const t=setInterval(()=>{
      const unused=LIVE_TICKER.filter(x=>!usedTickers.current.has(x));
      if(unused.length===0){usedTickers.current.clear();return;}
      const item=unused[Math.floor(Math.random()*unused.length)];
      usedTickers.current.add(item);
      setTickerItems(prev=>[item,...prev].slice(0,18));
    },20000);
    return()=>clearInterval(t);
  },[]);

  /* Format date exactly as screenshot: "Thu, 12 Mar 2026, 15:00:22" */
  const fmtTime=()=>{
    const d=time.toUTCString(); // "Thu, 12 Mar 2026 15:00:22 GMT"
    return d.slice(0,3).toUpperCase()+", "+d.slice(5,11)+" "+d.slice(17,25);
  };

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{height:100%;overflow:hidden;background:#0b0f1a;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:#0b0f1a;}
        ::-webkit-scrollbar-thumb{background:#1c2840;border-radius:2px;}
        input::placeholder{color:#4a6882;}
        button:focus{outline:none;}
        a:hover{opacity:0.8;}
      `}</style>

      {searchOpen&&<GlobalSearch onClose={()=>setSearch(false)}/>}

      <div style={{height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg,fontFamily:C.mono}}>

        {/* ── HEADER — pixel-perfect to screenshot ── */}
        <header style={{background:"#070b15",borderBottom:`1px solid ${C.border}`,height:46,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0}}>
          {/* Left: GEOINT v6 OPEN SOURCE INTELLIGENCE */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontFamily:C.head,fontSize:20,fontWeight:900,letterSpacing:5,color:"#fff"}}>
              GEO<span style={{color:C.cyan}}>INT</span>
            </div>
            <span style={{fontSize:10,color:C.cyan,border:`1px solid ${C.cyan}44`,padding:"2px 8px",borderRadius:2,fontFamily:C.mono}}>v6</span>
            <span style={{fontSize:9,color:C.textDim,letterSpacing:2.5,fontFamily:C.mono}}>OPEN SOURCE INTELLIGENCE</span>
          </div>
          {/* Right: SEARCH ⌘K · status dots SEVERE · clock */}
          <div style={{display:"flex",alignItems:"center",gap:18}}>
            <button onClick={()=>setSearch(true)}
              style={{display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,color:C.textDim,padding:"5px 13px",borderRadius:3,fontSize:10,cursor:"pointer",fontFamily:C.mono}}>
              <span style={{fontSize:14}}>⌕</span>SEARCH<span style={{fontSize:8,opacity:0.45,marginLeft:2}}>⌘K</span>
            </button>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              {[C.green,"#26c970",C.gold,C.orange,C.red].map((c,i)=>(
                <div key={i} style={{width:12,height:12,borderRadius:"50%",background:c,opacity:i===4&&!blink?0.35:1,transition:"opacity 0.2s"}}/>
              ))}
              <span style={{color:C.red,fontSize:10,letterSpacing:2,fontFamily:C.mono,marginLeft:5,fontWeight:"bold"}}>SEVERE</span>
            </div>
            <span style={{color:C.textDim,fontSize:10,fontFamily:C.mono}}>{fmtTime()}</span>
          </div>
        </header>

        {/* ── TICKER ── */}
        <Ticker items={tickerItems}/>

        {/* ── MAIN: 5fr left / 7fr right — exactly as screenshot ── */}
        <main style={{flex:1,display:"grid",gridTemplateColumns:"5fr 7fr",overflow:"hidden",minHeight:0}}>

          {/* LEFT COLUMN */}
          <div style={{borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>

            {/* Map: fills top portion — no padding around edges, map goes to borders */}
            <div style={{height:"48%",flexShrink:0,borderBottom:`1px solid ${C.border}`}}>
              <MapView selected={selected} setSelected={setSelected}/>
            </div>

            {/* AI Analysis: fills remaining space below map */}
            <div style={{flex:1,padding:"10px 14px 12px",overflowY:"auto",minHeight:0}}>
              <AIPanel/>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
            <RightPanel/>
          </div>

        </main>
      </div>
    </>
  );
}
