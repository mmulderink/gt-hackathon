import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Settings,
  AlertTriangle,
  TrendingDown,
  Plus,
  Network,
  FileText,
  ThumbsDown,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FeedbackWithQuery {
  id: string;
  queryId: string;
  query: string;
  rating: number | null;
  thumbs: string | null;
  correctness: string | null;
  comment: string | null;
  createdAt: Date | string;
  evaluationScore: number | null;
}

interface AdminFeedbackData {
  totalFeedback: number;
  negativeFeedback: number;
  feedbackList: FeedbackWithQuery[];
  knowledgeGaps: Array<{ query: string; frequency: number }>;
}

export default function AdminPage() {
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
  const [newNode, setNewNode] = useState({ id: "", type: "device", label: "", content: "" });
  const [newEdge, setNewEdge] = useState({ id: "", from: "", to: "", relationship: "", weight: 1.0 });
  const { toast } = useToast();

  const { data: feedbackData, isLoading } = useQuery<AdminFeedbackData>({
    queryKey: ["/api/admin/feedback"],
  });

  const createNodeMutation = useMutation({
    mutationFn: async (node: typeof newNode) => {
      const res = await apiRequest("POST", "/api/admin/nodes", node);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
      setIsAddNodeOpen(false);
      setNewNode({ id: "", type: "device", label: "", content: "" });
      toast({
        title: "Node Created",
        description: "New knowledge graph node has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create node. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createEdgeMutation = useMutation({
    mutationFn: async (edge: typeof newEdge) => {
      const res = await apiRequest("POST", "/api/admin/edges", edge);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
      setIsAddEdgeOpen(false);
      setNewEdge({ id: "", from: "", to: "", relationship: "", weight: 1.0 });
      toast({
        title: "Edge Created",
        description: "New knowledge graph relationship has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create edge. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Settings className="w-12 h-12 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const negativeRate = feedbackData?.totalFeedback
    ? (feedbackData.negativeFeedback / feedbackData.totalFeedback) * 100
    : 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-admin-title">
            <Settings className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze feedback and manage knowledge graph structure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-feedback">
                {feedbackData?.totalFeedback || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">User responses collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2" data-testid="text-negative-feedback">
                {feedbackData?.negativeFeedback || 0}
                {negativeRate > 20 && <AlertTriangle className="w-5 h-5 text-destructive" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{negativeRate.toFixed(1)}% negative rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-knowledge-gaps">
                {feedbackData?.knowledgeGaps.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Areas needing improvement</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Knowledge Gaps Analysis
              </CardTitle>
              <CardDescription>Queries with repeated negative feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackData?.knowledgeGaps && feedbackData.knowledgeGaps.length > 0 ? (
                <div className="space-y-3">
                  {feedbackData.knowledgeGaps.slice(0, 10).map((gap, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`gap-${idx}`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{gap.query}</p>
                      </div>
                      <Badge variant="destructive">{gap.frequency}x</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No knowledge gaps identified. All feedback is positive!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Graph Management
              </CardTitle>
              <CardDescription>Add nodes and edges to improve coverage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={isAddNodeOpen} onOpenChange={setIsAddNodeOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="default" data-testid="button-add-node">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Knowledge Node
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Knowledge Node</DialogTitle>
                    <DialogDescription>
                      Create a new node in the knowledge graph (device, symptom, solution, regulation, procedure)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="node-id">Node ID</Label>
                      <Input
                        id="node-id"
                        placeholder="e.g., DEV-005"
                        value={newNode.id}
                        onChange={(e) => setNewNode({ ...newNode, id: e.target.value })}
                        data-testid="input-node-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="node-type">Type</Label>
                      <Select value={newNode.type} onValueChange={(value) => setNewNode({ ...newNode, type: value })}>
                        <SelectTrigger data-testid="select-node-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="device">Device</SelectItem>
                          <SelectItem value="symptom">Symptom</SelectItem>
                          <SelectItem value="solution">Solution</SelectItem>
                          <SelectItem value="regulation">Regulation</SelectItem>
                          <SelectItem value="procedure">Procedure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="node-label">Label</Label>
                      <Input
                        id="node-label"
                        placeholder="e.g., Advanced Imaging System"
                        value={newNode.label}
                        onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                        data-testid="input-node-label"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="node-content">Content</Label>
                      <Textarea
                        id="node-content"
                        placeholder="Detailed description of the node..."
                        value={newNode.content}
                        onChange={(e) => setNewNode({ ...newNode, content: e.target.value })}
                        data-testid="input-node-content"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createNodeMutation.mutate(newNode)}
                      disabled={createNodeMutation.isPending || !newNode.id || !newNode.label || !newNode.content}
                      data-testid="button-create-node"
                    >
                      {createNodeMutation.isPending ? "Creating..." : "Create Node"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddEdgeOpen} onOpenChange={setIsAddEdgeOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline" data-testid="button-add-edge">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Relationship
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Relationship</DialogTitle>
                    <DialogDescription>
                      Create a new edge connecting two nodes in the knowledge graph
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edge-id">Edge ID</Label>
                      <Input
                        id="edge-id"
                        placeholder="e.g., E-020"
                        value={newEdge.id}
                        onChange={(e) => setNewEdge({ ...newEdge, id: e.target.value })}
                        data-testid="input-edge-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edge-from">From Node ID</Label>
                      <Input
                        id="edge-from"
                        placeholder="e.g., DEV-001"
                        value={newEdge.from}
                        onChange={(e) => setNewEdge({ ...newEdge, from: e.target.value })}
                        data-testid="input-edge-from"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edge-to">To Node ID</Label>
                      <Input
                        id="edge-to"
                        placeholder="e.g., SYM-001"
                        value={newEdge.to}
                        onChange={(e) => setNewEdge({ ...newEdge, to: e.target.value })}
                        data-testid="input-edge-to"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edge-relationship">Relationship</Label>
                      <Input
                        id="edge-relationship"
                        placeholder="e.g., has_symptom"
                        value={newEdge.relationship}
                        onChange={(e) => setNewEdge({ ...newEdge, relationship: e.target.value })}
                        data-testid="input-edge-relationship"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edge-weight">Weight (0.0-1.0)</Label>
                      <Input
                        id="edge-weight"
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={newEdge.weight}
                        onChange={(e) => setNewEdge({ ...newEdge, weight: parseFloat(e.target.value) })}
                        data-testid="input-edge-weight"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => createEdgeMutation.mutate(newEdge)}
                      disabled={createEdgeMutation.isPending || !newEdge.id || !newEdge.from || !newEdge.to || !newEdge.relationship}
                      data-testid="button-create-edge"
                    >
                      {createEdgeMutation.isPending ? "Creating..." : "Create Edge"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Feedback
            </CardTitle>
            <CardDescription>All user feedback with associated queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedbackData?.feedbackList && feedbackData.feedbackList.length > 0 ? (
                feedbackData.feedbackList.slice(0, 20).map((fb) => {
                  const timestamp = fb.createdAt instanceof Date ? fb.createdAt : new Date(fb.createdAt);
                  const isNegative = 
                    fb.thumbs === 'down' || 
                    (fb.rating !== null && fb.rating < 3) || 
                    fb.correctness === 'incorrect';

                  return (
                    <div
                      key={fb.id}
                      className={`p-4 rounded-md ${isNegative ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}
                      data-testid={`feedback-${fb.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">{fb.query}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {format(timestamp, 'MMM d, yyyy h:mm a')}
                            </span>
                            {fb.thumbs && (
                              <Badge variant={fb.thumbs === 'down' ? 'destructive' : 'default'}>
                                {fb.thumbs === 'down' ? <ThumbsDown className="w-3 h-3 mr-1" /> : '👍'}
                                {fb.thumbs}
                              </Badge>
                            )}
                            {fb.rating !== null && (
                              <Badge variant="outline">
                                <Star className="w-3 h-3 mr-1" />
                                {fb.rating}/5
                              </Badge>
                            )}
                            {fb.correctness && (
                              <Badge variant={fb.correctness === 'incorrect' ? 'destructive' : 'outline'}>
                                {fb.correctness}
                              </Badge>
                            )}
                          </div>
                          {fb.comment && (
                            <p className="text-sm text-muted-foreground mt-2 italic">"{fb.comment}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No feedback collected yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
