"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Users } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { PaginationControls } from "../../dashboard/files/PaginationControls";
import { useUserStats } from "../hooks/useUserStats";
import { useUserActions } from "../hooks/useUserActions";
import { useUserDialogs } from "../hooks/useUserDialogs";
import { UserTableRow } from "../components/UserTableRow";
import { UserStatsHeader } from "../components/UserStatsHeader";
import { UserActionDialogs } from "../components/UserActionDialogs";
import { MutationErrors } from "../components/MutationErrors";

const ITEMS_PER_PAGE = 10;

export function AllUsersTab() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [currentPage, setCurrentPage] = useState(0);

  const {
    data: usersData,
    isLoading: usersLoading,
    refetch,
  } = trpc.admin.getAllUsers.useQuery({
    limit: ITEMS_PER_PAGE,
    offset: currentPage * ITEMS_PER_PAGE,
  });

  const { data: stats, refetch: refetchStats } = useUserStats();

  const allUsers = usersData?.users || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const actions = useUserActions({
    refetch,
    refetchStats,
    totalCount,
    currentPage,
    setCurrentPage,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const { dialogs, handlers, closers } = useUserDialogs();

  const confirmPromote = async () => {
    if (!dialogs.promote.userId) return;
    await actions.promoteToAdmin.mutateAsync({
      userId: dialogs.promote.userId,
    });
    closers.closePromote();
  };

  const confirmDemote = async () => {
    if (!dialogs.demote.userId) return;
    await actions.demoteFromAdmin.mutateAsync({
      userId: dialogs.demote.userId,
    });
    closers.closeDemote();
  };

  const confirmDisable = async () => {
    if (!dialogs.disable.userId) return;
    await actions.disableUser.mutateAsync({ userId: dialogs.disable.userId });
    closers.closeDisable();
  };

  const confirmEnable = async () => {
    if (!dialogs.enable.userId) return;
    await actions.enableUser.mutateAsync({ userId: dialogs.enable.userId });
    closers.closeEnable();
  };

  const confirmDelete = async () => {
    if (!dialogs.delete.userId) return;
    await actions.deleteUser.mutateAsync({ userId: dialogs.delete.userId });
    closers.closeDelete();
  };

  const isAnyActionPending =
    actions.promoteToAdmin.isPending ||
    actions.demoteFromAdmin.isPending ||
    actions.disableUser.isPending ||
    actions.enableUser.isPending ||
    actions.deleteUser.isPending;

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <UserStatsHeader stats={stats} />
        </CardHeader>
        <CardContent>
          <MutationErrors
            errors={{
              promote: actions.promoteToAdmin.error,
              demote: actions.demoteFromAdmin.error,
              disable: actions.disableUser.error,
              enable: actions.enableUser.error,
              delete: actions.deleteUser.error,
            }}
          />

          {usersLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : !allUsers || allUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-1">
                No users found
              </p>
              <p className="text-sm text-muted-foreground">
                Users will appear here once they register
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {allUsers.length} of {totalCount} user
                  {totalCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
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
                    {allUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        isCurrentUser={user.id === currentUserId}
                        onPromote={handlers.openPromote}
                        onDemote={handlers.openDemote}
                        onDisable={handlers.openDisable}
                        onEnable={handlers.openEnable}
                        onDelete={handlers.openDelete}
                        isAnyActionPending={isAnyActionPending}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <UserActionDialogs
        dialogs={dialogs}
        closers={closers}
        onConfirmPromote={confirmPromote}
        onConfirmDemote={confirmDemote}
        onConfirmDisable={confirmDisable}
        onConfirmEnable={confirmEnable}
        onConfirmDelete={confirmDelete}
        isLoading={{
          promote: actions.promoteToAdmin.isPending,
          demote: actions.demoteFromAdmin.isPending,
          disable: actions.disableUser.isPending,
          enable: actions.enableUser.isPending,
          delete: actions.deleteUser.isPending,
        }}
      />
    </>
  );
}
