-- Optional: a few sample courts so the Courts directory isn't empty.
-- These are placeholders — edit or delete them and add your real local courts.
insert into public.courts (name, address, city, num_courts, indoor, lights, surface, notes)
values
  ('Sample Park Courts',        '123 Park Ave',        'Your City', 6, false, true,  'hard',     'Example outdoor venue. Replace with a real court.'),
  ('Sample Rec Center',         '45 Community Rd',     'Your City', 4, true,  true,  'wood',     'Example indoor venue. Replace with a real court.'),
  ('Sample Sports Club',        '9 Club Lane',         'Your City', 8, false, false, 'acrylic',  'Example club venue. Replace with a real court.')
on conflict do nothing;
