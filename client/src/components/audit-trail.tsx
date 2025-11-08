import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Query } from "@shared/schema";
import { Loader2, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function AuditTrail() {
  const { data: queries, isLoading } = useQuery<Query[]>({
    queryKey: ["/api/audit"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Query Audit Trail</CardTitle>
          <CardDescription>
            Complete history of all queries with full traversal paths and decision rationale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px] pr-4">
            {queries && queries.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {queries.map((query) => (
                  <AccordionItem 
                    key={query.id} 
                    value={query.id}
                    className="border rounded-lg px-4"
                    data-testid={`audit-entry-${query.id}`}
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-start justify-between w-full pr-4">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {query.id.substring(0, 8)}
                            </Badge>
                            {query.createdAt && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(query.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium line-clamp-2">
                            {query.query}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {query.evaluationScore && query.evaluationScore >= 0.8 ? (
                            <CheckCircle2 className="w-5 h-5 text-chart-2" />
                          ) : query.evaluationScore && query.evaluationScore >= 0.5 ? (
                            <TrendingUp className="w-5 h-5 text-chart-4" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-6">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            Response
                          </h4>
                          <div className="p-4 rounded-lg bg-muted">
                            <p className="text-sm leading-relaxed">
                              {query.response || "No response generated"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-1">Latency</p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-chart-1" />
                              <p className="text-lg font-semibold">
                                {query.retrievalLatency || 0}ms
                              </p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-1">Nodes Visited</p>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              <p className="text-lg font-semibold">
                                {query.nodesVisited?.length || 0}
                              </p>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-1">Quality Score</p>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-chart-2" />
                              <p className="text-lg font-semibold">
                                {query.evaluationScore 
                                  ? (query.evaluationScore * 100).toFixed(1) + '%'
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {query.traversalPath && query.traversalPath.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              Traversal Path & Decision Rationale
                            </h4>
                            <div className="space-y-2">
                              {query.traversalPath.map((step, index) => (
                                <div 
                                  key={index}
                                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                                >
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0 mt-0.5">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium font-mono">
                                        {step.nodeId}
                                      </p>
                                      <Badge variant="outline" className="text-xs">
                                        {(step.score * 100).toFixed(1)}% confidence
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Visited at {step.timestamp}ms
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {query.nodesVisited && query.nodesVisited.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Knowledge Graph Nodes</h4>
                            <div className="flex flex-wrap gap-2">
                              {query.nodesVisited.map((nodeId, index) => (
                                <Badge key={index} variant="secondary" className="font-mono text-xs">
                                  {nodeId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t">
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                            <CheckCircle2 className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium mb-1">Enterprise Compliance</p>
                              <p className="text-xs text-muted-foreground">
                                This query has been logged with complete audit trail including all graph traversal decisions, 
                                confidence scores, and timing information for regulatory compliance and model governance.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No audit trail entries yet. Submit queries to generate audit logs.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
