import { LuFolderOpen } from "react-icons/lu";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { Button } from "@/shared/ui/Button";
import { FocaWatona } from "./FocaWatona";
import { getGreeting } from "../home.utils";
import type { WelcomeSectionProps } from "../home.types";

/**
 * Hero of the Home page: a full-width band with a big greeting, the main
 * "Open file" action and the Foca Watona mascot on the right.
 */
export function WelcomeSection({ onOpen, isOpening, error, openShortcut }: WelcomeSectionProps) {
  return (
    <section className="border-b border-border bg-canvas">
      {/* Two columns from md up (text | mascot); on narrow windows the mascot is hidden. */}
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-10 py-20 md:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Cloudy PDF</p>
            <h1 className="text-5xl leading-tight font-semibold tracking-tight">{getGreeting()}.</h1>
            <p className="max-w-md text-base text-muted">
              Your documents, clean and simple. Open a PDF to start reading. Each one opens in its
              own tab.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button size="lg" icon={LuFolderOpen} onClick={onOpen} disabled={isOpening}>
              {isOpening ? "Opening…" : "Open file"}
            </Button>
            <span className="text-muted">
              or press{" "}
              <kbd className="border border-border bg-surface px-1.5 py-0.5 font-sans text-ink">
                {formatShortcut(openShortcut)}
              </kbd>
            </span>
          </div>

          {/* role="alert" makes screen readers announce the error when it appears. */}
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        <FocaWatona className="hidden w-full md:block" />
      </div>
    </section>
  );
}
