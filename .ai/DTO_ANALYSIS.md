# Analiza DTO i Command Model - Dokumentacja

## Przegląd
Ten dokument opisuje proces mapowania modeli bazy danych na typy DTO (Data Transfer Object) i Command Model zgodnie z planem API.

## Lista wszystkich DTO i Command Model

### 1. Profile Management (Sekcja 2.1 API Plan)

#### 1.1 CreateProfileCommand
**Źródło:** `Tables['profiles']['Insert']`  
**Endpoint:** `POST /api/profiles`  
**Pola:**
- `display_name: string` (wymagane)
- `avatar_url?: string | null` (opcjonalne)
- `language_code?: string` (opcjonalne, default: 'pl')

**Transformacje:**
- Wykluczone pola automatyczne: `id`, `parent_id`, `created_at`, `updated_at`
- `parent_id` dodawany automatycznie z auth.uid()

#### 1.2 ProfileDTO
**Źródło:** `Tables['profiles']['Row']`  
**Endpoints:** `GET /api/profiles/:id`, `POST /api/profiles`, `PATCH /api/profiles/:id`, `GET /api/profiles`  
**Pola:** Wszystkie pola z Row bez modyfikacji
- `id: string`
- `parent_id: string`
- `display_name: string`
- `avatar_url: string | null`
- `language_code: string`
- `created_at: string`
- `updated_at: string`

**Transformacje:** Bezpośrednie mapowanie 1:1

#### 1.3 ProfilesListDTO
**Źródło:** Kolekcja `ProfileDTO`  
**Endpoint:** `GET /api/profiles`  
**Pola:**
- `profiles: ProfileDTO[]`
- `total: number`

#### 1.4 UpdateProfileCommand
**Źródło:** `Partial<Pick<Tables['profiles']['Update'], 'display_name' | 'avatar_url'>>`  
**Endpoint:** `PATCH /api/profiles/:id`  
**Pola:**
- `display_name?: string` (opcjonalne)
- `avatar_url?: string | null` (opcjonalne)

**Transformacje:**
- Używa `Partial` - wszystkie pola opcjonalne
- Wykluczone pola: `id`, `parent_id`, `language_code`, `created_at`, `updated_at`

#### 1.5 ProfileLimitErrorDTO
**Źródło:** Rozszerzenie `ErrorResponse`  
**Endpoint:** `POST /api/profiles` (409 Conflict)  
**Pola:**
- `error: 'profile_limit_exceeded'`
- `message: string`
- `current_count: number`
- `max_allowed: number`

#### 1.6 LastProfileErrorDTO
**Źródło:** Rozszerzenie `ErrorResponse`  
**Endpoint:** `DELETE /api/profiles/:id` (409 Conflict)  
**Pola:**
- `error: 'last_profile'`
- `message: string`
- `remaining_profiles: number`

### 2. Profile Statistics (Sekcja 2.2 API Plan)

#### 2.1 ProfileStatsDTO
**Źródło:** `Views['profile_stats']['Row']`  
**Endpoint:** `GET /api/profiles/:id/stats`  
**Pola:**
- `profile_id: string`
- `display_name: string`
- `avatar_url: string | null`
- `total_words_attempted: number`
- `words_mastered: number`
- `total_stars: number`
- `mastery_percentage: number`

**Transformacje:**
- Bezpośrednie mapowanie z database view
- Wartości obliczane automatycznie przez view

#### 2.2 CategoryProgressDTO
**Źródło:** Złożone zapytanie z agregacją  
**Endpoint:** `GET /api/profiles/:id/progress/categories`  
**Pola:**
- `profile_id: string`
- `language: string`
- `categories: CategoryProgressItem[]`
  - `category: VocabularyCategory`
  - `total_words: number`
  - `mastered_words: number`
  - `completion_percentage: number`
- `overall: OverallProgressSummary`
  - `total_words: number`
  - `mastered_words: number`
  - `completion_percentage: number`

**Transformacje:**
- Wymaga złączenia `vocabulary` z `user_progress`
- Agregacja GROUP BY category
- Obliczenie procentów

#### 2.3 DetailedProgressDTO
**Źródło:** `Tables['user_progress']['Row']` + JOIN `Tables['vocabulary']['Row']`  
**Endpoint:** `GET /api/profiles/:id/progress`  
**Pola:**
- `profile_id: string`
- `progress: DetailedProgressItem[]`
  - `id: string` (z user_progress)
  - `vocabulary_id: string`
  - `word_text: string` (z vocabulary)
  - `category: VocabularyCategory` (z vocabulary)
  - `image_path: string` (z vocabulary)
  - `is_mastered: boolean`
  - `stars_earned: number`
  - `attempts_count: number`
  - `last_attempted_at: string | null`
  - `created_at: string`
- `pagination: PaginationMeta`

**Transformacje:**
- JOIN między user_progress i vocabulary
- Dodanie danych słownictwa do każdego rekordu progress

### 3. Vocabulary (Sekcja 2.3 API Plan)

