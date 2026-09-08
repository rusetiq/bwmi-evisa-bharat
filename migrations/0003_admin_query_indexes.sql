-- Additive indexes for stable keyset browsing and latest related records.
CREATE INDEX IF NOT EXISTS idx_applications_review_order ON applications(COALESCE(submitted_at, updated_at) DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status_review_order ON applications(status, COALESCE(submitted_at, updated_at) DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_applications_visa_review_order ON applications(visa_type_id, COALESCE(submitted_at, updated_at) DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_applications_nationality_review_order ON applications(lower(nationality), COALESCE(submitted_at, updated_at) DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_documents_latest_version ON documents(application_id, document_type, version DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_events_recent ON application_events(application_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recent ON notifications(application_id, created_at DESC, id DESC);
