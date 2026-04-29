-- Run these against your production database to create missing tables.
-- All statements use IF NOT EXISTS so they are safe to re-run.

-- Add bio and interests columns to users (safe to re-run)
ALTER TABLE litera.users ADD COLUMN IF NOT EXISTS bio VARCHAR(250) NULL;
ALTER TABLE litera.users ADD COLUMN IF NOT EXISTS interests TEXT NULL;


CREATE TABLE IF NOT EXISTS litera.user_favorites (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  book_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_book_unique (user_id, book_id),
  KEY idx_fav_user (user_id),
  KEY idx_fav_book (book_id),
  CONSTRAINT fav_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fav_book_fk FOREIGN KEY (book_id) REFERENCES books  (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS litera.user_shelves (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_shelves_user (user_id),
  CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS litera.shelf_books (
  id         INT          NOT NULL AUTO_INCREMENT,
  shelf_id   INT          NOT NULL,
  book_id    INT UNSIGNED NOT NULL,
  added_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shelf_book (shelf_id, book_id),
  KEY idx_sb_book (book_id),
  CONSTRAINT fk_sb_shelf FOREIGN KEY (shelf_id) REFERENCES user_shelves (id) ON DELETE CASCADE,
  CONSTRAINT fk_sb_book  FOREIGN KEY (book_id)  REFERENCES books         (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS litera.community_books (
  id            INT          NOT NULL AUTO_INCREMENT,
  community_id  INT          NOT NULL,
  book_id       INT UNSIGNED NOT NULL,
  status        ENUM('current', 'previous') NOT NULL DEFAULT 'current',
  added_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE  KEY uq_community_book      (community_id, book_id),
  KEY           idx_community_status (community_id, status),
  CONSTRAINT fk_cb_community FOREIGN KEY (community_id) REFERENCES communities (id) ON DELETE CASCADE,
  CONSTRAINT fk_cb_book      FOREIGN KEY (book_id)      REFERENCES books        (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS litera.forum_threads (
  id           INT          NOT NULL AUTO_INCREMENT,
  community_id INT          NOT NULL,
  title        VARCHAR(255) NOT NULL,
  created_by   INT          NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ft_community (community_id),
  CONSTRAINT fk_ft_community FOREIGN KEY (community_id) REFERENCES communities (id) ON DELETE CASCADE,
  CONSTRAINT fk_ft_user      FOREIGN KEY (created_by)   REFERENCES users        (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS litera.forum_posts (
  id         INT          NOT NULL AUTO_INCREMENT,
  thread_id  INT          NOT NULL,
  user_id    INT          NOT NULL,
  content    TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fp_thread (thread_id),
  CONSTRAINT fk_fp_thread FOREIGN KEY (thread_id) REFERENCES forum_threads (id) ON DELETE CASCADE,
  CONSTRAINT fk_fp_user   FOREIGN KEY (user_id)   REFERENCES users          (id) ON DELETE CASCADE
);
