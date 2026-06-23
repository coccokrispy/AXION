import { useMemo, useState, useCallback, useEffect } from "react";
import { Zap, Scale, Syringe, Dna, Utensils, Dumbbell, Pill, Calculator, Settings, Search, X, ChevronDown, ChevronUp, Flame, TrendingDown, TrendingUp, Minus, Trophy, BookOpen, Droplets } from "lucide-react";

const THEMES = {
  green:  { primary:"#4ade80", primaryDark:"#16a34a", border:"rgba(74,222,128,0.28)", glow:"rgba(74,222,128,0.18)", glowStrong:"rgba(74,222,128,0.35)", bg:"rgba(22,163,74,0.18)", tabBg:"rgba(5,46,22,0.92)", label:"Green" },
  navy:   { primary:"#60a5fa", primaryDark:"#1d4ed8", border:"rgba(96,165,250,0.28)", glow:"rgba(96,165,250,0.18)", glowStrong:"rgba(96,165,250,0.35)", bg:"rgba(29,78,216,0.18)", tabBg:"rgba(15,23,42,0.92)", label:"Navy" },
  pink:   { primary:"#f472b6", primaryDark:"#be185d", border:"rgba(244,114,182,0.28)", glow:"rgba(244,114,182,0.18)", glowStrong:"rgba(244,114,182,0.35)", bg:"rgba(190,24,93,0.18)", tabBg:"rgba(46,5,22,0.92)", label:"Pink" },
  purple: { primary:"#a78bfa", primaryDark:"#6d28d9", border:"rgba(167,139,250,0.28)", glow:"rgba(167,139,250,0.18)", glowStrong:"rgba(167,139,250,0.35)", bg:"rgba(109,40,217,0.18)", tabBg:"rgba(20,5,46,0.92)", label:"Purple" },
  red:    { primary:"#f87171", primaryDark:"#b91c1c", border:"rgba(248,113,113,0.28)", glow:"rgba(248,113,113,0.18)", glowStrong:"rgba(248,113,113,0.35)", bg:"rgba(185,28,28,0.18)", tabBg:"rgba(46,5,5,0.92)", label:"Red" },
  wolf:   { primary:"#94a3b8", primaryDark:"#475569", border:"rgba(148,163,184,0.28)", glow:"rgba(148,163,184,0.18)", glowStrong:"rgba(148,163,184,0.35)", bg:"rgba(71,85,105,0.18)", tabBg:"rgba(15,20,30,0.92)", label:"Wolf" },
};

const MILESTONES = [
  { lbs:5,   label:"5 LBS DOWN",    emoji:"🔥" },
  { lbs:10,  label:"10 LBS DOWN",   emoji:"💪" },
  { lbs:15,  label:"15 LBS DOWN",   emoji:"⚡" },
  { lbs:20,  label:"20 LBS DOWN",   emoji:"🏆" },
  { lbs:25,  label:"25 LBS DOWN",   emoji:"🚀" },
  { lbs:30,  label:"30 LBS DOWN",   emoji:"👑" },
  { lbs:50,  label:"50 LBS DOWN",   emoji:"🌟" },
  { pct:10,  label:"10% BODY WT",   emoji:"📉" },
  { pct:15,  label:"15% BODY WT",   emoji:"💎" },
  { pct:25,  label:"25% TO GOAL",   emoji:"🎯" },
  { pct:50,  label:"HALFWAY THERE", emoji:"⚡" },
  { pct:75,  label:"75% TO GOAL",   emoji:"🏁" },
];

const BULK_MILESTONES = [
  { lbs:5,   label:"5 LBS GAINED",  emoji:"💪" },
  { lbs:10,  label:"10 LBS GAINED", emoji:"🔥" },
  { lbs:15,  label:"15 LBS GAINED", emoji:"⚡" },
  { lbs:20,  label:"20 LBS GAINED", emoji:"🏆" },
  { lbs:25,  label:"25 LBS GAINED", emoji:"🚀" },
  { lbs:30,  label:"30 LBS GAINED", emoji:"👑" },
  { pct:25,  label:"25% TO GOAL",   emoji:"🎯" },
  { pct:50,  label:"HALFWAY THERE", emoji:"⚡" },
  { pct:75,  label:"75% TO GOAL",   emoji:"🏁" },
];

