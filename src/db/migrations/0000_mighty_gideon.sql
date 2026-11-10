CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(100) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`password` text,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_provider_idx` UNIQUE(`provider_id`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` varchar(36) NOT NULL,
	`post_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`meal_type` enum('breakfast','lunch','dinner','snack') NOT NULL,
	`eaten_at` timestamp(3) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entry_foods` (
	`entry_id` varchar(36) NOT NULL,
	`food_id` varchar(36) NOT NULL,
	`colour` enum('red','orange','yellow','green','blue-purple','white-brown') NOT NULL,
	`category` enum('fruit','vegetable','grain') NOT NULL,
	CONSTRAINT `entry_foods_entry_id_food_id_pk` PRIMARY KEY(`entry_id`,`food_id`)
);
--> statement-breakpoint
CREATE TABLE `entry_recipes` (
	`entry_id` varchar(36) NOT NULL,
	`recipe_id` varchar(36) NOT NULL,
	CONSTRAINT `entry_recipes_entry_id_recipe_id_pk` PRIMARY KEY(`entry_id`,`recipe_id`)
);
--> statement-breakpoint
CREATE TABLE `favourite_recipes` (
	`user_id` varchar(36) NOT NULL,
	`recipe_id` varchar(36) NOT NULL,
	CONSTRAINT `favourite_recipes_user_id_recipe_id_pk` PRIMARY KEY(`user_id`,`recipe_id`)
);
--> statement-breakpoint
CREATE TABLE `foods` (
	`id` varchar(36) NOT NULL,
	`filipino_name` varchar(150) NOT NULL,
	`english_name` varchar(150) NOT NULL,
	`colour` enum('red','orange','yellow','green','blue-purple','white-brown') NOT NULL,
	`category` enum('fruit','vegetable','grain') NOT NULL,
	`energy_kcal` decimal(9,2),
	`protein_g` decimal(9,2),
	`fibre_g` decimal(9,2),
	`source` text NOT NULL,
	`nutrition_missing` boolean NOT NULL DEFAULT true,
	`archived` boolean NOT NULL DEFAULT false,
	CONSTRAINT `foods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` varchar(36) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`post_id` varchar(36),
	`recipe_id` varchar(36),
	`path` varchar(512) NOT NULL,
	`mime_type` varchar(50) NOT NULL,
	`size` int NOT NULL,
	CONSTRAINT `images_id` PRIMARY KEY(`id`),
	CONSTRAINT `images_path_unique` UNIQUE(`path`),
	CONSTRAINT `image_size_positive` CHECK(`images`.`size` > 0)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`recipe_id` varchar(36),
	`content` text NOT NULL,
	`status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_food_preferences` (
	`user_id` varchar(36) NOT NULL,
	`food_id` varchar(36) NOT NULL,
	`preference` enum('liked','disliked') NOT NULL,
	CONSTRAINT `user_food_preferences_user_id_food_id_pk` PRIMARY KEY(`user_id`,`food_id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` varchar(36) NOT NULL,
	`key` varchar(255) NOT NULL,
	`count` int NOT NULL,
	`last_request` decimal(20,0) NOT NULL,
	CONSTRAINT `rate_limits_id` PRIMARY KEY(`id`),
	CONSTRAINT `rate_limits_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`post_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `reactions_post_id_user_id_pk` PRIMARY KEY(`post_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `recipe_ingredients` (
	`recipe_id` varchar(36) NOT NULL,
	`food_id` varchar(36) NOT NULL,
	`amount` varchar(100) NOT NULL,
	CONSTRAINT `recipe_ingredients_recipe_id_food_id_pk` PRIMARY KEY(`recipe_id`,`food_id`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`meal_type` enum('breakfast','lunch','dinner','snack') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`token` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	`ip_address` text,
	`user_agent` text,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(254) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`role` enum('user','moderator','admin') NOT NULL DEFAULT 'user',
	`region` varchar(100),
	`gender` varchar(50),
	`contact_number` varchar(30),
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entries` ADD CONSTRAINT `entries_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entry_foods` ADD CONSTRAINT `entry_foods_entry_id_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entry_foods` ADD CONSTRAINT `entry_foods_food_id_foods_id_fk` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entry_recipes` ADD CONSTRAINT `entry_recipes_entry_id_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `entry_recipes` ADD CONSTRAINT `entry_recipes_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favourite_recipes` ADD CONSTRAINT `favourite_recipes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favourite_recipes` ADD CONSTRAINT `favourite_recipes_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `images` ADD CONSTRAINT `images_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `images` ADD CONSTRAINT `images_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `images` ADD CONSTRAINT `images_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_food_preferences` ADD CONSTRAINT `user_food_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_food_preferences` ADD CONSTRAINT `user_food_preferences_food_id_foods_id_fk` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reactions` ADD CONSTRAINT `reactions_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reactions` ADD CONSTRAINT `reactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD CONSTRAINT `recipe_ingredients_recipe_id_recipes_id_fk` FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipe_ingredients` ADD CONSTRAINT `recipe_ingredients_food_id_foods_id_fk` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `entries_user_date_idx` ON `entries` (`user_id`,`eaten_at`);--> statement-breakpoint
CREATE INDEX `food_filipino_idx` ON `foods` (`filipino_name`);--> statement-breakpoint
CREATE INDEX `food_english_idx` ON `foods` (`english_name`);--> statement-breakpoint
CREATE INDEX `food_filter_idx` ON `foods` (`colour`,`category`);--> statement-breakpoint
CREATE INDEX `post_status_date_idx` ON `posts` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verifications` (`identifier`);