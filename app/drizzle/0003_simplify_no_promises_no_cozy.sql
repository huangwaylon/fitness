-- Keep a roster id that was stored in the old species pref (ADR 0014). Generic species/colour looks fall back to the default villager.
UPDATE `person_pref` SET `villager` = `villager_species` WHERE `villager` IS NULL AND `villager_species` IS NOT NULL;--> statement-breakpoint
DROP TABLE `cozy_day`;--> statement-breakpoint
DROP TABLE `week_promise`;--> statement-breakpoint
ALTER TABLE `person_pref` DROP COLUMN `villager_species`;--> statement-breakpoint
ALTER TABLE `person_pref` DROP COLUMN `villager_color`;