import { Link } from "react-router-dom"
export default function NotFound() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">404: page not found</h1>
      <Link to="/" className="text-blue-600 underline">
        Go home
      </Link>
    </div>
  )
}
