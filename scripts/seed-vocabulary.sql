-- Seed Vocabulary Data for Testing
--
-- This script populates the vocabulary table with 250 Polish words
-- across 5 categories (50 words each)
--
-- Categories:
-- 1. zwierzeta (Animals) - 50 words
-- 2. owoce_warzywa (Fruits & Vegetables) - 50 words
-- 3. pojazdy (Vehicles) - 50 words
-- 4. kolory_ksztalty (Colors & Shapes) - 50 words
-- 5. przedmioty_codzienne (Everyday Objects) - 50 words
--
-- Usage:
-- 1. Via Supabase Studio: http://localhost:54323 → SQL Editor → Paste & Run
-- 2. Via psql: psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/seed-vocabulary.sql

-- ============================================================================
-- CLEAR EXISTING DATA (Optional - uncomment to reset)
-- ============================================================================

-- DELETE FROM public.vocabulary WHERE language_code = 'pl';

-- ============================================================================
-- CATEGORY 1: ZWIERZĘTA (Animals) - 50 words
-- ============================================================================

INSERT INTO public.vocabulary (word_text, category, language_code, image_path, difficulty_level) VALUES
('pies', 'zwierzeta', 'pl', 'vocabulary/animals/dog.jpg', 1),
('kot', 'zwierzeta', 'pl', 'vocabulary/animals/cat.jpg', 1),
('koń', 'zwierzeta', 'pl', 'vocabulary/animals/horse.jpg', 1),
('krowa', 'zwierzeta', 'pl', 'vocabulary/animals/cow.jpg', 1),
('świnia', 'zwierzeta', 'pl', 'vocabulary/animals/pig.jpg', 1),
('owca', 'zwierzeta', 'pl', 'vocabulary/animals/sheep.jpg', 1),
('koza', 'zwierzeta', 'pl', 'vocabulary/animals/goat.jpg', 1),
('kurczak', 'zwierzeta', 'pl', 'vocabulary/animals/chicken.jpg', 1),
('kaczka', 'zwierzeta', 'pl', 'vocabulary/animals/duck.jpg', 1),
('gęś', 'zwierzeta', 'pl', 'vocabulary/animals/goose.jpg', 1),
('słoń', 'zwierzeta', 'pl', 'vocabulary/animals/elephant.jpg', 2),
('żyrafa', 'zwierzeta', 'pl', 'vocabulary/animals/giraffe.jpg', 2),
('lew', 'zwierzeta', 'pl', 'vocabulary/animals/lion.jpg', 2),
('tygrys', 'zwierzeta', 'pl', 'vocabulary/animals/tiger.jpg', 2),
('niedźwiedź', 'zwierzeta', 'pl', 'vocabulary/animals/bear.jpg', 2),
('wilk', 'zwierzeta', 'pl', 'vocabulary/animals/wolf.jpg', 2),
('lis', 'zwierzeta', 'pl', 'vocabulary/animals/fox.jpg', 2),
('zając', 'zwierzeta', 'pl', 'vocabulary/animals/hare.jpg', 2),
('królik', 'zwierzeta', 'pl', 'vocabulary/animals/rabbit.jpg', 1),
('mysz', 'zwierzeta', 'pl', 'vocabulary/animals/mouse.jpg', 1),
('szczur', 'zwierzeta', 'pl', 'vocabulary/animals/rat.jpg', 2),
('chomik', 'zwierzeta', 'pl', 'vocabulary/animals/hamster.jpg', 2),
('świnka morska', 'zwierzeta', 'pl', 'vocabulary/animals/guinea_pig.jpg', 3),
('małpa', 'zwierzeta', 'pl', 'vocabulary/animals/monkey.jpg', 2),
('goryl', 'zwierzeta', 'pl', 'vocabulary/animals/gorilla.jpg', 2),
('panda', 'zwierzeta', 'pl', 'vocabulary/animals/panda.jpg', 2),
('koala', 'zwierzeta', 'pl', 'vocabulary/animals/koala.jpg', 2),
('kangur', 'zwierzeta', 'pl', 'vocabulary/animals/kangaroo.jpg', 2),
('zebra', 'zwierzeta', 'pl', 'vocabulary/animals/zebra.jpg', 2),
('hipopotam', 'zwierzeta', 'pl', 'vocabulary/animals/hippo.jpg', 3),
('nosorożec', 'zwierzeta', 'pl', 'vocabulary/animals/rhino.jpg', 3),
('delfin', 'zwierzeta', 'pl', 'vocabulary/animals/dolphin.jpg', 2),
('wieloryb', 'zwierzeta', 'pl', 'vocabulary/animals/whale.jpg', 2),
('rekin', 'zwierzeta', 'pl', 'vocabulary/animals/shark.jpg', 2),
('ryba', 'zwierzeta', 'pl', 'vocabulary/animals/fish.jpg', 1),
('żółw', 'zwierzeta', 'pl', 'vocabulary/animals/turtle.jpg', 2),
('jaszczurka', 'zwierzeta', 'pl', 'vocabulary/animals/lizard.jpg', 2),
('wąż', 'zwierzeta', 'pl', 'vocabulary/animals/snake.jpg', 2),
('krokodyl', 'zwierzeta', 'pl', 'vocabulary/animals/crocodile.jpg', 2),
('żaba', 'zwierzeta', 'pl', 'vocabulary/animals/frog.jpg', 1),
('ptak', 'zwierzeta', 'pl', 'vocabulary/animals/bird.jpg', 1),
('orzeł', 'zwierzeta', 'pl', 'vocabulary/animals/eagle.jpg', 2),
('sowa', 'zwierzeta', 'pl', 'vocabulary/animals/owl.jpg', 2),
('papuga', 'zwierzeta', 'pl', 'vocabulary/animals/parrot.jpg', 2),
('pingwin', 'zwierzeta', 'pl', 'vocabulary/animals/penguin.jpg', 2),
('motyl', 'zwierzeta', 'pl', 'vocabulary/animals/butterfly.jpg', 2),
('pszczoła', 'zwierzeta', 'pl', 'vocabulary/animals/bee.jpg', 2),
('mrówka', 'zwierzeta', 'pl', 'vocabulary/animals/ant.jpg', 2),
('pająk', 'zwierzeta', 'pl', 'vocabulary/animals/spider.jpg', 2),
('biedronka', 'zwierzeta', 'pl', 'vocabulary/animals/ladybug.jpg', 2);

