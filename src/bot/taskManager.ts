// Simple task manager for serializing bot tasks and avoiding conflicts
// - Queue with priorities (low=0 default, higher runs earlier)
// - Prevents concurrent heavy actions
// - Provides cancel-all

export type TaskFn = () => Promise<void> | void;

export interface Task {
  id: string;
  run: TaskFn;
  priority?: number;
  createdAt?: number;
}

export class TaskManager {
  private queue: Task[] = [];
  private running = false;

  add(task: Task) {
    task.createdAt = Date.now();
    task.priority = task.priority ?? 0;
    this.queue.push(task);
    // sort by priority desc then createdAt asc
    this.queue.sort((a, b) => (b.priority! - a.priority!) || (a.createdAt! - b.createdAt!));
    this.tick();
  }

  isRunning() { return this.running; }
  size() { return this.queue.length + (this.running ? 1 : 0); }

  cancelAll() {
    this.queue = [];
  }

  private async tick() {
    if (this.running) return;
    const task = this.queue.shift();
    if (!task) return;
    this.running = true;
    try {
      await task.run();
    } catch (e) {
      // swallow errors to keep the loop alive
    } finally {
      this.running = false;
      // next
      if (this.queue.length) setTimeout(() => this.tick(), 0);
    }
  }
}