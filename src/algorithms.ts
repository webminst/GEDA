import { Student, ModelMetrics, ClusterInfo } from './types';

// ==========================================
// 1. Exploratory Data Analysis (EDA)
// ==========================================

export interface FieldStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

export function calculateDescriptiveStats(students: Student[], field: keyof Student): FieldStats {
  const vals = students
    .map(s => s[field])
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    
  if (vals.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
  }
  
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / vals.length;
  
  // Median
  const sorted = [...vals].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 
    ? sorted[half] 
    : (sorted[half - 1] + sorted[half]) / 2;
    
  // Standard Deviation
  const variance = vals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / vals.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    min: Math.min(...vals),
    max: Math.max(...vals),
  };
}

// ==========================================
// 2. Machine Learning Classifier: Logistic Regression
// ==========================================

export class BinaryClassifier {
  private w1: number = 0.5;
  private w2: number = 0.5;
  private bias: number = -4.0;
  private learningRate: number = 0.1;
  private epochs: number = 200;

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  // Train a simple Logistic Regression model using Gradient Descent
  public train(students: Student[]): ModelMetrics {
    // We only train on active students or everyone. Let's do everyone.
    // X = {av1Total, av2Total}, Y = {aprovadoFinal (1 or 0)}
    const data = students.map(s => ({
      x1: s.av1Total,
      x2: s.av2Total,
      y: s.aprovadoFinal ? 1 : 0
    }));

    // Reset weights
    this.w1 = 0.1;
    this.w2 = 0.1;
    this.bias = -2.0;

    // Standardize inputs for gradient descent stability
    // X_std = X / 10 (since scores are from 0 to 10)
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      let dw1 = 0;
      let dw2 = 0;
      let db = 0;

      for (const d of data) {
        const x1_std = d.x1 / 10;
        const x2_std = d.x2 / 10;
        const z = this.w1 * x1_std + this.w2 * x2_std + this.bias;
        const pred = this.sigmoid(z);
        const err = pred - d.y;

        dw1 += err * x1_std;
        dw2 += err * x2_std;
        db += err;
      }

      const m = data.length || 1;
      this.w1 -= (this.learningRate * dw1) / m;
      this.w2 -= (this.learningRate * dw2) / m;
      this.bias -= (this.learningRate * db) / m;
    }

    // Evaluate metrics
    let tp = 0; // Approved, predicted Approved
    let tn = 0; // Reproved, predicted Reproved
    let fp = 0; // Reproved, predicted Approved
    let fn = 0; // Approved, predicted Reproved

    for (const d of data) {
      const prob = this.predictProbability(d.x1, d.x2);
      const predLabel = prob >= 0.5 ? 1 : 0;

      if (d.y === 1 && predLabel === 1) tp++;
      else if (d.y === 0 && predLabel === 0) tn++;
      else if (d.y === 0 && predLabel === 1) fp++;
      else if (d.y === 1 && predLabel === 0) fn++;
    }

    const total = data.length || 1;
    const accuracy = (tp + tn) / total;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      accuracy: parseFloat(accuracy.toFixed(3)),
      precision: parseFloat(precision.toFixed(3)),
      recall: parseFloat(recall.toFixed(3)),
      f1Score: parseFloat(f1Score.toFixed(3)),
      confusionMatrix: { tp, tn, fp, fn }
    };
  }

  public predictProbability(av1: number, av2: number): number {
    const x1_std = av1 / 10;
    const x2_std = av2 / 10;
    const z = this.w1 * x1_std + this.w2 * x2_std + this.bias;
    return this.sigmoid(z);
  }
}

// ==========================================
// 3. Clusterization: K-Means Clustering
// ==========================================

