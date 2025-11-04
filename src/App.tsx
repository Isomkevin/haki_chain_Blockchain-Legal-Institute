import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import Header from "./components/Header"
import Footer from "./components/Footer"
import HakiBot from "./components/HakiBot"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Bounties from "./pages/Bounties"
import BountyDetail from "./pages/BountyDetail"
import Dashboard from "./pages/Dashboard"
import Documentation from "./pages/Documentation"
import AdminDashboard from "./pages/AdminDashboard"
import Cases from "./pages/Cases"
import HakiLens from "./pages/HakiLens"
import HakiDraft from "./pages/HakiDraft"
import HakiReview from "./pages/HakiReview"
import HakiReminders from "./pages/HakiReminders"
import HakiDocs from "./pages/HakiDocs"
import Settings from "./pages/Settings"

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/bounties" element={<Bounties />} />
            <Route path="/bounties/:id" element={<BountyDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/haki-lens" element={<HakiLens />} />
            <Route path="/haki-draft" element={<HakiDraft />} />
            <Route path="/haki-review" element={<HakiReview />} />
            <Route path="/haki-reminders" element={<HakiReminders />} />
            <Route path="/haki-docs" element={<HakiDocs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
        <HakiBot />
      </div>
    </AuthProvider>
  )
}

export default App
