import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────── DESIGN TOKENS ─────────── */
const C = {
  bg: "#050A14", surface: "#0C1322", card: "#101828",
  border: "#1A2540", borderGlow: "#1E3A5F",
  red: "#FF2D2D", redGlow: "rgba(255,45,45,0.3)",
  orange: "#FF6B00", orangeGlow: "rgba(255,107,0,0.25)",
  yellow: "#F5C400", yellowGlow: "rgba(245,196,0,0.2)",
  green: "#00E676", greenGlow: "rgba(0,230,118,0.25)",
  blue: "#2979FF", blueGlow: "rgba(41,121,255,0.25)",
  cyan: "#00E5FF", cyanGlow: "rgba(0,229,255,0.2)",
  purple: "#AA00FF",
  text: "#E8F4FF", textMid: "#7A9CC0", textDim: "#3A5070",
};

const RISK_META = {
  CRITICAL: { color: C.red, glow: C.redGlow, bg: "rgba(255,45,45,0.08)", bar: "95%" },
  HIGH:     { color: C.orange, glow: C.orangeGlow, bg: "rgba(255,107,0,0.08)", bar: "70%" },
  MODERATE: { color: C.yellow, glow: C.yellowGlow, bg: "rgba(245,196,0,0.07)", bar: "45%" },
  LOW:      { color: C.green, glow: C.greenGlow, bg: "rgba(0,230,118,0.07)", bar: "20%" },
};

/* ─────────── INITIAL DATA ─────────── */
const INIT_ZONES = [
  { id:1, name:"Zone Alpha", code:"ZA", x:68, y:28, risk:"CRITICAL", type:"Flash Flood", victims:340, rescued:87, teams:2, rainfall:280, windspeed:0, magnitude:0, trend:"↑" },
  { id:2, name:"Zone Beta",  code:"ZB", x:30, y:55, risk:"HIGH",     type:"Earthquake", victims:120, rescued:34, teams:1, rainfall:0, windspeed:0, magnitude:5.8, trend:"→" },
  { id:3, name:"Zone Gamma", code:"ZG", x:72, y:65, risk:"HIGH",     type:"Cyclone",    victims:210, rescued:65, teams:3, rainfall:140, windspeed:180, magnitude:0, trend:"↑" },
  { id:4, name:"Zone Delta", code:"ZD", x:45, y:78, risk:"MODERATE", type:"Landslide",  victims:55,  rescued:12, teams:1, rainfall:95, windspeed:0, magnitude:0, trend:"→" },
  { id:5, name:"Zone Echo",  code:"ZE", x:20, y:25, risk:"LOW",      type:"Wildfire",   victims:18,  rescued:6,  teams:1, rainfall:5, windspeed:45, magnitude:0, trend:"↓" },
];

const INIT_TEAMS = [
  { id:"T-01", name:"Falcon Squad",    status:"DEPLOYED",  zone:1, members:8,  lat:68, lng:28, supplies:"Medical,Rope,Radio", eta:null,   skill:"Flood Rescue" },
  { id:"T-02", name:"Eagle Unit",      status:"EN ROUTE",  zone:2, members:6,  lat:35, lng:50, supplies:"SAR,Drone,Radio",    eta:"18m",  skill:"Structural SAR" },
  { id:"T-03", name:"Phoenix Crew",    status:"DEPLOYED",  zone:3, members:10, lat:72, lng:65, supplies:"Medical,Evac,Radio", eta:null,   skill:"Cyclone Response" },
  { id:"T-04", name:"Storm Breakers",  status:"DEPLOYED",  zone:3, members:7,  lat:70, lng:68, supplies:"Chainsaw,Radio",     eta:null,   skill:"Debris Clearance" },
  { id:"T-05", name:"Iron Shield",     status:"STANDBY",   zone:null,members:12,lat:50,lng:50, supplies:"Full Kit",           eta:null,   skill:"General Rescue" },
  { id:"T-06", name:"Delta Force",     status:"DEPLOYED",  zone:4, members:5,  lat:45, lng:78, supplies:"Excavation,Medical", eta:null,   skill:"Landslide Rescue" },
];

