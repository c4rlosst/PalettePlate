ALTER TABLE `recipe_ingredients` ADD `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD `section` varchar(80) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD `position` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD `item` varchar(200) NOT NULL;--> statement-breakpoint
CREATE INDEX `recipe_ingredients_recipe_idx` ON `recipe_ingredients` (`recipe_id`,`position`);--> statement-breakpoint
ALTER TABLE `recipe_ingredients` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `recipe_ingredients` MODIFY COLUMN `food_id` varchar(36);--> statement-breakpoint
ALTER TABLE `recipe_ingredients` MODIFY COLUMN `amount` varchar(100) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `recipes` ADD `instructions` text;
