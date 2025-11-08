import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Knowledge Graph Node
export const nodes = pgTable("nodes", {
  id: varchar("id").primaryKey(),
  type: text("type").notNull(), // 'device', 'symptom', 'solution', 'regulation', 'procedure'
  label: text("label").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

// Knowledge Graph Edge (Relationship)
export const edges = pgTable("edges", {
  id: varchar("id").primaryKey(),
  sourceId: varchar("source_id").notNull(),
  targetId: varchar("target_id").notNull(),
  relationshipType: text("relationship_type").notNull(), // 'causes', 'solved_by', 'requires', 'related_to'
  weight: real("weight").notNull().default(1.0),
});

// Query Session
export const queries = pgTable("queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: text("query").notNull(),
  response: text("response"),
  nodesVisited: jsonb("nodes_visited").$type<string[]>(),
  traversalPath: jsonb("traversal_path").$type<Array<{nodeId: string, score: number, timestamp: number}>>(),
  retrievalLatency: integer("retrieval_latency"), // milliseconds
  evaluationScore: real("evaluation_score"),
  hallucinationDetected: integer("hallucination_detected").default(0), // 0 = no, 1 = yes (using integer for boolean compatibility)
  hallucinationConfidence: real("hallucination_confidence"), // 0.0 to 1.0 confidence that response is factual
  hallucinationViolations: jsonb("hallucination_violations").$type<string[]>(), // List of detected violations
  createdAt: timestamp("created_at").defaultNow(),
});

// User Feedback
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  queryId: varchar("query_id").notNull(),
  rating: integer("rating"), // 1-5 stars
  thumbs: text("thumbs"), // 'up' or 'down'
  correctness: text("correctness"), // 'correct', 'partially_correct', 'incorrect'
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Evaluation Metrics
export const evaluationMetrics = pgTable("evaluation_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow(),
  accuracyScore: real("accuracy_score"),
  hallucinationRate: real("hallucination_rate"),
  averageLatency: integer("average_latency"),
  userSatisfaction: real("user_satisfaction"),
  retrievalPrecision: real("retrieval_precision"),
});

// Insert schemas
export const insertNodeSchema = createInsertSchema(nodes).omit({ id: true });
export const insertEdgeSchema = createInsertSchema(edges).omit({ id: true });
export const insertQuerySchema = createInsertSchema(queries).omit({ id: true, createdAt: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });

// Types
export type Node = typeof nodes.$inferSelect;
export type Edge = typeof edges.$inferSelect;
export type Query = typeof queries.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type EvaluationMetrics = typeof evaluationMetrics.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type InsertEdge = z.infer<typeof insertEdgeSchema>;
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Graph visualization types
export interface GraphNode {
  id: string;
  type: string;
  label: string;
  content: string;
  x?: number;
  y?: number;
  visited?: boolean;
  active?: boolean;
  score?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  weight: number;
  active?: boolean;
}

// Query processing types
export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  id: string;
  query: string;
  response: string;
  nodesVisited: string[];
  traversalPath: Array<{nodeId: string, score: number, timestamp: number}>;
  retrievalLatency: number;
  evaluationScore: number;
  hallucinationDetected?: boolean;
  hallucinationConfidence?: number;
  hallucinationViolations?: string[];
}

export interface TraversalStep {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  score: number;
  timestamp: number;
  reason: string;
}
