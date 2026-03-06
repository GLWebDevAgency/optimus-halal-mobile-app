-- 0016: Add missing foreign key indexes
-- PostgreSQL does NOT auto-create indexes on FK columns (unlike MySQL)
-- Without these, JOINs and WHERE clauses on FK columns do full table scans

CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews(user_id);
CREATE INDEX IF NOT EXISTS reviews_store_id_idx ON reviews(store_id);
CREATE INDEX IF NOT EXISTS favorites_folder_id_idx ON favorites(folder_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON push_tokens(user_id);

-- Partial index for unread alerts — covers the most common query pattern
-- (fetching unread count / unread list per user)
CREATE INDEX IF NOT EXISTS alert_read_status_user_unread_idx
  ON alert_read_status(user_id)
  WHERE is_read = false;