#### 3.1 VocabularyDTO
**Źródło:** `Tables['vocabulary']['Row']` + obliczane `image_url`  
**Endpoints:** `GET /api/vocabulary`, `GET /api/vocabulary/:id`  
**Pola:**
- `id: string`
- `word_text: string`
- `category: VocabularyCategory`
- `language_code: string`
- `image_path: string`
- `image_url: string` (obliczane)
- `difficulty_level: number | null`
- `created_at: string`

**Transformacje:**
- Dodanie `image_url` obliczanego z `image_path` + Supabase Storage URL
- Wzorzec: `https://[project].supabase.co/storage/v1/object/public/[bucket]/{image_path}`

#### 3.2 VocabularyListDTO
**Źródło:** Kolekcja `VocabularyDTO`  
**Endpoint:** `GET /api/vocabulary`  
**Pola:**
- `vocabulary: VocabularyDTO[]`
- `pagination: PaginationMeta`

### 4. Categories (Sekcja 2.4 API Plan)

#### 4.1 CategoryDTO
**Źródło:** `Enums['vocabulary_category']` + agregacja  
**Endpoint:** `GET /api/categories`  
**Pola:**
- `code: VocabularyCategory` (wartość enum)
- `name: string` (przyjazna nazwa)
- `word_count: number` (COUNT z vocabulary)

**Transformacje:**
- Mapowanie wartości enum na czytelne nazwy
- Agregacja COUNT GROUP BY category

#### 4.2 CategoriesListDTO
**Źródło:** Kolekcja `CategoryDTO`  
**Endpoint:** `GET /api/categories`  
**Pola:**
- `categories: CategoryDTO[]`
- `total_words: number`

### 5. Game Sessions (Sekcja 2.5 API Plan)

#### 5.1 CreateGameSessionCommand
**Źródło:** Request body  
**Endpoint:** `POST /api/game/sessions`  
**Pola:**
- `profile_id: string` (wymagane)
- `category?: VocabularyCategory | null` (opcjonalne)
- `word_count?: number` (opcjonalne, default: 10)

**Transformacje:**
- Parametry dla funkcji `get_next_words()`
- `category = null` oznacza tryb "Mix"

#### 5.2 GameWordDTO
**Źródło:** Wynik funkcji `get_next_words()` + JOIN z `vocabulary` + `user_progress`  
**Używane w:** `GameSessionDTO.words`  
**Pola:**
- `id: string`
- `word_text: string`
- `category: VocabularyCategory`
- `image_path: string`
- `image_url: string` (obliczane)
- `difficulty_level: number | null`
- `is_mastered: boolean` (z user_progress)
- `previous_stars: number` (z user_progress)
- `previous_attempts: number` (z user_progress)

**Transformacje:**
- Połączenie danych z funkcji get_next_words() z vocabulary i user_progress
- Dodanie image_url

#### 5.3 GameSessionDTO
**Źródło:** Wynik wywołania `get_next_words()`  
**Endpoint:** `POST /api/game/sessions`  
**Pola:**
- `session_id: string` (generowane UUID)
- `profile_id: string`
- `category: VocabularyCategory | null`
- `word_count: number`
- `words: GameWordDTO[]`
- `algorithm: AlgorithmInfo`
  - `unmastered_words: number`
  - `mastered_words: number`
  - `description: string`
- `created_at: string`

**Transformacje:**
- Wywołanie funkcji `get_next_words()` z parametrami
- Implementacja algorytmu 80/20
- Losowe mieszanie słów

#### 5.4 InsufficientWordsErrorDTO
**Źródło:** Rozszerzenie `ErrorResponse`  
**Endpoint:** `POST /api/game/sessions` (422)  
**Pola:**
- `error: 'insufficient_words'`
- `message: string`
- `available: number`
- `requested: number`

### 6. Progress Tracking (Sekcja 2.6 API Plan)

#### 6.1 RecordProgressCommand
**Źródło:** Request body  
**Endpoint:** `POST /api/progress` (tryb pojedynczy)  
**Pola:**
- `profile_id: string` (wymagane)
- `vocabulary_id: string` (wymagane)
- `is_correct: boolean` (wymagane)
- `attempt_number: number` (wymagane, >= 1)

**Transformacje:**
- Logika obliczania stars_earned:
  - attempt_number = 1 → 3 gwiazdki
  - attempt_number = 2 → 2 gwiazdki
  - attempt_number >= 3 → 1 gwiazdka
- is_mastered = true jeśli is_correct = true

#### 6.2 ProgressRecordDTO
**Źródło:** `Tables['user_progress']['Row']` + `word_details`  
**Endpoint:** `POST /api/progress` (odpowiedź pojedyncza)  
**Pola:**
- `id: string`
- `profile_id: string`
- `vocabulary_id: string`
- `is_mastered: boolean`
- `stars_earned: number`
- `attempts_count: number`
- `last_attempted_at: string | null`
- `created_at: string`
- `updated_at: string`
- `word_details: WordDetailsDTO`
  - `word_text: string`
  - `category: VocabularyCategory`

