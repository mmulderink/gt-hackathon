import { AuditTrail } from "@/components/audit-trail";

export default function AuditPage() {
  return (
    <div className="p-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Audit Trail</h1>
        <p className="text-muted-foreground mt-2">
          Complete audit history with full transparency into every query decision and graph traversal
        </p>
      </div>
      <AuditTrail />
    </div>
  );
}
