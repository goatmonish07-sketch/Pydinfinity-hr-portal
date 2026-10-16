import { Suspense } from "react";
import { KycLinkPage } from "./kyc";

export default function Page() {
  return (
    <Suspense>
      <KycLinkPage />
    </Suspense>
  );
}
