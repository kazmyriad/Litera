CREATE TABLE `litera`.`books` (
  `id`             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `isbn13`         VARCHAR(13)      NOT NULL,
  `title`          VARCHAR(512)     NOT NULL,
  `subtitle`       VARCHAR(512)     DEFAULT NULL,
  `authors`        VARCHAR(512)     NOT NULL,
  `categories`     VARCHAR(255)     DEFAULT NULL,
  `thumbnail`      VARCHAR(1024)    DEFAULT NULL,
  `description`    LONGTEXT,
  `published_year` SMALLINT         DEFAULT NULL,
  `average_rating` DECIMAL(3,2)     DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_isbn13` (`isbn13`),
  KEY `idx_published_year` (`published_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `litera`.`books`
  (`isbn13`, `title`, `subtitle`, `authors`, `categories`, `thumbnail`, `description`, `published_year`, `average_rating`)
VALUES
  (
    '9780743273565',
    'The Great Gatsby',
    NULL,
    'F. Scott Fitzgerald',
    'Fiction,Classics',
    'https://books.google.com/books/content?id=example&printsec=frontcover&img=1&zoom=1',
    'A portrait of the Jazz Age in all of its decadence and excess.',
    1925,
    3.91
  );
