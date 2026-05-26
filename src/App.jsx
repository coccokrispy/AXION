import { useMemo, useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────
// MICHAEL'S PROTOCOL
// ─────────────────────────────────────────────────────────────────────
const USER_NAME = localStorage.getItem("tracker_name") || "User";
const START_WEIGHT = 225;
const START_DATE = "2026-05-26";
const TARGET_WEIGHT = 200;
const DOSE_DAYS = [];
const DOSE_TIME = "";

const SEED_WEIGHTS = [];

const SEED_DOSES = [];

const SEED_PEPTIDES = [];

const RETA_PHASES = [
  { weeks: "1–4",   phase: "Initiation",    expected: "0–1%",  desc: "Body adapting. Appetite suppression begins. GI side effects most likely." },
  { weeks: "5–8",   phase: "Early Loss",    expected: "1–3%",  desc: "Metabolic shift via glucagon pathway. Fat oxidation increases." },
  { weeks: "9–16",  phase: "Active Loss",   expected: "3–8%",  desc: "Triple agonism in full effect. Visceral fat reduction, blood sugar improvements." },
  { weeks: "17–32", phase: "Acceleration",  expected: "8–15%", desc: "Sustained deficit. Insulin sensitivity markedly improved." },
  { weeks: "33–68", phase: "Peak Efficacy", expected: "15%+",  desc: "Continued progress. Plateau monitoring becomes important." },
];

const PEPTIDE_LIBRARY = [
  { name: "MOTS-c",       category: "Mitochondrial", color: "#f0abfc", typicalDose: "5mg",       frequency: "Weekly",          cycle: "8–12 wk on, 4mo off", synergy: "Excellent with Reta — AMPK activation complements GLP-1/GIP/glucagon pathway. Boosts fat oxidation and insulin sensitivity without overlap." },
  { name: "BPC-157",      category: "Tissue Repair", color: "#34d399", typicalDose: "250–500mcg", frequency: "Daily or BID",   cycle: "4–12 weeks",          synergy: "Helpful if GI side effects from Reta. Supports gut healing and joint recovery." },
  { name: "TB-500",       category: "Tissue Repair", color: "#38bdf8", typicalDose: "2–5mg",     frequency: "2x/wk loading",   cycle: "4–6 weeks",           synergy: "Recovery support during rapid recomposition." },
  { name: "CJC-1295/Ipamorelin", category: "GH Secretagogue", color: "#fb923c", typicalDose: "100–300mcg", frequency: "Pre-sleep daily", cycle: "8–12 weeks", synergy: "Preserves muscle during cut. Monitor appetite overlap with Reta." },
  { name: "Epitalon",     category: "Longevity",     color: "#a78bfa", typicalDose: "5–10mg",    frequency: "Daily x 10–20d",  cycle: "1–2 cycles/year",     synergy: "Complements MOTS-c for multi-pathway anti-aging." },
  { name: "Custom",       category: "Other",         color: "#94a3b8", typicalDose: "",          frequency: "",                cycle: "",                    synergy: "" },
];

const PEPTIDE_PRESETS = [
  { name: "Retatrutide", commonDoses: [0.5, 1.0, 2.0, 3.0, 5.0], unit: "mg" },
  { name: "MOTS-c",      commonDoses: [5.0, 10.0],               unit: "mg" },
  { name: "Semaglutide", commonDoses: [0.25, 0.5, 1.0, 2.0],     unit: "mg" },
  { name: "Tirzepatide", commonDoses: [2.5, 5.0, 10.0, 15.0],    unit: "mg" },
  { name: "BPC-157",     commonDoses: [250, 500, 1000],          unit: "mcg" },
  { name: "TB-500",      commonDoses: [2.0, 5.0, 10.0],          unit: "mg" },
  { name: "CJC-1295",    commonDoses: [1.0, 2.0],                unit: "mg" },
  { name: "Ipamorelin",  commonDoses: [100, 200, 300],           unit: "mcg" },
  { name: "Custom",      commonDoses: [],                        unit: "mg" },
];

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysBetween(start, end) { return Math.max(0, Math.floor((new Date(end) - new Date(start)) / 86400000)); }
function weeksBetween(start, end) { return Math.max(1, daysBetween(start, end) / 7); }
function getWeekNumber(start, end) { return Math.floor(daysBetween(start, end) / 7) + 1; }
function pctLost(w) { return (((START_WEIGHT - w) / START_WEIGHT) * 100).toFixed(1); }
function uid() { return Date.now() + Math.floor(Math.random() * 10000); }
function fmtDate(d) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function getNextDoseDays() {
  const today = new Date();
  const days = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (DOSE_DAYS.includes(d.getDay())) { days.push(d); if (days.length === 2) break; }
  }
  return days;
}

function getDoseAtDate(doses, date) {
  if (!doses || doses.length === 0) return 0;
  const sorted = [...doses].sort((a, b) => new Date(a.date) - new Date(b.date));
  let active = sorted[0].dose;
  for (const d of sorted) {
    if (new Date(d.date) <= new Date(date + "T23:59:59")) active = d.dose;
    else break;
  }
  return active;
}

