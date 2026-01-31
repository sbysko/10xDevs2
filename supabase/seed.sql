-- ============================================================================
-- Vocabulary Seed Data - "Dopasuj Obrazek do Słowa"
-- ============================================================================
--
-- Data dodania: 2026-01-31
-- Język: Polski (pl)
-- Grupa wiekowa: 4-6 lat
-- Liczba słów: 250 (50 słów × 5 kategorii)
--
-- Kategorie:
-- 1. zwierzeta (Zwierzęta) - 50 słów
-- 2. owoce_warzywa (Owoce i Warzywa) - 50 słów
-- 3. pojazdy (Pojazdy) - 50 słów
-- 4. kolory_ksztalty (Kolory i Kształty) - 50 słów
-- 5. przedmioty_codzienne (Przedmioty Codziennego Użytku) - 50 słów
--
-- Difficulty Levels:
-- 1 = Łatwy (proste, powszechne słowa)
-- 2 = Średni (mniej powszechne, ale znane)
-- 3 = Trudny (rzadziej używane, wymagające nauki)
--
-- Image Path Format: vocabulary/pl/{category}/{word_slug}.jpg
-- Uwaga: Obrazy będą dodane później do Supabase Storage
-- ============================================================================

-- ============================================================================
-- KATEGORIA 1: ZWIERZĘTA (50 słów)
-- ============================================================================

