import { useMemo, useState, useCallback } from "react";
import { Zap, Scale, Syringe, Dna, Utensils, Dumbbell, Pill, Calculator, Settings } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────
const HAS_SETUP = localStorage.getItem("tracker_setup_complete") === "true";
const START_WEIGHT = Number(localStorage.getItem("tracker_start_weight")) || 225;
const START_DATE = localStorage.getItem("tracker_start_date") || "2026-05-26";
const TARGET_WEIGHT = Number(localStorage.getItem("tracker_target_weight")) || 200;

const RETA_PHASES = [
  { weeks: "1–4",   phase: "Initiation",    expected: "0–1%",  desc: "Body adapting. Appetite suppression begins. GI side effects most likely." },
  { weeks: "5–8",   phase: "Early Loss",    expected: "1–3%",  desc: "Metabolic shift via glucagon pathway. Fat oxidation increases." },
  { weeks: "9–16",  phase: "Active Loss",   expected: "3–8%",  desc: "Triple agonism in full effect. Visceral fat reduction, blood sugar improvements." },
  { weeks: "17–32", phase: "Acceleration",  expected: "8–15%", desc: "Sustained deficit. Insulin sensitivity markedly improved." },
  { weeks: "33–68", phase: "Peak Efficacy", expected: "15%+",  desc: "Continued progress. Plateau monitoring becomes important." },
];

// ─────────────────────────────────────────────────────────────────────
// PEPTIDE LIBRARY
// ─────────────────────────────────────────────────────────────────────
const PEPTIDE_LIBRARY = {
  "GLP-1 / Metabolic": [
    { name: "Retatrutide", desc: "Triple agonist (GLP-1/GIP/glucagon). Most potent weight loss peptide available. Reduces appetite, visceral fat, and improves insulin sensitivity.", typicalDose: "0.5–5mg", unit: "mg", frequency: "2x/week", cycle: "Ongoing" },
    { name: "Semaglutide", desc: "GLP-1 agonist. Appetite suppression and blood sugar control. Well-studied.", typicalDose: "0.25–2mg", unit: "mg", frequency: "Weekly", cycle: "Ongoing" },
    { name: "Tirzepatide", desc: "Dual GLP-1/GIP agonist. Strong weight loss with muscle preservation.", typicalDose: "2.5–15mg", unit: "mg", frequency: "Weekly", cycle: "Ongoing" },
    { name: "Liraglutide", desc: "GLP-1 agonist. Daily dosing. Good appetite control.", typicalDose: "0.6–3mg", unit: "mg", frequency: "Daily", cycle: "Ongoing" },
  ],
  "GH Secretagogues": [
    { name: "CJC-1295 / Ipamorelin", desc: "GHRH + GHRP stack. Boosts GH pulse, improves sleep quality and recovery. Preserves muscle during a cut.", typicalDose: "100–300mcg", unit: "mcg", frequency: "Pre-sleep daily", cycle: "8–12 weeks" },
    { name: "CJC-1295", desc: "GHRH analogue. Extends GH release. Often stacked with Ipamorelin.", typicalDose: "1–2mg", unit: "mg", frequency: "2x/week", cycle: "8–12 weeks" },
    { name: "Ipamorelin", desc: "Selective GHRP. Clean GH pulse with minimal cortisol/prolactin. Best before sleep.", typicalDose: "100–300mcg", unit: "mcg", frequency: "Daily", cycle: "8–12 weeks" },
    { name: "GHRP-2", desc: "Strong GH release. Increases appetite — useful for recomposition or bulking phases.", typicalDose: "100–300mcg", unit: "mcg", frequency: "3x/day", cycle: "4–12 weeks" },
    { name: "GHRP-6", desc: "Potent hunger stimulus with GH release. Better for muscle gaining phases.", typicalDose: "100–300mcg", unit: "mcg", frequency: "3x/day", cycle: "4–12 weeks" },
    { name: "Hexarelin", desc: "Most potent GHRP. Strong GH release, some cortisol rise. Good for short cycles.", typicalDose: "100–200mcg", unit: "mcg", frequency: "2–3x/day", cycle: "4–6 weeks" },
    { name: "MK-677 (Ibutamoren)", desc: "Oral GH secretagogue. 24hr GH elevation. Water retention common.", typicalDose: "10–25mg", unit: "mg", frequency: "Daily", cycle: "Ongoing" },
    { name: "Sermorelin", desc: "GHRH analogue. Gentler GH stimulus. Good for anti-aging protocols.", typicalDose: "200–500mcg", unit: "mcg", frequency: "Daily", cycle: "3–6 months" },
    { name: "Tesamorelin", desc: "GHRH analogue. FDA-approved for visceral fat reduction. Excellent body composition effects.", typicalDose: "1–2mg", unit: "mg", frequency: "Daily", cycle: "6–12 months" },
  ],
  "Tissue Repair": [
    { name: "BPC-157", desc: "Body Protection Compound. Heals gut, tendons, ligaments, and muscles. Helps GI side effects from GLP-1 agonists.", typicalDose: "250–500mcg", unit: "mcg", frequency: "Daily or BID", cycle: "4–12 weeks" },
    { name: "TB-500 (Thymosin Beta-4)", desc: "Systemic tissue repair. Reduces inflammation, accelerates healing of muscle and connective tissue.", typicalDose: "2–5mg", unit: "mg", frequency: "2x/week loading", cycle: "4–6 weeks" },
    { name: "BPC-157 + TB-500", desc: "Combined stack for maximum healing. Synergistic — BPC-157 local, TB-500 systemic.", typicalDose: "250mcg / 2mg", unit: "mcg", frequency: "Daily", cycle: "4–8 weeks" },
    { name: "KPV", desc: "Anti-inflammatory tripeptide. Gut healing, skin conditions, IBD. Very safe profile.", typicalDose: "500mcg–1mg", unit: "mg", frequency: "Daily", cycle: "4–8 weeks" },
    { name: "GHK-Cu", desc: "Copper peptide. Skin regeneration, collagen synthesis, anti-aging. Also neuroprotective.", typicalDose: "1–2mg", unit: "mg", frequency: "Daily", cycle: "8–12 weeks" },
    { name: "Thymosin Alpha-1", desc: "Immune modulator. Used in cancer/viral protocols. Strong immune enhancement.", typicalDose: "1.6mg", unit: "mg", frequency: "2x/week", cycle: "6–12 months" },
  ],
  "Mitochondrial / Longevity": [
    { name: "MOTS-c", desc: "Mitochondrial peptide. AMPK activation — complements GLP-1/metabolic protocols. Boosts fat oxidation and insulin sensitivity.", typicalDose: "5–10mg", unit: "mg", frequency: "Weekly", cycle: "8–12 wk on, 4mo off" },
    { name: "Humanin", desc: "Mitochondria-derived. Neuroprotective, anti-aging, cardioprotective.", typicalDose: "2–4mg", unit: "mg", frequency: "Weekly", cycle: "8–12 weeks" },
    { name: "SS-31 (Elamipretide)", desc: "Targets mitochondrial inner membrane. Reduces oxidative stress. Strong anti-aging data.", typicalDose: "1–4mg", unit: "mg", frequency: "Daily", cycle: "4–8 weeks" },
    { name: "Epitalon", desc: "Telomere lengthening peptide. Anti-aging, sleep quality, immune function.", typicalDose: "5–10mg", unit: "mg", frequency: "Daily x 10–20d", cycle: "1–2 cycles/year" },
    { name: "Selank", desc: "Anxiolytic and nootropic. Modulates GABA and BDNF. Reduces anxiety without sedation.", typicalDose: "250–500mcg", unit: "mcg", frequency: "Daily", cycle: "2–4 weeks" },
    { name: "Semax", desc: "ACTH analogue. Cognitive enhancer, neuroprotective, BDNF upregulation.", typicalDose: "200–600mcg", unit: "mcg", frequency: "Daily", cycle: "2–4 weeks" },
  ],
  "Cognitive / Mood": [
    { name: "Dihexa", desc: "Extremely potent nootropic. BDNF-like activity. Long duration of action.", typicalDose: "10–20mg", unit: "mg", frequency: "Weekly", cycle: "4–8 weeks" },
    { name: "NA-NAP (NAP)", desc: "Neuroprotective. ADNP-derived. Cognitive support, anti-inflammatory.", typicalDose: "50–200mcg", unit: "mcg", frequency: "Daily", cycle: "4–8 weeks" },
    { name: "Pinealon", desc: "Retinal/brain peptide. Sleep, anti-aging, neuroprotection.", typicalDose: "1–3mg", unit: "mg", frequency: "Daily x 10d", cycle: "2 cycles/year" },
  ],
  "Hormonal / Sexual Health": [
    { name: "PT-141 (Bremelanotide)", desc: "Melanocortin agonist. Libido enhancement for men and women. Works centrally.", typicalDose: "1–2mg", unit: "mg", frequency: "As needed", cycle: "As needed" },
    { name: "Kisspeptin-10", desc: "GnRH stimulator. Boosts LH/FSH and testosterone naturally. PCT support.", typicalDose: "100–1000mcg", unit: "mcg", frequency: "Daily", cycle: "4–8 weeks" },
    { name: "AOD-9604", desc: "HGH fragment 176-191. Fat burning without GH side effects. Good adjunct to metabolic protocol.", typicalDose: "250–500mcg", unit: "mcg", frequency: "Daily", cycle: "8–12 weeks" },
    { name: "Fragment 176-191", desc: "Fat-burning HGH fragment. Lipolysis without IGF-1 elevation.", typicalDose: "250–500mcg", unit: "mcg", frequency: "Daily", cycle: "8–12 weeks" },
  ],
  "Cardiovascular / Other": [
    { name: "Angiotensin 1-7", desc: "Cardioprotective. Vasodilation, anti-fibrotic, blood pressure support.", typicalDose: "1–2mg", unit: "mg", frequency: "Daily", cycle: "4–8 weeks" },
    { name: "VIP (Vasoactive Intestinal Peptide)", desc: "Anti-inflammatory, lung health, CIRS/mold illness protocols.", typicalDose: "50mcg", unit: "mcg", frequency: "Daily nasal", cycle: "Varies" },
    { name: "Custom", desc: "Add your own peptide with custom dosing.", typicalDose: "", unit: "mg", frequency: "", cycle: "" },
  ],
};

