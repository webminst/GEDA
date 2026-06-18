import React, { useState } from 'react';
import { Student, ClusterInfo } from '../types';
import { Brain, FileText, Sparkles, AlertCircle, Copy, Check, Download } from 'lucide-react';

interface DashboardInsightsProps {
  students: Student[];
  clusters: ClusterInfo[];
}

export default function DashboardInsights({ students, clusters }: DashboardInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const topRiskStudents = students
        .filter(s => s.status === 'Reprovado no Percurso')
        .slice(0, 10)
        .map(s => ({ matricula: s.matricula, av1: s.av1Total, av2: s.av2Total }));

      const body = {
        totalAlunos: students.length,
        aprovadosCount: students.filter(s => s.aprovadoFinal).length,
        reprovadosCount: students.filter(s => !s.aprovadoFinal).length,
        avgFinal: students.reduce((sum, s) => sum + s.totalCurso, 0) / (students.length || 1),
        clusters: clusters.map(c => ({
          name: c.name,
          count: c.count,
          avgTotal: c.avgTotal,
          approvedRate: c.approvedRate
        })),
        topRiskStudents
      };

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success) {
        setReport(data.markdown);
      } else {
        setReport(data.markdown || '### Houve um erro ao obter conselhos autônomos.');
      }
    } catch (err) {
      console.error(err);
      setReport('### Erro de Conexão\nNão foi possível comunicar com o backend Express para invocar o Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_IA_pedagogico.md';
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Brain className="text-violet-500" size={22} />
            CONSELHO DE CLASSE COM GOOGLE GEMINI
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Gere um parecer estruturado utilizando inteligência artificial generativa baseada nas métricas computadas da turma.
          </p>
        </div>

        {!report && !loading && (
          <button
            onClick={generateReport}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl transition shadow-md shadow-indigo-100 cursor-pointer text-sm flex items-center gap-2"
          >
            <Sparkles size={16} className="animate-pulse" />
            Compilar Diagnósticos por IA
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <p className="text-sm font-semibold text-slate-700 animate-pulse">Sintetizando Indicadores de Aprendizado...</p>
            <p className="text-xs text-slate-400 font-sans mt-1">O Gemini está diagnosticando perfis de evasão e oportunidades pedagógicas.</p>
          </div>
        </div>
      ) : report ? (
        <div className="border border-slate-100 rounded-2xl overflow-hidden animate-fade-in flex flex-col">
          {/* Action header */}
          <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5ClassName">
              <FileText size={14} className="text-violet-500" />
              Parecer Concluído com Sucesso
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Baixar .md</span>
              </button>
            </div>
          </div>

          {/* Markdown area standard rendering */}
          <div className="p-6 bg-slate-50/30 max-h-[480px] overflow-y-auto prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed font-sans whitespace-pre-line border-t-0 rounded-b-2xl">
            {report}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
          <AlertCircle size={32} className="text-slate-400" />
          <div>
            <h4 className="font-semibold text-slate-700">Relatório Acadêmico Pronto para Geração</h4>
            <p className="text-xs text-slate-400 font-sans max-w-md mx-auto mt-1">
              Clique no botão acima para submeter estatísticas detalhadas calculadas via TypeScript e obter pareceres pedagógicos recomendados pelo Gemini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
