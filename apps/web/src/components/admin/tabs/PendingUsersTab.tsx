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
import { Clock, Calendar, CheckCircle, XCircle } from "lucide-react";
import { PaginationControls } from "../../dashboard/files/PaginationControls";
import { formatUserDate } from "../utils/user-helpers";
import { UserAvatarCell, UserEmailCell } from "../components/UserCells";
import { useUserStats } from "../hooks/useUserStats";

const ITEMS_PER_PAGE = 10;

export function PendingUsersTab() {
  const [currentPage, setCurrentPage] = useState(0);

  const [approveDialog, setApproveDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
  }>({
    isOpen: false,
    userId: null,
    userName: null,
    userEmail: null,
  });

  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
  }>({
    isOpen: false,
    userId: null,
    userName: null,
    userEmail: null,
  });

  const {
    data: pendingUsersData,
    isLoading: usersLoading,
    refetch,
  } = trpc.admin.getPendingUsers.useQuery({
    limit: ITEMS_PER_PAGE,
    offset: currentPage * ITEMS_PER_PAGE,
  });

  const { data: stats, refetch: refetchStats } = useUserStats();

  const pendingUsers = pendingUsersData?.users || [];
  const totalCount = pendingUsersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const approveUser = trpc.admin.approveUser.useMutation({
    onSuccess: () => {
      // If we're on the last page and it becomes empty after approval, go to previous page
      const newTotalCount = totalCount - 1;
      const newTotalPages = Math.ceil(newTotalCount / ITEMS_PER_PAGE);
      if (currentPage >= newTotalPages && currentPage > 0) {
        setCurrentPage(newTotalPages - 1);
      }
      refetch();
      refetchStats();
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
      // If we're on the last page and it becomes empty after rejection, go to previous page
      const newTotalCount = totalCount - 1;
      const newTotalPages = Math.ceil(newTotalCount / ITEMS_PER_PAGE);
      if (currentPage >= newTotalPages && currentPage > 0) {
        setCurrentPage(newTotalPages - 1);
      }
      refetch();
      refetchStats();
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

  const handleApprove = (
    userId: string,
    userName: string,
    userEmail: string,
  ) => {
    setApproveDialog({
      isOpen: true,
      userId,
      userName,
      userEmail,
    });
  };

  const handleReject = (
    userId: string,
    userName: string,
    userEmail: string,
  ) => {
    setRejectDialog({
      isOpen: true,
      userId,
      userName,
      userEmail,
    });
  };

  const confirmApprove = async () => {
    if (!approveDialog.userId) return;
    await approveUser.mutateAsync({ userId: approveDialog.userId });
    setApproveDialog({
      isOpen: false,
      userId: null,
      userName: null,
      userEmail: null,
    });
  };

  const confirmReject = async () => {
    if (!rejectDialog.userId) return;
    await rejectUser.mutateAsync({ userId: rejectDialog.userId });
    setRejectDialog({
      isOpen: false,
      userId: null,
      userName: null,
      userEmail: null,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Pending User Approvals
              </CardTitle>
              <CardDescription className="mt-2">
                Review and approve user registrations
              </CardDescription>
            </div>
            {stats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {stats.pending}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.total}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Users
                  </div>
                </div>
              </div>
            )}
          </div>
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
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading pending users...</p>
            </div>
          ) : !pendingUsers || pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-1">
                No pending users
              </p>
              <p className="text-sm text-muted-foreground">
                All user registrations have been reviewed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {pendingUsers.length} of {totalCount} pending user
                  {totalCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">
                        Registered
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <UserAvatarCell
                            name={user.name}
                            email={user.email}
                            showEmail={!!user.name}
                          />
                        </TableCell>
                        <TableCell>
                          <UserEmailCell email={user.email} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1.5 w-fit font-medium"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            <span className="capitalize">{user.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatUserDate(user.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApprove(
                                  user.id,
                                  user.name || "User",
                                  user.email,
                                )
                              }
                              disabled={
                                approveUser.isPending || rejectUser.isPending
                              }
                              className="gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleReject(
                                  user.id,
                                  user.name || "User",
                                  user.email,
                                )
                              }
                              disabled={
                                approveUser.isPending || rejectUser.isPending
                              }
                              className="gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Confirmation Dialog */}
      <ConfirmationDialog
        open={approveDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setApproveDialog({
            isOpen: false,
            userId: null,
            userName: null,
            userEmail: null,
          })
        }
        onConfirm={confirmApprove}
        title="Approve User"
        description={
          <>
            Are you sure you want to approve{" "}
            <strong>{approveDialog.userName}</strong> ({approveDialog.userEmail}
            )? They will be notified via email and granted access to the system.
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
          setRejectDialog({
            isOpen: false,
            userId: null,
            userName: null,
            userEmail: null,
          })
        }
        onConfirm={confirmReject}
        title="Reject User"
        description={
          <>
            Are you sure you want to reject{" "}
            <strong>{rejectDialog.userName}</strong> ({rejectDialog.userEmail})?
            They will be notified via email and will not be able to access the
            system.
          </>
        }
        confirmText="Reject"
        variant="destructive"
        loading={rejectUser.isPending}
      />
    </>
  );
}
