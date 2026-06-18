import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, FileCode } from 'lucide-react';

interface PythonSection {
  title: string;
  description: string;
  slug: string;
  code: string;
}

const sections: PythonSection[] = [
  {
    title: "1. Análise Exploratória de Dados (EDA)",
    slug: "eda",
    description: "Carregamento e avaliação preliminar das estatísticas gerais, média, mediana e dispersão das notas dos alunos.",
    code: `import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# 1. Carregar planilha de notas
df = pd.read_csv('Com essa planilha.csv', decimal=',')

# Ajustar tipos numéricos (caso importados como string devido à vírgula decimal)
cols_notas = [
    'AV1 total (Real)', 'Atividade Parcial 2 (Real)', 'Atividade Final 2 (Real)', 
    'Atividade Final 2 (PAP) (Real)', 'AV2 total (Real)', 'Atividade Avaliativa 3 (Real)', 
    'Atividade Avaliativa 3 (PAP) (Real)', 'Atividade Extra (Real)', 'AV3 total (Real)', 
    'Total do curso (Real)'
]
for col in cols_notas:
    if df[col].dtype == 'object':
        df[col] = df[col].astype(str).str.replace(',', '.').astype(float)

# 2. Resumo estatístico descritivo completo
print("--- Estatísticas Gerais da Nota Final ---")
stats_final = df['Total do curso (Real)'].describe()
print(stats_final)

print("\\n--- Matriz de Correlação das Notas ---")
correlacao = df[cols_notas].corr()
print(correlacao)

# 3. Gerar gráficos de distribuição das notas
sns.set_theme(style="whitegrid")
plt.figure(figsize=(10, 6))
sns.histplot(df['Total do curso (Real)'], kde=True, color='teal', bins=15)
plt.title('Distribuição de Notas Finais do Curso')
plt.xlabel('Nota Final')
plt.ylabel('Frequência de Alunos')
plt.savefig('distribuicao_notas_finais.png')
plt.close()
`
  },
  {
    title: "2. Criação da Variável Alvo (Aprovado/Reprovado)",
    slug: "target",
    description: "Implementação das rígidas regras acadêmicas para computar o status final de aprovação de cada aluno.",
    code: `def calcular_status_aluno(row):
    # Regra 1: Média Parcial
    media_parcial = (row['AV1 total (Real)'] + row['AV2 total (Real)']) / 2
    if media_parcial < 4.0:
        return 'Reprovado no Percurso'
    
    # Regra 2: AV3 Total
    av3_real = max(row['Atividade Avaliativa 3 (Real)'], row['Atividade Avaliativa 3 (PAP) (Real)'])
    av3_total = av3_real + row['Atividade Extra (Real)']
    if av3_total < 4.0:
        return 'Reprovado na AV3'
        
    # Regra 3: Nota Final
    total_curso = (media_parcial + av3_total) / 2
    if total_curso < 5.0:
        return 'Reprovado por Média Final'
        
    return 'Aprovado'

# Aplicar lógica ao dataframe
df['Média Parcial'] = (df['AV1 total (Real)'] + df['AV2 total (Real)']) / 2
df['Média Final Calculada'] = (df['Média Parcial'] + (df['Atividade Avaliativa 3 (Real)'] + df['Atividade Extra (Real)'])) / 2
df['Status_Final'] = df.apply(calcular_status_aluno, axis=1)
df['Aprovado'] = (df['Status_Final'] == 'Aprovado').astype(int)

# Contagem de resultados
print(df['Status_Final'].value_counts())
`
  },
  {
    title: "3. Construção do Modelo Preditivo",
    slug: "predictIVE",
    description: "Treinamento do modelo supervisionado de Regressão Logística e Random Forest para prever aprovação precoce de alunos com base apenas na AV1 e AV2.",
    code: `from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

# Features de entrada preditiva precoce: notas das primeiras avaliações
X = df[['AV1 total (Real)', 'AV2 total (Real)']]
y = df['Aprovado']

# Dividir em Treino (80%) e Teste (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 1. Modelo de Regressão Logística
model = LogisticRegression()
model.fit(X_train, y_train)

# Predição e Métricas
y_pred = model.predict(X_test)
print("Acurácia do Modelo:", accuracy_score(y_test, y_pred))
print("\\nRelatório de Classificação:\\n", classification_report(y_test, y_pred))

# Coeficientes do modelo
print("Peso AV1:", model.coef_[0][0])
print("Peso AV2:", model.coef_[0][1])
print("Intercepto:", model.intercept_[0])
`
  },
  {
    title: "4. Clusterização dos Perfis de Estudantes",
    slug: "clusters",
    description: "Uso do algoritmo de aprendizado não-supervisionado K-Means para segmentar a turma em 4 perfis comportamentais e pedagógicos distintos.",
    code: `from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Selecionar variáveis para segmentar o comportamento de engajamento do aluno
# Vamos usar o aproveitamento do percurso e da prova final
caracteristicas_cluster = df[['AV1 total (Real)', 'AV2 total (Real)', 'Total do curso (Real)']].fillna(0)

# Normalizar os dados para manter escalas idênticas nas distâncias
scaler = StandardScaler()
dados_normalizados = scaler.fit_transform(caracteristicas_cluster)

# Treinar K-Means com k=4 grupos
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
df['Perfil_Cluster'] = kmeans.fit_predict(dados_normalizados)

# Analisar características médias por grupo
resumo_clusters = df.groupby('Perfil_Cluster')[['AV1 total (Real)', 'AV2 total (Real)', 'Total do curso (Real)']].mean()
print("Estatísticas Médias por Perfil de Cluster:\\n", resumo_clusters)

# Mapear perfis com nomes pedagógicos
mapeamento_perfis = {
    0: 'Excelente/Alto Desempenho',
    1: 'Esforçado/Recuperação',
    2: 'Em Risco Elevado',
    3: 'Inconsistente/Intervenção'
}
df['Perfil_Pedagogico'] = df['Perfil_Cluster'].map(mapeamento_perfis)
`
  },
  {
    title: "5. Setup do Dashboard Streamlit",
    slug: "streamlit",
    description: "Estrutura do código Python utilizando a biblioteca Streamlit para subir o painel web interativo e dinâmico diretamente na máquina do coordenador.",
    code: `import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="Gestão Acadêmica de Desempenho", layout="wide")

st.title("📊 Painel de Análise e Monitoramento Acadêmico")
st.markdown("Identificação inteligente de risco escolar e distribuição de perfis pedagógicos através de IA.")

# Barra lateral para carregar arquivo
uploaded_file = st.sidebar.file_uploader("Carregue a planilha CSV das avaliações", type=["csv"])

if uploaded_file is not None:
    df = pd.read_csv(uploaded_file, decimal=',')
    st.success("Planilha carregada e alinhada com sucesso!")
    
    # Exibir Indicadores Globais
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Alunos", len(df))
    col2.metric("Média das Notas Finais", f"{df['Total do curso (Real)'].mean():.2f}")
    col3.metric("Maior Nota", df['Total do curso (Real)'].max())
    col4.metric("Menor Nota", df['Total do curso (Real)'].min())
    
    # Gráficos Dinâmicos
    fig = px.scatter(df, x='AV1 total (Real)', y='AV2 total (Real)', 
                     color='Total do curso (Real)', hover_data=['Matrícula'],
                     title='Correlação de Desempenho (AV1 vs AV2)')
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("Aguardando carregamento de planilha de notas para consolidar visão analítica.")
`
  },
  {
    title: "6. Geração de Relatório com Insights Automáticos",
    slug: "reports",
    description: "Script de consolidação estatística geral por turma e geração de um sumário executivo em Markdown para impressão ou envio por e-mail à coordenação.",
    code: `# Consolidar estatísticas da turma
total_alunos = len(df)
aprovados = df[df['Status_Final'] == 'Aprovado']
taxa_aprovacao = (len(aprovados) / total_alunos) * 100
alunos_risco = df[df['Status_Final'] == 'Reprovado no Percurso']

# Escrever arquivo de relatório automático
report_text = f"""# RELATÓRIO DO CONSELHO DE CLASSE - DESEMPENHO ACADÊMICO
Documento gerado de forma autônoma por Inteligência Pedagógica.

## 1. Métricas de Desempenho Geral da Turma
* **Total de Alunos Matriculados**: {total_alunos}
* **Quantidade de Alunos Aprovados**: {len(aprovados)}
* **Taxa de Sucesso / Aprovação**: {taxa_aprovacao:.2f}%
* **Média Global das Notas**: {df['Total do curso (Real)'].mean():.2f}

## 2. Diagnóstico Precoce de Alunos em Risco
A IA detectou {len(alunos_risco)} alunos impossibilitados de realizar a AV3 devido ao baixo rendimento no percurso inicial (AV1 < 4 ou AV2 < 4).

### Recomendações Críticas para a Organização Escolar:
1. Convocar reunião imediata com os alunos no perfil em Risco Elevado.
2. Reformular o conteúdo de reforço e material de apoio para a Atividade Avaliativa 3 (Real).
"""

with open('relatorio_insights_pedagogicos.md', 'w', encoding='utf-8') as f:
    f.write(report_text)
print("Relatório auto-gerado com sucesso em 'relatorio_insights_pedagogicos.md'")
`
  }
];

