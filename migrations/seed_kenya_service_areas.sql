-- ============================================================
--  Fixera — Full Kenya Service Areas Seed
--  All 47 counties + ~350 sub-counties
--  Nairobi starts ACTIVE, everything else INACTIVE
--  Run after create_service_areas.sql
-- ============================================================

-- Add unique constraint so we can use ON CONFLICT
ALTER TABLE service_areas
  ADD CONSTRAINT IF NOT EXISTS uq_county_subcounty UNIQUE (county, sub_county);

-- Clear old partial seed
DELETE FROM service_areas WHERE notes IS NULL;

-- ── Insert all 47 counties ────────────────────────────────────────
INSERT INTO service_areas (county, sub_county, label, is_active) VALUES

-- ── 1. NAIROBI (active by default — current operations base) ──────
('Nairobi','Westlands',        'Westlands, Nairobi',        true),
('Nairobi','Dagoretti North',  'Dagoretti North, Nairobi',  true),
('Nairobi','Dagoretti South',  'Dagoretti South, Nairobi',  true),
('Nairobi','Embakasi Central', 'Embakasi Central, Nairobi', true),
('Nairobi','Embakasi East',    'Embakasi East, Nairobi',    true),
('Nairobi','Embakasi North',   'Embakasi North, Nairobi',   true),
('Nairobi','Embakasi South',   'Embakasi South, Nairobi',   true),
('Nairobi','Embakasi West',    'Embakasi West, Nairobi',    true),
('Nairobi','Highridge',        'Highridge, Nairobi',        true),
('Nairobi','Kamukunji',        'Kamukunji, Nairobi',        true),
('Nairobi','Kasarani',         'Kasarani, Nairobi',         true),
('Nairobi','Kibra',            'Kibra, Nairobi',            true),
('Nairobi','Langata',          'Langata, Nairobi',          true),
('Nairobi','Makadara',         'Makadara, Nairobi',         true),
('Nairobi','Mathare',          'Mathare, Nairobi',          true),
('Nairobi','Roysambu',         'Roysambu, Nairobi',         true),
('Nairobi','Ruaraka',          'Ruaraka, Nairobi',          true),
('Nairobi','Starehe',          'Starehe, Nairobi',          true),

-- ── 2. KIAMBU ─────────────────────────────────────────────────────
('Kiambu','Gatundu North', 'Gatundu North, Kiambu', false),
('Kiambu','Gatundu South', 'Gatundu South, Kiambu', false),
('Kiambu','Githunguri',    'Githunguri, Kiambu',    false),
('Kiambu','Juja',          'Juja, Kiambu',          false),
('Kiambu','Kabete',        'Kabete, Kiambu',        false),
('Kiambu','Kiambaa',       'Kiambaa, Kiambu',       false),
('Kiambu','Kiambu Town',   'Kiambu Town, Kiambu',   false),
('Kiambu','Kikuyu',        'Kikuyu, Kiambu',        false),
('Kiambu','Lari',          'Lari, Kiambu',          false),
('Kiambu','Limuru',        'Limuru, Kiambu',        false),
('Kiambu','Ruiru',         'Ruiru, Kiambu',         false),
('Kiambu','Thika Town',    'Thika Town, Kiambu',    false),

-- ── 3. KAJIADO ────────────────────────────────────────────────────
('Kajiado','Kajiado Central', 'Kajiado Central, Kajiado', false),
('Kajiado','Kajiado East',    'Kajiado East, Kajiado',    false),
('Kajiado','Kajiado North',   'Kajiado North, Kajiado',   false),
('Kajiado','Kajiado South',   'Kajiado South, Kajiado',   false),
('Kajiado','Kajiado West',    'Kajiado West, Kajiado',    false),

