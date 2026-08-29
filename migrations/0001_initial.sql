PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS visa_types (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  common_uses TEXT NOT NULL,
  validity TEXT NOT NULL,
  entries TEXT NOT NULL,
  fee_usd INTEGER NOT NULL CHECK (fee_usd >= 0),
  processing TEXT NOT NULL,
  documents_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS eligibility_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nationality TEXT NOT NULL,
  passport_types_json TEXT NOT NULL,
  supported_visa_types_json TEXT NOT NULL,
  min_days_before_arrival INTEGER NOT NULL DEFAULT 0,
  max_days_before_arrival INTEGER NOT NULL DEFAULT 365,
  restrictions_json TEXT NOT NULL DEFAULT '[]',
  UNIQUE (nationality)
);

CREATE TABLE IF NOT EXISTS entry_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Airport', 'Seaport', 'Land', 'Rail')),
  city TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fee_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visa_type_id TEXT NOT NULL REFERENCES visa_types(slug) ON DELETE CASCADE,
  nationality TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT 'standard',
  visa_fee INTEGER NOT NULL CHECK (visa_fee >= 0),
  transaction_charge INTEGER NOT NULL DEFAULT 3 CHECK (transaction_charge >= 0),
  UNIQUE (visa_type_id, nationality, duration)
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'READY_TO_SUBMIT', 'SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW', 'DOCUMENT_REUPLOAD_REQUIRED', 'GRANTED', 'REJECTED')),
  email TEXT,
  nationality TEXT NOT NULL DEFAULT '',
  visa_type_id TEXT NOT NULL DEFAULT 'e-tourist' REFERENCES visa_types(slug),
  proposed_arrival TEXT,
  applicant_name TEXT,
  dob TEXT,
  passport_number TEXT,
  sections_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT,
  rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS application_sections (
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (application_id, section)
);

CREATE INDEX IF NOT EXISTS idx_application_sections_application_id ON application_sections(application_id);

CREATE TABLE IF NOT EXISTS applicants (
  application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  surname TEXT,
  given_names TEXT,
  gender TEXT,
  birth_city TEXT,
  birth_country TEXT,
  citizenship TEXT,
  religion TEXT,
  identification_marks TEXT,
  education TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS passports (
  application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  passport_number TEXT,
  passport_type TEXT,
  issuing_country TEXT,
  place_of_issue TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS addresses (
  application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS family_details (
  application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS employment_details (
  application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS travel_details (
  application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visa_details (
  application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS background_answers (
  application_id INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  object_key TEXT,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('MISSING', 'UPLOADED', 'ACCEPTED', 'REUPLOAD_REQUIRED', 'REPLACED')),
  rejection_reason TEXT,
  uploaded_at TEXT NOT NULL,
  reviewed_at TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  replaces_document_id INTEGER REFERENCES documents(id),
  UNIQUE (application_id, document_type, version)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  provider TEXT NOT NULL DEFAULT 'Demo payment',
  status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PROCESSING', 'SUCCESS', 'FAILED')),
  transaction_reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS application_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS etas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  eta_number TEXT NOT NULL UNIQUE,
  granted_at TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  entries TEXT NOT NULL,
  conditions TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_applications_public_id ON applications(public_id);
CREATE INDEX IF NOT EXISTS idx_applications_passport_number ON applications(passport_number);
CREATE INDEX IF NOT EXISTS idx_applications_dob ON applications(dob);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_application_type ON documents(application_id, document_type, version DESC);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_events_application_id ON application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_application_id ON notifications(application_id);
CREATE INDEX IF NOT EXISTS idx_applicants_application_id ON applicants(application_id);
CREATE INDEX IF NOT EXISTS idx_passports_application_id ON passports(application_id);
