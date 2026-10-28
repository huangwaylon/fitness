CREATE TABLE `harvest_confirm` (
	`week_key` text NOT NULL,
	`person` text NOT NULL,
	`at` text NOT NULL,
	PRIMARY KEY(`week_key`, `person`)
);
