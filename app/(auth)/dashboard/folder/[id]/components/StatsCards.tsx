"use client";

import { Product } from "@/types";
import { DollarSign, Package, Star, FileImage, Video } from "lucide-react";

type StatsCardsProps = {
  myProduct: Product;
  competitors: Product[];
};

export function StatsCards({ myProduct, competitors }: StatsCardsProps) {
  const selectedCompetitors = competitors.filter((c) => c.selected);
  const avgPrice =
    selectedCompetitors.length > 0
      ? (
          selectedCompetitors.reduce((sum, c) => sum + (c.price || 0), 0) /
          selectedCompetitors.length
        ).toFixed(2)
      : "0.00";

  const avgRating =
    selectedCompetitors.length > 0
      ? (
          selectedCompetitors.reduce((sum, c) => sum + (c.rating || 0), 0) /
          selectedCompetitors.length
        ).toFixed(1)
      : "0.0";

  const avgImages =
    selectedCompetitors.length > 0
      ? (
          selectedCompetitors.reduce(
            (sum, c) => sum + (c.photos?.length || 0),
            0
          ) / selectedCompetitors.length
        ).toFixed(1)
      : "0.0";

  // ✅ Count products with video instead of sponsored
  const withVideoCount = selectedCompetitors.filter((c) => c.hasVideo).length;

  return (
    <div className="grid grid-cols-5 gap-3">
      <StatCard
        label="Your Price"
        value={`$${(myProduct.price || 0).toFixed(2)}`}
        subtitle={`vs avg $${avgPrice}`}
        icon={<DollarSign className="h-3.5 w-3.5" />}
        colorClass="emerald"
      />
      <StatCard
        label="Competitors"
        value={selectedCompetitors.length.toString()}
        subtitle="selected for analysis"
        icon={<Package className="h-3.5 w-3.5" />}
        colorClass="blue"
      />
      <StatCard
        label="Avg Rating"
        value={avgRating}
        subtitle="competitor average"
        icon={<Star className="h-3.5 w-3.5" />}
        colorClass="amber"
      />
      <StatCard
        label="Images"
        value={(myProduct.photos?.length || 0).toString()}
        subtitle={`vs avg ${avgImages} images`}
        icon={<FileImage className="h-3.5 w-3.5" />}
        colorClass="purple"
      />
      <StatCard
        label="With Video"
        value={withVideoCount.toString()}
        subtitle="have product videos"
        icon={<Video className="h-3.5 w-3.5" />}
        colorClass="rose"
      />
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: "emerald" | "blue" | "amber" | "purple" | "rose";
};

function StatCard({ label, value, subtitle, icon, colorClass }: StatCardProps) {
  const colors = {
    emerald: {
      bg: "from-emerald-50 to-emerald-100/50",
      border: "border-emerald-200/50",
      text: "text-emerald-700",
      icon: "text-emerald-600",
      value: "text-emerald-900",
      subtitle: "text-emerald-600",
    },
    blue: {
      bg: "from-blue-50 to-blue-100/50",
      border: "border-blue-200/50",
      text: "text-blue-700",
      icon: "text-blue-600",
      value: "text-blue-900",
      subtitle: "text-blue-600",
    },
    amber: {
      bg: "from-amber-50 to-amber-100/50",
      border: "border-amber-200/50",
      text: "text-amber-700",
      icon: "text-amber-600",
      value: "text-amber-900",
      subtitle: "text-amber-600",
    },
    purple: {
      bg: "from-purple-50 to-purple-100/50",
      border: "border-purple-200/50",
      text: "text-purple-700",
      icon: "text-purple-600",
      value: "text-purple-900",
      subtitle: "text-purple-600",
    },
    rose: {
      bg: "from-rose-50 to-rose-100/50",
      border: "border-rose-200/50",
      text: "text-rose-700",
      icon: "text-rose-600",
      value: "text-rose-900",
      subtitle: "text-rose-600",
    },
  };

  const c = colors[colorClass];

  return (
    <div
      className={`bg-gradient-to-br ${c.bg} rounded-lg p-3 border ${c.border}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${c.text}`}>{label}</span>
        <span className={c.icon}>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${c.value}`}>{value}</p>
      <p className={`text-xs ${c.subtitle} mt-0.5`}>
        {subtitle.includes("$") ? (
          <>
            vs avg <b>{subtitle.split("$")[1]}</b>
          </>
        ) : (
          subtitle
        )}
      </p>
    </div>
  );
}
