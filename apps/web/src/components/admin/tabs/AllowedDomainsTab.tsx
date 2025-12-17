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
import { parse, getPublicSuffix } from "tldts";

export function AllowedDomainsTab() {
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);

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
    data: domains,
    isLoading: domainsLoading,
    refetch,
  } = trpc.admin.listDomains.useQuery();

  const { data: envDomains } = trpc.admin.getEnvDomains.useQuery();

  const addDomainMutation = trpc.admin.addDomain.useMutation({
    onSuccess: () => {
      toast.success("Domain added successfully");
      setNewDomain("");
      setIsAddingDomain(false);
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

    // Basic format validation
    const domainRegex =
      /^\.?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(trimmedDomain)) {
      toast.error(
        "Please enter a valid domain (e.g., .edu, stanford.edu, uni-bonn.de)",
      );
      return;
    }

    // Safe educational TLDs that are allowed (specific to educational institutions)
    const safeEducationalTLDs = [
      ".edu",
      "edu", // US education
      ".ac.uk",
      "ac.uk", // UK academia
      ".ac.in",
      "ac.in", // India academia
      ".edu.in",
      "edu.in", // India education
      ".ac.nz",
      "ac.nz", // New Zealand academia
      ".ac.za",
      "ac.za", // South Africa academia
      ".ac.jp",
      "ac.jp", // Japan academia
      ".ac.kr",
      "ac.kr", // South Korea academia
      ".ac.cn",
      "ac.cn", // China academia
      ".ac.il",
      "ac.il", // Israel academia
      ".edu.au",
      "edu.au", // Australia education
      ".edu.cn",
      "edu.cn", // China education
      ".edu.br",
      "edu.br", // Brazil education
      ".edu.mx",
      "edu.mx", // Mexico education
      ".edu.ar",
      "edu.ar", // Argentina education
      ".edu.co",
      "edu.co", // Colombia education
      ".edu.eg",
      "edu.eg", // Egypt education
      ".edu.pk",
      "edu.pk", // Pakistan education
      ".edu.sg",
      "edu.sg", // Singapore education
      ".edu.my",
      "edu.my", // Malaysia education
      ".edu.ph",
      "edu.ph", // Philippines education
    ];

    // If it's a safe educational TLD, allow it immediately
    if (safeEducationalTLDs.includes(trimmedDomain)) {
      await addDomainMutation.mutateAsync({
        domain: trimmedDomain,
      });
      return;
    }

    // Use tldts to parse the domain using the Public Suffix List (industry standard)
    // Add a dummy prefix if the domain starts with a dot for proper parsing
    const testDomain = trimmedDomain.startsWith(".")
      ? `example${trimmedDomain}`
      : trimmedDomain;

    const parsed = parse(testDomain);
    const publicSuffix = getPublicSuffix(testDomain);

    // Check if what they entered is ONLY a public suffix (too broad)
    const domainWithoutDot = trimmedDomain.startsWith(".")
      ? trimmedDomain.slice(1)
      : trimmedDomain;

    // If the domain without dot equals the public suffix, it's just a TLD (too broad)
    if (publicSuffix && domainWithoutDot === publicSuffix) {
      toast.error("⚠️ Broad TLD detected", {
        description: `Adding "${trimmedDomain}" will allow ALL emails from this domain type. For security, please add specific institutions instead (e.g., "stanford.edu" or "uni-bonn.de", not "${trimmedDomain}")`,
        duration: 8000,
      });
      return;
    }

    // If parsed domain is null or invalid, block it
    if (!parsed.domain) {
      toast.error("Invalid domain", {
        description:
          "Please enter a valid domain name or educational TLD pattern",
        duration: 6000,
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
                  before accessing the platform. If no domains are configured,
                  all email domains are allowed to register.
                </p>
                <div className="pt-2 text-xs">
                  <p className="font-semibold mb-1">Examples:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded">.edu</code>{" "}
                      - Allows all US educational institutions
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        .ac.uk
                      </code>{" "}
                      - Allows all UK academic institutions
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        stanford.edu
                      </code>{" "}
                      - Only Stanford University
                    </li>
                    <li>
                      <code className="bg-muted px-1 py-0.5 rounded">
                        uni-bonn.de
                      </code>{" "}
                      - Only University of Bonn (Germany)
                    </li>
                  </ul>
                  <p className="mt-2 text-amber-600 dark:text-amber-500 font-medium">
                    ⚠️ Avoid broad country TLDs like .de, .fr, .uk - use
                    specific domains instead
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
                    placeholder="Enter domain (e.g., .edu, .ac.uk, stanford.edu, uni-bonn.de)"
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
          </div>

          {/* Environment Domains */}
          {envDomains && envDomains.length > 0 && (
            <div className="space-y-3 pt-6 border-t">
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Environment Domains
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Read-only domains from APPROVED_EMAIL_DOMAINS env variable
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
