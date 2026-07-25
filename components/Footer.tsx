import { APP_VERSION } from "@/lib/version";

export function Footer() {
  return (
    <footer className="w-full px-6 py-4 text-center text-xs text-zinc-400">
      Steady v{APP_VERSION}
    </footer>
  );
}
