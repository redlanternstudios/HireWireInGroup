-- The replaced functions retained explicit anon grants from earlier migrations.
-- Remove those grants after the product boundary repair.

revoke execute on function public.is_amina_member() from anon;
revoke execute on function public.is_hirewire_member() from anon;
revoke execute on function public.is_feature_enabled(text, uuid) from anon;
