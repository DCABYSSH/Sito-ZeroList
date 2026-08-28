export interface Player {
  id: number;
  username: string;
  uuid: string;
  Sword?: string;
  NethPot?: string;
  DiaPot?: string;
  SMP?: string;
  Axe?: string;
  UHC?: string;
  Mace?: string;
  SpearMace?: string;
  Cpvp?: string;
  totalPoints?: number;
}

export const tierPointsMap: Record<string, number> = {
  'HT1': 50,
  'LT1': 45,
  'HT2': 40,
  'LT2': 35,
  'HT3': 30,
  'LT3': 25,
  'HT4': 20,
  'LT4': 15,
  'HT5': 10,
  'LT5': 5,
  'Unranked': 0,
};