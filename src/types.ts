export interface Student {
  matricula: string;
  av1Total: number;
  atividadeParcial2: number;
  atividadeFinal2: number;
  atividadeFinal2Pap: number;
  av2Total: number;
  atividadeAvaliativa3: number;
  atividadeAvaliativa3Pap: number;
  atividadeExtra: number;
  av3Total: number;
  totalCurso: number;
  // Computed variables
  mediaParcial: number; // (AV1 + AV2) / 2
  reprovadoParcial: boolean; // mediaParcial < 4.0
  reprovadoAV3: boolean; // av3Total < 4.0 (for those who did AV3)
  aprovadoFinal: boolean; // mediaParcial >= 4.0 && av3Total >= 4.0 && totalCurso >= 5.0
  status: 'Aprovado' | 'Reprovado no Percurso' | 'Reprovado na AV3' | 'Reprovado por Média Final';
  cluster?: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    tp: number; // True Positive (Approved predicted Approved)
    tn: number; // True Negative (Reproved predicted Reproved)
    fp: number; // False Positive (Reproved predicted Approved)
    fn: number; // False Negative (Approved predicted Reproved)
  };
}

export interface ClusterInfo {
  id: number;
  name: string;
  color: string;
  description: string;
  count: number;
  avgAV1: number;
  avgAV2: number;
  avgAV3: number;
  avgTotal: number;
  approvedRate: number;
}
