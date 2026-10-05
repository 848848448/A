'use strict';

// All categories of music people. key = stored value, label = Yiddish display, icon = Material Symbol
const CATEGORIES = [
  { key: 'singer',     label: 'זינגער',          icon: 'mic' },
  { key: 'musician',   label: 'מוזיקאַנט / שפּילער', icon: 'music_note' },
  { key: 'band',       label: 'קאַפּעליע / באַנד',   icon: 'groups' },
  { key: 'chazan',     label: 'חזן',              icon: 'volume_up' },
  { key: 'badchen',    label: 'בדחן',             icon: 'theater_comedy' },
  { key: 'dj',         label: 'די-דזשעי',          icon: 'graphic_eq' },
  { key: 'keyboard',   label: 'קלאַוויר / קיבאָרד',  icon: 'piano' },
  { key: 'violin',     label: 'פֿידל',             icon: 'music_note' },
  { key: 'guitar',     label: 'גיטאַר',            icon: 'music_note' },
  { key: 'drums',      label: 'דראַמס / פּויק',      icon: 'album' },
  { key: 'trumpet',    label: 'טראָמפּעט / בלאָזער',  icon: 'campaign' },
  { key: 'choir',      label: 'כאָר',              icon: 'diversity_3' },
  { key: 'conductor',  label: 'דיריגענט',         icon: 'podium' },
  { key: 'producer',   label: 'פּראָדוצירער',       icon: 'tune' },
  { key: 'arranger',   label: 'אַראַנדזשער',        icon: 'queue_music' },
  { key: 'mc',         label: 'צערעמאָניע-מײַסטער',  icon: 'record_voice_over' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const STATUS_LABELS = {
  available:   { label: 'פֿריי / עוועילעבל', icon: 'event_available', cls: 'is-free' },
  unavailable: { label: 'פֿאַרנומען',         icon: 'event_busy',      cls: 'is-busy' },
  booked:      { label: 'פֿאַרבאַקט',          icon: 'event',          cls: 'is-booked' },
};

const BOOKING_STATUS = {
  pending:  { label: 'וואַרט אויף ענטפֿער', icon: 'schedule',     cls: 'is-pending' },
  accepted: { label: 'באַשטעטיקט',          icon: 'check_circle', cls: 'is-accepted' },
  declined: { label: 'אָפּגעזאָגט',          icon: 'cancel',       cls: 'is-declined' },
};

module.exports = { CATEGORIES, CATEGORY_MAP, STATUS_LABELS, BOOKING_STATUS };
