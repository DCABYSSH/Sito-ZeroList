import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { tierPointsMap, Player } from '@/types/player';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM players');
    const players = rows as Player[];

    const playersWithPoints = players.map(player => {
      let total = 0;
      const modes = ['Sword', 'NethPot', 'DiaPot', 'SMP', 'Axe', 'UHC', 'Mace', 'SpearMace'] as const;
      
      modes.forEach(mode => {
        const tier = player[mode] || 'Unranked';
        total += tierPointsMap[tier] || 0;
      });

      return {
        ...player,
        totalPoints: total
      };
    });

    playersWithPoints.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

    return NextResponse.json(playersWithPoints);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Errore nel recupero dei dati' }, { status: 500 });
  }
}