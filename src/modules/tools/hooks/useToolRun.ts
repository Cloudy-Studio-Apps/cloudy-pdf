import { useCallback, useRef, useState } from "react";
import { getErrorMessage } from "@/shared/utils/error.utils";
import type { ToolJob, ToolRun, ToolRunState } from "../tools.types";

const IDLE: ToolRunState = { status: "idle" };

/**
 * Runs a tool's job and tracks it (running, the files written, or the error).
 * Shared by every tool, so they all report progress and results the same way.
 */
export function useToolRun(): ToolRun {
  const [state, setState] = useState<ToolRunState>(IDLE);
  // A ref, not the state: a second click before the re-render must not start a second job.
  const running = useRef(false);

  const run = useCallback((job: ToolJob) => {
    if (running.current) return;
    running.current = true;
    setState({ status: "running" });

    job()
      // null: the user closed the save dialog; nothing happened.
      .then((outputs) => setState(outputs ? { status: "done", outputs } : IDLE))
      .catch((error) => setState({ status: "error", message: getErrorMessage(error) }))
      .finally(() => {
        running.current = false;
      });
  }, []);

  const reset = useCallback(() => setState(IDLE), []);

  return { state, isRunning: state.status === "running", run, reset };
}
