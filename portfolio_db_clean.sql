-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: portfolio_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'admin','admin@portfolio.com','admin123','2026-07-30 11:19:54','2026-07-30 11:33:05');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'ankita','ankita@gmail.com','full stack','cfb','2026-08-01 09:00:22'),(2,'ankita','ankita@gmail.com','geg','vdf','2026-08-18 15:33:19'),(3,'ankita','ankita@gmail.com','aaaa','aaaa','2026-08-18 15:34:33');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_challenges`
--

DROP TABLE IF EXISTS `project_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_challenges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `icon` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `solution` text,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_order` (`display_order`),
  CONSTRAINT `project_challenges_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_challenges`
--

LOCK TABLES `project_challenges` WRITE;
/*!40000 ALTER TABLE `project_challenges` DISABLE KEYS */;
INSERT INTO `project_challenges` VALUES (1,4,'fa-lock','Authentication','Implementing secure JWT authentication','Used bcrypt for password hashing and JWT for tokens',0,'2026-08-18 15:13:33');
/*!40000 ALTER TABLE `project_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_features`
--

DROP TABLE IF EXISTS `project_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_features` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `icon` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_order` (`display_order`),
  CONSTRAINT `project_features_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_features`
--

LOCK TABLES `project_features` WRITE;
/*!40000 ALTER TABLE `project_features` DISABLE KEYS */;
INSERT INTO `project_features` VALUES (1,4,'fa-user-lock','User Authentication','Secure login and registration',0,'2026-08-18 15:13:33'),(2,4,'fa-boxes','Product Catalog','Manage products with categories',1,'2026-08-18 15:13:33'),(3,4,'fa-shopping-cart','Shopping Cart','Add, remove, and checkout',2,'2026-08-18 15:13:33'),(4,4,'fa-check-circle','Task Management','SDF',3,'2026-08-18 15:13:33');
/*!40000 ALTER TABLE `project_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_gallery`
--

DROP TABLE IF EXISTS `project_gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `description` text,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_order` (`display_order`),
  CONSTRAINT `project_gallery_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_gallery`
--

LOCK TABLES `project_gallery` WRITE;
/*!40000 ALTER TABLE `project_gallery` DISABLE KEYS */;
INSERT INTO `project_gallery` VALUES (1,4,'https://i.ibb.co/d0JPzX0Y/delhi4.jpg','mainpage',NULL,0,'2026-08-18 15:13:33'),(2,4,'https://i.ibb.co/d0JPzX0Y/delhi4.jpg','mainpageas','ZDC',1,'2026-08-18 15:13:33');
/*!40000 ALTER TABLE `project_gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_learnings`
--

DROP TABLE IF EXISTS `project_learnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_learnings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `learning_text` text NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_order` (`display_order`),
  CONSTRAINT `project_learnings_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_learnings`
--

LOCK TABLES `project_learnings` WRITE;
/*!40000 ALTER TABLE `project_learnings` DISABLE KEYS */;
INSERT INTO `project_learnings` VALUES (1,4,'MERN stack architecture and best practices',0,'2026-08-18 15:13:33'),(2,4,'JWT authentication and security patterns',1,'2026-08-18 15:13:33'),(3,4,'MERN stack architecture and best practices',2,'2026-08-18 15:13:33'),(4,4,'Built scalable REST APIs using Express.js.',3,'2026-08-18 15:13:33');
/*!40000 ALTER TABLE `project_learnings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_statistics`
--

DROP TABLE IF EXISTS `project_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_statistics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `stat_title` varchar(100) NOT NULL,
  `stat_value` varchar(100) NOT NULL,
  `stat_icon` varchar(50) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_order` (`display_order`),
  CONSTRAINT `project_statistics_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_statistics`
--

LOCK TABLES `project_statistics` WRITE;
/*!40000 ALTER TABLE `project_statistics` DISABLE KEYS */;
INSERT INTO `project_statistics` VALUES (1,4,'Lines of Code','8,500+','fa-code',0,'2026-08-18 15:13:33'),(2,4,'Pages','12','fa-file',1,'2026-08-18 15:13:33'),(3,4,'Features','18','fa-star',2,'2026-08-18 15:13:33');
/*!40000 ALTER TABLE `project_statistics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_tech_stack`
--

DROP TABLE IF EXISTS `project_tech_stack`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_tech_stack` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `tech_name` varchar(100) NOT NULL,
  `tech_icon` varchar(50) NOT NULL,
  `tech_color` varchar(20) NOT NULL,
  `tech_category` varchar(50) NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_category` (`tech_category`),
  KEY `idx_order` (`display_order`),
  CONSTRAINT `project_tech_stack_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_tech_stack`
--

LOCK TABLES `project_tech_stack` WRITE;
/*!40000 ALTER TABLE `project_tech_stack` DISABLE KEYS */;
INSERT INTO `project_tech_stack` VALUES (1,4,'React','fab fa-react','#61dafb','Frontend',0,'2026-08-18 15:13:33'),(2,4,'Node.js','fab fa-node-js','#339933','Backend',1,'2026-08-18 15:13:33'),(3,4,'MySQL','fas fa-database','#00758f','Database',2,'2026-08-18 15:13:33');
/*!40000 ALTER TABLE `project_tech_stack` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_timeline`
--

DROP TABLE IF EXISTS `project_timeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_timeline` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `step_number` int NOT NULL,
  `step_title` varchar(200) NOT NULL,
  `description` text,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_order` (`display_order`),
  CONSTRAINT `project_timeline_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_timeline`
--

LOCK TABLES `project_timeline` WRITE;
/*!40000 ALTER TABLE `project_timeline` DISABLE KEYS */;
INSERT INTO `project_timeline` VALUES (1,4,1,'Planning','Defined requirements and architecture',0,'2026-08-18 15:13:33'),(2,4,2,'Development','Built the full-stack application',1,'2026-08-18 15:13:33'),(3,4,3,'Planning','FSDF',2,'2026-08-18 15:13:33');
/*!40000 ALTER TABLE `project_timeline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_slug` varchar(100) NOT NULL,
  `project_name` varchar(200) NOT NULL,
  `category` varchar(50) NOT NULL,
  `status` varchar(20) DEFAULT 'Live',
  `completion_date` date DEFAULT NULL,
  `role` varchar(100) DEFAULT NULL,
  `tagline` text,
  `github_url` varchar(255) DEFAULT NULL,
  `demo_url` varchar(255) DEFAULT NULL,
  `hero_image` varchar(255) DEFAULT NULL,
  `banner_image` varchar(255) DEFAULT NULL,
  `overview` longtext,
  `problem_statement` longtext,
  `solution` longtext,
  `meta_title` varchar(200) DEFAULT NULL,
  `meta_description` text,
  `meta_keywords` text,
  `prev_project` varchar(100) DEFAULT NULL,
  `next_project` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_slug` (`project_slug`),
  KEY `idx_slug` (`project_slug`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (2,'ankita-portifilodee','ankita-portifilodeeadadasd','Full Stack','Live',NULL,'full stack developer ','A modern full-stack platform that helps farmers manage crops, connect with buyers, and improve agricultural productivity.',NULL,NULL,NULL,NULL,'dada','sdsdfsd',NULL,'Ankita Portfolio | Full Stack Web Developer','ddfsds','Portfolio, Full Stack Developer, Node.js, Express.js, JavaScript, HTML, CSS, MySQL, GitHub, Web Developer, Responsive Design',NULL,NULL,'2026-07-30 11:59:41','2026-07-30 12:50:17'),(3,'taskflow-pro','TaskFlow Pro','Full Stack','Live','2005-07-30','full stack developer ','A smart project and task management platform for teams.',NULL,NULL,NULL,NULL,'TaskFlow Pro is a modern project management platform designed to help individuals and teams organize work efficiently. Users can create projects, assign tasks, track progress, set deadlines, collaborate with team members, and monitor project performance through interactive dashboards.','Managing projects across multiple team members becomes difficult when tasks, deadlines, and communication are scattered across different platforms.','TaskFlow Pro centralizes project planning, task management, file sharing, and team communication into a single platform with an intuitive interface and real-time updates.','TaskFlow Pro | Full Stack Project Management Platform','TaskFlow Pro is a full stack project management application built using HTML, CSS, JavaScript, Node.js, Express.js, and MySQL.','task management, project management, node js, express js, mysql, full stack, portfolio',NULL,NULL,'2026-07-30 13:02:05','2026-07-30 13:02:05'),(4,'taskflow-proeeeee','TaskFlow ProEEEEE','Full Stack','Archived','0444-04-04','full stack developer ','A smart project and task management platform for teams.',NULL,NULL,'https://i.ibb.co/d0JPzX0Y/delhi4.jpg',NULL,'dfsdf','fsf','dfgdg','Ankita Portfolio | Full Stack Web Developer','SDSA','SDA',NULL,NULL,'2026-08-18 15:13:33','2026-08-18 15:13:33');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `review` text NOT NULL,
  `rating` tinyint NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,'John Doe','john@example.com','Share your experience...',4,NULL,'2026-07-31 14:41:43'),(2,'John Doe','john@example.com','FH',1,NULL,'2026-07-31 14:54:00'),(3,'ANKITA CHAUHAN','ankita@gmail.com','Beautiful! Beautiful! Beautiful! Beautiful!',5,'https://res.cloudinary.com/dngjbgaaf/image/upload/v1787067036/portfolio/reviews/wk6sdvvoadvugydqyvrg.jpg','2026-08-18 15:22:12'),(4,'ANKITA CHAUHAN','ankita@gmail.com','Beautiful! Beautiful! Beautiful! Beautiful!',5,'https://res.cloudinary.com/dngjbgaaf/image/upload/v1787067037/portfolio/reviews/b2nyh3hgndmhgfib0das.jpg','2026-08-18 15:22:13');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_project_full`
--

DROP TABLE IF EXISTS `vw_project_full`;
/*!50001 DROP VIEW IF EXISTS `vw_project_full`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_project_full` AS SELECT 
 1 AS `id`,
 1 AS `project_slug`,
 1 AS `project_name`,
 1 AS `category`,
 1 AS `status`,
 1 AS `completion_date`,
 1 AS `role`,
 1 AS `tagline`,
 1 AS `github_url`,
 1 AS `demo_url`,
 1 AS `hero_image`,
 1 AS `banner_image`,
 1 AS `overview`,
 1 AS `problem_statement`,
 1 AS `solution`,
 1 AS `meta_title`,
 1 AS `meta_description`,
 1 AS `meta_keywords`,
 1 AS `prev_project`,
 1 AS `next_project`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `gallery`,
 1 AS `features`,
 1 AS `tech_stack`,
 1 AS `timeline`,
 1 AS `challenges`,
 1 AS `learnings`,
 1 AS `statistics`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vw_project_full`
--

/*!50001 DROP VIEW IF EXISTS `vw_project_full`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013  SQL SECURITY DEFINER */
/*!50001 VIEW `vw_project_full` AS select `p`.`id` AS `id`,`p`.`project_slug` AS `project_slug`,`p`.`project_name` AS `project_name`,`p`.`category` AS `category`,`p`.`status` AS `status`,`p`.`completion_date` AS `completion_date`,`p`.`role` AS `role`,`p`.`tagline` AS `tagline`,`p`.`github_url` AS `github_url`,`p`.`demo_url` AS `demo_url`,`p`.`hero_image` AS `hero_image`,`p`.`banner_image` AS `banner_image`,`p`.`overview` AS `overview`,`p`.`problem_statement` AS `problem_statement`,`p`.`solution` AS `solution`,`p`.`meta_title` AS `meta_title`,`p`.`meta_description` AS `meta_description`,`p`.`meta_keywords` AS `meta_keywords`,`p`.`prev_project` AS `prev_project`,`p`.`next_project` AS `next_project`,`p`.`created_at` AS `created_at`,`p`.`updated_at` AS `updated_at`,group_concat(distinct concat_ws('|',`g`.`id`,`g`.`image_path`,`g`.`title`,`g`.`description`,`g`.`display_order`) order by `g`.`display_order` ASC separator '||') AS `gallery`,group_concat(distinct concat_ws('|',`f`.`id`,`f`.`icon`,`f`.`title`,`f`.`description`,`f`.`display_order`) order by `f`.`display_order` ASC separator '||') AS `features`,group_concat(distinct concat_ws('|',`t`.`id`,`t`.`tech_name`,`t`.`tech_icon`,`t`.`tech_color`,`t`.`tech_category`,`t`.`display_order`) order by `t`.`display_order` ASC separator '||') AS `tech_stack`,group_concat(distinct concat_ws('|',`tl`.`id`,`tl`.`step_number`,`tl`.`step_title`,`tl`.`description`,`tl`.`display_order`) order by `tl`.`display_order` ASC separator '||') AS `timeline`,group_concat(distinct concat_ws('|',`c`.`id`,`c`.`icon`,`c`.`title`,`c`.`description`,`c`.`solution`,`c`.`display_order`) order by `c`.`display_order` ASC separator '||') AS `challenges`,group_concat(distinct concat_ws('|',`l`.`id`,`l`.`learning_text`,`l`.`display_order`) order by `l`.`display_order` ASC separator '||') AS `learnings`,group_concat(distinct concat_ws('|',`s`.`id`,`s`.`stat_title`,`s`.`stat_value`,`s`.`stat_icon`,`s`.`display_order`) order by `s`.`display_order` ASC separator '||') AS `statistics` from (((((((`projects` `p` left join `project_gallery` `g` on((`p`.`id` = `g`.`project_id`))) left join `project_features` `f` on((`p`.`id` = `f`.`project_id`))) left join `project_tech_stack` `t` on((`p`.`id` = `t`.`project_id`))) left join `project_timeline` `tl` on((`p`.`id` = `tl`.`project_id`))) left join `project_challenges` `c` on((`p`.`id` = `c`.`project_id`))) left join `project_learnings` `l` on((`p`.`id` = `l`.`project_id`))) left join `project_statistics` `s` on((`p`.`id` = `s`.`project_id`))) group by `p`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-19 12:52:42

