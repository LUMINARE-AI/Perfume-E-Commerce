import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <main className="bg-black min-h-screen flex items-center justify-center px-6 text-white">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-serif text-yellow-400 mb-4">
          404
        </h1>
        <p className="text-lg mb-2">
          Page Not Found
        </p>
        <p className="text-gray-400 mb-6">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </main>
  );
}
