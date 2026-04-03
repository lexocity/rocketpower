CREATE TABLE `notification_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`userId` int NOT NULL,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`userId` int NOT NULL,
	`delivered` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_recipients_id` PRIMARY KEY(`id`)
);