// ─────────────────────────────────────────────────────────────────────
// SUPPLEMENT LIBRARY
// ─────────────────────────────────────────────────────────────────────
const SUPPLEMENT_LIBRARY = {
  Vitamins: ["Vitamin A","Vitamin B1 (Thiamine)","Vitamin B2 (Riboflavin)","Vitamin B3 (Niacin)","Vitamin B5 (Pantothenic Acid)","Vitamin B6","Vitamin B7 (Biotin)","Vitamin B9 (Folate)","Vitamin B12","Vitamin C","Vitamin D3","Vitamin E","Vitamin K2","Multivitamin"],
  Minerals: ["Magnesium Glycinate","Magnesium Citrate","Magnesium Threonate","Zinc","Iron","Calcium","Potassium","Selenium","Copper","Chromium","Iodine","Manganese","Boron"],
  Performance: ["Creatine Monohydrate","Protein Powder","Electrolytes","Beta Alanine","L-Citrulline","L-Arginine","L-Carnitine","Taurine","Glutamine","EAAs","BCAAs","Beet Root","HMB","Betaine"],
  HeartHealth: ["Fish Oil","Omega-3","Krill Oil","CoQ10","Garlic Extract","Red Yeast Rice","Hawthorn Berry","Cod Liver Oil"],
  Sleep: ["Melatonin","L-Theanine","GABA","5-HTP","Valerian Root","Passionflower","Chamomile"],
  GutHealth: ["Probiotic","Prebiotic Fiber","Digestive Enzymes","Psyllium Husk","Apple Cider Vinegar","Slippery Elm","Aloe Vera","Fiber Supplement"],
  Longevity: ["NAC","Alpha Lipoic Acid","Resveratrol","Quercetin","Astaxanthin","Berberine","Milk Thistle","TUDCA","PQQ","Spermidine","NMN","Nicotinamide Riboside (NR)"],
  WeightLoss: ["Green Tea Extract","Glucomannan","CLA","Caffeine"],
  JointHealth: ["Collagen","Glucosamine","Chondroitin","MSM","Hyaluronic Acid","Turmeric"],
  HormoneSupport: ["DHEA","Pregnenolone","DIM","Tongkat Ali","Fadogia Agrestis","Saw Palmetto","Maca Root"],
  Herbs: ["Ashwagandha","Rhodiola","Ginseng","Holy Basil","Ginkgo Biloba","Elderberry","Echinacea"],
  Other: ["MCT Oil","CBD","Custom"],
};

// ─────────────────────────────────────────────────────────────────────
// CALCULATOR PRESETS
// ─────────────────────────────────────────────────────────────────────
const CALC_PRESETS = [
  { name: "Retatrutide", commonDoses: [0.5, 1.0, 2.0, 3.0, 5.0], unit: "mg" },
  { name: "Semaglutide", commonDoses: [0.25, 0.5, 1.0, 2.0], unit: "mg" },
  { name: "Tirzepatide", commonDoses: [2.5, 5.0, 10.0, 15.0], unit: "mg" },
  { name: "MOTS-c", commonDoses: [5.0, 10.0], unit: "mg" },
  { name: "BPC-157", commonDoses: [250, 500, 1000], unit: "mcg" },
  { name: "TB-500", commonDoses: [2.0, 5.0, 10.0], unit: "mg" },
  { name: "CJC-1295", commonDoses: [1.0, 2.0], unit: "mg" },
  { name: "Ipamorelin", commonDoses: [100, 200, 300], unit: "mcg" },
  { name: "Custom", commonDoses: [], unit: "mg" },
];

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.max(0, Math.floor((new Date(b) - new Date(a)) / 86400000)); }
function weeksBetween(a, b) { return Math.max(1, daysBetween(a, b) / 7); }
function getWeekNumber(a, b) { return Math.floor(daysBetween(a, b) / 7) + 1; }
function pctLost(w) { return (((START_WEIGHT - w) / START_WEIGHT) * 100).toFixed(1); }
function uid() { return Date.now() + Math.floor(Math.random() * 10000); }
function fmtDate(d) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function usePersistedState(key, seed) {
  const [data, setData] = useState(() => {
    try { const s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch {}
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

function useApiKey() {
  const [key, setKey] = useState(() => { try { return localStorage.getItem("reta_api_key") || ""; } catch { return ""; } });
  const update = useCallback((val) => {
    try { if (val) localStorage.setItem("reta_api_key", val); else localStorage.removeItem("reta_api_key"); } catch {}
    setKey(val);
  }, []);
  return [key, update];
}

async function callClaude(apiKey, body) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, ...body })
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`API error ${res.status}: ${e.slice(0,200)}`); }
  return await res.json();
}

