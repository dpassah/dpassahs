-- CreateTable
CREATE TABLE `orgs` (
    `org_id` VARCHAR(64) NOT NULL,
    `org_name` VARCHAR(255) NOT NULL,
    `org_name_full` VARCHAR(255) NOT NULL,
    `org_type` VARCHAR(128) NOT NULL,
    `contact_name` VARCHAR(255) NULL,
    `contact_email` VARCHAR(255) NOT NULL,
    `contact_phone` VARCHAR(64) NULL,
    `created_at` BIGINT NOT NULL,

    PRIMARY KEY (`org_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(64) NOT NULL,
    `org_id` VARCHAR(64) NOT NULL,
    `bailleur` VARCHAR(255) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `sector` VARCHAR(128) NOT NULL,
    `location` TEXT NOT NULL,
    `created_at` BIGINT NOT NULL,

    INDEX `projects_org_id_idx`(`org_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_org_id_fkey` FOREIGN KEY (`org_id`) REFERENCES `orgs`(`org_id`) ON DELETE CASCADE ON UPDATE CASCADE;
