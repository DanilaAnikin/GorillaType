"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Users, AlertCircle } from "lucide-react";

/* ============================================
   JOIN ROOM MODAL COMPONENT
   Modal for joining a multiplayer room via code
   ============================================ */

export interface JoinRoomModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onOpenChange: (open: boolean) => void;
  /** Callback when join is submitted */
  onJoin: (roomCode: string) => Promise<void>;
  /** Error message to display */
  error?: string | null;
  /** Whether join is loading */
  isLoading?: boolean;
}

export const JoinRoomModal = React.memo(function JoinRoomModal({
  open,
  onOpenChange,
  onJoin,
  error,
  isLoading = false,
}: JoinRoomModalProps) {
  const [roomCode, setRoomCode] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setRoomCode("");
      setLocalError(null);
    }
  }, [open]);

  // Handle input change - uppercase and limit to 6 characters
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (value.length <= 6) {
        setRoomCode(value);
        setLocalError(null);
      }
    },
    []
  );

  // Handle form submission
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate code length
      if (roomCode.length !== 6) {
        setLocalError("Room code must be 6 characters");
        return;
      }

      try {
        await onJoin(roomCode);
      } catch (err) {
        // Error will be handled by parent component via error prop
      }
    },
    [roomCode, onJoin]
  );

  // Handle paste
  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");
      const cleanedText = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, "");
      setRoomCode(cleanedText.slice(0, 6));
      setLocalError(null);
    },
    []
  );

  const displayError = error || localError;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Join Room
          </ModalTitle>
          <ModalDescription>
            Enter the 6-character room code to join a multiplayer race.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Room Code Input */}
            <div className="space-y-2">
              <label
                htmlFor="room-code"
                className="text-sm font-medium text-text"
              >
                Room Code
              </label>
              <Input
                ref={inputRef}
                id="room-code"
                type="text"
                placeholder="ABCD12"
                value={roomCode}
                onChange={handleInputChange}
                onPaste={handlePaste}
                disabled={isLoading}
                error={!!displayError}
                className={cn(
                  "text-center text-2xl font-mono tracking-[0.5em] uppercase",
                  "h-14"
                )}
                maxLength={6}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
              />

              {/* Character count indicator */}
              <div className="flex justify-between text-xs text-sub">
                <span>{roomCode.length}/6 characters</span>
                {roomCode.length === 6 && (
                  <span className="text-main transition-all duration-125">Ready to join</span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{displayError}</span>
              </div>
            )}
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={roomCode.length !== 6 || isLoading}
              loading={isLoading}
            >
              Join Room
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
});

/* ============================================
   JOIN ROOM TRIGGER BUTTON
   Button to open the join room modal
   ============================================ */

export interface JoinRoomTriggerProps {
  /** Callback to open the modal */
  onClick: () => void;
  /** Additional class names */
  className?: string;
}

export const JoinRoomTrigger = React.memo(function JoinRoomTrigger({
  onClick,
  className,
}: JoinRoomTriggerProps) {
  return (
    <Button variant="outline" onClick={onClick} className={className}>
      <Users className="w-4 h-4 mr-2" />
      Join Room
    </Button>
  );
});

export default JoinRoomModal;
