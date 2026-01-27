"use client";

import { useState } from "react";
import { useConfigStore } from "@/store/config-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Switch, SwitchWithLabel } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Slider, SliderWithLabel } from "@/components/ui/slider";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { TypographySettings } from "@/components/settings/typography-settings";
import {
  Palette,
  Settings2,
  Volume2,
  Languages,
  RotateCcw,
  Save,
  Monitor,
  Type,
  MousePointer2,
  Eye,
  Keyboard,
  Zap,
} from "lucide-react";

type SettingsTab = "appearance" | "behavior" | "sound" | "language";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    visual,
    caret,
    sound,
    behavior,
    test,
    setFontFamily,
    setFontSize,
    setCaretStyle,
    setSmoothCaret,
    setVolume,
    setClickSound,
    setErrorSound,
    toggleSoundOnClick,
    toggleSoundOnError,
    toggleSmoothLineScroll,
    toggleShowAllLines,
    toggleShowLiveWpm,
    toggleShowLiveAccuracy,
    toggleShowLiveBurst,
    toggleShowTimer,
    toggleShowKeyTips,
    togglePunctuation,
    toggleNumbers,
    setStopOnError,
    setConfidenceMode,
    toggleHideExtraLetters,
    toggleLazyMode,
    toggleBlindMode,
    setQuickRestart,
    toggleFreedomMode,
    toggleStrictSpace,
    setLanguage,
    setDifficulty,
    resetToDefaults,
  } = useConfigStore();

  const handleSave = async () => {
    setIsSaving(true);
    // Settings are persisted automatically via zustand-persist
    // This is mainly for UX feedback
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSuccess("Settings saved successfully");
    setIsSaving(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      resetToDefaults();
      setSuccess("Settings reset to defaults");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Settings</h1>
          <p className="text-sub mt-1">
            Customize your typing experience
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg bg-main/10 border border-main/20 p-4 text-main">
            {success}
          </div>
        )}

        {/* Settings Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SettingsTab)}
        >
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="behavior" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Behavior
            </TabsTrigger>
            <TabsTrigger value="sound" className="gap-2">
              <Volume2 className="h-4 w-4" />
              Sound
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2">
              <Languages className="h-4 w-4" />
              Language
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Theme
                </CardTitle>
                <CardDescription>
                  Choose your preferred color theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSelector />
              </CardContent>
            </Card>

            {/* Font Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Font
                </CardTitle>
                <CardDescription>
                  Customize the typing font
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Font Family</label>
                  <Select
                    value={visual.fontFamily}
                    onValueChange={(v) => setFontFamily(v as typeof visual.fontFamily)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roboto_mono">Roboto Mono</SelectItem>
                      <SelectItem value="jetbrains_mono">JetBrains Mono</SelectItem>
                      <SelectItem value="fira_code">Fira Code</SelectItem>
                      <SelectItem value="source_code_pro">Source Code Pro</SelectItem>
                      <SelectItem value="ibm_plex_mono">IBM Plex Mono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Font Size</label>
                  <Select
                    value={visual.fontSize}
                    onValueChange={(v) => setFontSize(v as typeof visual.fontSize)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra_large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Typography Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Typography
                </CardTitle>
                <CardDescription>
                  Adjust line height and letter spacing for better readability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TypographySettings />
              </CardContent>
            </Card>

            {/* Caret Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer2 className="h-5 w-5" />
                  Caret
                </CardTitle>
                <CardDescription>
                  Customize the typing cursor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Caret Style</label>
                  <div className="flex gap-2">
                    {[
                      { value: "line", label: "|" },
                      { value: "block", label: "[]" },
                      { value: "underline", label: "_" },
                      { value: "outline", label: "[ ]" },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setCaretStyle(style.value as typeof caret.style)}
                        className={`
                          px-4 py-2 rounded-lg border-2 font-mono text-lg transition-all
                          ${caret.style === style.value
                            ? "border-main bg-main/10 text-main"
                            : "border-sub/30 text-sub hover:border-sub"
                          }
                        `}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Smooth Caret</label>
                  <Select
                    value={caret.smoothCaret}
                    onValueChange={(v) => setSmoothCaret(v as typeof caret.smoothCaret)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Display Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Display
                </CardTitle>
                <CardDescription>
                  Configure what information to show during typing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SwitchWithLabel
                  label="Show Live WPM"
                  description="Display words per minute while typing"
                  checked={visual.showLiveWpm}
                  onCheckedChange={toggleShowLiveWpm}
                />
                <SwitchWithLabel
                  label="Show Live Accuracy"
                  description="Display accuracy percentage while typing"
                  checked={visual.showLiveAccuracy}
                  onCheckedChange={toggleShowLiveAccuracy}
                />
                <SwitchWithLabel
                  label="Show Live Burst"
                  description="Display burst WPM (speed of last word typed)"
                  checked={visual.showLiveBurst}
                  onCheckedChange={toggleShowLiveBurst}
                />
                <SwitchWithLabel
                  label="Show Timer"
                  description="Display countdown or elapsed time"
                  checked={visual.showTimer}
                  onCheckedChange={toggleShowTimer}
                />
                <SwitchWithLabel
                  label="Show Key Tips"
                  description="Display keyboard shortcuts and tips"
                  checked={visual.showKeyTips}
                  onCheckedChange={toggleShowKeyTips}
                />
                <SwitchWithLabel
                  label="Smooth Line Scroll"
                  description="Smooth animation when scrolling to next line"
                  checked={visual.smoothLineScroll}
                  onCheckedChange={toggleSmoothLineScroll}
                />
                <SwitchWithLabel
                  label="Show All Lines"
                  description="Display all words at once instead of line by line"
                  checked={visual.showAllLines}
                  onCheckedChange={toggleShowAllLines}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            {/* Input Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  Input
                </CardTitle>
                <CardDescription>
                  Configure typing behavior and input handling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SwitchWithLabel
                  label="Freedom Mode"
                  description="Allow backspacing through words"
                  checked={behavior.freedomMode}
                  onCheckedChange={toggleFreedomMode}
                />
                <SwitchWithLabel
                  label="Strict Space"
                  description="Don't insert extra spaces between words"
                  checked={behavior.strictSpace}
                  onCheckedChange={toggleStrictSpace}
                />
                <SwitchWithLabel
                  label="Hide Extra Letters"
                  description="Don't show letters typed beyond the word length"
                  checked={behavior.hideExtraLetters}
                  onCheckedChange={toggleHideExtraLetters}
                />
                <SwitchWithLabel
                  label="Lazy Mode"
                  description="Don't require shift for punctuation"
                  checked={behavior.lazyMode}
                  onCheckedChange={toggleLazyMode}
                />
              </CardContent>
            </Card>

            {/* Error Handling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Error Handling
                </CardTitle>
                <CardDescription>
                  Configure how errors are handled during typing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Stop On Error</label>
                  <Select
                    value={behavior.stopOnError}
                    onValueChange={(v) => setStopOnError(v as typeof behavior.stopOnError)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="word">Word</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-sub">
                    Stop typing when an error is made
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Confidence Mode</label>
                  <Select
                    value={behavior.confidenceMode}
                    onValueChange={(v) => setConfidenceMode(v as typeof behavior.confidenceMode)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-sub">
                    Limit backspace usage to improve confidence
                  </p>
                </div>

                <SwitchWithLabel
                  label="Blind Mode"
                  description="Hide your input to practice touch typing"
                  checked={behavior.blindMode}
                  onCheckedChange={toggleBlindMode}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Configure keyboard shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Quick Restart</label>
                  <Select
                    value={behavior.quickRestart}
                    onValueChange={(v) => setQuickRestart(v as typeof behavior.quickRestart)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="tab">Tab</SelectItem>
                      <SelectItem value="esc">Escape</SelectItem>
                      <SelectItem value="enter">Enter</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-sub">
                    Key to quickly restart the typing test
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Options */}
            <Card>
              <CardHeader>
                <CardTitle>Content Options</CardTitle>
                <CardDescription>
                  Customize what appears in the typing test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SwitchWithLabel
                  label="Include Punctuation"
                  description="Add punctuation marks to words"
                  checked={behavior.punctuation}
                  onCheckedChange={togglePunctuation}
                />
                <SwitchWithLabel
                  label="Include Numbers"
                  description="Add numbers to the word list"
                  checked={behavior.numbers}
                  onCheckedChange={toggleNumbers}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sound Tab */}
          <TabsContent value="sound" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Sound Settings
                </CardTitle>
                <CardDescription>
                  Configure sound effects for typing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Volume Slider */}
                <SliderWithLabel
                  label="Volume"
                  value={[sound.volume * 100]}
                  onValueChange={(v) => setVolume((v[0] / 100) as typeof sound.volume)}
                  min={0}
                  max={100}
                  step={25}
                  formatValue={(v) => `${v}%`}
                />

                {/* Click Sound */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Click Sound</label>
                  <Select
                    value={sound.clickSound}
                    onValueChange={(v) => setClickSound(v as typeof sound.clickSound)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="click">Click</SelectItem>
                      <SelectItem value="beep">Beep</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="nk_cream">NK Cream</SelectItem>
                      <SelectItem value="typewriter">Typewriter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Error Sound */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Error Sound</label>
                  <Select
                    value={sound.errorSound}
                    onValueChange={(v) => setErrorSound(v as typeof sound.errorSound)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="beep">Beep</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sound Toggles */}
                <div className="border-t border-border pt-4 space-y-4">
                  <SwitchWithLabel
                    label="Play Sound on Click"
                    description="Play sound when typing keys"
                    checked={sound.soundOnClick}
                    onCheckedChange={toggleSoundOnClick}
                  />
                  <SwitchWithLabel
                    label="Play Sound on Error"
                    description="Play sound when making a mistake"
                    checked={sound.soundOnError}
                    onCheckedChange={toggleSoundOnError}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Language Settings
                </CardTitle>
                <CardDescription>
                  Configure the language and word list for typing tests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Language</label>
                  <Select
                    value={test.language}
                    onValueChange={(v) => setLanguage(v as typeof test.language)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="english_1k">English 1K</SelectItem>
                      <SelectItem value="english_5k">English 5K</SelectItem>
                      <SelectItem value="english_10k">English 10K</SelectItem>
                      <SelectItem value="code_javascript">Code - JavaScript</SelectItem>
                      <SelectItem value="code_python">Code - Python</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-sub">
                    Choose the word list for typing practice
                  </p>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Difficulty</label>
                  <Select
                    value={test.difficulty}
                    onValueChange={(v) => setDifficulty(v as typeof test.difficulty)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-sub">
                    Higher difficulty uses more complex and longer words
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-8 border-t border-border mt-8">
          <Button
            onClick={handleReset}
            variant="ghost"
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            loading={isSaving}
            size="lg"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
