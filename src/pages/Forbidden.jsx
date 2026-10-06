import { Link } from "react-router-dom"

export default function Forbidden() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">403: you do not have access to this page</h1>
      <Link to="/" className="text-blue-600 underline">
        Go home
      </Link>
    </div>
  )
}