-- ── 4. MACHAKOS ───────────────────────────────────────────────────
('Machakos','Kathiani',      'Kathiani, Machakos',      false),
('Machakos','Machakos Town', 'Machakos Town, Machakos', false),
('Machakos','Masinga',       'Masinga, Machakos',       false),
('Machakos','Matungulu',     'Matungulu, Machakos',     false),
('Machakos','Mavoko',        'Mavoko, Machakos',        false),
('Machakos','Mwala',         'Mwala, Machakos',         false),
('Machakos','Yatta',         'Yatta, Machakos',         false),

-- ── 5. MAKUENI ────────────────────────────────────────────────────
('Makueni','Kaiti',        'Kaiti, Makueni',        false),
('Makueni','Kibwezi East', 'Kibwezi East, Makueni', false),
('Makueni','Kibwezi West', 'Kibwezi West, Makueni', false),
('Makueni','Kilome',       'Kilome, Makueni',       false),
('Makueni','Makueni Town', 'Makueni Town, Makueni', false),
('Makueni','Mbooni',       'Mbooni, Makueni',       false),

-- ── 6. MOMBASA ────────────────────────────────────────────────────
('Mombasa','Changamwe', 'Changamwe, Mombasa', false),
('Mombasa','Jomvu',     'Jomvu, Mombasa',     false),
('Mombasa','Kisauni',   'Kisauni, Mombasa',   false),
('Mombasa','Likoni',    'Likoni, Mombasa',    false),
('Mombasa','Mvita',     'Mvita, Mombasa',     false),
('Mombasa','Nyali',     'Nyali, Mombasa',     false),

-- ── 7. KWALE ──────────────────────────────────────────────────────
('Kwale','Kinango',    'Kinango, Kwale',    false),
('Kwale','Lungalunga', 'Lungalunga, Kwale', false),
('Kwale','Matuga',     'Matuga, Kwale',     false),
('Kwale','Msambweni',  'Msambweni, Kwale',  false),

-- ── 8. KILIFI ─────────────────────────────────────────────────────
('Kilifi','Ganze',       'Ganze, Kilifi',       false),
('Kilifi','Kaloleni',    'Kaloleni, Kilifi',    false),
('Kilifi','Kilifi North', 'Kilifi North, Kilifi', false),
('Kilifi','Kilifi South', 'Kilifi South, Kilifi', false),
('Kilifi','Magarini',    'Magarini, Kilifi',    false),
('Kilifi','Malindi',     'Malindi, Kilifi',     false),
('Kilifi','Rabai',       'Rabai, Kilifi',       false),

-- ── 9. TANA RIVER ─────────────────────────────────────────────────
('Tana River','Bura',   'Bura, Tana River',   false),
('Tana River','Galole', 'Galole, Tana River', false),
('Tana River','Garsen', 'Garsen, Tana River', false),

-- ── 10. LAMU ──────────────────────────────────────────────────────
('Lamu','Lamu East', 'Lamu East, Lamu', false),
('Lamu','Lamu West', 'Lamu West, Lamu', false),

-- ── 11. TAITA-TAVETA ──────────────────────────────────────────────
('Taita-Taveta','Mwatate', 'Mwatate, Taita-Taveta', false),
('Taita-Taveta','Taveta',  'Taveta, Taita-Taveta',  false),
('Taita-Taveta','Voi',     'Voi, Taita-Taveta',     false),
('Taita-Taveta','Wundanyi','Wundanyi, Taita-Taveta', false),

-- ── 12. GARISSA ───────────────────────────────────────────────────
('Garissa','Balambala',         'Balambala, Garissa',         false),
('Garissa','Dadaab',            'Dadaab, Garissa',            false),
('Garissa','Fafi',              'Fafi, Garissa',              false),
('Garissa','Garissa Township',  'Garissa Township, Garissa',  false),
('Garissa','Hulugho',           'Hulugho, Garissa',           false),
('Garissa','Ijara',             'Ijara, Garissa',             false),
('Garissa','Lagdera',           'Lagdera, Garissa',           false),

