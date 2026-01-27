/**
 * Przykłady użycia typów DTO i Command Model
 * 
 * Ten plik zawiera praktyczne przykłady jak używać zdefiniowanych typów
 * w aplikacji Next.js/React z TypeScript
 */

import type {
  CreateProfileCommand,
  UpdateProfileCommand,
  ProfileDTO,
  ProfilesListDTO,
  ProfileStatsDTO,
  VocabularyDTO,
  VocabularyListDTO,
  CreateGameSessionCommand,
  GameSessionDTO,
  RecordProgressCommand,
  RecordBatchProgressCommand,
  ProgressRecordDTO,
  BatchProgressResponseDTO,
  ErrorResponse,
  ValidationErrorDTO,
  ProfileLimitErrorDTO,
  isProfileLimitError,
  isValidationError,
} from './types';

// ============================================================================
// PRZYKŁADY API CLIENT FUNCTIONS
// ============================================================================

/**
 * Przykład 1: Tworzenie profilu dziecka
 */
async function createChildProfile(
  command: CreateProfileCommand
): Promise<ProfileDTO> {
  const response = await fetch('/api/profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    
    // Type guard pozwala na bezpieczne sprawdzenie typu błędu
    if (isProfileLimitError(error)) {
      console.error(`Limit profili osiągnięty: ${error.current_count}/${error.max_allowed}`);
      throw new Error(error.message);
    }
    
    if (isValidationError(error)) {
      console.error(`Błąd walidacji w polu: ${error.field}`);
      throw new Error(error.message);
    }
    
    throw new Error(error.message);
  }

  return response.json();
}

// Użycie:
const newProfile = await createChildProfile({
  display_name: 'Maria',
  avatar_url: 'avatars/avatar-1.png',
  language_code: 'pl',
});

/**
 * Przykład 2: Pobieranie listy profili
 */
async function getProfiles(): Promise<ProfilesListDTO> {
  const response = await fetch('/api/profiles', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profiles');
  }

  return response.json();
}

// Użycie:
const { profiles, total } = await getProfiles();
console.log(`Masz ${total} profili:`);
profiles.forEach(profile => {
  console.log(`- ${profile.display_name} (${profile.language_code})`);
});

/**
 * Przykład 3: Aktualizacja profilu
 */
async function updateProfile(
  profileId: string,
  updates: UpdateProfileCommand
): Promise<ProfileDTO> {
  const response = await fetch(`/api/profiles/${profileId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Użycie:
const updatedProfile = await updateProfile('profile-uuid', {
  display_name: 'Maria Anna',
});

/**
 * Przykład 4: Pobieranie statystyk profilu
 */
async function getProfileStats(profileId: string): Promise<ProfileStatsDTO> {
  const response = await fetch(`/api/profiles/${profileId}/stats`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
}

// Użycie:
const stats = await getProfileStats('profile-uuid');
console.log(`Statystyki dla ${stats.display_name}:`);
console.log(`- Opanowane słowa: ${stats.words_mastered}/${stats.total_words_attempted}`);
console.log(`- Procent opanowania: ${stats.mastery_percentage.toFixed(1)}%`);
console.log(`- Łączne gwiazdki: ${stats.total_stars}`);

/**
 * Przykład 5: Pobieranie słownictwa z filtrowaniem
 */
async function getVocabulary(
  category?: string,
  limit: number = 50
): Promise<VocabularyListDTO> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  params.append('limit', limit.toString());

  const response = await fetch(`/api/vocabulary?${params}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch vocabulary');
  }

  return response.json();
}

// Użycie:
const { vocabulary, pagination } = await getVocabulary('zwierzeta', 20);
vocabulary.forEach(word => {
  console.log(`${word.word_text} - ${word.category} (poziom ${word.difficulty_level})`);
});

/**
 * Przykład 6: Tworzenie sesji gry
 */
