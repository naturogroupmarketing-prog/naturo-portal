"use client";

import { cn } from "@/lib/utils";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  House,
  Package,
  Drop,
  Users,
  ClipboardText,
  Gear,
  MapPin,
  Plus,
  Warning,
  MagnifyingGlass,
  X,
  Check,
  List,
  QrCode,
  DownloadSimple,
  ChartBar,
  Lock,
  User,
  Star,
  CaretDown,
  CaretUp,
  SignOut,
  ArrowRight,
  ArrowLeft,
  Cube as Box,
  Truck,
  FileText,
  Shield,
  Clock,
  PencilSimple,
  UploadSimple,
  CheckCircle,
  Table,
  Question,
  Envelope,
  ChatCircle,
  Bell,
  Tray,
  Trophy,
  Trash,
  Copy,
  Sun,
  Moon,
  Info,
  GitBranch,
  Wrench,
  ArrowsClockwise,
  Calendar,
  SquaresFour,
  Rows,
  ArrowUUpLeft,
  Funnel,
  Eye,
  EyeSlash,
  ChartLine,
  ChartPie,
  FloppyDisk,
  PaperPlaneTilt,
  Phone,
  Globe,
  CreditCard,
  Barcode,
  Camera,
  Image,
  Video,
  File,
  Folder,
  FolderOpen,
  Tag,
  Hash,
  At,
  Link,
  ShareNetwork,
  Heart,
  ThumbsUp,
  ChatDots,
  Smiley,
  Flag,
  Bookmark,
  Archive,
  Paperclip,
  Scissors,
  FlowArrow,
  NumberCircleOne,
  Sliders,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  BellSlash,
  BellRinging,
  Power,
  WifiHigh,
  Bluetooth,
  BatteryFull,
  Cpu,
  HardDrive,
  Monitor,
  Printer,
  Keyboard,
  Mouse,
  Headphones,
  Microphone,
  SpeakerHigh,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  MusicNotes,
  MapTrifold,
  NavigationArrow,
  Compass,
  Binoculars,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Crosshair,
  Target,
  Lightning,
  Fire,
  Snowflake,
  Wind,
  Cloud,
  Sun as SunIcon,
  Moon as MoonIcon,
  Subtract,
} from "@phosphor-icons/react";

export type IconName =
  | "dashboard" | "package" | "droplet" | "users" | "clipboard"
  | "settings" | "map-pin" | "plus" | "alert-triangle" | "search"
  | "x" | "check" | "menu" | "qr-code" | "download"
  | "bar-chart" | "lock" | "user" | "star" | "chevron-down" | "chevron-up"
  | "log-out" | "arrow-right" | "arrow-left" | "box" | "truck" | "file-text"
  | "shield" | "clock" | "edit" | "upload" | "check-circle" | "file-spreadsheet"
  | "help-circle" | "mail" | "message-circle" | "bell" | "inbox"
  | "award" | "trash-2" | "copy" | "sun" | "moon" | "info" | "git-branch"
  | "home" | "wrench"
  | "refresh-cw" | "calendar"
  | "grid";

// Map icon names → Phosphor components
const iconMap: Record<IconName, React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string }>> = {
  dashboard:    SquaresFour,
  package:      Package,
  droplet:      Drop,
  users:        Users,
  clipboard:    ClipboardText,
  settings:     Gear,
  "map-pin":    MapPin,
  plus:         Plus,
  "alert-triangle": Warning,
  search:       MagnifyingGlass,
  x:            X,
  check:        Check,
  menu:         List,
  "qr-code":    QrCode,
  download:     DownloadSimple,
  "bar-chart":  ChartBar,
  lock:         Lock,
  user:         User,
  star:         Star,
  "chevron-down": CaretDown,
  "chevron-up":   CaretUp,
  "log-out":    SignOut,
  "arrow-right": ArrowRight,
  "arrow-left":  ArrowLeft,
  box:          Box,
  truck:        Truck,
  "file-text":  FileText,
  shield:       Shield,
  clock:        Clock,
  edit:         PencilSimple,
  upload:       UploadSimple,
  "check-circle": CheckCircle,
  "file-spreadsheet": Table,
  "help-circle": Question,
  mail:         Envelope,
  "message-circle": ChatCircle,
  bell:         Bell,
  inbox:        Tray,
  award:        Trophy,
  "trash-2":    Trash,
  copy:         Copy,
  sun:          Sun,
  moon:         Moon,
  info:         Info,
  "git-branch": GitBranch,
  home:         House,
  wrench:       Wrench,
  "refresh-cw": ArrowsClockwise,
  calendar:     Calendar,
  grid:         SquaresFour,
};

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  /** Use filled variant */
  filled?: boolean;
}

export function Icon({ name, className, size = 20, filled = false }: IconProps) {
  const PhosphorComponent = iconMap[name];
  if (!PhosphorComponent) return null;

  return (
    <PhosphorComponent
      size={size}
      weight={filled ? "fill" : "regular"}
      className={cn("flex-shrink-0", className)}
    />
  );
}
