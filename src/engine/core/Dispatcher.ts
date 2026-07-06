export type DispatcherEventMap = Record<string, unknown[]>;

export type DispatcherListener<TArgs extends unknown[]> = (...args: TArgs) => void;

/**
 * Minimal typed event emitter. Subclass it with a concrete event map to get
 * fully typed `on` / `off` / `emit` calls, e.g.:
 *
 * ```ts
 * type MyEvents = {
 *   change: [value: number];
 *   error: [];
 * };
 *
 * class MyClass extends Dispatcher<MyEvents> {
 *   private someMethod(): void {
 *     this.emit('change', 42);
 *   }
 * }
 * ```
 */
export class Dispatcher<TEvents extends DispatcherEventMap> {
  private readonly listeners: { [TEvent in keyof TEvents]?: Set<DispatcherListener<TEvents[TEvent]>> } = {};

  /**
   * Registers `listener` to be called whenever `event` is emitted. Adding
   * the same listener for the same event twice has no additional effect.
   */
  on<TEvent extends keyof TEvents>(event: TEvent, listener: DispatcherListener<TEvents[TEvent]>): void {
    let eventListeners = this.listeners[event];

    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners[event] = eventListeners;
    }

    eventListeners.add(listener);
  }

  /**
   * Removes a previously registered `listener` for `event`. A no-op if the
   * listener was never registered.
   */
  off<TEvent extends keyof TEvents>(event: TEvent, listener: DispatcherListener<TEvents[TEvent]>): void {
    this.listeners[event]?.delete(listener);
  }

  /**
   * Calls every listener currently registered for `event` with the given
   * arguments, in registration order. Listeners added or removed by a
   * listener during emission do not affect the current `emit` call.
   */
  emit<TEvent extends keyof TEvents>(event: TEvent, ...args: TEvents[TEvent]): void {
    const eventListeners = this.listeners[event];
    if (!eventListeners || eventListeners.size === 0) return;

    for (const listener of Array.from(eventListeners)) {
      listener(...args);
    }
  }

  /**
   * Removes all listeners for `event`, or every listener for every event if
   * `event` is omitted.
   */
  removeAllListeners<TEvent extends keyof TEvents>(event?: TEvent): void {
    if (event === undefined) {
      for (const key of Object.keys(this.listeners) as (keyof TEvents)[]) {
        delete this.listeners[key];
      }
      return;
    }

    delete this.listeners[event];
  }
}