async function createGameSession(
  command: CreateGameSessionCommand
): Promise<GameSessionDTO> {
  const response = await fetch('/api/game/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Użycie:
const gameSession = await createGameSession({
  profile_id: 'profile-uuid',
  category: 'zwierzeta',
  word_count: 10,
});

console.log(`Sesja gry utworzona: ${gameSession.session_id}`);
console.log(`Algorytm: ${gameSession.algorithm.description}`);
console.log(`Słowa do nauki (${gameSession.words.length}):`);
gameSession.words.forEach((word, index) => {
  console.log(`${index + 1}. ${word.word_text} - ${word.is_mastered ? '✓' : '○'}`);
});

/**
 * Przykład 7: Zapisywanie pojedynczego wyniku
 */
async function recordSingleProgress(
  command: RecordProgressCommand
): Promise<ProgressRecordDTO> {
  const response = await fetch('/api/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Użycie:
const progressResult = await recordSingleProgress({
  profile_id: 'profile-uuid',
  vocabulary_id: 'word-uuid',
  is_correct: true,
  attempt_number: 1,
});

console.log(`Postęp zapisany dla słowa: ${progressResult.word_details.word_text}`);
console.log(`Zdobyte gwiazdki: ${progressResult.stars_earned}`);
console.log(`Opanowane: ${progressResult.is_mastered ? 'TAK' : 'NIE'}`);

/**
 * Przykład 8: Zapisywanie wielu wyników (batch)
 */
async function recordBatchProgress(
  command: RecordBatchProgressCommand
): Promise<BatchProgressResponseDTO> {
  const response = await fetch('/api/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

// Użycie:
const batchResult = await recordBatchProgress({
  profile_id: 'profile-uuid',
  results: [
    { vocabulary_id: 'word-uuid-1', is_correct: true, attempt_number: 1 },
    { vocabulary_id: 'word-uuid-2', is_correct: false, attempt_number: 2 },
    { vocabulary_id: 'word-uuid-3', is_correct: true, attempt_number: 1 },
  ],
});

console.log(`Przetworzono ${batchResult.processed} wyników:`);
batchResult.results.forEach(result => {
  if (result.status === 'success') {
    console.log(`✓ ${result.vocabulary_id}: ${result.stars_earned} gwiazdek`);
  } else {
    console.log(`✗ ${result.vocabulary_id}: ${result.error_message}`);
  }
});

// ============================================================================
// PRZYKŁADY REACT COMPONENTS
// ============================================================================

/**
 * Przykład 9: Komponent React z typami
 */
import { useState, useEffect } from 'react';

interface ProfileCardProps {
  profileId: string;
}

function ProfileCard({ profileId }: ProfileCardProps) {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [stats, setStats] = useState<ProfileStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [profileData, statsData] = await Promise.all([
          fetch(`/api/profiles/${profileId}`).then(r => r.json()) as Promise<ProfileDTO>,
          fetch(`/api/profiles/${profileId}/stats`).then(r => r.json()) as Promise<ProfileStatsDTO>,
        ]);
        setProfile(profileData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [profileId]);

  if (loading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd: {error}</div>;
  if (!profile || !stats) return null;

  return (
    <div className="profile-card">
      <img src={profile.avatar_url || '/default-avatar.png'} alt={profile.display_name} />
      <h2>{profile.display_name}</h2>
      <div className="stats">
        <div>Opanowane słowa: {stats.words_mastered}/{stats.total_words_attempted}</div>
        <div>Procent: {stats.mastery_percentage.toFixed(1)}%</div>
        <div>Gwiazdki: ⭐ {stats.total_stars}</div>
      </div>
    </div>
  );
}

/**
 * Przykład 10: Formularz tworzenia profilu z walidacją
 */
import { useForm } from 'react-hook-form';

function CreateProfileForm() {
  const { register, handleSubmit, formState: { errors }, setError } = 
    useForm<CreateProfileCommand>();

  const onSubmit = async (data: CreateProfileCommand) => {
    try {
      const newProfile = await createChildProfile(data);
      console.log('Profil utworzony:', newProfile);
      // Redirect lub pokazanie sukcesu
    } catch (err) {
      if (err instanceof Error) {
        setError('root', { message: err.message });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Imię dziecka</label>
        <input
          {...register('display_name', {
            required: 'Imię jest wymagane',
            minLength: { value: 2, message: 'Minimum 2 znaki' },
            maxLength: { value: 50, message: 'Maksimum 50 znaków' },
          })}
        />
        {errors.display_name && <span>{errors.display_name.message}</span>}
      </div>

      <div>
        <label>Avatar URL</label>
        <input {...register('avatar_url')} />
      </div>

      <div>
        <label>Język</label>
        <select {...register('language_code')}>
          <option value="pl">Polski</option>
          <option value="en">English</option>
        </select>
      </div>

      {errors.root && <div className="error">{errors.root.message}</div>}

      <button type="submit">Utwórz profil</button>
    </form>
  );
}

/**
 * Przykład 11: Komponent gry z sesją
 */
interface GameProps {
  profileId: string;
  category?: string;
}

function Game({ profileId, category }: GameProps) {
  const [session, setSession] = useState<GameSessionDTO | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [answers, setAnswers] = useState<RecordProgressCommand[]>([]);

  useEffect(() => {
    async function startGame() {
      const newSession = await createGameSession({
        profile_id: profileId,
        category: category as any,
        word_count: 10,
      });
      setSession(newSession);
    }
    startGame();
  }, [profileId, category]);

  const handleAnswer = async (isCorrect: boolean, attemptNumber: number) => {
    if (!session) return;

    const currentWord = session.words[currentWordIndex];
    
    const answer: RecordProgressCommand = {
      profile_id: session.profile_id,
      vocabulary_id: currentWord.id,
      is_correct: isCorrect,
      attempt_number: attemptNumber,
    };

    setAnswers([...answers, answer]);

    if (currentWordIndex < session.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Koniec gry - wyślij wszystkie odpowiedzi
      await recordBatchProgress({
        profile_id: session.profile_id,
        results: answers.map(a => ({
          vocabulary_id: a.vocabulary_id,
          is_correct: a.is_correct,
          attempt_number: a.attempt_number,
        })),
      });
    }
  };

  if (!session) return <div>Ładowanie gry...</div>;

  const currentWord = session.words[currentWordIndex];

  return (
    <div className="game">
      <div className="progress">
        Słowo {currentWordIndex + 1} z {session.words.length}
      </div>
      <img src={currentWord.image_url} alt="Obrazek" />
      <div className="word">{currentWord.word_text}</div>
      <div className="buttons">
        <button onClick={() => handleAnswer(true, 1)}>Poprawnie (1 próba)</button>
        <button onClick={() => handleAnswer(true, 2)}>Poprawnie (2 próby)</button>
        <button onClick={() => handleAnswer(false, 3)}>Niepoprawnie</button>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper function do pobierania tokenu (przykład)
 */
function getAuthToken(): string {
  // W rzeczywistej aplikacji token byłby w localStorage, cookie lub context
  return localStorage.getItem('auth_token') || '';
}

/**
 * Helper function do formatowania dat
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Helper function do obliczania czasu od ostatniej próby
 */
function getTimeSinceLastAttempt(lastAttemptedAt: string | null): string {
  if (!lastAttemptedAt) return 'Nigdy';
  
  const now = new Date();
  const lastAttempt = new Date(lastAttemptedAt);
  const diffMs = now.getTime() - lastAttempt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins} minut temu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} godzin temu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} dni temu`;
}

/**
 * Helper function do obliczania poziomu trudności na podstawie statystyk
 */
function calculateDifficultyLevel(
  attemptsCount: number,
  isMastered: boolean
): 'easy' | 'medium' | 'hard' {
  if (isMastered && attemptsCount <= 2) return 'easy';
  if (isMastered && attemptsCount <= 5) return 'medium';
  return 'hard';
}

export {
  createChildProfile,
  getProfiles,
  updateProfile,
  getProfileStats,
  getVocabulary,
  createGameSession,
  recordSingleProgress,
  recordBatchProgress,
  ProfileCard,
  CreateProfileForm,
  Game,
  formatDate,
  getTimeSinceLastAttempt,
  calculateDifficultyLevel,
};
