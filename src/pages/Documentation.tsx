"use client"

import type React from "react"

import { useState } from "react"
import { Book, Code, Shield, Scale, Users, HelpCircle, ChevronDown } from "lucide-react"

export default function Documentation() {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    bounties: false,
    matching: false,
    funding: false,
    communication: false,
    compliance: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-700 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-teal-100">Everything you need to know about using HakiChain</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Bar */}
        <div className="mb-12">
          <input
            type="text"
            placeholder="Search documentation..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Quick Links Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <DocCard
            icon={<Book className="w-8 h-8 text-teal-600" />}
            title="Getting Started"
            items={["Introduction to HakiChain", "Quick Start Guide", "Platform Overview", "Whitepaper"]}
          />

          <DocCard
            icon={<Users className="w-8 h-8 text-blue-600" />}
            title="User Guides"
            items={["For NGOs", "For Lawyers", "For Donors"]}
          />

          <DocCard
            icon={<Code className="w-8 h-8 text-purple-600" />}
            title="Technical Documentation"
            items={["Smart Contracts", "API Reference", "Blockchain Integration"]}
          />

          <DocCard
            icon={<Scale className="w-8 h-8 text-green-600" />}
            title="Platform Features"
            items={["Legal Bounties", "Milestone System", "Lawyer Matching"]}
          />

          <DocCard
            icon={<Shield className="w-8 h-8 text-red-600" />}
            title="Legal & Compliance"
            items={[
              "Terms of Service",
              "Privacy Policy",
              "Data Protection Policy",
              "KYC/AML Policy",
              "Consumer Protection Policy",
            ]}
          />

          <DocCard
            icon={<HelpCircle className="w-8 h-8 text-yellow-600" />}
            title="Support"
            items={["FAQ", "Contact Support", "Community Forum"]}
          />
        </div>

        {/* Expandable Sections */}
        <div className="space-y-6">
          {/* Legal Bounties Section */}
          <CollapsibleSection
            title="Legal Bounties - Complete Guide"
            isExpanded={expandedSections.bounties}
            onToggle={() => toggleSection("bounties")}
            icon={<Scale className="w-6 h-6" />}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">What are Legal Bounties?</h3>
                <p className="text-gray-700">
                  Legal bounties are crowdfunded legal cases where donors contribute funds to support specific legal
                  actions, and lawyers compete to take on those cases. The system ensures transparency, accountability,
                  and fair compensation for all parties involved.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Key Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FeatureBox
                    title="Transparent Funding"
                    items={["No minimum contribution", "Anonymous options available", "Tax-deductible receipts"]}
                  />
                  <FeatureBox
                    title="Milestone-Based Payments"
                    items={["Competitive lawyer selection", "Milestone-based payments", "Escrow protection"]}
                  />
                  <FeatureBox
                    title="Benefits for Legal Access"
                    items={[
                      "Access to quality legal representation",
                      "Transparent cost structure",
                      "Community-driven justice",
                    ]}
                  />
                  <FeatureBox
                    title="Benefits for Organizations"
                    items={["Larger contribution amounts", "Strategic partnerships", "Impact reporting"]}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Bounty Lifecycle</h3>
                <div className="space-y-3">
                  <LifecycleStep
                    number="1"
                    title="Creation"
                    description="NGO or individual creates a bounty with funding goal. Timeline: 1-2 days. Role: NGO/Individual"
                  />
                  <LifecycleStep
                    number="2"
                    title="Funding"
                    description="Donors contribute funds to reach funding goal. Timeline: 7-30 days. Role: Donors"
                  />
                  <LifecycleStep
                    number="3"
                    title="Selection"
                    description="Lawyers apply and the best candidate is chosen. Timeline: 3-7 days. Role: Lawyers"
                  />
                  <LifecycleStep
                    number="4"
                    title="Resolution"
                    description="Case proceeds with milestone-based progress updates. Timeline: Variable. Role: Lawyer + Client"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Lawyer Matching Section */}
          <CollapsibleSection
            title="Lawyer Matching - AI-Powered System"
            isExpanded={expandedSections.matching}
            onToggle={() => toggleSection("matching")}
            icon={<Users className="w-6 h-6" />}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">How Lawyer Matching Works</h3>
                <p className="text-gray-700 mb-4">
                  Our advanced AI matching algorithm analyzes multiple factors including practice area expertise,
                  geographic compatibility, experience level, availability, reputation, and fee structure to find the
                  perfect lawyer-case fit.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Matching Algorithm Factors</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FactorBox
                    title="Primary Factors (Weight: 60%)"
                    items={["Practice Area Match", "Geographic Compatibility", "Experience Level"]}
                  />
                  <FactorBox
                    title="Secondary Factors (Weight: 40%)"
                    items={["Reputation Score", "Availability", "Fee Compatibility"]}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Lawyer Profile Components</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="space-y-3">
                    <li>
                      <strong>Professional Credentials:</strong> Law degree, bar admission, practice areas, years of
                      experience
                    </li>
                    <li>
                      <strong>Performance Metrics:</strong> Case success rate, client satisfaction, average case
                      duration
                    </li>
                    <li>
                      <strong>Personal Information:</strong> Languages spoken, communication preferences, availability,
                      personal approach
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Funding Mechanisms Section */}
          <CollapsibleSection
            title="Funding Mechanisms & Lawyer Selection"
            isExpanded={expandedSections.funding}
            onToggle={() => toggleSection("funding")}
            icon={<Scale className="w-6 h-6" />}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">How Bounties Get Funded</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FundingTypeBox
                    title="Individual Donations"
                    items={["No minimum contribution", "Anonymous options", "Tax-deductible receipts"]}
                  />
                  <FundingTypeBox
                    title="NGO Funding"
                    items={["Larger amounts", "Strategic partnerships", "Impact reporting"]}
                  />
                  <FundingTypeBox
                    title="Corporate Sponsorship"
                    items={["CSR benefits", "Brand visibility", "Legal expertise access"]}
                  />
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3 text-teal-900">Milestone System</h3>
                <p className="text-teal-800 mb-4">
                  Payments are released based on predefined milestones to ensure accountability and progress tracking:
                </p>
                <ul className="space-y-2 text-teal-800">
                  <li>
                    • <strong>Initial Retainer (20%):</strong> Released upon lawyer selection
                  </li>
                  <li>
                    • <strong>Milestone Payments:</strong> Released as work is completed and verified
                  </li>
                  <li>
                    • <strong>Final Payment (Remaining):</strong> Released upon case completion and verification
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3 text-blue-900">Escrow Protection</h3>
                <p className="text-blue-800">
                  All funds are held in smart contract escrow until milestones are verified and approved, ensuring
                  protection for both lawyers and clients.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Communication Section */}
          <CollapsibleSection
            title="Communication & Coordination"
            isExpanded={expandedSections.communication}
            onToggle={() => toggleSection("communication")}
            icon={<Users className="w-6 h-6" />}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Best Practices</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <PracticeBox
                    title="For Lawyers"
                    items={[
                      "Profile Optimization - Keep information current",
                      "Application Strategy - Tailor to specific cases",
                      "Maintain high response rates",
                      "Show commitment to client success",
                    ]}
                  />
                  <PracticeBox
                    title="For Clients"
                    items={[
                      "Case Preparation - Provide detailed information",
                      "Define timeline requirements",
                      "Set clear expectations and goals",
                      "Establish budget constraints",
                    ]}
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3 text-yellow-900">Quality Assurance Process</h3>
                <ul className="space-y-2 text-yellow-800">
                  <li>
                    • <strong>Credential Verification:</strong> Bar admission and license status checks
                  </li>
                  <li>
                    • <strong>Performance Monitoring:</strong> Case outcome tracking and client satisfaction
                  </li>
                  <li>
                    • <strong>Continuous Improvement:</strong> Regular feedback and algorithm refinement
                  </li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* Compliance Section */}
          <CollapsibleSection
            title="Legal & Compliance"
            isExpanded={expandedSections.compliance}
            onToggle={() => toggleSection("compliance")}
            icon={<Shield className="w-6 h-6" />}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Important Documents</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ComplianceLink title="Terms of Service" description="Legal terms and conditions of platform use" />
                  <ComplianceLink title="Privacy Policy" description="How we handle and protect your data" />
                  <ComplianceLink title="Data Protection Policy" description="GDPR and data protection compliance" />
                  <ComplianceLink
                    title="KYC/AML Policy"
                    description="Know Your Customer and Anti-Money Laundering procedures"
                  />
                  <ComplianceLink title="Consumer Protection" description="Consumer rights and protections" />
                  <ComplianceLink title="Platform Guidelines" description="Code of conduct and platform rules" />
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3 text-red-900">Security & Blockchain</h3>
                <ul className="space-y-2 text-red-800">
                  <li>
                    • <strong>Smart Contract Escrow:</strong> Secure and transparent fund handling
                  </li>
                  <li>
                    • <strong>Document Verification:</strong> Blockchain-verified, tamper-proof records
                  </li>
                  <li>
                    • <strong>Wallet Integration:</strong> MetaMask and WalletConnect support
                  </li>
                  <li>
                    • <strong>Immutable Records:</strong> All transactions permanently recorded on-chain
                  </li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  icon,
  children,
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="text-teal-600">{icon}</div>
          <h2 className="text-xl font-bold text-left">{title}</h2>
        </div>
        <ChevronDown className={`w-6 h-6 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded && <div className="border-t border-gray-200 px-6 py-6">{children}</div>}
    </div>
  )
}

function DocCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index}>
            <button className="text-sm text-gray-700 hover:text-teal-600 transition flex items-center gap-2">
              <span className="text-teal-400">→</span>
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FeatureBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition">
      <h4 className="font-bold mb-2 text-gray-900">{title}</h4>
      <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function FactorBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-bold mb-3 text-gray-900">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FundingTypeBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-4">
      <h4 className="font-bold mb-3 text-teal-900">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-teal-800">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PracticeBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-bold mb-3 text-blue-900">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-blue-800">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LifecycleStep({ number, title, description }: { number: string; title: string; description: string }) {
  const colors = [
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-green-100 text-green-700",
  ]
  const colorClass = colors[Number(number) - 1]

  return (
    <div className="flex gap-4 items-start">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${colorClass}`}>
        {number}
      </div>
      <div className="pt-1">
        <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}

function ComplianceLink({ title, description }: { title: string; description: string }) {
  return (
    <button className="text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-teal-300 rounded-lg p-4 transition">
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  )
}
