"use client";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface UseUserActionsProps {
  refetch: () => void;
  refetchStats: () => void;
  totalCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
}

interface UserActionsReturn {
  promoteToAdmin: ReturnType<typeof trpc.admin.promoteToAdmin.useMutation>;
  demoteFromAdmin: ReturnType<typeof trpc.admin.demoteFromAdmin.useMutation>;
  disableUser: ReturnType<typeof trpc.admin.disableUser.useMutation>;
  enableUser: ReturnType<typeof trpc.admin.enableUser.useMutation>;
  deleteUser: ReturnType<typeof trpc.admin.deleteUser.useMutation>;
}

export function useUserActions({
  refetch,
  refetchStats,
  totalCount,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}: UseUserActionsProps): UserActionsReturn {
  const promoteToAdmin = trpc.admin.promoteToAdmin.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
      toast.success("User promoted to admin", {
        description: "The user now has admin privileges",
      });
    },
    onError: (error) => {
      toast.error("Failed to promote user", {
        description: error.message,
      });
    },
  });

  const demoteFromAdmin = trpc.admin.demoteFromAdmin.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
      toast.success("Admin demoted to user", {
        description: "The user's admin privileges have been removed",
      });
    },
    onError: (error) => {
      toast.error("Failed to demote admin", {
        description: error.message,
      });
    },
  });

  const disableUser = trpc.admin.disableUser.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
      toast.success("Account disabled", {
        description: "The user will not be able to log in",
      });
    },
    onError: (error) => {
      toast.error("Failed to disable account", {
        description: error.message,
      });
    },
  });

  const enableUser = trpc.admin.enableUser.useMutation({
    onSuccess: () => {
      refetch();
      refetchStats();
      toast.success("Account enabled", {
        description: "The user can now log in again",
      });
    },
    onError: (error) => {
      toast.error("Failed to enable account", {
        description: error.message,
      });
    },
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      // If we're on the last page and it becomes empty after deletion, go to previous page
      const newTotalCount = totalCount - 1;
      const newTotalPages = Math.ceil(newTotalCount / itemsPerPage);
      if (currentPage >= newTotalPages && currentPage > 0) {
        setCurrentPage(newTotalPages - 1);
      }
      refetch();
      refetchStats();
      toast.success("Account deleted", {
        description:
          "The user and all associated data have been permanently deleted",
      });
    },
    onError: (error) => {
      toast.error("Failed to delete account", {
        description: error.message,
      });
    },
  });

  return {
    promoteToAdmin,
    demoteFromAdmin,
    disableUser,
    enableUser,
    deleteUser,
  };
}