const SOS_SCENARIOS = [
  { name:"Priya Sharma", loc:"Zone Alpha - Sector 3", msg:"Water rising fast! Trapped on roof with 2 children. Please hurry!", urgent:true },
  { name:"Rajan Kumar",  loc:"Zone Beta - Block 7",   msg:"Building collapsed. 5 people trapped under rubble, one person unconscious.", urgent:true },
  { name:"Meena Devi",   loc:"Zone Gamma - East",     msg:"Evacuation bus didn't arrive. 30 elderly residents stranded at community hall.", urgent:false },
  { name:"Arjun Singh",  loc:"Zone Delta - Hills",    msg:"Road blocked by landslide, cut off from town. Need food and medicine.", urgent:false },
];

const FORECAST = [
  { hour:"Now",  ZA:95, ZB:70, ZG:72, ZD:45 },
  { hour:"+1h",  ZA:97, ZB:68, ZG:78, ZD:47 },
  { hour:"+2h",  ZA:93, ZB:65, ZG:85, ZD:50 },
  { hour:"+3h",  ZA:88, ZB:70, ZG:90, ZD:48 },
  { hour:"+4h",  ZA:80, ZB:72, ZG:88, ZD:44 },
  { hour:"+5h",  ZA:72, ZB:69, ZG:82, ZD:40 },
  { hour:"+6h",  ZA:60, ZB:65, ZG:75, ZD:35 },
];

/* ─────────── UTILS ─────────── */
const rM = (r) => RISK_META[r] || RISK_META.LOW;

function useClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return t;
}

function usePulse(ms = 900) {
  const [on, setOn] = useState(true);
  useEffect(() => { const i = setInterval(() => setOn(p => !p), ms); return () => clearInterval(i); }, [ms]);
  return on;
}

/* ─────────── GLOBAL CSS ─────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.text}; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.borderGlow}; border-radius: 2px; }

  @keyframes pulse-ring {
    0% { transform: translate(-50%,-50%) scale(0.5); opacity: 0.9; }
    100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
  }
  @keyframes hex-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes scanline {
    0% { top: -10%; } 100% { top: 110%; }
  }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes glow-pulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
  @keyframes data-scroll { 0% { transform:translateY(0); } 100% { transform:translateY(-50%); } }
  @keyframes threat-wave {
    0% { r: 8; opacity: 0.9; }
    100% { r: 28; opacity: 0; }
  }

  .tab-btn {
    background: none; border: none; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; padding: 9px 18px;
    border-radius: 4px; transition: all 0.2s;
    color: ${C.textMid}; position: relative;
  }
  .tab-btn:hover { color: ${C.text}; background: rgba(255,255,255,0.04); }
  .tab-btn.active { color: ${C.cyan}; }
  .tab-btn.active::after {
    content:''; position:absolute; bottom:0; left:16px; right:16px;
    height:2px; background:${C.cyan}; border-radius:2px;
    box-shadow: 0 0 8px ${C.cyan};
  }

  .zone-node {
    cursor: pointer; transition: all 0.2s;
  }
  .zone-node:hover .zone-label { opacity:1; }

  .card {
    background: ${C.card}; border: 1px solid ${C.border};
    border-radius: 10px; overflow: hidden;
  }
  .card-header {
    padding: 12px 16px; border-bottom: 1px solid ${C.border};
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 3px;
    color: ${C.textMid}; text-transform: uppercase;
    display: flex; align-items: center; gap: 8px;
  }

  .metric-val {
    font-family: 'Share Tech Mono', monospace;
    font-size: 32px; line-height: 1;
  }
  .metric-label {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: ${C.textMid}; margin-top:4px;
  }

  .sos-btn {
    background: linear-gradient(135deg, #FF2D2D, #FF6B00);
    border: none; color: white; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 12px; letter-spacing: 2px;
    padding: 8px 16px; border-radius: 4px;
    transition: all 0.2s; text-transform: uppercase;
  }
  .sos-btn:hover { transform: scale(1.03); box-shadow: 0 0 16px rgba(255,45,45,0.5); }
  .sos-btn:disabled { background: #1A2540; color: #3A5070; cursor: not-allowed; transform: none; box-shadow: none; }

  .action-btn {
    background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.25);
    color: ${C.cyan}; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 12px; letter-spacing: 1.5px;
    padding: 8px 16px; border-radius: 4px;
    transition: all 0.2s; text-transform: uppercase;
  }
  .action-btn:hover { background: rgba(0,229,255,0.18); box-shadow: 0 0 12px rgba(0,229,255,0.2); }

  .chip {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px; font-weight: 800; letter-spacing: 1.5px;
    padding: 3px 8px; border-radius: 3px; text-transform: uppercase;
  }

  .ai-chat-input {
    width: 100%; background: rgba(255,255,255,0.04);
    border: 1px solid ${C.border}; border-radius: 6px;
    padding: 12px 14px; color: ${C.text};
    font-size: 13px; font-family: 'Barlow', sans-serif;
    outline: none; resize: none; transition: border 0.2s;
  }
  .ai-chat-input:focus { border-color: ${C.cyan}; }

  .progress-bar {
    height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.06);
    overflow: hidden; position: relative;
  }
  .progress-fill {
    height: 100%; border-radius: 2px;
    transition: width 1s ease;
  }

  .threat-wave-circle {
    animation: threat-wave 2s ease-out infinite;
  }
  .scanline {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(transparent, rgba(0,229,255,0.15), transparent);
    animation: scanline 4s linear infinite;
    pointer-events: none;
  }
`;

/* ─────────── COMPONENTS ─────────── */