// ─────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [weights, setWeights] = usePersistedState("mr_weights", []);
  const [peptideStack, setPeptideStack] = usePersistedState("mr_peptide_stack", []);
  const [peptideLogs, setPeptideLogs] = usePersistedState("mr_peptide_logs", {});
  const [foods, setFoods] = usePersistedState("mr_foods", []);
  const [workouts, setWorkouts] = usePersistedState("mr_workouts", []);
  const [mySupplements, setMySupplements] = usePersistedState("my_supplements_v2", []);
  const [takenToday, setTakenToday] = usePersistedState("supp_taken_" + todayISO(), []);
  const [apiKey, setApiKey] = useApiKey();

  const [tab, setTab] = useState("dashboard");
  const [saved, setSaved] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [setupForm, setSetupForm] = useState({ name: "", heightFeet: "", heightInches: "", startWeight: "", targetWeight: "", startDate: todayISO(), activityLevel: "moderate" });

  const [weightForm, setWeightForm] = useState({ date: todayISO(), weight: "", type: "morning", note: "" });
  const [foodForm, setFoodForm] = useState({ date: todayISO(), item: "", calories: "", protein: "", carbs: "", fat: "" });
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");
  const [labelImage, setLabelImage] = useState(null);
  const [labelMode, setLabelMode] = useState("text");
  const [servingInput, setServingInput] = useState("");
  const [workoutForm, setWorkoutForm] = useState({ date: todayISO(), type: "", minutes: "", note: "" });
  const [insightLoading, setInsightLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  // Supplement state
  const [suppView, setSuppView] = useState("my");
  const [suppActiveCat, setSuppActiveCat] = useState(null);
  const [pendingSupp, setPendingSupp] = useState(null);
  const [editingSupp, setEditingSupp] = useState(null);
  const [suppForm, setSuppForm] = useState({ dose: "", unit: "mg", schedule: "Daily", time: "Morning" });

  // Peptide tab state
  const [pepView, setPepView] = useState("stack");
  const [pepActiveCat, setPepActiveCat] = useState(null);
  const [pendingPep, setPendingPep] = useState(null);
  const [editingPep, setEditingPep] = useState(null);
  const [pepForm, setPepForm] = useState({ dose: "", unit: "mg", frequency: "", cycle: "", notes: "", status: "active" });

  // Dose tab state
  const [doseTab, setDoseTab] = useState(null);
  const [doseForm, setDoseForm] = useState({ date: todayISO(), dose: "", note: "" });

  const sortedWeights = useMemo(() => (weights || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date)), [weights]);
  const latestWeight = sortedWeights[sortedWeights.length - 1] || { id: 0, date: todayISO(), weight: START_WEIGHT || 0 };
  const lowestWeight = sortedWeights.length ? Math.min(...sortedWeights.map(w => +w.weight)) : START_WEIGHT;
  const totalLost = START_WEIGHT - +latestWeight.weight;
  const remainingToGoal = +latestWeight.weight - TARGET_WEIGHT;
  const avgPerWeek = totalLost / weeksBetween(START_DATE, latestWeight.date);
  const progressPct = Math.max(0, Math.min(100, (totalLost / (START_WEIGHT - TARGET_WEIGHT)) * 100));
  const currentWeek = getWeekNumber(START_DATE, todayISO());
  const activePhase = RETA_PHASES.find(p => { const [s,e] = p.weeks.split("–").map(Number); return currentWeek >= s && currentWeek <= e; }) || RETA_PHASES[0];

  const today = todayISO();
  const todayFoods = (foods || []).filter(f => f.date === today);
  const todayCals = todayFoods.reduce((s, f) => s + +(f.calories || 0), 0);
  const todayProtein = todayFoods.reduce((s, f) => s + +(f.protein || 0), 0);
  const todayWorkouts = (workouts || []).filter(w => w.date === today);
  const todayMinutes = todayWorkouts.reduce((s, w) => s + +(w.minutes || 0), 0);

  const recentWeights = sortedWeights.slice(-8);
  const recentWeightLoss = recentWeights.length >= 2 ? Number(recentWeights[0].weight) - Number(recentWeights[recentWeights.length-1].weight) : 0;
  const recentDays = recentWeights.length >= 2 ? Math.max(1, daysBetween(recentWeights[0].date, recentWeights[recentWeights.length-1].date)) : 7;
  const weightBasedWeeklyLoss = recentWeights.length >= 2 ? (recentWeightLoss / recentDays) * 7 : avgPerWeek;
  const calorieTarget = Number(localStorage.getItem("tracker_calorie_target")) || null;
  const last7Foods = (foods || []).filter(f => { const d = new Date(f.date); const c = new Date(); c.setDate(c.getDate()-7); return d >= c; });
  const avgDailyCalories = last7Foods.length > 0 ? Math.round(last7Foods.reduce((s,f) => s + Number(f.calories||0), 0) / 7) : null;
  const foodAdjustment = avgDailyCalories && calorieTarget ? Math.max(-0.5, Math.min(0.5, ((calorieTarget - avgDailyCalories) / 3500) * 7)) : 0;
  const projectedWeeklyLoss = Math.max(0.25, Math.min(3, weightBasedWeeklyLoss + foodAdjustment));
  const projectedWeeksToGoal = Math.ceil(Math.max(0, Number(latestWeight.weight) - TARGET_WEIGHT) / projectedWeeklyLoss);
  const projectedGoalDate = new Date(); projectedGoalDate.setDate(projectedGoalDate.getDate() + projectedWeeksToGoal * 7);

  const activityMultipliers = { sedentary: 11, light: 12, moderate: 13, active: 14, very_active: 15 };
  const estimatedCalories = setupForm.startWeight ? Math.round((Number(setupForm.startWeight) * activityMultipliers[setupForm.activityLevel]) - 500) : 0;

  function flash(msg) { setSaved(msg); setTimeout(() => setSaved(""), 2000); }

  function addWeight() {
    if (!weightForm.weight) return;
    setWeights([...(weights||[]), { ...weightForm, id: uid(), weight: +weightForm.weight }]);
    setWeightForm({ date: todayISO(), weight: "", type: "morning", note: "" });
    flash("Weight saved ✓");
  }

  function addFood() {
    if (!foodForm.item) return;
    setFoods([...(foods||[]), { ...foodForm, id: uid(), calories: +(foodForm.calories||0), protein: +(foodForm.protein||0), carbs: +(foodForm.carbs||0), fat: +(foodForm.fat||0) }]);
    setFoodForm({ date: todayISO(), item: "", calories: "", protein: "", carbs: "", fat: "" });
    setAiResult(null);
    flash("Food saved ✓");
  }

  function addWorkout() {
    if (!workoutForm.type) return;
    setWorkouts([...(workouts||[]), { ...workoutForm, id: uid(), minutes: +(workoutForm.minutes||0) }]);
    setWorkoutForm({ date: todayISO(), type: "", minutes: "", note: "" });
    flash("Workout saved ✓");
  }

  function toggleTaken(id) { setTakenToday(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }

  function addSupplement() {
    if (!pendingSupp) return;
    setMySupplements(prev => [...prev, { id: uid(), name: pendingSupp.name, category: pendingSupp.category, dose: suppForm.dose || "—", unit: suppForm.dose ? suppForm.unit : "", schedule: suppForm.schedule, time: suppForm.time }]);
    setSuppView("items"); setPendingSupp(null);
    setSuppForm({ dose: "", unit: "mg", schedule: "Daily", time: "Morning" });
  }

  function saveSuppEdit() {
    setMySupplements(prev => prev.map(s => s.id === editingSupp.id ? { ...s, dose: suppForm.dose || "—", unit: suppForm.dose ? suppForm.unit : "", schedule: suppForm.schedule, time: suppForm.time } : s));
    setEditingSupp(null); setSuppView("my");
  }

  function deleteSupp(id) {
    setMySupplements(prev => prev.filter(s => s.id !== id));
    setTakenToday(prev => prev.filter(x => x !== id));
    setEditingSupp(null); setSuppView("my");
  }

  function addPeptideToStack() {
    if (!pendingPep) return;
    setPeptideStack(prev => [...prev, { id: uid(), name: pendingPep.name, category: pendingPep.category, desc: pendingPep.desc, dose: pepForm.dose || "—", unit: pepForm.unit || pendingPep.unit || "mg", frequency: pepForm.frequency || pendingPep.frequency || "", cycle: pepForm.cycle || pendingPep.cycle || "", notes: pepForm.notes, status: pepForm.status, dateAdded: todayISO() }]);
    setPepView("stack"); setPendingPep(null);
    setPepForm({ dose: "", unit: "mg", frequency: "", cycle: "", notes: "", status: "active" });
    flash("Peptide added ✓");
  }

  function savePepEdit() {
    setPeptideStack(prev => prev.map(p => p.id === editingPep.id ? { ...p, dose: pepForm.dose || "—", unit: pepForm.unit, frequency: pepForm.frequency, cycle: pepForm.cycle, notes: pepForm.notes, status: pepForm.status } : p));
    setEditingPep(null); setPepView("stack");
  }

  function deletePep(id) {
    setPeptideStack(prev => prev.filter(p => p.id !== id));
    setPeptideLogs(prev => { const n = {...prev}; delete n[id]; return n; });
    setEditingPep(null); setPepView("stack");
  }

  function logPeptideDose(peptideId) {
    if (!doseForm.dose) return;
    setPeptideLogs(prev => ({ ...prev, [peptideId]: [...(prev[peptideId] || []), { id: uid(), date: doseForm.date, dose: +doseForm.dose, note: doseForm.note }] }));
    setDoseForm({ date: todayISO(), dose: "", note: "" });
    flash("Dose logged ✓");
  }

  function removePeptideDose(peptideId, entryId) {
    setPeptideLogs(prev => ({ ...prev, [peptideId]: (prev[peptideId] || []).filter(e => e.id !== entryId) }));
  }

  async function lookupCalories() {
    if (!aiQuery.trim()) return;
    if (!apiKey) { setAiError("Add your Anthropic API key in Settings to use AI features."); return; }
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const data = await callClaude(apiKey, { system: `You are a nutrition estimator. Be conservative — if uncertain, estimate higher. Return ONLY valid JSON: {"food":"name","amount":"amount","calories_low":n,"calories_high":n,"calories_mid":n,"protein_low":n,"protein_high":n,"protein_mid":n,"carbs_low":n,"carbs_high":n,"carbs_mid":n,"fat_low":n,"fat_high":n,"fat_mid":n,"confidence":"high|medium|low","notes":"1 sentence"}`, messages: [{ role: "user", content: aiQuery }] });
      const parsed = JSON.parse(data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim());
      setAiResult(parsed);
      setFoodForm(f => ({ ...f, item: parsed.food + " (" + parsed.amount + ")", calories: String(parsed.calories_mid), protein: String(parsed.protein_mid), carbs: String(parsed.carbs_mid), fat: String(parsed.fat_mid) }));
    } catch(e) { setAiError("Lookup failed: " + e.message); }
    setAiLoading(false);
  }

  async function scanLabel() {
    if (!labelImage || !apiKey) { setAiError("Add your Anthropic API key in Settings to use AI features."); return; }
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const base64 = labelImage.split(",")[1]; const mediaType = labelImage.split(";")[0].split(":")[1];
      const data = await callClaude(apiKey, { system: `Nutrition analyst. Return ONLY JSON: {"food":"name","calories_mid":n,"calories_low":n,"calories_high":n,"protein_mid":n,"protein_low":n,"protein_high":n,"amount":"what user had","confidence":"high|medium|low","notes":"how identified"}`, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: servingInput ? `I had approximately: ${servingInput}` : "What is this and what are the nutrition facts?" }] }] });
      const parsed = JSON.parse(data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim());
      setAiResult(parsed);
      setFoodForm(f => ({ ...f, item: parsed.food + " (" + parsed.amount + ")", calories: String(parsed.calories_mid), protein: String(parsed.protein_mid) }));
    } catch(e) { setAiError("Scan failed: " + e.message); }
    setAiLoading(false);
  }

  async function getAIInsight() {
    if (sortedWeights.length < 2 || !apiKey) { setAiInsight(!apiKey ? "Add API key in ⚙️ Settings." : "Add a second weight entry to unlock."); return; }
    setInsightLoading(true); setAiInsight("");
    const activeStack = (peptideStack||[]).filter(p=>p.status==="active").map(p=>`${p.name} ${p.dose}${p.unit} ${p.frequency}`).join(", ");
    const recentFoods = (foods||[]).slice(-5).map(f=>`${f.item} (${f.calories}cal/${f.protein}p)`).join(", ");
    const recentWorkouts = (workouts||[]).slice(-5).map(w=>`${w.type} ${w.minutes}min`).join(", ");
    try {
      const data = await callClaude(apiKey, { messages: [{ role: "user", content: `Clinical health analyst. Peptide stack: ${activeStack||"none"}. Weight: ${START_WEIGHT}→${latestWeight.weight}lbs (${totalLost.toFixed(1)}lbs lost, ${pctLost(latestWeight.weight)}%). Week ${currentWeek}, ${activePhase.phase} phase. Food: ${recentFoods||"none"}. Training: ${recentWorkouts||"none"}. Write 3-4 sentence personalized breakdown. Clinical but warm. Reference specific numbers.` }] });
      setAiInsight(data.content?.map(b=>b.text||"").join("") || "Unable to generate insight.");
    } catch(e) { setAiInsight("Insight unavailable: " + e.message); }
    setInsightLoading(false);
  }

  const TABS = ["dashboard", "weight", "doses", "peptides", "food", "workouts", "supplements", "calculator"];
  const ICONS = { dashboard: Zap, weight: Scale, doses: Syringe, peptides: Dna, food: Utensils, workouts: Dumbbell, supplements: Pill, calculator: Calculator };

  // ── SETUP ──
  if (!HAS_SETUP) {
    return (
      <div style={S.page}>
        <div style={S.panel}>
          <h1 style={S.title}>Welcome to AXION</h1>
          <div style={S.form}>
            <label style={S.label}>Name</label>
            <input style={S.input} value={setupForm.name} onChange={e => setSetupForm({...setupForm, name: e.target.value})} />
            <label style={S.label}>Height</label>
            <div style={{ display:"flex", gap:8 }}>
              <input style={S.input} type="number" placeholder="Feet" value={setupForm.heightFeet} onChange={e => setSetupForm({...setupForm, heightFeet: e.target.value})} />
              <input style={S.input} type="number" placeholder="Inches" value={setupForm.heightInches} onChange={e => setSetupForm({...setupForm, heightInches: e.target.value})} />
            </div>
            <label style={S.label}>Start Weight</label>
            <input style={S.input} type="number" value={setupForm.startWeight} onChange={e => setSetupForm({...setupForm, startWeight: e.target.value})} />
            <label style={S.label}>Goal Weight</label>
            <input style={S.input} type="number" value={setupForm.targetWeight} onChange={e => setSetupForm({...setupForm, targetWeight: e.target.value})} />
            <label style={S.label}>Start Date</label>
            <input style={S.input} type="date" value={setupForm.startDate} onChange={e => setSetupForm({...setupForm, startDate: e.target.value})} />
            <label style={S.label}>Activity</label>
            <select style={S.input} value={setupForm.activityLevel} onChange={e => setSetupForm({...setupForm, activityLevel: e.target.value})}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light — 1–3x/wk</option>
              <option value="moderate">Moderate — 3–5x/wk</option>
              <option value="active">Active — 6–7x/wk</option>
              <option value="very_active">Very active</option>
            </select>
            {estimatedCalories > 0 && <div style={S.setupEstimate}>📊 Estimated target: {estimatedCalories} cal/day for ~1 lb/week loss.</div>}
            <button style={S.btn} onClick={() => {
              localStorage.setItem("tracker_name", setupForm.name);
              localStorage.setItem("tracker_height_feet", setupForm.heightFeet);
              localStorage.setItem("tracker_height_inches", setupForm.heightInches);
              localStorage.setItem("tracker_start_weight", setupForm.startWeight);
              localStorage.setItem("tracker_target_weight", setupForm.targetWeight);
              localStorage.setItem("tracker_start_date", setupForm.startDate);
              localStorage.setItem("tracker_activity_level", setupForm.activityLevel);
              localStorage.setItem("tracker_calorie_target", estimatedCalories);
              localStorage.setItem("tracker_setup_complete", "true");
              location.reload();
            }}>Start AXION</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <header style={S.heroHeader}><div style={S.axionMain}>AXION</div></header>
      <div style={{ position:"absolute", top:50, right:18 }}>
        <button onClick={() => { setTempKey(apiKey); setShowSettings(true); }} style={S.heroGear} title="Settings">
          <Settings size={22} strokeWidth={2.2} color="#4ade80" />
        </button>
      </div>

      {saved && <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:"#14532d", color:"#4ade80", border:"1px solid #4ade80", borderRadius:8, padding:"8px 20px", fontSize:13, fontFamily:"monospace", zIndex:200 }}>{saved}</div>}

      {showSettings && (
        <div style={S.modal} onClick={() => setShowSettings(false)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...S.panelTitle, marginTop:0 }}>⚙️ Settings</h2>
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:12 }}><b style={{ color:"#4ade80" }}>Anthropic API Key</b> (for AI features)</div>
            <input type="password" style={S.input} placeholder="sk-ant-api03-..." value={tempKey} onChange={e => setTempKey(e.target.value)} />
            <div style={{ fontSize:11, color:"#64748b", marginTop:8, fontFamily:"monospace" }}>Get a key at <span style={{ color:"#60a5fa" }}>console.anthropic.com</span>. ~$5 credit lasts months.</div>
            <div style={{ display:"flex", gap:8, marginTop:16 }}>
              <button style={{ ...S.btn, gridColumn:"unset", flex:1 }} onClick={() => { setApiKey(tempKey.trim()); setShowSettings(false); flash(tempKey.trim() ? "API key saved ✓" : "API key cleared"); }}>Save</button>
              {apiKey && <button style={{ ...S.btn, gridColumn:"unset", background:"#7f1d1d" }} onClick={() => { setApiKey(""); setTempKey(""); setShowSettings(false); flash("Key cleared"); }}>Clear</button>}
              <button style={{ ...S.btn, gridColumn:"unset", background:"#1e293b" }} onClick={() => setShowSettings(false)}>Cancel</button>
            </div>
            <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #1e293b", fontSize:11, color:"#64748b", fontFamily:"monospace" }}>
              Status: {apiKey ? <span style={{ color:"#4ade80" }}>✓ AI active</span> : <span style={{ color:"#fb7185" }}>✗ No key</span>}
            </div>
          </div>
        </div>
      )}

      {/* GOAL CARD */}
      <div style={S.goalCard}>
        <div style={S.goalLeft}><div><span style={S.goalBig}>{START_WEIGHT}</span><span style={S.goalUnit}>LBS</span></div><div style={S.goalLabel}>START</div></div>
        <div style={S.goalCircle}><div style={S.goalPct}>{progressPct.toFixed(1)}%</div><div style={S.goalCircleLabel}>TO GOAL</div></div>
        <div style={S.goalRight}><div><span style={S.goalBig}>{TARGET_WEIGHT}</span><span style={S.goalUnit}>LBS</span></div><div style={S.goalLabel}>GOAL</div></div>
        <div style={S.goalBarFull}><div style={{ ...S.goalBarFill, width:`${progressPct}%` }} /></div>
        <div style={S.goalBarLabels}><span>{START_WEIGHT}</span><span style={{ color:"#4ade80" }}>NOW: {latestWeight.weight}</span><span>{TARGET_WEIGHT}</span></div>
        <div style={S.goalPredictionInline}>
          <div style={S.goalPredictionInlineItem}><span style={S.goalPredictionInlineLabel}>PROJECTED</span><strong style={S.goalPredictionInlineValue}>{projectedGoalDate.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</strong></div>
          <div style={S.goalPredictionInlineItem}><span style={S.goalPredictionInlineLabel}>PACE</span><strong style={S.goalPredictionInlineValue}>{projectedWeeklyLoss.toFixed(1)} lb/wk</strong></div>
          <div style={S.goalPredictionInlineItem}><span style={S.goalPredictionInlineLabel}>WKS LEFT</span><strong style={S.goalPredictionInlineValue}>{projectedWeeksToGoal}</strong></div>
        </div>
      </div>

      {/* TABS */}
      <nav style={S.tabs}>
        {TABS.map(t => { const Icon = ICONS[t]; return (
          <button key={t} onClick={() => setTab(t)} style={tab===t ? S.activeTab : S.tab}>
            <Icon size={28} strokeWidth={1.8} color={tab===t ? "#4ade80" : "#e2e8f0"} />
            <span style={{ fontSize:11, textTransform:"capitalize" }}>{t}</span>
          </button>
        ); })}
      </nav>

      {/* ── DASHBOARD ── */}
      {tab === "dashboard" && <>
        <div style={S.grid}>
          {[["Current",`${latestWeight.weight}`,"lbs"],["Lowest",`${lowestWeight}`,"lbs"],["Lost",`${totalLost.toFixed(1)}`,"lbs"],["% BW",`${pctLost(latestWeight.weight)}`,"%"],["Avg/wk",`${avgPerWeek.toFixed(2)}`,"lbs"],[`To ${TARGET_WEIGHT}`,`${remainingToGoal.toFixed(1)}`,"lbs"],["Protein",`${todayProtein}`,"g"],["Calories",`${todayCals}`,"kcal"]].map(([l,v,u]) => (
            <div key={l} style={S.card}><div style={S.cardLabel}>{l}</div><div style={{ ...S.cardValue, color:"#4ade80" }}>{v}<span style={S.cardUnit}> {u}</span></div></div>
          ))}
        </div>
        <div style={S.panel}>
          <h2 style={S.panelTitle}>Today · {today}</h2>
          <div style={S.todayGrid}>
            <div style={S.todayBox}><div style={S.todayVal}>{todayCals}</div><div style={S.todayLbl}>calories</div></div>
            <div style={S.todayBox}><div style={S.todayVal}>{todayProtein}g</div><div style={S.todayLbl}>protein</div></div>
            <div style={S.todayBox}><div style={S.todayVal}>{todayMinutes}</div><div style={S.todayLbl}>train min</div></div>
            <div style={S.todayBox}><div style={S.todayVal}>{todayWorkouts.length}</div><div style={S.todayLbl}>sessions</div></div>
          </div>
        </div>
        {(peptideStack||[]).filter(p=>p.status==="active").length > 0 && (
          <div style={S.panel}>
            <h2 style={S.panelTitle}>🧬 Active Peptides</h2>
            {(peptideStack||[]).filter(p=>p.status==="active").map(p => (
              <div key={p.id} style={{ background:"#020617", border:"1px solid #1e293b", borderLeft:"3px solid #4ade80", borderRadius:10, padding:"10px 14px", marginBottom:8 }}>
                <div style={{ fontWeight:700, color:"#4ade80", fontSize:14 }}>{p.name}</div>
                <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{p.dose}{p.unit} · {p.frequency}</div>
              </div>
            ))}
          </div>
        )}
        <div style={S.panel}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h2 style={{ ...S.panelTitle, margin:0 }}>🧠 AI Health Breakdown</h2>
            <button onClick={getAIInsight} disabled={insightLoading || sortedWeights.length < 2} style={{ ...S.btn, gridColumn:"unset", marginTop:0, fontSize:11, padding:"6px 14px", opacity:insightLoading?0.6:1, background:"#1e3a5f", color:"#60a5fa", border:"1px solid #60a5fa" }}>{insightLoading ? "ANALYZING..." : "GENERATE"}</button>
          </div>
          {aiInsight ? <div style={{ background:"#020617", border:"1px solid #1e3a5f", borderRadius:10, padding:14, color:"#cbd5e1", fontSize:13, lineHeight:1.7 }}>{aiInsight}</div>
          : <div style={{ color:"#475569", fontSize:12, fontFamily:"monospace", fontStyle:"italic" }}>{sortedWeights.length < 2 ? "Add a second weight entry to unlock." : !apiKey ? "Add API key in ⚙️ Settings." : "Click GENERATE for a breakdown."}</div>}
        </div>
        {sortedWeights.length > 1 && <div style={S.panel}><h2 style={S.panelTitle}>Weight Trend</h2><WeightLineChart weights={sortedWeights} /></div>}
        <div style={S.guardrail}><span style={{ fontSize:18 }}>⚠️</span><span>If energy tanks, digestion stalls, or workouts fall apart — hydrate, hit protein, add carbs, sleep, keep dose changes disciplined.</span></div>
      </>}

      {/* ── WEIGHT ── */}
      {tab === "weight" && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>Weight Log</h2>
          <div style={S.form}>
            <label style={S.label}>Date</label>
            <input style={S.input} type="date" value={weightForm.date} onChange={e => setWeightForm({...weightForm, date:e.target.value})} />
            <label style={S.label}>Weight (lbs)</label>
            <input style={S.input} type="number" step="0.1" placeholder="e.g. 221.8" value={weightForm.weight} onChange={e => setWeightForm({...weightForm, weight:e.target.value})} />
            <label style={S.label}>Type</label>
            <select style={S.input} value={weightForm.type} onChange={e => setWeightForm({...weightForm, type:e.target.value})}>
              {["morning","post-bathroom","pre-bathroom","bedtime","other"].map(o => <option key={o}>{o}</option>)}
            </select>
            <label style={S.label}>Note</label>
            <input style={S.input} placeholder="Optional" value={weightForm.note} onChange={e => setWeightForm({...weightForm, note:e.target.value})} />
            <button style={S.btn} onClick={addWeight}>+ Add Weight</button>
          </div>
          <LogList items={[...sortedWeights].reverse()} render={w => <><b style={{ color:"#4ade80" }}>{w.weight} lbs</b> · {w.date} · {w.type}{w.note ? ` · ${w.note}` : ""}</>} onRemove={id => setWeights((weights||[]).filter(x=>x.id!==id))} />
        </div>
      )}

      {/* ── DOSES ── */}
      {tab === "doses" && (
        <div>
          {(peptideStack||[]).length === 0 && (
            <div style={{ ...S.panel, textAlign:"center", color:"#475569", fontFamily:"monospace" }}>
              No peptides in your stack yet. Add peptides in the 🧬 Peptides tab first.
            </div>
          )}
          {(peptideStack||[]).map(pep => {
            const logs = (peptideLogs[pep.id] || []).slice().sort((a,b) => new Date(b.date)-new Date(a.date));
            const total = logs.reduce((s,l) => s + +(l.dose||0), 0);
            const isActive = doseTab === pep.id;
            const sc = { active:"#4ade80", planned:"#fbbf24", completed:"#64748b" };
            return (
              <div key={pep.id} style={{ ...S.panel, borderLeft:`3px solid ${sc[pep.status]||"#475569"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color: sc[pep.status] }}>{pep.name}</div>
                    <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{pep.dose}{pep.unit} · {pep.frequency} · Total: {total.toFixed(3)}{pep.unit}</div>
                  </div>
                  <button onClick={() => setDoseTab(isActive ? null : pep.id)} style={{ ...S.btn, gridColumn:"unset", marginTop:0, fontSize:11, padding:"6px 14px", background:isActive?"#1e293b":"#1e3a5f", color:isActive?"#94a3b8":"#60a5fa", border:`1px solid ${isActive?"#334155":"#60a5fa"}` }}>{isActive ? "Close" : "+ Log Dose"}</button>
                </div>
                {isActive && (
                  <div style={{ background:"#020617", border:"1px solid #1e293b", borderRadius:12, padding:14, marginBottom:12 }}>
                    <div style={S.form}>
                      <label style={S.label}>Date</label>
                      <input style={S.input} type="date" value={doseForm.date} onChange={e => setDoseForm({...doseForm, date:e.target.value})} />
                      <label style={S.label}>Dose ({pep.unit})</label>
                      <input style={S.input} type="number" step="0.025" placeholder={pep.dose} value={doseForm.dose} onChange={e => setDoseForm({...doseForm, dose:e.target.value})} />
                      <label style={S.label}>Note</label>
                      <input style={S.input} placeholder="Optional" value={doseForm.note} onChange={e => setDoseForm({...doseForm, note:e.target.value})} />
                      <button style={S.btn} onClick={() => logPeptideDose(pep.id)}>+ Log Dose</button>
                    </div>
                  </div>
                )}
                {logs.length > 0 ? (
                  <div style={S.logList}>
                    {logs.slice(0,10).map(l => (
                      <div key={l.id} style={S.logItem}>
                        <span style={S.logText}><b style={{ color:"#fb7185" }}>{l.dose} {pep.unit}</b> · {l.date}{l.note ? ` · ${l.note}` : ""}</span>
                        <button style={S.deleteBtn} onClick={() => removePeptideDose(pep.id, l.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color:"#475569", fontSize:12, fontFamily:"monospace" }}>No doses logged yet.</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── PEPTIDES ── */}
      {tab === "peptides" && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>🧬 Peptides</h2>

          {(pepView === "stack" || pepView === "cats" || pepView === "items") && (
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <button onClick={() => setPepView("stack")} style={pepView==="stack" ? S.pillActive : S.pill}>My Stack ({(peptideStack||[]).length})</button>
              <button onClick={() => setPepView("cats")} style={(pepView==="cats"||pepView==="items") ? S.pillActive : S.pill}>Library</button>
            </div>
          )}

          {/* MY STACK */}
          {pepView === "stack" && <>
            {(peptideStack||[]).length === 0 && <div style={{ color:"#475569", fontSize:13, fontFamily:"monospace", padding:"12px 0" }}>No peptides yet. Browse the library to add.</div>}
            {(peptideStack||[]).map(p => {
              const sc = { active:"#4ade80", planned:"#fbbf24", completed:"#64748b" };
              const logs = peptideLogs[p.id] || [];
              const total = logs.reduce((s,l)=>s++(l.dose||0),0);
              return (
                <div key={p.id} style={{ background:"#020617", border:"1px solid #1e293b", borderLeft:`3px solid ${sc[p.status]||"#475569"}`, borderRadius:12, padding:14, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontSize:15, fontWeight:700, color:sc[p.status] }}>{p.name}</span>
                        <span style={{ fontSize:10, fontFamily:"monospace", background:sc[p.status]+"22", color:sc[p.status], borderRadius:4, padding:"2px 7px" }}>{p.status.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginTop:4 }}>{p.dose}{p.unit} · {p.frequency}{p.cycle ? ` · ${p.cycle}` : ""}</div>
                      <div style={{ fontSize:11, color:"#475569", fontFamily:"monospace", marginTop:2 }}>Total logged: {total.toFixed(3)}{p.unit} · {logs.length} doses</div>
                      {p.notes && <div style={{ fontSize:11, color:"#94a3b8", marginTop:4, fontStyle:"italic" }}>{p.notes}</div>}
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button onClick={() => { setEditingPep(p); setPepForm({ dose:p.dose==="—"?"":p.dose, unit:p.unit, frequency:p.frequency, cycle:p.cycle, notes:p.notes||"", status:p.status }); setPepView("edit"); }} style={{ background:"#0f172a", border:"1px solid #1e293b", color:"#60a5fa", cursor:"pointer", borderRadius:6, padding:"4px 8px", fontSize:11 }}>Edit</button>
                      <button onClick={() => deletePep(p.id)} style={{ background:"transparent", border:"1px solid #450a0a", color:"#ef4444", cursor:"pointer", borderRadius:6, padding:"4px 8px", fontSize:11 }}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button style={{ ...S.btn, marginTop:8 }} onClick={() => setPepView("cats")}>+ Add Peptide</button>
          </>}

          {/* EDIT */}
          {pepView === "edit" && editingPep && (
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:"#f8fafc", marginBottom:14 }}>{editingPep.name}</div>
              <div style={S.form}>
                <label style={S.label}>Dose</label>
                <div style={{ display:"flex", gap:6 }}>
                  <input style={{ ...S.input, flex:1 }} type="number" step="0.1" value={pepForm.dose} onChange={e => setPepForm({...pepForm, dose:e.target.value})} />
                  <select style={{ ...S.input, width:80 }} value={pepForm.unit} onChange={e => setPepForm({...pepForm, unit:e.target.value})}>
                    {["mg","mcg","g","IU","mL"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <label style={S.label}>Frequency</label>
                <input style={S.input} value={pepForm.frequency} onChange={e => setPepForm({...pepForm, frequency:e.target.value})} />
                <label style={S.label}>Cycle</label>
                <input style={S.input} value={pepForm.cycle} onChange={e => setPepForm({...pepForm, cycle:e.target.value})} />
                <label style={S.label}>Status</label>
                <select style={S.input} value={pepForm.status} onChange={e => setPepForm({...pepForm, status:e.target.value})}>
                  {["active","planned","completed"].map(o => <option key={o}>{o}</option>)}
                </select>
                <label style={S.label}>Notes</label>
                <input style={S.input} value={pepForm.notes} onChange={e => setPepForm({...pepForm, notes:e.target.value})} />
              </div>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button style={{ ...S.btn, gridColumn:"unset", flex:1, background:"#7f1d1d" }} onClick={() => deletePep(editingPep.id)}>Remove</button>
                <button style={{ ...S.btn, gridColumn:"unset", flex:1 }} onClick={savePepEdit}>Save changes</button>
              </div>
              <button style={{ ...S.btn, gridColumn:"unset", width:"100%", marginTop:8, background:"#1e293b", color:"#94a3b8" }} onClick={() => { setPepView("stack"); setEditingPep(null); }}>Cancel</button>
            </div>
          )}

          {/* CATEGORIES */}
          {pepView === "cats" && (
            <>
              <button style={{ ...S.btn, gridColumn:"unset", background:"#020617", border:"1px solid #334155", color:"#94a3b8", marginBottom:12 }} onClick={() => setPepView("stack")}>← Back to Stack</button>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {Object.keys(PEPTIDE_LIBRARY).map(cat => (
                  <button key={cat} onClick={() => { setPepActiveCat(cat); setPepView("items"); }} style={{ background:"#020617", border:"1px solid rgba(74,222,128,0.18)", borderRadius:14, padding:14, color:"#f8fafc", textAlign:"left", cursor:"pointer" }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{cat}</div>
                    <div style={{ marginTop:4, fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{PEPTIDE_LIBRARY[cat].length} peptides</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ITEMS */}
          {pepView === "items" && pepActiveCat && (
            <>
              <button style={{ ...S.btn, gridColumn:"unset", background:"#020617", border:"1px solid #334155", color:"#94a3b8", marginBottom:12 }} onClick={() => setPepView("cats")}>← {pepActiveCat}</button>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {PEPTIDE_LIBRARY[pepActiveCat].map(pep => (
                  <button key={pep.name} onClick={() => { setPendingPep({...pep, category:pepActiveCat}); setPepForm({ dose:"", unit:pep.unit||"mg", frequency:pep.frequency||"", cycle:pep.cycle||"", notes:"", status:"active" }); setPepView("add"); }} style={{ background:"#020617", border:"1px solid rgba(74,222,128,0.18)", borderRadius:12, padding:"12px 14px", color:"#e2e8f0", textAlign:"left", cursor:"pointer" }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{pep.name}</div>
                    <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginTop:2 }}>{pep.typicalDose} · {pep.frequency}</div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:4, lineHeight:1.5 }}>{pep.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ADD FORM */}
          {pepView === "add" && pendingPep && (
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:"#f8fafc", marginBottom:4 }}>{pendingPep.name}</div>
              <div style={{ fontSize:12, color:"#64748b", fontFamily:"monospace", marginBottom:14, lineHeight:1.5 }}>{pendingPep.desc}</div>
              <div style={{ background:"#020617", border:"1px solid #1e293b", borderRadius:8, padding:10, marginBottom:14, fontSize:11, color:"#94a3b8", fontFamily:"monospace" }}>
                Typical: {pendingPep.typicalDose} · {pendingPep.frequency} · Cycle: {pendingPep.cycle}
              </div>
              <div style={S.form}>
                <label style={S.label}>Dose</label>
                <div style={{ display:"flex", gap:6 }}>
                  <input style={{ ...S.input, flex:1 }} type="number" step="0.1" placeholder={pendingPep.typicalDose} value={pepForm.dose} onChange={e => setPepForm({...pepForm, dose:e.target.value})} />
                  <select style={{ ...S.input, width:80 }} value={pepForm.unit} onChange={e => setPepForm({...pepForm, unit:e.target.value})}>
                    {["mg","mcg","g","IU","mL"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <label style={S.label}>Frequency</label>
                <input style={S.input} placeholder={pendingPep.frequency} value={pepForm.frequency} onChange={e => setPepForm({...pepForm, frequency:e.target.value})} />
                <label style={S.label}>Cycle</label>
                <input style={S.input} placeholder={pendingPep.cycle} value={pepForm.cycle} onChange={e => setPepForm({...pepForm, cycle:e.target.value})} />
                <label style={S.label}>Status</label>
                <select style={S.input} value={pepForm.status} onChange={e => setPepForm({...pepForm, status:e.target.value})}>
                  {["active","planned","completed"].map(o => <option key={o}>{o}</option>)}
                </select>
                <label style={S.label}>Notes</label>
                <input style={S.input} placeholder="Protocol notes..." value={pepForm.notes} onChange={e => setPepForm({...pepForm, notes:e.target.value})} />
              </div>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button style={{ ...S.btn, gridColumn:"unset", flex:1, background:"#1e293b", color:"#94a3b8" }} onClick={() => { setPepView("items"); setPendingPep(null); }}>Cancel</button>
                <button style={{ ...S.btn, gridColumn:"unset", flex:1 }} onClick={addPeptideToStack}>Add to Stack</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FOOD ── */}
      {tab === "food" && (
        <div>
          <div style={S.panel}>
            <h2 style={S.panelTitle}>🤖 AI Calorie Lookup</h2>
            {!apiKey && <div style={{ background:"#451a03", border:"1px solid #fb923c", borderRadius:8, padding:12, marginBottom:12, fontSize:12, color:"#fb923c", fontFamily:"monospace" }}>⚙️ Add your API key in Settings to enable AI features</div>}
            <div style={{ display:"flex", gap:6, marginBottom:14 }}>
              <button style={labelMode==="text" ? S.pillActive : S.pill} onClick={() => { setLabelMode("text"); setAiResult(null); setAiError(""); }}>✏️ Describe it</button>
              <button style={labelMode==="camera" ? { ...S.pillActive, borderColor:"#fb7185", color:"#fb7185", background:"#2d0a12" } : S.pill} onClick={() => { setLabelMode("camera"); setAiResult(null); setAiError(""); }}>📷 Photo / Scan</button>
            </div>
            {labelMode === "text" && (
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <input style={{ ...S.input, flex:1 }} placeholder='"2 eggs and toast"' value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && lookupCalories()} />
                <button style={{ ...S.btn, gridColumn:"unset", minWidth:90, opacity:aiLoading?0.6:1 }} onClick={lookupCalories} disabled={aiLoading}>{aiLoading ? "..." : "Look up"}</button>
              </div>
            )}
            {labelMode === "camera" && (
              <>
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <label style={{ ...S.cameraBtn, flex:1, textAlign:"center" }}>📷 Take Photo<input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>setLabelImage(ev.target.result); r.readAsDataURL(f); e.target.value=""; }} /></label>
                  <label style={{ ...S.cameraBtn, flex:1, textAlign:"center", background:"#1e293b" }}>🖼️ Upload<input type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>setLabelImage(ev.target.result); r.readAsDataURL(f); e.target.value=""; }} /></label>
                </div>
                {labelImage && (
                  <div style={{ marginBottom:10 }}>
                    <img src={labelImage} alt="Food" style={{ maxWidth:"100%", maxHeight:220, borderRadius:8, border:"1px solid #1e293b", display:"block", marginBottom:8 }} />
                    <input style={{ ...S.input, marginBottom:8 }} placeholder='How much? e.g. "the whole can"' value={servingInput} onChange={e => setServingInput(e.target.value)} />
                    <div style={{ display:"flex", gap:8 }}>
                      <button style={{ ...S.btn, gridColumn:"unset", flex:1, opacity:aiLoading?0.6:1 }} onClick={scanLabel} disabled={aiLoading}>{aiLoading ? "Identifying..." : "🔍 Identify"}</button>
                      <button style={{ ...S.btn, gridColumn:"unset", background:"#7f1d1d", minWidth:60 }} onClick={() => { setLabelImage(null); setServingInput(""); setAiResult(null); }}>✕</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {aiError && <div style={{ color:"#ef4444", fontSize:13, fontFamily:"monospace", marginBottom:8 }}>{aiError}</div>}
            {aiResult && (
              <div style={S.aiResultBox}>
                <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                  <div><div style={{ fontWeight:700, fontSize:16, color:"#f8fafc" }}>{aiResult.food}</div><div style={{ color:"#64748b", fontSize:12, fontFamily:"monospace" }}>{aiResult.amount}</div></div>
                  <div style={{ fontSize:10, fontFamily:"monospace", letterSpacing:1, padding:"3px 10px", borderRadius:20, background:aiResult.confidence==="high"?"#14532d":aiResult.confidence==="medium"?"#451a03":"#1e1b4b", color:aiResult.confidence==="high"?"#4ade80":aiResult.confidence==="medium"?"#fb923c":"#a78bfa", border:`1px solid ${aiResult.confidence==="high"?"#4ade80":aiResult.confidence==="medium"?"#fb923c":"#a78bfa"}` }}>{aiResult.confidence}</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  <div style={S.aiStatBox}><div style={S.aiStatLabel}>Calories</div><div style={{ fontSize:28, fontWeight:900, color:"#4ade80" }}>{aiResult.calories_mid}</div><div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{aiResult.calories_low}–{aiResult.calories_high}</div></div>
                  <div style={S.aiStatBox}><div style={S.aiStatLabel}>Protein</div><div style={{ fontSize:28, fontWeight:900, color:"#4ade80" }}>{aiResult.protein_mid}g</div><div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{aiResult.protein_low}–{aiResult.protein_high}g</div></div>
                </div>
                {aiResult.notes && <div style={{ color:"#64748b", fontSize:12, fontFamily:"monospace", marginBottom:12, fontStyle:"italic" }}>💬 {aiResult.notes}</div>}
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ ...S.btn, gridColumn:"unset", fontSize:13 }} onClick={() => setFoodForm(f=>({...f,calories:String(aiResult.calories_low),protein:String(aiResult.protein_low)}))}>Low</button>
                  <button style={{ ...S.btn, gridColumn:"unset", fontSize:13, background:"#b45309" }} onClick={() => setFoodForm(f=>({...f,calories:String(aiResult.calories_mid),protein:String(aiResult.protein_mid)}))}>Mid ✓</button>
                  <button style={{ ...S.btn, gridColumn:"unset", fontSize:13, background:"#7c3aed" }} onClick={() => setFoodForm(f=>({...f,calories:String(aiResult.calories_high),protein:String(aiResult.protein_high)}))}>High</button>
                </div>
              </div>
            )}
          </div>
          <div style={S.panel}>
            <h2 style={S.panelTitle}>Food Log · Today: {todayCals} cal / {todayProtein}g protein</h2>
            <div style={S.form}>
              <label style={S.label}>Date</label>
              <input style={S.input} type="date" value={foodForm.date} onChange={e => setFoodForm({...foodForm, date:e.target.value})} />
              <label style={S.label}>Food</label>
              <input style={S.input} placeholder="Chicken breast 6oz" value={foodForm.item} onChange={e => setFoodForm({...foodForm, item:e.target.value})} />
              <label style={S.label}>Calories</label>
              <input style={S.input} type="number" placeholder="280" value={foodForm.calories} onChange={e => setFoodForm({...foodForm, calories:e.target.value})} />
              <label style={S.label}>Protein (g)</label>
              <input style={S.input} type="number" placeholder="50" value={foodForm.protein} onChange={e => setFoodForm({...foodForm, protein:e.target.value})} />
              <button style={S.btn} onClick={addFood}>+ Log Food</button>
            </div>
            <LogList items={[...(foods||[])].sort((a,b)=>new Date(b.date)-new Date(a.date))} render={f=><><b style={{ color:"#f59e0b" }}>{f.item}</b> · {f.date} · {f.calories} cal · {f.protein}g</>} onRemove={id => setFoods((foods||[]).filter(x=>x.id!==id))} />
          </div>
        </div>
      )}

      {/* ── WORKOUTS ── */}
      {tab === "workouts" && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>Workout Log · Today: {todayMinutes} min</h2>
          <div style={S.form}>
            <label style={S.label}>Date</label>
            <input style={S.input} type="date" value={workoutForm.date} onChange={e => setWorkoutForm({...workoutForm, date:e.target.value})} />
            <label style={S.label}>Type</label>
            <input style={S.input} placeholder="cardio, weights, walk..." value={workoutForm.type} onChange={e => setWorkoutForm({...workoutForm, type:e.target.value})} />
            <label style={S.label}>Minutes</label>
            <input style={S.input} type="number" placeholder="60" value={workoutForm.minutes} onChange={e => setWorkoutForm({...workoutForm, minutes:e.target.value})} />
            <label style={S.label}>Notes</label>
            <input style={S.input} placeholder="Energy, PRs..." value={workoutForm.note} onChange={e => setWorkoutForm({...workoutForm, note:e.target.value})} />
            <button style={S.btn} onClick={addWorkout}>+ Log Workout</button>
          </div>
          <LogList items={[...(workouts||[])].sort((a,b)=>new Date(b.date)-new Date(a.date))} render={w=><><b style={{ color:"#60a5fa" }}>{w.type}</b> · {w.date} · {w.minutes} min{w.note?` · ${w.note}`:""}</>} onRemove={id => setWorkouts((workouts||[]).filter(x=>x.id!==id))} />
        </div>
      )}

      {/* ── SUPPLEMENTS ── */}
      {tab === "supplements" && (
        <div style={S.panel}>
          <h2 style={S.panelTitle}>💊 Supplements</h2>

          {(suppView === "my" || suppView === "cats" || suppView === "items") && (
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", letterSpacing:1, marginBottom:10 }}>MY SUPPLEMENTS</div>
              {mySupplements.length === 0 && <div style={{ color:"#475569", fontSize:13, fontFamily:"monospace", padding:"12px 0" }}>None saved yet. Browse the library below.</div>}
              {mySupplements.map(s => {
                const taken = takenToday.includes(s.id);
                return (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, background:taken?"#052e16":"#020617", border:`1px solid ${taken?"#166534":"#1e293b"}`, borderRadius:12, padding:"10px 14px", marginBottom:8, cursor:"pointer" }}
                    onClick={() => { setEditingSupp(s); setSuppForm({ dose:s.dose==="—"?"":s.dose, unit:s.unit||"mg", schedule:s.schedule, time:s.time }); setSuppView("detail"); }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:"#e2e8f0" }}>{s.name}</div>
                      <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginTop:2 }}>{s.dose}{s.unit} · {s.schedule} · {s.time}</div>
                      {taken && <div style={{ fontSize:10, color:"#4ade80", fontFamily:"monospace", marginTop:3 }}>✓ TAKEN TODAY</div>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleTaken(s.id); }} style={{ width:34, height:34, borderRadius:"50%", border:`1px solid ${taken?"#4ade80":"#334155"}`, background:taken?"#14532d":"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:taken?"#4ade80":"#475569", flexShrink:0 }} title={taken?"Mark not taken":"Mark as taken"}>✓</button>
                  </div>
                );
              })}
            </div>
          )}

          {suppView === "detail" && editingSupp && (
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:"#f8fafc", marginBottom:14 }}>{editingSupp.name}</div>
              <div style={S.form}>
                <label style={S.label}>Dose</label>
                <div style={{ display:"flex", gap:6 }}>
                  <input style={{ ...S.input, flex:1 }} type="number" placeholder="500" value={suppForm.dose} onChange={e => setSuppForm({...suppForm, dose:e.target.value})} />
                  <select style={{ ...S.input, width:80 }} value={suppForm.unit} onChange={e => setSuppForm({...suppForm, unit:e.target.value})}>
                    {["mg","mcg","g","IU","mL"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <label style={S.label}>Schedule</label>
                <select style={S.input} value={suppForm.schedule} onChange={e => setSuppForm({...suppForm, schedule:e.target.value})}>
                  {["Daily","Twice daily","Every other day","Weekly","As needed"].map(o => <option key={o}>{o}</option>)}
                </select>
                <label style={S.label}>Time</label>
                <select style={S.input} value={suppForm.time} onChange={e => setSuppForm({...suppForm, time:e.target.value})}>
                  {["Morning","Afternoon","Evening","Night","With meals","Pre-workout","Post-workout"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button style={{ ...S.btn, gridColumn:"unset", flex:1, background:"#7f1d1d" }} onClick={() => deleteSupp(editingSupp.id)}>Remove</button>
                <button style={{ ...S.btn, gridColumn:"unset", flex:1 }} onClick={saveSuppEdit}>Save changes</button>
              </div>
              <button style={{ ...S.btn, gridColumn:"unset", width:"100%", marginTop:8, background:"#1e293b", color:"#94a3b8" }} onClick={() => { setSuppView("my"); setEditingSupp(null); }}>Cancel</button>
            </div>
          )}

          {suppView === "add" && pendingSupp && (
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#f8fafc", marginBottom:14 }}>Add {pendingSupp.name}</div>
              <div style={S.form}>
                <label style={S.label}>Dose</label>
                <div style={{ display:"flex", gap:6 }}>
                  <input style={{ ...S.input, flex:1 }} type="number" placeholder="500" value={suppForm.dose} onChange={e => setSuppForm({...suppForm, dose:e.target.value})} />
                  <select style={{ ...S.input, width:80 }} value={suppForm.unit} onChange={e => setSuppForm({...suppForm, unit:e.target.value})}>
                    {["mg","mcg","g","IU","mL"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <label style={S.label}>Schedule</label>
                <select style={S.input} value={suppForm.schedule} onChange={e => setSuppForm({...suppForm, schedule:e.target.value})}>
                  {["Daily","Twice daily","Every other day","Weekly","As needed"].map(o => <option key={o}>{o}</option>)}
                </select>
                <label style={S.label}>Time</label>
                <select style={S.input} value={suppForm.time} onChange={e => setSuppForm({...suppForm, time:e.target.value})}>
                  {["Morning","Afternoon","Evening","Night","With meals","Pre-workout","Post-workout"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button style={{ ...S.btn, gridColumn:"unset", flex:1, background:"#1e293b", color:"#94a3b8" }} onClick={() => { setSuppView("items"); setPendingSupp(null); }}>Cancel</button>
                <button style={{ ...S.btn, gridColumn:"unset", flex:1 }} onClick={addSupplement}>Save supplement</button>
              </div>
            </div>
          )}

          {(suppView === "my" || suppView === "cats") && (
            <>
              <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", letterSpacing:1, marginBottom:10, marginTop:4 }}>LIBRARY</div>
              {suppView === "cats" && <button style={{ ...S.btn, gridColumn:"unset", background:"#020617", border:"1px solid #334155", color:"#94a3b8", marginBottom:10 }} onClick={() => setSuppView("my")}>← Back</button>}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {Object.keys(SUPPLEMENT_LIBRARY).map(cat => (
                  <button key={cat} onClick={() => { setSuppActiveCat(cat); setSuppView("items"); }} style={{ background:"#020617", border:"1px solid rgba(74,222,128,0.18)", borderRadius:14, padding:14, color:"#f8fafc", textAlign:"left", cursor:"pointer" }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{cat.replace(/([A-Z])/g," $1").trim()}</div>
                    <div style={{ marginTop:4, fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{SUPPLEMENT_LIBRARY[cat].length} options</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {suppView === "items" && suppActiveCat && (
            <>
              <button style={{ ...S.btn, gridColumn:"unset", background:"#020617", border:"1px solid #334155", color:"#94a3b8", marginBottom:12 }} onClick={() => setSuppView("cats")}>← Back</button>
              <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", fontFamily:"monospace", marginBottom:10 }}>{suppActiveCat.replace(/([A-Z])/g," $1").trim()}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {SUPPLEMENT_LIBRARY[suppActiveCat].map(item => (
                  <button key={item} onClick={() => { setPendingSupp({ name:item, category:suppActiveCat }); setSuppForm({ dose:"", unit:"mg", schedule:"Daily", time:"Morning" }); setSuppView("add"); }} style={{ background:"#020617", border:"1px solid rgba(74,222,128,0.18)", borderRadius:12, padding:"11px 14px", color:"#e2e8f0", fontWeight:700, textAlign:"left", cursor:"pointer" }}>{item}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CALCULATOR ── */}
      {tab === "calculator" && <PeptideCalculator />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────
function WeightLineChart({ weights }) {
  const points = weights.slice(-8);
  const values = points.map(w => Number(w.weight));
  const min = Math.min(...values) - 1; const max = Math.max(...values) + 1;
  const W = 360; const H = 180; const pad = 28;
  const x = i => pad + (i / Math.max(1, points.length-1)) * (W - pad*2);
  const y = w => H - pad - ((w-min) / Math.max(1,max-min)) * (H - pad*2);
  const line = points.map((p,i) => `${x(i)},${y(Number(p.weight))}`).join(" ");
  return (
    <div style={S.lineChartWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} style={S.lineChartSvg}>
        {[0,1,2,3].map(i => <line key={i} x1={pad} y1={pad+i*((H-pad*2)/3)} x2={W-pad} y2={pad+i*((H-pad*2)/3)} stroke="rgba(74,222,128,0.12)" strokeWidth="1" />)}
        <polyline points={line} fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p,i) => (
          <g key={p.id||i}>
            <circle cx={x(i)} cy={y(Number(p.weight))} r="4" fill="#4ade80" />
            <text x={x(i)} y={y(Number(p.weight))-10} textAnchor="middle" fill="#e2e8f0" fontSize="10">{p.weight}</text>
            <text x={x(i)} y={H-6} textAnchor="middle" fill="#94a3b8" fontSize="9">{p.date.slice(5)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PeptideCalculator() {
  const [peptide, setPeptide] = useState(CALC_PRESETS[0].name);
  const [vialMg, setVialMg] = useState("10");
  const [bacMl, setBacMl] = useState("2");
  const [dose, setDose] = useState("1");
  const [unit, setUnit] = useState("mg");
  const [syringe, setSyringe] = useState("100");
  const [custom, setCustom] = useState("");
  const preset = CALC_PRESETS.find(p=>p.name===peptide)||CALC_PRESETS[0];
  const vN=parseFloat(vialMg)||0; const bN=parseFloat(bacMl)||0; const dN=parseFloat(dose)||0;
  const conc = bN>0 ? vN/bN : 0;
  const dMg = unit==="mcg" ? dN/1000 : dN;
  const injectMl = conc>0 ? dMg/conc : 0;
  const injectU = injectMl / (1/parseFloat(syringe));
  const dosesPerVial = dMg>0 ? vN/dMg : 0;
  const valid = conc>0 && dMg>0 && injectMl>0;
  return (
    <div>
      <div style={S.panel}>
        <h2 style={S.panelTitle}>🧮 Reconstitution Calculator</h2>
        <div style={S.calcSection}>
          <div style={S.calcLabel}>Peptide</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {CALC_PRESETS.map(p => <button key={p.name} style={peptide===p.name?S.pillActive:S.pill} onClick={() => { setPeptide(p.name); setUnit(p.unit); if(p.commonDoses.length) setDose(String(p.commonDoses[0])); }}>{p.name}</button>)}
          </div>
          {peptide==="Custom" && <input style={{ ...S.input, marginTop:8 }} placeholder="Custom name" value={custom} onChange={e=>setCustom(e.target.value)} />}
        </div>
        <div style={S.calcGrid}>
          <div><div style={S.calcLabel}>Vial (mg)</div><input style={S.calcInput} type="number" step="0.5" value={vialMg} onChange={e=>setVialMg(e.target.value)} /></div>
          <div><div style={S.calcLabel}>BAC Water (mL)</div><input style={S.calcInput} type="number" step="0.5" value={bacMl} onChange={e=>setBacMl(e.target.value)} /></div>
          <div><div style={S.calcLabel}>Dose</div><div style={{ display:"flex", gap:6 }}><input style={{ ...S.calcInput, flex:1 }} type="number" step="0.1" value={dose} onChange={e=>setDose(e.target.value)} /><select style={{ ...S.calcInput, width:72 }} value={unit} onChange={e=>setUnit(e.target.value)}><option value="mg">mg</option><option value="mcg">mcg</option></select></div></div>
          <div><div style={S.calcLabel}>Syringe</div><select style={S.calcInput} value={syringe} onChange={e=>setSyringe(e.target.value)}><option value="100">100u (1mL)</option><option value="50">50u (0.5mL)</option><option value="30">30u (0.3mL)</option></select></div>
        </div>
        {preset.commonDoses.length > 0 && (
          <div style={S.calcSection}>
            <div style={S.calcLabel}>Quick dose</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {preset.commonDoses.map(d => <button key={d} style={dose===String(d)?S.pillActive:S.pill} onClick={()=>setDose(String(d))}>{d} {preset.unit}</button>)}
            </div>
          </div>
        )}
        {valid ? (
          <div style={S.resultBox}>
            <div style={S.resultTitle}>📐 Results — {peptide==="Custom"?(custom||"Custom"):peptide}</div>
            <div style={S.resultGrid}>
              <div style={S.resultStat}><div style={{ fontSize:10, color:"#475569", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Concentration</div><div style={{ fontSize:22, fontWeight:900, color:"#60a5fa" }}>{conc.toFixed(4)}</div><div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>mg/mL</div></div>
              <div style={S.resultStat}><div style={{ fontSize:10, color:"#475569", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Inject volume</div><div style={{ fontSize:22, fontWeight:900, color:"#4ade80" }}>{injectMl.toFixed(4)}</div><div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>mL</div></div>
              <div style={S.resultStat}><div style={{ fontSize:10, color:"#475569", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Syringe mark</div><div style={{ fontSize:28, fontWeight:900, color:"#f59e0b" }}>{injectU.toFixed(1)}</div><div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>units ({syringe}U)</div></div>
              <div style={S.resultStat}><div style={{ fontSize:10, color:"#475569", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Doses/vial</div><div style={{ fontSize:22, fontWeight:900, color:"#a78bfa" }}>{dosesPerVial.toFixed(1)}</div><div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>injections</div></div>
            </div>
            <div style={{ marginTop:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span style={S.calcLabel}>Syringe fill</span><span style={{ color:"#f59e0b", fontFamily:"monospace", fontSize:13 }}>{Math.min(100,(injectU/+syringe)*100).toFixed(1)}%</span></div>
              <div style={{ background:"#1e293b", borderRadius:999, height:22, overflow:"hidden" }}><div style={{ height:"100%", borderRadius:999, width:`${Math.min(100,(injectU/+syringe)*100)}%`, background:injectU>+syringe?"#ef4444":"linear-gradient(90deg, #f59e0b, #fb923c)" }} /></div>
            </div>
          </div>
        ) : <div style={{ color:"#475569", padding:16, textAlign:"center", fontFamily:"monospace", fontSize:13 }}>Fill in all fields</div>}
      </div>
      <div style={S.panel}>
        <h2 style={S.panelTitle}>🧊 Storage & Safety</h2>
        {[["❄️","Unreconstituted","Freezer (−20°C). Protect from light. Stable 12–24 months."],["🧴","Reconstituted","Refrigerate 2–8°C. Stable 4–8 weeks. Label with date."],["🪟","BAC Water","0.9% benzyl alcohol. Inject slowly down side of vial."],["🌀","Mixing","Gently swirl, never shake. Shaking degrades peptides."],["🩺","Injection","Subcutaneous into belly, love handles, or thigh. Rotate."],["🧹","Hygiene","Alcohol swab before each draw. Fresh needle every time."]].map(([icon,title,body]) => (
          <div key={title} style={S.suppCard}><div style={{ fontSize:22, flexShrink:0 }}>{icon}</div><div><div style={S.suppName}>{title}</div><div style={S.suppNote}>{body}</div></div></div>
        ))}
      </div>
    </div>
  );
}

function LogList({ items, render, onRemove }) {
  if (!items.length) return <div style={{ color:"#475569", padding:16, textAlign:"center" }}>No entries yet</div>;
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

// ─────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight:"100vh", background:"radial-gradient(circle at top, rgba(22,163,74,0.18) 0%, #020403 24%, #000000 72%)", color:"#f8fafc", padding:"42px 12px 48px", fontFamily:"Inter, Arial, sans-serif", maxWidth:430, margin:"0 auto" },
  title: { margin:"0 0 4px", fontSize:28, fontWeight:900, letterSpacing:-1, color:"#f8fafc" },
  heroHeader: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginBottom:22, gap:12, textAlign:"center" },
  axionMain: { marginTop:55, fontSize:58, lineHeight:0.9, fontWeight:900, letterSpacing:13, color:"#f8fafc", fontFamily:"Impact, Arial Black, sans-serif", textTransform:"uppercase", textShadow:"0 0 10px rgba(255,255,255,0.12)" },
  heroGear: { width:54, height:54, borderRadius:16, background:"linear-gradient(145deg, rgba(0,0,0,0.96), rgba(20,83,45,0.32))", border:"1px solid rgba(74,222,128,0.35)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 0 22px rgba(74,222,128,0.18), inset 0 0 12px rgba(74,222,128,0.05)", backdropFilter:"blur(10px)", transition:"all 0.18s ease" },
  modal: { position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16 },
  modalBox: { background:"#0f172a", border:"1px solid #1e293b", borderRadius:14, padding:20, maxWidth:480, width:"100%" },
  goalCard: { display:"grid", gridTemplateColumns:"1fr 120px 1fr", alignItems:"center", gap:12, background:"radial-gradient(circle at center, rgba(74,222,128,0.15), rgba(0,0,0,0.98) 58%)", border:"1px solid rgba(74,222,128,0.35)", borderRadius:24, padding:"26px 18px 20px", marginBottom:20, boxShadow:"0 0 36px rgba(74,222,128,0.18), inset 0 0 30px rgba(74,222,128,0.06)" },
  goalLeft: { textAlign:"left" }, goalRight: { textAlign:"right" },
  goalBig: { fontSize:34, fontWeight:900, color:"#f8fafc", fontFamily:"Impact, Arial Black, sans-serif" },
  goalUnit: { marginLeft:6, fontSize:15, fontWeight:800, color:"#f8fafc", fontFamily:"monospace" },
  goalLabel: { marginTop:6, fontSize:11, color:"#94a3b8", letterSpacing:1.5, fontFamily:"monospace" },
  goalCircle: { width:110, height:110, borderRadius:"50%", border:"2px solid #1e293b", background:"radial-gradient(circle, #020617 45%, #0f172a 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", justifySelf:"center", boxShadow:"0 0 0 6px rgba(74,222,128,0.08), inset 0 0 24px rgba(74,222,128,0.12)" },
  goalPct: { fontSize:29, fontWeight:900, color:"#4ade80", fontFamily:"monospace" },
  goalCircleLabel: { fontSize:11, color:"#cbd5e1", letterSpacing:1.5, fontFamily:"monospace" },
  goalBarFull: { gridColumn:"1 / 4", height:8, background:"#111827", border:"1px solid #1f2937", borderRadius:999, overflow:"hidden", marginTop:8 },
  goalBarFill: { height:"100%", background:"linear-gradient(90deg, #16a34a, #86efac)", borderRadius:999 },
  goalBarLabels: { gridColumn:"1 / 4", display:"flex", justifyContent:"space-between", color:"#94a3b8", fontFamily:"monospace", fontSize:11, letterSpacing:1 },
  goalPredictionInline: { gridColumn:"1 / -1", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:18, paddingTop:16, borderTop:"1px solid rgba(74,222,128,0.18)" },
  goalPredictionInlineItem: { textAlign:"center" },
  goalPredictionInlineLabel: { display:"block", color:"#64748b", fontSize:9, letterSpacing:2, fontFamily:"monospace", marginBottom:6 },
  goalPredictionInlineValue: { color:"#f8fafc", fontSize:20, fontWeight:900, lineHeight:1.1 },
  tabs: { display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" },
  tab: { flex:"1 1 80px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"17px 8px", background:"linear-gradient(145deg, #000000, #020806)", border:"1px solid rgba(74,222,128,0.18)", borderRadius:20, cursor:"pointer", color:"#cbd5e1", fontFamily:"monospace", boxShadow:"inset 0 0 18px rgba(74,222,128,0.03)", transition:"all 0.18s ease" },
  activeTab: { flex:"1 1 80px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"17px 8px", background:"linear-gradient(145deg, rgba(0,0,0,1), rgba(5,46,22,0.92))", border:"1px solid #4ade80", borderRadius:20, cursor:"pointer", color:"#4ade80", fontFamily:"monospace", boxShadow:"0 0 24px rgba(74,222,128,0.35), inset 0 0 26px rgba(74,222,128,0.12)", transform:"translateY(-2px)", transition:"all 0.18s ease" },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10, marginBottom:14 },
  card: { background:"linear-gradient(145deg, rgba(0,0,0,0.98), rgba(2,8,5,0.98))", border:"1px solid rgba(74,222,128,0.24)", borderRadius:22, padding:18, boxShadow:"0 0 22px rgba(74,222,128,0.08), inset 0 0 18px rgba(255,255,255,0.025)" },
  cardLabel: { fontSize:10, color:"#475569", textTransform:"uppercase", letterSpacing:1.5, fontFamily:"monospace", marginBottom:4 },
  cardValue: { fontSize:22, fontWeight:900, lineHeight:1 },
  cardUnit: { fontSize:13, fontWeight:400 },
  panel: { background:"linear-gradient(145deg, rgba(0,0,0,0.98), rgba(2,8,5,0.98))", border:"1px solid rgba(74,222,128,0.28)", borderRadius:26, padding:20, marginBottom:18, boxShadow:"0 0 26px rgba(74,222,128,0.10), inset 0 0 24px rgba(74,222,128,0.035)" },
  panelTitle: { margin:"0 0 14px", fontSize:15, fontWeight:700, color:"#94a3b8", letterSpacing:0.5, fontFamily:"monospace" },
  todayGrid: { display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 },
  todayBox: { background:"#020617", border:"1px solid #1e293b", borderRadius:10, padding:12, textAlign:"center" },
  todayVal: { fontSize:22, fontWeight:900, color:"#4ade80" },
  todayLbl: { fontSize:10, color:"#475569", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1, marginTop:2 },
  guardrail: { background:"#0f172a", border:"1px solid #854d0e", borderLeft:"4px solid #f59e0b", borderRadius:10, padding:14, color:"#94a3b8", fontSize:13, display:"flex", gap:10, alignItems:"flex-start", marginBottom:14 },
  form: { display:"grid", gridTemplateColumns:"120px 1fr", gap:"8px 12px", alignItems:"center", marginBottom:16 },
  label: { fontSize:11, color:"#64748b", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1, textAlign:"right" },
  input: { background:"#000000", border:"1px solid rgba(74,222,128,0.26)", color:"#f8fafc", borderRadius:12, padding:"11px 13px", fontSize:14, fontFamily:"Inter, Arial, sans-serif", width:"100%", boxSizing:"border-box", outline:"none", boxShadow:"inset 0 0 14px rgba(74,222,128,0.04)" },
  btn: { gridColumn:"2", background:"linear-gradient(135deg, #16a34a, #4ade80)", color:"#020617", border:"none", borderRadius:12, padding:"12px 16px", cursor:"pointer", fontWeight:900, fontSize:14, fontFamily:"monospace", letterSpacing:1, marginTop:4, boxShadow:"0 0 22px rgba(74,222,128,0.35)" },
  logList: { display:"flex", flexDirection:"column", gap:6 },
  logItem: { display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, background:"#020617", border:"1px solid #1e293b", borderRadius:8, padding:"10px 12px", fontSize:13 },
  logText: { flex:1, lineHeight:1.5 },
  deleteBtn: { background:"transparent", color:"#ef4444", border:"1px solid #450a0a", borderRadius:6, cursor:"pointer", padding:"3px 8px", fontSize:11, flexShrink:0 },
  pill: { background:"#0f172a", border:"1px solid #1e293b", color:"#64748b", borderRadius:20, padding:"5px 12px", cursor:"pointer", fontSize:12, fontFamily:"monospace" },
  pillActive: { background:"#1e3a5f", border:"1px solid #60a5fa", color:"#60a5fa", borderRadius:20, padding:"5px 12px", cursor:"pointer", fontSize:12, fontFamily:"monospace" },
  calcSection: { marginBottom:16 },
  calcLabel: { fontSize:10, color:"#64748b", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 },
  calcGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:14, marginBottom:16 },
  calcInput: { background:"#020617", border:"1px solid #334155", color:"#e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:14, fontFamily:"monospace", width:"100%", boxSizing:"border-box" },
  resultBox: { background:"#020617", border:"1px solid #1e3a5f", borderRadius:12, padding:16, marginTop:8 },
  resultTitle: { fontSize:13, color:"#60a5fa", fontFamily:"monospace", marginBottom:14, fontWeight:700 },
  resultGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:12, marginBottom:16 },
  resultStat: { background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:12 },
  suppCard: { display:"flex", gap:14, alignItems:"flex-start", background:"#020617", border:"1px solid #1e293b", borderRadius:10, padding:14, marginBottom:10 },
  suppName: { fontWeight:700, marginBottom:4, fontSize:15 },
  suppNote: { color:"#64748b", fontSize:13, lineHeight:1.5 },
  aiResultBox: { background:"#020617", border:"1px solid #1e3a5f", borderRadius:12, padding:16, marginTop:4 },
  aiStatBox: { background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:12 },
  aiStatLabel: { fontSize:10, color:"#475569", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:1.5, marginBottom:4 },
  cameraBtn: { display:"block", background:"#0f172a", border:"1px solid #334155", color:"#e2e8f0", borderRadius:8, padding:"11px 16px", cursor:"pointer", fontFamily:"monospace", fontSize:13, fontWeight:700 },
  lineChartWrap: { width:"100%", overflowX:"hidden" },
  lineChartSvg: { width:"100%", height:190, display:"block" },
  setupEstimate: { marginTop:16, padding:14, borderRadius:16, border:"1px solid #4ade80", background:"rgba(20,83,45,0.18)", color:"#4ade80", fontSize:14, lineHeight:1.5, fontFamily:"monospace", boxShadow:"0 0 18px rgba(74,222,128,0.12)" },
};