export function performKMeans(students: Student[], k: number = 4): { students: Student[], clusters: ClusterInfo[] } {
  if (students.length === 0) {
    return { students: [], clusters: [] };
  }

  // We cluster students based on three features: [av1Total, av2Total, totalCurso] (standardized to 0-1)
  const features = students.map(s => ({
    id: s.matricula,
    f: [s.av1Total / 10, s.av2Total / 10, s.totalCurso / 10]
  }));

  // Initialize centroids (spread out over the space)
  // Let's use predefined spread out seeds to get stable clusters
  let centroids: number[][] = [];
  const seeds = [
    [0.9, 0.9, 0.9], // High performance
    [0.3, 0.4, 0.5], // Diligent recovery
    [0.1, 0.2, 0.1], // Special risk
    [0.7, 0.4, 0.5]  // Inconsistent
  ];

  for (let i = 0; i < k; i++) {
    centroids.push(seeds[i % seeds.length]);
  }

  let assignments = new Array(features.length).fill(-1);
  let changed = true;
  let maxIter = 100;

  while (changed && maxIter > 0) {
    changed = false;
    maxIter--;

    // Assignment step
    for (let i = 0; i < features.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      const fVec = features[i].f;

      for (let c = 0; c < k; c++) {
        // Euclidean distance
        const dist = Math.sqrt(
          fVec.reduce((sum, val, idx) => sum + Math.pow(val - centroids[c][idx], 2), 0)
        );

        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Update step
    const counts = new Array(k).fill(0);
    const sums = Array.from({ length: k }, () => [0, 0, 0]);

    for (let i = 0; i < features.length; i++) {
      const c = assignments[i];
      counts[c]++;
      features[i].f.forEach((val, idx) => {
        sums[c][idx] += val;
      });
    }

    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = sums[c].map(s => s / counts[c]);
      }
    }
  }

  // Build the categorized student objects
  const updatedStudents = students.map((s, idx) => {
    const studentCellIndex = features.findIndex(f => f.id === s.matricula);
    return {
      ...s,
      cluster: studentCellIndex !== -1 ? assignments[studentCellIndex] : 0
    };
  });

  // Describe the clusters based on average stats of members
  const clusterInfos: ClusterInfo[] = [];
  const clusterMetadata = [
    { name: 'Excelente/Alto Desempenho', color: '#10B981', description: 'Notas elevadas e constantes em todas as avaliações.' },
    { name: 'Esforçado/Recuperação', color: '#3B82F6', description: 'Nota razoável na AV1/AV2 e forte engajamento na AV3.' },
    { name: 'Em Risco Elevado', color: '#EF4444', description: 'Dificuldades graves, notas baixas desde o percurso inicial.' },
    { name: 'Inconsistente/Intervenção', color: '#F59E0B', description: 'Notas muito oscilantes, precisa de monitoramento estruturado.' }
  ];

  for (let c = 0; c < k; c++) {
    const members = updatedStudents.filter(s => s.cluster === c);
    const count = members.length;
    
    if (count === 0) continue;

    const avgAV1 = members.reduce((sum, s) => sum + s.av1Total, 0) / count;
    const avgAV2 = members.reduce((sum, s) => sum + s.av2Total, 0) / count;
    const avgAV3 = members.reduce((sum, s) => sum + s.av3Total, 0) / count;
    const avgTotal = members.reduce((sum, s) => sum + s.totalCurso, 0) / count;
    const approvedCount = members.filter(s => s.aprovadoFinal).length;
    const approvedRate = approvedCount / count;

    // Use metadata based on stats if the cluster indexes rotated
    // Let's dynamically find which metadata fits best by checking avgTotal
    let meta = clusterMetadata[c % clusterMetadata.length];
    
    clusterInfos.push({
      id: c,
      name: meta.name,
      color: meta.color,
      description: meta.description,
      count,
      avgAV1: parseFloat(avgAV1.toFixed(2)),
      avgAV2: parseFloat(avgAV2.toFixed(2)),
      avgAV3: parseFloat(avgAV3.toFixed(2)),
      avgTotal: parseFloat(avgTotal.toFixed(2)),
      approvedRate: parseFloat((approvedRate * 100).toFixed(1))
    });
  }

  // Sort cluster infos by highest avgTotal so that IDs are logically assigned
  clusterInfos.sort((a, b) => b.avgTotal - a.avgTotal);
  
  // Re-map IDs and colors dynamically
  clusterInfos.forEach((info, idx) => {
    info.id = idx;
    info.name = clusterMetadata[idx].name;
    info.color = clusterMetadata[idx].color;
    info.description = clusterMetadata[idx].description;
  });

  // Re-assign clusters to student list according to sorted IDs for visual consistency
  const finalStudents = updatedStudents.map(s => {
    const originalCluster = s.cluster;
    // Find the new index of originalCluster in the sorted list
    const newId = clusterInfos.findIndex(info => info.id === originalCluster);
    return {
      ...s,
      cluster: newId !== -1 ? newId : 0
    };
  });

  return { students: finalStudents, clusters: clusterInfos };
}
