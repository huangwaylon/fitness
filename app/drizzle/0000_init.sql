CREATE TABLE `checkin` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person` text NOT NULL,
	`local_date` text NOT NULL,
	`habit_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkin_unique` ON `checkin` (`person`,`local_date`,`habit_key`);--> statement-breakpoint
CREATE TABLE `cozy_day` (
	`person` text NOT NULL,
	`local_date` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`person`, `local_date`)
);
--> statement-breakpoint
CREATE TABLE `daily_metric` (
	`person` text NOT NULL,
	`local_date` text NOT NULL,
	`metric` text NOT NULL,
	`value` real NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`person`, `local_date`, `metric`)
);
--> statement-breakpoint
CREATE TABLE `device` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text,
	`revoked_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_token_hash_unique` ON `device` (`token_hash`);--> statement-breakpoint
CREATE TABLE `high_five` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_person` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ledger_entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bucket` text NOT NULL,
	`layer` text,
	`person` text,
	`amount_yen` integer NOT NULL,
	`kind` text NOT NULL,
	`week_key` text,
	`idem_key` text NOT NULL,
	`memo` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_entry_idem_key_unique` ON `ledger_entry` (`idem_key`);--> statement-breakpoint
CREATE INDEX `ledger_week` ON `ledger_entry` (`week_key`);--> statement-breakpoint
CREATE TABLE `notification_log` (
	`person` text NOT NULL,
	`local_date` text NOT NULL,
	`kind` text NOT NULL,
	`sent_at` text NOT NULL,
	PRIMARY KEY(`person`, `local_date`)
);
--> statement-breakpoint
CREATE TABLE `pairing_code` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`used_at` text
);
--> statement-breakpoint
CREATE TABLE `person_pref` (
	`person` text PRIMARY KEY NOT NULL,
	`locale` text DEFAULT 'ja' NOT NULL,
	`villager_name` text,
	`villager_species` text,
	`villager_color` text
);
--> statement-breakpoint
CREATE TABLE `place` (
	`key` text PRIMARY KEY NOT NULL,
	`person` text NOT NULL,
	`name` text NOT NULL,
	`auto_strength` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `presence_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person` text NOT NULL,
	`place_key` text NOT NULL,
	`event` text NOT NULL,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `presence_person_at` ON `presence_event` (`person`,`at`);--> statement-breakpoint
CREATE TABLE `purse_spend` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`amount_yen` integer NOT NULL,
	`requested_by` text NOT NULL,
	`approved_by` text,
	`ledger_entry_id` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `push_subscription` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person` text NOT NULL,
	`device_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`keys_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscription_endpoint_unique` ON `push_subscription` (`endpoint`);--> statement-breakpoint
CREATE TABLE `raw_payload` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`person` text NOT NULL,
	`source` text NOT NULL,
	`received_at` text NOT NULL,
	`body_gz` text NOT NULL,
	`parse_status` text NOT NULL,
	`parse_error` text
);
--> statement-breakpoint
CREATE TABLE `transfer` (
	`month` text PRIMARY KEY NOT NULL,
	`amount_yen` integer NOT NULL,
	`marked_by` text NOT NULL,
	`done_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visibility_pref` (
	`person` text NOT NULL,
	`metric` text NOT NULL,
	`share_raw` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`person`, `metric`)
);
--> statement-breakpoint
CREATE TABLE `visit_confirmation` (
	`arrive_event_id` integer PRIMARY KEY NOT NULL,
	`confirmed` integer NOT NULL,
	`answered_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `week_lock` (
	`week_key` text PRIMARY KEY NOT NULL,
	`provisional_at` text,
	`locked_at` text
);
--> statement-breakpoint
CREATE TABLE `week_promise` (
	`person` text NOT NULL,
	`week_key` text NOT NULL,
	`days_mask` integer NOT NULL,
	`kind` text NOT NULL,
	`note` text,
	`cheered_at` text,
	`blocker` text,
	`created_at` text NOT NULL,
	PRIMARY KEY(`person`, `week_key`)
);
--> statement-breakpoint
CREATE TABLE `workout` (
	`person` text NOT NULL,
	`ext_id` text NOT NULL,
	`local_date` text NOT NULL,
	`type` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`duration_min` real NOT NULL,
	`avg_hr` real,
	`includes_strength` integer,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`person`, `ext_id`)
);
--> statement-breakpoint
CREATE INDEX `workout_date` ON `workout` (`person`,`local_date`);