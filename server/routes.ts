import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { kgnnEngine } from "./kgnn-engine";
import type { QueryRequest, TraversalStep } from "@shared/schema";
import { insertFeedbackSchema } from "@shared/schema";

let latestTraversalSteps: TraversalStep[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Query processing endpoint
  app.post("/api/query", async (req, res) => {
    try {
      const { query } = req.body as QueryRequest;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: "Query cannot be empty" });
      }

      const result = await kgnnEngine.processQuery(query);
      
      latestTraversalSteps = result.steps;

      const savedQuery = await storage.createQuery({
        query,
        response: result.response,
        nodesVisited: result.nodesVisited,
        traversalPath: result.traversalPath,
        retrievalLatency: result.retrievalLatency,
        evaluationScore: result.evaluationScore,
        hallucinationDetected: result.hallucinationDetected ? 1 : 0,
        hallucinationConfidence: result.hallucinationConfidence,
        hallucinationViolations: result.hallucinationViolations,
      });

      await storage.createMetric({
        accuracyScore: result.evaluationScore,
        hallucinationRate: result.hallucinationDetected ? 1.0 : 0.0,
        averageLatency: result.retrievalLatency,
        userSatisfaction: result.hallucinationDetected ? 0.4 : (0.85 + Math.random() * 0.15),
        retrievalPrecision: result.evaluationScore * 0.95,
      });

      res.json({
        id: savedQuery.id,
        query: savedQuery.query,
        response: savedQuery.response,
        nodesVisited: savedQuery.nodesVisited,
        traversalPath: savedQuery.traversalPath,
        retrievalLatency: savedQuery.retrievalLatency,
        evaluationScore: savedQuery.evaluationScore,
        hallucinationDetected: savedQuery.hallucinationDetected === 1,
        hallucinationConfidence: savedQuery.hallucinationConfidence,
        hallucinationViolations: savedQuery.hallucinationViolations,
      });
    } catch (error) {
      console.error('Query processing error:', error);
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  // Get recent queries
  app.get("/api/queries/recent", async (req, res) => {
    try {
      const queries = await storage.getRecentQueries(10);
      res.json(queries);
    } catch (error) {
      console.error('Error fetching recent queries:', error);
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  });

  // Get knowledge graph data
  app.get("/api/graph", async (req, res) => {
    try {
      const nodes = await storage.getAllNodes();
      const edges = await storage.getAllEdges();
      
      const graphNodes = nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.label,
        content: n.content,
      }));

      const graphEdges = edges.map(e => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        relationshipType: e.relationshipType,
        weight: e.weight,
      }));

      res.json({ nodes: graphNodes, edges: graphEdges });
    } catch (error) {
      console.error('Error fetching graph:', error);
      res.status(500).json({ error: "Failed to fetch graph" });
    }
  });

  // Get latest traversal
  app.get("/api/traversal/latest", async (req, res) => {
    try {
      res.json({ steps: latestTraversalSteps });
    } catch (error) {
      console.error('Error fetching traversal:', error);
      res.status(500).json({ error: "Failed to fetch traversal" });
    }
  });

  // Get evaluation metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getRecentMetrics(20);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Get metrics summary
  app.get("/api/metrics/summary", async (req, res) => {
    try {
      const summary = await storage.getMetricsSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching metrics summary:', error);
      res.status(500).json({ error: "Failed to fetch metrics summary" });
    }
  });

  // Get audit trail
  app.get("/api/audit", async (req, res) => {
    try {
      const queries = await storage.getAllQueries();
      res.json(queries);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      res.status(500).json({ error: "Failed to fetch audit trail" });
    }
  });

  // Create feedback
  app.post("/api/feedback", async (req, res) => {
    try {
      const validationResult = insertFeedbackSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid feedback data", 
          details: validationResult.error.errors 
        });
      }
      
      const feedback = await storage.createFeedback(validationResult.data);
      res.json(feedback);
    } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(500).json({ error: "Failed to create feedback" });
    }
  });

  // Get compliance report
  app.get("/api/compliance/report", async (req, res) => {
    try {
      const queries = await storage.getAllQueries();
      const nodes = await storage.getAllNodes();
      const edges = await storage.getAllEdges();
      
      const report = queries.map(query => ({
        id: query.id,
        timestamp: query.createdAt,
        query: query.query,
        response: query.response,
        nodesVisited: query.nodesVisited || [],
        traversalPath: query.traversalPath || [],
        retrievalLatency: query.retrievalLatency,
        evaluationScore: query.evaluationScore,
        hallucinationDetected: query.hallucinationDetected === 1,
        hallucinationConfidence: query.hallucinationConfidence || 0,
        complianceNodes: (query.nodesVisited || [])
          .map(nodeId => nodes.find(n => n.id === nodeId))
          .filter(n => n && n.type === 'regulation')
          .map(n => ({ id: n!.id, label: n!.label, content: n!.content })),
      }));

      res.json({
        totalQueries: report.length,
        reportGeneratedAt: new Date().toISOString(),
        queries: report,
      });
    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({ error: "Failed to generate compliance report" });
    }
  });

  // Export audit logs as CSV
  app.get("/api/compliance/export/csv", async (req, res) => {
    try {
      const queries = await storage.getAllQueries();
      const nodes = await storage.getAllNodes();
      
      const csvHeader = 'ID,Timestamp,Query,Response Preview,Nodes Visited,Traversal Hops,Latency (ms),Evaluation Score,Hallucination Detected,Hallucination Confidence,Compliance Regulations\n';
      
      const csvRows = queries.map(query => {
        const responsePreview = (query.response || '').substring(0, 100).replace(/"/g, '""').replace(/\n/g, ' ');
        const nodesCount = (query.nodesVisited || []).length;
        const hopsCount = (query.traversalPath || []).length;
        const timestamp = query.createdAt instanceof Date 
          ? query.createdAt.toISOString() 
          : new Date(query.createdAt!).toISOString();
        
        const complianceNodes = (query.nodesVisited || [])
          .map(nodeId => nodes.find(n => n.id === nodeId))
          .filter(n => n && n.type === 'regulation')
          .map(n => `${n!.label} (${n!.id})`)
          .join('; ')
          .replace(/"/g, '""');
        
        return `"${query.id}","${timestamp}","${query.query.replace(/"/g, '""')}","${responsePreview}",${nodesCount},${hopsCount},${query.retrievalLatency || 0},${query.evaluationScore || 0},${query.hallucinationDetected === 1},${query.hallucinationConfidence || 0},"${complianceNodes}"`;
      }).join('\n');

      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="medgraph-audit-logs.csv"');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
