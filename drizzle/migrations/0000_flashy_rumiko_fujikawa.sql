CREATE TABLE `absences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coverageDate` text NOT NULL,
	`staffName` text NOT NULL,
	`timeRange` text DEFAULT 'all_day' NOT NULL,
	`customTimeStart` text,
	`customTimeEnd` text,
	`subName` text,
	`subStatus` text DEFAULT 'assigned' NOT NULL,
	`isOAM` integer DEFAULT false NOT NULL,
	`absenceType` text DEFAULT 'unknown' NOT NULL,
	`employeeNumber` text,
	`subNumber` text,
	`notes` text,
	`createdBy` integer,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coverage_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coverageDate` text NOT NULL,
	`coveringStaffName` text NOT NULL,
	`coveringFor` text NOT NULL,
	`location` text,
	`coverageReason` text DEFAULT 'subbing' NOT NULL,
	`timeSlot` text DEFAULT 'custom' NOT NULL,
	`customTimeStart` text,
	`customTimeEnd` text,
	`notes` text,
	`createdBy` integer,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sentBy` integer NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`recipientType` text DEFAULT 'all' NOT NULL,
	`recipientIds` text,
	`successCount` integer DEFAULT 0 NOT NULL,
	`failureCount` integer DEFAULT 0 NOT NULL,
	`sentAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_receipts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notificationId` integer NOT NULL,
	`userId` integer NOT NULL,
	`openedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_recipients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notificationId` integer NOT NULL,
	`userId` integer NOT NULL,
	`delivered` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_duties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`staffName` text NOT NULL,
	`dutyType` text NOT NULL,
	`dutyLabel` text,
	`location` text,
	`timeStart` text,
	`timeEnd` text,
	`quarter` text DEFAULT 'all' NOT NULL,
	`notes` text,
	`createdBy` integer,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`displayName` text,
	`expoPushToken` text,
	`notificationsEnabled` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL,
	`lastSignedIn` text DEFAULT (datetime('now')) NOT NULL,
	`passwordHash` text,
	`passwordSalt` text,
	`accountStatus` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);