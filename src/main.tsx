import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App.tsx"
import "./index.css"
import { LayoutProviders } from "./components/LayoutProviders"

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <LayoutProviders>
      <App />
    </LayoutProviders>
  </BrowserRouter>
)
