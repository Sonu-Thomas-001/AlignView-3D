/**
 * Gives the worker a `window` alias, and must be evaluated before any library module.
 *
 * Workers have no `window`, and library code normally guards for that. three.js ends its
 * module with `if (typeof window !== 'undefined') { window.__THREE__ = REVISION }`, which is
 * correct. The bundler is what breaks it: compiling for a browser target it folds
 * `typeof window !== 'undefined'` to a constant true and emits the body unguarded, so the
 * dev chunk reaches `window.__THREE__` and throws `ReferenceError: window is not defined`
 * the moment three is imported inside a worker.
 *
 * That throw is invisible. It surfaces as a rejected promise inside the bundler's own async
 * module instantiation, so `worker.onerror` never fires; the worker simply never finishes
 * evaluating, never installs its message handler, and never answers. The import pool looked
 * dead for no stated reason until the session's ready timeout named it.
 *
 * Aliasing `window` to the worker's global scope satisfies that assignment and keeps the
 * alias honest: `location`, `navigator` and `addEventListener` all exist on both, so code
 * that probes `window` for them gets the real thing. `document` is deliberately left absent,
 * because a fake one would let a library take a DOM path and fail somewhere less obvious.
 *
 * Import this first, above every other import in a worker entry. ESM evaluates a module's
 * dependencies in declaration order, which is the whole mechanism here: move this below the
 * import of a library and the library evaluates first, unshimmed, and the worker dies again.
 */
// Cast through `unknown`: the DOM lib already declares `window` as a full `Window`, so an
// intersection cannot widen it enough to accept the worker's global scope.
const scope = globalThis as unknown as { window?: unknown };
scope.window ??= globalThis;

export {};
