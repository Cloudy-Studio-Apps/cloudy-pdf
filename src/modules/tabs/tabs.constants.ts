import type { IconType } from "react-icons";
import { LuFileText, LuHouse, LuWrench } from "react-icons/lu";
import type { HomeTab, TabKind, TabsState, ToolsTab } from "./tabs.types";

export const HOME_TAB: HomeTab = { id: "home", kind: "home", title: "Home" };
export const TOOLS_TAB: ToolsTab = { id: "tools", kind: "tools", title: "Tools" };

/** The app starts with only the fixed tabs, showing Home. */
export const INITIAL_TABS_STATE: TabsState = {
  tabs: [HOME_TAB, TOOLS_TAB],
  activeId: HOME_TAB.id,
};

/** Icon shown in the tab bar for each kind of tab. */
export const TAB_ICONS: Record<TabKind, IconType> = {
  home: LuHouse,
  tools: LuWrench,
  document: LuFileText,
};
