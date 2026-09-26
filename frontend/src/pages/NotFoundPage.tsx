import { Link } from "react-router";

import { EmptyState } from "../components/ui/primitives";

export function NotFoundPage() {
  return (
    <div className="pt-10">
      <EmptyState title="Page not found">
        This page doesn't exist.{" "}
        <Link to="/" className="font-semibold text-accent-text hover:underline">
          Go to the overview
        </Link>
      </EmptyState>
    </div>
  );
}
