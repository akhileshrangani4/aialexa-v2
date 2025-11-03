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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function PendingUsersTab() {
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

  const {
    data: pendingUsers,
    isLoading: usersLoading,
    refetch,
  } = trpc.admin.getPendingUsers.useQuery();

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

  return (
    <>
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
              <AlertDescription>{approveUser.error.message}</AlertDescription>
            </Alert>
          )}
          {rejectUser.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{rejectUser.error.message}</AlertDescription>
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
            <strong>{approveDialog.userName}</strong>? They will be notified via
            email and granted access to the system.
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
            <strong>{rejectDialog.userName}</strong>? They will be notified via
            email and will not be able to access the system.
          </>
        }
        confirmText="Reject"
        variant="destructive"
        loading={rejectUser.isPending}
      />
    </>
  );
}
