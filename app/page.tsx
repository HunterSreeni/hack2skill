import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Steady</h1>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          A short, honest check-in — then a personal script written just for
          you, ready for the moment you need it most.
        </p>
        <Link
          href="/checkin"
          className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-foreground px-6 text-base font-medium text-background transition-colors hover:opacity-90"
        >
          Start check-in
        </Link>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Anonymous. Nothing you write is stored anywhere but this browser.
        </p>
      </main>
    </div>
  );
}
