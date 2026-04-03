CREATE TABLE `absences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coverageDate` varchar(10) NOT NULL,
	`staffName` varchar(128) NOT NULL,
	`timeRange` enum('all_day','morning','afternoon','custom') NOT NULL DEFAULT 'all_day',
	`customTimeStart` varchar(16),
	`customTimeEnd` varchar(16),
	`subName` varchar(128),
	`subStatus` enum('assigned','no_sub','new_sub','split') NOT NULL DEFAULT 'assigned',
	`isOAM` boolean NOT NULL DEFAULT false,
	`absenceType` enum('sick','personal','educational','other','unknown') NOT NULL DEFAULT 'unknown',
	`employeeNumber` varchar(32),
	`subNumber` varchar(32),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `absences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coverage_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coverageDate` varchar(10) NOT NULL,
	`coveringStaffName` varchar(128) NOT NULL,
	`coveringFor` varchar(128) NOT NULL,
	`location` varchar(256),
	`coverageReason` enum('subbing','iep','absent','class_coverage','other') NOT NULL DEFAULT 'subbing',
	`timeSlot` enum('morning_duty','lunch_duty','afternoon_duty','custom','all_day') NOT NULL DEFAULT 'custom',
	`customTimeStart` varchar(16),
	`customTimeEnd` varchar(16),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coverage_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sentBy` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`recipientType` enum('all','specific') NOT NULL DEFAULT 'all',
	`recipientIds` text,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `displayName` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `expoPushToken` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `notificationsEnabled` boolean DEFAULT true NOT NULL;