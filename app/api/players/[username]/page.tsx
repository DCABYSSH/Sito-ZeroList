'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Player, tierPointsMap } from '@/types/player';
import { ArrowLeft } from 'lucide-react';

const modes = ['Sword', 'NethPot', 'DiaPot', 'SMP', 'Axe', 'UHC', 'Mace', 'SpearMace', 'Cpvp'];

export default function PlayerProfile() {
  const params = useParams();
  const username = params.username as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cerchiamo il player direttamente dai dati dell'API esistente
    fetch('/api/players')
      .then(res => res.json())
      .then((data: Player[]) => {
        const found = data.find(p => p.username.toLowerCase() === username.toLowerCase());
        setPlayer(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold">
        Caricamento profilo...
      </div>
    );
  }
  
  if (!player) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-bold">
        <p className="text-xl mb-4 text-slate-400">Giocatore non trovato.</p>
        <Link href="/" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/20">
          Torna alla Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-12 relative overflow-hidden flex flex-col items-center">
      {/* Sfondo sfumato neon */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-500/10 blur-[140px] pointer-events-none rounded-full"></div>

      <div className="max-w-4xl w-full relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-8 font-semibold">
          <ArrowLeft size={20} />
          Torna alla Classifica
        </Link>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row gap-10 items-center md:items-start">
          
          {/* Skin & Informazioni Principali */}
          <div className="flex flex-col items-center bg-slate-950/80 p-6 rounded-2xl border border-slate-800 w-full md:w-1/3 shadow-inner">
            <Image 
              src={`https://skins.mcstats.com/body/front/${player.uuid}`} 
              alt={player.username} 
              width={150} 
              height={300} 
              className="w-auto h-64 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-300"
              unoptimized
            />
            <h1 className="text-3xl font-black mt-6 tracking-tight drop-shadow-[0_0_10px_rgba(56,189,248,0.5)] text-white">
              {player.username}
            </h1>
            <div className="mt-4 flex flex-col items-center w-full bg-slate-900 rounded-xl py-3 border border-slate-800/50">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Punti Totali</span>
              <span className="text-2xl font-black text-sky-400">{player.totalPoints || 0}</span>
            </div>
          </div>

          {/* Griglia Tier Assegnati */}
          <div className="flex-1 w-full">
            <h2 className="text-xl font-bold text-slate-300 border-b border-slate-800 pb-3 mb-6">
              Tier Assegnati
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {modes.map(mode => {
                const tier = (player as any)[mode] || 'Unranked';
                const points = tierPointsMap[tier] || 0;
                const isUnranked = tier === 'Unranked';

                return (
                  <div key={mode} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                    isUnranked 
                      ? 'bg-slate-950/50 border-slate-800/50 text-slate-500' 
                      : 'bg-slate-900 border-sky-500/30 hover:border-sky-500/70 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] hover:-translate-y-1'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Image 
                        src={`/icons/${mode.toLowerCase()}.svg`} 
                        alt={mode} 
                        width={20} 
                        height={20} 
                        className={`w-5 h-5 object-contain ${isUnranked ? 'opacity-30 grayscale' : ''}`} 
                      />
                      <span className="font-bold text-sm">{mode}</span>
                    </div>
                    <span className={`text-xl font-black ${isUnranked ? 'text-slate-600' : 'text-sky-400'}`}>
                      {tier}
                    </span>
                    {!isUnranked && (
                      <span className="text-xs font-semibold text-slate-400 mt-1">
                        {points} Punti
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}