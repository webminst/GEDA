import React, { useState } from 'react';
import { Student, ClusterInfo } from '../types';
import { Search, Filter, ArrowUpDown, CircleAlert, GraduationCap, XOctagon, Trophy } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  clusters: ClusterInfo[];
}

export default function StudentTable({ students, clusters }: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Student>('matricula');
  const [sortAsc, setSortAsc] = useState(true);

  // Sorting
  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusIconAndStyle = (status: Student['status']) => {
    switch (status) {
      case 'Aprovado':
        return {
          icon: <Trophy size={14} className="text-emerald-500" />,
          style: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'Reprovado no Percurso':
        return {
          icon: <XOctagon size={14} className="text-rose-500" />,
          style: 'bg-rose-50 text-rose-800 border-rose-200'
        };
      case 'Reprovado na AV3':
        return {
          icon: <CircleAlert size={14} className="text-amber-500" />,
          style: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'Reprovado por Média Final':
        return {
          icon: <CircleAlert size={14} className="text-orange-500" />,
          style: 'bg-orange-50 text-orange-800 border-orange-200'
        };
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.matricula.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesCluster = clusterFilter === 'all' || student.cluster === parseInt(clusterFilter);
    return matchesSearch && matchesStatus && matchesCluster;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Relação Completa de Alunos</h3>
          <p className="text-xs text-slate-500">Busque matriculas, analise resultados individuais e aplique filtros dinâmicos.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-violet-500 max-w-[180px]"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-600 focus:outline-none font-sans"
            >
              <option value="all">Todos Status</option>
              <option value="Aprovado">Aprovados</option>
              <option value="Reprovado no Percurso">Reprovados no Percurso</option>
              <option value="Reprovado na AV3">Reprovados na AV3</option>
              <option value="Reprovado por Média Final">Reprovados na Média final</option>
            </select>
          </div>

          {/* Cluster filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <GraduationCap size={14} className="text-slate-400" />
            <select
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-600 focus:outline-none font-sans"
            >
              <option value="all">Todos os Perfis</option>
              {clusters.map(cluster => (
                <option key={cluster.id} value={cluster.id}>{cluster.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Responsive table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('matricula')}>
                <div className="flex items-center gap-1">Matrícula <ArrowUpDown size={12} /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('av1Total')}>
                <div className="flex items-center gap-1">AV1 Total <ArrowUpDown size={12} /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('av2Total')}>
                <div className="flex items-center gap-1">AV2 Total <ArrowUpDown size={12} /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('mediaParcial')}>
                <div className="flex items-center gap-1">Média Parcial <ArrowUpDown size={12} /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('av3Total')}>
                <div className="flex items-center gap-1">AV3 Total <ArrowUpDown size={12} /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('totalCurso')}>
                <div className="flex items-center gap-1">Média Final <ArrowUpDown size={12} /></div>
              </th>
              <th className="py-3 px-4 text-center">Perfil (Algoritmo)</th>
              <th className="py-3 px-4">Status de Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-slate-400 font-sans">
                  Nenhum registro encontrado correspondente aos parâmetros de filtragem.
                </td>
              </tr>
            ) : (
              sortedStudents.map(student => {
                const statusMeta = getStatusIconAndStyle(student.status);
                const clusterMeta = clusters.find(c => c.id === student.cluster);

                return (
                  <tr key={student.matricula} className="hover:bg-slate-50/50 transition-colors text-slate-700 font-mono text-xs">
                    <td className="py-3 px-4 font-bold text-slate-900">{student.matricula}</td>
                    <td className="py-3 px-4">{student.av1Total.toFixed(1)}</td>
                    <td className="py-3 px-4">{student.av2Total.toFixed(1)}</td>
                    <td className="py-3 px-4 font-medium">{student.mediaParcial.toFixed(2)}</td>
                    <td className="py-3 px-4">{student.av3Total.toFixed(1)}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{student.totalCurso.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {clusterMeta && (
                        <span
                          className="px-2.5 py-1 text-[10px] rounded-full text-white font-semibold font-sans uppercase shrink-0"
                          style={{ backgroundColor: clusterMeta.color }}
                        >
                          {clusterMeta.name.split('/')[0]}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded-lg text-[11px] font-medium leading-none ${statusMeta.style}`}>
                        {statusMeta.icon}
                        {student.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-xs font-sans text-slate-400">
        <span>Mostrando {sortedStudents.length} de {filteredStudents.length} alunos filtrados</span>
        <span>Planilha ativa</span>
      </div>
    </div>
  );
}