-- ============================================================================
-- CATEGORY 2: OWOCE I WARZYWA (Fruits & Vegetables) - 50 words
-- ============================================================================

INSERT INTO public.vocabulary (word_text, category, language_code, image_path, difficulty_level) VALUES
('jabłko', 'owoce_warzywa', 'pl', 'vocabulary/food/apple.jpg', 1),
('gruszka', 'owoce_warzywa', 'pl', 'vocabulary/food/pear.jpg', 1),
('banan', 'owoce_warzywa', 'pl', 'vocabulary/food/banana.jpg', 1),
('pomarańcza', 'owoce_warzywa', 'pl', 'vocabulary/food/orange.jpg', 1),
('cytryna', 'owoce_warzywa', 'pl', 'vocabulary/food/lemon.jpg', 1),
('truskawka', 'owoce_warzywa', 'pl', 'vocabulary/food/strawberry.jpg', 1),
('malina', 'owoce_warzywa', 'pl', 'vocabulary/food/raspberry.jpg', 2),
('borówka', 'owoce_warzywa', 'pl', 'vocabulary/food/blueberry.jpg', 2),
('arbuz', 'owoce_warzywa', 'pl', 'vocabulary/food/watermelon.jpg', 1),
('melon', 'owoce_warzywa', 'pl', 'vocabulary/food/melon.jpg', 2),
('winogrona', 'owoce_warzywa', 'pl', 'vocabulary/food/grapes.jpg', 2),
('wiśnia', 'owoce_warzywa', 'pl', 'vocabulary/food/cherry.jpg', 1),
('śliwka', 'owoce_warzywa', 'pl', 'vocabulary/food/plum.jpg', 2),
('brzoskwinia', 'owoce_warzywa', 'pl', 'vocabulary/food/peach.jpg', 2),
('morela', 'owoce_warzywa', 'pl', 'vocabulary/food/apricot.jpg', 2),
('ananas', 'owoce_warzywa', 'pl', 'vocabulary/food/pineapple.jpg', 2),
('mango', 'owoce_warzywa', 'pl', 'vocabulary/food/mango.jpg', 2),
('kiwi', 'owoce_warzywa', 'pl', 'vocabulary/food/kiwi.jpg', 2),
('granat', 'owoce_warzywa', 'pl', 'vocabulary/food/pomegranate.jpg', 3),
('avocado', 'owoce_warzywa', 'pl', 'vocabulary/food/avocado.jpg', 3),
('marchew', 'owoce_warzywa', 'pl', 'vocabulary/food/carrot.jpg', 1),
('ziemniak', 'owoce_warzywa', 'pl', 'vocabulary/food/potato.jpg', 1),
('pomidor', 'owoce_warzywa', 'pl', 'vocabulary/food/tomato.jpg', 1),
('ogórek', 'owoce_warzywa', 'pl', 'vocabulary/food/cucumber.jpg', 1),
('papryka', 'owoce_warzywa', 'pl', 'vocabulary/food/pepper.jpg', 2),
('cebula', 'owoce_warzywa', 'pl', 'vocabulary/food/onion.jpg', 1),
('czosnek', 'owoce_warzywa', 'pl', 'vocabulary/food/garlic.jpg', 2),
('kapusta', 'owoce_warzywa', 'pl', 'vocabulary/food/cabbage.jpg', 2),
('sałata', 'owoce_warzywa', 'pl', 'vocabulary/food/lettuce.jpg', 2),
('brokuły', 'owoce_warzywa', 'pl', 'vocabulary/food/broccoli.jpg', 2),
('kalafior', 'owoce_warzywa', 'pl', 'vocabulary/food/cauliflower.jpg', 3),
('szpinak', 'owoce_warzywa', 'pl', 'vocabulary/food/spinach.jpg', 2),
('groszek', 'owoce_warzywa', 'pl', 'vocabulary/food/peas.jpg', 1),
('fasola', 'owoce_warzywa', 'pl', 'vocabulary/food/beans.jpg', 2),
('kukurydza', 'owoce_warzywa', 'pl', 'vocabulary/food/corn.jpg', 2),
('dynia', 'owoce_warzywa', 'pl', 'vocabulary/food/pumpkin.jpg', 2),
('cukinia', 'owoce_warzywa', 'pl', 'vocabulary/food/zucchini.jpg', 3),
('bakłażan', 'owoce_warzywa', 'pl', 'vocabulary/food/eggplant.jpg', 3),
('buraki', 'owoce_warzywa', 'pl', 'vocabulary/food/beets.jpg', 2),
('rzodkiewka', 'owoce_warzywa', 'pl', 'vocabulary/food/radish.jpg', 2),
('seler', 'owoce_warzywa', 'pl', 'vocabulary/food/celery.jpg', 2),
('por', 'owoce_warzywa', 'pl', 'vocabulary/food/leek.jpg', 3),
('szparagi', 'owoce_warzywa', 'pl', 'vocabulary/food/asparagus.jpg', 3),
('pieczarki', 'owoce_warzywa', 'pl', 'vocabulary/food/mushrooms.jpg', 2),
('orzech', 'owoce_warzywa', 'pl', 'vocabulary/food/nut.jpg', 2),
('migdał', 'owoce_warzywa', 'pl', 'vocabulary/food/almond.jpg', 3),
('orzech włoski', 'owoce_warzywa', 'pl', 'vocabulary/food/walnut.jpg', 3),
('orzech laskowy', 'owoce_warzywa', 'pl', 'vocabulary/food/hazelnut.jpg', 3),
('kokos', 'owoce_warzywa', 'pl', 'vocabulary/food/coconut.jpg', 2),
('daktyl', 'owoce_warzywa', 'pl', 'vocabulary/food/date.jpg', 3);

