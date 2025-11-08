import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { GraphNode, GraphEdge, TraversalStep } from "@shared/schema";
import { Loader2, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GraphVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const { data: graphData, isLoading } = useQuery<{nodes: GraphNode[], edges: GraphEdge[]}>({
    queryKey: ["/api/graph"],
  });

  const { data: traversalData } = useQuery<{steps: TraversalStep[]}>({
    queryKey: ["/api/traversal/latest"],
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (!canvasRef.current || !graphData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const visitedNodeIds = new Set(traversalData?.steps.map(s => s.nodeId) || []);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    const positions = graphData.nodes.map((_, i) => {
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1.5;
    graphData.edges.forEach((edge) => {
      const sourceIdx = graphData.nodes.findIndex(n => n.id === edge.source);
      const targetIdx = graphData.nodes.findIndex(n => n.id === edge.target);
      if (sourceIdx === -1 || targetIdx === -1) return;

      const source = positions[sourceIdx];
      const target = positions[targetIdx];

      const isActive = visitedNodeIds.has(edge.source) && visitedNodeIds.has(edge.target);
      
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = isActive ? "rgba(59, 130, 246, 0.6)" : "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.stroke();
    });

    graphData.nodes.forEach((node, i) => {
      const pos = positions[i];
      const isVisited = visitedNodeIds.has(node.id);
      const isSelected = selectedNode?.id === node.id;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 14 : 12, 0, 2 * Math.PI);
      
      if (isVisited) {
        ctx.fillStyle = "#3b82f6";
      } else {
        ctx.fillStyle = "#e2e8f0";
      }
      ctx.fill();
      
      ctx.strokeStyle = isSelected ? "#1e40af" : isVisited ? "#2563eb" : "#cbd5e1";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      ctx.fillStyle = isVisited ? "#ffffff" : "#475569";
      ctx.font = "600 10px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = node.label.substring(0, 8);
      ctx.fillText(label, pos.x, pos.y + 24);
    });

  }, [graphData, traversalData, selectedNode]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Knowledge Graph Network</CardTitle>
            <CardDescription>
              Real-time visualization of graph traversal during query processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full border rounded-lg bg-card"
                data-testid="canvas-graph"
              />
              <div className="absolute top-4 right-4 flex gap-3 bg-background/95 backdrop-blur-sm border rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="w-3 h-3 fill-[#e2e8f0] stroke-[#cbd5e1]" />
                  <span className="text-muted-foreground">Unvisited</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="w-3 h-3 fill-[#3b82f6] stroke-[#2563eb]" />
                  <span className="text-muted-foreground">Visited</span>
                </div>
              </div>
            </div>

            {graphData && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">{graphData.nodes.length}</p>
                  <p className="text-sm text-muted-foreground">Total Nodes</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">{graphData.edges.length}</p>
                  <p className="text-sm text-muted-foreground">Total Edges</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-primary">
                    {traversalData?.steps.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Nodes Visited</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">
                    {graphData.nodes.filter(n => n.type === 'device').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Devices</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Traversal Path</CardTitle>
            <CardDescription>Real-time node visitation sequence</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {traversalData && traversalData.steps.length > 0 ? (
                <div className="space-y-3">
                  {traversalData.steps.map((step, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border bg-card"
                      data-testid={`traversal-step-${index}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            #{index + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {step.nodeType}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(step.score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{step.nodeLabel}</p>
                      <p className="text-xs text-muted-foreground">{step.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Submit a query to see the traversal path
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
