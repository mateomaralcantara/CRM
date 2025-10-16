export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="container" style={{maxInlineSize:420, marginBlockStart:64}}>
      <div className="card" style={{padding:20}}><p>Cargando…</p></div>
    </div>}>
      <SignInClient />
    </Suspense>
  );
}
