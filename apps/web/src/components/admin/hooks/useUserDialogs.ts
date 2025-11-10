"use client";

import { useState } from "react";

export interface UserDialogState {
  isOpen: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
}

const initialDialogState: UserDialogState = {
  isOpen: false,
  userId: null,
  userName: null,
  userEmail: null,
};

export function useUserDialogs() {
  const [promoteDialog, setPromoteDialog] =
    useState<UserDialogState>(initialDialogState);
  const [demoteDialog, setDemoteDialog] =
    useState<UserDialogState>(initialDialogState);
  const [disableDialog, setDisableDialog] =
    useState<UserDialogState>(initialDialogState);
  const [enableDialog, setEnableDialog] =
    useState<UserDialogState>(initialDialogState);
  const [deleteDialog, setDeleteDialog] =
    useState<UserDialogState>(initialDialogState);

  const openPromote = (userId: string, userName: string, userEmail: string) => {
    setPromoteDialog({ isOpen: true, userId, userName, userEmail });
  };

  const openDemote = (userId: string, userName: string, userEmail: string) => {
    setDemoteDialog({ isOpen: true, userId, userName, userEmail });
  };

  const openDisable = (userId: string, userName: string, userEmail: string) => {
    setDisableDialog({ isOpen: true, userId, userName, userEmail });
  };

  const openEnable = (userId: string, userName: string, userEmail: string) => {
    setEnableDialog({ isOpen: true, userId, userName, userEmail });
  };

  const openDelete = (userId: string, userName: string, userEmail: string) => {
    setDeleteDialog({ isOpen: true, userId, userName, userEmail });
  };

  const closePromote = () => setPromoteDialog(initialDialogState);
  const closeDemote = () => setDemoteDialog(initialDialogState);
  const closeDisable = () => setDisableDialog(initialDialogState);
  const closeEnable = () => setEnableDialog(initialDialogState);
  const closeDelete = () => setDeleteDialog(initialDialogState);

  return {
    dialogs: {
      promote: promoteDialog,
      demote: demoteDialog,
      disable: disableDialog,
      enable: enableDialog,
      delete: deleteDialog,
    },
    handlers: {
      openPromote,
      openDemote,
      openDisable,
      openEnable,
      openDelete,
    },
    closers: {
      closePromote,
      closeDemote,
      closeDisable,
      closeEnable,
      closeDelete,
    },
  };
}
