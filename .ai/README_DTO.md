# TypeScript DTO & Command Model Library

Kompletna biblioteka typów TypeScript dla aplikacji "Match Picture to Word" - edukacyjnej gry dla dzieci.

## 📦 Zawartość

- **`types.ts`** - Główny plik z definicjami wszystkich typów DTO i Command Model
- **`DTO_ANALYSIS.md`** - Szczegółowa dokumentacja analizy i mapowania typów
- **`examples.ts`** - Praktyczne przykłady użycia typów w aplikacji
- **`README.md`** - Ten plik z instrukcjami

## 🎯 Struktura typów

### 1. Command Models (Request DTOs)
Typy używane do wysyłania danych do API:

```typescript
CreateProfileCommand       // POST /api/profiles
UpdateProfileCommand       // PATCH /api/profiles/:id
CreateGameSessionCommand   // POST /api/game/sessions
RecordProgressCommand      // POST /api/progress (single)
RecordBatchProgressCommand // POST /api/progress (batch)
```

### 2. Response DTOs
Typy zwracane przez API:

```typescript
ProfileDTO                 // Single profile
ProfilesListDTO           // List of profiles
ProfileStatsDTO           // Profile statistics
VocabularyDTO             // Single vocabulary word
VocabularyListDTO         // List of vocabulary words
CategoryProgressDTO       // Progress by category
DetailedProgressDTO       // Detailed word-level progress
GameSessionDTO            // Game session with words
ProgressRecordDTO         // Single progress record
BatchProgressResponseDTO  // Batch progress results
```

### 3. Error DTOs
Typy dla obsługi błędów:

```typescript
ValidationErrorDTO        // 400 - Validation errors
UnauthorizedErrorDTO      // 401 - Auth errors
NotFoundErrorDTO          // 404 - Resource not found
ProfileLimitErrorDTO      // 409 - Profile limit exceeded
LastProfileErrorDTO       // 409 - Cannot delete last profile
InsufficientWordsErrorDTO // 422 - Not enough words
```

## 🚀 Szybki start

### Instalacja

```bash
# Skopiuj plik types.ts do swojego projektu
cp types.ts src/types/
# lub
cp types.ts lib/types/
```

### Import

```typescript
import type {
  CreateProfileCommand,
  ProfileDTO,
  ProfilesListDTO,
  ErrorResponse,
  isValidationError,
} from '@/types/types';
```

## 💡 Przykłady użycia

### 1. Tworzenie profilu dziecka

```typescript
import type { CreateProfileCommand, ProfileDTO } from '@/types/types';

async function createProfile(): Promise<ProfileDTO> {
  const command: CreateProfileCommand = {
    display_name: 'Maria',
    avatar_url: 'avatars/avatar-1.png',
    language_code: 'pl',
  };

  const response = await fetch('/api/profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error('Failed to create profile');
  }

  return response.json();
}
```

### 2. Obsługa błędów z Type Guards

```typescript
import type { ErrorResponse, ProfileLimitErrorDTO } from '@/types/types';
import { isProfileLimitError } from '@/types/types';

try {
  await createProfile();
} catch (error) {
  const apiError = error as ErrorResponse;
  
  if (isProfileLimitError(apiError)) {
    console.log(`Limit: ${apiError.current_count}/${apiError.max_allowed}`);
    // Pokazanie komunikatu o limicie
  }
}
```

### 3. Komponent React z typami

```typescript
import type { ProfileDTO, ProfileStatsDTO } from '@/types/types';
import { useState, useEffect } from 'react';

interface Props {
  profileId: string;
}

export function ProfileCard({ profileId }: Props) {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [stats, setStats] = useState<ProfileStatsDTO | null>(null);

  useEffect(() => {
    async function loadData() {
      const [profileData, statsData] = await Promise.all([
        fetch(`/api/profiles/${profileId}`).then(r => r.json()),
        fetch(`/api/profiles/${profileId}/stats`).then(r => r.json()),
      ]);
      
      setProfile(profileData);
      setStats(statsData);
    }
    
    loadData();
  }, [profileId]);

  if (!profile || !stats) return null;

  return (
    <div>
      <h2>{profile.display_name}</h2>
      <p>Opanowane: {stats.words_mastered}/{stats.total_words_attempted}</p>
      <p>Procent: {stats.mastery_percentage.toFixed(1)}%</p>
    </div>
  );
}
```

