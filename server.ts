import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// AI Insights Generator utilizing official @google/genai
app.post('/api/insights', async (req, res) => {
  try {
    const { totalAlunos, aprovadosCount, reprovadosCount, avgFinal, clusters, topRiskStudents } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(200).json({
        success: false,
        markdown: `### ⚠️ Chave API do Gemini Ausente
        Por favor, configure o segredo **GEMINI_API_KEY** no painel de segredos (Secrets) do Google AI Studio para ativar as análises pedagógicas geradas por Inteligência Artificial autônoma.
        
        #### Estatísticas Rápidas Computadas por nosso Mecanismo de Dados:
        * **Total de Alunos avaliados**: ${totalAlunos}
        * **Aprovados**: ${aprovadosCount} (${((aprovadosCount/totalAlunos)*100).toFixed(1)}%)
        * **Reprovados no Percurso ou Provas**: ${reprovadosCount} (${((reprovadosCount/totalAlunos)*100).toFixed(1)}%)
        * **Média Global das Notas**: ${avgFinal.toFixed(2)}`
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Build pedagogical prompt with stats of students and cluster models
    const prompt = `
      Você é uma IA especializada em Coordenação Pedagógica e Engenharia de Aprendizado (Learning Analytics).
      Analise o sumário de desempenho desta turma para sugerir intervenções eficientes com base nos seguintes dados reais processados:
      
      - Total de Estudantes: ${totalAlunos}
      - Alunos Aprovados: ${aprovadosCount} (${((aprovadosCount/totalAlunos)*100).toFixed(1)}%)
      - Alunos Reprovados: ${reprovadosCount} (${((reprovadosCount/totalAlunos)*100).toFixed(1)}%)
      - Média Geral de Notas: ${avgFinal.toFixed(2)} / 10.0
      
      Perfis identificados por Algoritmo de Clusterização (K-Means):
      ${JSON.stringify(clusters, null, 2)}
      
      Amostra de Alunos com Alto Risco de Reprovação (Média Parcial abaixo de 4.0):
      ${JSON.stringify(topRiskStudents, null, 2)}
      
      Por favor, gere um **Relatório de Diagnóstico Pedagógico** estruturado em Markdown com o seguinte conteúdo em português:
      1. **Visão Geral e Diagnóstico Crítico** da Turma (avaliação do comportamento global e dispersão das notas).
      2. **Análise dos Perfis de Cluster** (Deduções pedagógicas sobre os grupos e o que cada um representa).
      3. **Plano de Ação para Alunos em Risco** (Recomendações curriculares e tutoria para resgatar os alunos com Média Parcial baixa).
      4. **Estratégias de Enriquecimento** para Alunos de Alta Performance.
      5. **Simulação Pedagógica de Impacto**: Sugira uma modificação nas atividades avaliativas que possa beneficiar em termos de aprendizado sem inflacionar notas artificiais.
      
      Mantenha um tom profissional, acadêmico, amigável e focado em soluções estruturadas para o coordenador docente.
    `;

    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite'
    ];

    let response = null;
    let lastError = null;

    // Helper helper function to delay execution
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const modelName of candidateModels) {
      let attempts = 3;
      let backoffMs = 800;
      
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`[Academic Server] Attempting content generation with model: ${modelName} (Attempt ${attempt}/${attempts})`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          if (response && response.text) {
            console.log(`[Academic Server] Success with model: ${modelName} on attempt ${attempt}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const statusStr = JSON.stringify(err);
          const isTransient = 
            err.message?.includes('503') || 
            err.message?.includes('429') || 
            statusStr.includes('503') || 
            statusStr.includes('429') ||
            statusStr.includes('UNAVAILABLE') ||
            statusStr.includes('RESOURCE_EXHAUSTED');

          if (isTransient && attempt < attempts) {
            console.warn(`[Academic Server] Model ${modelName} transient error: [${err.message || '503/429'}]. Retrying in ${backoffMs}ms...`);
            await delay(backoffMs);
            backoffMs *= 2; // Exponential backoff
          } else {
            console.warn(`[Academic Server] Model ${modelName} permanent or final attempt failure:`, err.message || err);
            break; // Stop retrying this model, proceed to the next candidate
          }
        }
      }

      if (response && response.text) {
        break;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Todos os modelos candidatos do Gemini falharam ou estão indisponíveis temporariamente.');
    }

    res.json({
      success: true,
      markdown: response.text
    });
  } catch (error: any) {
    console.error('Gemini Insights generation error:', error);
    res.status(200).json({
      success: false,
      markdown: `### ❌ Erro de Limitação/Indisponibilidade do Modelo
      Não foi possível conectar ou receber dados do serviço Google Gemini no momento.
      
      **Mensagem técnica registrada:**
      > \`${error.message || 'Erro de conexão/timeout'}\`
      
      **Sugerido para resolver:**
      1. Os servidores da API do Gemini podem estar passando por picos de demanda temporários (Erro 503). Por favor, **aguarde de 15 a 30 segundos** e clique no botão novamente.
      2. Certifique-se de que sua **GEMINI_API_KEY** no painel de Secrets está válida e ativa.`
    });
  }
});

async function startServer() {
  // Vite integration in development, static routing in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Academic Server] Running efficiently on http://localhost:${PORT}`);
  });
}

startServer();
