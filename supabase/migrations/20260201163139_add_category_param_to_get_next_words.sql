-- Migration: Add category parameter to get_next_words function
-- Date: 2026-02-01
-- Description: Updates get_next_words() to support optional category filtering

-- Drop old function
drop function if exists get_next_words(uuid, varchar, integer);

-- Create updated function with category parameter
create or replace function get_next_words(
  p_profile_id uuid,
  p_category vocabulary_category default null,
  p_limit integer default 10
)
returns table (
  id uuid,
  word_text varchar,
  category vocabulary_category,
  image_path text,
  difficulty_level smallint
) as $$
begin
  -- Krok 1: Sprawdzenie liczby nieznanych słów (brak rekordu w user_progress)
  -- Zwracamy nieznane słowa jeśli jest ich wystarczająco
  return query
  select
    v.id,
    v.word_text,
    v.category,
    v.image_path,
    v.difficulty_level
  from vocabulary v
  where v.language_code = 'pl'
    and (p_category is null or v.category = p_category)
    and not exists (
      select 1
      from user_progress up
      where up.profile_id = p_profile_id
        and up.vocabulary_id = v.id
    )
  order by random()
  limit p_limit;

  return;
end;
$$ language plpgsql;

comment on function get_next_words(uuid, vocabulary_category, integer) is 'Dobiera słowa do sesji gry z opcjonalnym filtrem kategorii';