-- ── 13. WAJIR ─────────────────────────────────────────────────────
('Wajir','Eldas',       'Eldas, Wajir',       false),
('Wajir','Tarbaj',      'Tarbaj, Wajir',      false),
('Wajir','Wajir East',  'Wajir East, Wajir',  false),
('Wajir','Wajir North', 'Wajir North, Wajir', false),
('Wajir','Wajir South', 'Wajir South, Wajir', false),
('Wajir','Wajir West',  'Wajir West, Wajir',  false),

-- ── 14. MANDERA ───────────────────────────────────────────────────
('Mandera','Banissa',       'Banissa, Mandera',       false),
('Mandera','Lafey',         'Lafey, Mandera',         false),
('Mandera','Mandera East',  'Mandera East, Mandera',  false),
('Mandera','Mandera North', 'Mandera North, Mandera', false),
('Mandera','Mandera South', 'Mandera South, Mandera', false),
('Mandera','Mandera West',  'Mandera West, Mandera',  false),

-- ── 15. MARSABIT ──────────────────────────────────────────────────
('Marsabit','Laisamis',   'Laisamis, Marsabit',   false),
('Marsabit','Moyale',     'Moyale, Marsabit',     false),
('Marsabit','North Horr', 'North Horr, Marsabit', false),
('Marsabit','Saku',       'Saku, Marsabit',       false),

-- ── 16. ISIOLO ────────────────────────────────────────────────────
('Isiolo','Garbatulla', 'Garbatulla, Isiolo', false),
('Isiolo','Isiolo Town','Isiolo Town, Isiolo', false),
('Isiolo','Merti',      'Merti, Isiolo',      false),

-- ── 17. MERU ──────────────────────────────────────────────────────
('Meru','Buuri',          'Buuri, Meru',          false),
('Meru','Igembe Central', 'Igembe Central, Meru', false),
('Meru','Igembe North',   'Igembe North, Meru',   false),
('Meru','Igembe South',   'Igembe South, Meru',   false),
('Meru','Imenti Central', 'Imenti Central, Meru', false),
('Meru','Imenti North',   'Imenti North, Meru',   false),
('Meru','Imenti South',   'Imenti South, Meru',   false),
('Meru','Tigania East',   'Tigania East, Meru',   false),
('Meru','Tigania West',   'Tigania West, Meru',   false),

-- ── 18. THARAKA-NITHI ─────────────────────────────────────────────
('Tharaka-Nithi','Chuka/Igambang''ombe', 'Chuka, Tharaka-Nithi',   false),
('Tharaka-Nithi','Maara',               'Maara, Tharaka-Nithi',   false),
('Tharaka-Nithi','Tharaka North',       'Tharaka North, Tharaka-Nithi', false),
('Tharaka-Nithi','Tharaka South',       'Tharaka South, Tharaka-Nithi', false),

-- ── 19. EMBU ──────────────────────────────────────────────────────
('Embu','Embu East',    'Embu East, Embu',    false),
('Embu','Embu North',   'Embu North, Embu',   false),
('Embu','Embu West',    'Embu West, Embu',    false),
('Embu','Manyatta',     'Manyatta, Embu',     false),
('Embu','Mbeere North', 'Mbeere North, Embu', false),
('Embu','Mbeere South', 'Mbeere South, Embu', false),
('Embu','Runyenjes',    'Runyenjes, Embu',    false),

-- ── 20. KITUI ─────────────────────────────────────────────────────
('Kitui','Kitui Central', 'Kitui Central, Kitui', false),
('Kitui','Kitui East',    'Kitui East, Kitui',    false),
('Kitui','Kitui Rural',   'Kitui Rural, Kitui',   false),
('Kitui','Kitui South',   'Kitui South, Kitui',   false),
('Kitui','Kitui West',    'Kitui West, Kitui',    false),
('Kitui','Mwingi Central','Mwingi Central, Kitui', false),
('Kitui','Mwingi North',  'Mwingi North, Kitui',  false),
('Kitui','Mwingi West',   'Mwingi West, Kitui',   false),