INSERT INTO vocabulary (word_text, category, language_code, image_path, difficulty_level)
VALUES
  -- Zwierzęta domowe i gospodarskie (łatwe, 1)
  ('Pies', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/pies.jpg', 1),
  ('Kot', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kot.jpg', 1),
  ('Koń', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kon.jpg', 1),
  ('Krowa', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/krowa.jpg', 1),
  ('Świnia', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/swinia.jpg', 1),
  ('Kura', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kura.jpg', 1),
  ('Kaczka', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kaczka.jpg', 1),
  ('Gęś', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/ges.jpg', 1),
  ('Królik', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/krolik.jpg', 1),
  ('Owca', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/owca.jpg', 1),

  -- Zwierzęta dzikie popularne (łatwe, 1)
  ('Słoń', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/slon.jpg', 1),
  ('Lew', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/lew.jpg', 1),
  ('Tygrys', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/tygrys.jpg', 1),
  ('Niedźwiedź', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/niedzwiedz.jpg', 1),
  ('Małpa', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/malpa.jpg', 1),
  ('Żyrafa', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/zyrafa.jpg', 1),
  ('Zebra', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/zebra.jpg', 1),
  ('Lis', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/lis.jpg', 1),
  ('Wilk', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/wilk.jpg', 1),
  ('Jeż', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/jez.jpg', 1),

  -- Ptaki (łatwe-średnie, 1-2)
  ('Ptak', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/ptak.jpg', 1),
  ('Wróbel', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/wrobel.jpg', 2),
  ('Wrona', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/wrona.jpg', 2),
  ('Sowa', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/sowa.jpg', 1),
  ('Orzeł', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/orzel.jpg', 2),
  ('Bocian', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/bocian.jpg', 1),
  ('Gołąb', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/golab.jpg', 2),
  ('Papuga', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/papuga.jpg', 1),
  ('Pingwin', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/pingwin.jpg', 1),
  ('Jaskółka', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/jaskolka.jpg', 2),

  -- Owady i małe zwierzęta (średnie, 2)
  ('Motyl', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/motyl.jpg', 1),
  ('Pszczoła', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/pszczola.jpg', 2),
  ('Mrówka', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/mrowka.jpg', 2),
  ('Biedronka', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/biedronka.jpg', 2),
  ('Pająk', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/pajak.jpg', 2),
  ('Mucha', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/mucha.jpg', 2),
  ('Ślimak', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/slimak.jpg', 2),

  -- Zwierzęta wodne (łatwe-średnie, 1-2)
  ('Ryba', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/ryba.jpg', 1),
  ('Delfin', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/delfin.jpg', 1),
  ('Rekin', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/rekin.jpg', 1),
  ('Żółw', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/zolw.jpg', 1),
  ('Żaba', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/zaba.jpg', 1),
  ('Krokodyl', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/krokodyl.jpg', 2),
  ('Wieloryb', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/wieloryb.jpg', 2),
  ('Ośmiornica', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/osmiornica.jpg', 2),

  -- Zwierzęta egzotyczne i inne (średnie-trudne, 2-3)
  ('Kangur', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kangur.jpg', 2),
  ('Hipopotam', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/hipopotam.jpg', 2),
  ('Nosorożec', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/nosorozec.jpg', 2),
  ('Wielbłąd', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/wielblad.jpg', 2),
  ('Pingwin', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/pingwin.jpg', 1);

-- ============================================================================
-- KATEGORIA 2: OWOCE I WARZYWA (50 słów)
-- ============================================================================

INSERT INTO vocabulary (word_text, category, language_code, image_path, difficulty_level)
VALUES
  -- Owoce popularne (łatwe, 1)
  ('Jabłko', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/jablko.jpg', 1),
  ('Gruszka', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/gruszka.jpg', 1),
  ('Banan', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/banan.jpg', 1),
  ('Pomarańcza', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/pomarancza.jpg', 1),
  ('Cytryna', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/cytryna.jpg', 1),
  ('Truskawka', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/truskawka.jpg', 1),
  ('Winogrono', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/winogrono.jpg', 1),
  ('Arbuz', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/arbuz.jpg', 1),
  ('Malina', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/malina.jpg', 1),
  ('Śliwka', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/sliwka.jpg', 1),

  -- Owoce sezonowe (łatwe-średnie, 1-2)
  ('Wiśnia', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/wisnia.jpg', 1),
  ('Czereśnia', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/czeresnia.jpg', 2),
  ('Brzoskwinia', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/brzoskwinia.jpg', 2),
  ('Morela', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/morela.jpg', 2),
  ('Ananas', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/ananas.jpg', 1),
  ('Kiwi', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/kiwi.jpg', 2),
  ('Mango', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/mango.jpg', 2),
  ('Melon', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/melon.jpg', 1),
  ('Jagoda', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/jagoda.jpg', 2),
  ('Borówka', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/borowka.jpg', 2),

  -- Warzywa podstawowe (łatwe, 1)
  ('Marchew', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/marchew.jpg', 1),
  ('Ziemniak', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/ziemniak.jpg', 1),
  ('Pomidor', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/pomidor.jpg', 1),
  ('Ogórek', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/ogorek.jpg', 1),
  ('Kapusta', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/kapusta.jpg', 1),
  ('Sałata', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/salata.jpg', 1),
  ('Cebula', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/cebula.jpg', 1),
  ('Czosnek', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/czosnek.jpg', 2),
  ('Papryka', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/papryka.jpg', 1),
  ('Dynia', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/dynia.jpg', 1),

  -- Warzywa mniej popularne (średnie, 2)
  ('Brokuł', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/brokul.jpg', 2),
  ('Kalafior', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/kalafior.jpg', 2),
  ('Szpinak', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/szpinak.jpg', 2),
  ('Burak', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/burak.jpg', 2),
  ('Rzodkiewka', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/rzodkiewka.jpg', 2),
  ('Groszek', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/groszek.jpg', 1),
  ('Fasola', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/fasola.jpg', 2),
  ('Kukurydza', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/kukurydza.jpg', 1),
  ('Bakłażan', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/baklazan.jpg', 2),
  ('Cukinia', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/cukinia.jpg', 2),

  -- Owoce i warzywa dodatkowe (średnie-trudne, 2-3)
  ('Awokado', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/awokado.jpg', 2),
  ('Granatrumień', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/granat.jpg', 3),
  ('Liczi', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/liczi.jpg', 3),
  ('Karczoch', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/karczoch.jpg', 3),
  ('Szparagi', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/szparagi.jpg', 2),
  ('Por', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/por.jpg', 2),
  ('Seler', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/seler.jpg', 2),
  ('Pietruszka', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/pietruszka.jpg', 2),
  ('Rabarbar', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/rabarbar.jpg', 3),
  ('Agrest', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/agrest.jpg', 3);

-- ============================================================================
-- KATEGORIA 3: POJAZDY (50 słów)
-- ============================================================================

INSERT INTO vocabulary (word_text, category, language_code, image_path, difficulty_level)
VALUES
  -- Pojazdy codzienne (łatwe, 1)
  ('Samochód', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/samochod.jpg', 1),
  ('Autobus', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/autobus.jpg', 1),
  ('Tramwaj', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/tramwaj.jpg', 1),
  ('Rower', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/rower.jpg', 1),
  ('Motocykl', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/motocykl.jpg', 1),
  ('Hulajnoga', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/hulajnoga.jpg', 1),
  ('Wózek', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/wozek.jpg', 1),
  ('Ciężarówka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/ciezarowka.jpg', 1),
  ('Taxi', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/taxi.jpg', 1),
  ('Ambulans', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/ambulans.jpg', 1),

  -- Pojazdy specjalne (łatwe-średnie, 1-2)
  ('Straż pożarna', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/straz_pozarna.jpg', 1),
  ('Policja', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/policja.jpg', 1),
  ('Śmieciarka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/smieciarka.jpg', 1),
  ('Koparka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/koparka.jpg', 1),
  ('Traktor', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/traktor.jpg', 1),
  ('Kombajn', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/kombajn.jpg', 2),
  ('Dźwig', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/dzwig.jpg', 1),
  ('Betoniarka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/betoniarka.jpg', 2),
  ('Wózek widłowy', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/wozek_widlowy.jpg', 2),
  ('Karetka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/karetka.jpg', 1),

  -- Transport kolejowy (łatwe-średnie, 1-2)
  ('Pociąg', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/pociag.jpg', 1),
  ('Metro', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/metro.jpg', 1),
  ('Kolejka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/kolejka.jpg', 2),
  ('Lokomotywa', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/lokomotywa.jpg', 2),
  ('Wagon', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/wagon.jpg', 2),

  -- Transport wodny (łatwe-średnie, 1-2)
  ('Statek', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/statek.jpg', 1),
  ('Łódź', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/lodz.jpg', 1),
  ('Jacht', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/jacht.jpg', 2),
  ('Żaglówka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/zaglowka.jpg', 2),
  ('Prom', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/prom.jpg', 2),
  ('Kajak', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/kajak.jpg', 2),
  ('Motorówka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/motorowka.jpg', 2),
  ('Okręt', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/okret.jpg', 2),
  ('Łódź podwodna', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/lodz_podwodna.jpg', 2),

  -- Transport lotniczy (łatwe-średnie, 1-2)
  ('Samolot', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/samolot.jpg', 1),
  ('Helikopter', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/helikopter.jpg', 1),
  ('Balon', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/balon.jpg', 1),
  ('Rakieta', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/rakieta.jpg', 1),
  ('Spadochron', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/spadochron.jpg', 2),
  ('Szybowiec', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/szybowiec.jpg', 2),
  ('Sterowiec', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/sterowiec.jpg', 3),

  -- Pojazdy sportowe i rekreacyjne (średnie, 2)
  ('Quad', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/quad.jpg', 2),
  ('Skuter', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/skuter.jpg', 2),
  ('Deskorolka', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/deskorolka.jpg', 1),
  ('Rolki', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/rolki.jpg', 1),
  ('Narty', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/narty.jpg', 1),
  ('Snowboard', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/snowboard.jpg', 2),
  ('Sanki', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/sanki.jpg', 1),
  ('Wrotki', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/wrotki.jpg', 2);

-- ============================================================================
-- KATEGORIA 4: KOLORY I KSZTAŁTY (50 słów)
-- ============================================================================

INSERT INTO vocabulary (word_text, category, language_code, image_path, difficulty_level)
VALUES
  -- Kolory podstawowe (łatwe, 1)
  ('Czerwony', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/czerwony.jpg', 1),
  ('Niebieski', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/niebieski.jpg', 1),
  ('Żółty', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/zolty.jpg', 1),
  ('Zielony', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/zielony.jpg', 1),
  ('Pomarańczowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/pomaranczowy.jpg', 1),
  ('Fioletowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/fioletowy.jpg', 1),
  ('Różowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/rozowy.jpg', 1),
  ('Czarny', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/czarny.jpg', 1),
  ('Biały', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/bialy.jpg', 1),
  ('Szary', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/szary.jpg', 1),

  -- Kolory dodatkowe (średnie, 2)
  ('Brązowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/brazowy.jpg', 1),
  ('Złoty', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/zloty.jpg', 2),
  ('Srebrny', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/srebrny.jpg', 2),
  ('Turkusowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/turkusowy.jpg', 2),
  ('Beżowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/bezowy.jpg', 2),
  ('Bordowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/bordowy.jpg', 2),
  ('Granatowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/granatowy.jpg', 2),
  ('Jasny', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/jasny.jpg', 1),
  ('Ciemny', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/ciemny.jpg', 1),
  ('Kolorowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/kolorowy.jpg', 1),

  -- Kształty podstawowe 2D (łatwe, 1)
  ('Koło', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/kolo.jpg', 1),
  ('Kwadrat', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/kwadrat.jpg', 1),
  ('Trójkąt', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/trojkat.jpg', 1),
  ('Prostokąt', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/prostokat.jpg', 1),
  ('Owal', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/owal.jpg', 1),
  ('Gwiazda', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/gwiazda.jpg', 1),
  ('Serce', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/serce.jpg', 1),
  ('Półksiężyc', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/polksiemzyc.jpg', 2),
  ('Romb', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/romb.jpg', 2),
  ('Pięciokąt', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/pi eciokat.jpg', 2),

  -- Kształty 3D (średnie-trudne, 2-3)
  ('Kula', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/kula.jpg', 1),
  ('Sześcian', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/szescian.jpg', 2),
  ('Stożek', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/stozek.jpg', 2),
  ('Walec', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/walec.jpg', 2),
  ('Piramida', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/piramida.jpg', 2),
  ('Prostopadłościan', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/prostopadloscian.jpg', 3),

  -- Cechy kształtów (średnie, 2)
  ('Duży', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/duzy.jpg', 1),
  ('Mały', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/maly.jpg', 1),
  ('Okrągły', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/okragly.jpg', 1),
  ('Kwadratowy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/kwadratowy.jpg', 2),
  ('Długi', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/dlugi.jpg', 1),
  ('Krótki', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/krotki.jpg', 1),
  ('Szeroki', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/szeroki.jpg', 1),
  ('Wąski', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/waski.jpg', 1),
  ('Gruby', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/gruby.jpg', 1),
  ('Cienki', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/cienki.jpg', 1),
  ('Wysoki', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/wysoki.jpg', 1),
  ('Niski', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/niski.jpg', 1),
  ('Równy', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/rowny.jpg', 2),
  ('Nierówny', 'kolory_ksztalty', 'pl', 'vocabulary/pl/kolory_ksztalty/nierowny.jpg', 2);

-- ============================================================================
-- KATEGORIA 5: PRZEDMIOTY CODZIENNE (50 słów)
-- ============================================================================

INSERT INTO vocabulary (word_text, category, language_code, image_path, difficulty_level)
VALUES
  -- Meble (łatwe, 1)
  ('Stół', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/stol.jpg', 1),
  ('Krzesło', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/krzeslo.jpg', 1),
  ('Łóżko', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/lozko.jpg', 1),
  ('Szafa', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/szafa.jpg', 1),
  ('Fotel', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/fotel.jpg', 1),
  ('Kanapa', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/kanapa.jpg', 1),
  ('Biurko', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/biurko.jpg', 1),
  ('Półka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/polka.jpg', 1),
  ('Komoda', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/komoda.jpg', 2),
  ('Szafka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/szafka.jpg', 1),

  -- Naczynia i sztućce (łatwe-średnie, 1-2)
  ('Talerz', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/talerz.jpg', 1),
  ('Kubek', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/kubek.jpg', 1),
  ('Szklanka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/szklanka.jpg', 1),
  ('Łyżka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/lyzka.jpg', 1),
  ('Widelec', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/widelec.jpg', 1),
  ('Nóż', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/noz.jpg', 1),
  ('Miska', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/miska.jpg', 1),
  ('Garnek', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/garnek.jpg', 1),
  ('Patelnia', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/patelnia.jpg', 1),
  ('Czajnik', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/czajnik.jpg', 1),

  -- Zabawki (łatwe, 1)
  ('Piłka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/pilka.jpg', 1),
  ('Lalka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/lalka.jpg', 1),
  ('Miś', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/mis.jpg', 1),
  ('Klocki', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/klocki.jpg', 1),
  ('Puzzle', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/puzzle.jpg', 1),
  ('Kredki', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/kredki.jpg', 1),
  ('Farby', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/farby.jpg', 1),
  ('Plastelina', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/plastelina.jpg', 2),

  -- Ubrania (łatwe-średnie, 1-2)
  ('Spodnie', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/spodnie.jpg', 1),
  ('Koszula', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/koszula.jpg', 1),
  ('Sukienka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/sukienka.jpg', 1),
  ('Buty', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/buty.jpg', 1),
  ('Czapka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/czapka.jpg', 1),
  ('Rękawiczki', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/rekawiczki.jpg', 1),
  ('Szalik', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/szalik.jpg', 1),
  ('Kurtka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/kurtka.jpg', 1),
  ('Sweter', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/sweter.jpg', 1),
  ('Skarpetki', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/skarpetki.jpg', 1),

  -- Inne przedmioty (średnie, 2)
  ('Książka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/ksiazka.jpg', 1),
  ('Zeszyt', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/zeszyt.jpg', 1),
  ('Długopis', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/dlugopis.jpg', 1),
  ('Ołówek', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/olowek.jpg', 1),
  ('Gumka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/gumka.jpg', 1),
  ('Nożyczki', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/nozyczki.jpg', 1),
  ('Klej', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/klej.jpg', 1),
  ('Linijka', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/linijka.jpg', 2),
  ('Plecak', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/plecak.jpg', 1),
  ('Torba', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/torba.jpg', 1),
  ('Parasol', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/parasol.jpg', 1);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this query to verify the seed was successful:
--
-- SELECT
--   category,
--   COUNT(*) as word_count,
--   AVG(difficulty_level)::numeric(3,2) as avg_difficulty
-- FROM vocabulary
-- WHERE language_code = 'pl'
-- GROUP BY category
-- ORDER BY category;
--
-- Expected result:
-- - Each category should have 50 words
-- - Total: 250 words
-- - Average difficulty should be between 1.0 and 2.5
-- ============================================================================
