import type { Node, Edge, TraversalStep } from "@shared/schema";
import { storage } from "./storage";

export class KGNNEngine {
  private async findRelevantNodes(query: string, nodes: Node[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

    for (const node of nodes) {
      let score = 0;
      const nodeLower = `${node.label} ${node.content}`.toLowerCase();

      queryTerms.forEach(term => {
        if (nodeLower.includes(term)) {
          score += 0.3;
        }
      });

      if (queryLower.includes(node.label.toLowerCase())) {
        score += 0.5;
      }

      if (node.type === 'device' && queryLower.includes('error')) {
        score += 0.2;
      }

      if (node.type === 'symptom') {
        score += 0.15;
      }

      if (score > 0) {
        scores.set(node.id, Math.min(score, 1.0));
      }
    }

    return scores;
  }

  private async traverseGraph(
    startNodeIds: string[],
    maxDepth: number = 3
  ): Promise<{ 
    visitedNodes: string[], 
    traversalPath: Array<{nodeId: string, score: number, timestamp: number}>,
    steps: TraversalStep[]
  }> {
    const visited = new Set<string>();
    const path: Array<{nodeId: string, score: number, timestamp: number}> = [];
    const steps: TraversalStep[] = [];
    const startTime = Date.now();
    
    const traverse = async (nodeId: string, depth: number, score: number): Promise<void> => {
      if (depth > maxDepth || visited.has(nodeId)) return;
      
      visited.add(nodeId);
      const currentTime = Date.now() - startTime;
      path.push({ nodeId, score, timestamp: currentTime });
      
      const node = await storage.getNode(nodeId);
      if (node) {
        let reason = '';
        if (depth === 0) {
          reason = 'Starting node - matched query keywords';
        } else if (node.type === 'solution') {
          reason = 'Solution node - provides troubleshooting steps';
        } else if (node.type === 'symptom') {
          reason = 'Symptom node - describes issue characteristics';
        } else if (node.type === 'regulation') {
          reason = 'Regulatory node - compliance requirements';
        } else if (node.type === 'procedure') {
          reason = 'Procedure node - required maintenance protocols';
        } else {
          reason = 'Related node in knowledge graph';
        }

        steps.push({
          nodeId: node.id,
          nodeLabel: node.label,
          nodeType: node.type,
          score,
          timestamp: currentTime,
          reason,
        });
      }

      const edges = await storage.getEdgesFromNode(nodeId);
      const sortedEdges = edges.sort((a, b) => b.weight - a.weight);

      for (const edge of sortedEdges.slice(0, 2)) {
        const newScore = score * edge.weight;
        await traverse(edge.targetId, depth + 1, newScore);
      }
    };

    for (const startId of startNodeIds.slice(0, 3)) {
      await traverse(startId, 0, 1.0);
    }

    return {
      visitedNodes: Array.from(visited),
      traversalPath: path,
      steps,
    };
  }

  async processQuery(query: string): Promise<{
    response: string;
    nodesVisited: string[];
    traversalPath: Array<{nodeId: string, score: number, timestamp: number}>;
    retrievalLatency: number;
    evaluationScore: number;
    steps: TraversalStep[];
  }> {
    const startTime = Date.now();

    const allNodes = await storage.getAllNodes();
    const relevantScores = await this.findRelevantNodes(query, allNodes);

    const sortedRelevant = Array.from(relevantScores.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);

    const { visitedNodes, traversalPath, steps } = await this.traverseGraph(sortedRelevant);

    const devices = new Set<Node>();
    const symptoms = new Set<Node>();
    const solutions = new Set<Node>();
    const regulations = new Set<Node>();
    const procedures = new Set<Node>();

    for (const nodeId of visitedNodes) {
      const node = await storage.getNode(nodeId);
      if (!node) continue;

      switch (node.type) {
        case 'device': devices.add(node); break;
        case 'symptom': symptoms.add(node); break;
        case 'solution': solutions.add(node); break;
        case 'regulation': regulations.add(node); break;
        case 'procedure': procedures.add(node); break;
      }
    }

    let response = '';

    if (devices.size > 0) {
      const device = Array.from(devices)[0];
      response += `**Device Identified:** ${device.label}\n\n`;
      response += `${device.content}\n\n`;
    }

    if (symptoms.size > 0) {
      response += `**Issue Analysis:**\n`;
      symptoms.forEach(s => {
        response += `- ${s.label}: ${s.content}\n`;
      });
      response += '\n';
    }

    if (solutions.size > 0) {
      response += `**Recommended Solution:**\n\n`;
      const solution = Array.from(solutions)[0];
      response += `${solution.label}\n\n`;
      response += `${solution.content}\n\n`;
    }

    if (regulations.size > 0 || procedures.size > 0) {
      response += `**Compliance & Procedures:**\n`;
      regulations.forEach(r => {
        response += `- ${r.label}: ${r.content}\n`;
      });
      procedures.forEach(p => {
        response += `- ${p.label}: ${p.content}\n`;
      });
      response += '\n';
    }

    response += `**Knowledge Graph Path:** Traversed ${visitedNodes.length} nodes across ${Math.max(...traversalPath.map(p => p.timestamp))}ms to retrieve this information.\n\n`;
    response += `This response was generated using graph-based retrieval (not vector embeddings) ensuring full explainability and auditability of the reasoning process.`;

    const retrievalLatency = Date.now() - startTime;
    
    const qualityFactors = {
      depthScore: Math.min(visitedNodes.length / 8, 1.0),
      solutionScore: solutions.size > 0 ? 1.0 : 0.6,
      regulationScore: (regulations.size + procedures.size) > 0 ? 1.0 : 0.8,
    };
    
    const evaluationScore = (qualityFactors.depthScore * 0.3 + 
                            qualityFactors.solutionScore * 0.5 + 
                            qualityFactors.regulationScore * 0.2);

    return {
      response,
      nodesVisited: visitedNodes,
      traversalPath,
      retrievalLatency,
      evaluationScore,
      steps,
    };
  }
}

export const kgnnEngine = new KGNNEngine();
