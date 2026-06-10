'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/lib/supabase/client';
import { Plus, Search, Filter } from 'lucide-react';

/**
 * SCREEN 01 — EVIDENCE VAULT (List View)
 *
 * Displays all evidence items for the authenticated user.
 * Entry point to the Evidence CRUD flow (Screens 01-06).
 *
 * Hard constraints:
 * - DEC-001: No business logic here. All reads go direct to Supabase via RLS-guarded client.
 * - DEC-002: Evidence items are the source of truth for all downstream resume claims.
 * - All async states: loading skeleton, empty state, error state.
 * - RLS: user sees ONLY their own evidence. No server-side user ID injection needed.
 *
 * Data flow:
 * 1. useSupabase() gives browser client (anon key + session cookie)
 * 2. SELECT from evidence_library WHERE user_id = auth.uid() (enforced by RLS)
 * 3. Display cards. Click → Screen 03 (detail/edit).
 * 4. "Add Evidence" → Screen 02 (upload).
 */

type EvidenceCategory = 'achievement' | 'testimonial' | 'metric' | 'project_outcome' | 'skill' | 'other';

interface EvidenceItem {
  id: string;
  title: string;
  content: string;
  category: EvidenceCategory;
  locked: boolean;
  createdAt: string;
  tags: string[];
}

const CATEGORY_COLORS: Record<EvidenceCategory, string> = {
  achievement: 'bg-[#22C55E] text-white',
  testimonial: 'bg-[#D6AAA3] text-[#2C2926]',
  metric: 'bg-[#EAB308] text-[#2C2926]',
  project_outcome: 'bg-[#8E9878] text-white',
  skill: 'bg-[#9CA3AF] text-white',
  other: 'bg-[#E5E7EB] text-[#2C2926]',
};

const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  achievement: 'Achievement',
  testimonial: 'Testimonial',
  metric: 'Metric',
  project_outcome: 'Project Outcome',
  skill: 'Skill',
  other: 'Other',
};

// Skeleton card for loading state
function EvidenceCardSkeleton() {
  return (
    <div className="border-l-4 border-l-[#E5E7EB] bg-white rounded-lg p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-[#E5E7EB] rounded w-3/4 mb-3" />
          <div className="h-3 bg-[#E5E7EB] rounded w-full mb-2" />
          <div className="h-3 bg-[#E5E7EB] rounded w-2/3" />
        </div>
        <div className="ml-4 h-6 w-20 bg-[#E5E7EB] rounded-full" />
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-5 w-16 bg-[#E5E7EB] rounded-full" />
        <div className="h-5 w-12 bg-[#E5E7EB] rounded-full" />
      </div>
    </div>
  );
}

// Single evidence card
function EvidenceCard({
  item,
  onClick,
}: {
  item: EvidenceItem;
  onClick: (item: EvidenceItem) => void;
}) {
  const borderColor = item.locked ? 'border-l-[#22C55E]' : 'border-l-[#EAB308]';

  return (
    <Card
      onClick={() => onClick(item)}
      className={`relative cursor-pointer border-l-4 ${borderColor} bg-white p-5 transition-shadow hover:shadow-md`}
      aria-label={`Evidence: ${item.title}. Category: ${CATEGORY_LABELS[item.category]}. ${item.locked ? 'Locked.' : 'Unlocked.'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#2C2926] truncate mb-1">{item.title}</h3>
          <p className="text-sm text-[#6B7280] line-clamp-2">{item.content}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <Badge className={CATEGORY_COLORS[item.category]}>
            {CATEGORY_LABELS[item.category]}
          </Badge>
        </div>
      </div>

      {/* Tags + meta */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
        <span className="text-xs text-[#9CA3AF] ml-auto">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* LOCKED stamp */}
      {item.locked && (
        <div
          className="absolute bottom-3 right-3 pointer-events-none select-none opacity-20"
          aria-hidden="true"
        >
          <span className="text-[#22C55E] font-bold text-xs -rotate-45 inline-block">
            ✓ LOCKED
          </span>
        </div>
      )}
    </Card>
  );
}

export function Screen01EvidenceVault() {
  const { supabase, session } = useSupabase();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<EvidenceCategory | 'all'>('all');

  const fetchEvidence = async () => {
    if (!session?.user.id) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('evidence_library')
        .select('id, title, content, category, locked, created_at, tags')
        .order('created_at', { ascending: false });

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setItems(
        (data || []).map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          category: row.category as EvidenceCategory,
          locked: row.locked === true,
          createdAt: row.created_at,
          tags: Array.isArray(row.tags) ? row.tags : [],
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [session, filterCategory]);

  // Client-side search filter
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EB] to-[#F2ECE4] p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[Canela] text-4xl md:text-5xl text-[#2C2926] mb-2">
              Evidence Vault
            </h1>
            <p className="text-[#6B7280]">
              {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Button
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white min-h-[44px] gap-2"
            aria-label="Add new evidence"
          >
            <Plus className="w-4 h-4" />
            Add Evidence
          </Button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search evidence…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white text-[#2C2926] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D6AAA3]"
              aria-label="Search evidence items"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#9CA3AF]" aria-hidden="true" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as EvidenceCategory | 'all')}
              className="border border-[#E5E7EB] rounded-lg px-3 py-2.5 bg-white text-[#2C2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#D6AAA3]"
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {(Object.keys(CATEGORY_LABELS) as EvidenceCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Card className="bg-[#FEF2F2] border border-[#EF4444] p-5 mb-6" role="alert">
            <p className="text-[#EF4444] font-semibold">Failed to load evidence</p>
            <p className="text-sm text-[#EF4444] mt-1">{error}</p>
            <Button
              onClick={fetchEvidence}
              variant="outline"
              className="mt-3 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
            >
              Retry
            </Button>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading evidence items">
            {Array.from({ length: 4 }).map((_, i) => (
              <EvidenceCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <Card className="bg-white border border-dashed border-[#D6AAA3] p-12 text-center">
            {search || filterCategory !== 'all' ? (
              <>
                <p className="text-[#6B7280] text-lg mb-2">No evidence matches your search.</p>
                <Button
                  variant="ghost"
                  onClick={() => { setSearch(''); setFilterCategory('all'); }}
                  className="text-[#D6AAA3]"
                >
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <p className="text-[#6B7280] text-lg mb-3">Your vault is empty.</p>
                <p className="text-sm text-[#9CA3AF] mb-6">
                  Add evidence to start building a verified career story.
                </p>
                <Button className="bg-[#22C55E] hover:bg-[#16A34A] text-white min-h-[44px] gap-2">
                  <Plus className="w-4 h-4" />
                  Add Your First Evidence
                </Button>
              </>
            )}
          </Card>
        )}

        {/* Evidence list */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((item) => (
              <EvidenceCard
                key={item.id}
                item={item}
                onClick={(i) => {
                  // Navigate to Screen 03 (detail view)
                  // Routing handled by Next.js App Router
                  window.location.href = `/evidence/${i.id}`;
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Screen01EvidenceVault;
