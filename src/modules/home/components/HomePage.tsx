import { RecentFiles } from "./RecentFiles";
import { WelcomeSection } from "./WelcomeSection";
import type { HomePageProps } from "../home.types";

/** Home tab: full-width welcome hero on top, recent files below (Acrobat-style start page). */
export function HomePage({ welcome, recent }: HomePageProps) {
  return (
    // The Home page scrolls on its own when the recent list is long.
    <div className="h-full overflow-y-auto bg-surface">
      <WelcomeSection {...welcome} />
      <div className="mx-auto max-w-5xl px-10 py-10">
        <RecentFiles {...recent} />
      </div>
    </div>
  );
}
