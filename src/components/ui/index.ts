/**
 * UI Components
 * Base components built with Radix UI primitives and class-variance-authority
 */

// Button
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

// Input
export { Input } from "./input";
export type { InputProps } from "./input";

// Card
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
export type { CardProps } from "./card";

// Badge
export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";

// Tooltip
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  TooltipArrow,
} from "./tooltip";

// Modal
export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from "./modal";

// Dropdown
export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownCheckboxItem,
  DropdownRadioItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownShortcut,
  DropdownGroup,
  DropdownPortal,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownRadioGroup,
} from "./dropdown";

// Tabs
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsListUnderlined,
  TabsTriggerUnderlined,
  TabsListPill,
  TabsTriggerPill,
} from "./tabs";

// Switch
export { Switch, SwitchWithLabel, ColoredSwitch } from "./switch";
export type {
  SwitchSize,
  SwitchProps,
  SwitchWithLabelProps,
  ColoredSwitchProps,
} from "./switch";

// Slider
export {
  Slider,
  RangeSlider,
  SliderWithLabel,
  SliderThin,
  SliderThick,
} from "./slider";
export type { SliderProps, RangeSliderProps, SliderWithLabelProps } from "./slider";

// Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectWithLabel,
  GroupedSelect,
} from "./select";
export type {
  SelectWithLabelProps,
  SelectGroupOption,
  GroupedSelectProps,
} from "./select";
