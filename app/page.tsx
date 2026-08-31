'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel, 
  flexRender, 
  ColumnDef, 
  Row 
} from '@tanstack/react-table';
import { Player } from '@/types/player';
import { 
  Trophy, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink
} from 'lucide-react';

const TIER_POINTS_MAP: Record<string, number> = {
  HT1: 60, LT1: 45, HT2: 30, LT2: 20, HT3: 10,
  LT3: 6, HT4: 4, LT4: 3, HT5: 2, LT5: 1,
};

const modes = ['Overall', 'Sword', 'NethPot', 'DiaPot', 'SMP', 'Axe', 'UHC', 'Mace', 'SpearMace', 'Cpvp'] as const;

const getTierBadgeStyle = (tier: string) => {
  switch (tier) {
    case 'HT1': return 'bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    case 'LT1': return 'bg-purple-500/15 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]';
    case 'HT2': return 'bg-sky-500/15 text-sky-300 border-sky-500/50 shadow-[0_0_10px_rgba(14,165,233,0.2)]';
    case 'LT2': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50';
    case 'HT3': case 'LT3': return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
    default: return 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  }
};

// --- Icone native inline (nessun file .svg caricato) ---

function IconPlayers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="9" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.2 19c0-2.1 1.1-3.9 3.3-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconFirstPlace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 3.2l2.15 4.4 4.85.7-3.5 3.4.83 4.85L12 14.2l-4.33 2.35.83-4.85-3.5-3.4 4.85-.7L12 3.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ModeIcon({ mode, className }: { mode: string; className?: string }) {
  const props = { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', className } as const;
  switch (mode) {
    case 'Sword':
      return (
        <svg {...props}>
          <path d="M5 19l8.2-8.2M13.5 9.7l3.6-3.6a1.3 1.3 0 0 0 0-1.9l-.7-.7a1.3 1.3 0 0 0-1.9 0l-3.6 3.6M13.5 9.7l-3.5-3.5M6.7 17.3L5 19l-1.5-.4L3.1 17l1.6-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'NethPot':
      return (
        <svg {...props}>
          <path d="M9.6 3.2h4.8M10.1 3.2v2.9c0 .5-.2.9-.5 1.3L7.2 9.8c-.6.6-.9 1.4-.9 2.2v5.4A2.9 2.9 0 0 0 9.2 20h5.6a2.9 2.9 0 0 0 2.9-2.9V12c0-.8-.3-1.6-.9-2.2l-2.4-2.4a1.9 1.9 0 0 1-.5-1.3V3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="14.8" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'DiaPot':
      return (
        <svg {...props}>
          <path d="M9.6 3.2h4.8M10.1 3.2v2.9c0 .5-.2.9-.5 1.3L7.2 9.8c-.6.6-.9 1.4-.9 2.2v5.4A2.9 2.9 0 0 0 9.2 20h5.6a2.9 2.9 0 0 0 2.9-2.9V12c0-.8-.3-1.6-.9-2.2l-2.4-2.4a1.9 1.9 0 0 1-.5-1.3V3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 12.3l1.9 2.1-1.9 2.1-1.9-2.1 1.9-2.1z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'SMP':
      return (
        <svg {...props}>
          <path d="M4 9.8L9.8 4l1.9 1.9-5.8 5.8-1.9-1.9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M9.7 7.6l7.9 7.9-2.4 2.4-7.9-7.9" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M4.6 19.4l2.9-2.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'Axe':
      return (
        <svg {...props}>
          <path d="M12.8 4.1c2.9.4 5.1 2.6 5.5 5.5-3.2.5-6.4-1-8.3-3.5l2.8-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M9.8 6.3L4.6 19.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'UHC':
      return (
        <svg {...props}>
          <path d="M12 19.8s-6.8-4.3-6.8-9.3c0-2.7 2.1-5 4.6-5 1 0 1.9.4 2.2 1.3.3-.9 1.2-1.3 2.2-1.3 2.5 0 4.6 2.3 4.6 5 0 5-6.8 9.3-6.8 9.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'Mace':
      return (
        <svg {...props}>
          <path d="M8.2 19.6L14 7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12.6 5.6l1.7-1.7a.9.9 0 0 1 1.3 0l.5.5a.9.9 0 0 1 0 1.3l-1.7 1.7M10.7 7l-1.7 1.7a.9.9 0 0 0 0 1.3l.5.5a.9.9 0 0 0 1.3 0L12.5 8.8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'SpearMace':
      return (
        <svg {...props}>
          <path d="M5 19L18 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M18 6l1.4-2.8M18 6l2.8 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'Cpvp':
      return (
        <svg {...props}>
          <path d="M12 3.3l4 4.1-4 13.3-4-13.3 4-4.1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8 7.4h8" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    default:
      return null;
  }
}

interface LeaderboardPlayer {
  username: string;
  elo: number;
  rank: number;
  uuid: string;
  tier?: string;
  fullData?: Player;
}

const computeOverallPoints = (player: Player): number => {
  return modes.reduce((acc, m) => {
    if (m === 'Overall') return acc;
    const tier = (player as Record<string, any>[any])[m];
    return acc + (TIER_POINTS_MAP[tier] || 0);
  }, 0);
};

export default function Home() {
  const [data, setData] = useState<Player[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>('Overall');
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetch('/api/players')
      .then(res => res.json())
      .then(fetchedData => {
        if (Array.isArray(fetchedData)) setData(fetchedData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    return [...data].map(p => ({
      ...p,
      calculatedOverall: computeOverallPoints(p)
    })).sort((a, b) => {
      if (selectedMode === 'Overall') return (b as any).calculatedOverall - (a as any).calculatedOverall;
      const tierA = (a as Record<string, any>)[selectedMode] || 'Unranked';
      const tierB = (b as Record<string, any>)[selectedMode] || 'Unranked';
      return (TIER_POINTS_MAP[tierB] || 0) - (TIER_POINTS_MAP[tierA] || 0);
    });
  }, [data, selectedMode]);

  // Suggerimenti per l'autocomplete della ricerca ("Confronto")
  const searchSuggestions = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    if (!q) return [];
    return data
      .filter(p => p.username.toLowerCase().includes(q))
      .slice(0, 6);
  }, [data, globalFilter]);

  const top3Podium = useMemo<LeaderboardPlayer[]>(() => {
    return filteredData.slice(0, 3).map((p, idx) => {
      const tier = (p as Record<string, any>)[selectedMode] || 'Unranked';
      const elo = selectedMode === 'Overall' ? (p as any).calculatedOverall : (TIER_POINTS_MAP[tier] || 0);
      return { username: p.username, uuid: p.uuid, elo, rank: idx + 1, tier, fullData: p };
    });
  }, [filteredData, selectedMode]);

  const tableData = useMemo(() => filteredData.slice(3), [filteredData]);

  const columns = useMemo<ColumnDef<Player, any>[]>(() => [
    {
      id: 'rank',
      header: '#',
      cell: ({ row }: { row: Row<Player> }) => (
        <span className="font-black text-sky-400 text-lg">{row.index + 4}</span>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Giocatore',
      cell: ({ row }: { row: Row<Player> }) => {
        const player = row.original;
        const currentTier = (player as Record<string, any>)[selectedMode] || 'Unranked';
        const overallPts = (player as any).calculatedOverall || computeOverallPoints(player);
        
        return (
          <div 
            onClick={() => setSelectedPlayer(player)}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-sky-500/50 transition-all duration-300 group-hover:scale-105">
              <Image 
                src={`https://skins.mcstats.com/bust/${player.uuid}`} 
                alt={player.username} 
                fill
                className="object-contain object-top" 
                unoptimized 
              />
            </div>
            <div>
              <div className="font-bold text-white text-base group-hover:text-sky-400 transition-colors">
                {player.username}
              </div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">
                {selectedMode === 'Overall' 
                  ? `${overallPts} punti totali` 
                  : `Tier: ${currentTier} (${TIER_POINTS_MAP[currentTier] || 0} pt)`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'tiers',
      header: selectedMode === 'Overall' ? 'Modalità' : 'Test',
      cell: ({ row }: { row: Row<Player> }) => {
        const p = row.original;
        if (selectedMode !== 'Overall') {
          const tier = (p as Record<string, any>)[selectedMode] || 'Unranked';
          return (
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-black text-sm border shadow-md ${getTierBadgeStyle(tier)}`}>
              <ModeIcon mode={selectedMode} className="w-4 h-4 object-contain" />
              {tier}
            </span>
          );
        }
        const activeModes = modes.filter(m => m !== 'Overall' && (p as Record<string, any>)[m] !== 'Unranked');
        return (
          <div className="flex flex-wrap gap-2 max-w-lg">
            {activeModes.map(m => (
              <span key={m} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-bold border transition-colors ${getTierBadgeStyle((p as Record<string, any>)[m])}`}>
                <ModeIcon mode={m} className="w-3.5 h-3.5 object-contain" />
                {(p as Record<string, any>)[m]}
              </span>
            ))}
          </div>
        );
      }
    }
  ], [selectedMode]);

  const table = useReactTable({
    data: tableData,
    columns,
    initialState: { pagination: { pageSize: 10 } },
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleCopyUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-bold gap-4">
      <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 md:p-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-3">
            ZeroGrade <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">Tierlist</span>
          </h1>
          <div className="w-24 h-1.5 bg-gradient-to-r from-sky-500 to-blue-600 mx-auto rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
        </div>

        {/* Statistiche */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 pl-1">
            Statistiche
          </div>
          <div className="flex items-stretch bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex-1 flex items-center gap-3 px-6 py-5">
              <IconPlayers className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <div className="text-2xl font-black text-white leading-none">{data.length}</div>
                <div className="text-[11px] text-slate-500 font-semibold mt-1.5">Giocatori registrati</div>
              </div>
            </div>
            <div className="w-px bg-slate-800" />
            <div className="flex-1 flex items-center gap-3 px-6 py-5 min-w-0">
              <IconFirstPlace className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-2xl font-black text-amber-400 leading-none truncate">
                  {filteredData[0]?.username || 'N/A'}
                </div>
                <div className="text-[11px] text-slate-500 font-semibold mt-1.5">Primo in classifica</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-16">
          <div className="flex gap-1.5 p-1.5 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-inner overflow-x-auto w-full lg:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {modes.map(m => {
              const isActive = selectedMode === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMode(m)}
                  className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl shadow-lg shadow-sky-500/25"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {m !== 'Overall' ? (
                      <ModeIcon mode={m} className="w-4 h-4 object-contain" />
                    ) : (
                      <Trophy size={18} />
                    )}
                    {m}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Confronto: ricerca con autocomplete */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={e => { setGlobalFilter(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              placeholder="Cerca giocatore..."
              className="w-full pl-11 pr-10 py-3.5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 transition-all shadow-inner"
            />
            {globalFilter && (
              <button onClick={() => setGlobalFilter('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            )}

            <AnimatePresence>
              {showSuggestions && searchSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-30"
                >
                  {searchSuggestions.map(p => (
                    <button
                      key={p.uuid}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setGlobalFilter(p.username);
                        setShowSuggestions(false);
                        setSelectedPlayer(p);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-colors text-left"
                    >
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                        <Image 
                          src={`https://skins.mcstats.com/bust/${p.uuid}`} 
                          alt={p.username} 
                          fill
                          className="object-contain object-top" 
                          unoptimized 
                        />
                      </div>
                      <span className="text-sm font-semibold text-white truncate">{p.username}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {!globalFilter && top3Podium.length > 0 && (
          <div className="flex flex-col items-center md:flex-row justify-center gap-4 md:gap-8 mb-20 mt-10">
            {[top3Podium[1], top3Podium[0], top3Podium[2]].map((player, idx) => {
              if (!player) return <div key={idx} className="w-48 md:w-64" />;
              
              const isFirst = player.rank === 1;
              const isSecond = player.rank === 2;
              const delay = isFirst ? 0 : isSecond ? 0.1 : 0.2;
              
              const podiumColors = isFirst 
                ? 'from-yellow-500 to-amber-600 border-yellow-400/50 shadow-yellow-500/20' 
                : isSecond 
                ? 'from-slate-300 to-slate-500 border-slate-300/50 shadow-slate-400/10'
                : 'from-orange-400 to-orange-600 border-orange-400/50 shadow-orange-500/10';

              return (
                <motion.div 
                  key={player.username}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay, type: 'spring' }}
                  className={`relative flex flex-col items-center ${isFirst ? 'z-30 order-2' : isSecond ? 'z-20 order-1' : 'z-10 order-3'}`}
                >
                  <div 
                    onClick={() => player.fullData && setSelectedPlayer(player.fullData)}
                    className={`relative cursor-pointer group flex justify-center items-end ${isFirst ? 'h-[220px] w-[220px]' : 'h-[170px] w-[170px]'}`}
                  >
                    <div className="absolute bottom-[-15px] w-full h-full">
                      <Image 
                        src={`https://skins.mcstats.com/bust/${player.uuid}`} 
                        alt={player.username} 
                        fill
                        className="object-contain object-bottom drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-300 ease-out" 
                        unoptimized 
                      />
                    </div>
                  </div>

                  <div className={`w-56 md:w-72 bg-gradient-to-b ${podiumColors} p-[1px] rounded-t-3xl rounded-b-2xl shadow-2xl`}>
                    <div className="bg-[#040914] rounded-t-[23px] rounded-b-[15px] p-6 text-center h-full relative overflow-hidden">
                      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-10 blur-2xl opacity-30 bg-gradient-to-b ${podiumColors}`} />

                      <div 
                        onClick={() => player.fullData && setSelectedPlayer(player.fullData)}
                        className="text-xl font-bold text-white truncate cursor-pointer hover:text-sky-400 transition-colors"
                      >
                        {player.username}
                      </div>
                      <div className="text-sm font-semibold text-slate-400 mt-2 bg-slate-900/50 inline-block px-3 py-1 rounded-lg border border-slate-800">
                        {selectedMode === 'Overall' ? `${player.elo} Punti` : `Tier: ${player.tier}`}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-widest">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-6 font-black">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-5 px-6">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="p-10 text-center text-slate-500 font-semibold">
                      Nessun giocatore trovato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800 text-sm text-slate-400">
              <div>
                Pagina <span className="font-bold text-white">{table.getState().pagination.pageIndex + 1}</span> di <span className="font-bold text-white">{table.getPageCount()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-30 hover:bg-slate-800 hover:border-sky-500/50 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white disabled:opacity-30 hover:bg-slate-800 hover:border-sky-500/50 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        <footer className="mt-20 pt-10 border-t border-slate-800/60 text-center">
          <p className="text-lg font-black text-white">
            ZeroGrade <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">entra e domina la classifica</span>
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 mt-5 pb-2 text-xs text-slate-500 font-medium">
            <span>&copy; {new Date().getFullYear()} ZeroGrade Tierlist. Tutti i diritti riservati.</span>
            <span className="hidden md:inline text-slate-700">•</span>
            <span>Made by <span className="text-slate-300 font-bold">00Abyssh_</span></span>
            <span className="hidden md:inline text-slate-700">•</span>
            <a
              href="https://discord.gg/cABR73BsyP"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-bold transition-colors"
            >
              Discord
            </a>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {selectedPlayer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/50 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-sky-500/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none" />

              <button 
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-5 right-5 p-2.5 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 backdrop-blur-md transition-all z-20"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center mb-8 relative z-10 mt-4">
                <div className="relative w-32 h-32 mb-4 group">
                  <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-500" />
                  <Image 
                    src={`https://skins.mcstats.com/bust/${selectedPlayer.uuid}`} 
                    alt={selectedPlayer.username} 
                    fill 
                    className="object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]" 
                    unoptimized 
                  />
                </div>
                <h3 className="text-4xl font-black text-white tracking-tight">{selectedPlayer.username}</h3>
                
                <div className="flex items-center gap-2 mt-3 bg-slate-950/50 p-1.5 pr-2.5 rounded-full border border-slate-800">
                  <span className="text-xs text-slate-400 font-mono px-3 truncate max-w-[200px]">
                    {selectedPlayer.uuid}
                  </span>
                  <button 
                    onClick={() => handleCopyUuid(selectedPlayer.uuid)}
                    className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-sky-400 hover:bg-slate-700 transition-all"
                  >
                    {copied ? <Check className="text-emerald-400" size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="mb-8 bg-gradient-to-r from-sky-500/10 to-blue-600/10 border border-sky-500/20 p-5 rounded-3xl flex items-center justify-between shadow-inner relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl">
                    <Trophy size={24} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-sky-400 uppercase tracking-widest block">Score Finale</span>
                    <span className="text-[11px] text-slate-400 font-medium">Sommatoria punti tier</span>
                  </div>
                </div>
                <span className="text-4xl font-black text-white">
                  {computeOverallPoints(selectedPlayer)}
                </span>
              </div>

              <div className="relative z-10 mb-8">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                  Tiers:
                </h4>
                <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {modes.filter(m => m !== 'Overall').map(m => {
                    const tier = (selectedPlayer as Record<string, any>)[m] || 'Unranked';
                    if (tier === 'Unranked') return null;
                    const points = TIER_POINTS_MAP[tier] || 0;

                    return (
                      <div key={m} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center p-1.5 text-slate-300">
                            <ModeIcon mode={m} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-sm font-bold text-white">{m}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase ${getTierBadgeStyle(tier)}`}>
                            {tier}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold mt-1">+{points}pt</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link 
                href={`/player/${selectedPlayer.username}`}
                className="group flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl bg-white text-slate-950 hover:bg-sky-50 hover:text-sky-600 font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-sky-500/20 z-10 relative"
              >
                <span>Visualizza Profilo</span>
                <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
