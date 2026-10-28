// SQLite schema (Drizzle). Sources of truth that can't be recreated: ledger_entry, transfer, checkin,
// presence_event, visit_confirmation, raw_payload (bodies kept 90 days). Daily metrics and workouts come from raw payloads.
import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

const now = () => new Date().toISOString();

export const device = sqliteTable('device', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  person: text('person', { enum: ['A', 'B'] }).notNull(),
  kind: text('kind', { enum: ['pwa', 'shortcut'] }).notNull(),
  label: text('label').notNull(),
  /** SHA-256 hex of the session secret (pwa) or bearer token (shortcut). */
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(now),
  lastSeenAt: text('last_seen_at'),
  revokedAt: text('revoked_at')
});

export const pairingCode = sqliteTable('pairing_code', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  person: text('person', { enum: ['A', 'B'] }).notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  usedAt: text('used_at')
});

export const rawPayload = sqliteTable(
  'raw_payload',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    person: text('person', { enum: ['A', 'B'] }).notNull(),
    source: text('source', { enum: ['shortcut'] }).notNull(),
    receivedAt: text('received_at').notNull().$defaultFn(now),
    bodyGz: text('body_gz').notNull(), // base64 gzip; emptied after RAW_BODY_KEEP_DAYS (jobs.ts)
    parseStatus: text('parse_status', { enum: ['ok', 'partial', 'error'] }).notNull(),
    parseError: text('parse_error')
  },
  (t) => [index('raw_person_received').on(t.person, t.receivedAt)]
);

export const dailyMetric = sqliteTable(
  'daily_metric',
  {
    person: text('person', { enum: ['A', 'B'] }).notNull(),
    localDate: text('local_date').notNull(),
    metric: text('metric', { enum: ['steps', 'exercise_min'] }).notNull(),
    value: real('value').notNull(),
    updatedAt: text('updated_at').notNull().$defaultFn(now)
  },
  (t) => [primaryKey({ columns: [t.person, t.localDate, t.metric] })]
);

export const workout = sqliteTable(
  'workout',
  {
    person: text('person', { enum: ['A', 'B'] }).notNull(),
    extId: text('ext_id').notNull(),
    localDate: text('local_date').notNull(),
    type: text('type').notNull(),
    startAt: text('start_at').notNull(),
    endAt: text('end_at').notNull(),
    durationMin: real('duration_min').notNull(),
    avgHr: real('avg_hr'),
    includesStrength: integer('includes_strength', { mode: 'boolean' }),
    updatedAt: text('updated_at').notNull().$defaultFn(now)
  },
  (t) => [primaryKey({ columns: [t.person, t.extId] }), index('workout_date').on(t.person, t.localDate)]
);

export const place = sqliteTable('place', {
  key: text('key').primaryKey(),
  person: text('person', { enum: ['A', 'B'] }).notNull(),
  name: text('name').notNull(),
  autoStrength: integer('auto_strength', { mode: 'boolean' }).notNull().default(false)
});

export const presenceEvent = sqliteTable(
  'presence_event',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    person: text('person', { enum: ['A', 'B'] }).notNull(),
    placeKey: text('place_key').notNull(),
    event: text('event', { enum: ['arrive', 'leave'] }).notNull(),
    at: text('at').notNull()
  },
  (t) => [index('presence_person_at').on(t.person, t.at)]
);

/** Answer to 「筋トレとして記録する?」 for a visit, keyed by its arrive event. */
export const visitConfirmation = sqliteTable('visit_confirmation', {
  arriveEventId: integer('arrive_event_id').primaryKey(),
  confirmed: integer('confirmed', { mode: 'boolean' }).notNull(),
  answeredAt: text('answered_at').notNull().$defaultFn(now)
});

export const checkin = sqliteTable(
  'checkin',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    person: text('person', { enum: ['A', 'B'] }).notNull(),
    localDate: text('local_date').notNull(),
    habitKey: text('habit_key').notNull(),
    createdAt: text('created_at').notNull().$defaultFn(now)
  },
  (t) => [uniqueIndex('checkin_unique').on(t.person, t.localDate, t.habitKey)]
);

