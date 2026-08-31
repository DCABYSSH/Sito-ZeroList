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
      header: selectedMode === 'Overall' ? 'Modalità' : 'Tier Assegnato',
      cell: ({ row }: { row: Row<Player> }) => {
        const p = row.original;
        if (selectedMode !== 'Overall') {
          const tier = (p as Record<string, any>)[selectedMode] || 'Unranked';
          return (
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-black text-sm border shadow-md ${getTierBadgeStyle(tier)}`}>
              <Image src={`/icons/${selectedMode.toLowerCase()}.svg`} alt={selectedMode} width={16} height={16} className="w-4 h-4 object-contain" />
              {tier}
            </span>
          );
        }
        const activeModes = modes.filter(m => m !== 'Overall' && (p as Record<string, any>)[m] !== 'Unranked');
        return (
          <div className="flex flex-wrap gap-2 max-w-lg">
            {activeModes.map(m => (
              <span key={m} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-bold border transition-colors ${getTierBadgeStyle((p as Record<string, any>)[m])}`}>
                <Image src={`/icons/${m.toLowerCase()}.svg`} alt={m} width={14} height={14} className="w-3.5 h-3.5 object-contain" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto mb-12">
          <motion.div whileHover={{ y: -2 }} className="bg-slate-900/60 backdrop-blur-xl border border-sky-500/20 p-5 rounded-3xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20 flex items-center justify-center">
                <Image src="/icons/players.svg" alt="Giocatori" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Giocatori</div>
                <div className="text-2xl font-black text-white">{data.length}</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div whileHover={{ y: -2 }} className="bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 p-5 rounded-3xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 flex items-center justify-center">
                <Image src="/icons/first-place.svg" alt="Primo Attuale" width={24} height={24} className="w-6 h-6 object-contain" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Primo Attuale</div>
                <div className="text-2xl font-black text-amber-400 break-words pr-2">
                  {filteredData[0]?.username || 'N/A'}
                </div>
              </div>
            </div>
          </motion.div>
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
                      <Image src={`/icons/${m.toLowerCase()}.svg`} alt={m} width={18} height={18} className="w-4 h-4 object-contain" />
                    ) : (
                      <Trophy size={18} />
                    )}
                    {m}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Cerca giocatore..."
              className="w-full pl-11 pr-10 py-3.5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 transition-all shadow-inner"
            />
            {globalFilter && (
              <button onClick={() => setGlobalFilter('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            )}
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

              const rankTextColors = isFirst ? 'text-yellow-400' : isSecond ? 'text-slate-300' : 'text-orange-400';

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
                      
                      <div className={`text-5xl font-black ${rankTextColors} drop-shadow-md mb-2`}>
                        #{player.rank}
                      </div>
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
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center p-1.5">
                            <Image src={`/icons/${m.toLowerCase()}.svg`} alt={m} width={20} height={20} className="object-contain" />
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
