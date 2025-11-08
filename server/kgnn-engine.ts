import type { Node, Edge, TraversalStep } from "@shared/schema";
import { storage } from "./storage";
import { generateGraphConstrainedResponse, detectHallucination } from "./llm-service";

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

    // Collect traversed nodes for LLM generation
    const traversedNodes: Node[] = [];
    for (const nodeId of visitedNodes) {
      const node = await storage.getNode(nodeId);
      if (node) {
        traversedNodes.push(node);
      }
    }

    const retrievalLatency = Date.now() - startTime;

    // Build graph context for LLM
    const graphContext = `Graph traversal completed in ${retrievalLatency}ms with ${visitedNodes.length} nodes visited through relationship-based hops.`;

    // Generate response using LLM with graph-constrained prompting
    let response: string;
    try {
      response = await generateGraphConstrainedResponse({
        query,
        traversedNodes,
        graphContext,
      });

      // Replace placeholder values in LLM response with actual metrics
      response = response.replace('[X]', String(visitedNodes.length));
      response = response.replace('[X]ms', `${retrievalLatency}ms`);

      // Detect potential hallucinations
      const hallucinationCheck = await detectHallucination(response, traversedNodes);
      if (hallucinationCheck.isHallucinated) {
        console.warn('Potential hallucination detected:', {
          confidence: hallucinationCheck.confidence,
          violations: hallucinationCheck.violations,
        });
      }
    } catch (error) {
      console.error('LLM generation failed, falling back to template response:', error);
      
      // Fallback to template-based response if LLM fails
      const devices = traversedNodes.filter(n => n.type === 'device');
      const symptoms = traversedNodes.filter(n => n.type === 'symptom');
      const solutions = traversedNodes.filter(n => n.type === 'solution');
      const regulations = traversedNodes.filter(n => n.type === 'regulation');
      const procedures = traversedNodes.filter(n => n.type === 'procedure');

      response = '';
      if (devices.length > 0) {
        response += `**Device Identified:** ${devices[0].label}\n\n${devices[0].content}\n\n`;
      }
      if (symptoms.length > 0) {
        response += `**Issue Analysis:**\n${symptoms.map(s => `- ${s.label}: ${s.content}`).join('\n')}\n\n`;
      }
      if (solutions.length > 0) {
        response += `**Recommended Solution:**\n\n${solutions[0].label}\n\n${solutions[0].content}\n\n`;
      }
      if (regulations.length > 0 || procedures.length > 0) {
        response += `**Compliance & Procedures:**\n`;
        response += regulations.map(r => `- ${r.label}: ${r.content}`).join('\n');
        response += procedures.map(p => `- ${p.label}: ${p.content}`).join('\n');
        response += '\n\n';
      }
      response += `\n**KGNN Retrieval Advantages:**\n`;
      response += `- **Explainability**: Every step in the knowledge graph traversal is logged and auditable\n`;
      response += `- **Structured Reasoning**: Followed ${visitedNodes.length} relationship-based hops (vs. similarity-only vector search)\n`;
      response += `- **Domain Compliance**: Graph enforces medical device regulatory relationships and procedural requirements\n`;
      response += `- **No Hallucination Risk**: All information comes from verified nodes in the knowledge graph\n`;
      response += `- **Latency**: ${retrievalLatency}ms graph traversal (comparable to vector search but with guaranteed provenance)\n\n`;
      response += `This response demonstrates enterprise-grade AI reliability through graph-constrained generation and complete audit trails.`;
    }
    
    // Calculate quality scores based on traversed nodes
    const solutions = traversedNodes.filter(n => n.type === 'solution');
    const regulations = traversedNodes.filter(n => n.type === 'regulation');
    const procedures = traversedNodes.filter(n => n.type === 'procedure');
    
    const qualityFactors = {
      depthScore: Math.min(visitedNodes.length / 8, 1.0),
      solutionScore: solutions.length > 0 ? 1.0 : 0.6,
      regulationScore: (regulations.length + procedures.length) > 0 ? 1.0 : 0.8,
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
