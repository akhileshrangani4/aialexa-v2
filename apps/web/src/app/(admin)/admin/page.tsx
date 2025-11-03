"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  // State for confirmation dialogs
  const [approveDialog, setApproveDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string | null;
  }>({
    isOpen: false,
    userId: null,
    userName: null,
  });

  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string | null;
  }>({
    isOpen: false,
    userId: null,
    userName: null,
  });

  // Fetch pending users
  const {
    data: pendingUsers,
    isLoading: usersLoading,
    refetch,
  } = trpc.admin.getPendingUsers.useQuery(undefined, { enabled: !!session });

  // Approve user mutation
  const approveUser = trpc.admin.approveUser.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("User approved successfully", {
        description: "The user has been notified via email",
      });
    },
    onError: (error) => {
      toast.error("Failed to approve user", {
        description: error.message,
      });
    },
  });

  // Reject user mutation
  const rejectUser = trpc.admin.rejectUser.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("User rejected", {
        description: "The user has been notified via email",
      });
    },
    onError: (error) => {
      toast.error("Failed to reject user", {
        description: error.message,
      });
    },
  });

  const handleApprove = (userId: string, userName: string) => {
    setApproveDialog({
      isOpen: true,
      userId,
      userName,
    });
  };

  const handleReject = (userId: string, userName: string) => {
    setRejectDialog({
      isOpen: true,
      userId,
      userName,
    });
  };

  const confirmApprove = async () => {
    if (!approveDialog.userId) return;
    await approveUser.mutateAsync({ userId: approveDialog.userId });
    setApproveDialog({ isOpen: false, userId: null, userName: null });
  };

  const confirmReject = async () => {
    if (!rejectDialog.userId) return;
    await rejectUser.mutateAsync({ userId: rejectDialog.userId });
    setRejectDialog({ isOpen: false, userId: null, userName: null });
  };

  // Loading state
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if user is admin
  if (!session) {
    router.push("/login");
    return null;
  }

  // Type assertion for extended user fields
  const user = session.user as typeof session.user & {
    role: "user" | "admin";
    status: "pending" | "approved" | "rejected";
  };

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage users, domains, and system settings
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                toast.success("Signed out successfully");
                router.push("/login");
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Pending Users</TabsTrigger>
            <TabsTrigger value="domains">Approved Domains</TabsTrigger>
          </TabsList>

          {/* Pending Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Pending User Approvals</CardTitle>
                <CardDescription>
                  Review and approve user registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approveUser.error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                      {approveUser.error.message}
                    </AlertDescription>
                  </Alert>
                )}
                {rejectUser.error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>
                      {rejectUser.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                {usersLoading ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Loading users...
                  </p>
                ) : !pendingUsers || pendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No pending users</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApprove(user.id, user.name || "User")
                                }
                                disabled={
                                  approveUser.isPending || rejectUser.isPending
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleReject(user.id, user.name || "User")
                                }
                                disabled={
                                  approveUser.isPending || rejectUser.isPending
                                }
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Domains Tab */}
          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle>Approved Email Domains</CardTitle>
                <CardDescription>
                  Email domains that are automatically approved for registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertDescription>
                    Approved domains are configured in your environment
                    variables (APPROVED_DOMAINS). Users with these email domains
                    can register automatically.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Configured domains will be shown here. If the list is empty,
                    all domains are allowed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Approval Confirmation Dialog */}
        <ConfirmationDialog
          open={approveDialog.isOpen}
          onOpenChange={(open) =>
            !open &&
            setApproveDialog({ isOpen: false, userId: null, userName: null })
          }
          onConfirm={confirmApprove}
          title="Approve User"
          description={
            <>
              Are you sure you want to approve{" "}
              <strong>{approveDialog.userName}</strong>? They will be notified
              via email and granted access to the system.
            </>
          }
          confirmText="Approve"
          variant="default"
          loading={approveUser.isPending}
        />

        {/* Rejection Confirmation Dialog */}
        <ConfirmationDialog
          open={rejectDialog.isOpen}
          onOpenChange={(open) =>
            !open &&
            setRejectDialog({ isOpen: false, userId: null, userName: null })
          }
          onConfirm={confirmReject}
          title="Reject User"
          description={
            <>
              Are you sure you want to reject{" "}
              <strong>{rejectDialog.userName}</strong>? They will be notified
              via email and will not be able to access the system.
            </>
          }
          confirmText="Reject"
          variant="destructive"
          loading={rejectUser.isPending}
        />
      </div>
    </div>
  );
}
