/**
 * Reader Engine v2 Lifecycle Manager
 * Controls formal lifecycle stages:
 * Initialize -> Load Settings -> Restore Session -> Build Renderer -> Begin Reading -> Background Tasks -> Suspend -> Resume -> Destroy
 */

import { categorizedEventBus } from "./ReaderEventBus";

export type ReaderLifecycleStage =
  | "INITIALIZE"
  | "LOAD_SETTINGS"
  | "RESTORE_SESSION"
  | "BUILD_RENDERER"
  | "BEGIN_READING"
  | "BACKGROUND_TASKS"
  | "SUSPEND"
  | "RESUME"
  | "DESTROY";

export class ReaderLifecycleManager {
  private currentStage: ReaderLifecycleStage = "INITIALIZE";

  public setStage(stage: ReaderLifecycleStage): void {
    this.currentStage = stage;
    categorizedEventBus.emit("LIFECYCLE_STAGE_CHANGED", { stage });
  }

  public getStage(): ReaderLifecycleStage {
    return this.currentStage;
  }
}

export const readerLifecycleManager = new ReaderLifecycleManager();
