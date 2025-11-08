import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { EvaluationMetrics } from "@shared/schema";
import { Loader2, TrendingUp, AlertTriangle, Clock, ThumbsUp, Target, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";

export function EvaluationMetricsView() {
  const { data: metrics, isLoading } = useQuery<EvaluationMetrics[]>({
    queryKey: ["/api/metrics"],
  });

  const { data: summary } = useQuery<{
    avgAccuracy: number;
    avgLatency: number;
    hallucinationRate: number;
    userSatisfaction: number;
    totalQueries: number;
    retrievalPrecision: number;
  }>({
    queryKey: ["/api/metrics/summary"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const chartData = metrics?.slice(-10).map((m, i) => ({
    index: i + 1,
    accuracy: (m.accuracyScore || 0) * 100,
    latency: m.averageLatency || 0,
    hallucination: (m.hallucinationRate || 0) * 100,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accuracy Score</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {summary ? (summary.avgAccuracy * 100).toFixed(1) : '0.0'}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-chart-2" />
                  <span className="text-xs text-muted-foreground">Retrieval accuracy</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Latency</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {summary?.avgLatency.toFixed(0) || '0'}ms
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-4 h-4 text-chart-1" />
                  <span className="text-xs text-muted-foreground">Response time</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hallucination Rate</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {summary ? (summary.hallucinationRate * 100).toFixed(1) : '0.0'}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Detected errors</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User Satisfaction</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {summary ? (summary.userSatisfaction * 100).toFixed(1) : '0.0'}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ThumbsUp className="w-4 h-4 text-chart-2" />
                  <span className="text-xs text-muted-foreground">Positive feedback</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retrieval Precision</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {summary ? (summary.retrievalPrecision * 100).toFixed(1) : '0.0'}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Target className="w-4 h-4 text-chart-3" />
                  <span className="text-xs text-muted-foreground">Relevant nodes</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Queries</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {summary?.totalQueries || 0}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">System usage</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Activity className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Accuracy Trend</CardTitle>
            <CardDescription>Retrieval accuracy over recent queries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="index" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="hsl(var(--chart-2))" 
                  fill="url(#colorAccuracy)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Response Latency</CardTitle>
            <CardDescription>Average latency per query (ms)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="index" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Bar dataKey="latency" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Enterprise Trust Indicators</CardTitle>
          <CardDescription>Key reliability and compliance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Graph Consistency</span>
                <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                  Verified
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                All knowledge graph nodes and edges validated against source documentation
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Audit Trail</span>
                <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                  Complete
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Full traversal path logged for every query with confidence scores
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Explainability</span>
                <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                  100%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Every retrieval decision includes reasoning and source node references
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
