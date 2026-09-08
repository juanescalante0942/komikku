import Library from "../components/Library";
import { Suspense } from "react";

export const metadata = {
  title: "Library",
  description:
    "Browse through thousands of manga titles with genres, authors, and more.",
};

export default function LibraryPage() {
  return (
    <Suspense>
      <Library />
    </Suspense>
  );
}
