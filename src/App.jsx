import { useMemo, useState, useCallback } from "react";
import { Zap, Scale, Syringe, Dna, Utensils, Dumbbell, Pill, Calculator, Settings, Search, X, ChevronDown, ChevronUp, Flame } from "lucide-react";

const THEMES = {
  green:  { primary:"#4ade80", primaryDark:"#16a34a", border:"rgba(74,222,128,0.28)", glow:"rgba(74,222,128,0.18)", glowStrong:"rgba(74,222,128,0.35)", bg:"rgba(22,163,74,0.18)", tabBg:"rgba(5,46,22,0.92)", label:"Green" },
  navy:   { primary:"#60a5fa", primaryDark:"#1d4ed8", border:"rgba(96,165,250,0.28)", glow:"rgba(96,165,250,0.18)", glowStrong:"rgba(96,165,250,0.35)", bg:"rgba(29,78,216,0.18)", tabBg:"rgba(15,23,42,0.92)", label:"Navy" },
  pink:   { primary:"#f472b6", primaryDark:"#be185d", border:"rgba(244,114,182,0.28)", glow:"rgba(244,114,182,0.18)", glowStrong:"rgba(244,114,182,0.35)", bg:"rgba(190,24,93,0.18)", tabBg:"rgba(46,5,22,0.92)", label:"Pink" },
  purple: { primary:"#a78bfa", primaryDark:"#6d28d9", border:"rgba(167,139,250,0.28)", glow:"rgba(167,139,250,0.18)", glowStrong:"rgba(167,139,250,0.35)", bg:"rgba(109,40,217,0.18)", tabBg:"rgba(20,5,46,0.92)", label:"Purple" },
  red:    { primary:"#f87171", primaryDark:"#b91c1c", border:"rgba(248,113,113,0.28)", glow:"rgba(248,113,113,0.18)", glowStrong:"rgba(248,113,113,0.35)", bg:"rgba(185,28,28,0.18)", tabBg:"rgba(46,5,5,0.92)", label:"Red" },
};

const HAS_SETUP = localStorage.getItem("tracker_setup_complete") === "true";
const START_WEIGHT = Number(localStorage.getItem("tracker_start_weight")) || 225;
const START_DATE = localStorage.getItem("tracker_start_date") || "2026-05-26";
const TARGET_WEIGHT = Number(localStorage.getItem("tracker_target_weight")) || 200;

const RETA_PHASES = [
  { weeks:"1-4",   phase:"Initiation",    expected:"0-1%",  desc:"Body adapting. Appetite suppression begins. GI side effects most likely." },
  { weeks:"5-8",   phase:"Early Loss",    expected:"1-3%",  desc:"Metabolic shift via glucagon pathway. Fat oxidation increases." },
  { weeks:"9-16",  phase:"Active Loss",   expected:"3-8%",  desc:"Triple agonism in full effect. Visceral fat reduction, blood sugar improvements." },
  { weeks:"17-32", phase:"Acceleration",  expected:"8-15%", desc:"Sustained deficit. Insulin sensitivity markedly improved." },
  { weeks:"33-68", phase:"Peak Efficacy", expected:"15%+",  desc:"Continued progress. Plateau monitoring becomes important." },
];

const PEPTIDE_LIBRARY = {
  "GLP-1 / Metabolic": [
    { name:"Retatrutide", desc:"Triple agonist (GLP-1/GIP/glucagon). Most potent weight loss peptide. Reduces appetite, visceral fat, improves insulin sensitivity.", typicalDose:"0.5-5mg", unit:"mg", frequency:"2x/week", cycle:"Ongoing" },
    { name:"Semaglutide", desc:"GLP-1 agonist. Appetite suppression and blood sugar control.", typicalDose:"0.25-2mg", unit:"mg", frequency:"Weekly", cycle:"Ongoing" },
    { name:"Tirzepatide", desc:"Dual GLP-1/GIP agonist. Strong weight loss with muscle preservation.", typicalDose:"2.5-15mg", unit:"mg", frequency:"Weekly", cycle:"Ongoing" },
    { name:"Liraglutide", desc:"GLP-1 agonist. Daily dosing. Good appetite control.", typicalDose:"0.6-3mg", unit:"mg", frequency:"Daily", cycle:"Ongoing" },
  ],
  "GH Secretagogues": [
    { name:"CJC-1295 / Ipamorelin", desc:"GHRH + GHRP stack. Boosts GH pulse, improves sleep and recovery.", typicalDose:"100-300mcg", unit:"mcg", frequency:"Pre-sleep daily", cycle:"8-12 weeks" },
    { name:"CJC-1295", desc:"GHRH analogue. Extends GH release. Often stacked with Ipamorelin.", typicalDose:"1-2mg", unit:"mg", frequency:"2x/week", cycle:"8-12 weeks" },
    { name:"Ipamorelin", desc:"Selective GHRP. Clean GH pulse with minimal cortisol/prolactin.", typicalDose:"100-300mcg", unit:"mcg", frequency:"Daily", cycle:"8-12 weeks" },
    { name:"GHRP-2", desc:"Strong GH release. Increases appetite - useful for recomposition.", typicalDose:"100-300mcg", unit:"mcg", frequency:"3x/day", cycle:"4-12 weeks" },
    { name:"GHRP-6", desc:"Potent hunger stimulus with GH release. Better for muscle gaining.", typicalDose:"100-300mcg", unit:"mcg", frequency:"3x/day", cycle:"4-12 weeks" },
    { name:"MK-677 (Ibutamoren)", desc:"Oral GH secretagogue. 24hr GH elevation. Water retention common.", typicalDose:"10-25mg", unit:"mg", frequency:"Daily", cycle:"Ongoing" },
    { name:"Sermorelin", desc:"GHRH analogue. Gentler GH stimulus. Good for anti-aging.", typicalDose:"200-500mcg", unit:"mcg", frequency:"Daily", cycle:"3-6 months" },
    { name:"Tesamorelin", desc:"GHRH analogue. FDA-approved for visceral fat reduction.", typicalDose:"1-2mg", unit:"mg", frequency:"Daily", cycle:"6-12 months" },
  ],
  "Tissue Repair": [
    { name:"BPC-157", desc:"Body Protection Compound. Heals gut, tendons, ligaments. Helps GI side effects from GLP-1.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily or BID", cycle:"4-12 weeks" },
    { name:"TB-500 (Thymosin Beta-4)", desc:"Systemic tissue repair. Reduces inflammation, accelerates healing.", typicalDose:"2-5mg", unit:"mg", frequency:"2x/week loading", cycle:"4-6 weeks" },
    { name:"BPC-157 + TB-500", desc:"Combined stack for maximum healing. Synergistic local + systemic.", typicalDose:"250mcg / 2mg", unit:"mcg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"KPV", desc:"Anti-inflammatory tripeptide. Gut healing, skin conditions, IBD.", typicalDose:"500mcg-1mg", unit:"mg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"GHK-Cu", desc:"Copper peptide. Skin regeneration, collagen synthesis, anti-aging.", typicalDose:"1-2mg", unit:"mg", frequency:"Daily", cycle:"8-12 weeks" },
    { name:"Thymosin Alpha-1", desc:"Immune modulator. Used in cancer/viral protocols.", typicalDose:"1.6mg", unit:"mg", frequency:"2x/week", cycle:"6-12 months" },
  ],
  "Mitochondrial / Longevity": [
    { name:"MOTS-c", desc:"Mitochondrial peptide. AMPK activation. Boosts fat oxidation and insulin sensitivity.", typicalDose:"5-10mg", unit:"mg", frequency:"Weekly", cycle:"8-12 wk on, 4mo off" },
    { name:"Humanin", desc:"Mitochondria-derived. Neuroprotective, anti-aging, cardioprotective.", typicalDose:"2-4mg", unit:"mg", frequency:"Weekly", cycle:"8-12 weeks" },
    { name:"SS-31 (Elamipretide)", desc:"Targets mitochondrial inner membrane. Reduces oxidative stress.", typicalDose:"1-4mg", unit:"mg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"Epitalon", desc:"Telomere lengthening peptide. Anti-aging, sleep quality, immune function.", typicalDose:"5-10mg", unit:"mg", frequency:"Daily x 10-20d", cycle:"1-2 cycles/year" },
    { name:"Selank", desc:"Anxiolytic and nootropic. Modulates GABA and BDNF.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily", cycle:"2-4 weeks" },
    { name:"Semax", desc:"ACTH analogue. Cognitive enhancer, neuroprotective, BDNF upregulation.", typicalDose:"200-600mcg", unit:"mcg", frequency:"Daily", cycle:"2-4 weeks" },
  ],
  "Cognitive / Mood": [
    { name:"Dihexa", desc:"Extremely potent nootropic. BDNF-like activity. Long duration of action.", typicalDose:"10-20mg", unit:"mg", frequency:"Weekly", cycle:"4-8 weeks" },
    { name:"NA-NAP (NAP)", desc:"Neuroprotective. ADNP-derived. Cognitive support, anti-inflammatory.", typicalDose:"50-200mcg", unit:"mcg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"Pinealon", desc:"Retinal/brain peptide. Sleep, anti-aging, neuroprotection.", typicalDose:"1-3mg", unit:"mg", frequency:"Daily x 10d", cycle:"2 cycles/year" },
  ],
  "Hormonal / Sexual Health": [
    { name:"PT-141 (Bremelanotide)", desc:"Melanocortin agonist. Libido enhancement for men and women.", typicalDose:"1-2mg", unit:"mg", frequency:"As needed", cycle:"As needed" },
    { name:"Kisspeptin-10", desc:"GnRH stimulator. Boosts LH/FSH and testosterone naturally.", typicalDose:"100-1000mcg", unit:"mcg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"AOD-9604", desc:"HGH fragment. Fat burning without GH side effects.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily", cycle:"8-12 weeks" },
    { name:"Fragment 176-191", desc:"Fat-burning HGH fragment. Lipolysis without IGF-1 elevation.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily", cycle:"8-12 weeks" },
  ],
  "Cardiovascular / Other": [
    { name:"Angiotensin 1-7", desc:"Cardioprotective. Vasodilation, anti-fibrotic, blood pressure support.", typicalDose:"1-2mg", unit:"mg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"VIP (Vasoactive Intestinal Peptide)", desc:"Anti-inflammatory, lung health, CIRS/mold illness protocols.", typicalDose:"50mcg", unit:"mcg", frequency:"Daily nasal", cycle:"Varies" },
    { name:"Custom", desc:"Add your own peptide with custom dosing.", typicalDose:"", unit:"mg", frequency:"", cycle:"" },
  ],
};

const SUPPLEMENT_LIBRARY = {
  Vitamins:["Vitamin A","Vitamin B1 (Thiamine)","Vitamin B2 (Riboflavin)","Vitamin B3 (Niacin)","Vitamin B5 (Pantothenic Acid)","Vitamin B6","Vitamin B7 (Biotin)","Vitamin B9 (Folate)","Vitamin B12","Vitamin C","Vitamin D3","Vitamin E","Vitamin K2","Multivitamin"],
  Minerals:["Magnesium Glycinate","Magnesium Citrate","Magnesium Threonate","Zinc","Iron","Calcium","Potassium","Selenium","Copper","Chromium","Iodine","Manganese","Boron"],
  Performance:["Creatine Monohydrate","Protein Powder","Electrolytes","Beta Alanine","L-Citrulline","L-Arginine","L-Carnitine","Taurine","Glutamine","EAAs","BCAAs","Beet Root","HMB","Betaine"],
  HeartHealth:["Fish Oil","Omega-3","Krill Oil","CoQ10","Garlic Extract","Red Yeast Rice","Hawthorn Berry","Cod Liver Oil"],
  Sleep:["Melatonin","L-Theanine","GABA","5-HTP","Valerian Root","Passionflower","Chamomile"],
  GutHealth:["Probiotic","Prebiotic Fiber","Digestive Enzymes","Psyllium Husk","Apple Cider Vinegar","Slippery Elm","Aloe Vera","Fiber Supplement"],
  Longevity:["NAC","Alpha Lipoic Acid","Resveratrol","Quercetin","Astaxanthin","Berberine","Milk Thistle","TUDCA","PQQ","Spermidine","NMN","Nicotinamide Riboside (NR)"],
  WeightLoss:["Green Tea Extract","Glucomannan","CLA","Caffeine"],
  JointHealth:["Collagen","Glucosamine","Chondroitin","MSM","Hyaluronic Acid","Turmeric"],
  HormoneSupport:["DHEA","Pregnenolone","DIM","Tongkat Ali","Fadogia Agrestis","Saw Palmetto","Maca Root"],
  Herbs:["Ashwagandha","Rhodiola","Ginseng","Holy Basil","Ginkgo Biloba","Elderberry","Echinacea"],
  Other:["MCT Oil","CBD","Custom"],
};
const ALL_SUPPLEMENTS = Object.values(SUPPLEMENT_LIBRARY).flat();
const ALL_PEPTIDES = Object.values(PEPTIDE_LIBRARY).flat();

const CALC_PRESETS = [
  { name:"Retatrutide", commonDoses:[0.5,1.0,2.0,3.0,5.0], unit:"mg" },
  { name:"Semaglutide", commonDoses:[0.25,0.5,1.0,2.0], unit:"mg" },
  { name:"Tirzepatide", commonDoses:[2.5,5.0,10.0,15.0], unit:"mg" },
  { name:"MOTS-c", commonDoses:[5.0,10.0], unit:"mg" },
  { name:"BPC-157", commonDoses:[250,500,1000], unit:"mcg" },
  { name:"TB-500", commonDoses:[2.0,5.0,10.0], unit:"mg" },
  { name:"CJC-1295", commonDoses:[1.0,2.0], unit:"mg" },
  { name:"Ipamorelin", commonDoses:[100,200,300], unit:"mcg" },
  { name:"Custom", commonDoses:[], unit:"mg" },
];

function todayISO() { return new Date().toISOString().slice(0,10); }
function daysBetween(a,b) { return Math.max(0,Math.floor((new Date(b)-new Date(a))/86400000)); }
function weeksBetween(a,b) { return Math.max(1,daysBetween(a,b)/7); }
function getWeekNumber(a,b) { return Math.floor(daysBetween(a,b)/7)+1; }
function pctLost(w) { return (((START_WEIGHT-w)/START_WEIGHT)*100).toFixed(1); }
function uid() { return Date.now()+Math.floor(Math.random()*10000); }

function usePersistedState(key,seed) {
  const [data,setData] = useState(() => {
    try { const s=localStorage.getItem(key); if(s) return JSON.parse(s); } catch {}
    return seed;
  });
  const update = useCallback((val) => {
    setData(prev => {
      const next=typeof val==="function"?val(prev):val;
      try { localStorage.setItem(key,JSON.stringify(next)); } catch {}
      return next;
    });
  },[key]);
  return [data,update];
}

function useApiKey() {
  const [key,setKey] = useState(() => { try { return localStorage.getItem("reta_api_key")||""; } catch { return ""; } });
  const update = useCallback((val) => {
    try { if(val) localStorage.setItem("reta_api_key",val); else localStorage.removeItem("reta_api_key"); } catch {}
    setKey(val);
  },[]);
  return [key,update];
}

async function callClaude(apiKey,body) {
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2000,...body})});
  if(!res.ok){const e=await res.text();throw new Error(`API error ${res.status}: ${e.slice(0,200)}`);}
  return await res.json();
}