**Transformacje:**
- UPSERT do user_progress
- Akumulacja stars_earned przy UPDATE
- Inkrementacja attempts_count
- JOIN z vocabulary dla word_details

#### 6.3 RecordBatchProgressCommand
**Źródło:** Request body  
**Endpoint:** `POST /api/progress` (tryb batch)  
**Pola:**
- `profile_id: string` (wymagane)
- `results: BatchProgressItem[]`
  - `vocabulary_id: string`
  - `is_correct: boolean`
  - `attempt_number: number`

**Transformacje:**
- Batch processing wielu słów
- Ta sama logika co RecordProgressCommand dla każdego elementu

#### 6.4 BatchProgressResponseDTO
**Źródło:** Wynik batch processing  
**Endpoint:** `POST /api/progress` (odpowiedź batch)  
**Pola:**
- `profile_id: string`
- `processed: number`
- `results: BatchProgressResultItem[]`
  - `vocabulary_id: string`
  - `status: 'success' | 'error'`
  - `stars_earned: number`
  - `is_mastered: boolean`
  - `error_message?: string`

### 7. Common Error DTOs

#### 7.1 ValidationErrorDTO
**Źródło:** Rozszerzenie `ErrorResponse`  
**HTTP Code:** 400  
**Pola:**
- `error: 'validation_error'`
- `message: string`
- `field: string`

#### 7.2 NotFoundErrorDTO
**Źródło:** Rozszerzenie `ErrorResponse`  
**HTTP Code:** 404  
**Pola:**
- `error: 'not_found'`
- `message: string`

#### 7.3 UnauthorizedErrorDTO
**Źródło:** Rozszerzenie `ErrorResponse`  
**HTTP Code:** 401  
**Pola:**
- `error: 'unauthorized'`
- `message: string`

## Techniki TypeScript użyte w definicjach

### 1. Type Aliases dla uproszczenia
```typescript
type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];
```

### 2. Pick dla selekcji pól
```typescript
UpdateProfileCommand: Pick<Tables['profiles']['Update'], 'display_name' | 'avatar_url'>
```

### 3. Partial dla opcjonalnych pól
```typescript
Partial<UpdateProfileCommand> // wszystkie pola opcjonalne
```

### 4. Omit dla wykluczenia pól
```typescript
Omit<Tables['profiles']['Row'], 'parent_id'> // wszystkie pola oprócz parent_id
```

### 5. Extends dla rozszerzania typów
```typescript
interface ProfileLimitErrorDTO extends ErrorResponse {
  // dodatkowe pola
}
```

### 6. Type Guards dla type narrowing
```typescript
function isProfileLimitError(error: ErrorResponse): error is ProfileLimitErrorDTO {
  return error.error === 'profile_limit_exceeded';
}
```

### 7. Union Types dla wielu możliwych wartości
```typescript
status: 'success' | 'error'
```

### 8. Computed Properties
```typescript
// image_url jest obliczane runtime z image_path
image_url: string; // Computed: Supabase Storage public URL
```

## Mapowanie Endpoint → DTO

| HTTP Method | Endpoint | Request Body | Response Body |
|-------------|----------|--------------|---------------|
| POST | /api/profiles | CreateProfileCommand | ProfileDTO |
| GET | /api/profiles | - | ProfilesListDTO |
| GET | /api/profiles/:id | - | ProfileDTO |
| PATCH | /api/profiles/:id | UpdateProfileCommand | ProfileDTO |
| DELETE | /api/profiles/:id | - | 204 No Content |
| GET | /api/profiles/:id/stats | - | ProfileStatsDTO |
| GET | /api/profiles/:id/progress | - | DetailedProgressDTO |
| GET | /api/profiles/:id/progress/categories | - | CategoryProgressDTO |
| GET | /api/vocabulary | - | VocabularyListDTO |
| GET | /api/vocabulary/:id | - | VocabularyDTO |
| GET | /api/categories | - | CategoriesListDTO |
| POST | /api/game/sessions | CreateGameSessionCommand | GameSessionDTO |
| POST | /api/progress | RecordProgressCommand / RecordBatchProgressCommand | ProgressRecordDTO / BatchProgressResponseDTO |

## Uwagi końcowe

1. **Wszystkie DTO są bezpośrednio połączone z encjami bazy danych** poprzez typy z `database_types.ts`
2. **Command Modele** reprezentują dane wejściowe (request body) i zawierają tylko pola modyfikowalne przez użytkownika
3. **Response DTOs** często zawierają dodatkowe obliczane pola (np. `image_url`) lub dane z JOIN-ów
4. **Error DTOs** są spójne i rozszerzają bazowy typ `ErrorResponse`
5. **Type Guards** ułatwiają sprawdzanie typów błędów w runtime
6. **Wszystkie typy są exported** dla łatwego importu w innych częściach aplikacji

## Zgodność z API Plan

Wszystkie typy zostały zaprojektowane zgodnie z:
- Sekcją 2: Endpoints (2.1 - 2.6)
- Sekcją 3: Data Models
- Sekcją 4: Validation Rules
- Przykładami request/response z dokumentacji API
