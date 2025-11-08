import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ComplianceQuery {
  id: string;
  timestamp: string | Date;
  query: string;
  response: string | null;
  nodesVisited: string[];
  traversalPath: Array<{ nodeId: string; score: number; timestamp: number }>;
  retrievalLatency: number | null;
  evaluationScore: number | null;
  hallucinationDetected: boolean;
  hallucinationConfidence: number;
  complianceNodes: Array<{ id: string; label: string; content: string }>;
}

interface ComplianceReport {
  totalQueries: number;
  reportGeneratedAt: string;
  queries: ComplianceQuery[];
}

export default function CompliancePage() {
  const { data: report, isLoading } = useQuery<ComplianceReport>({
    queryKey: ["/api/compliance/report"],
  });

  const handleDownloadCSV = () => {
    window.open('/api/compliance/export/csv', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading compliance report...</p>
        </div>
      </div>
    );
  }

  const compliantQueries = report?.queries.filter(q => !q.hallucinationDetected && q.complianceNodes.length > 0) || [];
  const complianceRate = report?.queries.length ? (compliantQueries.length / report.queries.length) * 100 : 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-compliance-title">
            <Shield className="w-8 h-8" />
            Regulatory Compliance Report
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete audit trail of all queries with decision provenance and compliance adherence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-queries">{report?.totalQueries || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Complete audit trail
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2" data-testid="text-compliance-rate">
                {complianceRate.toFixed(1)}%
                {complianceRate > 95 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {compliantQueries.length} compliant queries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleDownloadCSV}
                className="w-full"
                variant="default"
                data-testid="button-download-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Query Audit Trail</CardTitle>
            <CardDescription>
              Expandable view of all queries with decision paths and compliance nodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {report?.queries.map((query) => {
                const timestamp = query.timestamp instanceof Date 
                  ? query.timestamp 
                  : new Date(query.timestamp);
                
                return (
                  <AccordionItem key={query.id} value={query.id}>
                    <AccordionTrigger className="hover-elevate px-4 rounded-md" data-testid={`accordion-query-${query.id}`}>
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-medium">{query.query}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(timestamp, 'PPpp')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {query.hallucinationDetected ? (
                            <Badge variant="destructive" data-testid={`badge-hallucination-${query.id}`}>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Hallucination
                            </Badge>
                          ) : (
                            <Badge variant="default" data-testid={`badge-verified-${query.id}`}>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {query.complianceNodes.length > 0 && (
                            <Badge variant="outline" data-testid={`badge-compliance-${query.id}`}>
                              <Shield className="w-3 h-3 mr-1" />
                              {query.complianceNodes.length} Compliance
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Response</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {query.response || 'No response available'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Traversal Metrics</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Nodes Visited:</span>
                                <span className="font-medium">{query.nodesVisited.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Traversal Hops:</span>
                                <span className="font-medium">{query.traversalPath.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Latency:</span>
                                <span className="font-medium">{query.retrievalLatency}ms</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Evaluation Score:</span>
                                <span className="font-medium">{((query.evaluationScore || 0) * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-sm mb-2">Hallucination Detection</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span className={query.hallucinationDetected ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                                  {query.hallucinationDetected ? 'Detected' : 'Clean'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confidence:</span>
                                <span className="font-medium">{(query.hallucinationConfidence * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {query.complianceNodes.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Regulatory Compliance References
                            </h4>
                            <div className="space-y-2">
                              {query.complianceNodes.map((node) => (
                                <Card key={node.id} className="bg-muted/50">
                                  <CardContent className="p-3">
                                    <div className="font-medium text-sm">{node.label}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {node.content}
                                    </p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
