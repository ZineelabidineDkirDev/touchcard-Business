-- RLS policies invoke narrowly scoped helpers in the non-exposed private schema.
grant usage on schema private to anon, authenticated;
