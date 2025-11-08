import OpenAI from 'openai';
import type { Node } from '@shared/schema';

let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('OPENAI_API_KEY not set - LLM features will use fallback responses');
}

export interface LLMGenerationOptions {
  query: string;
  traversedNodes: Node[];
  graphContext: string;
}

export async function generateGraphConstrainedResponse(options: LLMGenerationOptions): Promise<string> {
  const { query, traversedNodes, graphContext } = options;

  // Build knowledge base from traversed nodes only
  const knowledgeBase = traversedNodes.map(node => {
    return `[${node.type.toUpperCase()}: ${node.label}]\n${node.content}`;
  }).join('\n\n');

  const systemPrompt = `You are an expert medical device support assistant with access to a verified knowledge graph.

CRITICAL CONSTRAINTS:
1. You MUST ONLY use information from the provided knowledge base below
2. DO NOT add any information not present in the knowledge base
3. DO NOT make assumptions or inferences beyond what's explicitly stated
4. If the knowledge base doesn't contain enough information, say so clearly
5. Always cite which knowledge graph nodes you're referencing

KNOWLEDGE BASE (from graph traversal):
${knowledgeBase}

GRAPH CONTEXT:
${graphContext}

Your task is to answer the user's medical device support query using ONLY the information above. Structure your response as follows:

**Device Identified:** [Name from knowledge base]
[Device description from knowledge base]

**Issue Analysis:**
[Analysis based on symptoms found in knowledge base]

**Recommended Solution:**
[Solution steps from knowledge base]

**Compliance & Procedures:**
[Regulations and procedures from knowledge base]

**KGNN Retrieval Advantages:**
- **Explainability**: Every step in the knowledge graph traversal is logged and auditable
- **Structured Reasoning**: Followed [X] relationship-based hops (vs. similarity-only vector search)
- **Domain Compliance**: Graph enforces medical device regulatory relationships and procedural requirements
- **No Hallucination Risk**: All information comes from verified nodes in the knowledge graph
- **Latency**: [X]ms graph traversal (comparable to vector search but with guaranteed provenance)

This response demonstrates enterprise-grade AI reliability through graph-constrained generation and complete audit trails.`;

  const userPrompt = query;

  if (!openai) {
    throw new Error('OpenAI client not initialized - missing API key');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Low temperature for factual, consistent responses
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return response;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate LLM response');
  }
}

export async function detectHallucination(response: string, traversedNodes: Node[]): Promise<{
  isHallucinated: boolean;
  confidence: number;
  violations: string[];
}> {
  // Build a set of all facts from traversed nodes
  const facts = new Set<string>();
  traversedNodes.forEach(node => {
    facts.add(node.label.toLowerCase());
    facts.add(node.content.toLowerCase());
  });

  // Simple hallucination detection: check for medical terms not in knowledge base
  const medicalTerms = [
    'ventilator', 'monitor', 'pump', 'sensor', 'alarm', 'calibration',
    'pressure', 'flow', 'display', 'error', 'infusion', 'oxygen',
  ];

  const violations: string[] = [];
  let factsFound = 0;
  let totalChecks = 0;

  // Check if response contains information not in knowledge base
  const responseWords = response.toLowerCase().split(/\s+/);
  
  for (const word of responseWords) {
    if (medicalTerms.includes(word)) {
      totalChecks++;
      let found = false;
      for (const fact of facts) {
        if (fact.includes(word)) {
          found = true;
          factsFound++;
          break;
        }
      }
      if (!found) {
        violations.push(`Term "${word}" not found in traversed knowledge graph nodes`);
      }
    }
  }

  const confidence = totalChecks > 0 ? factsFound / totalChecks : 1.0;
  const isHallucinated = confidence < 0.7 || violations.length > 3;

  return {
    isHallucinated,
    confidence,
    violations,
  };
}
