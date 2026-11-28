import React from "react";
import {
  BarChart3,
  Briefcase,
  Globe,
  Instagram,
  Layout,
  MapPin,
  Megaphone,
  Search,
  Share2,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Target,
  Video,
} from "lucide-react";
import type { ServiceIconName } from "@/data/services";

const ICON_MAP: Record<
  ServiceIconName,
  React.ComponentType<{ className?: string }>
> = {
  globe: Globe,
  layout: Layout,
  search: Search,
  "map-pin": MapPin,
  target: Target,
  "shopping-bag": ShoppingBag,
  "share-2": Share2,
  instagram: Instagram,
  video: Video,
  sparkles: Sparkles,
  briefcase: Briefcase,
  smartphone: Smartphone,
  "bar-chart-3": BarChart3,
  megaphone: Megaphone,
};

export function ServiceIcon({
  name,
  className = "h-5 w-5",
}: {
  name: ServiceIconName;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Globe;
  return <Icon className={className} />;
}
