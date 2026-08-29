INSERT INTO visa_types (slug, name, category, description, common_uses, validity, entries, fee_usd, processing, documents_json) VALUES
  ('e-tourist', 'e-Tourist Visa', 'Tourism', 'For holidays, sightseeing and casual visits with friends or family.', 'Tourism, recreation, short yoga programmes', '30 days or 1 year', 'Double or multiple', 40, 'Usually 3–5 days', '["Photograph","Passport bio page"]'),
  ('e-business', 'e-Business Visa', 'Business', 'For meetings, trade activity and establishing business contacts.', 'Meetings, sales, trade fairs', '1 year', 'Multiple', 80, 'Usually 3–5 days', '["Photograph","Passport bio page","Business card or employer letter","Invitation letter"]'),
  ('e-medical', 'e-Medical Visa', 'Medical', 'For short-term medical treatment at a recognised hospital.', 'Treatment and medical consultation', '60 days', 'Triple', 80, 'Usually 3–5 days', '["Photograph","Passport bio page","Hospital letter"]'),
  ('e-medical-attendant', 'e-Medical Attendant Visa', 'Medical', 'For eligible family members accompanying an e-Medical applicant.', 'Accompanying a patient', '60 days', 'Triple', 80, 'Usually 3–5 days', '["Photograph","Passport bio page","Patient visa reference"]'),
  ('e-conference', 'e-Conference Visa', 'Events', 'For attending approved conferences, seminars and workshops.', 'Conferences and seminars', '30 days', 'Single', 60, 'Usually 4–7 days', '["Photograph","Passport bio page","Conference invitation"]'),
  ('e-student', 'e-Student Visa', 'Study', 'A demonstration category for eligible short-term study programmes.', 'Short courses and exchange programmes', 'Up to 1 year', 'Multiple', 70, 'Usually 5–8 days', '["Photograph","Passport bio page","Admission letter"]')
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  common_uses = excluded.common_uses,
  validity = excluded.validity,
  entries = excluded.entries,
  fee_usd = excluded.fee_usd,
  processing = excluded.processing,
  documents_json = excluded.documents_json;

INSERT INTO eligibility_rules (nationality, passport_types_json, supported_visa_types_json, min_days_before_arrival, max_days_before_arrival, restrictions_json) VALUES
  ('Australia', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]'),
  ('Canada', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]'),
  ('France', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]'),
  ('Germany', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]'),
  ('Japan', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]'),
  ('Singapore', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]'),
  ('United Arab Emirates', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]'),
  ('United Kingdom', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]'),
  ('United States', '["ordinary"]', '["e-tourist","e-business","e-conference","e-medical","e-medical-attendant","e-student"]', 4, 365, '[]')
ON CONFLICT(nationality) DO UPDATE SET
  passport_types_json = excluded.passport_types_json,
  supported_visa_types_json = excluded.supported_visa_types_json,
  min_days_before_arrival = excluded.min_days_before_arrival,
  max_days_before_arrival = excluded.max_days_before_arrival,
  restrictions_json = excluded.restrictions_json;

INSERT OR IGNORE INTO entry_points (name, category, city) VALUES
  ('Delhi International Airport', 'Airport', 'Delhi'),
  ('Mumbai International Airport', 'Airport', 'Mumbai'),
  ('Bengaluru International Airport', 'Airport', 'Bengaluru'),
  ('Chennai International Airport', 'Airport', 'Chennai'),
  ('Hyderabad International Airport', 'Airport', 'Hyderabad'),
  ('Kochi International Airport', 'Airport', 'Kochi'),
  ('Kolkata International Airport', 'Airport', 'Kolkata'),
  ('Ahmedabad International Airport', 'Airport', 'Ahmedabad'),
  ('Goa International Airport', 'Airport', 'Goa'),
  ('Mumbai Seaport', 'Seaport', 'Mumbai'),
  ('Chennai Seaport', 'Seaport', 'Chennai'),
  ('Cochin Seaport', 'Seaport', 'Cochin'),
  ('New Mangalore Seaport', 'Seaport', 'New Mangalore'),
  ('Attari–Wagah', 'Land', 'Attari'),
  ('Attari Rail Check Post', 'Rail', 'Attari'),
  ('Gede Rail Check Post', 'Rail', 'Gede'),
  ('Haridaspur Rail Check Post', 'Rail', 'Haridaspur'),
  ('Munabao Rail Check Post', 'Rail', 'Munabao'),
  ('Chitpur Rail Check Post', 'Rail', 'Chitpur');

INSERT INTO fee_rules (visa_type_id, nationality, duration, visa_fee, transaction_charge) VALUES
  ('e-tourist', '', 'standard', 40, 3),
  ('e-tourist', '', '30-days', 25, 3),
  ('e-business', '', 'standard', 80, 3),
  ('e-medical', '', 'standard', 80, 3),
  ('e-medical-attendant', '', 'standard', 80, 3),
  ('e-conference', '', 'standard', 60, 3),
  ('e-student', '', 'standard', 70, 3)
ON CONFLICT(visa_type_id, nationality, duration) DO UPDATE SET
  visa_fee = excluded.visa_fee,
  transaction_charge = excluded.transaction_charge;