export const visibilityPref = sqliteTable(
  'visibility_pref',
  {
    person: text('person', { enum: ['A', 'B'] }).notNull(),
    metric: text('metric').notNull(),
    shareRaw: integer('share_raw', { mode: 'boolean' }).notNull().default(false)
  },
  (t) => [primaryKey({ columns: [t.person, t.metric] })]
);

export const personPref = sqliteTable('person_pref', {
  person: text('person', { enum: ['A', 'B'] }).primaryKey(),
  locale: text('locale', { enum: ['ja', 'en'] }).notNull().default('ja'),
  villagerName: text('villager_name'),
  /** Animal Crossing villager key from the roster, e.g. 'goldie', 'raymond'. */
  villager: text('villager')
});

export const ledgerEntry = sqliteTable(
  'ledger_entry',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bucket: text('bucket', { enum: ['jar', 'purse'] }).notNull(),
    /** Jar layer: 'A' | 'B' | 'team'; null for the purse. */
    layer: text('layer', { enum: ['A', 'B', 'team'] }),
    person: text('person', { enum: ['A', 'B'] }),
    amountYen: integer('amount_yen').notNull(),
    kind: text('kind', { enum: ['earn', 'topup', 'spend', 'adjust'] }).notNull(),
    weekKey: text('week_key'),
    /** e.g. `earn:jar:A:2026-11-02`, `topup:jar:A:2026-11-02:4350`. */
    idemKey: text('idem_key').notNull().unique(),
    memo: text('memo'),
    createdAt: text('created_at').notNull().$defaultFn(now)
  },
  (t) => [index('ledger_week').on(t.weekKey)]
);

export const purseSpend = sqliteTable('purse_spend', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  amountYen: integer('amount_yen').notNull(),
  requestedBy: text('requested_by', { enum: ['A', 'B'] }).notNull(),
  approvedBy: text('approved_by', { enum: ['A', 'B'] }),
  ledgerEntryId: integer('ledger_entry_id'),
  createdAt: text('created_at').notNull().$defaultFn(now)
});

export const transfer = sqliteTable('transfer', {
  month: text('month').primaryKey(), // YYYY-MM of earnings moved
  amountYen: integer('amount_yen').notNull(),
  markedBy: text('marked_by', { enum: ['A', 'B'] }).notNull(),
  doneAt: text('done_at').notNull().$defaultFn(now)
});

export const weekLock = sqliteTable('week_lock', {
  weekKey: text('week_key').primaryKey(),
  provisionalAt: text('provisional_at'),
  lockedAt: text('locked_at')
});

export const highFive = sqliteTable('high_five', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  from: text('from_person', { enum: ['A', 'B'] }).notNull(),
  at: text('at').notNull().$defaultFn(now)
});

export const pushSubscription = sqliteTable('push_subscription', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  person: text('person', { enum: ['A', 'B'] }).notNull(),
  deviceId: integer('device_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  keysJson: text('keys_json').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(now)
});

export const notificationLog = sqliteTable(
  'notification_log',
  {
    person: text('person', { enum: ['A', 'B'] }).notNull(),
    localDate: text('local_date').notNull(),
    kind: text('kind').notNull(),
    sentAt: text('sent_at').notNull().$defaultFn(now)
  },
  (t) => [primaryKey({ columns: [t.person, t.localDate] })]
);

/** Each person's tap on 「壺に入れる」 for a harvested week; both rows → harvest closes. */
export const harvestConfirm = sqliteTable(
  'harvest_confirm',
  {
    weekKey: text('week_key').notNull(),
    person: text('person', { enum: ['A', 'B'] }).notNull(),
    at: text('at').notNull().$defaultFn(now)
  },
  (t) => [primaryKey({ columns: [t.weekKey, t.person] })]
);
