import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  actionLabel: string;
  actionUrl: string;
  color?: "primary" | "success" | "warning" | "accent" | "destructive";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  actionLabel,
  actionUrl,
  color = "primary",
}) => {
  // Map color names to Tailwind classes
  const colorMap = {
    primary: {
      bg: "bg-primary-100",
      text: "text-primary-600",
      link: "text-primary-600 hover:text-primary-500",
    },
    success: {
      bg: "bg-green-100",
      text: "text-green-600",
      link: "text-primary-600 hover:text-primary-500",
    },
    warning: {
      bg: "bg-amber-100",
      text: "text-amber-600",
      link: "text-primary-600 hover:text-primary-500",
    },
    accent: {
      bg: "bg-violet-100",
      text: "text-violet-600",
      link: "text-primary-600 hover:text-primary-500",
    },
    destructive: {
      bg: "bg-red-100",
      text: "text-red-600",
      link: "text-primary-600 hover:text-primary-500",
    },
  };

  const currentColor = colorMap[color];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${currentColor.bg} rounded-md p-3`}>
              <Icon className={`${currentColor.text} h-5 w-5`} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{value}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href={actionUrl} className="font-medium text-primary-600 hover:text-primary-500">
              {actionLabel}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
