# Przewodnik testowania widoku `/profiles`

## Data: 2026-01-28

---

## 📋 Wymagania wstępne

### 1. Zainstalowane narzędzia
- ✅ Node.js 22.14.0 (sprawdź: `node --version`)
- ✅ Docker Desktop (sprawdź: `docker --version`)
- ✅ Supabase CLI (sprawdź: `npx supabase --version`)

### 2. Uruchomione usługi
- 🐳 Docker Desktop musi być uruchomiony
- 🗄️ Lokalny Supabase musi być uruchomiony

---

## 🚀 Krok 1: Uruchomienie środowiska lokalnego

### Opcja A: Skrypt automatyczny (Windows)

```powershell
# W katalogu głównym projektu
.\scripts\start-local-dev.ps1
```

### Opcja B: Ręcznie

```bash
# 1. Upewnij się, że Docker Desktop działa
docker ps

# 2. Uruchom Supabase
npx supabase start

# 3. Sprawdź status
npx supabase status

# 4. Uruchom serwer deweloperski
npm run dev
```

### Oczekiwane wyniki:

Po uruchomieniu powinieneś zobaczyć:

```
✅ Supabase is running!

API URL: http://127.0.0.1:54321
Studio URL: http://localhost:54323
Anon key: eyJhbG...
```

---

## 👤 Krok 2: Utworzenie użytkownika testowego

### Metoda 1: Przez Supabase Studio (Zalecane)

1. Otwórz Supabase Studio: http://localhost:54323
2. Przejdź do **SQL Editor**
3. Skopiuj zawartość pliku: `scripts/create-test-user.sql`
4. Wklej i uruchom (przycisk **RUN**)
5. Sprawdź komunikaty w konsoli

### Metoda 2: Przez psql (CLI)

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/create-test-user.sql
```

### Utworzony użytkownik testowy:

```
Email: testparent@example.com
Password: password123
```

### Utworzone profile dzieci:

1. **Zosia** - Miś (avatar-1.svg)
2. **Janek** - Królik (avatar-2.svg)
3. **Ania** - Lew (avatar-3.svg)

*Pozostają 2 wolne sloty do testowania dodawania profili*

---

## 🧪 Krok 3: Testowanie widoku `/profiles`

### 3.1. Test Demo (bez autentykacji)

**URL:** http://localhost:3000/profiles-demo

✅ **Co testować:**
- [ ] Strona się ładuje
- [ ] Widoczny nagłówek "Kto dziś gra? 🎮"
- [ ] Widoczna karta "Dodaj profil"
- [ ] Animacje hover działają
- [ ] Responsywność (zmień rozmiar okna)

⚠️ **Ograniczenia:**
- Nie działa pobieranie profili z API
- Nie działa tworzenie profili
- Tylko wizualna prezentacja UI

---

### 3.2. Test pełny (z autentykacją)

**URL:** http://localhost:3000/profiles

⚠️ **Uwaga:** Strona wymaga autoryzacji. Jeśli nie ma strony logowania, użyj jednej z poniższych metod.

---

#### Metoda A: Przez cURL (szybka)

```bash
# 1. Pobierz JWT token
curl -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: <TWÓJ_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testparent@example.com",
    "password": "password123"
  }'

# Skopiuj access_token z odpowiedzi

# 2. Testuj GET /api/profiles
curl http://localhost:3000/api/profiles \
  -H "Authorization: Bearer <TWÓJ_ACCESS_TOKEN>" \
  -H "Cookie: sb-<project-ref>-auth-token=<TOKEN>"

# 3. Testuj POST /api/profiles
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer <TWÓJ_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project-ref>-auth-token=<TOKEN>" \
  -d '{
    "display_name": "Piotr",
    "avatar_url": "avatars/avatar-4.svg",
    "language_code": "pl"
  }'
