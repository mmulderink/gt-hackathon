import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Clock, Target, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QueryResponse, Query } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

export function QueryInterface() {
  const [query, setQuery] = useState("");

  const { data: recentQueries, isLoading: isLoadingQueries } = useQuery<Query[]>({
    queryKey: ["/api/queries/recent"],
  });

  const queryMutation = useMutation({
    mutationFn: async (queryText: string) => {
      return apiRequest<QueryResponse>("POST", "/api/query", { query: queryText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queries/recent"] });
      setQuery("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      queryMutation.mutate(query);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Medical Device Query</CardTitle>
            <CardDescription>
              Ask questions about medical device troubleshooting, procedures, or regulatory compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Example: Why is the Horizon X2 ventilator showing error code E-203?"
                className="min-h-32 text-base resize-none"
                data-testid="input-query"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!query.trim() || queryMutation.isPending}
                  className="px-8"
                  data-testid="button-submit-query"
                >
                  {queryMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Query
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {queryMutation.data && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg font-medium">Response</CardTitle>
                  <CardDescription className="mt-1 text-sm font-mono">
                    {queryMutation.data.query}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {queryMutation.data.retrievalLatency}ms
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Target className="w-3 h-3" />
                    {(queryMutation.data.evaluationScore * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-lg bg-muted">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {queryMutation.data.response}
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Knowledge Graph Path ({queryMutation.data.nodesVisited.length} nodes visited)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {queryMutation.data.nodesVisited.map((nodeId, index) => (
                    <Badge key={index} variant="secondary" className="font-mono text-xs">
                      {nodeId}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="col-span-12 lg:col-span-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Queries</CardTitle>
            <CardDescription>Your query history</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {isLoadingQueries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentQueries && recentQueries.length > 0 ? (
                <div className="space-y-3">
                  {recentQueries.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-lg border bg-card hover-elevate cursor-pointer"
                      data-testid={`query-history-${q.id}`}
                    >
                      <p className="text-sm font-medium line-clamp-2 mb-2">
                        {q.query}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {q.retrievalLatency && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {q.retrievalLatency}ms
                          </span>
                        )}
                        {q.evaluationScore && (
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {(q.evaluationScore * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No queries yet. Submit your first query to get started.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
