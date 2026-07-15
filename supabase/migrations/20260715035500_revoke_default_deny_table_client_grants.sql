-- These tables already use RLS with no policies, which means default deny.
-- Remove unnecessary client grants so they are not discoverable API surfaces.

revoke all privileges on table
  public.amina_comfort_map,
  public.amina_feature_flags,
  public.amina_intent_audit,
  public.amina_moderation_cases,
  public.circle_join_requests,
  public.home_feed_snapshot,
  public.os_ai_context_links,
  public.os_ai_threads,
  public.os_companies,
  public.os_contacts,
  public.os_docs,
  public.os_entity_links,
  public.os_integrations,
  public.os_search_index,
  public.videojobs
from anon, authenticated;