function Blink({ color, size = 7 }) {
  const on = usePulse(700);
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background: on ? color : "transparent", boxShadow: on ? `0 0 8px ${color}` : "none", transition:"background 0.15s, box-shadow 0.15s", flexShrink:0 }} />;
}

function Chip({ label, color, bg }) {
  return <span className="chip" style={{ color: color || C.text, background: bg || "rgba(255,255,255,0.06)", border: `1px solid ${color}44` }}>{label}</span>;
}

function LiveClock() {
  const t = useClock();
  return (
    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:13, color:C.cyan, letterSpacing:2 }}>
      {t.toLocaleTimeString('en-IN', { hour12:false })}
    </span>
  );
}

/* Live SVG Tactical Map */
function TacticalMap({ zones, teams, selectedZone, onSelectZone }) {
  const pulse = usePulse(1200);
  const [wavePhase, setWavePhase] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setWavePhase(p => (p + 1) % 3), 700);
    return () => clearInterval(i);
  }, []);

  const zoneColors = zones.map(z => rM(z.risk).color);

  return (
    <div style={{ position:"relative", background:"#070D1A", borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
      <div className="scanline" />
      <svg viewBox="0 0 100 100" style={{ width:"100%", display:"block" }}>
        {/* Grid lines */}
        {[20,40,60,80].map(v => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="100" stroke={C.border} strokeWidth="0.3" />
            <line x1="0" y1={v} x2="100" y2={v} stroke={C.border} strokeWidth="0.3" />
          </g>
        ))}
        {/* Hex grid accent */}
        {[[15,15],[45,22],[78,18],[25,48],[60,42],[82,55],[40,72],[70,80],[18,75]].map(([cx,cy],i)=>(
          <polygon key={i}
            points={[0,1,2,3,4,5].map(k => {
              const a = Math.PI/180*(60*k-30);
              return `${cx+4.5*Math.cos(a)},${cy+4.5*Math.sin(a)}`;
            }).join(' ')}
            fill="none" stroke={C.border} strokeWidth="0.25" opacity="0.5"
          />
        ))}
        {/* Team movement paths */}
        {teams.filter(t=>t.status==="EN ROUTE").map(t=>{
          const zone = zones.find(z=>z.id===t.zone);
          if(!zone) return null;
          return <line key={t.id} x1={t.lat} y1={t.lng} x2={zone.x} y2={zone.y}
            stroke={C.yellow} strokeWidth="0.4" strokeDasharray="2,1.5" opacity="0.6" />;
        })}
        {/* Disaster zones */}
        {zones.map((z, i) => {
          const meta = rM(z.risk);
          const isSelected = selectedZone?.id === z.id;
          return (
            <g key={z.id} className="zone-node" onClick={() => onSelectZone(z)}>
              {/* Threat wave rings for CRITICAL/HIGH */}
              {(z.risk==="CRITICAL"||z.risk==="HIGH") && [0,1,2].map(w => (
                wavePhase === w &&
                <circle key={w} cx={z.x} cy={z.y} r="6"
                  fill="none" stroke={meta.color} strokeWidth="0.8"
                  className="threat-wave-circle" opacity="0.7"
                  style={{animationDelay:`${w*0.6}s`}}
                />
              ))}
              {/* Base glow */}
              <circle cx={z.x} cy={z.y} r={isSelected?14:10}
                fill={meta.color} opacity="0.06"
                style={{transition:"r 0.3s"}}
              />
              {/* Main dot */}
              <circle cx={z.x} cy={z.y} r={isSelected?5:4}
                fill={meta.color} opacity="0.9"
                style={{filter:`drop-shadow(0 0 4px ${meta.color})`, transition:"r 0.3s"}}
              />
              {/* Code label */}
              <text x={z.x} y={z.y-7} textAnchor="middle"
                fill={meta.color} fontSize="3.5"
                fontFamily="'Share Tech Mono',monospace" fontWeight="bold">
                {z.code}
              </text>
              {/* Victim count */}
              <text x={z.x} y={z.y+10} textAnchor="middle"
                fill={C.textMid} fontSize="2.8"
                fontFamily="'Barlow Condensed',sans-serif">
                {z.victims}v
              </text>
              {/* Selection ring */}
              {isSelected && (
                <circle cx={z.x} cy={z.y} r="9"
                  fill="none" stroke={meta.color} strokeWidth="0.6"
                  strokeDasharray="3,2" opacity="0.8"
                />
              )}
            </g>
          );
        })}
        {/* Team icons */}
        {teams.filter(t=>t.status!=="STANDBY").map(t=>(
          <g key={t.id}>
            <circle cx={t.lat} cy={t.lng} r="2.5"
              fill={t.status==="DEPLOYED"?C.green:C.yellow}
              opacity="0.9"
              style={{filter:`drop-shadow(0 0 3px ${t.status==="DEPLOYED"?C.green:C.yellow})`}}
            />
            <text x={t.lat+3.5} y={t.lng+1} fontSize="2.5"
              fill={C.textMid} fontFamily="'Barlow Condensed',sans-serif">{t.id}</text>
          </g>
        ))}
        {/* Legend */}
        <text x="2" y="97" fontSize="2.2" fill={C.textDim} fontFamily="'Share Tech Mono',monospace">● TEAM  ● ZONE  --- ROUTE</text>
      </svg>
      {/* Map overlay label */}
      <div style={{ position:"absolute", top:8, left:10, fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, color:C.cyan, letterSpacing:3, opacity:0.7 }}>TACTICAL MAP · LIVE</div>
      <div style={{ position:"absolute", top:8, right:10 }}>
        <LiveClock />
      </div>
    </div>
  );
}

