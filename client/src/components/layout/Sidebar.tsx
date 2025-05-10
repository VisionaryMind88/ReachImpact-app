import React from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserCircle,
  BookOpen,
  Phone,
  MessageSquare,
  Calendar,
  BarChart,
  Settings,
  Coins
} from "lucide-react";

interface SidebarProps {
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navigationItems = [
    {
      name: t("common.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      current: location === "/dashboard",
    },
    {
      name: t("common.profile"),
      href: "/profile",
      icon: UserCircle,
      current: location === "/profile",
    },
    {
      name: t("common.contacts"),
      href: "/contacts",
      icon: BookOpen,
      current: location === "/contacts",
    },
    {
      name: t("common.calls"),
      href: "/calls",
      icon: Phone,
      current: location === "/calls",
    },
    {
      name: t("common.messages"),
      href: "/messages",
      icon: MessageSquare,
      current: location === "/messages",
    },
    {
      name: t("common.calendar"),
      href: "/calendar",
      icon: Calendar,
      current: location === "/calendar",
    },
    {
      name: t("common.analytics"),
      href: "/analytics",
      icon: BarChart,
      current: location === "/analytics",
    },
    {
      name: t("common.settings"),
      href: "/settings",
      icon: Settings,
      current: location === "/settings",
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
          <div className="h-8 w-8 bg-primary-500 rounded-md flex items-center justify-center text-white font-bold">
            RI
          </div>
          <span className="ml-2 text-xl font-semibold text-gray-900">ReachImpact</span>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 px-2 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  item.current
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                )}
              >
                <item.icon
                  className={cn(
                    item.current
                      ? "text-primary-500"
                      : "text-gray-400 group-hover:text-gray-500",
                    "mr-3 flex-shrink-0 h-5 w-5"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="px-3 mt-6">
            <div className="p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Coins className="text-primary-500 h-5 w-5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-primary-800">
                    {t("common.aiCredits")}
                  </h3>
                  <div className="mt-1 text-sm text-primary-700">
                    <span className="font-medium">{user.aiCredits}</span> {t("common.minutes")} {t("common.remaining")}
                  </div>
                  <div className="mt-2">
                    <Link
                      href="/billing"
                      className="text-xs font-medium text-primary-700 hover:text-primary-600"
                    >
                      {t("common.buyMore")} →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div>
                {user.profilePicture ? (
                  <img
                    className="h-9 w-9 rounded-full"
                    src={user.profilePicture}
                    alt={`${user.fullName} profile`}
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {user.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user.fullName}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