const HAS_SETUP = localStorage.getItem("tracker_setup_complete") === "true";
const START_WEIGHT = Number(localStorage.getItem("tracker_start_weight")) || 225;
const START_DATE = localStorage.getItem("tracker_start_date") || "2026-05-26";
const TARGET_WEIGHT = Number(localStorage.getItem("tracker_target_weight")) || 200;
const IS_BULK = TARGET_WEIGHT > START_WEIGHT;

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
    { name:"Oxyntomodulin", desc:"Dual GLP-1/glucagon agonist. Reduces appetite and increases energy expenditure.", typicalDose:"100-400mcg", unit:"mcg", frequency:"3x/day", cycle:"8-12 weeks" },
    { name:"Cagrilintide", desc:"Long-acting amylin analogue. Reduces food intake and body weight.", typicalDose:"0.16-2.4mg", unit:"mg", frequency:"Weekly", cycle:"Ongoing" },
  ],
  "GH Secretagogues": [
    { name:"CJC-1295 / Ipamorelin", desc:"GHRH + GHRP stack. Boosts GH pulse, improves sleep and recovery.", typicalDose:"100-300mcg", unit:"mcg", frequency:"Pre-sleep daily", cycle:"8-12 weeks" },
    { name:"CJC-1295 with DAC", desc:"GHRH analogue with Drug Affinity Complex. Extended half-life of 6-8 days. Sustained GH elevation.", typicalDose:"1-2mg", unit:"mg", frequency:"2x/week", cycle:"8-12 weeks" },
    { name:"CJC-1295 No DAC", desc:"Mod GRF 1-29. Short-acting GHRH analogue. Preserves natural pulsatile GH release. Stack with GHRP.", typicalDose:"100-300mcg", unit:"mcg", frequency:"3x/day", cycle:"8-12 weeks" },
    { name:"Ipamorelin", desc:"Selective GHRP. Clean GH pulse with minimal cortisol/prolactin.", typicalDose:"100-300mcg", unit:"mcg", frequency:"Daily", cycle:"8-12 weeks" },
    { name:"Hexarelin", desc:"Potent GHRP. Strong GH release. Also cardioprotective properties.", typicalDose:"100-200mcg", unit:"mcg", frequency:"2-3x/day", cycle:"4-8 weeks" },
    { name:"GHRP-2", desc:"Strong GH release. Increases appetite - useful for recomposition.", typicalDose:"100-300mcg", unit:"mcg", frequency:"3x/day", cycle:"4-12 weeks" },
    { name:"GHRP-6", desc:"Potent hunger stimulus with GH release. Better for muscle gaining.", typicalDose:"100-300mcg", unit:"mcg", frequency:"3x/day", cycle:"4-12 weeks" },
    { name:"MK-677 (Ibutamoren)", desc:"Oral GH secretagogue. 24hr GH elevation. Water retention common.", typicalDose:"10-25mg", unit:"mg", frequency:"Daily", cycle:"Ongoing" },
    { name:"Sermorelin", desc:"GHRH analogue. Gentler GH stimulus. Good for anti-aging.", typicalDose:"200-500mcg", unit:"mcg", frequency:"Daily", cycle:"3-6 months" },
    { name:"Tesamorelin", desc:"GHRH analogue. FDA-approved for visceral fat reduction.", typicalDose:"1-2mg", unit:"mg", frequency:"Daily", cycle:"6-12 months" },
  ],
  "IGF / Growth Factors": [
    { name:"IGF-1 LR3", desc:"Long-acting IGF-1 analogue. Promotes muscle growth, fat loss, and nutrient partitioning. More potent than standard IGF-1.", typicalDose:"20-100mcg", unit:"mcg", frequency:"Daily", cycle:"4-6 weeks" },
    { name:"IGF-1 DES", desc:"Short-acting IGF-1 fragment. Local muscle growth when injected intramuscularly. Fast acting.", typicalDose:"20-50mcg", unit:"mcg", frequency:"Pre-workout", cycle:"4-6 weeks" },
    { name:"MGF (Mechano Growth Factor)", desc:"IGF-1 splice variant. Stimulates satellite cells for local muscle repair and growth.", typicalDose:"100-200mcg", unit:"mcg", frequency:"Post-workout", cycle:"4-8 weeks" },
    { name:"PEG-MGF", desc:"PEGylated MGF. Extended half-life version. Systemic muscle growth stimulus.", typicalDose:"200-400mcg", unit:"mcg", frequency:"2x/week", cycle:"4-8 weeks" },
  ],
  "Fat Loss": [
    { name:"AOD-9604", desc:"HGH fragment. Fat burning without GH side effects.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily", cycle:"8-12 weeks" },
    { name:"Fragment 176-191", desc:"Fat-burning HGH fragment. Lipolysis without IGF-1 elevation.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily", cycle:"8-12 weeks" },
    { name:"5-Amino-1MQ", desc:"NNMT inhibitor. Activates dormant fat cells, improves metabolic rate and muscle mass.", typicalDose:"50-100mg", unit:"mg", frequency:"Daily", cycle:"8-12 weeks" },
    { name:"Adipotide (FTPP)", desc:"Targets and destroys blood vessels feeding fat cells. Aggressive fat loss. Use with caution.", typicalDose:"0.5-1mg", unit:"mg", frequency:"Daily", cycle:"4-6 weeks" },
  ],
  "Tissue Repair": [
    { name:"BPC-157", desc:"Body Protection Compound. Heals gut, tendons, ligaments. Helps GI side effects from GLP-1.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily or BID", cycle:"4-12 weeks" },
    { name:"TB-500 (Thymosin Beta-4)", desc:"Systemic tissue repair. Reduces inflammation, accelerates healing.", typicalDose:"2-5mg", unit:"mg", frequency:"2x/week loading", cycle:"4-6 weeks" },
    { name:"TB-4 Fragment", desc:"Ac-SDKP fragment of Thymosin Beta-4. Anti-inflammatory, cardiac and kidney protection.", typicalDose:"1-2mg", unit:"mg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"BPC-157 + TB-500", desc:"Combined stack for maximum healing. Synergistic local + systemic.", typicalDose:"250mcg / 2mg", unit:"mcg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"Pentadeca Arginate (PDA)", desc:"BPC-157 derivative. Enhanced tissue repair, gut healing, and anti-inflammatory. More stable than BPC-157.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily", cycle:"4-12 weeks" },
    { name:"KPV", desc:"Anti-inflammatory tripeptide. Gut healing, skin conditions, IBD.", typicalDose:"500mcg-1mg", unit:"mg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"GHK-Cu", desc:"Copper peptide. Skin regeneration, collagen synthesis, anti-aging.", typicalDose:"1-2mg", unit:"mg", frequency:"Daily", cycle:"8-12 weeks" },
    { name:"LL-37", desc:"Antimicrobial peptide. Immune modulation, wound healing, anti-biofilm.", typicalDose:"100-500mcg", unit:"mcg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"Thymosin Alpha-1", desc:"Immune modulator. Used in cancer/viral protocols.", typicalDose:"1.6mg", unit:"mg", frequency:"2x/week", cycle:"6-12 months" },
  ],
  "Mitochondrial / Longevity": [
    { name:"MOTS-c", desc:"Mitochondrial peptide. AMPK activation. Boosts fat oxidation and insulin sensitivity.", typicalDose:"5-10mg", unit:"mg", frequency:"Weekly", cycle:"8-12 wk on, 4mo off" },
    { name:"Humanin", desc:"Mitochondria-derived. Neuroprotective, anti-aging, cardioprotective.", typicalDose:"2-4mg", unit:"mg", frequency:"Weekly", cycle:"8-12 weeks" },
    { name:"SS-31 (Elamipretide)", desc:"Targets mitochondrial inner membrane. Reduces oxidative stress.", typicalDose:"1-4mg", unit:"mg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"Epitalon", desc:"Telomere lengthening peptide. Anti-aging, sleep quality, immune function.", typicalDose:"5-10mg", unit:"mg", frequency:"Daily x 10-20d", cycle:"1-2 cycles/year" },
    { name:"Foxo4-DRI", desc:"Senolytic peptide. Targets and eliminates senescent cells. Anti-aging at cellular level.", typicalDose:"1-2mg", unit:"mg", frequency:"3x/week", cycle:"2-4 weeks" },
    { name:"Thymulin", desc:"Thymus-derived peptide. Immune regulation, anti-inflammatory, thyroid support.", typicalDose:"10-50mcg", unit:"mcg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"Selank", desc:"Anxiolytic and nootropic. Modulates GABA and BDNF.", typicalDose:"250-500mcg", unit:"mcg", frequency:"Daily", cycle:"2-4 weeks" },
    { name:"Semax", desc:"ACTH analogue. Cognitive enhancer, neuroprotective, BDNF upregulation.", typicalDose:"200-600mcg", unit:"mcg", frequency:"Daily", cycle:"2-4 weeks" },
  ],
  "Cognitive / Mood": [
    { name:"Dihexa", desc:"Extremely potent nootropic. BDNF-like activity. Long duration of action.", typicalDose:"10-20mg", unit:"mg", frequency:"Weekly", cycle:"4-8 weeks" },
    { name:"NA-NAP (NAP)", desc:"Neuroprotective. ADNP-derived. Cognitive support, anti-inflammatory.", typicalDose:"50-200mcg", unit:"mcg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"Pinealon", desc:"Retinal/brain peptide. Sleep, anti-aging, neuroprotection.", typicalDose:"1-3mg", unit:"mg", frequency:"Daily x 10d", cycle:"2 cycles/year" },
    { name:"DSIP (Delta Sleep Inducing Peptide)", desc:"Promotes deep slow-wave sleep. Reduces stress hormones. Improves sleep quality and recovery.", typicalDose:"100-300mcg", unit:"mcg", frequency:"Pre-sleep", cycle:"2-4 weeks" },
  ],
  "Hormonal / Sexual Health": [
    { name:"PT-141 (Bremelanotide)", desc:"Melanocortin agonist. Libido enhancement for men and women.", typicalDose:"1-2mg", unit:"mg", frequency:"As needed", cycle:"As needed" },
    { name:"Kisspeptin-10", desc:"GnRH stimulator. Boosts LH/FSH and testosterone naturally.", typicalDose:"100-1000mcg", unit:"mcg", frequency:"Daily", cycle:"4-8 weeks" },
    { name:"Gonadorelin", desc:"GnRH analogue. Stimulates LH and FSH. Used to maintain natural testosterone production during TRT.", typicalDose:"100mcg", unit:"mcg", frequency:"2x/week", cycle:"Ongoing with TRT" },
    { name:"Melanotan II", desc:"Melanocortin agonist. Tanning, libido, appetite suppression. Potent and long-lasting.", typicalDose:"0.5-1mg", unit:"mg", frequency:"As needed", cycle:"As needed" },
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

function todayISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function daysBetween(a,b) { return Math.max(0,Math.floor((new Date(b)-new Date(a))/86400000)); }
function weeksBetween(a,b) { return Math.max(1,daysBetween(a,b)/7); }
function getWeekNumber(a,b) { return Math.floor(daysBetween(a,b)/7)+1; }
function pctProgress(w) {
  if(IS_BULK) return (((w-START_WEIGHT)/(TARGET_WEIGHT-START_WEIGHT))*100).toFixed(1);
  return (((START_WEIGHT-w)/START_WEIGHT)*100).toFixed(1);
}
function uid() { return Date.now()+Math.floor(Math.random()*10000); }

const JUNK_FOODS=["pizza","burger","cheeseburger","hamburger","whopper","big mac","quarter pounder","mcdonald","mcdonalds","wendy","wendys","taco bell","kfc","popeyes","chick-fil-a","chickfila","five guys","shake shack","in-n-out","innout","sonic","dairy queen","dq blizzard","jack in the box","carl's jr","carls jr","hardees","white castle","waffle house","dominos","papa john","little caesar","pizza hut","calzone","stromboli","hot dog","corn dog","bratwurst","sausage biscuit","mcmuffin","egg mcmuffin","breakfast burrito","french fries","fries","onion rings","mozzarella sticks","fried chicken","chicken nuggets","nuggets","chicken strips","chicken tenders","fried fish","fish and chips","funnel cake","fried oreos","fried twinkies","chips","doritos","cheetos","lays","pringles","fritos","funyuns","crackers","goldfish crackers","cheez its","ritz crackers","popcorn chicken","nachos","queso","tater tots","hash browns","waffle fries","curly fries","cheese fries","loaded fries","chili cheese fries","cookie","cookies","oreo","oreos","chips ahoy","nutter butter","girl scout cookies","donut","donuts","doughnut","krispy kreme","dunkin","munchkins","pastry","croissant","danish","cinnamon roll","cinnabon","pop tart","toaster strudel","cake","birthday cake","chocolate cake","cheesecake","cupcake","muffin","brownie","brownie sundae","ice cream","gelato","sorbet","frozen yogurt","froyo","milkshake","shake","sundae","banana split","hot fudge","whipped cream","candy","m&ms","skittles","starburst","gummy bears","gummy worms","sour patch","swedish fish","nerds","twix","snickers","kit kat","reese","peanut butter cup","butterfinger","milky way","3 musketeers","almond joy","mounds","hershey","cadbury","toblerone","ferrero rocher","nutella","cotton candy","caramel corn","kettle corn","chocolate bar","candy bar","lollipop","jolly rancher","airheads","laffy taffy","marshmallow","peeps","twinkies","ding dongs","ho hos","little debbie","hostess","swiss rolls","oatmeal cream pie","soda","cola","pepsi","coca cola","coke","sprite","fanta","mountain dew","dr pepper","root beer","ginger ale","cream soda","orange soda","grape soda","energy drink","red bull","monster","rockstar","bang energy","full throttle","nos energy","5 hour energy","slurpee","icee","slushie","juice box","kool aid","sweet tea","lemonade","punch","sports drink","gatorade","powerade","vitamin water","alcohol","beer","lager","ale","ipa","stout","porter","hard seltzer","white claw","truly","bud light","budweiser","coors","miller lite","corona","modelo","heineken","stella","guinness","wine","red wine","white wine","rose","champagne","prosecco","sangria","mimosa","hard cider","spiked","vodka","tequila","whiskey","bourbon","rum","gin","margarita","mojito","daiquiri","pina colada","long island","cosmopolitan","bloody mary","hard lemonade","mikes hard","twisted tea","four loko","mac and cheese","velveeta","kraft dinner","ramen","instant noodles","cup noodles","top ramen","spam","bologna","hot pocket","lean pocket","totinos","pizza roll","bagel bite","lunchable","tv dinner","frozen pizza","frozen burrito","microwave burrito","frozen meal","hungry man","marie callender","stouffers","banquet meal","fried rice","lo mein","chow mein","egg roll","spring roll","crab rangoon","general tso","orange chicken","sweet and sour","fried wonton","pad see ew","drunken noodles","waffle","pancake","french toast","syrup","maple syrup","powdered sugar","whipped butter","biscuits and gravy","fried egg sandwich","bacon sandwich","sausage sandwich","philly cheesesteak","cheesesteak","sub","hoagie","meatball sub","italian sub","club sandwich","blt","grilled cheese","quesadilla","loaded quesadilla","nachos supreme","loaded nachos","chipotle bowl","mission burrito","smash burger","animal style","double double","triple triple","loaded burger","bacon burger","bbq burger","mushroom swiss","patty melt","fried bologna","pulled pork sandwich","bbq sandwich","chicken sandwich","popcorn shrimp","coconut shrimp","fried shrimp","lobster roll","clam chowder bread bowl","deep dish","stuffed crust","extra cheese","double pepperoni","meat lovers","supreme pizza","hawaiian pizza","buffalo wings","wings","boneless wings","lemon pepper wings","garlic parmesan wings","teriyaki wings","bbq wings","dry rub wings","ranch dressing","blue cheese dressing","thousand island","caesar dressing","honey mustard","special sauce"];

const SAFE_FOODS=["ground turkey","ground chicken","turkey breast","chicken breast","egg white","cottage cheese","greek yogurt","protein powder","protein shake","brown rice","sweet potato","broccoli","salmon","tuna","tilapia","oatmeal","almonds","avocado","ground beef","white rice","black beans","lentils","quinoa","edamame","tofu","tempeh"];

function isJunkFood(foodName){
  const lower=foodName.toLowerCase();
  if(SAFE_FOODS.some(s=>lower.includes(s)))return false;
  return JUNK_FOODS.some(j=>lower.includes(j));
}

function getMotivationMessage(type,mode,userName,data={},isBulk=false){
  const name=userName?` ${userName}`:"";
  if(mode==="none"){
    if(type==="weight_saved")return"Weight saved ✓";
    if(type==="workout_saved")return"Workout saved ✓";
    if(type==="food_logged")return"Food logged ✓";
    return"Saved ✓";
  }
  if(mode==="uplifting"){
    if(type==="weight_down")return isBulk?`Down ${data.diff} lbs${name}. Adjust your intake. Keep pushing.`:`⬇️ Down ${data.diff} lbs. Keep it up!`;
    if(type==="weight_up_small")return isBulk?`Up ${data.diff} lbs${name}. Moving in the right direction.`:`Slight uptick. Could be water weight. Stay consistent!`;
    if(type==="weight_up_big")return isBulk?`Up ${data.diff} lbs${name}. That's what we want. Keep building.`:`Up ${data.diff} lbs. Happens to everyone. Reset and push forward 💪`;
    if(type==="weight_same")return`Weight saved ✓`;
    if(type==="workout_saved")return`Crushed it! 💪 Great work today.`;
    if(type==="food_logged")return`Food logged ✓`;
    if(type==="junk_food")return`Food logged ✓`;
    return"Saved ✓";
  }
  if(mode==="drill"){
    if(type==="weight_down")return isBulk?`Down ${data.diff} lbs${name}. That's the wrong direction. Eat more.`:`⬇️ Down ${data.diff} lbs${name}. Good. Keep going.`;
    if(type==="weight_up_small")return isBulk?`Up ${data.diff} lbs${name}. Small but moving. Keep eating.`:`Up ${data.diff} lbs. Could be water. Stay on protocol.`;
    if(type==="weight_up_big")return isBulk?`Up ${data.diff} lbs${name}. Now that's a gain. Keep building.`:`Up ${data.diff} lbs${name}. What happened? Get back on track. Now.`;
    if(type==="weight_same")return`Weight saved ✓`;
    if(type==="workout_saved")return`Good${name}. Show up again tomorrow. No excuses.`;
    if(type==="food_logged")return`Food logged ✓`;
    if(type==="junk_food"){
      const roasts=[
        `Really${name}? We doing this today?`,
        `I'm not mad${name}. I'm just disappointed.`,
        `${data.food}${name}. Wow. Just... wow.`,
        `That's not food. That's a setback with seasoning.`,
        `I saw that${name}. You think ${data.food} is gonna help you hit your goal?`,
        `${data.food}${name}. After everything we've been through?`,
        `Logged a moment of weakness. Hope it was worth it.`,
        `Bold choice${name}. Real bold.`,
        `You came this far to eat ${data.food}? Come on.`,
        `${data.food}? That's not on the protocol. You know that right?`,
        `I expected more from you${name}. Really?`,
        `${data.food}. Logged. Don't make it a habit.`,
        `Oh we're eating ${data.food} now? Cool. Cool cool cool.`,
        `Your future self just shook their head${name}.`,
        `Logged. The scale is taking notes too.`,
        `I'm not gonna yell${name}. I'm just gonna remember this at weigh-in.`,
        `You put in all that work at the gym for ${data.food}${name}?`,
        `That's a choice. A bad one. But a choice.`,
        `I log what I see${name}. And I see ${data.food}. Disappointing.`,
        `We're better than this${name}. At least we should be.`,
      ];
      return roasts[Math.floor(Math.random()*roasts.length)];
    }
    return"Saved ✓";
  }
}

function getWeeklyRecapMessage(lostThisWeek,workoutCount,avgCals,avgProtein,streak,isBulk){
  if(isBulk){
    if(lostThisWeek===null)return"Log your weight and food this week to see your recap.";
    const gained=-lostThisWeek;
    if(gained>=2)return"🔥 Solid bulk week. The scale is moving in the right direction.";
    if(gained>=0.5)return"💪 Gaining steadily. Stay consistent with your intake.";
    if(gained>=0)return"⚡ Minimal gain this week. Push the calories a bit more.";
    return"The scale went down this week. Time to eat more. Bulk is a commitment.";
  }
  if(lostThisWeek===null)return"Log your weight and food this week to see your recap.";
  if(lostThisWeek>=2&&workoutCount>=3)return"🔥 Incredible week. Lost weight AND trained hard. That's the formula.";
  if(lostThisWeek>=2)return"🔥 Incredible week. Keep that momentum.";
  if(lostThisWeek>=1&&workoutCount>=3)return"💪 Solid all around. Weight down, workouts in. Stay the course.";
  if(lostThisWeek>=1)return"💪 Solid progress. Stay the course.";
  if(lostThisWeek>0)return"⚡ Every bit counts. Keep going.";
  if(lostThisWeek===0)return"Held the line this week. Now push forward.";
  if(lostThisWeek<0&&lostThisWeek>-2)return"Scale went up a little. Don't spiral. Reset and go.";
  if(lostThisWeek<=-2)return"Tough week on the scale. The comeback starts right now.";
  if(workoutCount>=4)return"You trained hard this week. The scale will catch up.";
  return"New week. Clean slate. Let's go.";
}

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
  const [syringe,setSyringe]=useState(null);
  const [vialMg,setVialMg]=useState(null);
  const [customVial,setCustomVial]=useState("");
  const [bacMl,setBacMl]=useState(null);
  const [customBac,setCustomBac]=useState("");
  const [dose,setDose]=useState(null);
  const [customDose,setCustomDose]=useState("");
  const vN=parseFloat(vialMg==="other"?customVial:vialMg)||0;
  const bN=parseFloat(bacMl==="other"?customBac:bacMl)||0;
  const dN=parseFloat(dose==="other"?customDose:dose)||0;
  const conc=bN>0?vN/bN:0;
  const injectMl=conc>0?dN/conc:0;
  const injectU=syringe?injectMl/(1/parseFloat(syringe)):0;
  const pct=syringe?(injectU/parseFloat(syringe))*100:0;
  const overLimit=pct>100;
  const valid=conc>0&&dN>0&&injectMl>0&&syringe;
  const selBtn=(active)=>({padding:"10px 14px",borderRadius:10,cursor:"pointer",fontFamily:"monospace",fontSize:13,fontWeight:700,border:`2px solid ${active?theme.primary:theme.border}`,background:active?theme.primary+"22":"#020617",color:active?theme.primary:"#94a3b8",transition:"all 0.15s"});
  const Syringe30=()=>(<svg viewBox="0 0 80 50" style={{width:80,height:50,display:"block",margin:"4px auto 0"}}><rect x="8" y="10" width="50" height="14" rx="3" fill="none" stroke={theme.primary} strokeWidth="2"/><rect x="10" y="12" width="14" height="10" rx="1" fill={theme.primary+"44"}/><line x1="24" y1="12" x2="24" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="38" y1="12" x2="38" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="52" y1="12" x2="52" y2="22" stroke={theme.primary} strokeWidth="1.5"/><polygon points="58,14 58,18 70,16" fill={theme.primary}/><rect x="4" y="7" width="4" height="20" rx="1" fill={theme.primary}/><rect x="1" y="8" width="6" height="3" rx="1" fill={theme.primary}/><rect x="1" y="23" width="6" height="3" rx="1" fill={theme.primary}/><text x="40" y="44" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="700">30 units</text></svg>);
  const Syringe50=()=>(<svg viewBox="0 0 80 50" style={{width:80,height:50,display:"block",margin:"4px auto 0"}}><rect x="4" y="10" width="56" height="14" rx="3" fill="none" stroke={theme.primary} strokeWidth="2"/><rect x="6" y="12" width="12" height="10" rx="1" fill={theme.primary+"44"}/><line x1="18" y1="12" x2="18" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="30" y1="12" x2="30" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="42" y1="12" x2="42" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="54" y1="12" x2="54" y2="22" stroke={theme.primary} strokeWidth="1.5"/><polygon points="60,14 60,18 74,16" fill={theme.primary}/><rect x="1" y="7" width="3" height="20" rx="1" fill={theme.primary}/><rect x="0" y="8" width="5" height="3" rx="1" fill={theme.primary}/><rect x="0" y="23" width="5" height="3" rx="1" fill={theme.primary}/><text x="40" y="44" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="700">50 units</text></svg>);
  const Syringe100=()=>(<svg viewBox="0 0 80 50" style={{width:80,height:50,display:"block",margin:"4px auto 0"}}><rect x="4" y="10" width="56" height="14" rx="3" fill="none" stroke={theme.primary} strokeWidth="2"/><rect x="6" y="12" width="10" height="10" rx="1" fill={theme.primary+"44"}/><line x1="16" y1="12" x2="16" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="26" y1="12" x2="26" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="36" y1="12" x2="36" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="46" y1="12" x2="46" y2="22" stroke={theme.primary} strokeWidth="1.5"/><line x1="56" y1="12" x2="56" y2="22" stroke={theme.primary} strokeWidth="1.5"/><polygon points="60,14 60,18 76,16" fill={theme.primary}/><rect x="1" y="7" width="3" height="20" rx="1" fill={theme.primary}/><rect x="0" y="8" width="5" height="3" rx="1" fill={theme.primary}/><rect x="0" y="23" width="5" height="3" rx="1" fill={theme.primary}/><text x="40" y="44" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="700">100 units</text></svg>);
  return (
    <div>
      <div style={DS.panel}>
        <h2 style={{margin:"0 0 20px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧮 Reconstitution Calculator</h2>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Step 1 — Syringe size</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[["30","0.3 ml",Syringe30],["50","0.5 ml",Syringe50],["100","1.0 ml",Syringe100]].map(([val,label,Img])=>(
              <button key={val} onClick={()=>setSyringe(val)} style={{...selBtn(syringe===val),display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 8px"}}>
                <Img/><span style={{marginTop:6,fontSize:12}}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Step 2 — Vial size (mg)</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["5","10","15","other"].map(v=>(<button key={v} onClick={()=>setVialMg(v)} style={selBtn(vialMg===v)}>{v==="other"?"Other":v+" mg"}</button>))}
          </div>
          {vialMg==="other"&&<input style={{...DS.input,marginTop:10}} type="number" step="0.5" placeholder="Enter mg..." value={customVial} onChange={e=>setCustomVial(e.target.value)}/>}
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Step 3 — Bacteriostatic water (mL)</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["1","2","3","5","other"].map(v=>(<button key={v} onClick={()=>setBacMl(v)} style={selBtn(bacMl===v)}>{v==="other"?"Other":v+" mL"}</button>))}
          </div>
          {bacMl==="other"&&<input style={{...DS.input,marginTop:10}} type="number" step="0.5" placeholder="Enter mL..." value={customBac} onChange={e=>setCustomBac(e.target.value)}/>}
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Step 4 — Dose per injection (mg)</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["0.25","0.50","0.75","1.00","other"].map(v=>(<button key={v} onClick={()=>setDose(v)} style={selBtn(dose===v)}>{v==="other"?"Other":v+" mg"}</button>))}
          </div>
          {dose==="other"&&<input style={{...DS.input,marginTop:10}} type="number" step="0.025" placeholder="Enter mg..." value={customDose} onChange={e=>setCustomDose(e.target.value)}/>}
        </div>
        {valid&&(
          <div style={{background:`linear-gradient(145deg,#020617,${theme.primary}11)`,border:`1px solid ${theme.primary}66`,borderRadius:16,padding:20,marginTop:8}}>
            {overLimit?(
              <div style={{background:"#450a0a",border:"1px solid #ef4444",borderRadius:10,padding:14,marginBottom:16,color:"#ef4444",fontFamily:"monospace",fontSize:13,fontWeight:700,textAlign:"center"}}>⚠️ Syringe volume not sufficient. Use a larger syringe or adjust amounts.</div>
            ):(
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:13,color:"#94a3b8",fontFamily:"monospace",marginBottom:8}}>To have a dose of <b style={{color:theme.primary}}>{dN} mg</b> pull the syringe to</div>
                <div style={{fontSize:52,fontWeight:900,color:theme.primary,fontFamily:"monospace",lineHeight:1}}>{injectU.toFixed(1)}</div>
                <div style={{fontSize:16,color:"#94a3b8",fontFamily:"monospace",marginTop:4}}>units on a {syringe}U syringe</div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {[["Concentration",`${conc.toFixed(4)} mg/mL`,"#60a5fa"],["Inject volume",`${injectMl.toFixed(4)} mL`,theme.primary],["Doses per vial",`${(vN/dN).toFixed(1)}x`,"#a78bfa"],["Syringe fill",`${Math.min(100,pct).toFixed(1)}%`,"#f59e0b"]].map(([l,v,c])=>(
                <div key={l} style={{background:"#020617",border:"1px solid #1e293b",borderRadius:10,padding:12,textAlign:"center"}}>
                  <div style={{fontSize:10,color:"#475569",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{l}</div>
                  <div style={{fontSize:18,fontWeight:900,color:c,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1}}>Syringe fill</span>
              <span style={{color:"#f59e0b",fontFamily:"monospace",fontSize:12}}>{Math.min(100,pct).toFixed(1)}%</span>
            </div>
            <div style={{background:"#1e293b",borderRadius:999,height:18,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:999,width:`${Math.min(100,pct)}%`,background:overLimit?"#ef4444":`linear-gradient(90deg,${theme.primaryDark},${theme.primary})`}}/>
            </div>
          </div>
        )}
        {!valid&&(syringe||vialMg||bacMl||dose)&&(
          <div style={{color:"#475569",padding:16,textAlign:"center",fontFamily:"monospace",fontSize:13,border:"1px dashed #1e293b",borderRadius:12}}>Complete all 4 steps to see results</div>
        )}
      </div>
      <div style={DS.panel}>
        <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧊 Storage & Safety</h2>
        {[["Unreconstituted","Freezer (-20°C). Protect from light. Stable 12-24 months."],["Reconstituted","Refrigerate 2-8°C. Stable 4-8 weeks. Label with date."],["BAC Water","0.9% benzyl alcohol. Inject slowly down the side of the vial."],["Mixing","Gently swirl, never shake. Shaking degrades peptides."],["Injection","Subcutaneous into belly, love handles, or thigh. Rotate sites."],["Hygiene","Alcohol swab before each draw. Fresh needle every time."]].map(([t,b])=>(
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
  const [notes,setNotes]=usePersistedState("axion_notes",[]);
  const [waterLog,setWaterLog]=usePersistedState("axion_water",[]);
  const [apiKey,setApiKey]=useApiKey();
  const [themeName,setThemeName]=usePersistedState("axion_theme","green");
  const [motivationMode,setMotivationMode]=usePersistedState("axion_motivation_mode","uplifting");
  const userName=localStorage.getItem("tracker_name")||"";
  const theme=THEMES[themeName]||THEMES.green;

  const [tab,setTab]=useState("dashboard");
  const [saved,setSaved]=useState("");
  const [showSettings,setShowSettings]=useState(false);
  const [tempKey,setTempKey]=useState("");
  const [milestone,setMilestone]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [suppReminder,setSuppReminder]=useState(false);
  const [weeklyRecap,setWeeklyRecap]=useState(null);
  const [junkAlert,setJunkAlert]=useState(null);
  const [weightAlert,setWeightAlert]=useState(null);
  const [upliftAlert,setUpliftAlert]=useState(null);
  const [pinAlert,setPinAlert]=useState(null);
  const [suppTimeReminder,setSuppTimeReminder]=useState(null);
  const [pepTimeReminder,setPepTimeReminder]=useState(null);

  const [setupForm,setSetupForm]=useState({name:"",heightFeet:"",heightInches:"",startWeight:"",targetWeight:"",startDate:todayISO(),activityLevel:"moderate",agreed:false});
  const [weightForm,setWeightForm]=useState({date:todayISO(),weight:"",type:"Morning",note:""});
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
  const [showFoodHistory,setShowFoodHistory]=useState(false);

  const [accessGranted,setAccessGranted]=useState(()=>localStorage.getItem("axion_access")==="true");
  const [codeInput,setCodeInput]=useState("");
  const [codeError,setCodeError]=useState("");
  const [selectedMeal,setSelectedMeal]=useState("Lunch");

  const [workoutForm,setWorkoutForm]=useState({date:todayISO(),type:"",minutes:"",note:"",calories:"",intensity:"",runType:"",miles:"",runTime:""});
  const [insightLoading,setInsightLoading]=useState(false);
  const [aiInsight,setAiInsight]=useState("");

  const [suppView,setSuppView]=useState("my");
  const [suppActiveCat,setSuppActiveCat]=useState(null);
  const [pendingSupp,setPendingSupp]=useState(null);
  const [editingSupp,setEditingSupp]=useState(null);
  const [suppForm,setSuppForm]=useState({dose:"",unit:"mg",schedule:"Daily",time:"Morning",reminderEnabled:false,reminderTime:"08:00"});
  const [suppSearch,setSuppSearch]=useState("");

  const [pepView,setPepView]=useState("stack");
  const [pepActiveCat,setPepActiveCat]=useState(null);
  const [pendingPep,setPendingPep]=useState(null);
  const [editingPep,setEditingPep]=useState(null);
  const [pepForm,setPepForm]=useState({dose:"",unit:"mg",frequency:"",cycle:"",notes:"",status:"active",pinDays:[],reminderEnabled:false,reminderTime:"08:00"});
  const [pepSearch,setPepSearch]=useState("");

  const [doseTab,setDoseTab]=useState(null);
  const [doseForm,setDoseForm]=useState({date:todayISO(),dose:"",note:""});
  const [editingDoseNote,setEditingDoseNote]=useState(null);
  const [doseNoteText,setDoseNoteText]=useState("");
  const [editingGoal,setEditingGoal]=useState(false);

  const [noteText,setNoteText]=useState("");
  const [noteDate,setNoteDate]=useState(todayISO());
  const [expandedNoteDay,setExpandedNoteDay]=useState(null);

  const sortedWeights=useMemo(()=>(weights||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date)),[weights]);
  const latestWeight=sortedWeights[sortedWeights.length-1]||{id:0,date:todayISO(),weight:START_WEIGHT||0};
  const lowestWeight=sortedWeights.length?Math.min(...sortedWeights.map(w=>+w.weight)):START_WEIGHT;
  const highestWeight=sortedWeights.length?Math.max(...sortedWeights.map(w=>+w.weight)):START_WEIGHT;
  const totalChange=IS_BULK?(+latestWeight.weight-START_WEIGHT):(START_WEIGHT-+latestWeight.weight);
  const remainingToGoal=IS_BULK?(TARGET_WEIGHT-+latestWeight.weight):(+latestWeight.weight-TARGET_WEIGHT);
  const avgPerWeek=totalChange/weeksBetween(START_DATE,latestWeight.date);
  const progressPct=Math.max(0,Math.min(100,IS_BULK?((+latestWeight.weight-START_WEIGHT)/(TARGET_WEIGHT-START_WEIGHT))*100:((START_WEIGHT-+latestWeight.weight)/(START_WEIGHT-TARGET_WEIGHT))*100));
  const currentWeek=getWeekNumber(START_DATE,todayISO());
  const activePhase=RETA_PHASES.find(p=>{const [s,e]=p.weeks.split("-").map(Number);return currentWeek>=s&&currentWeek<=e;})||RETA_PHASES[0];

  const today=todayISO();
  const todayFoods=(foods||[]).filter(f=>f.date===today);
  const todayCals=todayFoods.reduce((s,f)=>s+(f.calories||0),0);
  const todayProtein=todayFoods.reduce((s,f)=>s+(f.protein||0),0);
  const todayWorkouts=(workouts||[]).filter(w=>w.date===today);
  const todayMinutes=todayWorkouts.reduce((s,w)=>s+(w.minutes||0),0);
  const calorieTarget=Number(localStorage.getItem("tracker_calorie_target"))||null;
  const todayWater=(waterLog||[]).filter(w=>w.date===today).reduce((s,w)=>s+(w.oz||0),0);

  const projectedWeeksToGoal=avgPerWeek>0?Math.ceil(Math.max(0,remainingToGoal)/avgPerWeek):999;
  const projectedGoalDate=new Date();projectedGoalDate.setDate(projectedGoalDate.getDate()+projectedWeeksToGoal*7);

  const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());weekStart.setHours(0,0,0,0);
  const thisWeekWorkouts=(workouts||[]).filter(w=>new Date(w.date)>=weekStart);
  const thisWeekMins=thisWeekWorkouts.reduce((s,w)=>s+(w.minutes||0),0);
  const thisWeekFoods=(foods||[]).filter(f=>new Date(f.date)>=weekStart);
  const thisWeekAvgCals=thisWeekFoods.length>0?Math.round(thisWeekFoods.reduce((s,f)=>s+(f.calories||0),0)/Math.max(1,new Set(thisWeekFoods.map(f=>f.date)).size)):null;

  const weightsByDay=useMemo(()=>{const map={};(weights||[]).forEach(w=>{if(!map[w.date])map[w.date]=[];map[w.date].push(w);});return map;},[weights]);
  const weightDays=useMemo(()=>Object.keys(weightsByDay).sort((a,b)=>new Date(b)-new Date(a)),[weightsByDay]);

  const getDayAvg=(day)=>weightsByDay[day]?(weightsByDay[day].reduce((s,e)=>s+Number(e.weight),0)/weightsByDay[day].length):null;
  const getTrendForDay=(day)=>{
    const idx=weightDays.indexOf(day);
    if(idx<0||idx===weightDays.length-1)return null;
    const prev=weightDays[idx+1];
    const curr=getDayAvg(day);
    const prevAvg=getDayAvg(prev);
    if(!curr||!prevAvg)return null;
    if(curr<prevAvg-0.1)return "down";
    if(curr>prevAvg+0.1)return "up";
    return "flat";
  };

  const streak=useMemo(()=>{
    const allDates=new Set([...(weights||[]).map(w=>w.date),...(foods||[]).map(f=>f.date),...(workouts||[]).map(w=>w.date),...Object.values(peptideLogs||{}).flat().map(l=>l.date)]);
    let count=0;let d=new Date();
    const localISO=(dt)=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    const todayStr=localISO(d);
    if(!allDates.has(todayStr)){d.setDate(d.getDate()-1);}
    for(let i=0;i<3650;i++){const iso=localISO(d);if(allDates.has(iso)){count++;d.setDate(d.getDate()-1);}else break;}
    return count;
  },[weights,foods,workouts,peptideLogs]);

  useEffect(()=>{
    if(totalChange<=0)return;
    const milestoneList=IS_BULK?BULK_MILESTONES:MILESTONES;
    const earned=milestoneList.filter(m=>{
      if(m.lbs)return totalChange>=m.lbs;
      if(m.pct)return progressPct>=m.pct;
      return false;
    });
    const key="axion_milestones_seen";
    let seen=[];try{seen=JSON.parse(localStorage.getItem(key)||"[]");}catch{}
    const unseen=earned.filter(m=>!seen.includes(m.label));
    if(unseen.length>0){
      setMilestone(unseen[unseen.length-1]);
      const newSeen=[...seen,...unseen.map(m=>m.label)];
      localStorage.setItem(key,JSON.stringify(newSeen));
      setTimeout(()=>setMilestone(null),4000);
    }
  },[totalChange,progressPct]);

  useEffect(()=>{
    if(mySupplements.length===0)return;
    const hour=new Date().getHours();
    if(hour<20)return;
    const allTaken=mySupplements.every(s=>takenToday.includes(s.id));
    if(allTaken)return;
    const key="axion_supp_reminder_"+todayISO();
    if(localStorage.getItem(key))return;
    setSuppReminder(true);
    localStorage.setItem(key,"shown");
  },[mySupplements,takenToday]);

  useEffect(()=>{
    const now=new Date();
    const day=now.getDay();
    const sunday=new Date(now);
    sunday.setDate(now.getDate()-day);
    sunday.setHours(0,0,0,0);
    const sundayKey="axion_weekly_recap_"+sunday.toISOString().slice(0,10);
    if(localStorage.getItem(sundayKey))return;
    if(day>3)return;
    const ws=new Date(sunday);ws.setDate(ws.getDate()-7);ws.setHours(0,0,0,0);
    const we=new Date(sunday);we.setHours(23,59,59,999);
    const weekWeights=(weights||[]).filter(w=>new Date(w.date)>=ws&&new Date(w.date)<=we);
    const weekFoods=(foods||[]).filter(f=>new Date(f.date)>=ws&&new Date(f.date)<=we);
    const weekWorkouts=(workouts||[]).filter(w=>new Date(w.date)>=ws&&new Date(w.date)<=we);
    const startW=weekWeights.length?+weekWeights[0].weight:null;
    const endW=weekWeights.length?+weekWeights[weekWeights.length-1].weight:null;
    const lostThisWeek=startW&&endW?+(startW-endW).toFixed(1):null;
    const avgCals=weekFoods.length>0?Math.round(weekFoods.reduce((s,f)=>s+(f.calories||0),0)/Math.max(1,new Set(weekFoods.map(f=>f.date)).size)):null;
    const avgProtein=weekFoods.length>0?Math.round(weekFoods.reduce((s,f)=>s+(f.protein||0),0)/Math.max(1,new Set(weekFoods.map(f=>f.date)).size)):null;
    const totalMins=weekWorkouts.reduce((s,w)=>s+(w.minutes||0),0);
    setWeeklyRecap({lostThisWeek,avgCals,avgProtein,totalMins,workoutCount:weekWorkouts.length,streak,sundayKey,isBulk:IS_BULK});
  },[weights,foods,workouts,streak]);

 useEffect(()=>{
    const todayDay=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
    const duePeptides=(peptideStack||[]).filter(p=>p.status==="active"&&(p.pinDays||[]).includes(todayDay)&&!p.reminderEnabled);
    if(duePeptides.length===0)return;
    const hour=new Date().getHours();
    const morningKey="axion_pin_morning_"+todayISO();
    const eveningKey="axion_pin_evening_"+todayISO();
    const names=duePeptides.map(p=>p.name).join(", ");
    if(hour<20&&!localStorage.getItem(morningKey)){
      localStorage.setItem(morningKey,"shown");
      setPinAlert({type:"morning",msg:`📌 Pin Day — ${names} are due today. Don't forget to log your dose.`});
      return;
    }
    if(hour>=20&&!localStorage.getItem(eveningKey)){
      const unlogged=duePeptides.filter(p=>!(peptideLogs[p.id]||[]).some(l=>l.date===todayISO()));
      if(unlogged.length===0)return;
      localStorage.setItem(eveningKey,"shown");
      const unloggedNames=unlogged.map(p=>p.name).join(", ");
      setPinAlert({type:"evening",msg:`⏰ Still waiting — You haven't logged your dose of ${unloggedNames} yet today.`});
    }
  },[peptideStack,peptideLogs]);

  useEffect(()=>{
    const now=new Date();
    const currentTime=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const todayStr=todayISO();
    const suppsDue=(mySupplements||[]).filter(s=>{
      if(!s.reminderEnabled||!s.reminderTime)return false;
      if(takenToday.includes(s.id))return false;
      if(currentTime<s.reminderTime)return false;
      const snoozeKey=`axion_snooze_supp_${s.id}_${todayStr}`;
      const snoozedUntil=localStorage.getItem(snoozeKey);
      if(snoozedUntil&&new Date()<new Date(snoozedUntil))return false;
      const firedKey=`axion_suppreminder_${s.id}_${todayStr}`;
      if(localStorage.getItem(firedKey))return false;
      return true;
    });
    if(suppsDue.length>0){
      suppsDue.forEach(s=>localStorage.setItem(`axion_suppreminder_${s.id}_${todayStr}`,"shown"));
      setSuppTimeReminder(suppsDue);
    }
    const pepsDue=(peptideStack||[]).filter(p=>{
      if(!p.reminderEnabled||!p.reminderTime)return false;
      if(p.status!=="active")return false;
      if((peptideLogs[p.id]||[]).some(l=>l.date===todayStr))return false;
      if(currentTime<p.reminderTime)return false;
      const snoozeKey=`axion_snooze_pep_${p.id}_${todayStr}`;
      const snoozedUntil=localStorage.getItem(snoozeKey);
      if(snoozedUntil&&new Date()<new Date(snoozedUntil))return false;
      const firedKey=`axion_pepreminder_${p.id}_${todayStr}`;
      if(localStorage.getItem(firedKey))return false;
      return true;
    });
    if(pepsDue.length>0){
      pepsDue.forEach(p=>localStorage.setItem(`axion_pepreminder_${p.id}_${todayStr}`,"shown"));
      setPepTimeReminder(pepsDue);
    }
  },[mySupplements,peptideStack,peptideLogs,takenToday]);

  const suppSearchResults=useMemo(()=>{if(!suppSearch.trim())return[];const q=suppSearch.toLowerCase();return ALL_SUPPLEMENTS.filter(s=>s.toLowerCase().includes(q)).slice(0,20);},[suppSearch]);
  const pepSearchResults=useMemo(()=>{if(!pepSearch.trim())return[];const q=pepSearch.toLowerCase();return ALL_PEPTIDES.filter(p=>p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q)).slice(0,10);},[pepSearch]);

  const activityMultipliers={sedentary:11,light:12,moderate:13,active:14,very_active:15};
  const estimatedCalories=setupForm.startWeight?Math.round((Number(setupForm.startWeight)*activityMultipliers[setupForm.activityLevel])-500):0;

  function flash(msg){setSaved(msg);setTimeout(()=>setSaved(""),2500);}

  function addWeight(){
    if(!weightForm.weight)return;
    const prev=sortedWeights.length?+sortedWeights[sortedWeights.length-1].weight:null;
    const curr=+weightForm.weight;
    const diff=prev?+(prev-curr).toFixed(1):null;
    let msgType="weight_saved";
    if(diff!==null){
      if(diff>0)msgType="weight_down";
      else if(diff<0&&Math.abs(diff)<2)msgType="weight_up_small";
      else if(diff<0&&Math.abs(diff)>=2)msgType="weight_up_big";
      else msgType="weight_same";
    }
    setWeights([...(weights||[]),{...weightForm,id:uid(),weight:curr}]);
    setWeightForm({date:todayISO(),weight:"",type:"Morning",note:""});
    if(motivationMode==="drill"){
      const isBadGain=IS_BULK?(msgType==="weight_down"):(msgType==="weight_up_big");
      const isGoodMove=IS_BULK?(msgType==="weight_up_big"):(msgType==="weight_down");
      if(isBadGain){
        const gainRoasts=IS_BULK?[
          `Down ${Math.abs(diff)} lbs${userName?" "+userName:""}. That's the wrong direction. Eat more.`,
          `${Math.abs(diff)} lbs down${userName?" "+userName:""}. You're supposed to be building. Adjust your intake.`,
          `Lost ${Math.abs(diff)} lbs${userName?" "+userName:""}. Bulk means eating enough. Are you?`,
          `Down ${Math.abs(diff)} lbs. The scale is going the wrong way${userName?" "+userName:""}. Fix it.`,
          `${Math.abs(diff)} lbs down. That's not a bulk${userName?" "+userName:""}. That's a cut. Eat more.`,
        ]:[
          `Up ${Math.abs(diff)} lbs${userName?" "+userName:""}. What happened? We need to talk.`,
          `${Math.abs(diff)} lbs up. That's not water weight. That's a decision.`,
          `The scale doesn't lie${userName?" "+userName:""}. ${Math.abs(diff)} lbs. What did you eat?`,
          `Up ${Math.abs(diff)} lbs. I'm not yelling. But I'm thinking about it.`,
          `${Math.abs(diff)} lbs${userName?" "+userName:""}. After all that work. Come on.`,
          `That's ${Math.abs(diff)} lbs in the wrong direction. Reset. Now.`,
          `Up ${Math.abs(diff)} lbs. The protocol exists for a reason. Use it.`,
          `${Math.abs(diff)} lbs up${userName?" "+userName:""}. I saw what you logged this week.`,
          `That's a ${Math.abs(diff)} lb gain. Not acceptable. Get back on track.`,
          `Up ${Math.abs(diff)} lbs. We don't panic. But we do better tomorrow.`,
        ];
        setWeightAlert({msg:gainRoasts[Math.floor(Math.random()*gainRoasts.length)],type:"bad"});
      } else if(isGoodMove){
        const lossRoasts=IS_BULK?[
          `Up ${Math.abs(diff)} lbs${userName?" "+userName:""}. Now that's a gain. Keep building.`,
          `${Math.abs(diff)} lbs up${userName?" "+userName:""}. The work is paying off. Stay consistent.`,
          `Gained ${Math.abs(diff)} lbs${userName?" "+userName:""}. That's what the protocol is for. Keep eating.`,
          `Up ${Math.abs(diff)} lbs. Good${userName?" "+userName:""}. Now do it again next week.`,
          `${Math.abs(diff)} lbs gained${userName?" "+userName:""}. Noted. Keep the surplus going.`,
        ]:[
          `Down ${Math.abs(diff)} lbs${userName?" "+userName:""}. Good. Don't get comfortable.`,
          `${Math.abs(diff)} lbs gone. That's the job. Keep going.`,
          `Down ${Math.abs(diff)} lbs. Noted. Now do it again.`,
          `${Math.abs(diff)} lbs down${userName?" "+userName:""}. Respect. Don't slow down now.`,
          `That's ${Math.abs(diff)} lbs lost. Good. You're not done yet.`,
          `Down ${Math.abs(diff)} lbs. The work is paying off. Stay locked in.`,
          `${Math.abs(diff)} lbs lighter${userName?" "+userName:""}. That's what discipline looks like.`,
          `Down ${Math.abs(diff)} lbs. Good. The goal doesn't care about your feelings.`,
          `${Math.abs(diff)} lbs gone${userName?" "+userName:""}. Keep that energy.`,
          `Down ${Math.abs(diff)} lbs. Now push harder.`,
        ];
        setWeightAlert({msg:lossRoasts[Math.floor(Math.random()*lossRoasts.length)],type:"good"});
      } else {
        flash(getMotivationMessage(msgType,motivationMode,userName,{diff:Math.abs(diff||0)},IS_BULK));
      }
    } else if(motivationMode==="uplifting"){
      const isGoodMove=IS_BULK?(msgType==="weight_up_big"||msgType==="weight_up_small"):(msgType==="weight_down");
      const isBadMove=IS_BULK?(msgType==="weight_down"):(msgType==="weight_up_big");
      if(isGoodMove){
        const upMessages=IS_BULK?[
          `⬆️ Up ${Math.abs(diff)} lbs${userName?" "+userName:""}. The bulk is working. Keep it going.`,
          `${Math.abs(diff)} lbs gained${userName?" "+userName:""}. That's real progress. Be proud.`,
          `Up ${Math.abs(diff)} lbs. Every pound counts when you're building.`,
          `${Math.abs(diff)} lbs heavier${userName?" "+userName:""}. The work is working.`,
          `Up ${Math.abs(diff)} lbs. That's not luck. That's consistency.`,
        ]:[
          `⬇️ Down ${Math.abs(diff)} lbs${userName?" "+userName:""}. You're doing it. Keep going.`,
          `${Math.abs(diff)} lbs gone${userName?" "+userName:""}. That's real progress. Be proud.`,
          `Down ${Math.abs(diff)} lbs. Every single pound counts. Keep showing up.`,
          `${Math.abs(diff)} lbs lighter${userName?" "+userName:""}. The work is working.`,
          `Down ${Math.abs(diff)} lbs. That's not luck. That's discipline.`,
          `${Math.abs(diff)} lbs down${userName?" "+userName:""}. You earned that. Don't stop now.`,
          `Look at that. Down ${Math.abs(diff)} lbs. You should be proud of yourself.`,
          `${Math.abs(diff)} lbs gone. The goal is getting closer${userName?" "+userName:""}. Stay the course.`,
          `Down ${Math.abs(diff)} lbs${userName?" "+userName:""}. This is what consistency looks like.`,
          `${Math.abs(diff)} lbs lighter. You're proving something to yourself right now.`,
        ];
        setUpliftAlert(upMessages[Math.floor(Math.random()*upMessages.length)]);
      } else if(isBadMove){
        const upGainMessages=IS_BULK?[
          `Down ${Math.abs(diff)} lbs${userName?" "+userName:""}. That's okay. Adjust your intake and keep going.`,
          `${Math.abs(diff)} lbs down. Bodies fluctuate. Push the calories a bit more.`,
          `Down ${Math.abs(diff)} lbs${userName?" "+userName:""}. Don't spiral. Eat a bit more this week.`,
          `${Math.abs(diff)} lbs down. Happens during a bulk. Stay consistent and trust the process.`,
          `Down ${Math.abs(diff)} lbs${userName?" "+userName:""}. Zoom out. The trend is still yours to control.`,
        ]:[
          `Up ${Math.abs(diff)} lbs${userName?" "+userName:""}. That's okay. One day doesn't define the journey.`,
          `${Math.abs(diff)} lbs up. Bodies fluctuate. You're still in this. Reset and go.`,
          `Up ${Math.abs(diff)} lbs${userName?" "+userName:""}. Don't spiral. Just get back on protocol tomorrow.`,
          `${Math.abs(diff)} lbs up. Happens to everyone. What matters is what you do next.`,
          `Up ${Math.abs(diff)} lbs${userName?" "+userName:""}. Zoom out. The trend is still yours to control.`,
          `${Math.abs(diff)} lbs up. Could be water, could be stress. Stay consistent and trust the process.`,
          `Up ${Math.abs(diff)} lbs${userName?" "+userName:""}. One number doesn't erase all your progress.`,
          `${Math.abs(diff)} lbs up. Don't let this shake you. You've got this.`,
          `Up ${Math.abs(diff)} lbs${userName?" "+userName:""}. Breathe. Reset. Tomorrow is a new day.`,
          `${Math.abs(diff)} lbs up. The comeback is always stronger than the setback.`,
        ];
        setUpliftAlert(upGainMessages[Math.floor(Math.random()*upGainMessages.length)]);
      } else {
        flash(getMotivationMessage(msgType,motivationMode,userName,{diff:Math.abs(diff||0)},IS_BULK));
      }
    } else {
      flash(getMotivationMessage(msgType,motivationMode,userName,{diff:Math.abs(diff||0)},IS_BULK));
    }
  }

  function calcNutrition(per100g,weightG){const r=weightG/100;return{calories:Math.round((per100g.calories||0)*r),protein:+((per100g.protein||0)*r).toFixed(1),carbs:+((per100g.carbs||0)*r).toFixed(1),fat:+((per100g.fat||0)*r).toFixed(1),fiber:+((per100g.fiber||0)*r).toFixed(1),sugar:+((per100g.sugar||0)*r).toFixed(1),sodium:+((per100g.sodium||0)*r).toFixed(0)};}

  async function searchFood(){
    if(!foodQuery.trim())return;
    if(!apiKey){setFoodSearchError("Add your API key in Settings to search foods.");return;}
    setFoodSearchLoading(true);setFoodSearchError("");setFoodSearchResults(null);
    try{
      const data=await callClaude(apiKey,{system:`You are a precise nutrition database. Return detailed nutrition facts per 100g for any food. CRITICAL: Always return nutrition for the COOKED/PREPARED state of the food, not raw. For example, chicken breast should reflect grilled/baked cooked weight, rice should reflect cooked weight, ground beef should reflect cooked weight. If a food is not typically cooked (raw vegetables, fruits, packaged foods, drinks), return as-is. For name-brand packaged foods (Oreos, Quest Bar, Chobani, etc) use actual label data. Return ONLY valid JSON: {"food":"Official name (cooked)","brand":"brand name or null","is_packaged":true/false,"per_100g":{"calories":n,"protein":n,"carbs":n,"fat":n,"fiber":n,"sugar":n,"sodium":n},"serving_sizes":[{"label":"1 cup (240g)","weight_g":240}],"notes":"any note"}`,messages:[{role:"user",content:foodQuery}]});
      const parsed=JSON.parse(data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim());
      setFoodSearchResults(parsed);setServingWeight("");
    }catch(e){setFoodSearchError("Search failed: "+e.message);}
    setFoodSearchLoading(false);
  }

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

  function addWorkout(){
    try{
      if(!workoutForm.type)return;
      const w={id:uid(),date:workoutForm.date||todayISO(),type:String(workoutForm.type||""),minutes:+(workoutForm.minutes||0),calories:+(workoutForm.calories||0),intensity:String(workoutForm.intensity||""),note:String(workoutForm.note||""),runType:String(workoutForm.runType||""),miles:String(workoutForm.miles||""),runTime:String(workoutForm.runTime||"")};
      setWorkouts(prev=>[...(prev||[]),w]);
      setWorkoutForm({date:todayISO(),type:"",minutes:"",note:"",calories:"",intensity:"",runType:"",miles:"",runTime:""});
      flash(getMotivationMessage("workout_saved",motivationMode,userName,{},IS_BULK));
    }catch(e){console.error("Workout error:",e);}
  }

  function addNote(){
    if(!noteText.trim())return;
    setNotes(prev=>[...(prev||[]),{id:uid(),date:noteDate,text:noteText.trim(),created:new Date().toISOString()}]);
    setNoteText("");
    flash("Note saved ✓");
  }

  function addWater(oz){
    setWaterLog(prev=>[...(prev||[]),{id:uid(),date:todayISO(),oz}]);
    flash(`+${oz}oz logged ✓`);
  }

  function toggleTaken(id){setTakenToday(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);}

  function addSupplement(){
    if(!pendingSupp)return;
    setMySupplements(prev=>[...prev,{id:uid(),name:pendingSupp.name,category:pendingSupp.category,dose:suppForm.dose||"—",unit:suppForm.dose?suppForm.unit:"",schedule:suppForm.schedule,time:suppForm.time,reminderEnabled:suppForm.reminderEnabled||false,reminderTime:suppForm.reminderTime||"08:00"}]);
    setSuppView("my");setPendingSupp(null);setSuppForm({dose:"",unit:"mg",schedule:"Daily",time:"Morning",reminderEnabled:false,reminderTime:"08:00"});
  }
  function saveSuppEdit(){setMySupplements(prev=>prev.map(s=>s.id===editingSupp.id?{...s,dose:suppForm.dose||"—",unit:suppForm.dose?suppForm.unit:"",schedule:suppForm.schedule,time:suppForm.time,reminderEnabled:suppForm.reminderEnabled||false,reminderTime:suppForm.reminderTime||"08:00"}:s));setEditingSupp(null);setSuppView("my");}
  function deleteSupp(id){setMySupplements(prev=>prev.filter(s=>s.id!==id));setTakenToday(prev=>prev.filter(x=>x!==id));setEditingSupp(null);setSuppView("my");}

  function addPeptideToStack(){
    if(!pendingPep)return;
    setPeptideStack(prev=>[...prev,{id:uid(),name:pendingPep.name,category:pendingPep.category,desc:pendingPep.desc,dose:pepForm.dose||"—",unit:pepForm.unit||pendingPep.unit||"mg",frequency:pepForm.frequency||pendingPep.frequency||"",cycle:pepForm.cycle||pendingPep.cycle||"",notes:pepForm.notes,status:pepForm.status,pinDays:pepForm.pinDays||[],reminderEnabled:pepForm.reminderEnabled||false,reminderTime:pepForm.reminderTime||"08:00",dateAdded:todayISO()}]);
    setPepView("stack");setPendingPep(null);setPepForm({dose:"",unit:"mg",frequency:"",cycle:"",notes:"",status:"active",pinDays:[],reminderEnabled:false,reminderTime:"08:00"});
    flash("Peptide added ✓");
  }
  function savePepEdit(){setPeptideStack(prev=>prev.map(p=>p.id===editingPep.id?{...p,dose:pepForm.dose||"—",unit:pepForm.unit,frequency:pepForm.frequency,cycle:pepForm.cycle,notes:pepForm.notes,status:pepForm.status,pinDays:pepForm.pinDays||[],reminderEnabled:pepForm.reminderEnabled||false,reminderTime:pepForm.reminderTime||"08:00"}:p));setEditingPep(null);setPepView("stack");}
  function deletePep(id){setPeptideStack(prev=>prev.filter(p=>p.id!==id));setPeptideLogs(prev=>{const n={...prev};delete n[id];return n;});setEditingPep(null);setPepView("stack");}
  function logPeptideDose(peptideId){if(!doseForm.dose)return;setPeptideLogs(prev=>({...prev,[peptideId]:[...(prev[peptideId]||[]),{id:uid(),date:doseForm.date,dose:+doseForm.dose,note:doseForm.note}]}));setDoseForm({date:todayISO(),dose:"",note:""});flash("Dose logged ✓");}
  function removePeptideDose(peptideId,entryId){setPeptideLogs(prev=>({...prev,[peptideId]:(prev[peptideId]||[]).filter(e=>e.id!==entryId)}));}

  async function getAIInsight(){
    if(sortedWeights.length<2||!apiKey){setAiInsight(!apiKey?"Add API key in Settings.":"Add a second weight entry to unlock.");return;}
    setInsightLoading(true);setAiInsight("");
    const activeStack=(peptideStack||[]).filter(p=>p.status==="active").map(p=>`${p.name} ${p.dose}${p.unit} ${p.frequency}`).join(", ");
    const recentFoods=(foods||[]).slice(-5).map(f=>`${f.item} (${f.calories}cal/${f.protein}p)`).join(", ");
    const recentWorkouts=(workouts||[]).slice(-5).map(w=>`${w.type} ${w.minutes}min${w.intensity?" "+w.intensity:""}`).join(", ");
    const goalType=IS_BULK?"bulking (gaining muscle mass)":"cutting (losing fat while preserving muscle)";
    try{
      const data=await callClaude(apiKey,{messages:[{role:"user",content:`Clinical health analyst. Goal: ${goalType}. Peptide stack: ${activeStack||"none"}. Weight: ${START_WEIGHT}->${latestWeight.weight}lbs (${totalChange.toFixed(1)}lbs ${IS_BULK?"gained":"lost"}, ${pctProgress(latestWeight.weight)}%). Week ${currentWeek}. Avg ${IS_BULK?"gain":"loss"}: ${avgPerWeek.toFixed(2)} lbs/wk. Streak: ${streak} days. Food: ${recentFoods||"none"}. Training: ${recentWorkouts||"none"}. Write 3-4 sentence personalized breakdown. Clinical but motivating. Reference specific numbers. Tailor advice to their ${IS_BULK?"bulk":"cut"} goal.`}]});
      setAiInsight(data.content?.map(b=>b.text||"").join("")||"Unable to generate insight.");
    }catch(e){setAiInsight("Insight unavailable: "+e.message);}
    setInsightLoading(false);
  }

  const TABS=["dashboard","weight","doses","peptides","food","workouts","supplements","notes","calculator"];
  const ICONS={dashboard:Zap,weight:Scale,doses:Syringe,peptides:Dna,food:Utensils,workouts:Dumbbell,supplements:Pill,notes:BookOpen,calculator:Calculator};

  const DS={
    page:{minHeight:"100vh",background:`radial-gradient(circle at top,${theme.bg} 0%,#020403 24%,#000000 72%)`,color:"#f8fafc",padding:"42px 12px 48px",fontFamily:"Inter,Arial,sans-serif",maxWidth:430,margin:"0 auto"},
    panel:{background:"linear-gradient(145deg,rgba(0,0,0,0.98),rgba(2,8,5,0.98))",border:`1px solid ${theme.border}`,borderRadius:26,padding:20,marginBottom:18,boxShadow:`0 0 26px ${theme.glow}`},
    card:{background:"linear-gradient(145deg,rgba(0,0,0,0.98),rgba(2,8,5,0.98))",border:`1px solid ${theme.border}`,borderRadius:22,padding:18,boxShadow:`0 0 22px ${theme.glow}`},
    btn:{gridColumn:"2",background:`linear-gradient(135deg,${theme.primaryDark},${theme.primary})`,color:"#020617",border:"none",borderRadius:12,padding:"12px 16px",cursor:"pointer",fontWeight:900,fontSize:14,fontFamily:"monospace",letterSpacing:1,marginTop:4,boxShadow:`0 0 22px ${theme.glowStrong}`},
    input:{background:"#000000",border:`1px solid ${theme.border}`,color:"#f8fafc",borderRadius:12,padding:"11px 13px",fontSize:14,fontFamily:"Inter,Arial,sans-serif",width:"100%",boxSizing:"border-box",outline:"none"},
    activeTab:{flex:"1 1 60px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 4px",background:`linear-gradient(145deg,rgba(0,0,0,1),${theme.tabBg})`,border:`1px solid ${theme.primary}`,borderRadius:18,cursor:"pointer",color:theme.primary,fontFamily:"monospace",boxShadow:`0 0 24px ${theme.glowStrong}`,transform:"translateY(-2px)",transition:"all 0.18s ease"},
    pillActive:{background:"#1e3a5f",border:`1px solid ${theme.primary}`,color:theme.primary,borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"monospace"},
    goalBarFill:{height:"100%",background:`linear-gradient(90deg,${theme.primaryDark},${theme.primary})`,borderRadius:999},
    goalCircle:{width:110,height:110,borderRadius:"50%",border:"2px solid #1e293b",background:"radial-gradient(circle,#020617 45%,#0f172a 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",justifySelf:"center",boxShadow:`0 0 0 6px ${theme.glow},inset 0 0 24px ${theme.glow}`},
  };

  const pill={background:"#0f172a",border:"1px solid #1e293b",color:"#64748b",borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"monospace"};
  const formGrid={display:"grid",gridTemplateColumns:"120px 1fr",gap:"8px 12px",alignItems:"center",marginBottom:16};
  const formLabel={fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,textAlign:"right"};
  const deleteBtn={background:"transparent",color:"#ef4444",border:"1px solid #450a0a",borderRadius:6,cursor:"pointer",padding:"3px 8px",fontSize:11};
  const VALID_CODES=["AXION-7K2M","AXION-9P4R","AXION-3X8W","AXION-6N1Q","AXION-5T7B","AXION-2H9F","AXION-8V4J","AXION-1L6D","AXION-4C3Y","AXION-0E5Z"];

  const alertModal=(content,borderColor,glowColor)=>(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:24}}>
      <div style={{background:"#0f172a",border:`2px solid ${borderColor}`,borderRadius:20,padding:32,maxWidth:320,width:"100%",textAlign:"center",boxShadow:`0 0 60px ${glowColor}`,wordBreak:"break-word"}}>
        {content}
      </div>
    </div>
  );
  if(!accessGranted){
    return(
      <div style={DS.page}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",padding:24}}>
          <div style={{fontSize:58,fontWeight:900,letterSpacing:13,color:"#f8fafc",fontFamily:"Impact,Arial Black,sans-serif",textTransform:"uppercase",marginBottom:8}}>AXION</div>
          <div style={{fontSize:12,color:"#475569",fontFamily:"monospace",letterSpacing:3,marginBottom:48}}>BETA ACCESS</div>
          <div style={{...DS.panel,width:"100%",maxWidth:360}}>
            <div style={{fontSize:14,fontWeight:700,color:"#94a3b8",fontFamily:"monospace",marginBottom:6}}>Enter your invite code</div>
            <div style={{fontSize:12,color:"#475569",fontFamily:"monospace",marginBottom:16,lineHeight:1.6}}>This is a closed beta. You need an invite code to access AXION.</div>
            <input style={{...DS.input,marginBottom:10,textTransform:"uppercase",letterSpacing:2,fontSize:16,textAlign:"center"}} placeholder="AXION-XXXXX" value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==="Enter"){if(VALID_CODES.includes(codeInput.trim())){localStorage.setItem("axion_access","true");localStorage.setItem("axion_code_used",codeInput.trim());setAccessGranted(true);setCodeError("");}else{setCodeError("Invalid code. Contact the AXION team for access.");}}}}/>
            {codeError&&<div style={{color:"#ef4444",fontSize:12,fontFamily:"monospace",marginBottom:10,textAlign:"center"}}>{codeError}</div>}
            <button style={{...DS.btn,gridColumn:"unset",width:"100%"}} onClick={()=>{if(VALID_CODES.includes(codeInput.trim())){localStorage.setItem("axion_access","true");localStorage.setItem("axion_code_used",codeInput.trim());setAccessGranted(true);setCodeError("");}else{setCodeError("Invalid code. Contact the AXION team for access.");}}}>Enter AXION</button>
          </div>
          <div style={{marginTop:24,fontSize:11,color:"#334155",fontFamily:"monospace",textAlign:"center"}}>© 2026 AXION · Closed Beta · All rights reserved</div>
        </div>
      </div>
    );
  }

  if(!HAS_SETUP){
    return (
      <div style={DS.page}>
        <div style={{...DS.panel,border:"1px solid #854d0e",borderLeft:"4px solid #f59e0b",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:900,color:"#f59e0b",fontFamily:"monospace",letterSpacing:1,marginBottom:12}}>⚠️ IMPORTANT DISCLAIMER — READ BEFORE CONTINUING</div>
          <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.8,fontFamily:"monospace"}}>
            <p style={{margin:"0 0 10px"}}>AXION is a <b style={{color:"#f8fafc"}}>personal tracking tool only</b>. It is not a medical application, does not provide medical advice, and is not intended to diagnose, treat, cure, or prevent any disease or health condition.</p>
            <p style={{margin:"0 0 10px"}}>The information logged and displayed in this app — including peptide protocols, supplement tracking, dosing records, calorie data, and weight logs — is for <b style={{color:"#f8fafc"}}>personal informational purposes only</b>. Nothing in this application should be interpreted as a recommendation, prescription, or endorsement of any substance, dosage, or health practice.</p>
            <p style={{margin:"0 0 10px"}}>Peptides and research compounds tracked in this app are <b style={{color:"#f8fafc"}}>not approved by the FDA</b> for human use in most jurisdictions. You are solely responsible for understanding and complying with all applicable laws in your country, state, or region.</p>
            <p style={{margin:"0 0 10px"}}><b style={{color:"#f8fafc"}}>Always consult a licensed medical professional</b> before beginning any new health protocol, peptide regimen, supplement stack, or dietary change.</p>
            <p style={{margin:"0 0 10px"}}>The creators, developers, and distributors of AXION <b style={{color:"#f8fafc"}}>assume no liability whatsoever</b> for any harm, injury, adverse reaction, legal consequence, or damages — direct or indirect — arising from use of this application.</p>
            <p style={{margin:0,color:"#64748b"}}>By continuing you confirm you are an adult, understand this disclaimer in full, and accept sole responsibility for your health decisions.</p>
          </div>
        </div>
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
            {estimatedCalories>0&&<div style={{gridColumn:"1/-1",marginTop:8,padding:14,borderRadius:16,border:`1px solid ${theme.primary}`,background:"rgba(20,83,45,0.18)",color:theme.primary,fontSize:14,fontFamily:"monospace"}}>Estimated target: {estimatedCalories} cal/day for ~1 lb/week {TARGET_WEIGHT<START_WEIGHT?"loss":"gain"}.</div>}
            <div style={{gridColumn:"1/-1",marginTop:8}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Choose your theme</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {Object.entries(THEMES).map(([k,t])=>(
                  <button key={k} onClick={()=>setThemeName(k)} style={{padding:"10px 4px",borderRadius:12,border:`2px solid ${themeName===k?t.primary:"#1e293b"}`,background:themeName===k?t.primary+"22":"#020617",cursor:"pointer",color:t.primary,fontSize:10,fontFamily:"monospace",fontWeight:700,textAlign:"center",transition:"all 0.15s"}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:t.primary,margin:"0 auto 5px",boxShadow:themeName===k?`0 0 10px ${t.primary}`:"none"}}/>{t.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{gridColumn:"1/-1",marginTop:8,background:"#020617",border:`1px solid ${theme.border}`,borderRadius:12,padding:14,display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer"}} onClick={()=>setSetupForm({...setupForm,agreed:!setupForm.agreed})}>
              <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${setupForm.agreed?theme.primary:"#334155"}`,background:setupForm.agreed?theme.primary+"22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                {setupForm.agreed&&<span style={{color:theme.primary,fontSize:16,fontWeight:900,lineHeight:1}}>✓</span>}
              </div>
              <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.7,fontFamily:"monospace"}}>I have read and fully understand the disclaimer. I am an adult and accept sole responsibility for my health decisions. The creators of AXION bear no liability for any outcomes from my use of this application.</span>
            </div>
            <button style={{...DS.btn,gridColumn:"1/-1",opacity:setupForm.agreed?1:0.4,cursor:setupForm.agreed?"pointer":"not-allowed"}} disabled={!setupForm.agreed} onClick={()=>{
              if(!setupForm.agreed)return;
              localStorage.setItem("tracker_name",setupForm.name);
              localStorage.setItem("tracker_height_feet",setupForm.heightFeet);
              localStorage.setItem("tracker_height_inches",setupForm.heightInches);
              localStorage.setItem("tracker_start_weight",setupForm.startWeight);
              localStorage.setItem("tracker_target_weight",setupForm.targetWeight);
              localStorage.setItem("tracker_start_date",setupForm.startDate);
              localStorage.setItem("tracker_activity_level",setupForm.activityLevel);
              localStorage.setItem("tracker_calorie_target",estimatedCalories);
              localStorage.setItem("tracker_setup_complete","true");
              location.reload();
            }}>Start AXION</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={DS.page}>

      {/* CONFIRM MODAL */}
      {confirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:24}}>
          <div style={{background:"#0f172a",border:"1px solid #ef444466",borderRadius:18,padding:28,maxWidth:320,width:"100%",textAlign:"center",boxShadow:"0 0 40px rgba(239,68,68,0.2)",wordBreak:"break-word"}}>
            <div style={{fontSize:32,marginBottom:12}}>🗑️</div>
            <div style={{fontWeight:700,color:"#f8fafc",fontSize:15,marginBottom:8,fontFamily:"monospace"}}>Delete this?</div>
            <div style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace",marginBottom:24,lineHeight:1.7,padding:"0 8px"}}>{confirm.label}<br/><span style={{color:"#475569",fontSize:11}}>This can't be undone.</span></div>
            <div style={{display:"flex",gap:10}}>
              <button style={{flex:1,background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:10,padding:"12px",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:13}} onClick={()=>setConfirm(null)}>Cancel</button>
              <button style={{flex:1,background:"#450a0a",border:"1px solid #ef4444",color:"#ef4444",borderRadius:10,padding:"12px",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:13}} onClick={()=>{confirm.onConfirm();setConfirm(null);}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* PIN ALERT */}
      {pinAlert&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:24}}>
          <div style={{background:"#0f172a",border:"2px solid #60a5fa",borderRadius:20,padding:32,maxWidth:320,width:"100%",textAlign:"center",boxShadow:"0 0 60px rgba(96,165,250,0.4)",wordBreak:"break-word"}}>
            <div style={{fontSize:48,marginBottom:12}}>{pinAlert.type==="morning"?"📌":"⏰"}</div>
            <div style={{fontSize:15,color:"#60a5fa",fontFamily:"monospace",fontWeight:700,marginBottom:20,lineHeight:1.8}}>{pinAlert.msg}</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button style={{background:"#1e293b",border:"2px solid #60a5fa",color:"#60a5fa",borderRadius:12,padding:"12px 20px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:14}} onClick={()=>setPinAlert(null)}>✕</button>
              <button style={{background:"linear-gradient(135deg,#1d4ed8,#60a5fa)",border:"none",color:"#020617",borderRadius:12,padding:"12px 20px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:14}} onClick={()=>{setPinAlert(null);setTab("doses");}}>Log Dose</button>
            </div>
          </div>
        </div>
      )}

      {/* WEIGHT ALERT */}
      {weightAlert&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:24}}>
          <div style={{background:"#0f172a",border:`2px solid ${weightAlert.type==="good"?"#4ade80":"#ef4444"}`,borderRadius:20,padding:32,maxWidth:320,width:"100%",textAlign:"center",boxShadow:`0 0 60px ${weightAlert.type==="good"?"rgba(74,222,128,0.4)":"rgba(239,68,68,0.4)"}`,wordBreak:"break-word"}}>
            <div style={{fontSize:48,marginBottom:12}}>{weightAlert.type==="good"?"💪💪💪":"❗❗❗"}</div>
            <div style={{fontSize:16,color:weightAlert.type==="good"?"#4ade80":"#ef4444",fontFamily:"monospace",fontWeight:700,marginBottom:24,lineHeight:1.8,whiteSpace:"normal"}}>{weightAlert.msg}</div>
            <button style={{background:weightAlert.type==="good"?"#14532d":"#450a0a",border:`2px solid ${weightAlert.type==="good"?"#4ade80":"#ef4444"}`,color:weightAlert.type==="good"?"#4ade80":"#ef4444",borderRadius:12,padding:"14px 32px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:16}} onClick={()=>setWeightAlert(null)}>✕</button>
          </div>
        </div>
      )}

      {/* UPLIFT ALERT */}
      {upliftAlert&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:24}}>
          <div style={{background:"#0f172a",border:"2px solid #60a5fa",borderRadius:20,padding:32,maxWidth:320,width:"100%",textAlign:"center",boxShadow:"0 0 60px rgba(96,165,250,0.4)",wordBreak:"break-word"}}>
            <div style={{fontSize:48,marginBottom:12}}>💙💙💙</div>
            <div style={{fontSize:16,color:"#60a5fa",fontFamily:"monospace",fontWeight:700,marginBottom:24,lineHeight:1.8,whiteSpace:"normal"}}>{upliftAlert}</div>
            <button style={{background:"#1e3a5f",border:"2px solid #60a5fa",color:"#60a5fa",borderRadius:12,padding:"14px 32px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:16}} onClick={()=>setUpliftAlert(null)}>✕</button>
          </div>
        </div>
      )}

      {/* JUNK ALERT */}
      {junkAlert&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:24}}>
          <div style={{background:"#0f172a",border:"2px solid #ef4444",borderRadius:20,padding:32,maxWidth:320,width:"100%",textAlign:"center",boxShadow:"0 0 60px rgba(239,68,68,0.4)",wordBreak:"break-word"}}>
            <div style={{fontSize:48,marginBottom:12}}>❗❗❗</div>
            <div style={{fontSize:16,color:"#ef4444",fontFamily:"monospace",fontWeight:700,marginBottom:24,lineHeight:1.8,whiteSpace:"normal"}}>{junkAlert}</div>
            <button style={{background:"#450a0a",border:"2px solid #ef4444",color:"#ef4444",borderRadius:12,padding:"14px 32px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:16}} onClick={()=>setJunkAlert(null)}>✕</button>
          </div>
        </div>
      )}

      {/* SUPPLEMENT REMINDER (8PM) */}
      {suppReminder&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:24}}>
          <div style={{background:"#0f172a",border:`2px solid ${theme.primary}`,borderRadius:20,padding:32,maxWidth:320,width:"100%",textAlign:"center",boxShadow:`0 0 60px ${theme.glowStrong}`,wordBreak:"break-word"}}>
            <div style={{fontSize:40,marginBottom:12}}>💊</div>
            <div style={{fontWeight:900,color:"#f8fafc",fontSize:16,fontFamily:"monospace",letterSpacing:1,marginBottom:10}}>SUPPLEMENT CHECK</div>
            <div style={{fontSize:15,color:"#94a3b8",fontFamily:"monospace",marginBottom:8,lineHeight:1.8}}>
              {motivationMode==="drill"?`${userName?userName+", you":""} forgot your supplements again. Not acceptable.`:motivationMode==="none"?"You have untaken supplements today.":"Hey! Don't forget your supplements tonight 💊"}
            </div>
            <div style={{fontSize:13,color:"#475569",fontFamily:"monospace",marginBottom:24}}>
              {takenToday.filter(id=>mySupplements.find(s=>s.id===id)).length} of {mySupplements.length} taken
            </div>
            <div style={{display:"flex",gap:10}}>
              <button style={{flex:1,background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:10,padding:"13px",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:13}} onClick={()=>setSuppReminder(false)}>Dismiss</button>
              <button style={{flex:1,background:`linear-gradient(135deg,${theme.primaryDark},${theme.primary})`,border:"none",color:"#020617",borderRadius:10,padding:"13px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:13}} onClick={()=>{setSuppReminder(false);setTab("supplements");}}>Go Log Them</button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLEMENT TIME REMINDER */}
      {suppTimeReminder&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:24}}>
          <div style={{background:"#0f172a",border:`2px solid ${theme.primary}`,borderRadius:20,padding:32,width:"100%",maxWidth:320,textAlign:"center",boxShadow:`0 0 60px ${theme.glowStrong}`,wordBreak:"break-word"}}>
            <div style={{fontSize:40,marginBottom:12}}>💊</div>
            <div style={{fontWeight:900,color:"#f8fafc",fontSize:16,fontFamily:"monospace",letterSpacing:1,marginBottom:14}}>TIME TO TAKE YOUR SUPPLEMENTS</div>
            <div style={{marginBottom:16}}>
              {suppTimeReminder.map(s=>(
                <div key={s.id} style={{background:"#020617",border:`1px solid ${theme.border}`,borderRadius:10,padding:"8px 14px",marginBottom:6,fontWeight:700,color:theme.primary,fontFamily:"monospace",fontSize:14}}>
                  {s.name}
                </div>
              ))}
            </div>
            <div style={{fontSize:13,color:"#475569",fontFamily:"monospace",marginBottom:20,lineHeight:1.6}}>You haven't taken {suppTimeReminder.length===1?"this":"these"} yet today.</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button style={{width:"100%",background:`linear-gradient(135deg,${theme.primaryDark},${theme.primary})`,border:"none",color:"#020617",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:14,letterSpacing:1}} onClick={()=>{setSuppTimeReminder(null);setTab("supplements");}}>GO TO SUPPLEMENTS</button>
              <button style={{width:"100%",background:"#1e293b",border:`1px solid ${theme.border}`,color:"#94a3b8",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:13}} onClick={()=>{
                const snoozeUntil=new Date(Date.now()+30*60*1000).toISOString();
                suppTimeReminder.forEach(s=>localStorage.setItem(`axion_snooze_supp_${s.id}_${todayISO()}`,snoozeUntil));
                setSuppTimeReminder(null);
              }}>⏱ Snooze 30 Minutes</button>
              <button style={{width:"100%",background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontFamily:"monospace",fontSize:12,padding:"6px"}} onClick={()=>setSuppTimeReminder(null)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* PEPTIDE TIME REMINDER */}
      {pepTimeReminder&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,padding:24}}>
          <div style={{background:"#0f172a",border:`2px solid ${theme.primary}`,borderRadius:20,padding:32,width:"100%",maxWidth:320,textAlign:"center",boxShadow:`0 0 60px ${theme.glowStrong}`,wordBreak:"break-word"}}>
            <div style={{fontSize:40,marginBottom:12}}>🧬</div>
            <div style={{fontWeight:900,color:"#f8fafc",fontSize:16,fontFamily:"monospace",letterSpacing:1,marginBottom:14}}>TIME TO LOG YOUR DOSE</div>
            <div style={{marginBottom:16}}>
              {pepTimeReminder.map(p=>(
                <div key={p.id} style={{background:"#020617",border:`1px solid ${theme.border}`,borderRadius:10,padding:"8px 14px",marginBottom:6,fontWeight:700,color:theme.primary,fontFamily:"monospace",fontSize:14}}>
                  {p.name}
                </div>
              ))}
            </div>
            <div style={{fontSize:13,color:"#475569",fontFamily:"monospace",marginBottom:20,lineHeight:1.6}}>You haven't logged {pepTimeReminder.length===1?"this dose":"these doses"} yet today.</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button style={{width:"100%",background:`linear-gradient(135deg,${theme.primaryDark},${theme.primary})`,border:"none",color:"#020617",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:14,letterSpacing:1}} onClick={()=>{setPepTimeReminder(null);setTab("doses");}}>GO TO DOSES</button>
              <button style={{width:"100%",background:"#1e293b",border:`1px solid ${theme.border}`,color:"#94a3b8",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:13}} onClick={()=>{
                const snoozeUntil=new Date(Date.now()+30*60*1000).toISOString();
                pepTimeReminder.forEach(p=>localStorage.setItem(`axion_snooze_pep_${p.id}_${todayISO()}`,snoozeUntil));
                setPepTimeReminder(null);
              }}>⏱ Snooze 30 Minutes</button>
              <button style={{width:"100%",background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontFamily:"monospace",fontSize:12,padding:"6px"}} onClick={()=>setPepTimeReminder(null)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY RECAP */}
      {weeklyRecap&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:24}}>
          <div style={{background:"#0f172a",border:`2px solid ${theme.primary}`,borderRadius:20,padding:28,maxWidth:340,width:"100%",boxShadow:`0 0 60px ${theme.glow}`,wordBreak:"break-word"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:36,marginBottom:8}}>📊</div>
              <div style={{fontWeight:900,color:"#f8fafc",fontSize:18,fontFamily:"monospace",letterSpacing:1}}>WEEKLY RECAP</div>
              <div style={{fontSize:11,color:"#475569",fontFamily:"monospace",marginTop:4}}>{new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[
                [IS_BULK?"⚖️ Gained":"⚖️ Lost",weeklyRecap.lostThisWeek!==null?(IS_BULK?`+${Math.abs(weeklyRecap.lostThisWeek)} lbs`:`${weeklyRecap.lostThisWeek>0?"-":"+"}${Math.abs(weeklyRecap.lostThisWeek)} lbs`):"No data"],
                ["🔥 Streak",`${weeklyRecap.streak} days`],
                ["💪 Workouts",`${weeklyRecap.workoutCount} sessions`],
                ["⏱️ Training",`${weeklyRecap.totalMins} min`],
                ["🍽️ Avg Calories",weeklyRecap.avgCals?`${weeklyRecap.avgCals} kcal`:"No data"],
                ["🥩 Avg Protein",weeklyRecap.avgProtein?`${weeklyRecap.avgProtein}g`:"No data"],
              ].map(([l,v])=>(
                <div key={l} style={{background:"#020617",border:`1px solid ${theme.border}`,borderRadius:12,padding:12,textAlign:"center"}}>
                  <div style={{fontSize:11,color:"#475569",fontFamily:"monospace",marginBottom:6}}>{l}</div>
                  <div style={{fontSize:15,fontWeight:900,color:theme.primary,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{background:`linear-gradient(145deg,#020617,${theme.primary}11)`,border:`1px solid ${theme.primary}44`,borderRadius:12,padding:14,marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:14,color:theme.primary,fontFamily:"monospace",fontWeight:700,lineHeight:1.7}}>
                {getWeeklyRecapMessage(weeklyRecap.lostThisWeek,weeklyRecap.workoutCount,weeklyRecap.avgCals,weeklyRecap.avgProtein,weeklyRecap.streak,weeklyRecap.isBulk)}
              </div>
            </div>
            <button style={{width:"100%",background:`linear-gradient(135deg,${theme.primaryDark},${theme.primary})`,border:"none",color:"#020617",borderRadius:12,padding:"14px",cursor:"pointer",fontFamily:"monospace",fontWeight:900,fontSize:14,letterSpacing:1}} onClick={()=>{if(weeklyRecap?.sundayKey)localStorage.setItem(weeklyRecap.sundayKey,"shown");setWeeklyRecap(null);}}>LET'S CRUSH THIS WEEK</button>
          </div>
        </div>
      )}

      {/* MILESTONE MODAL */}
      {milestone&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:24}}>
          <div style={{background:`linear-gradient(145deg,#020617,${theme.primary}22)`,border:`2px solid ${theme.primary}`,borderRadius:24,padding:32,textAlign:"center",maxWidth:320,width:"100%",boxShadow:`0 0 60px ${theme.glowStrong}`,wordBreak:"break-word"}}>
            <div style={{fontSize:64,lineHeight:1,marginBottom:16}}>{milestone.emoji}</div>
            <div style={{fontSize:28,fontWeight:900,color:theme.primary,fontFamily:"monospace",letterSpacing:2,marginBottom:8}}>{milestone.label}</div>
            <div style={{fontSize:14,color:"#94a3b8",fontFamily:"monospace",marginBottom:24}}>{IS_BULK?"Keep building. You're doing it.":"Keep going. You're doing it."}</div>
            <button onClick={()=>setMilestone(null)} style={{background:theme.primary,color:"#020617",border:"none",borderRadius:12,padding:"12px 28px",fontWeight:900,fontSize:14,fontFamily:"monospace",cursor:"pointer"}}>LET'S GO</button>
          </div>
        </div>
      )}

      <header style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:22,textAlign:"center"}}>
        <div style={{marginTop:55,fontSize:58,lineHeight:0.9,fontWeight:900,letterSpacing:13,color:"#f8fafc",fontFamily:"Impact,Arial Black,sans-serif",textTransform:"uppercase"}}>AXION</div>
      </header>

      <div style={{position:"absolute",top:50,right:18}}>
        <button onClick={()=>{setTempKey(apiKey);setShowSettings(true);}} style={{width:54,height:54,borderRadius:16,background:`linear-gradient(145deg,rgba(0,0,0,0.96),${theme.primaryDark}55)`,border:`1px solid ${theme.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:`0 0 22px ${theme.glow}`}}>
          <Settings size={22} strokeWidth={2.2} color={theme.primary}/>
        </button>
      </div>

      {saved&&(
        <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#0f172a",color:theme.primary,border:`2px solid ${theme.primary}`,borderRadius:16,padding:"20px 28px",fontSize:15,fontFamily:"monospace",fontWeight:700,zIndex:600,textAlign:"center",boxShadow:`0 0 60px ${theme.glowStrong}`,maxWidth:"80vw",wordBreak:"break-word",lineHeight:1.6}}>
          {saved}
        </div>
      )}

      {showSettings&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowSettings(false)}>
          <div style={{background:"#0f172a",border:`1px solid ${theme.border}`,borderRadius:14,padding:20,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <h2 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>⚙️ Settings</h2>
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}><b style={{color:theme.primary}}>Theme Color</b></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
              {Object.entries(THEMES).map(([k,t])=>(
                <button key={k} onClick={()=>setThemeName(k)} style={{padding:"10px 4px",borderRadius:10,border:`2px solid ${themeName===k?t.primary:"#1e293b"}`,background:themeName===k?t.primary+"22":"#020617",cursor:"pointer",color:t.primary,fontSize:10,fontFamily:"monospace",fontWeight:700,textAlign:"center"}}>
                  <div style={{width:16,height:16,borderRadius:"50%",background:t.primary,margin:"0 auto 4px"}}/>{t.label}
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
            <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #1e293b"}}>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}><b style={{color:theme.primary}}>Motivation Mode</b></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                {[["none","📊","Strictly Data"],["uplifting","🦁","Driven"],["drill","🐉","Beast Mode"]].map(([mode,icon,label])=>(
                  <button key={mode} onClick={()=>setMotivationMode(mode)} style={{padding:"12px 8px",borderRadius:12,border:`2px solid ${motivationMode===mode?theme.primary:"#1e293b"}`,background:motivationMode===mode?theme.primary+"22":"#020617",cursor:"pointer",color:motivationMode===mode?theme.primary:"#64748b",fontFamily:"monospace",fontSize:11,fontWeight:700,textAlign:"center"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{icon}</div>{label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:"#475569",fontFamily:"monospace",lineHeight:1.6,marginBottom:4}}>
                {motivationMode==="none"&&"Strictly Data. No commentary, no fluff. Just your numbers."}
                {motivationMode==="uplifting"&&(IS_BULK?"Driven. Encouraging and consistent. Built for the long build.":"Driven. Encouraging and consistent. Built for the long game.")}
                {motivationMode==="drill"&&(IS_BULK?"Beast Mode. Calls out bad eating and wrong direction weight changes. No excuses on the bulk.":"Beast Mode. Tough love. Calls out bad choices and weight gains over 2 lbs.")}
              </div>
            </div>
            <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #1e293b"}}>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}><b style={{color:theme.primary}}>Edit Profile</b></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",marginBottom:4}}>START WEIGHT</div><input type="number" defaultValue={START_WEIGHT} id="edit_start_weight" style={{...DS.input,fontSize:13}}/></div>
                <div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",marginBottom:4}}>GOAL WEIGHT</div><input type="number" defaultValue={TARGET_WEIGHT} id="edit_goal_weight" style={{...DS.input,fontSize:13}}/></div>
                <div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",marginBottom:4}}>START DATE</div><input type="date" defaultValue={START_DATE} id="edit_start_date" style={{...DS.input,fontSize:13}}/></div>
                <div><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",marginBottom:4}}>CALORIE TARGET</div><input type="number" defaultValue={localStorage.getItem("tracker_calorie_target")||""} id="edit_calorie_target" style={{...DS.input,fontSize:13}}/></div>
              </div>
              <button style={{...DS.btn,gridColumn:"unset",width:"100%",marginBottom:16}} onClick={()=>{const sw=document.getElementById("edit_start_weight").value;const gw=document.getElementById("edit_goal_weight").value;const sd=document.getElementById("edit_start_date").value;const ct=document.getElementById("edit_calorie_target").value;if(sw)localStorage.setItem("tracker_start_weight",sw);if(gw)localStorage.setItem("tracker_target_weight",gw);if(sd)localStorage.setItem("tracker_start_date",sd);if(ct)localStorage.setItem("tracker_calorie_target",ct);setShowSettings(false);location.reload();}}>💾 Save Profile</button>
            </div>
            <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #1e293b"}}>
              <div style={{fontSize:12,color:"#94a3b8",marginBottom:8}}><b style={{color:theme.primary}}>Export Your Data</b></div>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginBottom:10}}>Downloads all your AXION data as a JSON file.</div>
              <button style={{...DS.btn,gridColumn:"unset",width:"100%",background:"#0f172a",border:`1px solid ${theme.primary}`,color:theme.primary}} onClick={()=>{
                const data={exportDate:new Date().toISOString(),profile:{name:localStorage.getItem("tracker_name"),startWeight:localStorage.getItem("tracker_start_weight"),targetWeight:localStorage.getItem("tracker_target_weight"),startDate:localStorage.getItem("tracker_start_date"),height:`${localStorage.getItem("tracker_height_feet")}ft ${localStorage.getItem("tracker_height_inches")}in`,activityLevel:localStorage.getItem("tracker_activity_level"),calorieTarget:localStorage.getItem("tracker_calorie_target"),mode:IS_BULK?"bulk":"cut"},weights,foods,workouts,peptideStack,peptideLogs,supplements:mySupplements,notes,waterLog};
                const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
                const url=URL.createObjectURL(blob);
                const a=document.createElement("a");a.href=url;a.download=`axion-export-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
                flash("Data exported ✓");
              }}>⬇️ Export All Data</button>
            </div>
          </div>
        </div>
      )}
      {/* GOAL CARD */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 120px 1fr",alignItems:"center",gap:12,background:`radial-gradient(circle at center,${theme.bg},rgba(0,0,0,0.98) 58%)`,border:`1px solid ${theme.border}`,borderRadius:24,padding:"26px 18px 20px",marginBottom:20,boxShadow:`0 0 36px ${theme.glow}`}}>
        <div style={{textAlign:"left"}}><div><span style={{fontSize:34,fontWeight:900,color:"#f8fafc",fontFamily:"Impact,Arial Black,sans-serif"}}>{START_WEIGHT}</span><span style={{marginLeft:6,fontSize:15,fontWeight:800,color:"#f8fafc",fontFamily:"monospace"}}>LBS</span></div><div style={{marginTop:6,fontSize:11,color:"#94a3b8",letterSpacing:1.5,fontFamily:"monospace"}}>START</div></div>
        <div style={DS.goalCircle}><div style={{fontSize:29,fontWeight:900,color:theme.primary,fontFamily:"monospace"}}>{progressPct.toFixed(1)}%</div><div style={{fontSize:11,color:"#cbd5e1",letterSpacing:1.5,fontFamily:"monospace"}}>TO GOAL</div></div>
        <div style={{textAlign:"right"}}>
          {editingGoal?(
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"flex-end",gap:4}}>
              <input autoFocus type="number" defaultValue={TARGET_WEIGHT} onBlur={e=>{if(e.target.value&&+e.target.value>0){localStorage.setItem("tracker_target_weight",e.target.value);location.reload();}else{setEditingGoal(false);}}} onKeyDown={e=>{if(e.key==="Enter"&&e.target.value&&+e.target.value>0){localStorage.setItem("tracker_target_weight",e.target.value);location.reload();}if(e.key==="Escape")setEditingGoal(false);}} style={{width:80,background:"#020617",border:`1px solid ${theme.primary}`,borderRadius:8,color:theme.primary,fontSize:28,fontWeight:900,fontFamily:"monospace",textAlign:"center",outline:"none",padding:"4px 6px"}}/>
              <span style={{fontSize:15,fontWeight:800,color:"#f8fafc",fontFamily:"monospace"}}>LBS</span>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"baseline",justifyContent:"flex-end",gap:4}}>
              <span style={{fontSize:34,fontWeight:900,color:"#f8fafc",fontFamily:"Impact,Arial Black,sans-serif"}}>{TARGET_WEIGHT}</span>
              <span style={{fontSize:15,fontWeight:800,color:"#f8fafc",fontFamily:"monospace"}}>LBS</span>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,marginTop:6}}>
            <span style={{fontSize:11,color:"#94a3b8",letterSpacing:1.5,fontFamily:"monospace"}}>GOAL</span>
            <button onClick={()=>setEditingGoal(g=>!g)} style={{background:editingGoal?theme.primary+"33":"#1e293b",border:`1px solid ${editingGoal?theme.primary:"#334155"}`,color:editingGoal?theme.primary:"#64748b",borderRadius:6,padding:"2px 7px",cursor:"pointer",fontSize:10,fontFamily:"monospace",fontWeight:700}}>{editingGoal?"✕":"EDIT"}</button>
          </div>
        </div>
        <div style={{gridColumn:"1/4",height:8,background:"#111827",border:"1px solid #1f2937",borderRadius:999,overflow:"hidden",marginTop:8}}><div style={{...DS.goalBarFill,width:`${progressPct}%`}}/></div>
        <div style={{gridColumn:"1/4",display:"flex",justifyContent:"space-between",color:"#94a3b8",fontFamily:"monospace",fontSize:18,fontWeight:900}}><span>{START_WEIGHT}</span><span style={{color:theme.primary}}>NOW: {latestWeight.weight}</span><span>{TARGET_WEIGHT}</span></div>
        <div style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:18,paddingTop:16,borderTop:`1px solid ${theme.border}`}}>
          <div style={{textAlign:"center"}}><span style={{display:"block",color:"#64748b",fontSize:9,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>PROJECTED</span><strong style={{color:"#f8fafc",fontSize:18,fontWeight:900}}>{projectedGoalDate.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</strong></div>
          <div style={{textAlign:"center"}}><span style={{display:"block",color:"#64748b",fontSize:9,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>PACE</span><strong style={{color:"#f8fafc",fontSize:18,fontWeight:900}}>{avgPerWeek>0?avgPerWeek.toFixed(2):"--"} lb/wk</strong></div>
          <div style={{textAlign:"center"}}><span style={{display:"block",color:"#64748b",fontSize:9,letterSpacing:2,fontFamily:"monospace",marginBottom:6}}>WKS LEFT</span><strong style={{color:"#f8fafc",fontSize:18,fontWeight:900}}>{projectedWeeksToGoal<999?projectedWeeksToGoal:"--"}</strong></div>
        </div>
      </div>

      {/* TABS - ROW 1 */}
      <nav style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:5,marginBottom:5}}>
        {["dashboard","weight","food","peptides","supplements"].map(t=>{const Icon=ICONS[t];return(
          <button key={t} onClick={()=>setTab(t)} style={tab===t?{...DS.activeTab,flex:"unset"}:{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 4px",background:"linear-gradient(145deg,#000000,#020806)",border:`1px solid ${theme.border}`,borderRadius:18,cursor:"pointer",color:theme.primary+"99",fontFamily:"monospace",transition:"all 0.18s ease"}}>
            <Icon size={22} strokeWidth={1.8} color={tab===t?theme.primary:theme.primary+"99"}/>
            <span style={{fontSize:9,textTransform:"capitalize"}}>{t==="supplements"?"supps":t}</span>
          </button>
        );})}
      </nav>
      {/* TABS - ROW 2 */}
      <nav style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginBottom:16}}>
        {["workouts","notes","doses","calculator"].map(t=>{const Icon=ICONS[t];return(
          <button key={t} onClick={()=>setTab(t)} style={tab===t?{...DS.activeTab,flex:"unset"}:{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 4px",background:"linear-gradient(145deg,#000000,#020806)",border:`1px solid ${theme.border}`,borderRadius:18,cursor:"pointer",color:theme.primary+"99",fontFamily:"monospace",transition:"all 0.18s ease"}}>
            <Icon size={22} strokeWidth={1.8} color={tab===t?theme.primary:theme.primary+"99"}/>
            <span style={{fontSize:9,textTransform:"capitalize"}}>{t}</span>
          </button>
        );})}
      </nav>

      {/* DASHBOARD */}
      {tab==="dashboard"&&<>
        {sortedWeights.length===0&&(
          <div style={{...DS.panel,borderLeft:`4px solid ${theme.primary}`,marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:700,color:theme.primary,marginBottom:8}}>👋 Welcome to AXION</div>
            <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.7}}>Start by logging your weight in the <b style={{color:"#f8fafc"}}>Weight</b> tab, then add your peptide stack in <b style={{color:"#f8fafc"}}>Peptides</b>. Log food daily to keep your streak alive.</div>
          </div>
        )}
        {IS_BULK&&(
          <div style={{...DS.panel,borderLeft:`4px solid ${theme.primary}`,marginBottom:14,background:`linear-gradient(145deg,rgba(0,0,0,0.98),${theme.primary}08)`}}>
            <div style={{fontSize:12,fontWeight:700,color:theme.primary,fontFamily:"monospace",letterSpacing:1}}>💪 BULK MODE</div>
            <div style={{fontSize:12,color:"#64748b",fontFamily:"monospace",marginTop:4}}>Goal: gain {Math.abs(TARGET_WEIGHT-START_WEIGHT)} lbs · {START_WEIGHT} → {TARGET_WEIGHT} lbs</div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
          {[
            ["Current",sortedWeights.length?`${latestWeight.weight}`:"--","lbs"],
            [IS_BULK?"Highest":"Lowest",sortedWeights.length?IS_BULK?`${highestWeight}`:`${lowestWeight}`:"--","lbs"],
            [IS_BULK?"Gained":"Lost",totalChange>0?`${totalChange.toFixed(1)}`:"0.0","lbs"],
            ["% Progress",totalChange>0?`${progressPct.toFixed(1)}`:"0.0","%"],
            ["Avg/wk",avgPerWeek>0?`${avgPerWeek.toFixed(2)}`:"--","lbs"],
            [`To ${TARGET_WEIGHT}`,remainingToGoal>0?`${remainingToGoal.toFixed(1)}`:"0.0","lbs"],
            ["Protein",todayProtein>0?`${todayProtein}`:"--","g"],
            ["Calories",todayCals>0?`${todayCals}`:"--","kcal"],
          ].map(([l,v,u])=>(
            <div key={l} style={DS.card}>
              <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:1.5,fontFamily:"monospace",marginBottom:4}}>{l}</div>
              <div style={{fontSize:22,fontWeight:900,lineHeight:1,color:v==="--"?"#334155":theme.primary}}>{v}<span style={{fontSize:13,fontWeight:400,color:v==="--"?"#334155":undefined}}> {u}</span></div>
            </div>
          ))}
        </div>
        {todayWater>0&&(
          <div style={{...DS.panel,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <Droplets size={28} color={theme.primary}/>
              <div>
                <div style={{fontSize:24,fontWeight:900,color:theme.primary,fontFamily:"monospace"}}>{todayWater} oz</div>
                <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace",letterSpacing:1}}>WATER TODAY</div>
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                {[8,16].map(oz=>(
                  <button key={oz} onClick={()=>addWater(oz)} style={{background:`${theme.primary}22`,border:`1px solid ${theme.primary}`,color:theme.primary,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontFamily:"monospace",fontSize:12,fontWeight:700}}>+{oz}oz</button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div style={DS.panel}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <Flame size={36} color={streak>0?theme.primary:"#334155"}/>
            <div>
              <div style={{fontSize:36,fontWeight:900,color:streak>0?theme.primary:"#334155",lineHeight:1,fontFamily:"monospace"}}>{streak}</div>
              <div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace",letterSpacing:1.5,marginTop:4}}>DAY STREAK</div>
            </div>
            <div style={{marginLeft:"auto",fontSize:11,color:"#475569",fontFamily:"monospace",textAlign:"right",lineHeight:1.6}}>{streak===0?"Log something today to start your streak":streak>=7?`🔥 ${streak} days strong!`:"Log weight, food, workouts or doses to keep it going"}</div>
          </div>
        </div>
        <div style={DS.panel}>
          <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>📅 This Week</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {[["Workouts",`${thisWeekWorkouts.length}`,"sessions"],["Training",`${thisWeekMins}`,"min"],["Avg Cals",thisWeekAvgCals?`${thisWeekAvgCals}`:"--","kcal/day"]].map(([l,v,u])=>(
              <div key={l} style={{background:"#020617",border:`1px solid ${theme.border}`,borderRadius:14,padding:12,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:1,fontFamily:"monospace",marginBottom:4}}>{l}</div>
                <div style={{fontSize:20,fontWeight:900,color:v==="--"?"#334155":theme.primary,fontFamily:"monospace"}}>{v}</div>
                <div style={{fontSize:10,color:"#64748b",fontFamily:"monospace"}}>{u}</div>
              </div>
            ))}
          </div>
          {calorieTarget&&todayCals>0&&(
            <div style={{marginTop:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>Today's calories</span>
                <span style={{fontSize:11,fontFamily:"monospace",color:todayCals>calorieTarget?"#ef4444":theme.primary}}>{todayCals} / {calorieTarget} kcal</span>
              </div>
              <div style={{background:"#1e293b",borderRadius:999,height:8,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:999,width:`${Math.min(100,(todayCals/calorieTarget)*100)}%`,background:todayCals>calorieTarget?"#ef4444":`linear-gradient(90deg,${theme.primaryDark},${theme.primary})`}}/>
              </div>
            </div>
          )}
        </div>
        {(peptideStack||[]).filter(p=>p.status==="active").length>0&&(
          <div style={DS.panel}>
            <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧬 Active Peptides</h2>
            {(peptideStack||[]).filter(p=>p.status==="active").map(p=>{
              const wk=p.dateAdded?getWeekNumber(p.dateAdded,todayISO()):null;
              return(
                <div key={p.id} style={{background:"#020617",border:"1px solid #1e293b",borderLeft:`3px solid ${theme.primary}`,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,color:theme.primary,fontSize:14}}>{p.name}</div>
                    <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{p.dose}{p.unit} · {p.frequency}</div>
                  </div>
                  {wk&&<div style={{fontSize:10,fontFamily:"monospace",color:"#475569",background:"#0f172a",borderRadius:6,padding:"3px 8px"}}>WK {wk}</div>}
                </div>
              );
            })}
          </div>
        )}
        <div style={DS.panel}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h2 style={{margin:0,fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>🧠 AI Health Breakdown</h2>
            <button onClick={getAIInsight} disabled={insightLoading||sortedWeights.length<2} style={{background:"#1e3a5f",color:"#60a5fa",border:"1px solid #60a5fa",borderRadius:10,padding:"6px 14px",cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700,opacity:insightLoading?0.6:1}}>{insightLoading?"ANALYZING...":"GENERATE"}</button>
          </div>
          {aiInsight?<div style={{background:"#020617",border:"1px solid #1e3a5f",borderRadius:10,padding:14,color:"#cbd5e1",fontSize:13,lineHeight:1.7}}>{aiInsight}</div>:<div style={{color:"#475569",fontSize:12,fontFamily:"monospace",fontStyle:"italic"}}>{sortedWeights.length<2?"Add a second weight entry to unlock.":!apiKey?"Add API key in ⚙️ Settings.":"Click GENERATE for your personalized breakdown."}</div>}
        </div>
        {sortedWeights.length>1?<div style={DS.panel}><h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>Weight Trend</h2><WeightLineChart weights={sortedWeights} color={theme.primary}/></div>:<div style={{...DS.panel,textAlign:"center",color:"#334155",fontFamily:"monospace",fontSize:13}}>Log at least 2 weight entries to see your trend chart.</div>}
        <div style={{background:"#0f172a",border:"1px solid #854d0e",borderLeft:"4px solid #f59e0b",borderRadius:10,padding:14,color:"#94a3b8",fontSize:13,display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
          <span style={{fontSize:18}}>⚠️</span><span>{IS_BULK?"If energy tanks, progress stalls, or strength drops — check your calories, sleep, protein intake, and recovery. Adjust before changing your peptide protocol.":"If energy tanks, digestion stalls, or workouts fall apart — hydrate, hit protein, add carbs, sleep, keep dose changes disciplined."}</span>
        </div>
      </>}
      {/* WEIGHT TAB */}
      {tab==="weight"&&(
        <div style={DS.panel}>
          <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>Weight Log</h2>
          <div style={formGrid}>
            <label style={formLabel}>Date</label><input style={DS.input} type="date" value={weightForm.date} onChange={e=>setWeightForm({...weightForm,date:e.target.value})}/>
            <label style={formLabel}>Weight (lbs)</label><input style={DS.input} type="number" step="0.1" placeholder="e.g. 221.8" value={weightForm.weight} onChange={e=>setWeightForm({...weightForm,weight:e.target.value})}/>
            <label style={formLabel}>Time of Day</label>
            <select style={DS.input} value={weightForm.type} onChange={e=>setWeightForm({...weightForm,type:e.target.value})}>
              {["Morning","Afternoon","Night"].map(o=><option key={o}>{o}</option>)}
            </select>
            <label style={formLabel}>Note</label><input style={DS.input} placeholder="e.g. before bathroom, post gym..." value={weightForm.note} onChange={e=>setWeightForm({...weightForm,note:e.target.value})}/>
            <button style={DS.btn} onClick={addWeight}>+ Add Weight</button>
          </div>
          {weightDays.length===0&&(<div style={{color:"#475569",padding:16,textAlign:"center",fontFamily:"monospace",fontSize:13}}>No entries yet. Log your first weight above.</div>)}
          {(()=>{
            const currentMonth=todayISO().slice(0,7);
            const monthMap={};
            weightDays.forEach(day=>{const m=day.slice(0,7);if(!monthMap[m])monthMap[m]=[];monthMap[m].push(day);});
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
                              <button style={deleteBtn} onClick={()=>setConfirm({label:`${e.weight} lbs · ${e.date}`,onConfirm:()=>setWeights((weights||[]).filter(x=>x.id!==e.id))})}>✕</button>
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
                                    <button style={deleteBtn} onClick={()=>setConfirm({label:`${e.weight} lbs · ${e.date}`,onConfirm:()=>setWeights((weights||[]).filter(x=>x.id!==e.id))})}>✕</button>
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

     {/* DOSES TAB */}
      {tab==="doses"&&(
        <div>
          {(peptideStack||[]).length===0&&(
            <div style={{...DS.panel,textAlign:"center",color:"#475569",fontFamily:"monospace",fontSize:13}}>No peptides in your stack yet.<br/>Add peptides in the 🧬 Peptides tab first.</div>
          )}
          {(peptideStack||[]).length>0&&(()=>{
            const activePep=doseTab||(peptideStack[0]?.id);
            const pep=(peptideStack||[]).find(p=>p.id===activePep)||peptideStack[0];
            if(!pep)return null;
            const logs=(peptideLogs[pep.id]||[]).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
            const total=logs.reduce((s,l)=>s+Number(l.dose||0),0);
            const sc={active:theme.primary,planned:"#fbbf24",completed:"#64748b"};
            const wk=pep.dateAdded?getWeekNumber(pep.dateAdded,todayISO()):null;
            return(
              <div>
                {/* PEPTIDE TABS */}
                <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:14,scrollbarWidth:"none"}}>
                  {(peptideStack||[]).map(p=>{
                    const isActive=(doseTab||peptideStack[0]?.id)===p.id;
                    return(
                      <button key={p.id} onClick={()=>setDoseTab(p.id)} style={{flexShrink:0,padding:"8px 14px",borderRadius:10,border:`1px solid ${isActive?theme.primary:"#334155"}`,background:isActive?theme.primary+"22":"#020617",color:isActive?theme.primary:"#64748b",fontFamily:"monospace",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>
                        {p.name.length>14?p.name.slice(0,14)+"...":p.name}
                      </button>
                    );
                  })}
                </div>

                {/* SELECTED PEPTIDE INFO */}
                <div style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderLeft:`3px solid ${sc[pep.status]||theme.primary}`,borderRadius:12,padding:14,marginBottom:14}}>
                  <div style={{fontSize:15,fontWeight:700,color:sc[pep.status]||theme.primary,marginBottom:4}}>{pep.name}</div>
                  <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{pep.dose}{pep.unit} · {pep.frequency}{pep.cycle?` · ${pep.cycle}`:""}{wk?` · WK ${wk}`:""}</div>
                  <div style={{fontSize:11,color:"#475569",fontFamily:"monospace",marginTop:2}}>Total: {total.toFixed(3)}{pep.unit} · {logs.length} doses</div>
                  {(pep.pinDays||[]).length>0&&(
                    <div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>
                      {(pep.pinDays||[]).map(d=><span key={d} style={{fontSize:10,fontFamily:"monospace",background:theme.primary+"22",color:theme.primary,borderRadius:4,padding:"2px 6px"}}>{d}</span>)}
                    </div>
                  )}
                  {pep.notes&&<div style={{fontSize:11,color:"#94a3b8",marginTop:6,fontStyle:"italic"}}>{pep.notes}</div>}
                </div>

                {/* DOSE INPUT */}
                <div style={{background:"#020617",border:`1px solid #1e293b`,borderRadius:12,padding:14,marginBottom:14}}>
                  <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Log a Dose</div>
                  <div style={formGrid}>
                    <label style={formLabel}>Date</label>
                    <input style={DS.input} type="date" value={doseForm.date} onChange={e=>setDoseForm({...doseForm,date:e.target.value})}/>
                    <label style={formLabel}>Dose ({pep.unit})</label>
                    <input style={DS.input} type="number" step="0.025" placeholder={pep.dose} value={doseForm.dose} onChange={e=>setDoseForm({...doseForm,dose:e.target.value})}/>
                    <label style={formLabel}>Note</label>
                    <input style={DS.input} placeholder="Optional" value={doseForm.note} onChange={e=>setDoseForm({...doseForm,note:e.target.value})}/>
                  </div>
                  <button style={{...DS.btn,gridColumn:"unset",width:"100%",marginTop:4}} onClick={()=>logPeptideDose(pep.id)}>+ Log Dose</button>
                </div>

                {/* DOSE HISTORY */}
                <div style={{...DS.panel}}>
                  <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Dose History</div>
                  {logs.length===0&&<div style={{color:"#475569",fontSize:12,fontFamily:"monospace"}}>No doses logged yet.</div>}
                  {logs.map(l=>(
                    <div key={l.id} style={{background:"#020617",border:"1px solid #1e293b",borderRadius:8,padding:"10px 12px",marginBottom:8,fontSize:13}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                        <div style={{flex:1}}>
                          <div><b style={{color:"#fb7185"}}>{l.dose} {pep.unit}</b><span style={{color:"#64748b",fontSize:11,fontFamily:"monospace",marginLeft:8}}>{l.date}</span></div>
                          {editingDoseNote===l.id?(
                            <div style={{marginTop:8}}>
                              <textarea value={doseNoteText} onChange={e=>setDoseNoteText(e.target.value)} placeholder="How did this dose make you feel? Side effects, energy, sleep..." style={{width:"100%",boxSizing:"border-box",background:"#0f172a",border:`1px solid ${theme.primary}`,color:"#f8fafc",borderRadius:10,padding:"10px 12px",fontSize:12,fontFamily:"monospace",outline:"none",resize:"vertical",minHeight:80}}/>
                              <div style={{display:"flex",gap:8,marginTop:8}}>
                                <button style={{flex:1,background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:8,padding:"8px",cursor:"pointer",fontFamily:"monospace",fontSize:12,fontWeight:700}} onClick={()=>{setEditingDoseNote(null);setDoseNoteText("");}}>Cancel</button>
                                <button style={{flex:1,background:`linear-gradient(135deg,${theme.primaryDark},${theme.primary})`,border:"none",color:"#020617",borderRadius:8,padding:"8px",cursor:"pointer",fontFamily:"monospace",fontSize:12,fontWeight:700}} onClick={()=>{setPeptideLogs(prev=>({...prev,[pep.id]:(prev[pep.id]||[]).map(e=>e.id===l.id?{...e,note:doseNoteText}:e)}));setEditingDoseNote(null);setDoseNoteText("");flash("Note saved ✓");}}>Save Note</button>
                              </div>
                            </div>
                          ):(
                            <div onClick={()=>{setEditingDoseNote(l.id);setDoseNoteText(l.note||"");}} style={{marginTop:4,fontSize:11,color:l.note?"#94a3b8":"#475569",fontFamily:"monospace",cursor:"pointer",fontStyle:l.note?"normal":"italic",borderBottom:"1px dashed #1e293b",paddingBottom:4}}>
                              {l.note?l.note:"+ tap to add how you felt..."}
                            </div>
                          )}
                        </div>
                        <button style={{...deleteBtn,flexShrink:0,alignSelf:"flex-start"}} onClick={()=>setConfirm({label:`${l.dose}${pep.unit} dose on ${l.date}`,onConfirm:()=>removePeptideDose(pep.id,l.id)})}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      {/* PEPTIDES TAB */}
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
              const wk=p.dateAdded?getWeekNumber(p.dateAdded,todayISO()):null;
              return(
                <div key={p.id} style={{background:"#020617",border:"1px solid #1e293b",borderLeft:`3px solid ${sc[p.status]||"#475569"}`,borderRadius:12,padding:14,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:15,fontWeight:700,color:sc[p.status]}}>{p.name}</span>
                        <span style={{fontSize:10,fontFamily:"monospace",background:sc[p.status]+"22",color:sc[p.status],borderRadius:4,padding:"2px 7px"}}>{p.status.toUpperCase()}</span>
                        {wk&&p.status==="active"&&<span style={{fontSize:10,fontFamily:"monospace",color:"#475569",background:"#0f172a",borderRadius:4,padding:"2px 7px"}}>WK {wk}</span>}
                      </div>
                      <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:4}}>{p.dose}{p.unit} · {p.frequency}{p.cycle?` · ${p.cycle}`:""}</div>
                      <div style={{fontSize:11,color:"#475569",fontFamily:"monospace",marginTop:2}}>Total: {total.toFixed(3)}{p.unit} · {logs.length} doses</div>
                      {(p.pinDays||[]).length>0&&<div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>{(p.pinDays||[]).map(d=><span key={d} style={{fontSize:10,fontFamily:"monospace",background:theme.primary+"22",color:theme.primary,borderRadius:4,padding:"2px 6px"}}>{d}</span>)}</div>}
                      {p.notes&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4,fontStyle:"italic"}}>{p.notes}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>{setEditingPep(p);setPepForm({dose:p.dose==="—"?"":p.dose,unit:p.unit,frequency:p.frequency,cycle:p.cycle,notes:p.notes||"",status:p.status,pinDays:p.pinDays||[],reminderEnabled:p.reminderEnabled||false,reminderTime:p.reminderTime||"08:00"});setPepView("edit");}} style={{background:"#0f172a",border:"1px solid #1e293b",color:"#60a5fa",cursor:"pointer",borderRadius:6,padding:"4px 8px",fontSize:11}}>Edit</button>
                      <button onClick={()=>setConfirm({label:`Remove ${p.name} from your stack?`,onConfirm:()=>deletePep(p.id)})} style={{background:"transparent",border:"1px solid #450a0a",color:"#ef4444",cursor:"pointer",borderRadius:6,padding:"4px 8px",fontSize:11}}>✕</button>
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
                <label style={formLabel}>Dose</label>
                <div style={{display:"flex",gap:6}}><input style={{...DS.input,flex:1}} type="number" step="0.1" value={pepForm.dose} onChange={e=>setPepForm({...pepForm,dose:e.target.value})}/><select style={{...DS.input,width:80}} value={pepForm.unit} onChange={e=>setPepForm({...pepForm,unit:e.target.value})}>{["mg","mcg","g","IU","mL"].map(u=><option key={u}>{u}</option>)}</select></div>
                <label style={formLabel}>Frequency</label><input style={DS.input} value={pepForm.frequency} onChange={e=>setPepForm({...pepForm,frequency:e.target.value})}/>
                <label style={formLabel}>Cycle</label><input style={DS.input} value={pepForm.cycle} onChange={e=>setPepForm({...pepForm,cycle:e.target.value})}/>
                <label style={formLabel}>Status</label>
                <select style={DS.input} value={pepForm.status} onChange={e=>setPepForm({...pepForm,status:e.target.value})}>{["active","planned","completed"].map(o=><option key={o}>{o}</option>)}</select>
                <label style={formLabel}>Notes</label><input style={DS.input} value={pepForm.notes} onChange={e=>setPepForm({...pepForm,notes:e.target.value})}/>
                <label style={formLabel}>Pin Days</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>{
                    const selected=(pepForm.pinDays||[]).includes(day);
                    return(<button key={day} type="button" onClick={()=>setPepForm(f=>({...f,pinDays:selected?(f.pinDays||[]).filter(d=>d!==day):[...(f.pinDays||[]),day]}))} style={{padding:"6px 10px",borderRadius:8,cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700,border:`1px solid ${selected?theme.primary:"#334155"}`,background:selected?theme.primary+"22":"#020617",color:selected?theme.primary:"#64748b"}}>{day}</button>);
                  })}
                </div>
                <label style={formLabel}>Reminder</label>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button type="button" onClick={()=>setPepForm(f=>({...f,reminderEnabled:!f.reminderEnabled}))} style={{width:44,height:24,borderRadius:999,border:"none",cursor:"pointer",background:pepForm.reminderEnabled?theme.primary:"#334155",position:"relative",transition:"all 0.2s",flexShrink:0}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:pepForm.reminderEnabled?23:3,transition:"all 0.2s"}}/>
                  </button>
                  {pepForm.reminderEnabled&&<input type="time" value={pepForm.reminderTime||"08:00"} onChange={e=>setPepForm(f=>({...f,reminderTime:e.target.value}))} style={{...DS.input,width:"auto",flex:1}}/>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...DS.btn,gridColumn:"unset",flex:1,background:"#7f1d1d"}} onClick={()=>setConfirm({label:`Remove ${editingPep.name} from your stack?`,onConfirm:()=>deletePep(editingPep.id)})}>Remove</button>
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
                    return(<button key={pep.name} onClick={()=>{setPendingPep({...pep,category:cat});setPepForm({dose:"",unit:pep.unit||"mg",frequency:pep.frequency||"",cycle:pep.cycle||"",notes:"",status:"active",pinDays:[],reminderEnabled:false,reminderTime:"08:00"});setPepView("add");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:12,padding:"12px 14px",color:"#e2e8f0",textAlign:"left",cursor:"pointer"}}><div style={{fontWeight:700,fontSize:14}}>{pep.name}</div><div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:2}}>{pep.typicalDose} · {pep.frequency}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:4,lineHeight:1.5}}>{pep.desc}</div></button>);
                  })}
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {Object.keys(PEPTIDE_LIBRARY).map(cat=>(<button key={cat} onClick={()=>{setPepActiveCat(cat);setPepView("items");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:14,padding:14,color:"#f8fafc",textAlign:"left",cursor:"pointer"}}><div style={{fontSize:13,fontWeight:700}}>{cat}</div><div style={{marginTop:4,fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{PEPTIDE_LIBRARY[cat].length} peptides</div></button>))}
                </div>
              )}
            </>
          )}
          {pepView==="items"&&pepActiveCat&&(
            <>
              <button style={{...DS.btn,gridColumn:"unset",background:"#020617",border:"1px solid #334155",color:"#94a3b8",marginBottom:12}} onClick={()=>setPepView("cats")}>← Back</button>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {PEPTIDE_LIBRARY[pepActiveCat].map(pep=>(<button key={pep.name} onClick={()=>{setPendingPep({...pep,category:pepActiveCat});setPepForm({dose:"",unit:pep.unit||"mg",frequency:pep.frequency||"",cycle:pep.cycle||"",notes:"",status:"active",pinDays:[],reminderEnabled:false,reminderTime:"08:00"});setPepView("add");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:12,padding:"12px 14px",color:"#e2e8f0",textAlign:"left",cursor:"pointer"}}><div style={{fontWeight:700,fontSize:14}}>{pep.name}</div><div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:2}}>{pep.typicalDose} · {pep.frequency}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:4,lineHeight:1.5}}>{pep.desc}</div></button>))}
              </div>
            </>
          )}
          {pepView==="add"&&pendingPep&&(
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#f8fafc",marginBottom:4}}>{pendingPep.name}</div>
              <div style={{fontSize:12,color:"#64748b",fontFamily:"monospace",marginBottom:14,lineHeight:1.5}}>{pendingPep.desc}</div>
              <div style={{background:"#020617",border:"1px solid #1e293b",borderRadius:8,padding:10,marginBottom:14,fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>Typical: {pendingPep.typicalDose} · {pendingPep.frequency} · Cycle: {pendingPep.cycle}</div>
              <div style={formGrid}>
                <label style={formLabel}>Dose</label>
                <div style={{display:"flex",gap:6}}><input style={{...DS.input,flex:1}} type="number" step="0.1" placeholder={pendingPep.typicalDose} value={pepForm.dose} onChange={e=>setPepForm({...pepForm,dose:e.target.value})}/><select style={{...DS.input,width:80}} value={pepForm.unit} onChange={e=>setPepForm({...pepForm,unit:e.target.value})}>{["mg","mcg","g","IU","mL"].map(u=><option key={u}>{u}</option>)}</select></div>
                <label style={formLabel}>Frequency</label><input style={DS.input} placeholder={pendingPep.frequency} value={pepForm.frequency} onChange={e=>setPepForm({...pepForm,frequency:e.target.value})}/>
                <label style={formLabel}>Cycle</label><input style={DS.input} placeholder={pendingPep.cycle} value={pepForm.cycle} onChange={e=>setPepForm({...pepForm,cycle:e.target.value})}/>
                <label style={formLabel}>Status</label>
                <select style={DS.input} value={pepForm.status} onChange={e=>setPepForm({...pepForm,status:e.target.value})}>{["active","planned","completed"].map(o=><option key={o}>{o}</option>)}</select>
                <label style={formLabel}>Notes</label><input style={DS.input} placeholder="Protocol notes..." value={pepForm.notes} onChange={e=>setPepForm({...pepForm,notes:e.target.value})}/>
                <label style={formLabel}>Pin Days</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>{
                    const selected=(pepForm.pinDays||[]).includes(day);
                    return(<button key={day} type="button" onClick={()=>setPepForm(f=>({...f,pinDays:selected?(f.pinDays||[]).filter(d=>d!==day):[...(f.pinDays||[]),day]}))} style={{padding:"6px 10px",borderRadius:8,cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700,border:`1px solid ${selected?theme.primary:"#334155"}`,background:selected?theme.primary+"22":"#020617",color:selected?theme.primary:"#64748b"}}>{day}</button>);
                  })}
                </div>
                <label style={formLabel}>Reminder</label>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button type="button" onClick={()=>setPepForm(f=>({...f,reminderEnabled:!f.reminderEnabled}))} style={{width:44,height:24,borderRadius:999,border:"none",cursor:"pointer",background:pepForm.reminderEnabled?theme.primary:"#334155",position:"relative",transition:"all 0.2s",flexShrink:0}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:pepForm.reminderEnabled?23:3,transition:"all 0.2s"}}/>
                  </button>
                  {pepForm.reminderEnabled&&<input type="time" value={pepForm.reminderTime||"08:00"} onChange={e=>setPepForm(f=>({...f,reminderTime:e.target.value}))} style={{...DS.input,width:"auto",flex:1}}/>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...DS.btn,gridColumn:"unset",flex:1,background:"#1e293b",color:"#94a3b8"}} onClick={()=>{setPepView("items");setPendingPep(null);}}>Cancel</button>
                <button style={{...DS.btn,gridColumn:"unset",flex:1}} onClick={addPeptideToStack}>Add to Stack</button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* FOOD TAB */}
      {tab==="food"&&(
        <div>
          <div style={DS.panel}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h2 style={{margin:0,fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>📊 Today's Nutrition</h2>
              <span style={{fontSize:11,color:"#475569",fontFamily:"monospace"}}>{new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
              {[["Calories",todayCals,"kcal"],["Protein",todayProtein,"g"],["Carbs",todayFoods.reduce((s,f)=>s+(f.carbs||0),0),"g"],["Fat",todayFoods.reduce((s,f)=>s+(f.fat||0),0),"g"]].map(([l,v,u])=>(
                <div key={l} style={{background:"#020617",border:`1px solid ${theme.border}`,borderRadius:12,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:10,color:"#475569",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div>
                  <div style={{fontSize:18,fontWeight:900,color:v>0?theme.primary:"#334155",fontFamily:"monospace"}}>{v>0?v:"--"}</div>
                  <div style={{fontSize:10,color:"#64748b",fontFamily:"monospace"}}>{u}</div>
                </div>
              ))}
            </div>
            {calorieTarget&&todayCals>0&&(
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>Calories</span>
                  <span style={{fontSize:11,fontFamily:"monospace",color:todayCals>calorieTarget?"#ef4444":theme.primary}}>{todayCals} / {calorieTarget}</span>
                </div>
                <div style={{background:"#1e293b",borderRadius:999,height:7,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:999,width:`${Math.min(100,(todayCals/calorieTarget)*100)}%`,background:todayCals>calorieTarget?"#ef4444":`linear-gradient(90deg,${theme.primaryDark},${theme.primary})`}}/>
                </div>
              </div>
            )}
            {(()=>{
              const proteinTarget=Number(localStorage.getItem("tracker_protein_target"))||Math.round((Number(localStorage.getItem("tracker_start_weight"))||200)*0.7);
              if(proteinTarget&&todayProtein>0)return(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>Protein</span>
                    <span style={{fontSize:11,fontFamily:"monospace",color:todayProtein>=proteinTarget?"#4ade80":theme.primary}}>{todayProtein} / {proteinTarget}g</span>
                  </div>
                  <div style={{background:"#1e293b",borderRadius:999,height:7,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:999,width:`${Math.min(100,(todayProtein/proteinTarget)*100)}%`,background:todayProtein>=proteinTarget?"#4ade80":`linear-gradient(90deg,#1d4ed8,#60a5fa)`}}/>
                  </div>
                </div>
              );
            })()}
            <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${theme.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Droplets size={18} color={theme.primary}/>
                  <span style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace",fontWeight:700}}>WATER · {todayWater} oz</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {[8,16,32].map(oz=>(
                    <button key={oz} onClick={()=>addWater(oz)} style={{background:`${theme.primary}22`,border:`1px solid ${theme.primary}44`,color:theme.primary,borderRadius:8,padding:"4px 8px",cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700}}>+{oz}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={DS.panel}>
            <div style={{display:"flex",gap:6,marginBottom:16}}>
              {[["search","🔍 Search"],["quick","⚡ Quick"],["ai","📷 Scan"],["manual","✏️ Manual"]].map(([m,l])=>(
                <button key={m} onClick={()=>setFoodMode(m)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:`1px solid ${foodMode===m?theme.primary:"#334155"}`,background:foodMode===m?theme.primary+"22":"#020617",color:foodMode===m?theme.primary:"#64748b",cursor:"pointer",fontSize:10,fontFamily:"monospace",fontWeight:700}}>{l}</button>
              ))}
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Date</div>
              <input style={{...DS.input,width:"auto",minWidth:160}} type="date" value={foodDate} onChange={e=>setFoodDate(e.target.value)}/>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Meal</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[["🌅","Breakfast"],["☀️","Lunch"],["🌙","Dinner"],["🍎","Snack"]].map(([icon,meal])=>{
                  const selected=selectedMeal===meal;
                  return(
                    <button key={meal} onClick={()=>setSelectedMeal(meal)} style={{padding:"7px 12px",borderRadius:10,cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700,border:`1px solid ${selected?theme.primary:theme.border}`,background:selected?theme.primary+"22":"#020617",color:selected?theme.primary:"#94a3b8",transition:"all 0.15s"}}>
                      {icon} {meal}
                    </button>
                  );
                })}
              </div>
            </div>

            {foodMode==="quick"&&(
              <div>
                {(()=>{
                  const recent=[...new Map((foods||[]).slice().reverse().map(f=>[f.item,f])).values()].slice(0,8);
                  if(recent.length===0)return <div style={{color:"#475569",fontSize:13,fontFamily:"monospace",padding:"12px 0"}}>No recent foods yet. Search or add some food first.</div>;
                  return(
                    <div>
                      <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Recent — tap to re-log</div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                        {recent.map(f=>(
                          <button key={f.id} onClick={()=>{setFoods(prev=>[...(prev||[]),{...f,id:uid(),date:foodDate,meal:selectedMeal}]);flash(`${f.item} logged ✓`);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#020617",border:`1px solid ${theme.border}`,borderRadius:12,padding:"10px 14px",cursor:"pointer",textAlign:"left"}}>
                            <div><div style={{fontWeight:700,color:"#f8fafc",fontSize:13}}>{f.item}</div><div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{f.calories}cal · {f.protein}g pro</div></div>
                            <div style={{fontSize:20,color:theme.primary}}>+</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Common Staples</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {item:"Chicken Breast (100g)",calories:165,protein:31,carbs:0,fat:3.6,fiber:0},
                    {item:"White Rice (100g cooked)",calories:130,protein:2.7,carbs:28,fat:0.3,fiber:0.4},
                    {item:"Large Egg",calories:70,protein:6,carbs:0.5,fat:5,fiber:0},
                    {item:"Greek Yogurt (170g)",calories:100,protein:17,carbs:6,fat:0.7,fiber:0},
                    {item:"Protein Shake (1 scoop)",calories:120,protein:25,carbs:3,fat:1.5,fiber:0},
                    {item:"Banana (medium)",calories:105,protein:1.3,carbs:27,fat:0.4,fiber:3.1},
                    {item:"Almonds (28g / 1oz)",calories:164,protein:6,carbs:6,fat:14,fiber:3.5},
                    {item:"Salmon (100g)",calories:208,protein:20,carbs:0,fat:13,fiber:0},
                    {item:"Broccoli (100g)",calories:34,protein:2.8,carbs:7,fat:0.4,fiber:2.6},
                    {item:"Sweet Potato (100g)",calories:86,protein:1.6,carbs:20,fat:0.1,fiber:3},
                    {item:"Oatmeal (40g dry)",calories:150,protein:5,carbs:27,fat:2.5,fiber:4},
                    {item:"Ground Beef 80/20 (100g)",calories:254,protein:17,carbs:0,fat:20,fiber:0},
                  ].map(food=>(
                    <button key={food.item} onClick={()=>{setFoods(prev=>[...(prev||[]),{id:uid(),date:foodDate,meal:selectedMeal,...food}]);const msg2=getMotivationMessage(isJunkFood(food.item)?"junk_food":"food_logged",motivationMode,userName,{food:food.item},IS_BULK);if(motivationMode==="drill"&&isJunkFood(food.item))setJunkAlert(msg2);else flash(msg2);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#020617",border:`1px solid ${theme.border}`,borderRadius:12,padding:"10px 14px",cursor:"pointer",textAlign:"left"}}>
                      <div><div style={{fontWeight:700,color:"#f8fafc",fontSize:13}}>{food.item}</div><div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{food.calories}cal · {food.protein}g pro · {food.carbs}g carb · {food.fat}g fat</div></div>
                      <div style={{fontSize:20,color:theme.primary}}>+</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                        {foodSearchResults.serving_sizes.map((sv,i)=>(
                          <button key={sv.label} onClick={()=>{setServingWeight(String(sv.weight_g));setServingUnit("g");}} style={{background:servingWeight===String(sv.weight_g)||(!servingWeight&&i===0)?theme.primary+"22":"#0f172a",border:`1px solid ${servingWeight===String(sv.weight_g)||(!servingWeight&&i===0)?theme.primary:"#1e293b"}`,color:servingWeight===String(sv.weight_g)||(!servingWeight&&i===0)?theme.primary:"#94a3b8",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,fontFamily:"monospace"}}>{sv.label}</button>
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
                  <button style={{...DS.btn,gridColumn:"unset",width:"100%",opacity:(!servingWeight||parseFloat(servingWeight)<=0)?0.5:1}} onClick={()=>{
                    if(!foodSearchResults||!servingWeight)return;
                    const wg=servingUnit==="oz"?parseFloat(servingWeight)*28.35:parseFloat(servingWeight);
                    if(!wg||wg<=0)return;
                    const n=calcNutrition(foodSearchResults.per_100g,wg);
                    setFoods(prev=>[...(prev||[]),{id:uid(),date:foodDate,meal:selectedMeal,item:foodSearchResults.food+(foodSearchResults.brand?` (${foodSearchResults.brand})`:""),weight_g:wg,...n}]);
                    const foodName=foodSearchResults.food+(foodSearchResults.brand?` (${foodSearchResults.brand})`:"");
                    setFoodQuery("");setFoodSearchResults(null);setServingWeight("");
                    const msg1=getMotivationMessage(isJunkFood(foodName)?"junk_food":"food_logged",motivationMode,userName,{food:foodSearchResults.food},IS_BULK);
                    if(motivationMode==="drill"&&isJunkFood(foodName))setJunkAlert(msg1);else flash(msg1);
                  }} disabled={!servingWeight||parseFloat(servingWeight)<=0}>+ Log This Food</button>
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
                <button style={DS.btn} onClick={()=>{
                  if(!manualFood.item)return;
                  setFoods(prev=>[...(prev||[]),{id:uid(),date:foodDate,meal:selectedMeal,item:manualFood.item,weight_g:null,calories:+(manualFood.calories||0),protein:+(manualFood.protein||0),carbs:+(manualFood.carbs||0),fat:+(manualFood.fat||0),fiber:+(manualFood.fiber||0)}]);
                  const item=manualFood.item;
                  setManualFood({item:"",calories:"",protein:"",carbs:"",fat:"",fiber:""});
                  const msg3=getMotivationMessage(isJunkFood(item)?"junk_food":"food_logged",motivationMode,userName,{food:item},IS_BULK);
                  if(motivationMode==="drill"&&isJunkFood(item))setJunkAlert(msg3);else flash(msg3);
                }}>+ Log Food</button>
              </div>
            )}
          </div>

          <div style={DS.panel}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h2 style={{margin:0,fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>{showFoodHistory?"All History":"Today's Log"}</h2>
              <button onClick={()=>setShowFoodHistory(h=>!h)} style={{background:"#020617",border:`1px solid ${theme.border}`,color:"#64748b",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontFamily:"monospace",fontSize:11}}>{showFoodHistory?"Today":"All history"}</button>
            </div>
            {showFoodHistory?(
              <div>
                {[...(foods||[])].sort((a,b)=>new Date(b.date)-new Date(a.date)).length===0
                  ?<div style={{color:"#475569",fontSize:13,fontFamily:"monospace"}}>No food logged yet.</div>
                  :[...(foods||[])].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(f=>(
                    <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,background:"#020617",border:"1px solid #1e293b",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,color:"#f59e0b",fontSize:13}}>{f.item}</div>
                        <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{f.date}{f.meal?` · ${f.meal}`:""} · {f.calories}cal · {f.protein}g pro</div>
                      </div>
                      <button style={{...deleteBtn,flexShrink:0}} onClick={()=>setConfirm({label:`${f.item} · ${f.date}`,onConfirm:()=>setFoods((foods||[]).filter(x=>x.id!==f.id))})}>✕</button>
                    </div>
                  ))
                }
              </div>
            ):(
              <div>
                {todayFoods.length===0
                  ?<div style={{color:"#475569",fontSize:13,fontFamily:"monospace"}}>Nothing logged today. Use Quick, Search, Scan, or Manual above.</div>
                  :(()=>{
                    const mealOrder=["Breakfast","Lunch","Dinner","Snack"];
                    const byMeal={};
                    todayFoods.forEach(f=>{const m=f.meal||"Other";if(!byMeal[m])byMeal[m]=[];byMeal[m].push(f);});
                    const meals=[...mealOrder.filter(m=>byMeal[m]),...Object.keys(byMeal).filter(m=>!mealOrder.includes(m))];
                    return meals.map(meal=>{
                      const items=byMeal[meal];
                      const mealCals=items.reduce((s,f)=>s+(f.calories||0),0);
                      const mealPro=items.reduce((s,f)=>s+(f.protein||0),0);
                      const icons={"Breakfast":"🌅","Lunch":"☀️","Dinner":"🌙","Snack":"🍎","Other":"🍽️"};
                      return(
                        <div key={meal} style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                            <div style={{fontSize:12,fontWeight:700,color:theme.primary,fontFamily:"monospace"}}>{icons[meal]||"🍽️"} {meal}</div>
                            <div style={{fontSize:11,color:"#475569",fontFamily:"monospace"}}>{mealCals} cal · {mealPro}g pro</div>
                          </div>
                          {items.map(f=>(
                            <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,background:"#020617",border:"1px solid #1e293b",borderRadius:8,padding:"10px 12px",marginBottom:5}}>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:700,color:"#f59e0b",fontSize:13}}>{f.item}</div>
                                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{f.calories}cal · {f.protein}g pro · {f.carbs}g carb · {f.fat}g fat{f.fiber?` · ${f.fiber}g fiber`:""}</div>
                              </div>
                              <button style={{...deleteBtn,flexShrink:0}} onClick={()=>setConfirm({label:`${f.item} · ${f.calories}cal`,onConfirm:()=>setFoods((foods||[]).filter(x=>x.id!==f.id))})}>✕</button>
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()
                }
              </div>
            )}
          </div>
        </div>
      )}
      {/* WORKOUTS TAB */}
      {tab==="workouts"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
            {[["Today",`${todayMinutes}`,"min"],["This Week",`${thisWeekMins}`,"min"],["Total",`${(workouts||[]).length}`,"sessions"]].map(([l,v,u])=>(
              <div key={l} style={DS.card}>
                <div style={{fontSize:10,color:"#475569",textTransform:"uppercase",letterSpacing:1.5,fontFamily:"monospace",marginBottom:4}}>{l}</div>
                <div style={{fontSize:22,fontWeight:900,color:theme.primary}}>{v}<span style={{fontSize:12,fontWeight:400}}> {u}</span></div>
              </div>
            ))}
          </div>
          <div style={DS.panel}>
            <h2 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>💪 Log Workout</h2>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Date</div>
              <input style={{...DS.input,width:"auto",minWidth:160}} type="date" value={workoutForm.date} onChange={e=>setWorkoutForm({...workoutForm,date:e.target.value})}/>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Workout Type</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
                {[["🏋️","Weights"],["🏃","Run"],["🚴","Bike"],["🏊","Swim"],["⚡","HIIT"],["🚶","Walk"],["🤸","Cardio"],["⚽","Sports"],["🔥","Other"]].map(([icon,label])=>(
                  <button key={label} onClick={()=>setWorkoutForm({...workoutForm,type:label,miles:"",runTime:"",runType:"",intensity:"",note:"",calories:""})} style={{padding:"8px 12px",borderRadius:10,cursor:"pointer",fontFamily:"monospace",fontSize:12,fontWeight:700,border:`1px solid ${workoutForm.type===label?theme.primary:theme.border}`,background:workoutForm.type===label?theme.primary+"22":"#020617",color:workoutForm.type===label?theme.primary:"#94a3b8",transition:"all 0.15s"}}>
                    {icon} {label}
                  </button>
                ))}
              </div>
              <input style={DS.input} placeholder="Or type custom..." value={["Weights","Run","Bike","Swim","HIIT","Walk","Cardio","Sports","Other"].includes(workoutForm.type)?"":workoutForm.type} onChange={e=>setWorkoutForm({...workoutForm,type:e.target.value})}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Duration (min)</div>
                <input style={DS.input} type="number" placeholder="60" value={workoutForm.minutes} onChange={e=>setWorkoutForm({...workoutForm,minutes:e.target.value})}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Calories Burned</div>
                <input style={DS.input} type="number" placeholder="400" value={workoutForm.calories||""} onChange={e=>setWorkoutForm({...workoutForm,calories:e.target.value})}/>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Intensity</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {[["Easy","#4ade80"],["Moderate","#f59e0b"],["Hard","#f97316"],["Max","#ef4444"]].map(([level,color])=>(
                  <button key={level} onClick={()=>setWorkoutForm({...workoutForm,intensity:level})} style={{padding:"8px 4px",borderRadius:10,cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700,border:`1px solid ${workoutForm.intensity===level?color:"#1e293b"}`,background:workoutForm.intensity===level?color+"22":"#020617",color:workoutForm.intensity===level?color:"#64748b",transition:"all 0.15s"}}>
                    {level}
                  </button>
                ))}
              </div>
            </div>
            {workoutForm.type==="Weights"&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Sets / Reps / Notes</div>
                <input style={DS.input} placeholder='e.g. "Bench 3x8 185lb, Squat 4x5 225lb"' value={workoutForm.note} onChange={e=>setWorkoutForm({...workoutForm,note:e.target.value})}/>
              </div>
            )}
            {workoutForm.type==="Run"&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Run Type</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {["Easy Run","Tempo","Intervals","Long Run","Race","Treadmill"].map(rt=>(
                    <button key={rt} onClick={()=>setWorkoutForm({...workoutForm,runType:rt})} style={{padding:"7px 12px",borderRadius:10,cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700,border:`1px solid ${workoutForm.runType===rt?theme.primary:theme.border}`,background:workoutForm.runType===rt?theme.primary+"22":"#020617",color:workoutForm.runType===rt?theme.primary:"#94a3b8",transition:"all 0.15s"}}>{rt}</button>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Distance (miles)</div>
                    <input style={DS.input} type="number" step="0.1" placeholder="3.1" value={workoutForm.miles||""} onChange={e=>setWorkoutForm({...workoutForm,miles:e.target.value})}/>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Time (mm:ss)</div>
                    <input style={DS.input} placeholder="28:30" value={workoutForm.runTime||""} onChange={e=>setWorkoutForm({...workoutForm,runTime:e.target.value})}/>
                  </div>
                </div>
                {(()=>{
                  try{
                    if(!workoutForm.miles||!workoutForm.runTime)return null;
                    const milesNum=parseFloat(workoutForm.miles);
                    const parts=workoutForm.runTime.split(":");
                    if(parts.length!==2)return null;
                    const totalMins=+parts[0]+(+parts[1]/60);
                    if(!milesNum||isNaN(milesNum)||isNaN(totalMins)||totalMins<=0||milesNum<=0)return null;
                    const pace=totalMins/milesNum;
                    const paceMin=Math.floor(pace);
                    const paceSec=Math.round((pace-paceMin)*60).toString().padStart(2,"0");
                    return(
                      <div style={{background:`linear-gradient(145deg,#020617,${theme.primary}11)`,border:`1px solid ${theme.primary}44`,borderRadius:12,padding:12,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center",marginBottom:10}}>
                        {[["Distance",`${milesNum.toFixed(2)} mi`],["Total Time",workoutForm.runTime],["Avg Pace",`${paceMin}:${paceSec} /mi`]].map(([l,v])=>(
                          <div key={l}><div style={{fontSize:10,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:900,color:theme.primary,fontFamily:"monospace"}}>{v}</div></div>
                        ))}
                      </div>
                    );
                  }catch(e){return null;}
                })()}
              </div>
            )}
            {workoutForm.type!=="Weights"&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Notes</div>
                <input style={DS.input} placeholder="Energy level, PRs, how it felt..." value={workoutForm.note} onChange={e=>setWorkoutForm({...workoutForm,note:e.target.value})}/>
              </div>
            )}
            <button style={{...DS.btn,gridColumn:"unset",width:"100%"}} onClick={addWorkout}>+ Log Workout</button>
          </div>
          <div style={DS.panel}>
            <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>Workout History</h2>
            {(workouts||[]).length===0&&<div style={{color:"#475569",fontSize:13,fontFamily:"monospace"}}>No workouts logged yet.</div>}
            {(()=>{
              const sorted=[...(workouts||[])].sort((a,b)=>new Date(b.date)-new Date(a.date));
              const weekMap={};
              sorted.forEach(w=>{
                const d=new Date(w.date);
                const sun=new Date(d);
                sun.setDate(d.getDate()-d.getDay());
                const key=sun.toISOString().slice(0,10);
                if(!weekMap[key])weekMap[key]=[];
                weekMap[key].push(w);
              });
              return Object.entries(weekMap).sort((a,b)=>new Date(b[0])-new Date(a[0])).map(([weekStart,wkWorkouts])=>{
                const totalMins=wkWorkouts.reduce((s,w)=>s+(w.minutes||0),0);
                const isCurrentWeek=new Date(weekStart)>=new Date(new Date().setDate(new Date().getDate()-new Date().getDay())-1);
                const label=`Week of ${new Date(weekStart).toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
                return(
                  <div key={weekStart} style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:isCurrentWeek?theme.primary:"#475569",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"flex",justifyContent:"space-between"}}>
                      <span>{isCurrentWeek?"This Week":label}</span>
                      <span>{wkWorkouts.length} sessions · {totalMins} min</span>
                    </div>
                    {wkWorkouts.map(w=>(
                      <div key={w.id} style={{background:"#020617",border:`1px solid ${theme.border}`,borderRadius:12,padding:14,marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                              <span style={{fontWeight:700,fontSize:14,color:theme.primary}}>{w.type}</span>
                              {w.intensity&&<span style={{fontSize:10,fontFamily:"monospace",padding:"2px 8px",borderRadius:20,background:w.intensity==="Easy"?"#14532d":w.intensity==="Moderate"?"#451a03":w.intensity==="Hard"?"#431407":"#450a0a",color:w.intensity==="Easy"?"#4ade80":w.intensity==="Moderate"?"#f59e0b":w.intensity==="Hard"?"#f97316":"#ef4444",border:`1px solid ${w.intensity==="Easy"?"#4ade80":w.intensity==="Moderate"?"#f59e0b":w.intensity==="Hard"?"#f97316":"#ef4444"}`}}>{w.intensity}</span>}
                              {w.runType&&<span style={{fontSize:10,fontFamily:"monospace",color:"#94a3b8"}}>{w.runType}</span>}
                            </div>
                            <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{w.date} · {w.minutes} min{w.calories?` · ${w.calories} cal burned`:""}{w.miles?` · ${w.miles} mi`:""}{w.runTime?` · ${w.runTime}`:""}</div>
                            {w.note&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4,fontStyle:"italic"}}>{w.note}</div>}
                          </div>
                          <button style={{...deleteBtn,flexShrink:0,marginLeft:8}} onClick={()=>setConfirm({label:`${w.type} · ${w.date} · ${w.minutes}min`,onConfirm:()=>setWorkouts((workouts||[]).filter(x=>x.id!==w.id))})}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
      {/* SUPPLEMENTS TAB */}
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
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,background:taken?theme.primary+"11":"#020617",border:`1px solid ${taken?theme.primary+"66":"#1e293b"}`,borderRadius:12,padding:"10px 14px",marginBottom:8,cursor:"pointer",transition:"all 0.15s"}} onClick={()=>{setEditingSupp(s);setSuppForm({dose:s.dose==="—"?"":s.dose,unit:s.unit||"mg",schedule:s.schedule,time:s.time,reminderEnabled:s.reminderEnabled||false,reminderTime:s.reminderTime||"08:00"});setSuppView("detail");}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#e2e8f0"}}>{s.name}</div>
                      <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",marginTop:2}}>{s.dose}{s.unit} · {s.schedule} · {s.time}</div>
                      {s.reminderEnabled&&<div style={{fontSize:10,color:theme.primary,fontFamily:"monospace",marginTop:2}}>⏰ {s.reminderTime}</div>}
                      {taken&&<div style={{fontSize:10,color:theme.primary,fontFamily:"monospace",marginTop:3}}>✓ TAKEN TODAY</div>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();toggleTaken(s.id);}} style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${taken?theme.primary:"#334155"}`,background:taken?theme.primary+"33":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:taken?theme.primary:"#475569",flexShrink:0,transition:"all 0.15s"}}>✓</button>
                  </div>
                );
              })}
              {mySupplements.length>0&&(<div style={{fontSize:11,color:"#475569",fontFamily:"monospace",textAlign:"center",padding:"8px 0"}}>{takenToday.filter(id=>mySupplements.find(s=>s.id===id)).length} / {mySupplements.length} taken today</div>)}
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
                <label style={formLabel}>Reminder</label>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button type="button" onClick={()=>setSuppForm(f=>({...f,reminderEnabled:!f.reminderEnabled}))} style={{width:44,height:24,borderRadius:999,border:"none",cursor:"pointer",background:suppForm.reminderEnabled?theme.primary:"#334155",position:"relative",transition:"all 0.2s",flexShrink:0}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:suppForm.reminderEnabled?23:3,transition:"all 0.2s"}}/>
                  </button>
                  {suppForm.reminderEnabled&&<input type="time" value={suppForm.reminderTime||"08:00"} onChange={e=>setSuppForm(f=>({...f,reminderTime:e.target.value}))} style={{...DS.input,width:"auto",flex:1}}/>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={{...DS.btn,gridColumn:"unset",flex:1,background:"#7f1d1d"}} onClick={()=>setConfirm({label:`Remove ${editingSupp.name} from your supplements?`,onConfirm:()=>deleteSupp(editingSupp.id)})}>Remove</button>
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
                <label style={formLabel}>Reminder</label>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button type="button" onClick={()=>setSuppForm(f=>({...f,reminderEnabled:!f.reminderEnabled}))} style={{width:44,height:24,borderRadius:999,border:"none",cursor:"pointer",background:suppForm.reminderEnabled?theme.primary:"#334155",position:"relative",transition:"all 0.2s",flexShrink:0}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:suppForm.reminderEnabled?23:3,transition:"all 0.2s"}}/>
                  </button>
                  {suppForm.reminderEnabled&&<input type="time" value={suppForm.reminderTime||"08:00"} onChange={e=>setSuppForm(f=>({...f,reminderTime:e.target.value}))} style={{...DS.input,width:"auto",flex:1}}/>}
                </div>
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
                      <button key={item} onClick={()=>{setPendingSupp({name:item,category:cat});setSuppForm({dose:"",unit:"mg",schedule:"Daily",time:"Morning",reminderEnabled:false,reminderTime:"08:00"});setSuppView("add");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:12,padding:"11px 14px",color:"#e2e8f0",fontWeight:700,textAlign:"left",cursor:"pointer"}}>
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
                  <button key={item} onClick={()=>{setPendingSupp({name:item,category:suppActiveCat});setSuppForm({dose:"",unit:"mg",schedule:"Daily",time:"Morning",reminderEnabled:false,reminderTime:"08:00"});setSuppView("add");}} style={{background:"#020617",border:`1px solid ${theme.primary}33`,borderRadius:12,padding:"11px 14px",color:"#e2e8f0",fontWeight:700,textAlign:"left",cursor:"pointer"}}>
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* NOTES TAB */}
      {tab==="notes"&&(
        <div>
          <div style={DS.panel}>
            <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>📓 Daily Journal</h2>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Date</div>
              <input style={{...DS.input,width:"auto",minWidth:160}} type="date" value={noteDate} onChange={e=>setNoteDate(e.target.value)}/>
            </div>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="How are you feeling today? Energy levels, sleep quality, how the protocol is going, anything on your mind..." style={{width:"100%",boxSizing:"border-box",background:"#020617",border:`1px solid ${theme.border}`,color:"#f8fafc",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"monospace",outline:"none",resize:"vertical",minHeight:120,marginBottom:12,lineHeight:1.7}}/>
            <button style={{...DS.btn,gridColumn:"unset",width:"100%"}} onClick={addNote}>+ Save Note</button>
          </div>
          <div style={DS.panel}>
            <h2 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#94a3b8",fontFamily:"monospace"}}>Journal History</h2>
            {(notes||[]).length===0&&<div style={{color:"#475569",fontSize:13,fontFamily:"monospace"}}>No notes yet. Start writing above.</div>}
            {(()=>{
              const sorted=[...(notes||[])].sort((a,b)=>new Date(b.date)-new Date(a.date));
              const byDay={};
              sorted.forEach(n=>{if(!byDay[n.date])byDay[n.date]=[];byDay[n.date].push(n);});
              return Object.entries(byDay).sort((a,b)=>new Date(b[0])-new Date(a[0])).map(([day,dayNotes])=>{
                const isOpen=expandedNoteDay===day;
                return(
                  <div key={day} style={{background:"#020617",border:`1px solid ${isOpen?theme.primary+"66":"#1e293b"}`,borderRadius:12,marginBottom:8,overflow:"hidden"}}>
                    <button onClick={()=>setExpandedNoteDay(isOpen?null:day)} style={{width:"100%",background:"none",border:"none",padding:"12px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontWeight:700,color:"#e2e8f0",fontSize:14}}>{new Date(day+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</div>
                        <div style={{fontSize:11,color:"#64748b",fontFamily:"monospace"}}>{dayNotes.length} entr{dayNotes.length===1?"y":"ies"}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11,color:"#475569",fontFamily:"monospace",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dayNotes[0].text.slice(0,40)}{dayNotes[0].text.length>40?"...":""}</span>
                        {isOpen?<ChevronUp size={16} color="#64748b"/>:<ChevronDown size={16} color="#64748b"/>}
                      </div>
                    </button>
                    {isOpen&&(
                      <div style={{padding:"0 14px 12px"}}>
                        {dayNotes.map(n=>(
                          <div key={n.id} style={{padding:"10px 0",borderTop:"1px solid #1e293b"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                              <div style={{flex:1,fontSize:13,color:"#94a3b8",lineHeight:1.7,fontFamily:"monospace",whiteSpace:"pre-wrap"}}>{n.text}</div>
                              <button style={{...deleteBtn,flexShrink:0}} onClick={()=>setConfirm({label:`Delete this journal entry?`,onConfirm:()=>setNotes((notes||[]).filter(x=>x.id!==n.id))})}>✕</button>
                            </div>
                            <div style={{fontSize:10,color:"#334155",fontFamily:"monospace",marginTop:6}}>{new Date(n.created).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {tab==="calculator"&&<PeptideCalculator theme={theme} DS={DS}/>}
    </div>
  );
}