/* Risk Forecast Chart */
function ForecastChart({ data }) {
  const zones = ["ZA","ZB","ZG","ZD"];
  const colors = [C.red, C.orange, C.cyan, C.yellow];
  const names = ["Alpha","Beta","Gamma","Delta"];
  const W = 340, H = 130, padL = 28, padB = 22, padT = 10, padR = 10;
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const xStep = chartW / (data.length - 1);
  const yScale = v => padT + chartH - (v / 100) * chartH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", display:"block" }}>
      {/* Grid */}
      {[0,25,50,75,100].map(v => (
        <g key={v}>
          <line x1={padL} y1={yScale(v)} x2={W-padR} y2={yScale(v)} stroke={C.border} strokeWidth="0.5" />
          <text x={padL-3} y={yScale(v)+1} textAnchor="end" fontSize="6" fill={C.textDim} fontFamily="'Share Tech Mono',monospace">{v}</text>
        </g>
      ))}
      {/* X labels */}
      {data.map((d,i) => (
        <text key={i} x={padL + i*xStep} y={H-6} textAnchor="middle" fontSize="6.5" fill={C.textDim} fontFamily="'Barlow Condensed',sans-serif">{d.hour}</text>
      ))}
      {/* Zone lines */}
      {zones.map((z, zi) => {
        const points = data.map((d,i) => `${padL+i*xStep},${yScale(d[z])}`).join(" ");
        return (
          <g key={z}>
            <polyline points={points} fill="none" stroke={colors[zi]} strokeWidth="1.2" opacity="0.85" />
            {data.map((d,i) => (
              <circle key={i} cx={padL+i*xStep} cy={yScale(d[z])} r="1.8" fill={colors[zi]} opacity="0.9" />
            ))}
          </g>
        );
      })}
      {/* Legend */}
      {zones.map((z,zi) => (
        <g key={z}>
          <rect x={padL + zi*82} y={H-14} width="6" height="2" fill={colors[zi]} rx="1" />
          <text x={padL+zi*82+8} y={H-12} fontSize="6" fill={C.textMid} fontFamily="'Barlow Condensed',sans-serif">{names[zi]}</text>
        </g>
      ))}
    </svg>
  );
}

