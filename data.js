// Static content for MigraineEase: icons, default symptoms, triggers, medications and info texts.
'use strict';

// Stroke icons, 24x24 viewBox. Entries starting with "F:" are filled instead of stroked.
const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  plus: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
  minus: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  heartZap: 'F:<path fill-rule="evenodd" d="M12 21.2l-8.8-8.8a5.5 5.5 0 0 1 7.8-7.8l1 1 1-1a5.5 5.5 0 0 1 7.8 7.8zM13 8l-3.5 4.6h2.4L11 16l3.5-4.6h-2.4z"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>',
  x: '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pencil: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  thumbUp: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
  thumbDown: '<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>',
  sparkles: '<path d="M11 3l2 5.5L18.5 10 13 12l-2 5.500L9 12l-5.500-2L9 8.500zM19 15l.8 2.200 2.200.800-2.200.800L19 21l-.800-2.200-2.200-.800 2.200-.800z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.350-4.350"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.700V16h8v-1.300A7 7 0 0 0 12 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  arrowUp: '<circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 16V8"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  upload: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  cloud: '<path d="M18 10h-1.260A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  alert: '<path d="M10.290 3.860L1.820 18a2 2 0 0 0 1.710 3h16.940a2 2 0 0 0 1.710-3L13.710 3.860a2 2 0 0 0-3.420 0zM12 9v4M12 17h.01"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.940 17.940A10.070 10.070 0 0 1 12 20c-7 0-11-8-11-8a18.450 18.450 0 0 1 5.060-5.940M9.900 4.240A9.120 9.120 0 0 1 12 4c7 0 11 8 11 8a18.500 18.500 0 0 1-2.160 3.190m-6.720-1.070a3 3 0 1 1-4.240-4.240M1 1l22 22"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.220 4.220l1.420 1.420M18.360 18.360l1.420 1.420M1 12h2M21 12h2M4.220 19.780l1.420-1.420M18.360 5.640l1.420-1.420"/>',
  moon: '<path d="M21 12.790A9 9 0 1 1 11.210 3 7 7 0 0 0 21 12.790z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  wind: '<path d="M9.590 4.590A2 2 0 1 1 11 8H2m10.590 11.410A2 2 0 1 0 14 16H2m15.730-8.270A2.500 2.500 0 1 1 19.500 12H2"/>',
  frown: '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.500-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.500 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  battery: '<rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 13v-2M5 10v4"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  message: '<path d="M21 11.500a8.380 8.380 0 0 1-.900 3.800 8.500 8.500 0 0 1-7.600 4.700 8.380 8.380 0 0 1-3.800-.900L3 21l1.900-5.700a8.380 8.380 0 0 1-.900-3.800 8.500 8.500 0 0 1 4.700-7.600 8.380 8.380 0 0 1 3.800-.900h.500a8.480 8.480 0 0 1 8 8v.500z"/>',
  coffee: '<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>',
  droplet: '<path d="M12 2.690l5.660 5.660a8 8 0 1 1-11.310 0z"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.510 9a9 9 0 0 1 14.850-3.360L23 10M1 14l4.640 4.360A9 9 0 0 0 20.490 15"/>',
  star: '<path d="M12 2l3.090 6.260L22 9.270l-5 4.870 1.180 6.880L12 17.770l-6.180 3.250L7 14.140 2 9.270l6.910-1.010L12 2z"/>',
  sunrise: '<path d="M17 18a5 5 0 0 0-10 0M12 2v7M4.220 10.220l1.420 1.420M1 18h2M21 18h2M18.360 11.640l1.420-1.420M23 22H1M8 6l4-4 4 4"/>',
  sunset: '<path d="M17 18a5 5 0 0 0-10 0M12 9V2M4.220 10.220l1.420 1.420M1 18h2M21 18h2M18.360 11.640l1.420-1.420M23 22H1M16 5l-4 4-4-4"/>',
  volume: '<path d="M11 5L6 9H2v6h4l5 4V5zM19.070 4.930a10 10 0 0 1 0 14.140M15.540 8.460a5 5 0 0 1 0 7.070"/>',
  circle: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.500" fill="currentColor" stroke="none"/>',
  half: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/>',
  dashed: '<circle cx="12" cy="12" r="9" stroke-dasharray="3.500 3.500"/>',
  pill: '<rect x="2" y="8" width="20" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M9.200 9.200l5.600 5.600"/>',
  snow: '<path d="M12 2v20M3.340 7l17.320 10M3.340 17L20.660 7M9.500 3.500L12 6l2.500-2.500M9.500 20.500L12 18l2.500 2.500"/>',
  bed: '<path d="M2 19V6M2 15h20v4M22 15v-2a3 3 0 0 0-3-3h-8v5"/><circle cx="6.500" cy="11.500" r="1.500"/>',
  food: '<path d="M5 2v7a3 3 0 0 0 6 0V2M8 2v20M19 22V2c-2.500 2-4 5-4 9h4"/>',
  flame: '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-3 2-4 5-4 7-1-1-2-2-2-4-2 2-4 4.500-4 7a7 7 0 0 0 7 7z"/>',
  brain: '<path d="M12 5.500V19M9.500 3A3.500 3.500 0 0 0 6 6.500 3.500 3.500 0 0 0 4 12a3.500 3.500 0 0 0 2 5.500A3.500 3.500 0 0 0 12 19M14.500 3A3.500 3.500 0 0 1 18 6.500 3.500 3.500 0 0 1 20 12a3.500 3.500 0 0 1-2 5.500A3.500 3.500 0 0 1 12 19M9.500 3A2.500 2.500 0 0 1 12 5.500 2.500 2.500 0 0 1 14.500 3"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="M7 21l3-6 1-5-3 1.500V15M11 10l2.500 1.500L16 13M10 15l3 2.500V22"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>'
};