```

---

#### Metoda B: Przez Browser Console (interaktywna)

1. Otwórz http://localhost:3000/profiles-demo
2. Otwórz DevTools (F12)
3. W Console wklej:

```javascript
// 1. Zaloguj się
const loginResponse = await fetch('http://127.0.0.1:54321/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: {
    'apikey': 'TWÓJ_ANON_KEY', // Pobierz z npx supabase status
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'testparent@example.com',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
console.log('Access Token:', loginData.access_token);

// 2. Przejdź do /profiles z tokenem
// Niestety wymaga implementacji strony logowania
```

---

#### Metoda C: Implementacja prostej strony logowania (najlepsza)

Utworzyć tymczasową stronę `/login` do testowania (patrz sekcja "Opcjonalne usprawnienia" poniżej).

---

## ✅ Testy funkcjonalne - Lista kontrolna

### Test 1: Wyświetlanie profili ✅

- [ ] Otwórz `/profiles` (z tokenem)
- [ ] Sprawdź, czy wyświetlają się 3 profile (Zosia, Janek, Ania)
- [ ] Sprawdź, czy awatary SVG się ładują
- [ ] Sprawdź, czy imiona są czytelne
- [ ] Sprawdź animacje hover na kartach

**Oczekiwany wynik:** 3 karty profili + 1 karta "Dodaj profil"

---

### Test 2: Parental Gate ✅

- [ ] Kliknij kartę "Dodaj profil"
- [ ] Sprawdź, czy pojawia się modal z zadaniem matematycznym
- [ ] Sprawdź, czy zadanie jest czytelne (np. "12 + 5 = ?")
- [ ] Wprowadź błędną odpowiedź
- [ ] Sprawdź komunikat błędu
- [ ] Wprowadź poprawną odpowiedź
- [ ] Sprawdź, czy otwiera się formularz tworzenia profilu

**Oczekiwany wynik:** Modal z klawiaturą numeryczną, walidacja odpowiedzi

---

### Test 3: Tworzenie profilu ✅

- [ ] Po przejściu Parental Gate, otwiera się formularz
- [ ] Wpisz imię (np. "Kasia")
- [ ] Wybierz awatar (np. Żaba - avatar-4.svg)
- [ ] Sprawdź wizualną selekcję (niebieski border + checkmark)
- [ ] Kliknij "Utwórz profil"
- [ ] Sprawdź, czy pojawia się komunikat "Tworzenie..."
- [ ] Sprawdź, czy nowy profil pojawia się na liście

**Oczekiwany wynik:** Nowy profil "Kasia" z awatarem Żaby

---

### Test 4: Walidacja formularza ✅

- [ ] Otwórz formularz tworzenia
- [ ] Pozostaw puste imię, kliknij "Utwórz profil"
- [ ] Sprawdź, czy przycisk jest disabled
- [ ] Wpisz za krótkie imię (1 znak)
- [ ] Sprawdź komunikat walidacji
- [ ] Wpisz za długie imię (>50 znaków)
- [ ] Sprawdź komunikat walidacji

**Oczekiwany wynik:** Walidacja inline, komunikaty błędów pod polami

---

### Test 5: Limit 5 profili ✅

- [ ] Utwórz 4. profil (np. "Piotr")
- [ ] Utwórz 5. profil (np. "Tomek")
- [ ] Sprawdź, czy karta "Dodaj profil" znika lub jest disabled
- [ ] Sprawdź komunikat "Limit osiągnięty"
- [ ] Spróbuj utworzyć 6. profil przez API (powinien zwrócić 409)

**Oczekiwany wynik:** Brak możliwości dodania 6. profilu

---

### Test 6: Wybór profilu i nawigacja ✅

- [ ] Kliknij na kartę profilu (np. "Zosia")
- [ ] Sprawdź animację active (scale-95)
- [ ] Sprawdź, czy zostałeś przekierowany do `/game/categories`
- [ ] Otwórz DevTools → Application → Session Storage
- [ ] Sprawdź, czy `selectedProfileId` zawiera UUID profilu

**Oczekiwany wynik:** Przekierowanie + zapisany ID w sessionStorage

---

### Test 7: Responsywność ✅

- [ ] Otwórz widok na desktop (>1024px)
- [ ] Sprawdź, czy siatka ma 3 kolumny
- [ ] Zmniejsz okno do tablet (768-1024px)
- [ ] Sprawdź, czy siatka ma 2 kolumny
- [ ] Zmniejsz okno do mobile (<768px)
- [ ] Sprawdź, czy siatka ma 1 kolumnę
- [ ] Sprawdź, czy karty są czytelne na wszystkich rozmiaarach

**Oczekiwany wynik:** Responsywny layout z Tailwind breakpoints

---

### Test 8: Obsługa błędów ✅

- [ ] Zatrzymaj Supabase (`npx supabase stop`)
- [ ] Odśwież stronę `/profiles`
- [ ] Sprawdź komunikat błędu "Nie udało się załadować profili"
- [ ] Sprawdź przycisk "Spróbuj ponownie"
- [ ] Uruchom Supabase, kliknij "Spróbuj ponownie"
- [ ] Sprawdź, czy profile się załadowały

**Oczekiwany wynik:** Przyjazne komunikaty błędów z opcją retry

---

### Test 9: Accessibility ✅

- [ ] Sprawdź ARIA labels na kartach (`aria-label="Wybierz profil Zosia"`)
- [ ] Użyj Tab do nawigacji między kartami
- [ ] Sprawdź focus states (border outline)
- [ ] Użyj Enter/Space do wyboru profilu
- [ ] W Parental Gate użyj klawiatury do wpisania odpowiedzi
- [ ] Sprawdź, czy Enter submituje odpowiedź
- [ ] Sprawdź, czy Escape zamyka modala

**Oczekiwany wynik:** Pełna obsługa klawiatury, ARIA attributes

---

## 📊 Metryki wydajności (opcjonalne)

Użyj Chrome DevTools → Lighthouse do sprawdzenia:

- [ ] Performance: >90
- [ ] Accessibility: >95
- [ ] Best Practices: >90
- [ ] SEO: >80

---

## 🐛 Znane ograniczenia i issues

### 1. Brak strony logowania
**Problem:** Nie ma strony `/login`, więc pełne testowanie wymaga cURL lub browser console.

**Rozwiązanie:** Implementować prostą stronę logowania (patrz sekcja poniżej).

### 2. Brak obsługi logout
**Problem:** Nie ma przycisku "Wyloguj".

**Rozwiązanie:** Dodać przycisk w layout lub na stronie `/profiles`.

### 3. Emoji w SVG mogą nie działać na starszych przeglądarkach
**Problem:** Emoji w SVG `<text>` element mogą się nie wyświetlać.

**Rozwiązanie:** Zamienić emoji na ikony SVG lub obrazki PNG.

---

## 🔧 Opcjonalne usprawnienia do testowania

### Implementacja prostej strony logowania

Utworzyć `/src/pages/login.astro`:

```astro
---
// Prosta strona logowania dla testów
import Layout from "@/layouts/Layout.astro";
export const prerender = false;
---

<Layout title="Login">
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
      <h1 class="mb-6 text-2xl font-bold text-gray-800">Logowanie rodzica</h1>

      <form id="loginForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value="testparent@example.com"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Hasło</label>
          <input
            type="password"
            id="password"
            value="password123"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          class="w-full rounded-md bg-purple-600 py-2 text-white hover:bg-purple-700"
        >
          Zaloguj się
        </button>
      </form>

      <div id="error" class="mt-4 hidden rounded-md bg-red-50 p-3 text-red-700"></div>
    </div>
  </div>

  <script>
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;

      try {
        const response = await fetch('http://127.0.0.1:54321/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Store token in cookie
          document.cookie = `sb-access-token=${data.access_token}; path=/`;
          // Redirect to profiles
          window.location.href = '/profiles';
        } else {
          errorDiv.textContent = data.error_description || 'Login failed';
          errorDiv.classList.remove('hidden');
        }
      } catch (error) {
        errorDiv.textContent = 'Network error';
        errorDiv.classList.remove('hidden');
      }
    });
  </script>