// Persistent storage using localStorage (works in any browser/PWA)
function usePersistedState(key, seed) {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
    return seed;
  });
  const update = useCallback((val) => {
    setData(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [data, update];
}

// API key management
function useApiKey() {
  const [key, setKey] = useState(() => {
    try { return localStorage.getItem("reta_api_key") || ""; } catch { return ""; }
  });
  const update = useCallback((val) => {
    try {
      if (val) localStorage.setItem("reta_api_key", val);
      else localStorage.removeItem("reta_api_key");
    } catch {}
    setKey(val);
  }, []);
  return [key, update];
}

// Call Anthropic API directly
async function callClaude(apiKey, body) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, ...body })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err.slice(0, 200)}`);
  }
  return await res.json();
}

// ─────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [weights, setWeights]   = usePersistedState("mr_weights", SEED_WEIGHTS);
  const [doses, setDoses]       = usePersistedState("mr_doses", SEED_DOSES);
  const [peptides, setPeptides] = usePersistedState("mr_peptides", SEED_PEPTIDES);
  const [foods, setFoods]       = usePersistedState("mr_foods", []);
  const [workouts, setWorkouts] = usePersistedState("mr_workouts", []);
  const [apiKey, setApiKey]     = useApiKey();

  const [tab, setTab] = useState("dashboard");
  const [weightForm, setWeightForm]   = useState({ date: todayISO(), weight: "", type: "morning", note: "" });
  const [doseForm, setDoseForm]       = useState({ date: todayISO(), dose: "", note: "" });
  const [foodForm, setFoodForm]       = useState({ date: todayISO(), item: "", calories: "", protein: "" });
  const [workoutForm, setWorkoutForm] = useState({ date: todayISO(), type: "", minutes: "", note: "" });
  const [saved, setSaved] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState("");

  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [labelImage, setLabelImage] = useState(null);
  const [labelMode, setLabelMode] = useState("text");
  const [servingInput, setServingInput] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  const sortedWeights = useMemo(
    () => (weights || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date)),
    [weights]
  );

  const latestWeight = sortedWeights[sortedWeights.length - 1] || {
  id: 0,
  date: todayISO(),
  weight: START_WEIGHT || 0,
  type: "start",
  note: ""
};
  const lowestWeight = sortedWeights.length ? Math.min(...sortedWeights.map(w => +w.weight)) : START_WEIGHT;
  const totalLost = START_WEIGHT - +latestWeight.weight;
  const remainingToGoal = +latestWeight.weight - TARGET_WEIGHT;
  const avgPerWeek = totalLost / weeksBetween(START_DATE, latestWeight.date);
  const progressPct = Math.max(0, Math.min(100, (totalLost / (START_WEIGHT - TARGET_WEIGHT)) * 100));
  const currentWeek = getWeekNumber(START_DATE, todayISO());
  const currentDose = getDoseAtDate(doses, latestWeight.date);
  const activePhase = RETA_PHASES.find(p => {
    const [s, e] = p.weeks.split("–").map(Number);
    return currentWeek >= s && currentWeek <= e;
  }) || RETA_PHASES[0];

  const today = todayISO();
  const todayFoods = (foods || []).filter(f => f.date === today);
  const todayCals = todayFoods.reduce((s, f) => s + +(f.calories || 0), 0);
  const todayProtein = todayFoods.reduce((s, f) => s + +(f.protein || 0), 0);
  const todayWorkouts = (workouts || []).filter(w => w.date === today);
  const todayMinutes = todayWorkouts.reduce((s, w) => s + +(w.minutes || 0), 0);
  const totalReta = (doses || []).reduce((s, d) => s + +(d.dose || 0), 0);
  const activePeptides = (peptides || []).filter(p => p.status === "active");
  const plannedPeptides = (peptides || []).filter(p => p.status === "planned");
  const nextDoses = getNextDoseDays();

  function flash(msg) { setSaved(msg); setTimeout(() => setSaved(""), 2000); }

  function addWeight() {
    if (!weightForm.weight) return;
    setWeights([...(weights || []), { ...weightForm, id: uid(), weight: +weightForm.weight }]);
    setWeightForm({ date: todayISO(), weight: "", type: "morning", note: "" });
    flash("Weight saved ✓");
  }
  function addDose() {
    if (!doseForm.dose) return;
    setDoses([...(doses || []), { ...doseForm, id: uid(), dose: +doseForm.dose }]);
    setDoseForm({ date: todayISO(), dose: "", note: "" });
    flash("Dose saved ✓");
  }
  function addFood() {
    if (!foodForm.item) return;
    setFoods([...(foods || []), { ...foodForm, id: uid(), calories: +(foodForm.calories || 0), protein: +(foodForm.protein || 0) }]);
    setFoodForm({ date: todayISO(), item: "", calories: "", protein: "" });
    setAiResult(null);
    flash("Food saved ✓");
  }
  function addWorkout() {
    if (!workoutForm.type) return;
    setWorkouts([...(workouts || []), { ...workoutForm, id: uid(), minutes: +(workoutForm.minutes || 0) }]);
    setWorkoutForm({ date: todayISO(), type: "", minutes: "", note: "" });
    flash("Workout saved ✓");
  }
  function remove(setter, list, id) { setter((list || []).filter(x => x.id !== id)); }

  async function lookupCalories() {
    if (!aiQuery.trim()) return;
    if (!apiKey) { setAiError("Add your Anthropic API key in Settings (⚙️) to use AI features."); return; }
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const data = await callClaude(apiKey, {
        system: `You are a nutrition estimator. The user describes food in natural language. Return ONLY valid JSON with no extra text, backticks, or explanation. Format: {"food":"short clean food name","amount":"the amount as described","calories_low":number,"calories_high":number,"calories_mid":number,"protein_low":number,"protein_high":number,"protein_mid":number,"confidence":"high|medium|low","notes":"brief 1-sentence note"} Be realistic.`,
        messages: [{ role: "user", content: aiQuery }]
      });
      const text = data.content.map(b => b.text || "").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setAiResult(parsed);
      setFoodForm(f => ({ ...f, item: parsed.food + " (" + parsed.amount + ")", calories: String(parsed.calories_mid), protein: String(parsed.protein_mid) }));
    } catch (e) { setAiError("Lookup failed: " + e.message); }
    setAiLoading(false);
  }

  async function scanLabel() {
    if (!labelImage) return;
    if (!apiKey) { setAiError("Add your Anthropic API key in Settings (⚙️) to use AI features."); return; }
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const base64 = labelImage.split(",")[1];
      const mediaType = labelImage.split(";")[0].split(":")[1];
      const data = await callClaude(apiKey, {
        system: `You are an expert nutrition analyst. The user will send a photo — nutrition label, branded product, restaurant meal, drink, snack. Identify it and estimate nutrition. Return ONLY valid JSON: {"food":"specific name","identified_as":"nutrition_label|branded_product|food_photo","serving_size":"standard size","calories_per_serving":number,"protein_per_serving":number,"fat_per_serving":number,"carbs_per_serving":number,"servings_consumed":number,"calories_mid":number,"calories_low":number,"calories_high":number,"protein_mid":number,"protein_low":number,"protein_high":number,"amount":"what user had","confidence":"high|medium|low","notes":"how identified"}`,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: servingInput ? `I had approximately: ${servingInput}` : "What is this and what are the nutrition facts?" }
        ]}]
      });
      const text = data.content.map(b => b.text || "").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setAiResult(parsed);
      setFoodForm(f => ({ ...f, item: parsed.food + " (" + parsed.amount + ")", calories: String(parsed.calories_mid), protein: String(parsed.protein_mid) }));
    } catch (e) { setAiError("Scan failed: " + e.message); }
    setAiLoading(false);
  }

  async function getAIInsight() {
    if (sortedWeights.length < 2) return;
    if (!apiKey) { setAiInsight("Add your Anthropic API key in Settings (⚙️) to use AI features."); return; }
    setInsightLoading(true); setAiInsight("");
    const activeStack = activePeptides.map(p => `${p.name} ${p.doseAmount}${p.doseUnit} ${p.frequency}`).join(", ");
    const plannedStack = plannedPeptides.map(p => `${p.name} (starts ${fmtDate(p.startDate)})`).join(", ");
    const doseHistStr = [...doses].sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(-5).map(d=>`${d.date}: ${d.dose}mg`).join("; ");
    const recentFoods = (foods || []).slice(-5).map(f=>`${f.item} (${f.calories}cal/${f.protein}p)`).join(", ");
    const recentWorkouts = (workouts || []).slice(-5).map(w=>`${w.type} ${w.minutes}min`).join(", ");
    const prompt = `You are a clinical health analyst specializing in peptide protocols and metabolic medicine.
Retatrutide protocol: ${currentDose}mg × 2/wk (Sun+Thu 19:00). Started ${START_DATE}.
Recent dose history: ${doseHistStr}
Cumulative reta: ${totalReta.toFixed(3)}mg
Active peptide stack: ${activeStack || "none yet"}
Planned: ${plannedStack || "none"}
Weight: ${START_WEIGHT} → ${latestWeight.weight} lbs (${totalLost.toFixed(1)} lbs / ${pctLost(latestWeight.weight)}%)
Avg loss: ${avgPerWeek.toFixed(2)} lbs/wk · Goal: ${TARGET_WEIGHT}, ${remainingToGoal.toFixed(1)} to go
Currently week ${currentWeek} (${activePhase.phase} phase)
Recent food: ${recentFoods || "none logged"}
Recent training: ${recentWorkouts || "none logged"}

