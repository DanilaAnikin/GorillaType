"use client";

import * as React from "react";
import { useState } from "react";
import { Users, Loader2 } from "lucide-react";
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

/**
 * Props for the CreateClanModal component.
 */
export interface CreateClanModalProps {
  /** Callback when clan is created */
  onCreateClan: (data: {
    name: string;
    tag: string;
    description: string;
    isPublic: boolean;
  }) => Promise<void>;
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Trigger element (optional, can control externally) */
  trigger?: React.ReactNode;
}

/**
 * CreateClanModal allows users to create a new clan.
 */
export function CreateClanModal({
  onCreateClan,
  open,
  onOpenChange,
  trigger,
}: CreateClanModalProps) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const nameError = name.length > 0 && (name.length < 3 || name.length > 32);
  const tagError = tag.length > 0 && (tag.length < 2 || tag.length > 6 || !/^[A-Za-z0-9]+$/.test(tag));
  const isValid = name.length >= 3 && name.length <= 32 && tag.length >= 2 && tag.length <= 6 && /^[A-Za-z0-9]+$/.test(tag);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await onCreateClan({
        name: name.trim(),
        tag: tag.toUpperCase().trim(),
        description: description.trim(),
        isPublic,
      });
      // Reset form on success
      setName("");
      setTag("");
      setDescription("");
      setIsPublic(true);
      onOpenChange?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create clan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName("");
      setTag("");
      setDescription("");
      setIsPublic(true);
      setError(null);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      {trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
      <ModalContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-main/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-main" />
              </div>
              <ModalTitle>Create a Clan</ModalTitle>
            </div>
            <ModalDescription>
              Create a clan to compete with friends and track your collective progress.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* Clan Name */}
            <div>
              <label htmlFor="clan-name" className="block text-sm font-medium text-text mb-1.5">
                Clan Name
              </label>
              <Input
                id="clan-name"
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

            {/* Clan Tag */}
            <div>
              <label htmlFor="clan-tag" className="block text-sm font-medium text-text mb-1.5">
                Clan Tag
              </label>
              <Input
                id="clan-tag"
                type="text"
                placeholder="e.g., GORILLA"
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                error={tagError}
                errorMessage={tagError ? "Tag must be 2-6 alphanumeric characters" : undefined}
                disabled={isLoading}
                maxLength={6}
              />
              <p className="text-xs text-sub mt-1">
                This will appear as [{tag || "TAG"}] next to your clan name.
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="clan-description" className="block text-sm font-medium text-text mb-1.5">
                Description (optional)
              </label>
              <textarea
                id="clan-description"
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-sub-alt border border-sub">
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
          </div>

          <ModalFooter>
            <ModalClose asChild>
              <Button type="button" variant="ghost" disabled={isLoading}>
                Cancel
              </Button>
            </ModalClose>
            <Button
              type="submit"
              variant="active"
              disabled={!isValid || isLoading}
              loading={isLoading}
            >
              {isLoading ? "Creating..." : "Create Clan"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default CreateClanModal;