const CATEGORIES = [
  { id: 'pain', name: 'Head Pain', color: 'var(--cat-pain)', phase: 'headache' },
  { id: 'sensory', name: 'Sensory', color: 'var(--cat-sensory)', phase: 'headache' },
  { id: 'gi', name: 'Gastrointestinal', color: 'var(--cat-gi)', phase: 'headache' },
  { id: 'neuro', name: 'Neurological (Aura)', color: 'var(--cat-neuro)', phase: 'aura' },
  { id: 'cognitive', name: 'Cognitive & General', color: 'var(--cat-cognitive)', phase: 'headache' },
  { id: 'prodrome', name: 'Early Warning', color: 'var(--cat-prodrome)', phase: 'prodrome' },
  { id: 'postdrome', name: 'After Attack', color: 'var(--cat-postdrome)', phase: 'postdrome' }
];

const PHASES = [
  { id: 'prodrome', name: 'Prodrome', icon: 'sunrise', color: 'var(--cat-prodrome)' },
  { id: 'aura', name: 'Aura', icon: 'sparkles', color: 'var(--cat-neuro)' },
  { id: 'headache', name: 'Headache', icon: 'heartZap', color: 'var(--cat-pain)' },
  { id: 'postdrome', name: 'Postdrome', icon: 'sunset', color: 'var(--cat-postdrome)' }
];

