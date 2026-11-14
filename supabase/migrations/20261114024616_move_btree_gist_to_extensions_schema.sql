-- Keep the GiST operator extension in Supabase's dedicated extensions schema.
alter extension btree_gist set schema extensions;