### 4. Formularz z walidacją (react-hook-form)

```typescript
import type { CreateProfileCommand } from '@/types/types';
import { useForm } from 'react-hook-form';

export function CreateProfileForm() {
  const { register, handleSubmit, formState: { errors } } = 
    useForm<CreateProfileCommand>();

  const onSubmit = async (data: CreateProfileCommand) => {
    try {
      await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('display_name', {
          required: 'Imię jest wymagane',
          minLength: { value: 2, message: 'Min 2 znaki' },
          maxLength: { value: 50, message: 'Max 50 znaków' },
        })}
        placeholder="Imię dziecka"
      />
      {errors.display_name && <span>{errors.display_name.message}</span>}
      
      <button type="submit">Utwórz profil</button>
    </form>
  );
}
```

### 5. API Route Handler (Next.js)

```typescript
import type { NextRequest } from 'next/server';
import type { 
  CreateProfileCommand, 
  ProfileDTO, 
  ValidationErrorDTO 
} from '@/types/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreateProfileCommand = await request.json();
    
    // Walidacja
    if (!body.display_name || body.display_name.length < 2) {
      const error: ValidationErrorDTO = {
        error: 'validation_error',
        message: 'Display name must be at least 2 characters',
        field: 'display_name',
      };
      return Response.json(error, { status: 400 });
    }
    
    // Tworzenie profilu w bazie danych
    const profile: ProfileDTO = await createProfileInDb(body);
    
    return Response.json(profile, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'internal_error', message: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
```

### 6. Tworzenie sesji gry

```typescript
import type { 
  CreateGameSessionCommand, 
  GameSessionDTO 
} from '@/types/types';

async function startGame(profileId: string): Promise<GameSessionDTO> {
  const command: CreateGameSessionCommand = {
    profile_id: profileId,
    category: 'zwierzeta',
    word_count: 10,
  };

  const response = await fetch('/api/game/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(command),
  });

  const session: GameSessionDTO = await response.json();
  
  console.log(`Sesja: ${session.session_id}`);
  console.log(`Słowa: ${session.words.length}`);
  console.log(`Algorytm: ${session.algorithm.description}`);
  
  return session;
}
```

### 7. Zapisywanie postępów (batch)

```typescript
import type { 
  RecordBatchProgressCommand,
  BatchProgressResponseDTO 
} from '@/types/types';

async function saveGameResults(
  profileId: string,
  results: Array<{ wordId: string; correct: boolean; attempts: number }>
): Promise<BatchProgressResponseDTO> {
  const command: RecordBatchProgressCommand = {
    profile_id: profileId,
    results: results.map(r => ({
      vocabulary_id: r.wordId,
      is_correct: r.correct,
      attempt_number: r.attempts,
    })),
  };

  const response = await fetch('/api/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(command),
  });

  const batchResult: BatchProgressResponseDTO = await response.json();
  
  console.log(`Przetworzono: ${batchResult.processed}`);
  batchResult.results.forEach(result => {
    console.log(`${result.vocabulary_id}: ${result.stars_earned} gwiazdek`);
  });
  
  return batchResult;
}
```

## 🔍 Type Guards

Biblioteka zawiera pomocnicze funkcje type guard do sprawdzania typów błędów:

```typescript
import { 
  isProfileLimitError,
  isLastProfileError,
  isValidationError,
  isInsufficientWordsError,
} from '@/types/types';

// Użycie
try {
  // ... kod API
} catch (error) {
  const apiError = error as ErrorResponse;
  
  if (isProfileLimitError(apiError)) {
    // TypeScript wie, że to ProfileLimitErrorDTO
    console.log(apiError.current_count, apiError.max_allowed);
  }
  
  if (isValidationError(apiError)) {
    // TypeScript wie, że to ValidationErrorDTO
    console.log(apiError.field, apiError.message);
  }
}
```

## 📊 Mapowanie Endpoint → Typy