Write a 3-4 sentence personalized health breakdown:
1. What reta's triple agonism is doing at this dose/week given the rate of loss
2. Whether trajectory matches expectations and any flags from food/training data
3. One actionable insight, including planned MOTS-c if relevant
Clinical but warm. Pure prose, no bullets. Reference specific numbers.`;
    try {
      const data = await callClaude(apiKey, { messages: [{ role: "user", content: prompt }] });
      setAiInsight(data.content?.map(b=>b.text||"").join("") || "Unable to generate insight.");
    } catch (e) { setAiInsight("Insight unavailable: " + e.message); }
    setInsightLoading(false);
  }

  const TABS = ["dashboard", "weight", "doses", "peptides", "food", "workouts", "supplements", "calculator"];
  const ICONS = { dashboard: "⚡", weight: "⚖️", doses: "💉", peptides: "🧬", food: "🥩", workouts: "🏋️", supplements: "💊", calculator: "🧮" };

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div>
          <div style={S.kicker}>🏆 {USER_NAME}'s Reta Protocol</div>
          <h1 style={S.title}>Command Center</h1>
          <p style={S.sub}>
            Start: {START_WEIGHT} lbs · {fmtDate(START_DATE)} · Goal: {TARGET_WEIGHT} lbs
            <span style={{ marginLeft: 8, color: "#fb7185" }}>· Wk {currentWeek} · {currentDose}mg/dose</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <div style={S.toast}>{saved}</div>}
          <button onClick={() => { setTempKey(apiKey); setShowSettings(true); }} style={S.gearBtn} title="Settings">⚙️</button>
        </div>
      </header>

      {showSettings && (
        <div style={S.modal} onClick={() => setShowSettings(false)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...S.panelTitle, marginTop: 0 }}>⚙️ Settings</h2>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 12 }}>
              <b style={{ color: "#4ade80" }}>Anthropic API Key</b> (for AI features)
            </div>
            <input type="password" style={S.input} placeholder="sk-ant-api03-..." value={tempKey} onChange={e => setTempKey(e.target.value)} />
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, fontFamily: "monospace", lineHeight: 1.6 }}>
              Get a key at <span style={{ color: "#60a5fa" }}>console.anthropic.com</span>. Add ~$5 credit — lasts months for personal use. Key stays on your device only.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btn, gridColumn: "unset", flex: 1 }} onClick={() => { setApiKey(tempKey.trim()); setShowSettings(false); flash(tempKey.trim() ? "API key saved ✓" : "API key cleared"); }}>Save</button>
              {apiKey && <button style={{ ...S.btn, gridColumn: "unset", background: "#7f1d1d" }} onClick={() => { setApiKey(""); setTempKey(""); setShowSettings(false); flash("Key cleared"); }}>Clear</button>}
              <button style={{ ...S.btn, gridColumn: "unset", background: "#1e293b" }} onClick={() => setShowSettings(false)}>Cancel</button>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1e293b", fontSize: 11, color: "#64748b", fontFamily: "monospace", lineHeight: 1.7 }}>
              <b style={{ color: "#94a3b8" }}>Status:</b> {apiKey ? <span style={{ color: "#4ade80" }}>✓ AI features active</span> : <span style={{ color: "#fb7185" }}>✗ No key — AI features disabled</span>}<br />
              <b style={{ color: "#94a3b8" }}>Storage:</b> All data saved in browser localStorage
            </div>
          </div>
        </div>
      )}

      <div style={S.progressWrap}>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${progressPct}%` }} />
        </div>
        <div style={S.progressLabels}>
          <span>{START_WEIGHT} lbs</span>
          <span style={{ color: "#4ade80", fontWeight: 700 }}>{progressPct.toFixed(1)}% to goal</span>
          <span>{TARGET_WEIGHT} lbs</span>
        </div>
      </div>

      <nav style={S.tabs}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={tab === t ? S.activeTab : S.tab}>
            <span style={{ fontSize: 16 }}>{ICONS[t]}</span>
            <span style={{ fontSize: 11, textTransform: "capitalize" }}>{t}</span>
          </button>
        ))}
      </nav>

      {tab === "dashboard" && (
        <>
          <div style={S.grid}>
            <StatCard label="Current" value={`${latestWeight.weight}`} unit="lbs" color="#4ade80" />
            <StatCard label="Lowest" value={`${lowestWeight}`} unit="lbs" color="#34d399" />
            <StatCard label="Lost" value={`${totalLost.toFixed(1)}`} unit="lbs" color="#f59e0b" />
            <StatCard label="% Body Wt" value={`${pctLost(latestWeight.weight)}`} unit="%" color="#f59e0b" />
            <StatCard label="Avg/wk" value={`${avgPerWeek.toFixed(2)}`} unit="lbs" color="#60a5fa" />
            <StatCard label={`To ${TARGET_WEIGHT}`} value={`${remainingToGoal.toFixed(1)}`} unit="lbs" color="#a78bfa" />
            <StatCard label="Reta Total" value={`${totalReta.toFixed(3)}`} unit="mg" color="#fb7185" />
            <StatCard label="Today Protein" value={`${todayProtein}`} unit="g" color="#4ade80" />
          </div>

          <div style={S.panel}>
            <div style={S.panelTitle}>💉 Next Doses · {currentDose}mg each</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {nextDoses.map((d, i) => (
                <div key={i} style={{ background: "#020617", border: "1px solid #fb7185", borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, color: "#fb7185", fontSize: 13 }}>{d.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>
                  <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>@ {DOSE_TIME}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: 12, borderLeft: "4px solid #f59e0b" }}>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#f59e0b", letterSpacing: 1, marginBottom: 4 }}>WEEK {currentWeek} · {activePhase.phase.toUpperCase()} PHASE</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{activePhase.desc}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontFamily: "monospace" }}>Expected loss this phase: {activePhase.expected}</div>
            </div>
          </div>

          <div style={S.panel}>
            <h2 style={S.panelTitle}>Today · {today}</h2>
            <div style={S.todayGrid}>
              <div style={S.todayBox}><div style={S.todayVal}>{todayCals}</div><div style={S.todayLbl}>calories</div></div>
              <div style={S.todayBox}><div style={S.todayVal}>{todayProtein}g</div><div style={S.todayLbl}>protein</div></div>
              <div style={S.todayBox}><div style={S.todayVal}>{todayMinutes}</div><div style={S.todayLbl}>training min</div></div>
              <div style={S.todayBox}><div style={S.todayVal}>{todayWorkouts.length}</div><div style={S.todayLbl}>sessions</div></div>
            </div>
          </div>

          {peptides && peptides.length > 0 && (
            <div style={S.panel}>
              <h2 style={S.panelTitle}>🧬 Peptide Stack</h2>
              {peptides.map(p => {
                const sc = { active: "#4ade80", planned: "#fbbf24", completed: "#64748b" };
                return (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#020617", borderRadius: 8, padding: "10px 12px", borderLeft: `3px solid ${p.color || "#a78bfa"}`, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: p.color || "#e2e8f0" }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{p.doseAmount}{p.doseUnit} · {p.frequency}{p.startDate ? ` · ${fmtDate(p.startDate)}` : ""}</div>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: 1, color: sc[p.status], background: sc[p.status]+"22", borderRadius: 4, padding: "3px 8px" }}>{p.status.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={S.panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ ...S.panelTitle, margin: 0 }}>🧠 AI Health Breakdown</h2>
              <button onClick={getAIInsight} disabled={insightLoading || sortedWeights.length < 2} style={{ ...S.btn, gridColumn: "unset", marginTop: 0, fontSize: 11, padding: "6px 14px", opacity: insightLoading ? 0.6 : 1, background: "#1e3a5f", color: "#60a5fa", border: "1px solid #60a5fa" }}>
                {insightLoading ? "ANALYZING..." : "GENERATE"}
              </button>
            </div>
            {aiInsight ? (
              <div style={{ background: "#020617", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14, color: "#cbd5e1", fontSize: 13, lineHeight: 1.7 }}>{aiInsight}</div>
            ) : (
              <div style={{ color: "#475569", fontSize: 12, fontFamily: "monospace", fontStyle: "italic" }}>
                {sortedWeights.length < 2 ? "Add a second weight entry to unlock analysis." : !apiKey ? "Add your API key in ⚙️ Settings to use AI features." : "Click GENERATE for a personalized breakdown."}
              </div>
            )}
          </div>

          {sortedWeights.length > 1 && (
            <div style={S.panel}>
              <h2 style={S.panelTitle}>Weight Trend</h2>
              <div style={S.chartArea}>
                {sortedWeights.map(w => {
                  const min = Math.min(...sortedWeights.map(x => x.weight));
                  const max = Math.max(...sortedWeights.map(x => x.weight));
                  const pct = 10 + ((w.weight - min) / Math.max(0.1, max - min)) * 80;
                  return (
                    <div key={w.id} style={S.barCol} title={`${w.date}: ${w.weight} lbs`}>
                      <div style={{ ...S.barFill, height: `${pct}%` }} />
                      <div style={S.barLabel}>{w.weight}</div>
                      <div style={S.barDate}>{w.date.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={S.guardrail}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>If energy tanks, digestion stalls, or workouts fall apart — hydrate, hit protein, add carbs, sleep, keep dose changes disciplined.</span>
          </div>
        </>
      )}

      {tab === "weight" && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>Weight Log</h2>
          <div style={S.form}>
            <label style={S.label}>Date</label>
            <input style={S.input} type="date" value={weightForm.date} onChange={e => setWeightForm({ ...weightForm, date: e.target.value })} />
            <label style={S.label}>Weight (lbs)</label>
            <input style={S.input} type="number" step="0.1" placeholder="e.g. 221.8" value={weightForm.weight} onChange={e => setWeightForm({ ...weightForm, weight: e.target.value })} />
            <label style={S.label}>Type</label>
            <select style={S.input} value={weightForm.type} onChange={e => setWeightForm({ ...weightForm, type: e.target.value })}>
              {["morning","post-bathroom","pre-bathroom","bedtime","pre-lunch","scale","other"].map(o => <option key={o}>{o}</option>)}
            </select>
            <label style={S.label}>Note</label>
            <input style={S.input} placeholder="Optional note" value={weightForm.note} onChange={e => setWeightForm({ ...weightForm, note: e.target.value })} />
            <button style={S.btn} onClick={addWeight}>+ Add Weight</button>
          </div>
          <LogList items={[...sortedWeights].reverse()} render={w => <><b style={{ color: "#4ade80" }}>{w.weight} lbs</b> · {w.date} · {w.type}{w.note ? ` · ${w.note}` : ""}</>} onRemove={id => remove(setWeights, weights, id)} />
        </div>
      )}

      {tab === "doses" && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>Reta Dose Log · Total: {totalReta.toFixed(3)} mg · Current: {currentDose}mg</h2>
          <div style={S.form}>
            <label style={S.label}>Date</label>
            <input style={S.input} type="date" value={doseForm.date} onChange={e => setDoseForm({ ...doseForm, date: e.target.value })} />
            <label style={S.label}>Dose (mg)</label>
            <input style={S.input} type="number" step="0.025" placeholder="e.g. 1.0" value={doseForm.dose} onChange={e => setDoseForm({ ...doseForm, dose: e.target.value })} />
            <label style={S.label}>Note</label>
            <input style={S.input} placeholder="Optional note" value={doseForm.note} onChange={e => setDoseForm({ ...doseForm, note: e.target.value })} />
            <button style={S.btn} onClick={addDose}>+ Log Dose</button>
          </div>
          <LogList items={[...(doses || [])].sort((a,b) => new Date(b.date)-new Date(a.date))} render={d => <><b style={{ color: "#fb7185" }}>{d.dose} mg</b> · {d.date}{d.note ? ` · ${d.note}` : ""}</>} onRemove={id => remove(setDoses, doses, id)} />
        </div>
      )}

      {tab === "peptides" && <PeptidesPanel peptides={peptides} setPeptides={setPeptides} />}

      {tab === "food" && (
        <div>
          <div style={S.panel}>
            <h2 style={S.panelTitle}>🤖 AI Calorie Lookup</h2>
            {!apiKey && (
              <div style={{ background: "#451a03", border: "1px solid #fb923c", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: "#fb923c", fontFamily: "monospace" }}>
                ⚙️ Add your API key in Settings to enable AI features
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              <button style={labelMode === "text" ? S.pillActive : S.pill} onClick={() => { setLabelMode("text"); setAiResult(null); setAiError(""); }}>✏️ Describe it</button>
              <button style={labelMode === "camera" ? { ...S.pillActive, borderColor: "#fb7185", color: "#fb7185", background: "#2d0a12" } : S.pill} onClick={() => { setLabelMode("camera"); setAiResult(null); setAiError(""); }}>📷 Photo / Scan</button>
            </div>

            {labelMode === "text" && (
              <>
                <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 10px", fontFamily: "monospace" }}>Describe what you ate.</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: 1 }} placeholder='"2-3 forkfuls of mac and cheese"' value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && lookupCalories()} />
                  <button style={{ ...S.btn, gridColumn: "unset", minWidth: 90, opacity: aiLoading ? 0.6 : 1 }} onClick={lookupCalories} disabled={aiLoading}>{aiLoading ? "..." : "Look up"}</button>
                </div>
              </>
            )}

            {labelMode === "camera" && (
              <>
                <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 10px", fontFamily: "monospace" }}>Snap a photo of anything — label, package, plate, drink.</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <label style={{ ...S.cameraBtn, flex: 1, textAlign: "center" }}>
                    📷 Take Photo
                    <input type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                      onChange={e => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => setLabelImage(ev.target.result); r.readAsDataURL(file); e.target.value = ""; }} />
                  </label>
                  <label style={{ ...S.cameraBtn, flex: 1, textAlign: "center", background: "#1e293b" }}>
                    🖼️ Upload Image
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => setLabelImage(ev.target.result); r.readAsDataURL(file); e.target.value = ""; }} />
                  </label>
                </div>
                {labelImage && (
                  <div style={{ marginBottom: 10 }}>
                    <img src={labelImage} alt="Food preview" style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, border: "1px solid #1e293b", display: "block", marginBottom: 8 }} />
                    <input style={{ ...S.input, marginBottom: 8 }} placeholder='Optional: how much? e.g. "the whole can"' value={servingInput} onChange={e => setServingInput(e.target.value)} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ ...S.btn, gridColumn: "unset", flex: 1, opacity: aiLoading ? 0.6 : 1 }} onClick={scanLabel} disabled={aiLoading}>{aiLoading ? "Identifying..." : "🔍 Identify"}</button>
                      <button style={{ ...S.btn, gridColumn: "unset", background: "#7f1d1d", minWidth: 60 }} onClick={() => { setLabelImage(null); setServingInput(""); setAiResult(null); }}>✕</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {aiError && <div style={{ color: "#ef4444", fontSize: 13, fontFamily: "monospace", marginBottom: 8 }}>{aiError}</div>}

            {aiResult && (
              <div style={S.aiResultBox}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#f8fafc" }}>{aiResult.food}</div>
                    <div style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>{aiResult.amount}</div>
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: 1, padding: "3px 10px", borderRadius: 20, background: aiResult.confidence === "high" ? "#14532d" : aiResult.confidence === "medium" ? "#451a03" : "#1e1b4b", color: aiResult.confidence === "high" ? "#4ade80" : aiResult.confidence === "medium" ? "#fb923c" : "#a78bfa", border: `1px solid ${aiResult.confidence === "high" ? "#4ade80" : aiResult.confidence === "medium" ? "#fb923c" : "#a78bfa"}` }}>
                    {aiResult.confidence}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div style={S.aiStatBox}>
                    <div style={S.aiStatLabel}>Calories</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>{aiResult.calories_mid}</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{aiResult.calories_low}–{aiResult.calories_high}</div>
                  </div>
                  <div style={S.aiStatBox}>
                    <div style={S.aiStatLabel}>Protein</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>{aiResult.protein_mid}g</div>
                    <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{aiResult.protein_low}–{aiResult.protein_high}g</div>
                  </div>
                </div>
                {aiResult.notes && <div style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace", marginBottom: 12, fontStyle: "italic" }}>💬 {aiResult.notes}</div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={{ ...S.btn, gridColumn: "unset", fontSize: 13 }} onClick={() => setFoodForm(f => ({ ...f, calories: String(aiResult.calories_low), protein: String(aiResult.protein_low) }))}>Low</button>
                  <button style={{ ...S.btn, gridColumn: "unset", fontSize: 13, background: "#b45309" }} onClick={() => setFoodForm(f => ({ ...f, calories: String(aiResult.calories_mid), protein: String(aiResult.protein_mid) }))}>Mid ✓</button>
                  <button style={{ ...S.btn, gridColumn: "unset", fontSize: 13, background: "#7c3aed" }} onClick={() => setFoodForm(f => ({ ...f, calories: String(aiResult.calories_high), protein: String(aiResult.protein_high) }))}>High</button>
                </div>
              </div>
            )}
          </div>

          <div style={S.panel}>
            <h2 style={S.panelTitle}>Food Log · Today: {todayCals} cal / {todayProtein}g protein</h2>
            <div style={S.form}>
              <label style={S.label}>Date</label>
              <input style={S.input} type="date" value={foodForm.date} onChange={e => setFoodForm({ ...foodForm, date: e.target.value })} />
              <label style={S.label}>Food</label>
              <input style={S.input} placeholder="e.g. Chicken breast 6oz" value={foodForm.item} onChange={e => setFoodForm({ ...foodForm, item: e.target.value })} />
              <label style={S.label}>Calories</label>
              <input style={S.input} type="number" placeholder="280" value={foodForm.calories} onChange={e => setFoodForm({ ...foodForm, calories: e.target.value })} />
              <label style={S.label}>Protein (g)</label>
              <input style={S.input} type="number" placeholder="50" value={foodForm.protein} onChange={e => setFoodForm({ ...foodForm, protein: e.target.value })} />
              <button style={S.btn} onClick={addFood}>+ Log Food</button>
            </div>
            <LogList items={[...(foods || [])].sort((a,b) => new Date(b.date)-new Date(a.date))} render={f => <><b style={{ color: "#f59e0b" }}>{f.item}</b> · {f.date} · {f.calories} cal · {f.protein}g</>} onRemove={id => remove(setFoods, foods, id)} />
          </div>
        </div>
      )}

      {tab === "workouts" && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>Workout Log · Today: {todayMinutes} min</h2>
          <div style={S.form}>
            <label style={S.label}>Date</label>
            <input style={S.input} type="date" value={workoutForm.date} onChange={e => setWorkoutForm({ ...workoutForm, date: e.target.value })} />
            <label style={S.label}>Type</label>
            <input style={S.input} placeholder="e.g. cardio, weights, walk" value={workoutForm.type} onChange={e => setWorkoutForm({ ...workoutForm, type: e.target.value })} />
            <label style={S.label}>Minutes</label>
            <input style={S.input} type="number" placeholder="60" value={workoutForm.minutes} onChange={e => setWorkoutForm({ ...workoutForm, minutes: e.target.value })} />
            <label style={S.label}>Notes</label>
            <input style={S.input} placeholder="Energy, PRs..." value={workoutForm.note} onChange={e => setWorkoutForm({ ...workoutForm, note: e.target.value })} />
            <button style={S.btn} onClick={addWorkout}>+ Log Workout</button>
          </div>
          <LogList items={[...(workouts || [])].sort((a,b) => new Date(b.date)-new Date(a.date))} render={w => <><b style={{ color: "#60a5fa" }}>{w.type}</b> · {w.date} · {w.minutes} min{w.note ? ` · ${w.note}` : ""}</>} onRemove={id => remove(setWorkouts, workouts, id)} />
        </div>
      )}

      {tab === "supplements" && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>💊 Protocol Overview</h2>
          <div style={S.suppCard}>
            <div style={{ ...S.suppDot, background: "#fb7185" }} />
            <div>
              <div style={S.suppName}>Retatrutide <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace", marginLeft: 6 }}>ACTIVE</span></div>
              <div style={S.suppNote}>Current: {currentDose}mg · Sun + Thu @ 19:00 · Total cumulative: {totalReta.toFixed(3)}mg.</div>
            </div>
          </div>
          {plannedPeptides.map(p => (
            <div key={p.id} style={S.suppCard}>
              <div style={{ ...S.suppDot, background: p.color }} />
              <div>
                <div style={S.suppName}>{p.name} <span style={{ fontSize: 11, color: "#fbbf24", fontFamily: "monospace", marginLeft: 6 }}>PLANNED</span></div>
                <div style={S.suppNote}>Starts {fmtDate(p.startDate)} · {p.doseAmount}{p.doseUnit} {p.frequency}. {p.notes}</div>
              </div>
            </div>
          ))}
          {activePeptides.filter(p => p.name !== "Retatrutide").map(p => (
            <div key={p.id} style={S.suppCard}>
              <div style={{ ...S.suppDot, background: p.color }} />
              <div>
                <div style={S.suppName}>{p.name} <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace", marginLeft: 6 }}>ACTIVE</span></div>
                <div style={S.suppNote}>{p.doseAmount}{p.doseUnit} {p.frequency} · Started {fmtDate(p.startDate)}. {p.notes}</div>
              </div>
            </div>
          ))}
          <div style={S.guardrail}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <span>Hydration first, protein non-negotiable, sleep is a tool, carbs not the enemy when training hard.</span>
          </div>
        </div>
      )}

      {tab === "calculator" && <PeptideCalculator />}
    </div>
  );
}

function PeptidesPanel({ peptides, setPeptides }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLib, setSelectedLib] = useState(null);
  const [form, setForm] = useState({ name: "", startDate: todayISO(), doseAmount: "", doseUnit: "mg", frequency: "", cycleWeeks: "", notes: "", status: "planned", color: "#a78bfa" });

  function selectLib(p) {
    setSelectedLib(p);
    setForm(f => ({ ...f, name: p.name === "Custom" ? "" : p.name, frequency: p.frequency || "", color: p.color, doseUnit: (p.typicalDose || "").includes("mcg") ? "mcg" : "mg", doseAmount: "" }));
  }
  function addPep() {
    if (!form.name || !form.startDate) return;
    setPeptides([...(peptides || []), { ...form, id: uid(), doseAmount: parseFloat(form.doseAmount) || 0 }]);
    setShowAdd(false);
    setForm({ name: "", startDate: todayISO(), doseAmount: "", doseUnit: "mg", frequency: "", cycleWeeks: "", notes: "", status: "planned", color: "#a78bfa" });
    setSelectedLib(null);
  }
  function toggleStatus(id) { setPeptides(peptides.map(p => p.id === id ? { ...p, status: p.status === "active" ? "completed" : p.status === "planned" ? "active" : "planned" } : p)); }
  function delPep(id) { setPeptides(peptides.filter(p => p.id !== id)); }

  const sc = { active: "#4ade80", planned: "#fbbf24", completed: "#64748b" };
  const libInfo = selectedLib && PEPTIDE_LIBRARY.find(l => l.name === selectedLib.name);

  return (
    <div>
      <div style={{ ...S.panel, borderLeft: "4px solid #f0abfc" }}>
        <h2 style={S.panelTitle}>🧬 Peptide Stack Builder</h2>
        <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: 12, fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
          <span style={{ color: "#f0abfc", fontWeight: 700 }}>MOTS-c + Reta synergy:</span> Both enhance insulin sensitivity and fat oxidation via complementary pathways — Reta through GLP-1/GIP/glucagon, MOTS-c through mitochondrial AMPK activation.
        </div>
      </div>

      <div style={S.panel}>
        <h2 style={S.panelTitle}>Your Stack ({(peptides || []).length})</h2>
        {(peptides || []).map(p => {
          const libEntry = PEPTIDE_LIBRARY.find(l => l.name === p.name);
          const weeksSince = p.startDate ? getWeekNumber(p.startDate, todayISO()) - 1 : 0;
          return (
            <div key={p.id} style={{ background: "#020617", border: "1px solid #1e293b", borderLeft: `3px solid ${p.color}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: p.color }}>{p.name}</span>
                    <span style={{ fontSize: 10, fontFamily: "monospace", background: sc[p.status]+"22", color: sc[p.status], borderRadius: 4, padding: "2px 7px" }}>{p.status.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginTop: 4 }}>
                    {p.doseAmount}{p.doseUnit} · {p.frequency || "—"} · {p.startDate ? `Start ${fmtDate(p.startDate)}` : ""}
                    {p.status === "active" && weeksSince > 0 && ` · Wk ${weeksSince}`}
                  </div>
                  {p.notes && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontStyle: "italic" }}>{p.notes}</div>}
                  {libEntry?.synergy && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, background: "#0f172a", borderRadius: 6, padding: "6px 10px", lineHeight: 1.6 }}>
                      <span style={{ color: p.color }}>⚡ </span>{libEntry.synergy}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleStatus(p.id)} style={{ background: "#0f172a", border: "1px solid #1e293b", color: sc[p.status], cursor: "pointer", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontFamily: "monospace" }}>⟳</button>
                  <button onClick={() => delPep(p.id)} style={{ background: "transparent", border: "1px solid #450a0a", color: "#ef4444", cursor: "pointer", borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
        <button style={{ ...S.btn, marginTop: 8 }} onClick={() => setShowAdd(s => !s)}>{showAdd ? "Cancel" : "+ Add Peptide"}</button>
      </div>

      {showAdd && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>Add Peptide</h2>
          <div style={{ marginBottom: 12 }}>
            <div style={S.calcLabel}>Select from library</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PEPTIDE_LIBRARY.map(lib => (
                <button key={lib.name} onClick={() => selectLib(lib)} style={selectedLib?.name === lib.name ? { ...S.pillActive, borderColor: lib.color, color: lib.color, background: lib.color + "22" } : S.pill}>{lib.name}</button>
              ))}
            </div>
          </div>
          {libInfo && libInfo.name !== "Custom" && (
            <div style={{ background: "#020617", border: "1px solid #1e293b", borderLeft: `3px solid ${libInfo.color}`, borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              <div style={{ color: libInfo.color, fontWeight: 700, marginBottom: 4 }}>{libInfo.name} — {libInfo.category}</div>
              <div style={{ fontFamily: "monospace", color: "#64748b" }}>Typical: {libInfo.typicalDose} · {libInfo.frequency}</div>
              {libInfo.synergy && <div style={{ marginTop: 6 }}>{libInfo.synergy}</div>}
            </div>
          )}
          <div style={S.form}>
            <label style={S.label}>Name</label>
            <input style={S.input} placeholder="MOTS-c" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <label style={S.label}>Start date</label>
            <input style={S.input} type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <label style={S.label}>Dose</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input style={{ ...S.input, flex: 1 }} type="number" step="0.1" placeholder="5" value={form.doseAmount} onChange={e => setForm({ ...form, doseAmount: e.target.value })} />
              <select style={{ ...S.input, width: 90 }} value={form.doseUnit} onChange={e => setForm({ ...form, doseUnit: e.target.value })}>
                <option value="mg">mg</option><option value="mcg">mcg</option><option value="IU">IU</option>
              </select>
            </div>
            <label style={S.label}>Frequency</label>
            <input style={S.input} placeholder="Weekly · 5mg" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} />
            <label style={S.label}>Cycle (wks)</label>
            <input style={S.input} type="number" placeholder="10" value={form.cycleWeeks} onChange={e => setForm({ ...form, cycleWeeks: e.target.value })} />
            <label style={S.label}>Status</label>
            <select style={S.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="planned">Planned</option><option value="active">Active</option><option value="completed">Completed</option>
            </select>
            <label style={S.label}>Notes</label>
            <input style={S.input} placeholder="Goals, protocol notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <button style={S.btn} onClick={addPep}>+ Add to Stack</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PeptideCalculator() {
  const [peptide, setPeptide] = useState(PEPTIDE_PRESETS[0].name);
  const [vialMg, setVialMg] = useState("10");
  const [bacWaterMl, setBacWaterMl] = useState("2");
  const [desiredDose, setDesiredDose] = useState("1");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [syringeType, setSyringeType] = useState("100");
  const [customName, setCustomName] = useState("");
  const preset = PEPTIDE_PRESETS.find(p => p.name === peptide) || PEPTIDE_PRESETS[0];
  const vialMgNum = parseFloat(vialMg) || 0;
  const bacMlNum = parseFloat(bacWaterMl) || 0;
  const doseNum = parseFloat(desiredDose) || 0;
  const concMgPerMl = bacMlNum > 0 ? vialMgNum / bacMlNum : 0;
  const doseMg = doseUnit === "mcg" ? doseNum / 1000 : doseNum;
  const injectMl = concMgPerMl > 0 ? doseMg / concMgPerMl : 0;
  const mlPerUnit = 1 / parseFloat(syringeType);
  const injectUnits = mlPerUnit > 0 ? injectMl / mlPerUnit : 0;
  const dosesPerVial = doseMg > 0 ? vialMgNum / doseMg : 0;
  const isValid = concMgPerMl > 0 && doseMg > 0 && injectMl > 0;

  return (
    <div>
      <div style={S.panel}>
        <h2 style={S.panelTitle}>🧮 Peptide Reconstitution Calculator</h2>
        <div style={S.calcSection}>
          <div style={S.calcLabel}>Peptide</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PEPTIDE_PRESETS.map(p => (
              <button key={p.name} style={peptide === p.name ? S.pillActive : S.pill}
                onClick={() => { setPeptide(p.name); setDoseUnit(p.unit); if (p.commonDoses.length) setDesiredDose(String(p.commonDoses[0])); }}>{p.name}</button>
            ))}
          </div>
          {peptide === "Custom" && <input style={{ ...S.input, marginTop: 8 }} placeholder="Custom peptide name" value={customName} onChange={e => setCustomName(e.target.value)} />}
        </div>
        <div style={S.calcGrid}>
          <CalcField label="Vial size" sublabel="total mg in vial">
            <div style={S.inputRow}>
              <input style={S.calcInput} type="number" step="0.5" value={vialMg} onChange={e => setVialMg(e.target.value)} />
              <span style={S.unitTag}>mg</span>
            </div>
          </CalcField>
          <CalcField label="BAC water" sublabel="mL added to vial">
            <div style={S.inputRow}>
              <input style={S.calcInput} type="number" step="0.5" value={bacWaterMl} onChange={e => setBacWaterMl(e.target.value)} />
              <span style={S.unitTag}>mL</span>
            </div>
          </CalcField>
          <CalcField label="Desired dose" sublabel="per injection">
            <div style={S.inputRow}>
              <input style={S.calcInput} type="number" step="0.1" value={desiredDose} onChange={e => setDesiredDose(e.target.value)} />
              <select style={{ ...S.calcInput, width: 72, paddingLeft: 6 }} value={doseUnit} onChange={e => setDoseUnit(e.target.value)}>
                <option value="mg">mg</option><option value="mcg">mcg</option>
              </select>
            </div>
          </CalcField>
          <CalcField label="Syringe" sublabel="units on barrel">
            <select style={S.calcInput} value={syringeType} onChange={e => setSyringeType(e.target.value)}>
              <option value="100">100u (1mL)</option>
              <option value="50">50u (0.5mL)</option>
              <option value="30">30u (0.3mL)</option>
            </select>
          </CalcField>
        </div>
        {preset.commonDoses.length > 0 && (
          <div style={S.calcSection}>
            <div style={S.calcLabel}>Quick dose</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {preset.commonDoses.map(d => (
                <button key={d} style={desiredDose === String(d) ? S.pillActive : S.pill} onClick={() => setDesiredDose(String(d))}>{d} {preset.unit}</button>
              ))}
            </div>
          </div>
        )}
        {isValid ? (
          <div style={S.resultBox}>
            <div style={S.resultTitle}>📐 Results — {peptide === "Custom" ? (customName || "Custom") : peptide}</div>
            <div style={S.resultGrid}>
              <ResultStat label="Concentration" value={concMgPerMl.toFixed(4)} unit="mg/mL" color="#60a5fa" />
              <ResultStat label="Inject volume" value={injectMl.toFixed(4)} unit="mL" color="#4ade80" />
              <ResultStat label="Syringe mark" value={injectUnits.toFixed(1)} unit={`units (${syringeType}U)`} color="#f59e0b" big />
              <ResultStat label="Doses per vial" value={dosesPerVial.toFixed(1)} unit="injections" color="#a78bfa" />
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={S.calcLabel}>Syringe fill</span>
                <span style={{ color: "#f59e0b", fontFamily: "monospace", fontSize: 13 }}>{Math.min(100, (injectUnits / +syringeType) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ position: "relative", background: "#1e293b", borderRadius: 999, height: 22, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, width: `${Math.min(100, (injectUnits / +syringeType) * 100)}%`, background: injectUnits > +syringeType ? "#ef4444" : "linear-gradient(90deg, #f59e0b, #fb923c)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#475569", fontFamily: "monospace", marginTop: 4 }}>
                <span>0</span><span>{Math.round(+syringeType * 0.5)}</span><span>{syringeType}u</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: "#475569", padding: 16, textAlign: "center", fontFamily: "monospace", fontSize: 13 }}>Fill in all fields</div>
        )}
      </div>

      <div style={S.panel}>
        <h2 style={S.panelTitle}>📋 Quick Reference (100u syringe)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>{["Vial", "BAC", "Conc.", "0.5mg", "1mg", "2mg", "5mg"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {[[5,1],[5,2],[10,1],[10,2],[10,3],[10,5],[20,2]].map(([vial, bac]) => {
                const conc = vial / bac;
                const u = (dose) => ((dose / conc) * 100).toFixed(1);
                return (
                  <tr key={`${vial}-${bac}`}>
                    <td style={S.td}>{vial}mg</td>
                    <td style={S.td}>{bac}mL</td>
                    <td style={{ ...S.td, color: "#60a5fa" }}>{conc.toFixed(1)}</td>
                    <td style={S.td}>{u(0.5)}u</td>
                    <td style={{ ...S.td, color: "#4ade80", fontWeight: 700 }}>{u(1)}u</td>
                    <td style={S.td}>{u(2)}u</td>
                    <td style={S.td}>{u(5)}u</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.panel}>
        <h2 style={S.panelTitle}>🧊 Storage & Safety</h2>
        {[
          { icon: "❄️", title: "Unreconstituted", body: "Freezer (−20°C). Protect from light. Stable 12–24 months." },
          { icon: "🧴", title: "Reconstituted", body: "Refrigerate 2–8°C. Stable 4–8 weeks. Label with date." },
          { icon: "🪟", title: "BAC Water", body: "0.9% benzyl alcohol. Inject slowly down side of vial." },
          { icon: "🌀", title: "Mixing", body: "Gently swirl, never shake. Shaking degrades peptides." },
          { icon: "🩺", title: "Injection", body: "Subcutaneous into belly, love handles, or thigh. Rotate." },
          { icon: "🧹", title: "Hygiene", body: "Alcohol swab before each draw. Fresh needle every time." },
        ].map(n => (
          <div key={n.title} style={S.suppCard}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{n.icon}</div>
            <div><div style={S.suppName}>{n.title}</div><div style={S.suppNote}>{n.body}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalcField({ label, sublabel, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={S.calcLabel}>{label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>{sublabel}</div>}
      {children}
    </div>
  );
}
function ResultStat({ label, value, unit, color, big }) {
  return (
    <div style={S.resultStat}>
      <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: big ? 28 : 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>{unit}</div>
    </div>
  );
}
function StatCard({ label, value, unit, color }) {
  return (
    <div style={S.card}>
      <div style={S.cardLabel}>{label}</div>
      <div style={{ ...S.cardValue, color }}>{value}<span style={S.cardUnit}> {unit}</span></div>
    </div>
  );
}
function LogList({ items, render, onRemove }) {
  if (!items.length) return <div style={{ color: "#475569", padding: 16, textAlign: "center" }}>No entries yet</div>;
  return (
    <div style={S.logList}>
      {items.map(item => (
        <div key={item.id} style={S.logItem}>
          <span style={S.logText}>{render(item)}</span>
          <button style={S.deleteBtn} onClick={() => onRemove(item.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#060d18", color: "#e2e8f0", padding: "16px", fontFamily: "'Georgia', 'Times New Roman', serif", maxWidth: 900, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 },
  kicker: { color: "#4ade80", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontFamily: "monospace", marginBottom: 4 },
  title: { margin: "0 0 4px", fontSize: 28, fontWeight: 900, letterSpacing: -1, color: "#f8fafc" },
  sub: { margin: 0, color: "#64748b", fontSize: 13, fontFamily: "monospace" },
  toast: { background: "#14532d", color: "#4ade80", border: "1px solid #4ade80", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontFamily: "monospace" },
  gearBtn: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", fontSize: 16, cursor: "pointer" },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modalBox: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 20, maxWidth: 480, width: "100%" },
  progressWrap: { marginBottom: 16 },
  progressTrack: { background: "#1e293b", borderRadius: 999, height: 10, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #16a34a, #4ade80)", borderRadius: 999, transition: "width 0.6s ease" },
  progressLabels: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", fontFamily: "monospace" },
  tabs: { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" },
  tab: { flex: "1 1 80px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 6px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, cursor: "pointer", color: "#64748b", fontFamily: "monospace" },
  activeTab: { flex: "1 1 80px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 6px", background: "#0f2d0f", border: "1px solid #4ade80", borderRadius: 10, cursor: "pointer", color: "#4ade80", fontFamily: "monospace" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 },
  card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px" },
  cardLabel: { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "monospace", marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: 900, lineHeight: 1 },
  cardUnit: { fontSize: 13, fontWeight: 400 },
  panel: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 16, marginBottom: 14 },
  panelTitle: { margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5, fontFamily: "monospace" },
  todayGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  todayBox: { background: "#020617", border: "1px solid #1e293b", borderRadius: 10, padding: 12, textAlign: "center" },
  todayVal: { fontSize: 22, fontWeight: 900, color: "#4ade80" },
  todayLbl: { fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 },
  chartArea: { display: "flex", alignItems: "flex-end", gap: 6, height: 160, padding: "0 0 4px" },
  barCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4, height: "100%" },
  barFill: { width: "100%", minWidth: 8, maxWidth: 40, background: "linear-gradient(180deg, #4ade80, #16a34a)", borderRadius: "5px 5px 0 0", transition: "height 0.4s ease" },
  barLabel: { fontSize: 9, color: "#94a3b8", fontFamily: "monospace" },
  barDate: { fontSize: 9, color: "#475569", fontFamily: "monospace" },
  guardrail: { background: "#0f172a", border: "1px solid #854d0e", borderLeft: "4px solid #f59e0b", borderRadius: 10, padding: 14, color: "#94a3b8", fontSize: 13, display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 },
  form: { display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 12px", alignItems: "center", marginBottom: 16 },
  label: { fontSize: 11, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1, textAlign: "right" },
  input: { background: "#020617", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "Georgia, serif", width: "100%", boxSizing: "border-box" },
  btn: { gridColumn: "2", background: "#16a34a", color: "white", border: "none", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "monospace", letterSpacing: 0.5, marginTop: 4 },
  logList: { display: "flex", flexDirection: "column", gap: 6 },
  logItem: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#020617", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px", fontSize: 13 },
  logText: { flex: 1, lineHeight: 1.5 },
  deleteBtn: { background: "transparent", color: "#ef4444", border: "1px solid #450a0a", borderRadius: 6, cursor: "pointer", padding: "3px 8px", fontSize: 11, flexShrink: 0 },
  suppCard: { display: "flex", gap: 14, alignItems: "flex-start", background: "#020617", border: "1px solid #1e293b", borderRadius: 10, padding: 14, marginBottom: 10 },
  suppDot: { width: 10, height: 10, borderRadius: "50%", marginTop: 4, flexShrink: 0 },
  suppName: { fontWeight: 700, marginBottom: 4, fontSize: 15 },
  suppNote: { color: "#64748b", fontSize: 13, lineHeight: 1.5 },
  calcSection: { marginBottom: 16 },
  calcLabel: { fontSize: 10, color: "#64748b", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  calcGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 16 },
  calcInput: { background: "#020617", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "monospace", width: "100%", boxSizing: "border-box" },
  inputRow: { display: "flex", alignItems: "center", gap: 6 },
  unitTag: { color: "#64748b", fontFamily: "monospace", fontSize: 12 },
  pill: { background: "#0f172a", border: "1px solid #1e293b", color: "#64748b", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontFamily: "monospace" },
  pillActive: { background: "#1e3a5f", border: "1px solid #60a5fa", color: "#60a5fa", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontFamily: "monospace" },
  resultBox: { background: "#020617", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16, marginTop: 8 },
  resultTitle: { fontSize: 13, color: "#60a5fa", fontFamily: "monospace", marginBottom: 14, fontWeight: 700 },
  resultGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 },
  resultStat: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 12 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "monospace" },
  th: { background: "#020617", color: "#64748b", padding: "8px 12px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #1e293b" },
  td: { padding: "8px 12px", borderBottom: "1px solid #1e293b", color: "#94a3b8" },
  aiResultBox: { background: "#020617", border: "1px solid #1e3a5f", borderRadius: 12, padding: 16, marginTop: 4 },
  cameraBtn: { display: "block", background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0", borderRadius: 8, padding: "11px 16px", cursor: "pointer", fontFamily: "monospace", fontSize: 13, fontWeight: 700 },
  aiStatBox: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 12 },
  aiStatLabel: { fontSize: 10, color: "#475569", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
};
