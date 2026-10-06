import DevUI from "./pages/DevUI"

export default function App() {
  if (window.location.pathname === "/dev/ui") return <DevUI />
  return <div className="p-6">Servana</div>
}
