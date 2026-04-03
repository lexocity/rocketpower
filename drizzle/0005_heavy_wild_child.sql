CREATE TABLE `staff_duties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffName` varchar(128) NOT NULL,
	`dutyType` enum('morning_duty','lunch_duty','afternoon_duty','carpool','class_coverage','iep','other') NOT NULL,
	`dutyLabel` varchar(256),
	`location` varchar(256),
	`timeStart` varchar(16),
	`timeEnd` varchar(16),
	`quarter` enum('Q1','Q2','Q3','Q4','all') NOT NULL DEFAULT 'all',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_duties_id` PRIMARY KEY(`id`)
);
