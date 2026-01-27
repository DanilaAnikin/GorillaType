"use client";

import * as React from "react";
import { useState } from "react";
import { Settings, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "@/components/ui/modal";
import type { ClanDetails, ClanRole } from "./types";

/**
 * Props for the ClanSettings component.
 */
export interface ClanSettingsProps {
  /** Clan details */
  clan: ClanDetails;
  /** User's role in the clan */
  userRole: ClanRole;
  /** Callback when settings are updated */
  onUpdateSettings: (data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }) => Promise<void>;
  /** Callback when clan is deleted */
  onDeleteClan: () => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ClanSettings provides settings controls for clan admins and owners.
 */
export function ClanSettings({
  clan,
  userRole,
  onUpdateSettings,
  onDeleteClan,
  className,
}: ClanSettingsProps) {
  const [name, setName] = useState(clan.name);
  const [description, setDescription] = useState(clan.description || "");
  const [isPublic, setIsPublic] = useState(clan.isPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = userRole === "owner";
  const hasChanges =
    name !== clan.name ||
    description !== (clan.description || "") ||
    isPublic !== clan.isPublic;

  // Validation
  const nameError = name.length > 0 && (name.length < 3 || name.length > 32);
  const isValid = name.length >= 3 && name.length <= 32;

  const handleSave = async () => {
    if (!isValid || isLoading || !hasChanges) return;

    setIsLoading(true);
    setError(null);

    try {
      await onUpdateSettings({
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== clan.name || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDeleteClan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete clan");
      setIsDeleting(false);
    }
  };

  return (
    <div className={className}>
      <div className="rounded-lg border border-sub bg-sub-alt p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-main" />
          <h2 className="text-lg font-medium text-text">Clan Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Clan Name */}
          <div>
            <label htmlFor="settings-name" className="block text-sm font-medium text-text mb-1.5">
              Clan Name
            </label>
            <Input
              id="settings-name"
              type="text"
              placeholder="Enter clan name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              errorMessage={nameError ? "Name must be 3-32 characters" : undefined}
              disabled={isLoading}
              maxLength={32}
            />
          </div>

          {/* Clan Tag (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Clan Tag
            </label>
            <Input
              type="text"
              value={`[${clan.tag}]`}
              disabled
              className="opacity-60"
            />
            <p className="text-xs text-sub mt-1">
              Clan tags cannot be changed after creation.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="settings-description" className="block text-sm font-medium text-text mb-1.5">
              Description
            </label>
            <textarea
              id="settings-description"
              placeholder="Tell others about your clan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              maxLength={200}
              rows={3}
              className="flex w-full rounded-md border border-sub bg-bg px-3 py-2 text-sm text-text transition-colors placeholder:text-sub focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-sub mt-1">
              {description.length}/200 characters
            </p>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg border border-sub">
            <div>
              <p className="text-sm font-medium text-text">Public Clan</p>
              <p className="text-xs text-sub">
                {isPublic
                  ? "Anyone can find and join your clan"
                  : "Members must be invited to join"}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            variant="active"
            disabled={!isValid || isLoading || !hasChanges}
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Danger Zone - Owner Only */}
      {isOwner && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-error" />
            <h2 className="text-lg font-medium text-error">Danger Zone</h2>
          </div>

          <p className="text-sm text-sub mb-4">
            Deleting your clan is permanent and cannot be undone. All members will be removed.
          </p>

          <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <ModalTrigger asChild>
              <Button
                variant="destructive"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Clan
              </Button>
            </ModalTrigger>
            <ModalContent className="max-w-md">
              <ModalHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-error" />
                  </div>
                  <ModalTitle>Delete Clan</ModalTitle>
                </div>
                <ModalDescription>
                  This action cannot be undone. This will permanently delete the clan
                  <strong className="text-text"> {clan.name}</strong> and remove all members.
                </ModalDescription>
              </ModalHeader>

              <div className="py-4">
                <label htmlFor="delete-confirm" className="block text-sm font-medium text-text mb-1.5">
                  Type <span className="text-error font-mono">{clan.name}</span> to confirm
                </label>
                <Input
                  id="delete-confirm"
                  type="text"
                  placeholder={clan.name}
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  disabled={isDeleting}
                />
              </div>

              <ModalFooter>
                <ModalClose asChild>
                  <Button type="button" variant="ghost" disabled={isDeleting}>
                    Cancel
                  </Button>
                </ModalClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteConfirmation !== clan.name || isDeleting}
                  loading={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Clan"}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      )}
    </div>
  );
}

export default ClanSettings;