| Endpoint | Method | Request Body | Response | Errors |
|----------|--------|--------------|----------|--------|
| `/api/profiles` | POST | `CreateProfileCommand` | `ProfileDTO` | `ValidationErrorDTO`, `ProfileLimitErrorDTO` |
| `/api/profiles` | GET | - | `ProfilesListDTO` | `UnauthorizedErrorDTO` |
| `/api/profiles/:id` | GET | - | `ProfileDTO` | `NotFoundErrorDTO` |
| `/api/profiles/:id` | PATCH | `UpdateProfileCommand` | `ProfileDTO` | `ValidationErrorDTO`, `NotFoundErrorDTO` |
| `/api/profiles/:id` | DELETE | - | 204 No Content | `LastProfileErrorDTO`, `NotFoundErrorDTO` |
| `/api/profiles/:id/stats` | GET | - | `ProfileStatsDTO` | `NotFoundErrorDTO` |
| `/api/profiles/:id/progress` | GET | - | `DetailedProgressDTO` | `NotFoundErrorDTO` |
| `/api/profiles/:id/progress/categories` | GET | - | `CategoryProgressDTO` | `NotFoundErrorDTO` |
| `/api/vocabulary` | GET | - | `VocabularyListDTO` | - |
| `/api/vocabulary/:id` | GET | - | `VocabularyDTO` | `NotFoundErrorDTO` |
| `/api/categories` | GET | - | `CategoriesListDTO` | - |
| `/api/game/sessions` | POST | `CreateGameSessionCommand` | `GameSessionDTO` | `ValidationErrorDTO`, `InsufficientWordsErrorDTO` |
| `/api/progress` | POST | `RecordProgressCommand` / `RecordBatchProgressCommand` | `ProgressRecordDTO` / `BatchProgressResponseDTO` | `ValidationErrorDTO`, `NotFoundErrorDTO` |

## 🔗 Połączenie z bazą danych

Wszystkie typy DTO są bezpośrednio powiązane z definicjami bazy danych z `database_types.ts`:

```typescript
// Przykład: ProfileDTO pochodzi z Tables['profiles']['Row']
type Tables = Database['public']['Tables'];
export interface ProfileDTO {
  // Identyczna struktura jak Tables['profiles']['Row']
  id: string;
  parent_id: string;
  // ... pozostałe pola
}
```

To zapewnia:
- ✅ **Type safety** - błędy kompilacji przy niezgodności
- ✅ **Automatyczna synchronizacja** - zmiany w bazie → zmiany w typach
- ✅ **Brak duplikacji** - single source of truth

## 🛠️ Best Practices

### 1. Zawsze używaj typów dla API calls

```typescript
// ✅ Dobrze
const profile: ProfileDTO = await response.json();

// ❌ Źle
const profile = await response.json(); // typ: any
```

### 2. Używaj Type Guards dla błędów

```typescript
// ✅ Dobrze
if (isProfileLimitError(error)) {
  // TypeScript zna strukturę
}

// ❌ Źle
if (error.error === 'profile_limit_exceeded') {
  // Brak type safety
}
```

### 3. Oddzielaj Request i Response typy

```typescript
// ✅ Dobrze
async function updateProfile(
  command: UpdateProfileCommand
): Promise<ProfileDTO> {
  // ...
}

// ❌ Źle
async function updateProfile(data: any): Promise<any> {
  // ...
}
```

### 4. Używaj strict TypeScript config

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

## 📚 Dodatkowe zasoby

- **`DTO_ANALYSIS.md`** - Szczegółowa dokumentacja procesu mapowania
- **`examples.ts`** - Więcej przykładów użycia
- **API Plan** (`api-plan.md`) - Pełna specyfikacja API
- **Database Types** (`database_types.ts`) - Definicje bazy danych

## 🤝 Wkład

Jeśli znajdziesz błąd lub masz sugestię:

1. Sprawdź czy typ jest zgodny z `api-plan.md`
2. Sprawdź czy typ jest zgodny z `database_types.ts`
3. Dodaj type guard jeśli potrzebny
4. Zaktualizuj dokumentację

## 📝 Changelog

### v1.0.0 - 2026-01-26
- ✨ Pierwsza wersja biblioteki typów
- ✨ Wszystkie DTO dla Profile Management
- ✨ Wszystkie DTO dla Progress Tracking
- ✨ Wszystkie DTO dla Game Sessions
- ✨ Vocabulary i Categories DTOs
- ✨ Error DTOs z Type Guards
- 📝 Pełna dokumentacja i przykłady

## 📄 Licencja

Zgodnie z licencją projektu głównego.

---

**Uwaga:** Ten plik typów jest generowany na podstawie `database_types.ts` i `api-plan.md`. 
Wszelkie modyfikacje powinny być najpierw wprowadzone w tych plikach źródłowych.