/* SOS Civilian Panel */
function SOSPanel({ onEscalate }) {
  const [active, setActive] = useState(null);
  const [response, setResponse] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAIResponse = async (sos) => {
    setActive(sos);
    if (response[sos.name]) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1000,
          system:`You are RescueAI's civilian response coordinator. Someone is in distress during a disaster. Respond with:
1. IMMEDIATE ACTIONS (what they should do RIGHT NOW in 2-3 bullet points)
2. RESCUE ETA (give an estimated time)
3. STAY SAFE TIP (one critical safety instruction)
Keep response under 120 words. Be calm, direct, empathetic. Format clearly.`,
          messages:[{ role:"user", content:`Emergency from ${sos.name} at ${sos.loc}: "${sos.msg}"` }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Response coordinator is dispatching help. Stay calm.";
      setResponse(prev => ({...prev, [sos.name]: text}));
    } catch {
      setResponse(prev => ({...prev, [sos.name]: "⚠️ Communication disrupted. Emergency services alerted. Stay in place."}));
    }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {SOS_SCENARIOS.map(sos => (
        <div key={sos.name} style={{
          background: active?.name===sos.name ? "rgba(255,45,45,0.06)" : C.card,
          border: `1px solid ${active?.name===sos.name ? C.red+"44" : C.border}`,
          borderRadius:8, overflow:"hidden", transition:"all 0.2s"
        }}>
          <div style={{ padding:"12px 14px", display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}
            onClick={() => handleAIResponse(sos)}>
            <div style={{ width:36, height:36, borderRadius:8, background: sos.urgent ? "rgba(255,45,45,0.15)" : "rgba(41,121,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
              {sos.urgent ? "🆘" : "📡"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:C.text }}>{sos.name}</span>
                <Chip label={sos.urgent?"URGENT":"ACTIVE"} color={sos.urgent?C.red:C.blue} />
                <span style={{ fontSize:11, color:C.textDim }}>📍 {sos.loc}</span>
              </div>
              <div style={{ fontSize:12, color:C.textMid, lineHeight:1.5 }}>"{sos.msg}"</div>
            </div>
          </div>
          {active?.name===sos.name && (
            <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.border}`, background:"rgba(0,0,0,0.2)", animation:"fadeUp 0.25s ease" }}>
              {loading && !response[sos.name] ? (
                <div style={{ display:"flex", alignItems:"center", gap:8, color:C.cyan, fontSize:13 }}>
                  <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${C.cyan}`, borderTopColor:"transp