-- ── 21. NYANDARUA ─────────────────────────────────────────────────
('Nyandarua','Kinangop',     'Kinangop, Nyandarua',     false),
('Nyandarua','Kipipiri',     'Kipipiri, Nyandarua',     false),
('Nyandarua','Ndaragwa',     'Ndaragwa, Nyandarua',     false),
('Nyandarua','Ol Kalou',     'Ol Kalou, Nyandarua',     false),
('Nyandarua','Ol Joro Orok', 'Ol Joro Orok, Nyandarua', false),

-- ── 22. NYERI ─────────────────────────────────────────────────────
('Nyeri','Kieni East',    'Kieni East, Nyeri',    false),
('Nyeri','Kieni West',    'Kieni West, Nyeri',    false),
('Nyeri','Mathira East',  'Mathira East, Nyeri',  false),
('Nyeri','Mathira West',  'Mathira West, Nyeri',  false),
('Nyeri','Mukurweini',    'Mukurweini, Nyeri',    false),
('Nyeri','Nyeri Town',    'Nyeri Town, Nyeri',    false),
('Nyeri','Tetu',          'Tetu, Nyeri',          false),

-- ── 23. KIRINYAGA ─────────────────────────────────────────────────
('Kirinyaga','Gichugu',           'Gichugu, Kirinyaga',           false),
('Kirinyaga','Kirinyaga Central', 'Kirinyaga Central, Kirinyaga', false),
('Kirinyaga','Mwea East',         'Mwea East, Kirinyaga',         false),
('Kirinyaga','Mwea West',         'Mwea West, Kirinyaga',         false),
('Kirinyaga','Ndia',              'Ndia, Kirinyaga',              false),

-- ── 24. MURANG'A ──────────────────────────────────────────────────
('Muranga','Gatanga',       'Gatanga, Muranga',       false),
('Muranga','Kahuro',        'Kahuro, Muranga',        false),
('Muranga','Kandara',       'Kandara, Muranga',       false),
('Muranga','Kangema',       'Kangema, Muranga',       false),
('Muranga','Kigumo',        'Kigumo, Muranga',        false),
('Muranga','Kiharu',        'Kiharu, Muranga',        false),
('Muranga','Mathioya',      'Mathioya, Muranga',      false),
('Muranga','Muranga South', 'Muranga South, Muranga', false),

-- ── 25. NAKURU ────────────────────────────────────────────────────
('Nakuru','Bahati',           'Bahati, Nakuru',           false),
('Nakuru','Gilgil',           'Gilgil, Nakuru',           false),
('Nakuru','Kuresoi North',    'Kuresoi North, Nakuru',    false),
('Nakuru','Kuresoi South',    'Kuresoi South, Nakuru',    false),
('Nakuru','Molo',             'Molo, Nakuru',             false),
('Nakuru','Naivasha',         'Naivasha, Nakuru',         false),
('Nakuru','Nakuru Town East', 'Nakuru Town East, Nakuru', false),
('Nakuru','Nakuru Town West', 'Nakuru Town West, Nakuru', false),
('Nakuru','Njoro',            'Njoro, Nakuru',            false),
('Nakuru','Rongai',           'Rongai, Nakuru',           false),
('Nakuru','Subukia',          'Subukia, Nakuru',          false),

-- ── 26. NAROK ─────────────────────────────────────────────────────
('Narok','Narok East',     'Narok East, Narok',     false),
('Narok','Narok North',    'Narok North, Narok',    false),
('Narok','Narok South',    'Narok South, Narok',    false),
('Narok','Narok West',     'Narok West, Narok',     false),
('Narok','Transmara East', 'Transmara East, Narok', false),
('Narok','Transmara West', 'Transmara West, Narok', false),

-- ── 27. LAIKIPIA ──────────────────────────────────────────────────
('Laikipia','Laikipia Central', 'Laikipia Central, Laikipia', false),
('Laikipia','Laikipia East',    'Laikipia East, Laikipia',    false),
('Laikipia','Laikipia North',   'Laikipia North, Laikipia',   false),
('Laikipia','Laikipia West',    'Laikipia West, Laikipia',    false),
('Laikipia','Nyahururu',        'Nyahururu, Laikipia',        false),

