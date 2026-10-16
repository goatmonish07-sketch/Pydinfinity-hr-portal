import { Suspense } from "react";
import { PersonPage } from "./person";

export default function Page() {
  return (
    <Suspense>
      <PersonPage />
    </Suspense>
  );
}
