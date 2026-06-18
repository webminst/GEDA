import React, { useState } from 'react';
import { ModelMetrics } from '../types';
import { BinaryClassifier } from '../algorithms';
import { BrainCircuit, Play, Sparkles, TrendingUp, Compass, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MetricsPanelProps {
  metrics: ModelMetrics;
  model: BinaryClassifier;
}

export default function MetricsPanel({ metrics, model }: MetricsPanelProps) {
  const [simAV1, setSimAV1] = useState<number>(5);
  const [simAV2, setSimAV2] = useState<number>(5);
  const [probOfSuccess, setProbOfSuccess] = useState<number | null>(null);

  const runSimulation = () => {
    const prob = model.predictProbability(simAV1, simAV2);
    setProbOfSuccess(parseFloat((prob * 100).toFixed(1)));
  };

  const getStatusColor = (prob: number) => {
    if (prob >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (prob >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const { tp, tn, fp, fn } = metrics.confusionMatrix;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* 1. Model Stats Panel */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit size={20} className="text-violet-500" />
            Métricas de Desempenho do Modelo Preditivo
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Treinado utilizando o algoritmo de <strong>Regressão Logística</strong> sobre os resultados históricos de AV1 e AV2 da turma.
          </p>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <p className="text-xs text-slate-500 font-medium font-sans">Acurácia Geral</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{(metrics.accuracy * 100).toFixed(1)}%</p>
            <span className="text-[10px] text-slate-400">Proporção total de acertos</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <p className="text-xs text-slate-500 font-medium font-sans">Precisão</p>
            <p className="text-2xl font-bold text-violet-600 mt-1">{(metrics.precision * 100).toFixed(1)}%</p>
            <span className="text-[10px] text-slate-400">Evitar falso positivo</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <p className="text-xs text-slate-500 font-medium font-sans">Sensibilidade</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{(metrics.recall * 100).toFixed(1)}%</p>
            <span className="text-[10px] text-slate-400">Capturar aprovados (Recall)</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <p className="text-xs text-slate-500 font-medium font-sans">F1-Score</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{(metrics.f1Score * 100).toFixed(1)}%</p>
            <span className="text-[10px] text-slate-400">Harmonia Precision/Recall</span>
          </div>
        </div>

        {/* Confusion Matrix Section */}
        <div className="mt-2 border-t border-slate-100 pt-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <Compass size={16} className="text-indigo-500" />
            Matriz de Confusão do Modelo
          </h4>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block tracking-wider font-sans">True Positives (TP)</span>
              <span className="text-3xl font-extrabold text-emerald-700 block mt-1">{tp}</span>
              <span className="text-[10px] text-emerald-600">Previsto Aprovado e Aprovou</span>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-rose-800 uppercase block tracking-wider font-sans">False Positives (FP)</span>
              <span className="text-3xl font-extrabold text-rose-700 block mt-1">{fp}</span>
              <span className="text-[10px] text-rose-600">Previsto Aprovado mas Reprovou</span>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-amber-800 uppercase block tracking-wider font-sans">False Negatives (FN)</span>
              <span className="text-3xl font-extrabold text-amber-700 block mt-1">{fn}</span>
              <span className="text-[10px] text-amber-600">Previsto Reprovado mas Aprovou</span>
            </div>

            <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-xl text-center">
              <span className="text-[11px] font-semibold text-sky-800 uppercase block tracking-wider font-sans">True Negatives (TN)</span>
              <span className="text-3xl font-extrabold text-sky-700 block mt-1">{tn}</span>
              <span className="text-[10px] text-sky-600">Previsto Reprovado e Reprovou</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Success Simulator Panel */}
      <div className="bg-violet-950 text-white rounded-2xl p-6 shadow-md border border-violet-900 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-violet-800 rounded-lg text-amber-400">
              <Sparkles size={18} />
            </div>
            <h3 className="text-lg font-bold">Simulador de Probabilidade</h3>
          </div>
          <p className="text-xs text-violet-200 leading-relaxed font-sans">
            Insira notas hipotéticas para um aluno e estime de imediato a probabilidade dele ser aprovado de acordo com seu desempenho do percurso inicial.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {/* AV1 input */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-1 text-violet-200">
                <span>Nota AV1 Total</span>
                <span className="font-bold text-white">{simAV1.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={simAV1}
                onChange={(e) => setSimAV1(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-violet-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* AV2 input */}
            <div>
              <div className="flex justify-between text-xs font-sans mb-1 text-violet-200">
                <span>Nota AV2 Total</span>
                <span className="font-bold text-white">{simAV2.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={simAV2}
                onChange={(e) => setSimAV2(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-violet-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={runSimulation}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-violet-950 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
          >
            <Play size={16} fill="currentColor" />
            Executar Predição
          </button>

          {probOfSuccess !== null && (
            <div className={`mt-4 p-4 border rounded-xl animate-scale-up ${getStatusColor(probOfSuccess)}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-sans uppercase tracking-wider">Probabilidade de Aprovação</span>
                <span className="text-lg font-extrabold">{probOfSuccess}%</span>
              </div>
              
              <div className="mt-2 flex gap-2 text-xs font-sans items-start">
                {probOfSuccess >= 70 ? (
                  <>
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                    <span>Risco de Evasão Baixo. O aluno apresenta forte consistência no percurso acadêmico inicial.</span>
                  </>
                ) : probOfSuccess >= 40 ? (
                  <>
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                    <span>Atenção Necessária! Potencial de recuperação moderado ou dependente da Atividade Final 3.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                    <span>Risco de Desistência Crítico. Requer intervenção pedagógica orientada imediatamente!</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
