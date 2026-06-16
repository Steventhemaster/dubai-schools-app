-- ════════════════════════════════════════════════════════════════════════
--  Dubai Schools — seed data (run AFTER schema.sql)
--  Illustrative figures only. Replace with official KHDA data before launch.
-- ════════════════════════════════════════════════════════════════════════

insert into schools
  (id, name, area, curriculum, gender, age_range, khda_rating,
   fee_min_aed, fee_max_aed, has_vacancy, vacancy_note, founded, website,
   lat, lng, description, fee_bands, nationality_mix, admissions_note)
values
('gems-wellington-dso',
 'GEMS Wellington Academy — Silicon Oasis','Dubai Silicon Oasis','British','Mixed','3–18','Very Good',
 38000,75000,true,'Open seats in FS2–Year 5; waitlist Year 12',2009,'https://www.gemswellingtonacademy-dso.com',
 25.1216,55.3815,'Large British-curriculum through-school with strong sixth form and broad extracurriculars.',
 '[{"grade":"FS1","annualAed":38000},{"grade":"Year 1","annualAed":46000},{"grade":"Year 7","annualAed":60000},{"grade":"Year 12","annualAed":75000}]',
 '[{"nationality":"British","percent":22},{"nationality":"Indian","percent":18},{"nationality":"Emirati","percent":10},{"nationality":"Egyptian","percent":9},{"nationality":"Other","percent":41}]',
 'Assessment for Year 1+; registration fee AED 500 (non-refundable). Apply via KHDA-aligned online portal.'),

('dubai-american-academy',
 'Dubai American Academy','Al Barsha','American','Mixed','3–18','Outstanding',
 55000,98000,false,'Waitlist across most grades',1998,'https://www.gemsaa-dubai.com',
 25.1009,55.1996,'Premium American curriculum with IB Diploma option; consistently top KHDA rating.',
 '[{"grade":"KG1","annualAed":55000},{"grade":"Grade 1","annualAed":66000},{"grade":"Grade 6","annualAed":80000},{"grade":"Grade 12","annualAed":98000}]',
 '[{"nationality":"American","percent":16},{"nationality":"Emirati","percent":12},{"nationality":"Indian","percent":14},{"nationality":"Lebanese","percent":9},{"nationality":"Other","percent":49}]',
 'Competitive entry; MAP assessment required. Early application strongly advised.'),

('kings-school-nad-al-sheba',
 'King''s School Nad Al Sheba','Nad Al Sheba','British','Mixed','3–18','Outstanding',
 50000,92000,true,'Limited seats FS1–Year 6',2014,null,
 25.1639,55.3411,'British curriculum school known for pastoral care and strong primary phase.',
 '[{"grade":"FS1","annualAed":50000},{"grade":"Year 1","annualAed":58000},{"grade":"Year 7","annualAed":78000},{"grade":"Year 13","annualAed":92000}]',
 '[{"nationality":"British","percent":28},{"nationality":"Emirati","percent":9},{"nationality":"Irish","percent":6},{"nationality":"Indian","percent":11},{"nationality":"Other","percent":46}]',
 'Taster day for applicants; rolling admissions.'),

('gems-modern-academy',
 'GEMS Modern Academy','Nad Al Sheba','Indian (CBSE)','Mixed','3–18','Outstanding',
 18000,42000,false,'High demand; waitlist all grades',1986,null,
 25.1722,55.3308,'Long-established CBSE school with outstanding academic outcomes and strong value.',
 '[{"grade":"KG1","annualAed":18000},{"grade":"Grade 1","annualAed":22000},{"grade":"Grade 6","annualAed":30000},{"grade":"Grade 12","annualAed":42000}]',
 '[{"nationality":"Indian","percent":78},{"nationality":"Pakistani","percent":6},{"nationality":"Emirati","percent":3},{"nationality":"Other","percent":13}]',
 'Entrance assessment; sibling priority. Apply early in the academic cycle.'),

('lycee-francais-jss',
 'Lycée Français Jean Mermoz','Al Quoz','French','Mixed','3–18','Very Good',
 30000,58000,true,'Seats available in maternelle and primaire',2014,null,
 25.1402,55.2266,'French national curriculum (AEFE network) with bilingual French–English pathway.',
 '[{"grade":"Petite Section","annualAed":30000},{"grade":"CP","annualAed":36000},{"grade":"Collège","annualAed":46000},{"grade":"Terminale","annualAed":58000}]',
 '[{"nationality":"French","percent":41},{"nationality":"Lebanese","percent":12},{"nationality":"Emirati","percent":5},{"nationality":"Other","percent":42}]',
 'French-language proficiency considered for upper grades.'),

('dubai-international-academy',
 'Dubai International Academy — Emirates Hills','Emirates Hills','IB','Mixed','4–18','Outstanding',
 48000,95000,false,null,2005,null,
 25.0667,55.1772,'Full IB continuum (PYP/MYP/DP) with strong global university placement.',
 '[{"grade":"KG1","annualAed":48000},{"grade":"Grade 1","annualAed":60000},{"grade":"Grade 6","annualAed":78000},{"grade":"Grade 12","annualAed":95000}]',
 '[{"nationality":"Emirati","percent":8},{"nationality":"Indian","percent":15},{"nationality":"British","percent":10},{"nationality":"Russian","percent":7},{"nationality":"Other","percent":60}]',
 'IB-aligned assessment; waitlist common in upper school.')
on conflict (id) do update set
  name = excluded.name,
  updated_at = now();

-- Sample reviews
insert into reviews (school_id, author_name, rating, title, body, scores) values
('gems-wellington-dso','Sara M.',4,'Great community, busy campus','Teachers are caring and the sixth form is strong. Pickup traffic can be hectic.','{"academics":4,"facilities":4,"teaching":5,"valueForMoney":3}'),
('gems-wellington-dso','Daniel K.',5,null,'Our two kids settled in quickly. Lots of clubs and good SEN support.','{"academics":4,"facilities":5,"teaching":5,"valueForMoney":4}'),
('dubai-american-academy','Reem A.',5,'Worth the fees','Outstanding facilities and university counselling. Highly competitive entry.','{"academics":5,"facilities":5,"teaching":5,"valueForMoney":4}'),
('kings-school-nad-al-sheba','Priya S.',5,'Brilliant for primary','Pastoral care is exceptional. My daughter loves going to school.',null),
('gems-modern-academy','Anonymous',5,null,'Top CBSE results in Dubai and incredible value. Just very hard to get a seat.',null);
