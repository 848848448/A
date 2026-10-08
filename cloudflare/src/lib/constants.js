// Categories of music people. key = stored value, label = display, icon = Material Symbol
export const CATEGORIES = [
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

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const BOOKING_STATUS = {
  pending:  { label: 'Awaiting reply', icon: 'schedule',     cls: 'is-pending' },
  accepted: { label: 'Confirmed',      icon: 'check_circle', cls: 'is-accepted' },
  declined: { label: 'Declined',       icon: 'cancel',       cls: 'is-declined' },
};
