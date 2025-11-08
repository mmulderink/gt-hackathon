import { EvaluationMetricsView } from "@/components/evaluation-metrics";

export default function EvaluationPage() {
  return (
    <div className="p-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Evaluation Metrics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive metrics tracking accuracy, latency, hallucination detection, and user satisfaction
        </p>
      </div>
      <EvaluationMetricsView />
    </div>
  );
}