const sym = (name, icon, cat) => ({ id: 's-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, icon, cat });

const DEFAULT_SYMPTOMS = [
  sym('Forehead pain', 'brain', 'pain'), sym('Above eyes', 'eye', 'pain'),
  sym('One-sided pain', 'half', 'pain'), sym('Both sides', 'circle', 'pain'),
  sym('Throbbing pain', 'activity', 'pain'), sym('Back of head', 'brain', 'pain'),
  sym('Temple pain', 'zap', 'pain'), sym('Worsens with activity', 'walk', 'pain'),
  sym('Light sensitivity', 'sun', 'sensory'), sym('Sound sensitivity', 'volume', 'sensory'),
  sym('Smell sensitivity', 'wind', 'sensory'),
  sym('Nausea', 'frown', 'gi'), sym('Vomiting', 'arrowUp', 'gi'), sym('Loss of appetite', 'food', 'gi'),
  sym('Visual aura', 'eye', 'neuro'), sym('Flashing lights', 'sparkles', 'neuro'),
  sym('Blind spots', 'dashed', 'neuro'), sym('Tingling/numbness', 'zap', 'neuro'),
  sym('Speech difficulty', 'message', 'neuro'), sym('Vision loss', 'eyeOff', 'neuro'),
  sym('Brain fog', 'cloud', 'cognitive'), sym("Can't concentrate", 'target', 'cognitive'),
  sym('Fatigue', 'battery', 'cognitive'), sym('Dizziness', 'refresh', 'cognitive'),
  sym('Mood changes', 'smile', 'prodrome'), sym('Food cravings', 'food', 'prodrome'),
  sym('Neck stiffness', 'user', 'prodrome'), sym('Frequent yawning', 'moon', 'prodrome'),
  sym('Exhaustion', 'battery', 'postdrome'), sym('Lingering headache', 'brain', 'postdrome'),
  sym('Trouble focusing', 'target', 'postdrome')
];

const CUSTOM_ICON_OPTIONS = ['star', 'zap', 'flame', 'droplet', 'eye', 'volume', 'heart', 'brain', 'moon', 'activity'];

const TRIGGER_CATEGORIES = ['Stress', 'Sleep', 'Food', 'Hormones', 'Weather', 'Environment', 'Physical', 'Other'];

const DEFAULT_TRIGGERS = [
  ['Work stress', 'Stress'], ['Emotional stress', 'Stress'],
  ['Poor sleep', 'Sleep'], ['Oversleeping', 'Sleep'],
  ['Skipped meal', 'Food'], ['Caffeine', 'Food'], ['Alcohol', 'Food'], ['Chocolate', 'Food'],
  ['Aged cheese', 'Food'], ['Dehydration', 'Food'],
  ['Weather change', 'Weather'],
  ['Bright lights', 'Environment'], ['Strong smells', 'Environment'], ['Screen time', 'Environment'],
  ['Menstrual', 'Hormones'],
  ['Intense exercise', 'Physical'], ['Neck tension', 'Physical']
].map(([name, category]) => ({ name, category }));

// General, widely recommended first steps. Shown without statistics: this app has no shared community data.
const COMMON_RELIEF = ['Dark quiet room', 'Cold compress', 'Sleep', 'Hydrate'];

const COMMON_MEDS = [
  ['Sumatriptan', '50mg'], ['Ibuprofen', '400mg'], ['Paracetamol', '500mg'], ['Aspirin', '500mg'],
  ['Naproxen', '250mg'], ['Rizatriptan', '10mg'], ['Topiramate', '25mg'], ['Amitriptyline', '10mg'],
  ['Propranolol', '40mg'], ['Magnesium', '400mg']
].map(([name, dosage]) => ({ name, dosage }));

const TRIGGER_INFO = [
  ['Work stress', 'Stress elevates cortisol, which can trigger the release of neuropeptides that dilate blood vessels and activate pain pathways in the trigeminal nerve — the main pain highway for migraines.', 'Try 10-minute box breathing breaks during work. Even micro-relaxation can lower cortisol spikes.'],
  ['Emotional stress', "Emotional triggers cause the amygdala to fire, releasing norepinephrine. This can cause inflammation in the brain's meninges and activate sensitized pain receptors.", 'Journaling or talking through emotions can blunt the neurological stress response.'],
  ['Poor sleep', 'Sleep deprivation lowers serotonin and dopamine, both of which regulate pain sensitivity. Even 1 hour less than usual can trigger an attack in sensitive individuals.', 'Aim for the same bedtime every night — consistent sleep timing is more protective than total hours.'],
  ['Oversleeping', "Sleeping too long alters serotonin levels just as deprivation does. The brain's pain threshold drops when sleep cycles deviate significantly from normal.", 'Even on weekends, try to wake within 1 hour of your weekday time.'],
  ['Skipped meal', 'Going more than 4-5 hours without eating drops blood glucose. The hypothalamus detects this and releases neuropeptides that can trigger the migraine cascade.', 'Keep a small protein-rich snack (nuts, cheese) on hand to bridge gaps between meals.'],
  ['Caffeine', 'Caffeine constricts blood vessels. When you miss your regular dose, vessels dilate suddenly causing a classic withdrawal migraine. Too much caffeine can also overstimulate pain pathways.', 'Keep caffeine intake consistent — same time, same amount each day.'],
  ['Alcohol', 'Alcohol triggers histamine release and dehydration, both of which are strong migraine catalysts. Red wine contains tyramine and tannins that directly activate trigeminal pathways.', 'If you drink, stick to clear spirits with soda water and hydrate 1:1 with water per drink.'],
  ['Dehydration', 'Even mild dehydration (1-2%) causes the brain to temporarily shrink, pulling on the meninges (protective membranes). This tension directly activates pain receptors.', 'Drink 250ml water first thing in the morning and set hourly reminders.'],
  ['Weather change', 'Barometric pressure drops cause pressure changes in the sinuses and brain fluid. This stimulates mechanosensitive receptors that activate migraine pain pathways.', 'Check pressure forecasts. Ask your doctor whether pre-dosing on high-risk days makes sense for you.'],
  ['Bright lights', 'The retina has a direct nerve pathway to the trigeminal nucleus — the migraine control center. Bright or flickering light (especially blue/white LED) overstimulates this pathway.', 'Wear FL-41 tinted glasses in bright environments. Warm-toned lighting at home is protective.'],
  ['Screen time', 'Prolonged screen use causes eye muscle strain, reduced blinking (dry eyes), and blue-light stimulation of the photosensitive retinal ganglion cells — all of which can initiate migraine.', '20-20-20 rule: every 20 min, look 20 feet away for 20 seconds. Use Night Shift mode.'],
  ['Menstrual', 'The drop in estrogen before menstruation lowers serotonin levels. Serotonin is a key regulator of pain. This hormonal window is the most common migraine trigger in women.', 'Track your cycle alongside migraines. Preventive therapy during the high-risk window can be highly effective.'],
  ['Neck tension', 'The suboccipital muscles (base of skull) share nerve pathways with the trigeminal nerve. Tension here directly feeds into migraine pain centers via the trigeminocervical complex.', 'Daily neck stretches and avoiding chin-forward posture can significantly reduce this trigger.']
].map(([name, body, tip]) => ({ name, body, tip }));

const SYMPTOM_INFO = [
  ['Forehead pain', 'Pain in the forehead typically originates from the supraorbital and supratrochlear branches of the trigeminal nerve. During migraine, these nerves become sensitized and inflamed.', 'Cold compress on the forehead combined with keeping still can help. Try applying peppermint oil diluted in a carrier oil to the temples.'],
  ['One-sided pain', "Unilateral pain is the classic migraine hallmark. It's caused by dilation of meningeal blood vessels on one side, releasing inflammatory CGRP protein that activates pain receptors.", 'Lying on the non-painful side in a dark room can help. Triptans work by constricting these dilated vessels.'],
  ['Throbbing pain', 'Throbbing follows the heartbeat because the pain pathway is activated by blood pressure pulses in the sensitized meningeal vessels. Movement or exertion worsens it for this reason.', 'Stay very still. Even slow breathing can reduce pulse-driven pain. Cold compresses reduce local blood flow.'],
  ['Light sensitivity', "Photophobia occurs because the retina's intrinsically photosensitive cells (ipRGCs) are directly wired to the trigeminal pain center. During migraine, this connection is hypersensitized.", 'Complete darkness is best. If unavailable, rose/FL-41 tinted lenses block the 480nm wavelength that most activates this pathway.'],
  ['Sound sensitivity', "The auditory cortex becomes hyperactivated during migraine due to reduced cortical inhibition. Sounds feel amplified and painful because the usual 'volume control' in the brain is turned off.", 'Foam earplugs or noise-canceling headphones with silence. Avoid music — even calming music increases auditory processing load.'],
  ['Nausea', 'Nausea occurs because the hypothalamus (migraine control center) activates the vomiting center (area postrema) and slows gastric emptying. This is why oral medications work slower during attacks.', 'Ginger (tea, chews, or capsules) works on serotonin receptors in the gut. Anti-nausea medications that dissolve under the tongue bypass slow gastric emptying.'],
  ['Visual aura', 'Aura is caused by a wave of electrical silence spreading across the visual cortex at ~3mm/minute — called cortical spreading depression. Neurons depolarize and then temporarily go quiet.', "Aura typically lasts 20-60 minutes and resolves. Use this as a warning: acute medication is usually most effective when taken early, as your doctor has advised."],
  ['Brain fog', "Cognitive impairment during migraine ('migraine fog') is caused by widespread cortical inhibition. Reduced blood flow to the prefrontal cortex impairs working memory and processing speed.", "Don't fight it — attempting cognitive tasks increases cortical demand and pain. Rest is the most effective strategy."],
  ['Dizziness', 'Vestibular migraine involves the same neural pathways as pain migraine but affecting the vestibular nucleus (balance center). The inner ear and brainstem both receive sensitizing signals.', 'Lie flat with eyes closed. Avoid head movement. Ask your doctor about vestibular suppressants if this happens often.'],
  ['Neck stiffness', "Neck stiffness in the prodrome phase comes from the trigeminocervical complex — the same brainstem region where neck and head pain signals converge. It's an early warning that the migraine cascade has begun.", 'Gentle neck stretches and heat on the base of the skull during the prodrome phase may delay or reduce the incoming attack.'],
  ['Fatigue', 'Extreme fatigue during and after migraine reflects the enormous metabolic cost of a migraine attack. The brain consumes enormous energy during the inflammatory cascade, leaving neurons depleted.', "Sleep is genuinely therapeutic — it helps restore neuronal energy and serotonin levels. Don't fight the urge to sleep."]
].map(([name, body, relief]) => ({ name, body, relief }));

const STARTER_TIPS = [
  { id: 'tip-1', symptoms: ['Head Pain', 'Aura'], content: 'Peppermint oil on temples + cold compress on neck worked amazingly for my aura migraines.', tags: ['natural', 'aura'] },
  { id: 'tip-2', symptoms: ['Sensitivity'], content: 'Blue-light blocking glasses during prodrome phase have reduced my attack intensity by half.', tags: ['prevention', 'sensitivity'] },
  { id: 'tip-3', symptoms: ['Pain'], content: 'Magnesium glycinate daily (400mg) has been a game changer. Went from 8 to 3 migraines per month.', tags: ['supplement', 'prevention'] },
  { id: 'tip-4', symptoms: ['Nausea'], content: 'Ginger tea at the first sign of nausea helps me avoid full-blown attacks about 60% of the time.', tags: ['natural', 'nausea'] },
  { id: 'tip-5', symptoms: ['Aura'], content: 'When aura starts I immediately go to a dark room, put on brown noise, and take my triptan. 20 min = much less pain.', tags: ['aura'] }
];

const TIP_FILTERS = ['All', 'Saved', 'Mine', 'Pain', 'Nausea', 'Aura', 'Sensitivity', 'Prevention', 'Natural'];
const TIP_SYMPTOMS = ['Pain', 'Nausea', 'Aura', 'Sensitivity', 'Dizziness', 'Fatigue'];
const TIP_TAGS = ['natural', 'prevention', 'supplement', 'aura', 'nausea', 'routine'];

const LIFESTYLE = [
  { title: 'Sleep', icon: 'moon', subtitle: "Sleep is one of the most common migraine triggers. Let's understand your patterns.", fields: [
    { key: 'sleepHours', title: 'Average sleep hours', type: 'stepper', min: 4, max: 12, unit: 'h' },
    { key: 'sleepConsistency', title: 'Sleep consistency', options: ['Consistent', 'Varies slightly', 'Very irregular'] },
    { key: 'sleepQuality', title: 'Sleep quality', options: ['Good', 'Fair', 'Poor'] } ] },
  { title: 'Nutrition', icon: 'food', subtitle: 'Diet and hydration directly impact migraine frequency.', fields: [
    { key: 'diet', title: 'Diet style', options: ['Balanced', 'Vegetarian', 'Vegan', 'Irregular'] },
    { key: 'caffeine', title: 'Daily caffeine', options: ['None', '1 cup', '2-3 cups', '4+ cups'] },
    { key: 'waterIntake', title: 'Water intake', options: ['<1L', '1-2L', '2-3L', '3L+'] },
    { key: 'skipMeals', title: 'Skip meals', options: ['Never', 'Occasionally', 'Often'] } ] },
  { title: 'Stress', icon: 'brain', subtitle: 'Stress is one of the most common migraine triggers.', fields: [
    { key: 'stressLevel', title: 'Stress level', options: ['Low', 'Moderate', 'High', 'Very High'] },
    { key: 'jobType', title: 'Work type', options: ['Office', 'Remote', 'Physical', 'Student', 'Other'] },
    { key: 'relaxationPractice', title: 'Relaxation practice', options: ['None', 'Meditation', 'Yoga', 'Exercise', 'Other'] } ] },
  { title: 'Movement', icon: 'walk', subtitle: 'Exercise can both prevent and trigger migraines.', fields: [
    { key: 'exerciseFrequency', title: 'Exercise frequency', options: ['Never', '1-2x/week', '3-4x/week', 'Daily'] },
    { key: 'exerciseType', title: 'Exercise type', options: ['None', 'Cardio', 'Strength', 'Yoga', 'Mixed'] },
    { key: 'screenTime', title: 'Screen time', options: ['<2h', '2-6h', '6-10h', '10h+'] } ] }
];