-- ============================================================================
-- CATEGORY 3: POJAZDY (Vehicles) - 50 words
-- ============================================================================

INSERT INTO public.vocabulary (word_text, category, language_code, image_path, difficulty_level) VALUES
('samochód', 'pojazdy', 'pl', 'vocabulary/vehicles/car.jpg', 1),
('autobus', 'pojazdy', 'pl', 'vocabulary/vehicles/bus.jpg', 1),
('tramwaj', 'pojazdy', 'pl', 'vocabulary/vehicles/tram.jpg', 1),
('pociąg', 'pojazdy', 'pl', 'vocabulary/vehicles/train.jpg', 1),
('metro', 'pojazdy', 'pl', 'vocabulary/vehicles/subway.jpg', 2),
('rower', 'pojazdy', 'pl', 'vocabulary/vehicles/bicycle.jpg', 1),
('motocykl', 'pojazdy', 'pl', 'vocabulary/vehicles/motorcycle.jpg', 2),
('hulajnoga', 'pojazdy', 'pl', 'vocabulary/vehicles/scooter.jpg', 2),
('wózek', 'pojazdy', 'pl', 'vocabulary/vehicles/stroller.jpg', 1),
('wózek inwalidzki', 'pojazdy', 'pl', 'vocabulary/vehicles/wheelchair.jpg', 3),
('samolot', 'pojazdy', 'pl', 'vocabulary/vehicles/airplane.jpg', 1),
('helikopter', 'pojazdy', 'pl', 'vocabulary/vehicles/helicopter.jpg', 2),
('rakieta', 'pojazdy', 'pl', 'vocabulary/vehicles/rocket.jpg', 2),
('statek', 'pojazdy', 'pl', 'vocabulary/vehicles/ship.jpg', 1),
('łódź', 'pojazdy', 'pl', 'vocabulary/vehicles/boat.jpg', 1),
('łódź podwodna', 'pojazdy', 'pl', 'vocabulary/vehicles/submarine.jpg', 3),
('jacht', 'pojazdy', 'pl', 'vocabulary/vehicles/yacht.jpg', 2),
('żaglówka', 'pojazdy', 'pl', 'vocabulary/vehicles/sailboat.jpg', 2),
('kajak', 'pojazdy', 'pl', 'vocabulary/vehicles/kayak.jpg', 2),
('motorówka', 'pojazdy', 'pl', 'vocabulary/vehicles/motorboat.jpg', 3),
('ciężarówka', 'pojazdy', 'pl', 'vocabulary/vehicles/truck.jpg', 2),
('ciągnik', 'pojazdy', 'pl', 'vocabulary/vehicles/tractor.jpg', 2),
('koparka', 'pojazdy', 'pl', 'vocabulary/vehicles/excavator.jpg', 2),
('dźwig', 'pojazdy', 'pl', 'vocabulary/vehicles/crane.jpg', 2),
('betoniarka', 'pojazdy', 'pl', 'vocabulary/vehicles/cement_mixer.jpg', 3),
('straż pożarna', 'pojazdy', 'pl', 'vocabulary/vehicles/fire_truck.jpg', 2),
('karetka', 'pojazdy', 'pl', 'vocabulary/vehicles/ambulance.jpg', 2),
('policja', 'pojazdy', 'pl', 'vocabulary/vehicles/police_car.jpg', 2),
('taksówka', 'pojazdy', 'pl', 'vocabulary/vehicles/taxi.jpg', 1),
('limuzyna', 'pojazdy', 'pl', 'vocabulary/vehicles/limousine.jpg', 3),
('van', 'pojazdy', 'pl', 'vocabulary/vehicles/van.jpg', 2),
('przyczepa', 'pojazdy', 'pl', 'vocabulary/vehicles/trailer.jpg', 2),
('kampera', 'pojazdy', 'pl', 'vocabulary/vehicles/camper.jpg', 3),
('quad', 'pojazdy', 'pl', 'vocabulary/vehicles/quad.jpg', 3),
('gokart', 'pojazdy', 'pl', 'vocabulary/vehicles/go_kart.jpg', 3),
('rolki', 'pojazdy', 'pl', 'vocabulary/vehicles/roller_skates.jpg', 2),
('deskorolka', 'pojazdy', 'pl', 'vocabulary/vehicles/skateboard.jpg', 2),
('snowboard', 'pojazdy', 'pl', 'vocabulary/vehicles/snowboard.jpg', 3),
('narty', 'pojazdy', 'pl', 'vocabulary/vehicles/skis.jpg', 2),
('sanki', 'pojazdy', 'pl', 'vocabulary/vehicles/sled.jpg', 1),
('balon', 'pojazdy', 'pl', 'vocabulary/vehicles/hot_air_balloon.jpg', 2),
('spadochron', 'pojazdy', 'pl', 'vocabulary/vehicles/parachute.jpg', 3),
('wózek sklepowy', 'pojazdy', 'pl', 'vocabulary/vehicles/shopping_cart.jpg', 2),
('wózek bagażowy', 'pojazdy', 'pl', 'vocabulary/vehicles/luggage_cart.jpg', 3),
('riksza', 'pojazdy', 'pl', 'vocabulary/vehicles/rickshaw.jpg', 3),
('kolejka górska', 'pojazdy', 'pl', 'vocabulary/vehicles/roller_coaster.jpg', 3),
('karuzela', 'pojazdy', 'pl', 'vocabulary/vehicles/carousel.jpg', 2),
('wózek widłowy', 'pojazdy', 'pl', 'vocabulary/vehicles/forklift.jpg', 3),
('laweta', 'pojazdy', 'pl', 'vocabulary/vehicles/tow_truck.jpg', 3),
('śmieciarka', 'pojazdy', 'pl', 'vocabulary/vehicles/garbage_truck.jpg', 2);

