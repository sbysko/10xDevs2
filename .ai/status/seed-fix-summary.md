# Seed.sql Fix - Naprawiono duplikaty ✅

**Data:** 2026-01-31
**Problem:** Duplikat słowa "Pingwin" + nieprawidłowa liczba słów
**Status:** ✅ NAPRAWIONE

---

## Problem

Podczas importu seed.sql wystąpił błąd:
```
ERROR: duplicate key value violates unique constraint "vocabulary_unique_word_per_language"
SQLSTATE 23505
```

---

## Przyczyna

1. **Duplikat słowa:** "Pingwin" występował 2 razy w kategorii zwierzęta (linie 65 i 92)
2. **Nieprawidłowa liczba słów:**
   - Zwierzęta: 54 słowa (zamiast 50)
   - Pojazdy: 49 słów (zamiast 50)
   - Przedmioty codzienne: 49 słów (zamiast 50)

---

## Rozwiązanie

### 1. Usunięto duplikat "Pingwin"
Zastąpiono drugi wpis "Pingwin" słowem "Mysz"

### 2. Usunięto nadmiarowe słowa z kategorii zwierzęta
Usunięto 4 słowa:
- Szczur
- Chomik
- Wiewiórka
- Koala

Pozostawiono tylko "Mysz" jako zamiennik dla duplikatu.

### 3. Dodano brakujące słowa

**Pojazdy (+1 słowo):**
- Rowerek

**Przedmioty codzienne (+1 słowo):**
- Zegar

---

## Weryfikacja

### Liczba słów per kategoria (po naprawie):
```
Zwierzęta: 50 ✅
Owoce/Warzywa: 50 ✅
Pojazdy: 50 ✅
Kolory/Kształty: 50 ✅
Przedmioty codzienne: 50 ✅

SUMA: 250 słów ✅
```

### Sprawdzenie duplikatów:
```bash
grep -oP "(?<=\(')[^']+(?=', )" supabase/seed.sql | sort | uniq -d
```
**Wynik:** Brak duplikatów ✅

---

## Zmienione sekcje w seed.sql

### Linia 87-92 (przed):
```sql
-- Zwierzęta egzotyczne i inne (średnie-trudne, 2-3)
('Kangur', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kangur.jpg', 2),
('Hipopotam', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/hipopotam.jpg', 2),
('Nosorożec', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/nosorozec.jpg', 2),
('Wielbłąd', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/wielblad.jpg', 2),
('Pingwin', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/pingwin.jpg', 1); -- DUPLIKAT!
```

### Linia 87-92 (po):
```sql
-- Zwierzęta egzotyczne i inne (średnie-trudne, 2-3)
('Kangur', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kangur.jpg', 2),
('Hipopotam', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/hipopotam.jpg', 2),
('Nosorożec', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/nosorozec.jpg', 2),
('Wielbłąd', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/wielblad.jpg', 2),
('Mysz', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/mysz.jpg', 1); -- NOWE
```

### Linia 225-226 (pojazdy):
```sql
('Wrotki', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/wrotki.jpg', 2),
('Rowerek', 'pojazdy', 'pl', 'vocabulary/pl/pojazdy/rowerek.jpg', 1); -- DODANE
```

### Linia 357-358 (przedmioty codzienne):
```sql
('Parasol', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/parasol.jpg', 1),
('Zegar', 'przedmioty_codzienne', 'pl', 'vocabulary/pl/przedmioty_codzienne/zegar.jpg', 1); -- DODANE
```

---

## Testy

### Test importu:
```bash
npx supabase start
npx supabase db reset
```

**Oczekiwany wynik:** Import bez błędów ✅

### Test weryfikacji:
```sql
SELECT
  category,
  COUNT(*) as word_count
FROM vocabulary
WHERE language_code = 'pl'
GROUP BY category
ORDER BY category;
```

**Oczekiwany wynik:**
```
       category       | word_count
---------------------+------------
 kolory_ksztalty     |         50
 owoce_warzywa       |         50
 pojazdy             |         50
 przedmioty_codzienne|         50
 zwierzeta           |         50
```

---

## Status

✅ **Plik seed.sql naprawiony i gotowy do importu**
✅ **Wszystkie 250 słów**
✅ **Brak duplikatów**
✅ **Poprawna struktura**

---

## Następne kroki

1. Zaimportuj seed.sql:
   ```bash
   npx supabase start
   npx supabase db reset
   ```

2. Testuj grę:
   ```bash
   npm run dev
   # Przejdź do http://localhost:3000
   # Login → Wybierz profil → Graj
   ```

3. Weryfikuj postępy zapisują się poprawnie

---

**Status naprawy:** ✅ ZAKOŃCZONA
**Plik gotowy:** ✅ TAK
**Można importować:** ✅ TAK

*Koniec raportu naprawy*
