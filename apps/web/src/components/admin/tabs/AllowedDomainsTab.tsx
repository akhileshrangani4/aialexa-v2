"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { validateDomainForAllowlist } from "@/lib/domain-validation";

export function AllowedDomainsTab() {
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    domainId: string | null;
    domainName: string | null;
  }>({
    isOpen: false,
    domainId: null,
    domainName: null,
  });

  const {
    data: domainsData,
    isLoading: domainsLoading,
    refetch,
  } = trpc.admin.listDomains.useQuery({ page: currentPage, limit: 50 });

  const domains = domainsData?.domains ?? [];
  const pagination = domainsData?.pagination;

  const { data: envDomains } = trpc.admin.getEnvDomains.useQuery();

  const addDomainMutation = trpc.admin.addDomain.useMutation({
    onSuccess: () => {
      toast.success("Domain added successfully");
      setNewDomain("");
      setIsAddingDomain(false);
      setCurrentPage(1); // Reset to first page to see the new domain
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add domain");
    },
  });

  const removeDomainMutation = trpc.admin.removeDomain.useMutation({
    onSuccess: () => {
      toast.success("Domain removed successfully");
      setDeleteDialog({ isOpen: false, domainId: null, domainName: null });
      // Stay on current page unless it becomes empty, then go to previous page
      if (domains.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove domain");
    },
  });

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error("Please enter a domain");
      return;
    }

    const trimmedDomain = newDomain.trim().toLowerCase();

    // Use shared validation utility (same logic as backend)
    const validation = validateDomainForAllowlist(trimmedDomain);
    if (!validation.valid) {
      toast.error("⚠️ Invalid domain", {
        description: validation.reason,
        duration: 8000,
      });
      return;
    }

    await addDomainMutation.mutateAsync({
      domain: trimmedDomain,
    });
  };

  const handleRemoveDomain = async () => {
    if (!deleteDialog.domainId) return;

    await removeDomainMutation.mutateAsync({ domainId: deleteDialog.domainId });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Allowed Email Domains</CardTitle>
          <CardDescription>
            Manage email domains that are allowed to register
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  Users with email addresses from these domains can register for
                  an account. They will still require manual admin approval
                  before accessing the platform. You can add your own custom
                  domains below, which will work alongside any environment
                  domains shown at the bottom. If no domains are configured, all
                  email domains are allowed to register.
                </p>
                <div className="pt-2 text-xs">
                  <p className="font-semibold mb-1">Examples:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2 text-xs">
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        .edu
                      </code>{" "}
                      - US educational institutions
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        .edu.tw
                      </code>{" "}
                      - Taiwan educational institutions
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        .ac.uk
                      </code>{" "}
                      - UK academic institutions
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        .de
                      </code>{" "}
                      - All German domains (broad access)
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        stanford.edu
                      </code>{" "}
                      - Only Stanford University
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        uni-bonn.de
                      </code>{" "}
                      - Only University of Bonn
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        gmail.com
                      </code>{" "}
                      - Gmail addresses only
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        outlook.com
                      </code>{" "}
                      - Outlook/Hotmail addresses only
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3">
                    Specific domains are always allowed (gmail.com,
                    akhilesh.tech) <b>if you ever need to add them.</b> Only
                    broad patterns (.com, .net, .org, .io) are blocked.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Add domain form */}
          <div className="mb-6">
            <div className="flex gap-2">
              {isAddingDomain ? (
                <>
                  <Input
                    type="text"
                    placeholder="Enter domain (e.g., .edu, .de, stanford.edu, gmail.com)"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddDomain();
                      } else if (e.key === "Escape") {
                        setIsAddingDomain(false);
                        setNewDomain("");
                      }
                    }}
                    autoFocus
                    disabled={addDomainMutation.isPending}
                  />
                  <Button
                    onClick={handleAddDomain}
                    disabled={addDomainMutation.isPending}
                  >
                    {addDomainMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingDomain(false);
                      setNewDomain("");
                    }}
                    disabled={addDomainMutation.isPending}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsAddingDomain(true)}>
                  Add Domain
                </Button>
              )}
            </div>
          </div>

          {/* Database Domains */}
          <div className="space-y-3 mb-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Database Domains</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Domains added through the admin panel (can be added/removed)
              </p>
            </div>
            {domainsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading domains...
              </div>
            ) : !domains || domains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No database domains configured. Use the &quot;Add Domain&quot;
                button above to add domains.
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">
                          <Badge variant="secondary" className="font-mono">
                            {domain.domain}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(domain.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                domainId: domain.id,
                                domainName: domain.domain,
                              })
                            }
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {domains.length} of {pagination.total} domain
                  {pagination.total !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || domainsLoading}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(pagination.totalPages, p + 1),
                      )
                    }
                    disabled={
                      currentPage === pagination.totalPages || domainsLoading
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Environment Domains */}
          {envDomains && envDomains.length > 0 && (
            <div className="space-y-3 pt-6 border-t">
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Environment Domains
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Read-only domains from server configuration
                  (APPROVED_EMAIL_DOMAINS). These are &quot;built-in
                  defaults&quot; that require backend access to modify. You can
                  manage your own custom domains using the &quot;Add
                  Domain&quot; button above. All domains (both environment and
                  database) work together to allow user registrations.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {envDomains.map((domain, index) => (
                  <Badge
                    key={`env-${index}`}
                    variant="outline"
                    className="font-mono"
                  >
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({
              isOpen: false,
              domainId: null,
              domainName: null,
            });
          }
        }}
        onConfirm={handleRemoveDomain}
        title="Remove Allowed Domain"
        description={`Are you sure you want to remove "${deleteDialog.domainName}"? Users with this domain will no longer be able to register.`}
        confirmText="Remove"
        variant="destructive"
        loading={removeDomainMutation.isPending}
      />
    </>
  );
}