-- ============================================================================
-- CATEGORY 4: KOLORY I KSZTAŁTY (Colors & Shapes) - 50 words
-- ============================================================================

INSERT INTO public.vocabulary (word_text, category, language_code, image_path, difficulty_level) VALUES
('czerwony', 'kolory_ksztalty', 'pl', 'vocabulary/colors/red.jpg', 1),
('niebieski', 'kolory_ksztalty', 'pl', 'vocabulary/colors/blue.jpg', 1),
('żółty', 'kolory_ksztalty', 'pl', 'vocabulary/colors/yellow.jpg', 1),
('zielony', 'kolory_ksztalty', 'pl', 'vocabulary/colors/green.jpg', 1),
('pomarańczowy', 'kolory_ksztalty', 'pl', 'vocabulary/colors/orange.jpg', 2),
('fioletowy', 'kolory_ksztalty', 'pl', 'vocabulary/colors/purple.jpg', 2),
('różowy', 'kolory_ksztalty', 'pl', 'vocabulary/colors/pink.jpg', 1),
('brązowy', 'kolory_ksztalty', 'pl', 'vocabulary/colors/brown.jpg', 2),
('czarny', 'kolory_ksztalty', 'pl', 'vocabulary/colors/black.jpg', 1),
('biały', 'kolory_ksztalty', 'pl', 'vocabulary/colors/white.jpg', 1),
('szary', 'kolory_ksztalty', 'pl', 'vocabulary/colors/gray.jpg', 2),
('złoty', 'kolory_ksztalty', 'pl', 'vocabulary/colors/gold.jpg', 2),
('srebrny', 'kolory_ksztalty', 'pl', 'vocabulary/colors/silver.jpg', 2),
('beżowy', 'kolory_ksztalty', 'pl', 'vocabulary/colors/beige.jpg', 3),
('turkusowy', 'kolory_ksztalty', 'pl', 'vocabulary/colors/turquoise.jpg', 3),
('koło', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/circle.jpg', 1),
('kwadrat', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/square.jpg', 1),
('trójkąt', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/triangle.jpg', 1),
('prostokąt', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/rectangle.jpg', 2),
('oval', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/oval.jpg', 2),
('serce', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/heart.jpg', 1),
('gwiazda', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/star.jpg', 1),
('diament', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/diamond.jpg', 2),
('sześciokąt', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/hexagon.jpg', 3),
('pięciokąt', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/pentagon.jpg', 3),
('ośmiokąt', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/octagon.jpg', 3),
('kula', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/sphere.jpg', 2),
('sześcian', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/cube.jpg', 2),
('stożek', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/cone.jpg', 2),
('walec', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/cylinder.jpg', 3),
('piramida', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/pyramid.jpg', 2),
('linia', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/line.jpg', 1),
('punkt', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/point.jpg', 1),
('krzywka', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/curve.jpg', 2),
('spirala', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/spiral.jpg', 2),
('zygzak', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/zigzag.jpg', 2),
('fala', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/wave.jpg', 2),
('krzyż', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/cross.jpg', 1),
('półksiężyc', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/crescent.jpg', 2),
('jasny', 'kolory_ksztalty', 'pl', 'vocabulary/colors/light.jpg', 2),
('ciemny', 'kolory_ksztalty', 'pl', 'vocabulary/colors/dark.jpg', 2),
('kolorowy', 'kolory_ksztalty', 'pl', 'vocabulary/colors/colorful.jpg', 2),
('tęcza', 'kolory_ksztalty', 'pl', 'vocabulary/colors/rainbow.jpg', 2),
('wzór', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/pattern.jpg', 2),
('pasek', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/stripe.jpg', 2),
('kropka', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/dot.jpg', 1),
('kratka', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/checkered.jpg', 3),
('gładki', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/smooth.jpg', 2),
('szorstki', 'kolory_ksztalty', 'pl', 'vocabulary/shapes/rough.jpg', 3),
('błyszczący', 'kolory_ksztalty', 'pl', 'vocabulary/colors/shiny.jpg', 3);

-- ============================================================================
-- CATEGORY 5: PRZEDMIOTY CODZIENNE (Everyday Objects) - 50 words
-- ============================================================================

INSERT INTO public.vocabulary (word_text, category, language_code, image_path, difficulty_level) VALUES
('stół', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/table.jpg', 1),
('krzesło', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/chair.jpg', 1),
('łóżko', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/bed.jpg', 1),
('szafa', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/wardrobe.jpg', 2),
('komoda', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/dresser.jpg', 2),
('biurko', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/desk.jpg', 1),
('półka', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/shelf.jpg', 1),
('lustro', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/mirror.jpg', 1),
('zegar', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/clock.jpg', 1),
('budzik', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/alarm_clock.jpg', 2),
('lampa', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/lamp.jpg', 1),
('obraz', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/painting.jpg', 1),
('zasłona', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/curtain.jpg', 2),
('dywan', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/rug.jpg', 2),
('poduszka', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/pillow.jpg', 1),
('kołdra', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/blanket.jpg', 2),
('ręcznik', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/towel.jpg', 1),
('mydło', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/soap.jpg', 1),
('szczoteczka do zębów', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/toothbrush.jpg', 2),
('pasta do zębów', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/toothpaste.jpg', 3),
('grzebień', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/comb.jpg', 2),
('szczotka', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/brush.jpg', 1),
('telefon', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/phone.jpg', 1),
('komputer', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/computer.jpg', 1),
('tablet', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/tablet.jpg', 2),
('telewizor', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/tv.jpg', 1),
('pilot', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/remote.jpg', 2),
('książka', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/book.jpg', 1),
('zeszyt', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/notebook.jpg', 1),
('długopis', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/pen.jpg', 1),
('ołówek', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/pencil.jpg', 1),
('gumka', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/eraser.jpg', 1),
('linijka', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/ruler.jpg', 2),
('nożyczki', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/scissors.jpg', 1),
('klej', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/glue.jpg', 1),
('taśma klejąca', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/tape.jpg', 2),
('plecak', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/backpack.jpg', 1),
('torba', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/bag.jpg', 1),
('portfel', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/wallet.jpg', 2),
('kluczek', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/key.jpg', 1),
('zamek', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/lock.jpg', 2),
('przycisk', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/button.jpg', 1),
('drzwi', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/door.jpg', 1),
('okno', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/window.jpg', 1),
('ściana', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/wall.jpg', 1),
('podłoga', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/floor.jpg', 1),
('sufit', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/ceiling.jpg', 2),
('kubek', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/mug.jpg', 1),
('talerz', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/plate.jpg', 1),
('widelec', 'przedmioty_codzienne', 'pl', 'vocabulary/objects/fork.jpg', 1);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count words per category
DO $$
DECLARE
    zwierzeta_count INTEGER;
    owoce_count INTEGER;
    pojazdy_count INTEGER;
    kolory_count INTEGER;
    przedmioty_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO zwierzeta_count FROM public.vocabulary WHERE category = 'zwierzeta';
    SELECT COUNT(*) INTO owoce_count FROM public.vocabulary WHERE category = 'owoce_warzywa';
    SELECT COUNT(*) INTO pojazdy_count FROM public.vocabulary WHERE category = 'pojazdy';
    SELECT COUNT(*) INTO kolory_count FROM public.vocabulary WHERE category = 'kolory_ksztalty';
    SELECT COUNT(*) INTO przedmioty_count FROM public.vocabulary WHERE category = 'przedmioty_codzienne';
    SELECT COUNT(*) INTO total_count FROM public.vocabulary WHERE language_code = 'pl';

    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Vocabulary Data Seeded Successfully!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Words per category:';
    RAISE NOTICE '  Zwierzęta: % words', zwierzeta_count;
    RAISE NOTICE '  Owoce i Warzywa: % words', owoce_count;
    RAISE NOTICE '  Pojazdy: % words', pojazdy_count;
    RAISE NOTICE '  Kolory i Kształty: % words', kolory_count;
    RAISE NOTICE '  Przedmioty Codzienne: % words', przedmioty_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Total Polish words: %', total_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Test GET /api/categories';
    RAISE NOTICE '  2. Go to http://localhost:3000/game/categories';
    RAISE NOTICE '  3. See 5 colorful category cards!';
    RAISE NOTICE '';
END $$;

-- Display sample words from each category
SELECT
    category,
    COUNT(*) as word_count,
    string_agg(word_text, ', ' ORDER BY word_text LIMIT 5) as sample_words
FROM public.vocabulary
WHERE language_code = 'pl'
GROUP BY category
ORDER BY category;
