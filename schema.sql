CREATE TABLE "users" (
   "id" int NOT NULL AUTO_INCREMENT,
   "username" varchar(45) NOT NULL,
   "email" varchar(250) NOT NULL,
   "password" varchar(45) NOT NULL,
   "firstname" varchar(45) NOT NULL,
   "lastname" varchar(45) NOT NULL,
   "dob" date DEFAULT NULL,
   "profile_img_id" int DEFAULT NULL,
   "role" varchar(45) DEFAULT NULL,
   PRIMARY KEY ("id"),
   UNIQUE KEY "username_UNIQUE" ("username"),
   UNIQUE KEY "email_UNIQUE" ("email"),
   UNIQUE KEY "password_UNIQUE" ("password")
 )

 CREATE TABLE "community_members" (
   "id" int NOT NULL AUTO_INCREMENT,
   "user_id" int NOT NULL,
   "community_id" int NOT NULL,
   "community_role" varchar(45) DEFAULT 'member',
   PRIMARY KEY ("id"),
   KEY "user_idx" ("user_id"),
   KEY "community_idx" ("community_id"),
   CONSTRAINT "community" FOREIGN KEY ("community_id") REFERENCES "communities" ("id"),
   CONSTRAINT "user" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
 )

 CREATE TABLE "communities" (
   "id" int NOT NULL AUTO_INCREMENT,
   "owner_id" int NOT NULL,
   "name" varchar(255) NOT NULL,
   "description" text,
   "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY ("id"),
   KEY "owner_id" ("owner_id"),
   CONSTRAINT "communities_ibfk_1" FOREIGN KEY ("owner_id") REFERENCES "users" ("id")
 )

 CREATE TABLE "books" (
   "id" int unsigned NOT NULL AUTO_INCREMENT,
   "isbn13" varchar(13) COLLATE utf8mb4_unicode_ci NOT NULL,
   "title" varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
   "subtitle" varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
   "authors" varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
   "categories" varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
   "thumbnail" varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
   "description" longtext COLLATE utf8mb4_unicode_ci,
   "published_year" smallint DEFAULT NULL,
   "average_rating" decimal(3,2) DEFAULT NULL,
   PRIMARY KEY ("id"),
   KEY "idx_isbn13" ("isbn13"),
   KEY "idx_published_year" ("published_year")
 )