'use strict';

// All categories of music people. key = stored value, label = display, icon = Material Symbol
const CATEGORIES = [
  { key: 'singer',     label: 'Singer',             icon: 'mic' },
  { key: 'musician',   label: 'Musician / Player',  icon: 'music_note' },
  { key: 'band',       label: 'Band',               icon: 'groups' },
  { key: 'chazan',     label: 'Cantor',             icon: 'volume_up' },
  { key: 'badchen',    label: 'Entertainer',        icon: 'theater_comedy' },
  { key: 'dj',         label: 'DJ',                 icon: 'graphic_eq' },
  { key: 'keyboard',   label: 'Keyboard',           icon: 'piano' },
  { key: 'violin',     label: 'Violin',             icon: 'music_note' },
  { key: 'guitar',     label: 'Guitar',             icon: 'music_note' },
  { key: 'drums',      label: 'Drums',              icon: 'album' },
  { key: 'trumpet',    label: 'Trumpet / Horn',     icon: 'campaign' },
  { key: 'choir',      label: 'Choir',              icon: 'diversity_3' },
  { key: 'conductor',  label: 'Conductor',          icon: 'podium' },
  { key: 'producer',   label: 'Producer',           icon: 'tune' },
  { key: 'arranger',   label: 'Arranger',           icon: 'queue_music' },
  { key: 'mc',         label: 'MC / Host',          icon: 'record_voice_over' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

const STATUS_LABELS = {
  available:   { label: 'Available',   icon: 'event_available', cls: 'is-free' },
  unavailable: { label: 'Unavailable', icon: 'event_busy',      cls: 'is-busy' },
  booked:      { label: 'Booked',      icon: 'event',           cls: 'is-booked' },
};

const BOOKING_STATUS = {
  pending:  { label: 'Awaiting reply', icon: 'schedule',     cls: 'is-pending' },
  accepted: { label: 'Confirmed',      icon: 'check_circle', cls: 'is-accepted' },
  declined: { label: 'Declined',       icon: 'cancel',       cls: 'is-declined' },
};

module.exports = { CATEGORIES, CATEGORY_MAP, STATUS_LABELS, BOOKING_STATUS };