</Layout>
```

---

## 📝 Raport z testów - Szablon

```markdown
# Raport z testów widoku /profiles

**Data:** YYYY-MM-DD
**Tester:** [Imię]
**Środowisko:** Local (Supabase + Astro Dev Server)

## Wyniki testów

| Test | Status | Uwagi |
|------|--------|-------|
| 1. Wyświetlanie profili | ✅/❌ | |
| 2. Parental Gate | ✅/❌ | |
| 3. Tworzenie profilu | ✅/❌ | |
| 4. Walidacja formularza | ✅/❌ | |
| 5. Limit 5 profili | ✅/❌ | |
| 6. Wybór profilu | ✅/❌ | |
| 7. Responsywność | ✅/❌ | |
| 8. Obsługa błędów | ✅/❌ | |
| 9. Accessibility | ✅/❌ | |

## Znalezione bugi

1. [Opis bugu]
   - Kroki reprodukcji:
   - Oczekiwany wynik:
   - Rzeczywisty wynik:

## Rekomendacje

- [Lista rekomendacji]

## Screenshoty

- [Załącz screenshoty jeśli potrzebne]
```

---

## 🆘 Troubleshooting

### Problem: Docker nie chce się uruchomić

**Rozwiązanie:**
1. Sprawdź, czy Docker Desktop jest zainstalowany
2. Uruchom Docker Desktop z Start Menu
3. Poczekaj, aż ikona wieloryba w tray przestanie się kręcić

### Problem: Supabase nie chce się uruchomić

**Rozwiązanie:**
```bash
npx supabase stop
npx supabase start --debug
```

### Problem: Port 3000 już zajęty

**Rozwiązanie:**
```bash
# Znajdź proces na porcie 3000
netstat -ano | findstr :3000

# Zabij proces (Windows)
taskkill /PID <PID> /F
```

### Problem: Nie mogę się zalogować

**Rozwiązanie:**
1. Sprawdź, czy użytkownik został utworzony: Supabase Studio → Authentication → Users
2. Sprawdź .env: czy `SUPABASE_URL` i `SUPABASE_KEY` są poprawne
3. Sprawdź logi Supabase: `npx supabase logs -f auth`

---

## 📞 Wsparcie

Jeśli napotkasz problemy:
1. Sprawdź logi w konsoli przeglądarki (F12)
2. Sprawdź logi Astro w terminalu
3. Sprawdź logi Supabase: `npx supabase logs`
4. Utwórz issue w repo projektu

---

**Autor:** Claude Code
**Wersja:** 1.0
**Data:** 2026-01-28
