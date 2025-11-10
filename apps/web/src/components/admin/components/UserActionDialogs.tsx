"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { UserDialogState } from "../hooks/useUserDialogs";

interface UserActionDialogsProps {
  dialogs: {
    promote: UserDialogState;
    demote: UserDialogState;
    disable: UserDialogState;
    enable: UserDialogState;
    delete: UserDialogState;
  };
  closers: {
    closePromote: () => void;
    closeDemote: () => void;
    closeDisable: () => void;
    closeEnable: () => void;
    closeDelete: () => void;
  };
  onConfirmPromote: () => Promise<void>;
  onConfirmDemote: () => Promise<void>;
  onConfirmDisable: () => Promise<void>;
  onConfirmEnable: () => Promise<void>;
  onConfirmDelete: () => Promise<void>;
  isLoading: {
    promote: boolean;
    demote: boolean;
    disable: boolean;
    enable: boolean;
    delete: boolean;
  };
}

export function UserActionDialogs({
  dialogs,
  closers,
  onConfirmPromote,
  onConfirmDemote,
  onConfirmDisable,
  onConfirmEnable,
  onConfirmDelete,
  isLoading,
}: UserActionDialogsProps) {
  return (
    <>
      {/* Promote Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogs.promote.isOpen}
        onOpenChange={(open) => !open && closers.closePromote()}
        onConfirm={onConfirmPromote}
        title="Promote to Admin"
        description={
          <>
            Are you sure you want to promote{" "}
            <strong>{dialogs.promote.userName}</strong> (
            {dialogs.promote.userEmail}) to admin? They will receive full admin
            privileges and be able to manage users, chatbots, and system
            settings.
          </>
        }
        confirmText="Promote to Admin"
        variant="default"
        loading={isLoading.promote}
      />

      {/* Demote Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogs.demote.isOpen}
        onOpenChange={(open) => !open && closers.closeDemote()}
        onConfirm={onConfirmDemote}
        title="Demote Admin to User"
        description={
          <>
            <div className="space-y-2">
              <p>
                <strong>WARNING:</strong> You are about to remove admin
                privileges from another administrator.
              </p>
              <p>
                Are you sure you want to demote{" "}
                <strong>{dialogs.demote.userName}</strong> (
                {dialogs.demote.userEmail}) from admin?
              </p>
              <p className="text-sm text-muted-foreground">This action will:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Remove all admin privileges immediately</li>
                <li>Convert their account to a regular user account</li>
                <li>Prevent them from accessing admin features</li>
                <li>
                  Allow them to be disabled or deleted like any regular user
                </li>
              </ul>
              <p className="text-sm font-medium text-foreground mt-3">
                This action can be reversed by promoting them back to admin.
              </p>
            </div>
          </>
        }
        confirmText="Demote to User"
        variant="destructive"
        loading={isLoading.demote}
      />

      {/* Disable Account Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogs.disable.isOpen}
        onOpenChange={(open) => !open && closers.closeDisable()}
        onConfirm={onConfirmDisable}
        title="Disable Account"
        description={
          <>
            Are you sure you want to disable the account for{" "}
            <strong>{dialogs.disable.userName}</strong> (
            {dialogs.disable.userEmail})? They will not be able to log in and
            will receive a notification email.
          </>
        }
        confirmText="Disable Account"
        variant="destructive"
        loading={isLoading.disable}
      />

      {/* Enable Account Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogs.enable.isOpen}
        onOpenChange={(open) => !open && closers.closeEnable()}
        onConfirm={onConfirmEnable}
        title="Enable Account"
        description={
          <>
            Are you sure you want to enable the account for{" "}
            <strong>{dialogs.enable.userName}</strong> (
            {dialogs.enable.userEmail})? They will be able to log in again and
            will receive a notification email.
          </>
        }
        confirmText="Enable Account"
        variant="default"
        loading={isLoading.enable}
      />

      {/* Delete Account Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogs.delete.isOpen}
        onOpenChange={(open) => !open && closers.closeDelete()}
        onConfirm={onConfirmDelete}
        title="Delete Account"
        description={
          <>
            <div className="space-y-2">
              <p>
                <strong>WARNING:</strong> This action cannot be undone!
              </p>
              <p>
                Are you sure you want to permanently delete the account for{" "}
                <strong>{dialogs.delete.userName}</strong> (
                {dialogs.delete.userEmail})?
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>User account and authentication data</li>
                <li>All chatbots created by this user</li>
                <li>All uploaded files and their embeddings</li>
                <li>All conversations and messages</li>
                <li>All analytics data</li>
              </ul>
            </div>
          </>
        }
        confirmText="Delete Account Permanently"
        variant="destructive"
        loading={isLoading.delete}
      />
    </>
  );
}
