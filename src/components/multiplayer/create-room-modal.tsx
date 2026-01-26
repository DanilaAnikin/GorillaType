"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Clock, Hash, Type, Globe, AlertCircle } from "lucide-react";

/* ============================================
   CREATE ROOM MODAL COMPONENT
   Modal for creating a new multiplayer room
   ============================================ */

export type RoomMode = "time" | "words" | "quote";

export interface RoomConfig {
  /** Test mode */
  mode: RoomMode;
  /** Time limit in seconds (for time mode) */
  timeLimit: number;
  /** Word count (for words mode) */
  wordCount: number;
  /** Language for word generation */
  language: string;
  /** Include punctuation */
  punctuation: boolean;
  /** Include numbers */
  numbers: boolean;
  /** Maximum players allowed */
  maxPlayers: number;
}

export interface CreateRoomModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback to close the modal */
  onOpenChange: (open: boolean) => void;
  /** Callback when room is created */
  onCreate: (config: RoomConfig) => Promise<void>;
  /** Error message to display */
  error?: string | null;
  /** Whether creation is loading */
  isLoading?: boolean;
  /** Available languages */
  languages?: Array<{ value: string; label: string }>;
}

const DEFAULT_CONFIG: RoomConfig = {
  mode: "time",
  timeLimit: 30,
  wordCount: 50,
  language: "english",
  punctuation: false,
  numbers: false,
  maxPlayers: 5,
};

const TIME_OPTIONS = [
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "60 seconds" },
  { value: "120", label: "120 seconds" },
];

const WORD_OPTIONS = [
  { value: "10", label: "10 words" },
  { value: "25", label: "25 words" },
  { value: "50", label: "50 words" },
  { value: "100", label: "100 words" },
];

const DEFAULT_LANGUAGES = [
  { value: "english", label: "English" },
  { value: "english_1k", label: "English 1k" },
  { value: "english_5k", label: "English 5k" },
  { value: "english_10k", label: "English 10k" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "portuguese", label: "Portuguese" },
];

const PLAYER_OPTIONS = [
  { value: "2", label: "2 players" },
  { value: "3", label: "3 players" },
  { value: "4", label: "4 players" },
  { value: "5", label: "5 players" },
  { value: "8", label: "8 players" },
  { value: "10", label: "10 players" },
];

export const CreateRoomModal = React.memo(function CreateRoomModal({
  open,
  onOpenChange,
  onCreate,
  error,
  isLoading = false,
  languages = DEFAULT_LANGUAGES,
}: CreateRoomModalProps) {
  const [config, setConfig] = React.useState<RoomConfig>(DEFAULT_CONFIG);

  // Reset config when modal closes
  React.useEffect(() => {
    if (!open) {
      setConfig(DEFAULT_CONFIG);
    }
  }, [open]);

  // Handle config changes
  const updateConfig = React.useCallback(
    <K extends keyof RoomConfig>(key: K, value: RoomConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Handle form submission
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await onCreate(config);
      } catch (err) {
        // Error will be handled by parent component via error prop
      }
    },
    [config, onCreate]
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Room
          </ModalTitle>
          <ModalDescription>
            Configure your multiplayer race settings.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text flex items-center gap-2">
                <Type className="w-4 h-4" />
                Mode
              </label>
              <div className="flex gap-2">
                {(["time", "words", "quote"] as RoomMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={config.mode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateConfig("mode", mode)}
                    className="flex-1 capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time/Words Configuration */}
            {config.mode === "time" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-text flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Limit
                </label>
                <Select
                  value={config.timeLimit.toString()}
                  onValueChange={(v) => updateConfig("timeLimit", parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.mode === "words" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-text flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Word Count
                </label>
                <Select
                  value={config.wordCount.toString()}
                  onValueChange={(v) => updateConfig("wordCount", parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language
              </label>
              <Select
                value={config.language}
                onValueChange={(v) => updateConfig("language", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Players */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">
                Max Players
              </label>
              <Select
                value={config.maxPlayers.toString()}
                onValueChange={(v) => updateConfig("maxPlayers", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAYER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">Punctuation</p>
                  <p className="text-xs text-sub">
                    Include punctuation marks in words
                  </p>
                </div>
                <Switch
                  checked={config.punctuation}
                  onCheckedChange={(v) => updateConfig("punctuation", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">Numbers</p>
                  <p className="text-xs text-sub">
                    Include numbers in the word list
                  </p>
                </div>
                <Switch
                  checked={config.numbers}
                  onCheckedChange={(v) => updateConfig("numbers", v)}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
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
            <Button type="submit" loading={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
});

/* ============================================
   CREATE ROOM TRIGGER BUTTON
   Button to open the create room modal
   ============================================ */

export interface CreateRoomTriggerProps {
  /** Callback to open the modal */
  onClick: () => void;
  /** Additional class names */
  className?: string;
}

export const CreateRoomTrigger = React.memo(function CreateRoomTrigger({
  onClick,
  className,
}: CreateRoomTriggerProps) {
  return (
    <Button onClick={onClick} className={className}>
      <Plus className="w-4 h-4 mr-2" />
      Create Room
    </Button>
  );
});

export default CreateRoomModal;
