import { GraphVisualization } from "@/components/graph-visualization";

export default function VisualizationPage() {
  return (
    <div className="p-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Knowledge Graph Visualization</h1>
        <p className="text-muted-foreground mt-2">
          Watch the retrieval process in real-time as the system traverses the knowledge graph
        </p>
      </div>
      <GraphVisualization />
    </div>
  );
}
