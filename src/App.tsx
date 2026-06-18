import React, { useState, useMemo, useEffect } from 'react';
import { StudentsDataset, parseCSV } from './data';
import { Student, ModelMetrics, ClusterInfo } from './types';
import { calculateDescriptiveStats, BinaryClassifier, performKMeans } from './algorithms';
import StudentTable from './components/StudentTable';
import MetricsPanel from './components/MetricsPanel';
import PythonCodeViewer from './components/PythonCodeViewer';
import DashboardInsights from './components/DashboardInsights';

// Recharts components
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';

import {
  GraduationCap,
  Percent,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  Database,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Cpu,
  RefreshCw,
  FolderOpen,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [dataset, setDataset] = useState<Student[]>(StudentsDataset);
  const [activeTab, setActiveTab ] = useState<string>('eda');
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);

  // Initialize Classifier and Clusters
  const { model, metrics, clusterData } = useMemo(() => {
    // 1. Train supervised classifier
    const clf = new BinaryClassifier();
    const modelMetrics = clf.train(dataset);

    // 2. Train unsupervised clustering
    const { students: clusteredStudents, clusters } = performKMeans(dataset, 4);

    return {
      model: clf,
      metrics: modelMetrics,
      clusterData: { students: clusteredStudents, clusters }
    };
  }, [dataset]);

  // Overall Statistics Metrics
  const summaryStats = useMemo(() => {
    const total = dataset.length;
    if (total === 0) return { approvedCount: 0, approvedRate: 0, avgFinal: 0, avgAV1: 0, avgAV2: 0, criticalRiskCount: 0 };

    const approvedCount = dataset.filter(s => s.aprovadoFinal).length;
    const approvedRate = (approvedCount / total) * 100;
    
    const avgFinal = dataset.reduce((sum, s) => sum + s.totalCurso, 0) / total;
    const avgAV1 = dataset.reduce((sum, s) => sum + s.av1Total, 0) / total;
    const avgAV2 = dataset.reduce((sum, s) => sum + s.av2Total, 0) / total;

    // Critical Risks are those whose Media Parcial < 4.0
    const criticalRiskCount = dataset.filter(s => s.reprovadoParcial).length;

    const sortedFinals = dataset.map(s => s.totalCurso).sort((a, b) => a - b);
    const mid = Math.floor(sortedFinals.length / 2);
    const medianFinal = sortedFinals.length % 2 === 0 ? (sortedFinals[mid - 1] + sortedFinals[mid]) / 2 : sortedFinals[mid];

    return {
      approvedCount,
      approvedRate: parseFloat(approvedRate.toFixed(1)),
      avgFinal: parseFloat(avgFinal.toFixed(2)),
      medianFinal,
      avgAV1: parseFloat(avgAV1.toFixed(2)),
      avgAV2: parseFloat(avgAV2.toFixed(2)),
      criticalRiskCount
    };
  }, [dataset]);

  // Custom CSV upload handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          throw new Error("Planilha vazia ou com colunas incompatíveis.");
        }
        setDataset(parsed);
        setCsvUploadError(null);
      } catch (err: any) {
        setCsvUploadError(err.message || "Erro de formatação do arquivo.");
      }
    };
    reader.readAsText(file);
  };

  const resetDataset = () => {
    setDataset(StudentsDataset);
    setCsvUploadError(null);
  };

  // Recharts: Distribution of Notes
  const notesDistributionData = useMemo(() => {
    const ranges = Array.from({ length: 11 }, (_, i) => ({
      range: `${i}`,
      count: 0
    }));

    dataset.forEach(s => {
      const rounded = Math.floor(s.totalCurso);
      if (rounded >= 0 && rounded <= 10) {
        ranges[rounded].count++;
      }
    });

    return ranges;
  }, [dataset]);

  // Recharts: Performance scatter plot helper based on cluster
  const scatterPlotData = useMemo(() => {
    return clusterData.students.map(s => ({
      matricula: s.matricula,
      av1: s.av1Total,
      av2: s.av2Total,
      mediaFinal: s.totalCurso,
      cluster: s.cluster
    }));
  }, [clusterData]);

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-700 pb-16">
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-100">
              <Cpu size={24} className="animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display flex items-center gap-2">
                GEDA <span className="font-sans text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Previsão por IA v2.0</span>
              </h1>
              <p className="text-xs text-slate-400 font-sans">Gestão de Desempenho e Indicadores Pedagógicos de Aprovação</p>
            </div>
          </div>

          {/* Action Tools: CSV Uploader */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs rounded-xl border border-slate-200 shadow-sm transition cursor-pointer select-none">
              <Upload size={14} className="text-slate-400" />
              Carregar Planilha .CSV
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>

            <button
              onClick={resetDataset}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition border border-transparent cursor-pointer"
              title="Restaurar Planilha Padrão de 307 Alunos"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex flex-col gap-6 animate-fade-in">
        {/* Error Notification */}
        {csvUploadError && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs text-rose-800 flex items-center gap-2 font-sans font-medium">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>Erro ao processar as colunas: {csvUploadError}. Verifique e tente novamente.</span>
          </div>
        )}

        {/* 2. Static Dashboard Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Alunos */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Total Avaliados</p>
              <p className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{dataset.length}</p>
              <p className="text-[10px] text-slate-400">Estudantes matriculados na base</p>
            </div>
          </div>

          {/* Card 2: Taxa de Aprovação */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Percent size={22} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Taxa Aprovação</p>
              <p className="text-2xl font-bold text-emerald-600 tracking-tight mt-0.5">{summaryStats.approvedRate}%</p>
              <p className="text-[10px] text-slate-400">{summaryStats.approvedCount} alunos aptos</p>
            </div>
          </div>

          {/* Card 3: Média das Notas */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
              <GraduationCap size={22} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Média do Curso</p>
              <p className="text-2xl font-bold text-violet-700 tracking-tight mt-0.5">{summaryStats.avgFinal}</p>
              <p className="text-[10px] text-slate-400">Nota final padrão ponderada</p>
            </div>
          </div>

          {/* Card 4: Alunos em Risco Crítico */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold font-mono">Risco no Percurso</p>
              <p className="text-2xl font-bold text-rose-600 tracking-tight mt-0.5">{summaryStats.criticalRiskCount}</p>
              <p className="text-[10px] text-slate-400">Reprovados na Média Parcial</p>
            </div>
          </div>
        </div>

        {/* 3. Steps Tab Navigation */}
        <div className="bg-white border border-slate-150 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm font-sans max-w-full overflow-x-auto">
          {[
            { id: 'eda', label: '1. Estatística (EDA)', emoji: '📊' },
            { id: 'status', label: '2. Regras & Status', emoji: '⚙️' },
            { id: 'prediction', label: '3. Modelo de Aprovação', emoji: '🧠' },
            { id: 'clusters', label: '4. Perfis (Clusters)', emoji: '🎯' },
            { id: 'code', label: '5. Código Python', emoji: '🐍' },
            { id: 'insights', label: '6. Conselho c/ IA', emoji: '✨' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'hover:bg-slate-50 text-slate-500'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4. Tab Contents rendering */}
        <div className="min-h-[400px]">
          {/* TAB 1: EDA */}
          {activeTab === 'eda' && (
            <div className="flex flex-col gap-6 animate-fade-in font-sans">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Descriptive Table Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Análise Descritiva das Avaliações</h3>
                    <p className="text-xs text-slate-400">Resumo de dispersão e tendências centrais calculados em tempo real.</p>
                  </div>

                  <div className="overflow-hidden border border-slate-100 rounded-xl text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-mono tracking-wider font-semibold">
                          <th className="py-2.5 px-3">Variável</th>
                          <th className="py-2.5 px-3 text-center">Média</th>
                          <th className="py-2.5 px-3 text-center">Mediana</th>
                          <th className="py-2.5 px-3 text-center">Desvio Padrão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                        {[
                          { name: 'AV1 Total', key: 'av1Total' as keyof Student },
                          { name: 'AV2 Total', key: 'av2Total' as keyof Student },
                          { name: 'AV3 Total', key: 'av3Total' as keyof Student },
                          { name: 'Média Final', key: 'totalCurso' as keyof Student }
                        ].map(row => {
                          const stats = calculateDescriptiveStats(dataset, row.key);
                          return (
                            <tr key={row.name} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-semibold font-sans text-slate-700">{row.name}</td>
                              <td className="py-2.5 px-3 text-center">{stats.mean}</td>
                              <td className="py-2.5 px-3 text-center">{stats.median}</td>
                              <td className="py-2.5 px-3 text-center">{stats.stdDev}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Informational Insights notes */}
                  <div className="p-3.5 bg-amber-50 border border-amber-200/50 rounded-xl text-[11px] text-amber-800 leading-relaxed font-sans mt-auto flex items-start gap-2">
                    <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <span>
                      Diferença entre a mediana ({summaryStats.medianFinal.toFixed(2)}) e a média (≈{summaryStats.avgFinal.toFixed(2)}) indica uma assimetria {summaryStats.medianFinal > summaryStats.avgFinal ? 'negativa moderada, confirmando que a maioria dos estudantes pontua alto, embora tenhamos cauda de notas muito baixas (reprovações).' : summaryStats.medianFinal < summaryStats.avgFinal ? 'positiva, indicando que a maioria pontua baixo, mas há algumas notas muito altas.' : 'nula, indicando uma distribuição simétrica das notas.'}
                    </span>
                  </div>
                </div>

                {/* Distribution Chart Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Distribuição de Frequência de Notas Finais</h3>
                    <p className="text-xs text-slate-400">Total de alunos por faixa de nota agregada nos percursos avaliativos.</p>
                  </div>

                  <div className="h-64 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={notesDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', borderRadius: '12px' }} />
                        <Bar dataKey="count" fill="url(#colorUv)" radius={[4, 4, 0, 0]}>
                          <Cell fill="#6366f1" />
                        </Bar>
                        <defs>
                          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.4}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Status & Rules */}
          {activeTab === 'status' && (
            <div className="animate-fade-in">
              <StudentTable students={clusterData.students} clusters={clusterData.clusters} />
            </div>
          )}

          {/* TAB 3: Models & Predictive Prevision */}
          {activeTab === 'prediction' && (
            <div className="animate-fade-in">
              <MetricsPanel metrics={metrics} model={model} />
            </div>
          )}

          {/* TAB 4: Cluster profiles */}
          {activeTab === 'clusters' && (
            <div className="flex flex-col gap-6 animate-fade-in font-sans">
              {/* Detailed profiles list */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {clusterData.clusters.map(cluster => (
                  <div key={cluster.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cluster.color }}></span>
                        <h4 className="font-bold text-slate-800 text-sm">{cluster.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">{cluster.description}</p>
                    </div>

                    <div className="mt-5 border-t border-slate-50 pt-3 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Membros</span>
                        <span className="font-mono font-bold text-slate-800">{cluster.count} alunos</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Aprovação</span>
                        <span className="font-mono font-bold text-emerald-600">{cluster.approvedRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Média Final</span>
                        <span className="font-mono font-bold text-indigo-600">{cluster.avgTotal}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cluster Correlation Plot */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Gráfico de Correlação de Perfis (AV1 vs AV2)</h3>
                  <p className="text-xs text-slate-400">Cada ponto é um aluno da turma. Cores de acordo com agrupamento K-Means de IA não supervisionada.</p>
                </div>

                <div className="h-80 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="av1" name="Nota AV1" stroke="#94a3b8" fontSize={11} domain={[0, 10]} />
                      <YAxis type="number" dataKey="av2" name="Nota AV2" stroke="#94a3b8" fontSize={11} domain={[0, 10]} />
                      <ZAxis type="number" dataKey="mediaFinal" range={[20, 120]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', borderRadius: '12px' }}
                      />
                      <Scatter name="Estudantes" data={scatterPlotData}>
                        {scatterPlotData.map((entry, index) => {
                          const clusterMeta = clusterData.clusters.find(c => c.id === entry.cluster);
                          return <Cell key={`cell-${index}`} fill={clusterMeta?.color || '#000'} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Code execution references */}
          {activeTab === 'code' && (
            <div className="animate-fade-in">
              <PythonCodeViewer />
            </div>
          )}

          {/* TAB 6: Automatic generative analysis */}
          {activeTab === 'insights' && (
            <div className="animate-fade-in">
              <DashboardInsights students={dataset} clusters={clusterData.clusters} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