-- ── 28. BARINGO ───────────────────────────────────────────────────
('Baringo','Baringo Central', 'Baringo Central, Baringo', false),
('Baringo','Baringo North',   'Baringo North, Baringo',   false),
('Baringo','Baringo South',   'Baringo South, Baringo',   false),
('Baringo','Eldama Ravine',   'Eldama Ravine, Baringo',   false),
('Baringo','Mogotio',         'Mogotio, Baringo',         false),
('Baringo','Tiaty',           'Tiaty, Baringo',           false),

-- ── 29. UASIN GISHU ───────────────────────────────────────────────
('Uasin Gishu','Ainabkoi', 'Ainabkoi, Uasin Gishu', false),
('Uasin Gishu','Kapseret', 'Kapseret, Uasin Gishu', false),
('Uasin Gishu','Kesses',   'Kesses, Uasin Gishu',   false),
('Uasin Gishu','Moiben',   'Moiben, Uasin Gishu',   false),
('Uasin Gishu','Soy',      'Soy, Uasin Gishu',      false),
('Uasin Gishu','Turbo',    'Turbo, Uasin Gishu',    false),

-- ── 30. ELGEYO-MARAKWET ───────────────────────────────────────────
('Elgeyo-Marakwet','Keiyo North',   'Keiyo North, Elgeyo-Marakwet',   false),
('Elgeyo-Marakwet','Keiyo South',   'Keiyo South, Elgeyo-Marakwet',   false),
('Elgeyo-Marakwet','Marakwet East', 'Marakwet East, Elgeyo-Marakwet', false),
('Elgeyo-Marakwet','Marakwet West', 'Marakwet West, Elgeyo-Marakwet', false),

-- ── 31. NANDI ─────────────────────────────────────────────────────
('Nandi','Aldai',       'Aldai, Nandi',       false),
('Nandi','Chesumei',    'Chesumei, Nandi',    false),
('Nandi','Emgwen',      'Emgwen, Nandi',      false),
('Nandi','Mosop',       'Mosop, Nandi',       false),
('Nandi','Nandi Hills', 'Nandi Hills, Nandi', false),
('Nandi','Tindiret',    'Tindiret, Nandi',    false),

-- ── 32. TRANS-NZOIA ───────────────────────────────────────────────
('Trans-Nzoia','Cherangany',      'Cherangany, Trans-Nzoia',      false),
('Trans-Nzoia','Endebess',        'Endebess, Trans-Nzoia',        false),
('Trans-Nzoia','Kiminini',        'Kiminini, Trans-Nzoia',        false),
('Trans-Nzoia','Kwanza',          'Kwanza, Trans-Nzoia',          false),
('Trans-Nzoia','Trans Nzoia East','Trans Nzoia East, Trans-Nzoia', false),
('Trans-Nzoia','Trans Nzoia West','Trans Nzoia West, Trans-Nzoia', false),

-- ── 33. WEST POKOT ────────────────────────────────────────────────
('West Pokot','Central Pokot', 'Central Pokot, West Pokot', false),
('West Pokot','Kacheliba',     'Kacheliba, West Pokot',     false),
('West Pokot','Pokot South',   'Pokot South, West Pokot',   false),
('West Pokot','West Pokot',    'West Pokot Town, West Pokot', false),

-- ── 34. SAMBURU ───────────────────────────────────────────────────
('Samburu','Samburu East',  'Samburu East, Samburu',  false),
('Samburu','Samburu North', 'Samburu North, Samburu', false),
('Samburu','Samburu West',  'Samburu West, Samburu',  false),

