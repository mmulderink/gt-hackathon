import { QueryInterface } from "@/components/query-interface";

export default function QueryPage() {
  return (
    <div className="p-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Query Interface</h1>
        <p className="text-muted-foreground mt-2">
          Ask questions about medical device troubleshooting and receive graph-based responses
        </p>
      </div>
      <QueryInterface />
    </div>
  );
}
