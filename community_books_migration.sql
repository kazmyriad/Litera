-- Run this once against your database to enable community book tracking.
-- After running, rebuild and restart the server.

CREATE TABLE IF NOT EXISTS community_books (
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
