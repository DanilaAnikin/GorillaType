'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { ThemeSelector } from './theme-selector';
import { FontSelector } from './font-selector';
import { CaretSettings } from './caret-settings';
import { SoundSettings } from './sound-settings';
import { BehaviorSettings } from './behavior-settings';
import { Palette, Settings2, Volume2, Globe } from 'lucide-react';

type SettingsTab = 'appearance' | 'behavior' | 'sound' | 'language';

interface SettingsTabsProps {
  /** Initial active tab */
  defaultTab?: SettingsTab;
  /** Callback when tab changes */
  onTabChange?: (tab: SettingsTab) => void;
  /** Additional class names */
  className?: string;
}

const tabs = [
  {
    value: 'appearance' as const,
    label: 'Appearance',
    icon: Palette,
    description: 'Customize theme, font, and caret',
  },
  {
    value: 'behavior' as const,
    label: 'Behavior',
    icon: Settings2,
    description: 'Typing behavior and test options',
  },
  {
    value: 'sound' as const,
    label: 'Sound',
    icon: Volume2,
    description: 'Audio feedback settings',
  },
  {
    value: 'language' as const,
    label: 'Language',
    icon: Globe,
    description: 'Language and word list options',
  },
];

export function SettingsTabs({
  defaultTab = 'appearance',
  onTabChange,
  className = '',
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  const handleTabChange = (value: string) => {
    const tab = value as SettingsTab;
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className={`w-full ${className}`.trim()}>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Tab Navigation */}
        <TabsList className="w-full justify-start gap-1 bg-transparent p-0 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="
                  flex items-center gap-2 px-4 py-2
                  rounded-lg text-sub
                  transition-all duration-200
                  data-[state=active]:bg-sub-alt data-[state=active]:text-main
                  hover:text-text hover:bg-sub-alt/50
                "
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-text mb-4">Theme</h3>
            <ThemeSelector />
          </section>

          <section>
            <h3 className="text-lg font-semibold text-text mb-4">Font</h3>
            <FontSelector />
          </section>

          <section>
            <h3 className="text-lg font-semibold text-text mb-4">Caret</h3>
            <CaretSettings />
          </section>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-text mb-4">
              Typing Behavior
            </h3>
            <BehaviorSettings />
          </section>
        </TabsContent>

        {/* Sound Tab */}
        <TabsContent value="sound" className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-text mb-4">
              Sound Settings
            </h3>
            <SoundSettings />
          </section>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language" className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-text mb-4">
              Language Settings
            </h3>
            <LanguageSettings />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Language settings section
 * Handles language and word list configuration
 */
function LanguageSettings() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-sub-alt/50 border border-sub/20">
        <p className="text-sub text-sm">
          Language settings allow you to choose different languages and word
          lists for your typing tests. More language options coming soon.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-sub-alt/30">
          <div>
            <h4 className="text-text font-medium">Primary Language</h4>
            <p className="text-sub text-sm">
              The main language for word generation
            </p>
          </div>
          <span className="px-3 py-1 rounded-md bg-main/20 text-main text-sm">
            English
          </span>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-sub-alt/30">
          <div>
            <h4 className="text-text font-medium">Word List</h4>
            <p className="text-sub text-sm">
              The word collection used for tests
            </p>
          </div>
          <span className="px-3 py-1 rounded-md bg-sub-alt text-text text-sm">
            English 1K
          </span>
        </div>
      </div>
    </div>
  );
}

export default SettingsTabs;
