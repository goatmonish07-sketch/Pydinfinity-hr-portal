import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-gradient font-[family-name:var(--font-display)] text-7xl font-bold">404</p>
      <h1 className="mt-3 text-xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="mt-1 text-sm text-fg-2">It may have moved, or the link is wrong.</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-fg">Back to dashboard</Link>
    </div>
  );
}
