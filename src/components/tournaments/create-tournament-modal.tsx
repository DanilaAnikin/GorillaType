'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (tournament: { id: string }) => void;
}

/**
 * CreateTournamentModal
 * Modal form for creating a new tournament.
 */
export function CreateTournamentModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTournamentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testMode, setTestMode] = useState<'time' | 'words'>('time');
  const [testDuration, setTestDuration] = useState('60');
  const [testWordCount, setTestWordCount] = useState('50');
  const [testLanguage, setTestLanguage] = useState('english');
  const [maxParticipants, setMaxParticipants] = useState('32');
  const [totalRounds, setTotalRounds] = useState('3');
  const [startTime, setStartTime] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setTestMode('time');
    setTestDuration('60');
    setTestWordCount('50');
    setTestLanguage('english');
    setMaxParticipants('32');
    setTotalRounds('3');
    setStartTime('');
    setIsPublic(true);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // Client-side validation
    if (!name.trim()) {
      setError('Tournament name is required');
      return;
    }

    if (!startTime) {
      setError('Start time is required');
      return;
    }

    const startDate = new Date(startTime);
    if (startDate.getTime() <= Date.now()) {
      setError('Start time must be in the future');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          test_mode: testMode,
          test_duration: testMode === 'time' ? Number(testDuration) : undefined,
          test_word_count: testMode === 'words' ? Number(testWordCount) : undefined,
          test_language: testLanguage,
          max_participants: maxParticipants ? Number(maxParticipants) : undefined,
          total_rounds: Number(totalRounds),
          start_time: startDate.toISOString(),
          is_public: isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create tournament');
      }

      const data = await response.json();
      resetForm();
      onClose();
      onCreated?.(data.tournament);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Create Tournament</ModalTitle>
          <ModalDescription>
            Set up a new typing tournament for the community
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-5 py-4">
          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">
              Tournament Name <span className="text-error">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly Speed Challenge"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              maxLength={500}
            />
          </div>

          {/* Test Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Test Mode</label>
            <Select
              value={testMode}
              onValueChange={(v) => setTestMode(v as 'time' | 'words')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="words">Words</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration / Word Count */}
          {testMode === 'time' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">
                Test Duration
              </label>
              <Select
                value={testDuration}
                onValueChange={setTestDuration}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="120">120 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">
                Word Count
              </label>
              <Select
                value={testWordCount}
                onValueChange={setTestWordCount}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 words</SelectItem>
                  <SelectItem value="25">25 words</SelectItem>
                  <SelectItem value="50">50 words</SelectItem>
                  <SelectItem value="100">100 words</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Language</label>
            <Select value={testLanguage} onValueChange={setTestLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="english_1k">English 1K</SelectItem>
                <SelectItem value="english_5k">English 5K</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Two-column row: Max Participants + Total Rounds */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">
                Max Participants
              </label>
              <Select
                value={maxParticipants}
                onValueChange={setMaxParticipants}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="16">16</SelectItem>
                  <SelectItem value="32">32</SelectItem>
                  <SelectItem value="64">64</SelectItem>
                  <SelectItem value="128">128</SelectItem>
                  <SelectItem value="256">256</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">
                Total Rounds
              </label>
              <Select value={totalRounds} onValueChange={setTotalRounds}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">
              Start Time <span className="text-error">*</span>
            </label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={(() => {
                // datetime-local interprets min/max as local time, so we must
                // format the current local time — NOT UTC via toISOString().
                const now = new Date();
                const y = now.getFullYear();
                const mo = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                const h = String(now.getHours()).padStart(2, '0');
                const mi = String(now.getMinutes()).padStart(2, '0');
                return `${y}-${mo}-${d}T${h}:${mi}`;
              })()}
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-text">
                Public Tournament
              </label>
              <p className="text-xs text-sub">
                Visible to everyone in the tournament list
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Tournament
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
