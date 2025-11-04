"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Briefcase,
  Search,
  Wand2,
  Eye,
  Clock,
  FileText,
  Settings,
  HelpCircle,
} from "lucide-react"

interface LawyerSidebarProps {
  onTourStart?: () => void
}

export default function LawyerSidebar({ onTourStart }: LawyerSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const location = useLocation()

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutGrid, href: "/dashboard" },
    { id: "cases", label: "Cases", icon: Briefcase, href: "/cases" },
    { id: "haki-lens", label: "HakiLens", icon: Search, href: "/haki-lens" },
    { id: "haki-draft", label: "HakiDraft", icon: Wand2, href: "/haki-draft" },
    { id: "haki-review", label: "HakiReview", icon: Eye, href: "/haki-review" },
    { id: "haki-reminders", label: "HakiReminders", icon: Clock, href: "/haki-reminders" },
    { id: "documents", label: "Documents", icon: FileText, href: "/haki-docs" },
  ]

  const isActive = (href: string) => {
    return location.pathname === href
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
        isOpen ? "w-[280px]" : "w-[64px]"
      }`}
      style={{ overflowY: "auto" }}
    >
      <div className="flex flex-col h-full">
        {/* Logo & Collapse Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          {isOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  HC
                </div>
                <span className="font-bold text-gray-900 text-lg">HakiChain</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="w-full p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center justify-center"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Menu */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              data-tour={item.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                isActive(item.href)
                  ? "bg-teal-50 text-teal-700 font-medium border-l-4 border-teal-600"
                  : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
              }`}
              title={!isOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Menu */}
        <div className="border-t border-gray-200 p-3 space-y-1">
          <button
            onClick={onTourStart}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition text-left"
            title={!isOpen ? "Take Tour" : undefined}
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm">Take Tour</span>}
          </button>
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            title={!isOpen ? "Settings" : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm">Settings</span>}
          </Link>
        </div>
      </div>
    </aside>
  )
}
