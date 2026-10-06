import { Link, Outlet } from "react-router-dom"
export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b p-4">
        <Link to="/" className="font-bold">
          Servana
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