function SearchBar({placeholder,value,onChange,onClear,accent}) {
  return (
    <div style={{position:"relative",marginBottom:14}}>
      <Search size={15} color="#64748b" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
      <input style={{width:"100%",boxSizing:"border-box",background:"#020617",border:`1px solid ${accent}44`,color:"#f8fafc",borderRadius:12,padding:"10px 36px",fontSize:14,fontFamily:"Inter,Arial,sans-serif",outline:"none"}} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/>
      {value&&<button onClick={onClear} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#64748b",display:"flex",alignItems:"center"}}><X size={14}/></button>}
    </div>
  );
}

function LogList({items,render,onRemove}) {
  if(!items.length) return <div style={{color:"#475569",padding:16,textAlign:"center"}}>No entries yet</div>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {items.map(item=>(
        <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,background:"#020617",border:"1px solid #1e293b",borderRadius:8,padding:"10px 12px",fontSize:13}}>
          <span style={{flex:1,lineHeight:1.5}}>{render(item)}</span>
          <button style={{background:"transparent",color:"#ef4444",border:"1px solid #450a0a",borderRadius:6,cursor:"pointer",padding:"3px 8px",fontSize:11,flexShrink:0}} onClick={()=>onRemove(item.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

function WeightLineChart({weights,color}) {
  const points=weights.slice(-10);
  if(points.length<2) return null;
  const values=points.map(w=>Number(w.weight));
  const minV=Math.min(...values)-0.5; const maxV=Math.max(...values)+0.5;
  const W=360;const H=160;const pL=44;const pR=16;const pT=20;const pB=32;
  const x=i=>pL+(i/Math.max(1,points.length-1))*(W-pL-pR);
  const y=v=>pT+((maxV-v)/Math.max(0.01,maxV-minV))*(H-pT-pB);
  const lineStr=points.map((p,i)=>`${x(i).toFixed(1)},${y(Number(p.weight)).toFixed(1)}`).join(" ");
  const fillStr=`${lineStr} ${x(points.length-1).toFixed(1)},${(H-pB).toFixed(1)} ${pL},${(H-pB).toFixed(1)}`;
  const yTicks=[minV+0.5,(minV+maxV)/2,maxV-0.5];
  return (
    <div style={{width:"100%",overflowX:"hidden"}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:H,display:"block"}}>
        {yTicks.map((v,i)=><line key={i} x1={pL} y1={y(v)} x2={W-pR} y2={y(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>)}
        <polygon points={fillStr} fill={`${color}18`}/>
        <polyline points={lineStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {points.map((p,i)=>(
          <g key={p.id||i}>
            <circle cx={x(i)} cy={y(Number(p.weight))} r="3.5" fill={color}/>
            {(i===0||i===points.length-1||points.length<=5)&&<text x={x(i)} y={y(Number(p.weight))-9} textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontWeight="600">{p.weight}</text>}
            <text x={x(i)} y={H-pB+14} textAnchor="middle" fill="#64748b" fontSize="8.5">{p.date.slice(5)}</text>
          </g>
        ))}
        {yTicks.map((v,i)=><text key={i} x={pL-4} y={y(v)+3} textAnchor="end" fill="#475569" fontSize="8.5">{v.toFixed(0)}</text>)}
      </svg>
    </div>
  );
}

function PeptideCalculator({theme,DS}) {
  const [peptide,setPeptide]=useState(CALC_PRESETS[0].name);
  const [vialMg,setVialMg]=useState("10");
  const [bacMl,setBacMl]=useState("2");
  const [dose,setDose]=useState("1");
  const [unit,setUnit]=useState("mg");
  const [syringe,setSyringe]=useState("100");
  const [custom,setCustom]=useState("");
  const preset=CALC_PRESETS.find(p=>p.name===peptide)||CALC_PRESETS[0];
  const vN=parseFloat(vialMg)||0;const bN=parseFloat(bacMl)||0;const dN=parseFloat(dose)||0;
  const conc=bN>0?vN/bN:0;
  const dMg=unit==="mcg"?dN/1000:dN;
  const injectMl=conc>0?dMg/conc:0;
  const injectU=injectMl/(1/parseFloat(syringe));
  const dosesPerVial=dMg>0?vN/dMg:0;
  const valid=conc>0&&dMg>0&&injectMl>0;
  const pillA={background:"#1e3a5f",border:`1px solid ${theme.primary}`,color:theme.primary,borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"monospace"};
  const pill={background:"#0f172a",border:"1px solid #1e293b",color:"#64748b",borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"monospace"};
  return (
    <div>
      <div style={DS.panel}>
        <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧮 Reconstitution Calculator</h2>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Peptide</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {CALC_PRESETS.map(p=><button key={p.name} style={peptide===p.name?pillA:pill} onClick={()=>{setPeptide(p.name);setUnit(p.unit);if(p.commonDoses.length)setDose(String(p.commonDoses[0]))}}>{p.name}</button>)}
          </div>
          {peptide==="Custom"&&<input style={{...DS.input,marginTop:8}} placeholder="Custom name" value={custom} onChange={e=>setCustom(e.target.value)}/>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:16}}>
          <div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Vial (mg)</div><input style={{background:"#020617",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"monospace",width:"100%",boxSizing:"border-box"}} type="number" step="0.5" value={vialMg} onChange={e=>setVialMg(e.target.value)}/></div>
          <div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>BAC Water (mL)</div><input style={{background:"#020617",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"monospace",width:"100%",boxSizing:"border-box"}} type="number" step="0.5" value={bacMl} onChange={e=>setBacMl(e.target.value)}/></div>
          <div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Dose</div><div style={{display:"flex",gap:6}}><input style={{background:"#020617",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"monospace",flex:1,boxSizing:"border-box"}} type="number" step="0.1" value={dose} onChange={e=>setDose(e.target.value)}/><select style={{background:"#020617",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"9px 6px",fontSize:14,fontFamily:"monospace",width:72}} value={unit} onChange={e=>setUnit(e.target.value)}><option value="mg">mg</option><option value="mcg">mcg</option></select></div></div>
          <div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Syringe</div><select style={{background:"#020617",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:"monospace",width:"100%",boxSizing:"border-box"}} value={syringe} onChange={e=>setSyringe(e.target.value)}><option value="100">100u (1mL)</option><option value="50">50u (0.5mL)</option><option value="30">30u (0.3mL)</option></select></div>
        </div>
        {preset.commonDoses.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Quick dose</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{preset.commonDoses.map(d=><button key={d} style={dose===String(d)?pillA:pill} onClick={()=>setDose(String(d))}>{d} {preset.unit}</button>)}</div></div>}
        {valid?(
          <div style={{background:"#020617",border:"1px solid #1e3a5f",borderRadius:12,padding:16,marginTop:8}}>
            <div style={{fontSize:13,color:"#60a5fa",fontFamily:"monospace",marginBottom:14,fontWeight:700}}>📐 Results — {peptide==="Custom"?(custom||"Custom"):peptide}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:16}}>
              {[["Concentration",conc.toFixed(4),"mg/mL","#60a5fa"],["Inject volume",injectMl.toFixed(4),"mL",theme.primary],["Syringe mark",injectU.toFixed(1),`units (${syringe}U)`,"#f59e0b"],["Doses/vial",dosesPerVial.toFixed(1),"injections","#a78bfa"]].map(([l,v,u,c])=>(
                <div key={l} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:10,padding:12}}>
                  <div style={{fontSize:10,color:"#475569",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{u}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5}}>Syringe fill</span><span style={{color:"#f59e0b",fontFamily:"monospace",fontSize:13}}>{Math.min(100,(injectU/+syringe)*100).toFixed(1)}%</span></div>
            <div style={{background:"#1e293b",borderRadius:999,height:22,overflow:"hidden"}}><div style={{height:"100%",borderRadius:999,width:`${Math.min(100,(injectU/+syringe)*100)}%`,background:injectU>+syringe?"#ef4444":"linear-gradient(90deg,#f59e0b,#fb923c)"}}/></div>
          </div>
        ):<div style={{color:"#475569",padding:16,textAlign:"center",fontFamily:"monospace",fontSize:13}}>Fill in all fields</div>}
      </div>
      <div style={DS.panel}>
        <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧊 Storage & Safety</h2>
        {[["Unreconstituted","Freezer (-20C). Protect from light. Stable 12-24 months."],["Reconstituted","Refrigerate 2-8C. Stable 4-8 weeks. Label with date."],["BAC Water","0.9% benzyl alcohol. Inject slowly down side of vial."],["Mixing","Gently swirl, never shake. Shaking degrades peptides."],["Injection","Subcutaneous into belly, love handles, or thigh. Rotate."],["Hygiene","Alcohol swab before each draw. Fresh needle every time."]].map(([t,b])=>(
          <div key={t} style={{display:"flex",gap:14,alignItems:"flex-start",background:"#020617",border:"1px solid #1e293b",borderRadius:10,padding:14,marginBottom:10}}>
            <div><div style={{fontWeight:700,marginBottom:4,fontSize:14,color:"#e2e8f0"}}>{t}</div><div style={{color:"#64748b",fontSize:13,lineHeight:1.5}}>{b}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function App() {
  const [weights,setWeights]=usePersistedState("mr_weights",[]);
  const [peptideStack,setPeptideStack]=usePersistedState("mr_peptide_stack",[]);
  const [peptideLogs,setPeptideLogs]=usePersistedState("mr_peptide_logs",{});
  const [foods,setFoods]=usePersistedState("mr_foods",[]);
  const [workouts,setWorkouts]=usePersistedState("mr_workouts",[]);
  const [mySupplements,setMySupplements]=usePersistedState("my_supplements_v2",[]);
  const [takenToday,setTakenToday]=usePersistedState("supp_taken_"+todayISO(),[]);
  const [apiKey,setApiKey]=useApiKey();
  const [themeName,setThemeName]=usePersistedState("axion_theme","green");
  const theme=THEMES[themeName]||THEMES.green;

  const [tab,setTab]=useState("dashboard");
  const [saved,setSaved]=useState("");
  const [showSettings,setShowSettings]=useState(false);
  const [tempKey,setTempKey]=useState("");
  const [setupForm,setSetupForm]=useState({name:"",heightFeet:"",heightInches:"",startWeight:"",targetWeight:"",startDate:todayISO(),activityLevel:"moderate"});

  const [weightForm,setWeightForm]=useState({date:todayISO(),weight:"",type:"morning",note:""});
  const [expandedWeightDay,setExpandedWeightDay]=useState(null);

  const [foodQuery,setFoodQuery]=useState("");
  const [foodSearchResults,setFoodSearchResults]=useState(null);
  const [foodSearchLoading,setFoodSearchLoading]=useState(false);
  const [foodSearchError,setFoodSearchError]=useState("");
  const [servingWeight,setServingWeight]=useState("");
  const [servingUnit,setServingUnit]=useState("g");
  const [foodDate,setFoodDate]=useState(todayISO());
  const [manualFood,setManualFood]=useState({item:"",calories:"",protein:"",carbs:"",fat:"",fiber:""});
  const [foodMode,setFoodMode]=useState("search");
  const [labelImage,setLabelImage]=useState(null);
  const [aiScanLoading,setAiScanLoading]=useState(false);
  const [aiScanError,setAiScanError]=useState("");
  const [scanServingNote,setScanServingNote]=useState("");

  const [workoutForm,setWorkoutForm]=useState({date:todayISO(),type:"",minutes:"",note:""});
  const [insightLoading,setInsightLoading]=useState(false);
  const [aiInsight,setAiInsight]=useState("");

  const [suppView,setSuppView]=useState("my");
  const [suppActiveCat,setSuppActiveCat]=useState(null);
  const [pendingSupp,setPendingSupp]=useState(null);
  const [editingSupp,setEditingSupp]=useState(null);
  const [suppForm,setSuppForm]=useState({dose:"",unit:"mg",schedule:"Daily",time:"Morning"});
  const [suppSearch,setSuppSearch]=useState("");

  const [pepView,setPepView]=useState("stack");
  const [pepActiveCat,setPepActiveCat]=useState(null);
  const [pendingPep,setPendingPep]=useState(null);
  const [editingPep,setEditingPep]=useState(null);
  const [pepForm,setPepForm]=useState({dose:"",unit:"mg",frequency:"",cycle:"",notes:"",status:"active"});
  const [pepSearch,setPepSearch]=useState("");

  const [doseTab,setDoseTab]=useState(null);
  const [doseForm,setDoseForm]=useState({date:todayISO(),dose:"",note:""});

  const sortedWeights=useMemo(()=>(weights||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[weights]);
  const latestWeight=sortedWeights[sortedWeights.length-1]||{id:0,date:todayISO(),weight:START_WEIGHT||0};
  const lowestWeight=sortedWeights.length?Math.min(...sortedWeights.map(w=>+w.weight)):START_WEIGHT;
  const totalLost=START_WEIGHT-+latestWeight.weight;
  const remainingToGoal=+latestWeight.weight-TARGET_WEIGHT;
  const avgPerWeek=totalLost/weeksBetween(START_DATE,latestWeight.date);
  const progressPct=Math.max(0,Math.min(100,(totalLost/(START_WEIGHT-TARGET_WEIGHT))*100));
  const currentWeek=getWeekNumber(START_DATE,todayISO());
  const activePhase=RETA_PHASES.find(p=>{const [s,e]=p.weeks.split("-").map(Number);return currentWeek>=s&&currentWeek<=e;})||RETA_PHASES[0];

  const today=todayISO();
  const todayFoods=(foods||[]).filter(f=>f.date===today);
  const todayCals=todayFoods.reduce((s,f)=>s++(f.calories||0),0);
  const todayProtein=todayFoods.reduce((s,f)=>s++(f.protein||0),0);
  const todayWorkouts=(workouts||[]).filter(w=>w.date===today);
  const todayMinutes=todayWorkouts.reduce((s,w)=>s++(w.minutes||0),0);

  const pace=avgPerWeek>0?avgPerWeek:0;
  const projectedWeeksToGoal=pace>0?Math.ceil(Math.max(0,Number(latestWeight.weight)-TARGET_WEIGHT)/pace):999;
  const projectedGoalDate=new Date();projectedGoalDate.setDate(projectedGoalDate.getDate()+projectedWeeksToGoal*7);

  const streak=useMemo(()=>{
    const allDates=new Set([...(weights||[]).map(w=>w.date),...(foods||[]).map(f=>f.date),...(workouts||[]).map(w=>w.date),...Object.values(peptideLogs||{}).flat().map(l=>l.date)]);
    let count=0;let d=new Date();
    while(true){const iso=d.toISOString().slice(0,10);if(allDates.has(iso)){count++;d.setDate(d.getDate()-1);}else break;}
    return count;
  },[weights,foods,workouts,peptideLogs]);

  const weightsByDay=useMemo(()=>{const map={};(weights||[]).forEach(w=>{if(!map[w.date])map[w.date]=[];map[w.date].push(w);});return map;},[weights]);
  const weightDays=useMemo(()=>Object.keys(weightsByDay).sort((a,b)=>new Date(b)-new Date(a)),[weightsByDay]);

  const suppSearchResults=useMemo(()=>{if(!suppSearch.trim())return[];const q=suppSearch.toLowerCase();return ALL_SUPPLEMENTS.filter(s=>s.toLowerCase().includes(q)).slice(0,20);},[suppSearch]);
  const pepSearchResults=useMemo(()=>{if(!pepSearch.trim())return[];const q=pepSearch.toLowerCase();return ALL_PEPTIDES.filter(p=>p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q)).slice(0,10);},[pepSearch]);

  const activityMultipliers={sedentary:11,light:12,moderate:13,active:14,very_active:15};
  const estimatedCalories=setupForm.startWeight?Math.round((Number(setupForm.startWeight)*activityMultipliers[setupForm.activityLevel])-500):0;

  function flash(msg){setSaved(msg);setTimeout(()=>setSaved(""),2000);}

  function addWeight(){if(!weightForm.weight)return;setWeights([...(weights||[]),{...weightForm,id:uid(),weight:+weightForm.weight}]);setWeightForm({date:todayISO(),weight:"",type:"morning",note:""});flash("Weight saved ✓");}

  function calcNutrition(per100g,weightG){const r=weightG/100;return{calories:Math.round((per100g.calories||0)*r),protein:+((per100g.protein||0)*r).toFixed(1),carbs:+((per100g.carbs||0)*r).toFixed(1),fat:+((per100g.fat||0)*r).toFixed(1),fiber:+((per100g.fiber||0)*r).toFixed(1),sugar:+((per100g.sugar||0)*r).toFixed(1),sodium:+((per100g.sodium||0)*r).toFixed(0)};}

  async function searchFood(){
    if(!foodQuery.trim())return;
    if(!apiKey){setFoodSearchError("Add your API key in Settings to search foods.");return;}
    setFoodSearchLoading(true);setFoodSearchError("");setFoodSearchResults(null);
    try{
      const data=await callClaude(apiKey,{system:`You are a precise nutrition database. Return detailed nutrition facts per 100g for any food. For name-brand packaged foods (Oreos, Quest Bar, Chobani, etc) use actual label data. Return ONLY valid JSON: {"food":"Official name","brand":"brand name or null","is_packaged":true/false,"per_100g":{"calories":n,"protein":n,"carbs":n,"fat":n,"fiber":n,"sugar":n,"sodium":n},"serving_sizes":[{"label":"1 cup (240g)","weight_g":240}],"notes":"any note"}`,messages:[{role:"user",content:foodQuery}]});
      const parsed=JSON.parse(data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim());
      setFoodSearchResults(parsed);setServingWeight("");
    }catch(e){setFoodSearchError("Search failed: "+e.message);}
    setFoodSearchLoading(false);
  }

  function logSearchedFood(){
    if(!foodSearchResults||!servingWeight)return;
    const wg=servingUnit==="oz"?parseFloat(servingWeight)*28.35:parseFloat(servingWeight);
    if(!wg||wg<=0)return;
    const n=calcNutrition(foodSearchResults.per_100g,wg);
    setFoods(prev=>[...(prev||[]),{id:uid(),date:foodDate,item:foodSearchResults.food+(foodSearchResults.brand?` (${foodSearchResults.brand})`:""),weight_g:wg,...n}]);
    setFoodQuery("");setFoodSearchResults(null);setServingWeight("");
    flash("Food logged ✓");
  }

  function addManualFood(){if(!manualFood.item)return;setFoods(prev=>[...(prev||[]),{id:uid(),date:foodDate,item:manualFood.item,weight_g:null,calories:+(manualFood.calories||0),protein:+(manualFood.protein||0),carbs:+(manualFood.carbs||0),fat:+(manualFood.fat||0),fiber:+(manualFood.fiber||0)}]);setManualFood({item:"",calories:"",protein:"",carbs:"",fat:"",fiber:""});flash("Food logged ✓");}

  async function scanLabel(){
    if(!labelImage||!apiKey){setAiScanError("Add API key in Settings.");return;}
    setAiScanLoading(true);setAiScanError("");
    try{
      const base64=labelImage.split(",")[1];const mediaType=labelImage.split(";")[0].split(":")[1];
      const data=await callClaude(apiKey,{system:`Nutrition analyst. Identify this food/label. Return ONLY JSON: {"food":"name","brand":"brand or null","per_100g":{"calories":n,"protein":n,"carbs":n,"fat":n,"fiber":n,"sugar":n,"sodium":n},"serving_sizes":[{"label":"1 serving (Xg)","weight_g":X}],"notes":"how identified"}`,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mediaType,data:base64}},{type:"text",text:scanServingNote?`I had approximately: ${scanServingNote}`:"Identify this food and give nutrition facts per 100g."}]}]});
      const parsed=JSON.parse(data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim());
      setFoodSearchResults(parsed);setFoodMode("search");setLabelImage(null);
    }catch(e){setAiScanError("Scan failed: "+e.message);}
    setAiScanLoading(false);
  }

  function addWorkout(){if(!workoutForm.type)return;setWorkouts([...(workouts||[]),{...workoutForm,id:uid(),minutes:+(workoutForm.minutes||0)}]);setWorkoutForm({date:todayISO(),type:"",minutes:"",note:""});flash("Workout saved ✓");}

  function toggleTaken(id){setTakenToday(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);}
  function addSupplement(){if(!pendingSupp)return;setMySupplements(prev=>[...prev,{id:uid(),name:pendingSupp.name,category:pendingSupp.category,dose:suppForm.dose||"—",unit:suppForm.dose?suppForm.unit:"",schedule:suppForm.schedule,time:suppForm.time}]);setSuppView("my");setPendingSupp(null);setSuppForm({dose:"",unit:"mg",schedule:"Daily",time:"Morning"});}
  function saveSuppEdit(){setMySupplements(prev=>prev.map(s=>s.id===editingSupp.id?{...s,dose:suppForm.dose||"—",unit:suppForm.dose?suppForm.unit:"",schedule:suppForm.schedule,time:suppForm.time}:s));setEditingSupp(null);setSuppView("my");}
  function deleteSupp(id){setMySupplements(prev=>prev.filter(s=>s.id!==id));setTakenToday(prev=>prev.filter(x=>x!==id));setEditingSupp(null);setSuppView("my");}

  function addPeptideToStack(){if(!pendingPep)return;setPeptideStack(prev=>[...prev,{id:uid(),name:pendingPep.name,category:pendingPep.category,desc:pendingPep.desc,dose:pepForm.dose||"—",unit:pepForm.unit||pendingPep.unit||"mg",frequency:pepForm.frequency||pendingPep.frequency||"",cycle:pepForm.cycle||pendingPep.cycle||"",notes:pepForm.notes,status:pepForm.status,dateAdded:todayISO()}]);setPepView("stack");setPendingPep(null);setPepForm({dose:"",unit:"mg",frequency:"",cycle:"",notes:"",status:"active"});flash("Peptide added ✓");}
  function savePepEdit(){setPeptideStack(prev=>prev.map(p=>p.id===editingPep.id?{...p,dose:pepForm.dose||"—",unit:pepForm.unit,frequency:pepForm.frequency,cycle:pepForm.cycle,notes:pepForm.notes,status:pepForm.status}:p));setEditingPep(null);setPepView("stack");}
  function deletePep(id){setPeptideStack(prev=>prev.filter(p=>p.id!==id));setPeptideLogs(prev=>{const n={...prev};delete n[id];return n;});setEditingPep(null);setPepView("stack");}
  function logPeptideDose(peptideId){if(!doseForm.dose)return;setPeptideLogs(prev=>({...prev,[peptideId]:[...(prev[peptideId]||[]),{id:uid(),date:doseForm.date,dose:+doseForm.dose,note:doseForm.note}]}));setDoseForm({date:todayISO(),dose:"",note:""});flash("Dose logged ✓");}
  function removePeptideDose(peptideId,entryId){setPeptideLogs(prev=>({...prev,[peptideId]:(prev[peptideId]||[]).filter(e=>e.id!==entryId)}));}

  async function getAIInsight(){
    if(sortedWeights.length<2||!apiKey){setAiInsight(!apiKey?"Add API key in Settings.":"Add a second weight entry to unlock.");return;}
    setInsightLoading(true);setAiInsight("");
    const activeStack=(peptideStack||[]).filter(p=>p.status==="active").map(p=>`${p.name} ${p.dose}${p.unit} ${p.frequency}`).join(", ");
    const recentFoods=(foods||[]).slice(-5).map(f=>`${f.item} (${f.calories}cal/${f.protein}p)`).join(", ");
    const recentWorkouts=(workouts||[]).slice(-5).map(w=>`${w.type} ${w.minutes}min`).join(", ");
    try{const data=await callClaude(apiKey,{messages:[{role:"user",content:`Clinical health analyst. Peptide stack: ${activeStack||"none"}. Weight: ${START_WEIGHT}->${latestWeight.weight}lbs (${totalLost.toFixed(1)}lbs lost, ${pctLost(latestWeight.weight)}%). Week ${currentWeek}, ${activePhase.phase} phase. Avg loss: ${avgPerWeek.toFixed(2)} lbs/wk. Food: ${recentFoods||"none"}. Training: ${recentWorkouts||"none"}. Write 3-4 sentence personalized breakdown. Clinical but warm. Reference specific numbers.`}]});setAiInsight(data.content?.map(b=>b.text||"").join("")||"Unable to generate insight.");}catch(e){setAiInsight("Insight unavailable: "+e.message);}
    setInsightLoading(false);
  }

  const TABS=["dashboard","weight","doses","peptides","food","workouts","supplements","calculator"];
  const ICONS={dashboard:Zap,weight:Scale,doses:Syringe,peptides:Dna,food:Utensils,workouts:Dumbbell,supplements:Pill,calculator:Calculator};

  const DS={
    page:{minHeight:"100vh",background:`radial-gradient(circle at top,${theme.bg} 0%,#020403 24%,#000000 72%)`,color:"#f8fafc",padding:"42px 12px 48px",fontFamily:"Inter,Arial,sans-serif",maxWidth:430,margin:"0 auto"},
    panel:{background:"linear-gradient(145deg,rgba(0,0,0,0.98),rgba(2,8,5,0.98))",border:`1px solid ${theme.border}`,borderRadius:26,padding:20,marginBottom:18,boxShadow:`0 0 26px ${theme.glow}`},
    card:{background:"linear-gradient(145deg,rgba(0,0,0,0.98),rgba(2,8,5,0.98))",border:`1px solid ${theme.border}`,borderRadius:22,padding:18,boxShadow:`0 0 22px ${theme.glow}`},
    btn:{gridColumn:"2",background:`linear-gradient(135deg,${theme.primaryDark},${theme.primary})`,color:"#020617",border:"none",borderRadius:12,padding:"12px 16px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"monospace",letterSpacing:1,marginTop:4,boxShadow:`0 0 22px ${theme.glowStrong}`},
    input:{background:"#000000",border:`1px solid ${theme.border}`,color:"#f8fafc",borderRadius:12,padding:"11px 13px",fontSize:14,fontFamily:"Inter,Arial,sans-serif",width:"100%",boxSizing:"border-box",outline:"none"},
    activeTab:{flex:"1 1 80px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"17px 8px",background:`linear-gradient(145deg,rgba(0,0,0,1),${theme.tabBg})`,border:`1px solid ${theme.primary}`,borderRadius:20,cursor:"pointer",color:theme.primary,fontFamily:"monospace",boxShadow:`0 0 24px ${theme.glowStrong}`,transform:"translateY(-2px)",transition:"all 0.18s ease"},
    pillActive:{background:"#1e3a5f",border:`1px solid ${theme.primary}`,color:theme.primary,borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"monospace"},
    goalBarFill:{height:"100%",background:`linear-gradient(90deg,${theme.primaryDark},${theme.primary})`,borderRadius:999},
    goalCircle:{width:110,height:110,borderRadius:"50%",border:"2px solid #1e293b",background:"radial-gradient(circle,#020617 45%,#0f172a 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",justifySelf:"center",boxShadow:`0 0 0 6px ${theme.glow},inset 0 0 24px ${theme.glow}`},
  };

  const pill={background:"#0f172a",border:"1px solid #1e293b",color:"#64748b",borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"monospace"};
  const formGrid={display:"grid",gridTemplateColumns:"120px 1fr",gap:"8px 12px",alignItems:"center",marginBottom:16};
  const formLabel={fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,textAlign:"right"};

  if(!HAS_SETUP){
    return (
      <div style={DS.page}>
        <div style={DS.panel}>
          <h1 style={{margin:"0 0 16px",fontSize:28,fontWeight:900,color:"#f8fafc"}}>Welcome to AXION</h1>
          <div style={formGrid}>
            <label style={formLabel}>Name</label><input style={DS.input} value={setupForm.name} onChange={e=>setSetupForm({...setupForm,name:e.target.value})}/>
            <label style={formLabel}>Height</label>
            <div style={{display:"flex",gap:8}}><input style={DS.input} type="number" placeholder="Feet" value={setupForm.heightFeet} onChange={e=>setSetupForm({...setupForm,heightFeet:e.target.value})}/><input style={DS.input} type="number" placeholder="Inches" value={setupForm.heightInches} onChange={e=>setSetupForm({...setupForm,heightInches:e.target.value})}/></div>
            <label style={formLabel}>Start Weight</label><input style={DS.input} type="number" value={setupForm.startWeight} onChange={e=>setSetupForm({...setupForm,startWeight:e.target.value})}/>
            <label style={formLabel}>Goal Weight</label><input style={DS.input} type="number" value={setupForm.targetWeight} onChange={e=>setSetupForm({...setupForm,targetWeight:e.target.value})}/>
            <label style={formLabel}>Start Date</label><input style={DS.input} type="date" value={setupForm.startDate} onChange={e=>setSetupForm({...setupForm,startDate:e.target.value})}/>
            <label style={formLabel}>Activity</label>
            <select style={DS.input} value={setupForm.activityLevel} onChange={e=>setSetupForm({...setupForm,activityLevel:e.target.value})}><option value="sedentary">Sedentary</option><option value="light">Light 1-3x/wk</option><option value="moderate">Moderate 3-5x/wk</option><option value="active">Active 6-7x/wk</option><option value="very_active">Very active</option></select>
            {estimatedCalories>0&&<div style={{gridColumn:"1/-1",marginTop:8,padding:14,borderRadius:16,border:`1px solid ${theme.primary}`,background:"rgba(20,83,45,0.18)",color:theme.primary,fontSize:14,fontFamily:"monospace"}}>Estimated target: {estimatedCalories} cal/day for ~1 lb/week loss.</div>}
            <button style={DS.btn} onClick={()=>{localStorage.setItem("tracker_name",setupForm.name);localStorage.setItem("tracker_height_feet",setupForm.heightFeet);localStorage.setItem("tracker_height_inches",setupForm.heightInches);localStorage.setItem("tracker_start_weight",setupForm.startWeight);localStorage.setItem("tracker_target_weight",setupForm.targetWeight);localStorage.setItem("tracker_start_date",setupForm.startDate);localStorage.setItem("tracker_activity_level",setupForm.activityLevel);localStorage.setItem("tracker_calorie_target",estimatedCalories);localStorage.setItem("tracker_setup_complete","true");location.reload();}}>Start AXION</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={DS.page}>
      <header style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:22,textAlign:"center"}}>
        <div style={{marginTop:55,fontSize:58,lineHeight:0.9,fontWeight:900,letterSpacing:13,color:"#f8fafc",fontFamily:"Impact,Arial Black,sans-serif",textTransform:"uppercase"}}>AXION</div>
      </header>
      <div style={{position:"absolute",top:50,right:18}}>
       <button onClick={()=>{setTempKey(apiKey);setShowSettings(true);}} style={{width:54,height:54,borderRadius:16,background:`linear-gradient(145deg,rgba(0,0,0,0.96),${theme.primaryDark}55)`,border:`1px solid ${theme.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 0 22px ${theme.glow}`}}>
          <Settings size={22} strokeWidth={2.2} color={theme.primary}/>
        </button>
      </div>

      {saved&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#14532d",color:theme.primary,border:`1px solid ${theme.primary}`,borderRadius:8,padding:"8px 20px",fontSize:13,fontFamily:"monospace",zIndex:200}}>{saved}</div>}

      {showSettings&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowSettings(false)}>
          <div style={{background:"#0f172a",border:`1px solid ${theme.border}`,borderRadius:14,padding:20,maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <h2 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>⚙️ Settings</h2>
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}><b style={{color:theme.primary}}>Theme Color</b></div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {Object.entries(THEMES).map(([k,t])=>(
                <button key={k} onClick={()=>setThemeName(k)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:`2px solid ${themeName===k?t.primary:"#1e293b"}`,background:themeName===k?t.primary+"22":"#020617",cursor:"pointer",color:t.primary,fontSize:10,fontFamily:"monospace",fontWeight:700}}>
                  <div style={{width:16,height:16,borderRadius:"50%",background:t.primary,margin:"0 auto 4px"}}/>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}><b style={{color:theme.primary}}>Anthropic API Key</b></div>
            <input type="password" style={DS.input} placeholder="sk-ant-api03-..." value={tempKey} onChange={e=>setTempKey(e.target.value)}/>
            <div style={{fontSize:11,color:"#64748b",marginTop:6,fontFamily:"monospace"}}>Get a key at console.anthropic.com. ~$5 credit lasts months.</div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button style={{...DS.btn,gridColumn:"unset",flex:1}} onClick={()=>{setApiKey(tempKey.trim());setShowSettings(false);flash(tempKey.trim()?"API key saved ✓":"API key cleared");}}>Save</button>
              {apiKey&&<button style={{...DS.btn,gridColumn:"unset",background:"#7f1d1d"}} onClick={()=>{setApiKey("");setTempKey("");setShowSettings(false);flash("Key cleared");}}>Clear</button>}
              <button style={{...DS.btn,gridColumn:"unset",background:"#1e293b",color:"#94a3b8"}} onClick={()=>setShowSettings(false)}>Cancel</button>
            </div>
            <div style={{marginTop:12,fontSize:11,color:"#64748b",fontFamily:"monospace"}}>Status: {apiKey?<span style={{color:theme.primary}}>✓ AI active</span>:<span style={{color:"#fb7185"}}>✗ No key</span>}</div>
          </div>
        </div>
      )}

      {/* GOAL CARD */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 120px 1fr",alignItems:"center",gap:12,background:`radial-gradient(circle at center,${theme.bg},rgba(0,0,0,0.98) 58%)`,border:`1px solid ${theme.border}`,borderRadius:24,padding:"26px 18px 20px",marginBottom:20,boxShadow:`0 0 36px ${theme.glow}`}}>
        <div style={{textAlign:"left"}}><div><span style={{fontSize:34,fontWeight:900,color:"#f8fafc",fontFamily:"Impact,Arial Black,sans-serif"}}>{START_WEIGHT}</span><span style={{marginLeft:6,fontSize:15,fontWeight:800,color:"#f8fafc",fontFamily:"monospace"}}>LBS</span></div><div style={{marginTop:6,fontSize:11,color:"#94a3b8",letterSpacing:1.5,fontFamily:"monospace"}}>START</div></div>
        <div style={DS.goalCircle}><div style={{fontSize:29,fontWeight:900,color:theme.primary,fontFamily:"monospace"}}>{progressPct.toFixed(1)}%</div><div style={{fontSize:11,color:"#cbd5e1",letterSpacing:1.5,fontFamily:"monospace"}}>TO GOAL</div></div>
        <div style={{textAlign:"right"}}><div><span style={{fontSize:34,fontWeight:900,color:"#f8fafc",fontFamily:"Impact,Arial Black,sans-serif"}}>{TARGET_WEIGHT}</span><span style={{marginLeft:6,fontSize:15,fontWeight:800,color:"#f8fafc",fontFamily:"monospace"}}>LBS</span></div><div style={{marginTop:6,fontSize:11,color:"#94a3b8",letterSpacing:1.5,fontFamily:"monospace"}}>GOAL</div></div>
        <div style={{gridColumn:"1/4",height:8,background:"#111827",border:"1px solid #1f2937",borderRadius:999,overflow:"hidden",marginTop:8}}><div style={{...DS.goalBarFill,width:`${progressPct}%`}}/></div>
        <div style={{gridColumn:"1/4",display:"flex",justifyContent:"space-between",color:"#94a3b8",fontFamily:"monospace",fontSize:11}}><span>{START_WEIGHT}</span><span style={{color:theme.primary}}>NOW: {latestWeight.weight}</span><span>{TARGET_WEIGHT}</span></div>
        <div style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:18,paddingTop:16,borderTop:`1px solid ${theme.border}`}}>
          <div style={{textAlign:"center"}}><span style={{display:"block",color:"#64748b",fontSize:9,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>PROJECTED</span><strong style={{color:"#f8fafc",fontSize:18,fontWeight:900}}>{projectedGoalDate.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</strong></div>
          <div style={{textAlign:"center"}}><span style={{display:"block",color:"#64748b",fontSize:9,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>PACE</span><strong style={{color:"#f8fafc",fontSize:18,fontWeight:900}}>{avgPerWeek>0?avgPerWeek.toFixed(2):"--"} lb/wk</strong></div>
          <div style={{textAlign:"center"}}><span style={{display:"block",color:"#64748b",fontSize:9,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>WKS LEFT</span><strong style={{color:"#f8fafc",fontSize:18,fontWeight:900}}>{projectedWeeksToGoal<999?projectedWeeksToGoal:"--"}</strong></div>
        </div>
      </div>

      {/* TABS */}
     <nav style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {TABS.map(t=>{const Icon=ICONS[t];return(
          <button key={t} onClick={()=>setTab(t)} style={tab===t?DS.activeTab:{flex:"1 1 80px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"17px 8px",background:"linear-gradient(145deg,#000000,#020806)",border:`1px solid ${theme.border}`,borderRadius:20,cursor:"pointer",color:theme.primary+"99",fontFamily:"monospace",transition:"all 0.18s ease"}}>
            <Icon size={28} strokeWidth={1.8} color={tab===t?theme.primary:theme.primary+"99"}/>
            <span style={{fontSize:11,textTransform:"capitalize"}}>{t}</span>
          </button>
        );})}
      </nav>
            {/* DASHBOARD */}
      {tab==="dashboard"&&<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
          {[["Current",`${latestWeight.weight}`,"lbs"],["Lowest",`${lowestWeight}`,"lbs"],["Lost",`${totalLost.toFixed(1)}`,"lbs"],["% BW",`${pctLost(latestWeight.weight)}`,"%"],["Avg/wk",`${avgPerWeek>0?avgPerWeek.toFixed(2):"0.00"}`,"lbs"],[`To ${TARGET_WEIGHT}`,`${remainingToGoal.toFixed(1)}`,"lbs"],["Protein",`${todayProtein}`,"g"],["Calories",`${todayCals}`,"kcal"]].map(([l,v,u])=>(
            <div key={l} style={DS.card}><div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:1.5,fontFamily:"monospace",marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:900,lineHeight:1,color:theme.primary}}>{v}<span style={{fontSize:13,fontWeight:400}}> {u}</span></div></div>
          ))}
        </div>

        <div style={DS.panel}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <Flame size={36} color={theme.primary}/>
            <div><div style={{fontSize:36,fontWeight:900,color:theme.primary,lineHeight:1,fontFamily:"monospace"}}>{streak}</div><div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace",letterSpacing:1.5,marginTop:4}}>DAY STREAK</div></div>
            <div style={{marginLeft:"auto",fontSize:11,color:"#475569",fontFamily:"monospace",textAlign:"right",lineHeight:1.6}}>Log weight, food,<br/>workouts or doses<br/>to keep streak alive</div>
          </div>
        </div>

        {(peptideStack||[]).filter(p=>p.status==="active").length>0&&(
          <div style={DS.panel}>
            <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧬 Active Peptides</h2>
            {(peptideStack||[]).filter(p=>p.status==="active").map(p=>(
              <div key={p.id} style={{background:"#020617",border:"1px solid #1e293b",borderLeft:`3px solid ${theme.primary}`,borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                <div style={{fontWeight:700,color:theme.primary,fontSize:14}}>{p.name}</div>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{p.dose}{p.unit} · {p.frequency}</div>
              </div>
            ))}
          </div>
        )}

        <div style={DS.panel}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h2 style={{margin:0,fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧠 AI Health Breakdown</h2>
            <button onClick={getAIInsight} disabled={insightLoading||sortedWeights.length<2} style={{background:"#1e3a5f",color:"#60a5fa",border:"1px solid #60a5fa",borderRadius:10,padding:"6px 14px",cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700,opacity:insightLoading?0.6:1}}>{insightLoading?"ANALYZING...":"GENERATE"}</button>
          </div>
          {aiInsight?<div style={{background:"#020617",border:"1px solid #1e3a5f",borderRadius:10,padding:14,color:"#cbd5e1",fontSize:13,lineHeight:1.7}}>{aiInsight}</div>
          :<div style={{color:"#475569",fontSize:12,fontFamily:"monospace",fontStyle:"italic"}}>{sortedWeights.length<2?"Add a second weight entry to unlock.":!apiKey?"Add API key in Settings.":"Click GENERATE for a breakdown."}</div>}
        </div>

        {sortedWeights.length>1&&<div style={DS.panel}><h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>Weight Trend</h2><WeightLineChart weights={sortedWeights} color={theme.primary}/></div>}

        <div style={{background:"#0f172a",border:"1px solid #854d0e",borderLeft:"4px solid #f59e0b",borderRadius:10,padding:14,color:"#94a3b8",fontSize:13,display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
          <span style={{fontSize:18}}>⚠️</span><span>If energy tanks, digestion stalls, or workouts fall apart — hydrate, hit protein, add carbs, sleep, keep dose changes disciplined.</span>
        </div>
      </>}

      {/* WEIGHT */}
      {tab==="weight"&&(
        <div style={DS.panel}>
          <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>Weight Log</h2>
          <div style={formGrid}>
            <label style={formLabel}>Date</label><input style={DS.input} type="date" value={weightForm.date} onChange={e=>setWeightForm({...weightForm,date:e.target.value})}/>
            <label style={formLabel}>Weight (lbs)</label><input style={DS.input} type="number" step="0.1" placeholder="e.g. 221.8" value={weightForm.weight} onChange={e=>setWeightForm({...weightForm,weight:e.target.value})}/>
            <label style={formLabel}>Type</label><select style={DS.input} value={weightForm.type} onChange={e=>setWeightForm({...weightForm,type:e.target.value})}>{["morning","post-bathroom","pre-bathroom","bedtime","other"].map(o=><option key={o}>{o}</option>)}</select>
            <label style={formLabel}>Note</label><input style={DS.input} placeholder="Optional" value={weightForm.note} onChange={e=>setWeightForm({...weightForm,note:e.target.value})}/>
            <button style={DS.btn} onClick={addWeight}>+ Add Weight</button>
          </div>
          {weightDays.length===0&&<div style={{color:"#475569",padding:16,textAlign:"center"}}>No entries yet</div>}
{(()=>{
  const currentMonth=todayISO().slice(0,7);
  const monthMap={};
  weightDays.forEach(day=>{
    const m=day.slice(0,7);
    if(!monthMap[m])monthMap[m]=[];
    monthMap[m].push(day);
  });
  const months=Object.keys(monthMap).sort((a,b)=>b.localeCompare(a));
  return months.map(month=>{
    const days=monthMap[month];
    const isCurrent=month===currentMonth;
    const monthLabel=new Date(month+"-01T12:00:00").toLocaleDateString("en-US",{month:"long",year:"numeric"});
    const monthEntries=days.flatMap(d=>weightsByDay[d]);
    const monthAvg=(monthEntries.reduce((s,e)=>s+Number(e.weight),0)/monthEntries.length).toFixed(1);
    const isMonthOpen=expandedWeightDay===("month_"+month);

    if(isCurrent){
      return days.map(day=>{
        const entries=weightsByDay[day];
        const avg=(entries.reduce((s,e)=>s+Number(e.weight),0)/entries.length).toFixed(1);
        const isOpen=expandedWeightDay===day;
        return(
          <div key={day} style={{background:"#020617",border:`1px solid ${isOpen?theme.primary+"66":"#1e293b"}`,borderRadius:12,marginBottom:8,overflow:"hidden"}}>
            <button onClick={()=>setExpandedWeightDay(isOpen?null:day)} style={{width:"100%",background:"none",border:"none",padding:"12px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{textAlign:"left"}}>
                <div style={{fontWeight:700,color:"#e2e8f0",fontSize:14}}>{new Date(day+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{entries.length} entr{entries.length===1?"y":"ies"} · avg {avg} lbs</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16,fontWeight:900,color:theme.primary}}>{avg} lbs</span>
                {isOpen?<ChevronUp size={16} color="#64748b"/>:<ChevronDown size={16} color="#64748b"/>}
              </div>
            </button>
            {isOpen&&(
              <div style={{padding:"0 14px 12px"}}>
                {entries.map(e=>(
                  <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:"1px solid #1e293b"}}>
                    <div><span style={{color:theme.primary,fontWeight:700}}>{e.weight} lbs</span><span style={{color:"#64748b",fontSize:11,fontFamily:"monospace",marginLeft:8}}>{e.type}{e.note?` · ${e.note}`:""}</span></div>
                    <button style={{background:"transparent",color:"#ef4444",border:"1px solid #450a0a",borderRadius:6,cursor:"pointer",padding:"3px 8px",fontSize:11}} onClick={()=>setWeights((weights||[]).filter(x=>x.id!==e.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      });
    }

    return(
      <div key={month} style={{marginBottom:8}}>
        <button onClick={()=>setExpandedWeightDay(isMonthOpen?null:"month_"+month)} style={{width:"100%",background:`linear-gradient(145deg,#020617,${theme.primary}11)`,border:`1px solid ${isMonthOpen?theme.primary+"66":theme.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{textAlign:"left"}}>
            <div style={{fontWeight:700,color:theme.primary,fontSize:15}}>{monthLabel}</div>
            <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:2}}>{monthEntries.length} entries · {days.length} days · avg {monthAvg} lbs</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14,fontWeight:900,color:"#94a3b8"}}>{monthAvg} lbs</span>
            {isMonthOpen?<ChevronUp size={16} color={theme.primary}/>:<ChevronDown size={16} color={theme.primary}/>}
          </div>
        </button>
        {isMonthOpen&&(
          <div style={{paddingLeft:8,marginTop:4}}>
            {days.map(day=>{
              const entries=weightsByDay[day];
              const avg=(entries.reduce((s,e)=>s+Number(e.weight),0)/entries.length).toFixed(1);
              const isOpen=expandedWeightDay===day;
              return(
                <div key={day} style={{background:"#020617",border:`1px solid ${isOpen?theme.primary+"66":"#1e293b"}`,borderRadius:10,marginBottom:6,overflow:"hidden"}}>
                  <button onClick={()=>setExpandedWeightDay(isOpen?null:day)} style={{width:"100%",background:"none",border:"none",padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{textAlign:"left"}}>
                      <div style={{fontWeight:700,color:"#e2e8f0",fontSize:13}}>{new Date(day+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                      <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{entries.length} entr{entries.length===1?"y":"ies"} · avg {avg} lbs</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:14,fontWeight:900,color:theme.primary}}>{avg} lbs</span>
                      {isOpen?<ChevronUp size={14} color="#64748b"/>:<ChevronDown size={14} color="#64748b"/>}
                    </div>
                  </button>
                  {isOpen&&(
                    <div style={{padding:"0 14px 10px"}}>
                      {entries.map(e=>(
                        <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:"1px solid #1e293b"}}>
                          <div><span style={{color:theme.primary,fontWeight:700}}>{e.weight} lbs</span><span style={{color:"#64748b",fontSize:11,fontFamily:"monospace",marginLeft:8}}>{e.type}{e.note?` · ${e.note}`:""}</span></div>
                          <button style={{background:"transparent",color:"#ef4444",border:"1px solid #450a0a",borderRadius:6,cursor:"pointer",padding:"3px 8px",fontSize:11}} onClick={()=>setWeights((weights||[]).filter(x=>x.id!==e.id))}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  });
})()}
        </div>
      )}

      {/* DOSES */}
      {tab==="doses"&&(
        <div>
          {(peptideStack||[]).length===0&&<div style={{...DS.panel,textAlign:"center",color:"#475569",fontFamily:"monospace"}}>No peptides in your stack yet. Add peptides in the Peptides tab first.</div>}
          {(peptideStack||[]).map(pep=>{
            const logs=(peptideLogs[pep.id]||[]).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
            const total=logs.reduce((s,l)=>s+Number(l.dose||0),0);
            const isActive=doseTab===pep.id;
            const sc={active:theme.primary,planned:"#fbbf24",completed:"#64748b"};
            return(
              <div key={pep.id} style={{...DS.panel,borderLeft:`3px solid ${sc[pep.status]||"#475569"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:sc[pep.status]}}>{pep.name}</div>
                    <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{pep.dose}{pep.unit} · {pep.frequency} · Total: {total.toFixed(3)}{pep.unit}</div>
                  </div>
                  <button onClick={()=>setDoseTab(isActive?null:pep.id)} style={{background:isActive?"#1e293b":"#1e3a5f",color:isActive?"#94a3b8":"#60a5fa",border:`1px solid ${isActive?"#334155":"#60a5fa"}`,borderRadius:10,padding:"6px 14px",cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700}}>{isActive?"Close":"+ Log Dose"}</button>
                </div>
                {isActive&&(
                  <div style={{background:"#020617",border:"1px solid #1e293b",borderRadius:12,padding:14,marginBottom:12}}>
                    <div style={formGrid}>
                      <label style={formLabel}>Date</label><input style={DS.input} type="date" value={doseForm.date} onChange={e=>setDoseForm({...doseForm,date:e.target.value})}/>
                      <label style={formLabel}>Dose ({pep.unit})</label><input style={DS.input} type="number" step="0.025" placeholder={pep.dose} value={doseForm.dose} onChange={e=>setDoseForm({...doseForm,dose:e.target.value})}/>
                      <label style={formLabel}>Note</label><input style={DS.input} placeholder="Optional" value={doseForm.note} onChange={e=>setDoseForm({...doseForm,note:e.target.value})}/>
                      <button style={DS.btn} onClick={()=>logPeptideDose(pep.id)}>+ Log Dose</button>
                    </div>
                  </div>
                )}
                {logs.length>0?(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {logs.slice(0,10).map(l=>(
                      <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,background:"#020617",border:"1px solid #1e293b",borderRadius:8,padding:"10px 12px",fontSize:13}}>
                        <span style={{flex:1}}><b style={{color:"#fb7185"}}>{l.dose} {pep.unit}</b> · {l.date}{l.note?` · ${l.note}`:""}</span>
                        <button style={{background:"transparent",color:"#ef4444",border:"1px solid #450a0a",borderRadius:6,cursor:"pointer",padding:"3px 8px",fontSize:11}} onClick={()=>removePeptideDose(pep.id,l.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                ):<div style={{color:"#475569",fontSize:12,fontFamily:"monospace"}}>No doses logged yet.</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* PEPTIDES */}
      {tab==="peptides"&&(
        <div style={DS.panel}>
          <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧬 Peptides</h2>
          {(pepView==="stack"||pepView==="cats"||pepView==="items")&&(
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <button onClick={()=>{setPepView("stack");setPepSearch("");}} style={pepView==="stack"?DS.pillActive:pill}>My Stack ({(peptideStack||[]).length})</button>
              <button onClick={()=>{setPepView("cats");setPepSearch("");}} style={(pepView==="cats"||pepView==="items")?DS.pillActive:pill}>Library</button>
            </div>
          )}

          {pepView==="stack"&&<>
            {(peptideStack||[]).length===0&&<div style={{color:"#475569",fontSize:13,fontFamily:"monospace",padding:"12px 0"}}>No peptides yet. Browse the library to add.</div>}
            {(peptideStack||[]).map(p=>{
              const sc={active:theme.primary,planned:"#fbbf24",completed:"#64748b"};
              const logs=peptideLogs[p.id]||[];
              const total=logs.reduce((s,l)=>s+Number(l.dose||0),0);
              return(
                <div key={p.id} style={{background:"#020617",border:"1px solid #1e293b",borderLeft:`3px solid ${sc[p.status]||"#475569"}`,borderRadius:12,padding:14,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:15,fontWeight:700,color:sc[p.status]}}>{p.name}</span>
                        <span style={{fontSize:10,fontFamily:"monospace",background:sc[p.status]+"22",color:sc[p.status],borderRadius:4,padding:"2px 7px"}}>{p.status.toUpperCase()}</span>
                      </div>
                      <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:4}}>{p.dose}{p.unit} · {p.frequency}{p.cycle?` · ${p.cycle}`:""}</div>
                      <div style={{fontSize:11,color:"#475569",fontFamily:"monospace",marginTop:2}}>Total: {total.toFixed(3)}{p.unit} · {logs.length} doses</div>
                      {p.notes&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4,fontStyle:"italic"}}>{p.notes}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>{setEditingPep(p);setPepForm({dose:p.dose==="—"?"":p.dose,unit:p.unit,frequency:p.frequency,cycle:p.cycle,notes:p.notes||"",status:p.status});setPepView("edit");}} style={{background:"#0f172a",border:"1px solid #1e293b",color:"#60a5fa",cursor:"pointer",borderRadius:6,padding:"4px 8px",fontSize:11}}>Edit</button>
                      <button onClick={()=>deletePep(p.id)} style={{background:"transparent",border:"1px solid #450a0a",color:"#ef4444",cursor:"pointer",borderRadius:6,padding:"4px 8px",fontSize:11}}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button style={{...DS.btn,marginTop:8}} onClick={()=>setPepView("cats")}>+ Add Peptide</button>
          </>}

          {pepView==="edit"&&editingPep&&(
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#f8fafc",marginBottom:14}}>{editingPep.name}</div>
              <div style={formGrid}>
                <label style={formLabel}>Dose</label><div style={{display:"flex",gap:6}}><input style={{...DS.input,flex:1}} type="number" step="0.1" value={pepForm.dose} onChange={e=>setPepForm({...pepForm,dose:e.target.value})}/><select style={{...DS.input,width:80}} value={pepForm.unit} onChange={e=>setPepForm({...pepForm,unit:e.target.value})}>{["mg","mcg","g","IU","mL"].map(u=><option key={u}>{u}</option>)}</select></div>
                <label style={formLabel}>Frequency</label><input style={DS.input} value={pepForm.frequency} onChange={e=>setPepForm({...pepForm,frequency:e.target.value})}/>
                <label style={formLabel}>Cycle</label><input style={DS.input} value={pepForm.cycle} onChange={e=>setPepForm({...pepForm,cycle:e.target.value})}/>
                <label style={formLabel}>Status</label><select style={DS.input} value={pepForm.status} onChange={e=>setPepForm({...pepForm,status:e.target.value})}>{["active","planned","completed"].map(o=><option key={o}>{o}</option>)}</select>
                <label style={formLabel}>Notes</label><input style={DS.input} value={pepForm.notes} onChange={e=>setPepForm({...pepForm,notes:e.target.value})}/>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...DS.btn,gridColumn:"unset",flex:1,background:"#7f1d1d"}} onClick={()=>deletePep(editingPep.id)}>Remove</button>
                <button style={{...DS.btn,gridColumn:"unset",flex:1}} onClick={savePepEdit}>Save changes</button>
              </div>
              <button style={{...DS.btn,gridColumn:"unset",width:"100%",marginTop:8,background:"#1e293b",color:"#94a3b8"}} onClick={()=>{setPepView("stack");setEditingPep(null);}}>Cancel</button>
            </div>
          )}

          {pepView==="cats"&&(
            <>
              <button style={{...DS.btn,gridColumn:"unset",background:"#020617",border:"1px solid #334155",color:"#94a3b8",marginBottom:12}} onClick={()=>setPepView("stack")}>← Back to Stack</button>
              <SearchBar placeholder="Search all peptides..." value={pepSearch} onChange={setPepSearch} onClear={()=>setPepSearch("")} accent={theme.primary}/>
              {pepSearch?(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {pepSearchResults.length===0&&<div style={{color:"#475569",fontSize:13,fontFamily:"monospace"}}>No results for "{pepSearch}"</div>}
                  {pepSearchResults.map(pep=>{
                    const cat=Object.entries(PEPTIDE_LIBRARY).find(([,v])=>v.some(p=>p.name===pep.name))?.[0];
                    return(
                      <button key={pep.name} onClick={()=>{setPendingPep({...pep,category:cat});setPepForm({dose:"",unit:pep.unit||"mg",frequency:pep.frequency||"",cycle:pep.cycle||"",notes:"",status:"active"});setPepView("add");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:12,padding:"12px 14px",color:"#e2e8f0",textAlign:"left",cursor:"pointer"}}>
                        <div style={{fontWeight:700,fontSize:14}}>{pep.name}</div>
                        <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:2}}>{pep.typicalDose} · {pep.frequency}</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:4,lineHeight:1.5}}>{pep.desc}</div>
                      </button>
                    );
                  })}
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {Object.keys(PEPTIDE_LIBRARY).map(cat=>(
                    <button key={cat} onClick={()=>{setPepActiveCat(cat);setPepView("items");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:14,padding:14,color:"#f8fafc",textAlign:"left",cursor:"pointer"}}>
                      <div style={{fontSize:13,fontWeight:700}}>{cat}</div>
                      <div style={{marginTop:4,fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{PEPTIDE_LIBRARY[cat].length} peptides</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {pepView==="items"&&pepActiveCat&&(
            <>
              <button style={{...DS.btn,gridColumn:"unset",background:"#020617",border:"1px solid #334155",color:"#94a3b8",marginBottom:12}} onClick={()=>setPepView("cats")}>← Back</button>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {PEPTIDE_LIBRARY[pepActiveCat].map(pep=>(
                  <button key={pep.name} onClick={()=>{setPendingPep({...pep,category:pepActiveCat});setPepForm({dose:"",unit:pep.unit||"mg",frequency:pep.frequency||"",cycle:pep.cycle||"",notes:"",status:"active"});setPepView("add");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:12,padding:"12px 14px",color:"#e2e8f0",textAlign:"left",cursor:"pointer"}}>
                    <div style={{fontWeight:700,fontSize:14}}>{pep.name}</div>
                    <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:2}}>{pep.typicalDose} · {pep.frequency}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:4,lineHeight:1.5}}>{pep.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {pepView==="add"&&pendingPep&&(
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#f8fafc",marginBottom:4}}>{pendingPep.name}</div>
              <div style={{fontSize:12,color:"#64748b",fontFamily:"monospace",marginBottom:14,lineHeight:1.5}}>{pendingPep.desc}</div>
              <div style={{background:"#020617",border:"1px solid #1e293b",borderRadius:8,padding:10,marginBottom:14,fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>Typical: {pendingPep.typicalDose} · {pendingPep.frequency} · Cycle: {pendingPep.cycle}</div>
              <div style={formGrid}>
                <label style={formLabel}>Dose</label><div style={{display:"flex",gap:6}}><input style={{...DS.input,flex:1}} type="number" step="0.1" placeholder={pendingPep.typicalDose} value={pepForm.dose} onChange={e=>setPepForm({...pepForm,dose:e.target.value})}/><select style={{...DS.input,width:80}} value={pepForm.unit} onChange={e=>setPepForm({...pepForm,unit:e.target.value})}>{["mg","mcg","g","IU","mL"].map(u=><option key={u}>{u}</option>)}</select></div>
                <label style={formLabel}>Frequency</label><input style={DS.input} placeholder={pendingPep.frequency} value={pepForm.frequency} onChange={e=>setPepForm({...pepForm,frequency:e.target.value})}/>
                <label style={formLabel}>Cycle</label><input style={DS.input} placeholder={pendingPep.cycle} value={pepForm.cycle} onChange={e=>setPepForm({...pepForm,cycle:e.target.value})}/>
                <label style={formLabel}>Status</label><select style={DS.input} value={pepForm.status} onChange={e=>setPepForm({...pepForm,status:e.target.value})}>{["active","planned","completed"].map(o=><option key={o}>{o}</option>)}</select>
                <label style={formLabel}>Notes</label><input style={DS.input} placeholder="Protocol notes..." value={pepForm.notes} onChange={e=>setPepForm({...pepForm,notes:e.target.value})}/>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...DS.btn,gridColumn:"unset",flex:1,background:"#1e293b",color:"#94a3b8"}} onClick={()=>{setPepView("items");setPendingPep(null);}}>Cancel</button>
                <button style={{...DS.btn,gridColumn:"unset",flex:1}} onClick={addPeptideToStack}>Add to Stack</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOD */}
      {tab==="food"&&(
        <div>
          <div style={DS.panel}>
            <div style={{display:"flex",gap:6,marginBottom:16}}>
              {[["search","🔍 Search"],["ai","📷 Scan"],["manual","✏️ Manual"]].map(([m,l])=>(
                <button key={m} onClick={()=>setFoodMode(m)} style={{flex:1,padding:"9px 4px",borderRadius:10,border:`1px solid ${foodMode===m?theme.primary:"#334155"}`,background:foodMode===m?theme.primary+"22":"#020617",color:foodMode===m?theme.primary:"#64748b",cursor:"pointer",fontSize:11,fontFamily:"monospace",fontWeight:700}}>{l}</button>
              ))}
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Date</div>
              <input style={DS.input} type="date" value={foodDate} onChange={e=>setFoodDate(e.target.value)}/>
            </div>

            {foodMode==="search"&&<>
              {!apiKey&&<div style={{background:"#451a03",border:"1px solid #fb923c",borderRadius:8,padding:12,marginBottom:12,fontSize:12,color:"#fb923c",fontFamily:"monospace"}}>Add your API key in Settings to enable food search</div>}
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input style={{...DS.input,flex:1}} placeholder={`"Oreo cookies", "chicken breast", "Chobani vanilla yogurt"`} value={foodQuery} onChange={e=>setFoodQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchFood()}/>
                <button style={{...DS.btn,gridColumn:"unset",minWidth:80,opacity:foodSearchLoading?0.6:1}} onClick={searchFood} disabled={foodSearchLoading}>{foodSearchLoading?"...":"Search"}</button>
              </div>
              {foodSearchError&&<div style={{color:"#ef4444",fontSize:13,fontFamily:"monospace",marginBottom:8}}>{foodSearchError}</div>}
              {foodSearchResults&&(
                <div style={{background:"#020617",border:`1px solid ${theme.primary}44`,borderRadius:14,padding:16,marginTop:8}}>
                  <div style={{fontWeight:700,fontSize:16,color:"#f8fafc"}}>{foodSearchResults.food}</div>
                  {foodSearchResults.brand&&<div style={{fontSize:12,color:"#64748b",fontFamily:"monospace",marginBottom:8}}>{foodSearchResults.brand}{foodSearchResults.is_packaged?" · Packaged":""}</div>}
                  <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace",marginBottom:12}}>Per 100g: {foodSearchResults.per_100g.calories} cal · {foodSearchResults.per_100g.protein}g pro · {foodSearchResults.per_100g.carbs}g carb · {foodSearchResults.per_100g.fat}g fat</div>
                  {foodSearchResults.serving_sizes&&foodSearchResults.serving_sizes.length>0&&(
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Quick select serving</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {foodSearchResults.serving_sizes.map(sv=>(
                          <button key={sv.label} onClick={()=>{setServingWeight(String(sv.weight_g));setServingUnit("g");}} style={{background:servingWeight===String(sv.weight_g)?theme.primary+"22":"#0f172a",border:`1px solid ${servingWeight===String(sv.weight_g)?theme.primary:"#1e293b"}`,color:servingWeight===String(sv.weight_g)?theme.primary:"#94a3b8",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,fontFamily:"monospace"}}>{sv.label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
                    <input style={{...DS.input,flex:1}} type="number" placeholder="Enter amount" value={servingWeight} onChange={e=>setServingWeight(e.target.value)}/>
                    <select style={{...DS.input,width:70}} value={servingUnit} onChange={e=>setServingUnit(e.target.value)}><option value="g">g</option><option value="oz">oz</option></select>
                  </div>
                  {servingWeight&&parseFloat(servingWeight)>0&&(()=>{
                    const wg=servingUnit==="oz"?parseFloat(servingWeight)*28.35:parseFloat(servingWeight);
                    const n=calcNutrition(foodSearchResults.per_100g,wg);
                    return(
                      <div style={{background:"#0f172a",borderRadius:10,padding:12,marginBottom:12}}>
                        <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Nutrition for {servingWeight}{servingUnit}</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                          {[["Cal",n.calories,""],["Pro",n.protein,"g"],["Carb",n.carbs,"g"],["Fat",n.fat,"g"]].map(([l,v,u])=>(
                            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:theme.primary}}>{v}<span style={{fontSize:11}}>{u}</span></div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace"}}>{l}</div></div>
                          ))}
                        </div>
                        {n.fiber>0&&<div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:8}}>Fiber: {n.fiber}g · Sugar: {n.sugar}g · Sodium: {n.sodium}mg</div>}
                      </div>
                    );
                  })()}
                  <button style={{...DS.btn,gridColumn:"unset",width:"100%",opacity:(!servingWeight||parseFloat(servingWeight)<=0)?0.5:1}} onClick={logSearchedFood} disabled={!servingWeight||parseFloat(servingWeight)<=0}>+ Log This Food</button>
                  {foodSearchResults.notes&&<div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:8,fontStyle:"italic"}}>💬 {foodSearchResults.notes}</div>}
                </div>
              )}
            </>}

            {foodMode==="ai"&&<>
              {!apiKey&&<div style={{background:"#451a03",border:"1px solid #fb923c",borderRadius:8,padding:12,marginBottom:12,fontSize:12,color:"#fb923c",fontFamily:"monospace"}}>Add your API key in Settings to enable scanning</div>}
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <label style={{display:"block",background:"#0f172a",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"11px 16px",cursor:"pointer",fontFamily:"monospace",fontSize:13,fontWeight:700,flex:1,textAlign:"center"}}>📷 Take Photo<input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setLabelImage(ev.target.result);r.readAsDataURL(f);e.target.value="";}}/></label>
                <label style={{display:"block",background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",borderRadius:8,padding:"11px 16px",cursor:"pointer",fontFamily:"monospace",fontSize:13,fontWeight:700,flex:1,textAlign:"center"}}>🖼️ Upload<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setLabelImage(ev.target.result);r.readAsDataURL(f);e.target.value="";}}/></label>
              </div>
              {labelImage&&(
                <div style={{marginBottom:10}}>
                  <img src={labelImage} alt="Food" style={{maxWidth:"100%",maxHeight:220,borderRadius:8,border:"1px solid #1e293b",display:"block",marginBottom:8}}/>
                  <input style={{...DS.input,marginBottom:8}} placeholder='How much? e.g. "the whole can"' value={scanServingNote} onChange={e=>setScanServingNote(e.target.value)}/>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...DS.btn,gridColumn:"unset",flex:1,opacity:aiScanLoading?0.6:1}} onClick={scanLabel} disabled={aiScanLoading}>{aiScanLoading?"Scanning...":"🔍 Scan & Identify"}</button>
                    <button style={{...DS.btn,gridColumn:"unset",background:"#7f1d1d",minWidth:60}} onClick={()=>{setLabelImage(null);setScanServingNote("");}}>✕</button>
                  </div>
                </div>
              )}
              {aiScanError&&<div style={{color:"#ef4444",fontSize:13,fontFamily:"monospace"}}>{aiScanError}</div>}
            </>}

            {foodMode==="manual"&&(
              <div style={formGrid}>
                <label style={formLabel}>Food name</label><input style={DS.input} placeholder="Chicken breast" value={manualFood.item} onChange={e=>setManualFood({...manualFood,item:e.target.value})}/>
                <label style={formLabel}>Calories</label><input style={DS.input} type="number" placeholder="165" value={manualFood.calories} onChange={e=>setManualFood({...manualFood,calories:e.target.value})}/>
                <label style={formLabel}>Protein (g)</label><input style={DS.input} type="number" placeholder="31" value={manualFood.protein} onChange={e=>setManualFood({...manualFood,protein:e.target.value})}/>
                <label style={formLabel}>Carbs (g)</label><input style={DS.input} type="number" placeholder="0" value={manualFood.carbs} onChange={e=>setManualFood({...manualFood,carbs:e.target.value})}/>
                <label style={formLabel}>Fat (g)</label><input style={DS.input} type="number" placeholder="3.6" value={manualFood.fat} onChange={e=>setManualFood({...manualFood,fat:e.target.value})}/>
                <label style={formLabel}>Fiber (g)</label><input style={DS.input} type="number" placeholder="0" value={manualFood.fiber} onChange={e=>setManualFood({...manualFood,fiber:e.target.value})}/>
                <button style={DS.btn} onClick={addManualFood}>+ Log Food</button>
              </div>
            )}
          </div>

          <div style={DS.panel}>
            <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>Today · {todayCals} cal · {todayProtein}g protein</h2>
            {(foods||[]).filter(f=>f.date===today).length===0&&<div style={{color:"#475569",fontSize:13,fontFamily:"monospace"}}>Nothing logged today.</div>}
            {[...(foods||[])].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(f=>(
              <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,background:"#020617",border:"1px solid #1e293b",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:"#f59e0b",fontSize:13}}>{f.item}</div>
                  <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{f.date} · {f.calories}cal · {f.protein}g pro · {f.carbs}g carb · {f.fat}g fat{f.fiber?` · ${f.fiber}g fiber`:""}</div>
                </div>
                <button style={{background:"transparent",color:"#ef4444",border:"1px solid #450a0a",borderRadius:6,cursor:"pointer",padding:"3px 8px",fontSize:11,flexShrink:0}} onClick={()=>setFoods((foods||[]).filter(x=>x.id!==f.id))}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WORKOUTS */}
      {tab==="workouts"&&(
        <div style={DS.panel}>
          <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>Workout Log · Today: {todayMinutes} min</h2>
          <div style={formGrid}>
            <label style={formLabel}>Date</label><input style={DS.input} type="date" value={workoutForm.date} onChange={e=>setWorkoutForm({...workoutForm,date:e.target.value})}/>
            <label style={formLabel}>Type</label><input style={DS.input} placeholder="cardio, weights, walk..." value={workoutForm.type} onChange={e=>setWorkoutForm({...workoutForm,type:e.target.value})}/>
            <label style={formLabel}>Minutes</label><input style={DS.input} type="number" placeholder="60" value={workoutForm.minutes} onChange={e=>setWorkoutForm({...workoutForm,minutes:e.target.value})}/>
            <label style={formLabel}>Notes</label><input style={DS.input} placeholder="Energy, PRs..." value={workoutForm.note} onChange={e=>setWorkoutForm({...workoutForm,note:e.target.value})}/>
            <button style={DS.btn} onClick={addWorkout}>+ Log Workout</button>
          </div>
          <LogList items={[...(workouts||[])].sort((a,b)=>new Date(b.date)-new Date(a.date))} render={w=><><b style={{color:"#60a5fa"}}>{w.type}</b> · {w.date} · {w.minutes} min{w.note?` · ${w.note}`:""}</>} onRemove={id=>setWorkouts((workouts||[]).filter(x=>x.id!==id))}/>
        </div>
      )}
            {/* SUPPLEMENTS */}
      {tab==="supplements"&&(
        <div style={DS.panel}>
          <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>💊 Supplements</h2>

          {(suppView==="my"||suppView==="cats"||suppView==="items")&&(
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",letterSpacing:1,marginBottom:10}}>MY SUPPLEMENTS</div>
              {mySupplements.length===0&&<div style={{color:"#475569",fontSize:13,fontFamily:"monospace",padding:"12px 0"}}>None saved yet. Browse the library below.</div>}
              {mySupplements.map(s=>{
                const taken=takenToday.includes(s.id);
                return(
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,background:taken?"#052e16":"#020617",border:`1px solid ${taken?theme.primary+"66":"#1e293b"}`,borderRadius:12,padding:"10px 14px",marginBottom:8,cursor:"pointer"}} onClick={()=>{setEditingSupp(s);setSuppForm({dose:s.dose==="—"?"":s.dose,unit:s.unit||"mg",schedule:s.schedule,time:s.time});setSuppView("detail");}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#e2e8f0"}}>{s.name}</div>
                      <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:2}}>{s.dose}{s.unit} · {s.schedule} · {s.time}</div>
                      {taken&&<div style={{fontSize:10,color:theme.primary,fontFamily:"monospace",marginTop:3}}>✓ TAKEN TODAY</div>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();toggleTaken(s.id);}} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${taken?theme.primary:"#334155"}`,background:taken?theme.primaryDark+"44":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:taken?theme.primary:"#475569",flexShrink:0}}>✓</button>
                  </div>
                );
              })}
            </div>
          )}

          {suppView==="detail"&&editingSupp&&(
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#f8fafc",marginBottom:14}}>{editingSupp.name}</div>
              <div style={formGrid}>
                <label style={formLabel}>Dose</label>
                <div style={{display:"flex",gap:6}}>
                  <input style={{...DS.input,flex:1}} type="number" placeholder="500" value={suppForm.dose} onChange={e=>setSuppForm({...suppForm,dose:e.target.value})}/>
                  <select style={{...DS.input,width:80}} value={suppForm.unit} onChange={e=>setSuppForm({...suppForm,unit:e.target.value})}>{["mg","mcg","g","IU","mL"].map(u=><option key={u}>{u}</option>)}</select>
                </div>
                <label style={formLabel}>Schedule</label>
                <select style={DS.input} value={suppForm.schedule} onChange={e=>setSuppForm({...suppForm,schedule:e.target.value})}>{["Daily","Twice daily","Every other day","Weekly","As needed"].map(o=><option key={o}>{o}</option>)}</select>
                <label style={formLabel}>Time</label>
                <select style={DS.input} value={suppForm.time} onChange={e=>setSuppForm({...suppForm,time:e.target.value})}>{["Morning","Afternoon","Evening","Night","With meals","Pre-workout","Post-workout"].map(o=><option key={o}>{o}</option>)}</select>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...DS.btn,gridColumn:"unset",flex:1,background:"#7f1d1d"}} onClick={()=>deleteSupp(editingSupp.id)}>Remove</button>
                <button style={{...DS.btn,gridColumn:"unset",flex:1}} onClick={saveSuppEdit}>Save changes</button>
              </div>
              <button style={{...DS.btn,gridColumn:"unset",width:"100%",marginTop:8,background:"#1e293b",color:"#94a3b8"}} onClick={()=>{setSuppView("my");setEditingSupp(null);}}>Cancel</button>
            </div>
          )}

          {suppView==="add"&&pendingSupp&&(
            <div>
              <div style={{fontWeight:800,fontSize:15,color:"#f8fafc",marginBottom:14}}>Add {pendingSupp.name}</div>
              <div style={formGrid}>
                <label style={formLabel}>Dose</label>
                <div style={{display:"flex",gap:6}}>
                  <input style={{...DS.input,flex:1}} type="number" placeholder="500" value={suppForm.dose} onChange={e=>setSuppForm({...suppForm,dose:e.target.value})}/>
                  <select style={{...DS.input,width:80}} value={suppForm.unit} onChange={e=>setSuppForm({...suppForm,unit:e.target.value})}>{["mg","mcg","g","IU","mL"].map(u=><option key={u}>{u}</option>)}</select>
                </div>
                <label style={formLabel}>Schedule</label>
                <select style={DS.input} value={suppForm.schedule} onChange={e=>setSuppForm({...suppForm,schedule:e.target.value})}>{["Daily","Twice daily","Every other day","Weekly","As needed"].map(o=><option key={o}>{o}</option>)}</select>
                <label style={formLabel}>Time</label>
                <select style={DS.input} value={suppForm.time} onChange={e=>setSuppForm({...suppForm,time:e.target.value})}>{["Morning","Afternoon","Evening","Night","With meals","Pre-workout","Post-workout"].map(o=><option key={o}>{o}</option>)}</select>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...DS.btn,gridColumn:"unset",flex:1,background:"#1e293b",color:"#94a3b8"}} onClick={()=>{setSuppView("my");setPendingSupp(null);}}>Cancel</button>
                <button style={{...DS.btn,gridColumn:"unset",flex:1}} onClick={addSupplement}>Save supplement</button>
              </div>
            </div>
          )}

          {(suppView==="my"||suppView==="cats")&&(
            <>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",letterSpacing:1,marginBottom:10,marginTop:4}}>LIBRARY</div>
              {suppView==="cats"&&<button style={{...DS.btn,gridColumn:"unset",background:"#020617",border:"1px solid #334155",color:"#94a3b8",marginBottom:10}} onClick={()=>setSuppView("my")}>← Back</button>}
              <SearchBar placeholder="Search all supplements..." value={suppSearch} onChange={setSuppSearch} onClear={()=>setSuppSearch("")} accent={theme.primary}/>
              {suppSearch?(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {suppSearchResults.length===0&&<div style={{color:"#475569",fontSize:13,fontFamily:"monospace"}}>No results for "{suppSearch}"</div>}
                  {suppSearchResults.map(item=>{
                    const cat=Object.entries(SUPPLEMENT_LIBRARY).find(([,v])=>v.includes(item))?.[0];
                    return(
                      <button key={item} onClick={()=>{setPendingSupp({name:item,category:cat});setSuppForm({dose:"",unit:"mg",schedule:"Daily",time:"Morning"});setSuppView("add");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:12,padding:"11px 14px",color:"#e2e8f0",fontWeight:700,textAlign:"left",cursor:"pointer"}}>
                        {item}<span style={{fontSize:10,color:"#64748b",fontFamily:"monospace",marginLeft:8}}>{cat?.replace(/([A-Z])/g," $1").trim()}</span>
                      </button>
                    );
                  })}
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {Object.keys(SUPPLEMENT_LIBRARY).map(cat=>(
                    <button key={cat} onClick={()=>{setSuppActiveCat(cat);setSuppView("items");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:14,padding:14,color:"#f8fafc",textAlign:"left",cursor:"pointer"}}>
                      <div style={{fontSize:14,fontWeight:700}}>{cat.replace(/([A-Z])/g," $1").trim()}</div>
                      <div style={{marginTop:4,fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{SUPPLEMENT_LIBRARY[cat].length} options</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {suppView==="items"&&suppActiveCat&&(
            <>
              <button style={{...DS.btn,gridColumn:"unset",background:"#020617",border:"1px solid #334155",color:"#94a3b8",marginBottom:12}} onClick={()=>setSuppView("cats")}>← Back</button>
              <div style={{fontSize:13,fontWeight:700,color:"#94a3b8",fontFamily:"monospace",marginBottom:10}}>{suppActiveCat.replace(/([A-Z])/g," $1").trim()}</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {SUPPLEMENT_LIBRARY[suppActiveCat].map(item=>(
                  <button key={item} onClick={()=>{setPendingSupp({name:item,category:suppActiveCat});setSuppForm({dose:"",unit:"mg",schedule:"Daily",time:"Morning"});setSuppView("add");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:12,padding:"11px 14px",color:"#e2e8f0",fontWeight:700,textAlign:"left",cursor:"pointer"}}>{item}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab==="calculator"&&<PeptideCalculator theme={theme} DS={DS}/>}
    </div>
  );
}
