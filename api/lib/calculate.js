// ── Server-side calculation engine ────────────────────────────────────────────
// This file runs ONLY on the server. The raw data never reaches the browser.

const {
  POWER_CURVE, PLAN_PC_KEYS, COUNTRIES, VARIETIES, LEGACY,
  PLANS, PLAN_NOTES_LANG, normalizePlan
} = require('./data');

// ── Utility ───────────────────────────────────────────────────────────────────
function getBand(density) {
  return density < 64 ? 'low' : density <= 68 ? 'med' : 'high';
}

function getVoltAdj(voltage) {
  return voltage === '110' ? 0.5 : voltage === '100' ? -1.0 : 0;
}

function matchPowerCurveRow(density, process, tubeType) {
  const key = tubeType === 'v1' ? 'v1' : 'v2';
  let row = null;
  for (const r of POWER_CURVE) {
    const rs = r[key];
    if (!rs) continue;
    const parts = rs.split('-');
    if (parts.length < 2) continue;
    const lo = parseFloat(parts[0]), hi = parseFloat(parts[1]);
    if (density >= lo && density < hi && r.process === process) { row = r; break; }
  }
  if (!row) {
    for (const r of [...POWER_CURVE].reverse()) {
      const rs = r[key];
      if (!rs) continue;
      const parts = rs.split('-');
      if (Math.abs(density - parseFloat(parts[1])) < 0.01 && r.process === process) { row = r; break; }
    }
  }
  return row;
}

function getCountryAdj(countryVal, continentVal, band) {
  let rec = null;
  if (countryVal) rec = COUNTRIES.find(c => c.name === countryVal);
  else if (continentVal) rec = COUNTRIES.find(c => c.continent === continentVal && c.isDefault);
  return rec ? (rec[band] || 0) : 0;
}

function getVarietyAdj(varietyCode, band) {
  const rec = varietyCode ? VARIETIES.find(v => v.code === varietyCode) : null;
  if (!rec) return { pc: 0, fan: 0 };
  const fk = 'fan' + band.charAt(0).toUpperCase() + band.slice(1);
  return { pc: rec.pc || 0, fan: rec[fk] || 0 };
}

// ── Main profile calculator ───────────────────────────────────────────────────
function calculate({ mode, density, process, tubeType, voltage, countryVal, continentVal, varietyCode, forcedPlanId }) {
  if (!density || !process || !tubeType || !voltage) return { error: 'Missing required fields' };

  const band = getBand(density);
  const voltAdj = getVoltAdj(voltage);
  const countryPC = getCountryAdj(countryVal, continentVal, band);
  const { pc: varietyPC, fan: varietyFan } = getVarietyAdj(varietyCode, band);

  // Determine plan
  const profile = LEGACY[varietyCode] || null;
  const modeData = profile ? profile[mode] : null;
  let planName = null, crack = null, dtr = null, filterDtr = null;

  if (forcedPlanId) {
    planName = forcedPlanId;
  } else if (modeData) {
    planName = modeData.plan;
    crack = modeData.crack;
    dtr = modeData.dtr;
    filterDtr = modeData.filterDtr;
  }

  // Find POWER_CURVE row
  const matchRow = matchPowerCurveRow(density, process, tubeType);
  const pcKey = planName ? PLAN_PC_KEYS[mode]?.[planName.replace('%', '')] || normalizePlan(planName) : null;
  const basePC = (matchRow && pcKey && matchRow.plans[pcKey] != null) ? matchRow.plans[pcKey] : null;

  const defaultFanAdj = matchRow?.fan_adj || 0;
  const totalFan = defaultFanAdj + varietyFan;

  const finalPC = basePC !== null ? basePC + countryPC + varietyPC + voltAdj : null;

  return {
    plan: planName,
    powerCurve: finalPC !== null ? +finalPC.toFixed(1) : null,
    fanAdj: totalFan !== 0 ? +Math.abs(totalFan).toFixed(3) : null,
    fanDirection: totalFan > 0 ? 'add' : totalFan < 0 ? 'reduce' : null,
    fanBreakdown: { density: defaultFanAdj || null, variety: varietyFan || null },
    crack,
    dtr,
    filterDtr,
    band
  };
}

// ── Manual profile mode ───────────────────────────────────────────────────────
function calculateManual({ style, planId, density, process, tubeType, voltage, countryVal, continentVal, varietyCode }) {
  if (!planId) return { error: 'No plan selected' };

  const plan = PLANS[style]?.find(p => p.id === planId);
  if (!plan) return { error: 'Plan not found' };

  const band = getBand(density);
  const voltAdj = getVoltAdj(voltage);
  const countryPC = getCountryAdj(countryVal, continentVal, band);
  const { pc: varietyPC, fan: varietyFan } = getVarietyAdj(varietyCode, band);

  const hasInputs = !isNaN(density) && process && tubeType && voltage;
  let powerCurve = null, fanAdj = null, fanDirection = null;

  if (hasInputs) {
    const pcKey = PLAN_PC_KEYS[style]?.[planId] || '';
    const matchRow = matchPowerCurveRow(density, process, tubeType);

    if (matchRow && pcKey && matchRow.plans[pcKey] != null) {
      const base = matchRow.plans[pcKey] + voltAdj + countryPC + varietyPC;
      powerCurve = +base.toFixed(1);
      const totalFan = (matchRow.fan_adj || 0) + varietyFan;
      if (totalFan !== 0) {
        fanAdj = +Math.abs(totalFan).toFixed(3);
        fanDirection = totalFan > 0 ? 'add' : 'reduce';
      }
    }
  }

  return {
    planName: plan.name,
    descriptor: plan.descriptor,
    metrics: plan.metrics,
    powerCurve,
    fanAdj,
    fanDirection,
    hasInputs
  };
}

// ── Plan notes ────────────────────────────────────────────────────────────────
function getPlanNotes(style, planId, lang) {
  const key = `${style}_${planId}`;
  // English notes live in PLAN_NOTES; other languages in PLAN_NOTES_LANG
  if (lang === 'en' || !PLAN_NOTES_LANG[lang]) {
    return PLAN_NOTES[key] || null;
  }
  return PLAN_NOTES_LANG[lang][key] || PLAN_NOTES[key] || null;
}

// ── Plans list (metadata only, no power data) ─────────────────────────────────
function getPlans(style) {
  return (PLANS[style] || []).map(p => ({
    id: p.id,
    name: p.name,
    descriptor: p.descriptor,
    metrics: p.metrics,
    img: p.img || null
  }));
}

module.exports = { calculate, calculateManual, getPlanNotes, getPlans };
