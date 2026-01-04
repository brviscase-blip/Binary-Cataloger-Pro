
export interface CandleData {
  datetime_mao: string;
  cor: string;
}

export enum CandleColor {
  GREEN = 'VERDE',
  RED = 'VERMELHO',
  DOJI = 'DOJI',
  GRAY = 'CINZA'
}

export interface Stats {
  total: number;
  green: number;
  red: number;
  doji: number;
  winRate: string;
}