export default function PythonCodeViewer() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("eda");

  const handleCopy = (slug: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(slug);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
          <FileCode size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Código Fonte Python Equivalente</h2>
          <p className="text-sm text-slate-500 font-sans">
            Códigos limpos e estruturados para você executar localmente e reproduzir estes resultados no seu Python.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation panel */}
        <div className="lg:col-span-1 flex flex-col gap-2">
          {sections.map((sect) => (
            <button
              key={sect.slug}
              onClick={() => setActiveSection(sect.slug)}
              className={`p-3 text-left rounded-xl transition font-sans text-sm ${
                activeSection === sect.slug
                  ? 'bg-amber-50 border border-amber-200 text-amber-700 font-medium'
                  : 'hover:bg-slate-50 text-slate-600 border border-transparent'
              }`}
            >
              {sect.title}
            </button>
          ))}
        </div>

        {/* Code display panel */}
        <div className="lg:col-span-3">
          {sections.map((sect) => {
            if (sect.slug !== activeSection) return null;
            return (
              <div key={sect.slug} className="flex flex-col gap-4 animate-fade-in">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <h3 className="font-semibold text-slate-800 mb-1">{sect.title}</h3>
                  <p className="text-xs text-slate-500 font-sans">{sect.description}</p>
                </div>

                <div className="relative">
                  <button
                    onClick={() => handleCopy(sect.slug, sect.code)}
                    className="absolute right-3 top-3 p-2 bg-white/90 hover:bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs font-mono"
                    title="Copiar código"
                  >
                    {copiedSection === sect.slug ? (
                      <>
                        <Check size={14} className="text-emerald-500 animate-scale-up" />
                        <span className="text-emerald-600 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar código</span>
                      </>
                    )}
                  </button>

                  <pre className="bg-slate-900 text-slate-200 p-5 rounded-2xl overflow-x-auto font-mono text-xs leading-relaxed border border-slate-800 shadow-inner max-h-[480px]">
                    <code>{sect.code}</code>
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
