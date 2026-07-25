import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-brand-soft px-6 py-16 dark:bg-background">
      <main className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-brand">Steady</h1>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          A short, honest check-in, a personal script written just for you,
          and a caregiver who&apos;s linked in when it matters most.
        </p>
        <Link
          href="/signup"
          className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-brand px-6 text-base font-medium text-white transition-colors hover:bg-brand-hover"
        >
          Get started
        </Link>
        <Link href="/login" className="text-xs text-zinc-500 underline dark:text-zinc-500">
          Already have an account? Log in
        </Link>
      </main>
    </div>
  );
}