-- ── 35. TURKANA ───────────────────────────────────────────────────
('Turkana','Kibish',         'Kibish, Turkana',         false),
('Turkana','Loima',          'Loima, Turkana',          false),
('Turkana','Turkana Central','Turkana Central, Turkana', false),
('Turkana','Turkana East',   'Turkana East, Turkana',   false),
('Turkana','Turkana North',  'Turkana North, Turkana',  false),
('Turkana','Turkana South',  'Turkana South, Turkana',  false),
('Turkana','Turkana West',   'Turkana West, Turkana',   false),

-- ── 36. KERICHO ───────────────────────────────────────────────────
('Kericho','Ainamoi',        'Ainamoi, Kericho',        false),
('Kericho','Belgut',         'Belgut, Kericho',         false),
('Kericho','Bureti',         'Bureti, Kericho',         false),
('Kericho','Kipkelion East', 'Kipkelion East, Kericho', false),
('Kericho','Kipkelion West', 'Kipkelion West, Kericho', false),
('Kericho','Soin/Sigowet',   'Soin/Sigowet, Kericho',   false),

-- ── 37. BOMET ─────────────────────────────────────────────────────
('Bomet','Bomet Central', 'Bomet Central, Bomet', false),
('Bomet','Bomet East',    'Bomet East, Bomet',    false),
('Bomet','Chepalungu',    'Chepalungu, Bomet',    false),
('Bomet','Konoin',        'Konoin, Bomet',        false),
('Bomet','Sotik',         'Sotik, Bomet',         false),

-- ── 38. KAKAMEGA ──────────────────────────────────────────────────
('Kakamega','Butere',       'Butere, Kakamega',       false),
('Kakamega','Ikolomani',    'Ikolomani, Kakamega',    false),
('Kakamega','Khwisero',     'Khwisero, Kakamega',     false),
('Kakamega','Likuyani',     'Likuyani, Kakamega',     false),
('Kakamega','Lugari',       'Lugari, Kakamega',       false),
('Kakamega','Lurambi',      'Lurambi, Kakamega',      false),
('Kakamega','Malava',       'Malava, Kakamega',       false),
('Kakamega','Matungu',      'Matungu, Kakamega',      false),
('Kakamega','Mumias East',  'Mumias East, Kakamega',  false),
('Kakamega','Mumias West',  'Mumias West, Kakamega',  false),
('Kakamega','Navakholo',    'Navakholo, Kakamega',    false),
('Kakamega','Shinyalu',     'Shinyalu, Kakamega',     false),

-- ── 39. VIHIGA ────────────────────────────────────────────────────
('Vihiga','Emuhaya', 'Emuhaya, Vihiga', false),
('Vihiga','Hamisi',  'Hamisi, Vihiga',  false),
('Vihiga','Luanda',  'Luanda, Vihiga',  false),
('Vihiga','Sabatia', 'Sabatia, Vihiga', false),
('Vihiga','Vihiga',  'Vihiga Town',     false),

-- ── 40. BUNGOMA ───────────────────────────────────────────────────
('Bungoma','Bumula',      'Bumula, Bungoma',      false),
('Bungoma','Kabuchai',    'Kabuchai, Bungoma',    false),
('Bungoma','Kanduyi',     'Kanduyi, Bungoma',     false),
('Bungoma','Kimilili',    'Kimilili, Bungoma',    false),
('Bungoma','Mt Elgon',    'Mt Elgon, Bungoma',    false),
('Bungoma','Sirisia',     'Sirisia, Bungoma',     false),
('Bungoma','Tongaren',    'Tongaren, Bungoma',    false),
('Bungoma','Webuye East', 'Webuye East, Bungoma', false),
('Bungoma','Webuye West', 'Webuye West, Bungoma', false),

-- ── 41. BUSIA ─────────────────────────────────────────────────────
('Busia','Budalangi',  'Budalangi, Busia',  false),
('Busia','Butula',     'Butula, Busia',     false),
('Busia','Funyula',    'Funyula, Busia',    false),
('Busia','Nambale',    'Nambale, Busia',    false),
('Busia','Teso North', 'Teso North, Busia', false),
('Busia','Teso South', 'Teso South, Busia', false),

