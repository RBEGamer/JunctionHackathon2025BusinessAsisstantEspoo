// Required stations that must be completed before scheduling appointment
import tracks from './tracks'

// For appointments we'll require these track ids (matches routing registration prerequisites)
export const REQUIRED_STATIONS_FOR_APPOINTMENT = ['business_plan_basic', 'enterprise_form_basic', 'numbers_basic', 'registration_submit'];

export const stations = tracks.map(t => {
  const def = t.definition || {};
  const inputs = def.required_inputs || [];
  const subpoints = inputs.length > 0 ? inputs.map((inp, idx) => ({
    id: `${t.trackId}-${inp.id || idx}`,
    label: inp.label || inp.key || `Input ${idx+1}`,
    key: inp.key || `${t.trackId}.${inp.id || idx}`,
    type: inp.type || 'text',
    help_text: inp.help_text || '',
    optional: !!inp.optional,
    completed: false,
  })) : [{ id: `${t.trackId}-1`, label: def.label || t.trackId, completed: false }];

  const summary = def.summary || t.summary || '';
  return {
    id: t.trackId,
    title: def.label || t.trackId,
    description: t.description || summary,
    summary,
    category: t.category || def.track || null,
    order: t.order || 0,
    subpoints,
    dependencies: t.prerequisites || [],
    required: !!t.required,
    // eligibility criteria_refs from definition (array of {answer_key, expected_value})
    eligibility: (def && def.eligibility && def.eligibility.criteria_refs) ? def.eligibility.criteria_refs : [],
  }
});

// Sort stations by order
stations.sort((a, b) => a.order - b.order);

export const FUNDING_TRACK_IDS = stations
  .filter(station => station.category === 'funding')
  .map(station => station.id);

export const hasCompletedFundingTrack = (completedStations) =>
  FUNDING_TRACK_IDS.some(id => completedStations.includes(id));

export const getStationById = (id) => stations.find(s => s.id === id);

export const getAvailableStations = (completedStations) => {
  return stations.filter(station => {
    if (completedStations.includes(station.id)) return false;
    return isStationAvailable(station, completedStations);
  });
};

// Helper: checks prerequisites and eligibility criteria against stored answers
export const isStationAvailable = (station, completedStations) => {
  if (station.id === 'registration_submit' && !hasCompletedFundingTrack(completedStations)) {
    return false;
  }
  // prerequisites
  const depsOk = (station.dependencies || []).every(dep => completedStations.includes(dep)) || (station.dependencies || []).length === 0;
  if (!depsOk) return false;

  // eligibility: all criteria_refs must match expected_value (if any exist)
  const answers = (() => {
    try { return JSON.parse(localStorage.getItem('track_answers') || '{}'); } catch (e) { return {}; }
  })();

  const criteria = station.eligibility || [];
  if (!Array.isArray(criteria) || criteria.length === 0) return true;

  const match = criteria.every(c => {
    const key = c.answer_key || c.answerKey || c.key;
    if (!key) return false;
    const expected = c.expected_value;
    const actual = answers[key];
    // loose but sensible matching for booleans/numbers/strings
    if (typeof expected === 'boolean') return actual === expected || `${actual}` === `${expected}`;
    if (typeof expected === 'number') return Number(actual) === expected;
    if (expected === null || expected === undefined) return actual === expected;
    // default: string comparison (case-insensitive)
    return `${actual}`.toLowerCase() === `${expected}`.toLowerCase();
  });

  return match;
};

export const calculateProgress = (station) => {
  try {
    const answers = JSON.parse(localStorage.getItem('track_answers') || '{}');
    const requiredSubs = station.subpoints.filter(sp => !sp.optional);
    const subsToCheck = requiredSubs.length > 0 ? requiredSubs : station.subpoints;
    const total = subsToCheck.length || 1;
    const completed = subsToCheck.filter(sp => {
      if (sp.completed) return true;
      if (!sp.type) return sp.completed;
      const key = sp.key;
      const val = answers ? answers[key] : undefined;
      if (sp.type === 'boolean') return val === true || val === 'true';
      if (sp.type === 'number') return val !== undefined && val !== null && `${val}`.toString().trim() !== '';
      if (sp.type === 'file') return val && (val.name || val.filename || val.fileName);
      // default: treat non-empty string as completed
      return val !== undefined && val !== null && `${val}`.toString().trim() !== '';
    }).length;
    return Math.round((completed / total) * 100);
  } catch (e) {
    return 0;
  }
};

export const getOverallProgress = (stationsArr) => {
  try {
    if (!Array.isArray(stationsArr) || stationsArr.length === 0) return 0;
    // Use calculateProgress for each station so overall starts at 0 when no answers exist
    const sum = stationsArr.reduce((acc, s) => acc + calculateProgress(s), 0);
    return Math.round(sum / stationsArr.length);
  } catch (e) {
    return 0;
  }
};

export const canScheduleAppointment = (completedStations) => {
  return REQUIRED_STATIONS_FOR_APPOINTMENT.every(stationId => 
    completedStations.includes(stationId)
  );
};