-- ── 42. SIAYA ─────────────────────────────────────────────────────
('Siaya','Alego Usonga', 'Alego Usonga, Siaya', false),
('Siaya','Bondo',        'Bondo, Siaya',        false),
('Siaya','Gem',          'Gem, Siaya',          false),
('Siaya','Rarieda',      'Rarieda, Siaya',      false),
('Siaya','Ugenya',       'Ugenya, Siaya',       false),
('Siaya','Ugunja',       'Ugunja, Siaya',       false),

-- ── 43. KISUMU ────────────────────────────────────────────────────
('Kisumu','Kisumu Central', 'Kisumu Central, Kisumu', false),
('Kisumu','Kisumu East',    'Kisumu East, Kisumu',    false),
('Kisumu','Kisumu West',    'Kisumu West, Kisumu',    false),
('Kisumu','Muhoroni',       'Muhoroni, Kisumu',       false),
('Kisumu','Nyakach',        'Nyakach, Kisumu',        false),
('Kisumu','Nyando',         'Nyando, Kisumu',         false),
('Kisumu','Seme',           'Seme, Kisumu',           false),

-- ── 44. HOMA BAY ──────────────────────────────────────────────────
('Homa Bay','Homabay Town',       'Homabay Town, Homa Bay',       false),
('Homa Bay','Kabondo Kasipul',    'Kabondo Kasipul, Homa Bay',    false),
('Homa Bay','Karachuonyo',        'Karachuonyo, Homa Bay',        false),
('Homa Bay','Kasipul',            'Kasipul, Homa Bay',            false),
('Homa Bay','Mbita',              'Mbita, Homa Bay',              false),
('Homa Bay','Ndhiwa',             'Ndhiwa, Homa Bay',             false),
('Homa Bay','Rangwe',             'Rangwe, Homa Bay',             false),
('Homa Bay','Suba North',         'Suba North, Homa Bay',         false),
('Homa Bay','Suba South',         'Suba South, Homa Bay',         false),

-- ── 45. MIGORI ────────────────────────────────────────────────────
('Migori','Awendo',    'Awendo, Migori',    false),
('Migori','Kuria East','Kuria East, Migori', false),
('Migori','Kuria West','Kuria West, Migori', false),
('Migori','Mabera',    'Mabera, Migori',    false),
('Migori','Ntimaru',   'Ntimaru, Migori',   false),
('Migori','Rongo',     'Rongo, Migori',     false),
('Migori','Suna East', 'Suna East, Migori', false),
('Migori','Suna West', 'Suna West, Migori', false),
('Migori','Uriri',     'Uriri, Migori',     false),

-- ── 46. KISII ─────────────────────────────────────────────────────
('Kisii','Bobasi',                 'Bobasi, Kisii',                 false),
('Kisii','Bomachoge Borabu',       'Bomachoge Borabu, Kisii',       false),
('Kisii','Bomachoge Chache',       'Bomachoge Chache, Kisii',       false),
('Kisii','Bonchari',               'Bonchari, Kisii',               false),
('Kisii','Kitutu Chache North',    'Kitutu Chache North, Kisii',    false),
('Kisii','Kitutu Chache South',    'Kitutu Chache South, Kisii',    false),
('Kisii','Nyaribari Chache',       'Nyaribari Chache, Kisii',       false),
('Kisii','Nyaribari Masaba',       'Nyaribari Masaba, Kisii',       false),
('Kisii','South Mugirango',        'South Mugirango, Kisii',        false),

-- ── 47. NYAMIRA ───────────────────────────────────────────────────
('Nyamira','Borabu',        'Borabu, Nyamira',        false),
('Nyamira','Manga',         'Manga, Nyamira',         false),
('Nyamira','Masaba North',  'Masaba North, Nyamira',  false),
('Nyamira','Nyamira North', 'Nyamira North, Nyamira', false),
('Nyamira','Nyamira South', 'Nyamira South, Nyamira', false)

ON CONFLICT (county, sub_county) DO NOTHING;
