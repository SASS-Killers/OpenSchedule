# PRD Section 8: Coding Standards & Best Practices

OpenSchedule is built on a modern, edge-native, type-safe stack. To ensure clean code, ease of testing, zero runtime state bugs, and maximum maintainability, all developers must strictly adhere to the following coding standards.

---

## 1. Directory Structure, Naming Conventions, & Modular Architecture

To prevent structural rot and keep the repository perfectly organized:

* **Strict Kebab-Case Naming**:
  * Every single file name, folder name, and asset in the workspace **must** be lowercase and strictly hyphen-separated (kebab-case).
  * *Allowed*: `booking-calendar/`, `scheduler-context.ts`, `weekly-availability-grid.tsx`, `email-telemetry-widget.tsx`.
  * *Prohibited*: CamelCase (`AvailabilityGrid.tsx`), snake_case (`database_schema.sql`), or mixed casing.
* **Banishment of the `components` Directory**:
  * **Creating a folder named `components` is strictly forbidden.**
  * In React, every visual element is a component; storing them in a general-purpose `components/` folder creates a generic "junk drawer" that complicates routing and dependency tracking.
* **Feature-Driven Component Placement (No Junk Drawers)**:
  * All views, contexts, dynamic widgets, and structural logic are grouped strictly into **Feature-Specific Folders** (e.g., `/installer-wizard`, `/host-dashboard`, `/client-booking-picker`).
  * Each feature folder encapsulates its own layout, custom hooks, test files, and unique styles:
    ```
    /host-dashboard
    ├── host-dashboard.tsx            (Main feature container)
    ├── weekly-availability-grid.tsx  (Feature sub-component)
    ├── use-dashboard-state.ts        (Feature-specific hooks)
    └── host-dashboard.test.tsx       (Feature-specific tests)
    ```
  * Universally shared visual building blocks (such as a generic styled button, tooltip, or alert banner) are placed in a designated design folder such as `/shared-ui` or `/design-system`, keeping them modular, encapsulated, and strictly isolated from specific scheduling flows.
  * Shared helper functions go to `/shared-helpers` or `/design-system/helpers`, completely avoiding generic folders like `utils/` or `helpers/`.

---

## 2. TypeScript & Pure Typing System

* **Strict Compilation**: The `tsconfig.json` must enforce `strict: true`, `noImplicitAny: true`, and `noUnusedLocals: true`.
* **Zero `any`**: The use of `any` is strictly prohibited. If a type is unknown (e.g., external API payload responses), use `unknown` combined with type guards or runtime validation (e.g., Zod schemas) to assert types safely.
* **Branded / Nominal Types**: Use descriptive, nominal type aliases for structural clarity (e.g., `type UTCString = string;`, `type EmailAddress = string;`).
* **Explicit Function Returns**: All exported functions must have explicit return type annotations to guarantee that logic changes do not break downstream type assertions.

---

## 2. Functional Programming (FP) & Immutability

The core scheduling engine and helper scripts must favor **Functional Programming** patterns:

* **Pure Functions**: Dynamic slot slicing, timezone offsets, notice windows, and buffer calculations must be written as pure functions:
  * No side-effects.
  * Same inputs always yield identical outputs.
  * Easily testable in isolation via Unit Tests.
* **Immutable State Patterns**:
  * Never mutate arrays or objects in-place.
  * Use object spreading (`{ ...state, updatedValue }`), array spreading (`[...list, newItem]`), and functional array operators (`map`, `filter`, `reduce`) to construct state.
  * Enforce `readonly` annotations on arrays and interfaces where appropriate:
    ```typescript
    interface AvailabilityInterval {
      readonly start: number; // Unix timestamp
      readonly end: number;
    }
    ```
* **Side-Effect Boundaries**: Isolate operations with side-effects (database queries, network requests to Google APIs, email dispatching) to the outer boundaries of the app (Astro API handlers, Background workers), keeping the inner business calculation layers completely pure.

---

## 3. React State Management (Strict Rules)

To prevent fragmented state, excessive boilerplate, and unreadable component hierarchies:

* **Encapsulated Local State**:
  * Local component state (`useState`) is permitted **only** within leaf-level, highly isolated, encapsulated components where the state has zero external influence (e.g., standard dropdown open/close states, input text buffer focus, minor UI accordion toggles).
* **NO Prop Drilling**:
  * Do not pass state or state setters down more than **one level deep**. 
  * If a state is required by distant nested components, it must be promoted to a shared provider context.
* **NO Reducer Pattern (`useReducer`)**:
  * The Reducer pattern is **expressly prohibited**. Avoid complex, boilerplate-heavy action dispatching structures which increase bundle size and complicate TypeScript type tracing.
* **The Shared State Standard (Context + Provider + Custom Hook)**:
  * For shared state management (e.g., the booking workflow steps, calendar date selection, or availability grids), utilize the **React Context + Provider + Custom Hook pattern**:
    1. Define a Context specifying the read-only state and state-transition methods.
    2. Enwrap the interactive tree inside a high-level `Provider` component.
    3. Expose the state to child components *exclusively* via a dedicated custom hook.
  * *Example Pattern*:
    ```typescript
    // 1. Definition
    interface SchedulerContextValue {
      readonly selectedDate: Date | null;
      readonly activeEvent: EventType;
      readonly selectDate: (date: Date) => void;
    }
    
    const SchedulerContext = createContext<SchedulerContextValue | null>(null);

    // 2. Custom Hook
    export function useScheduler() {
      const context = useContext(SchedulerContext);
      if (!context) {
        throw new Error("useScheduler must be used within a SchedulerProvider");
      }
      return context;
    }
    ```

---

## 4. Astro Architecture & Server Boundaries

* **Clean Frontmatter Separation**:
  * Database fetches, security assertions, API invocations, and session evaluations must occur exclusively in the Astro frontmatter (`---` block).
  * Do not bleed backend operations into client-side dynamic assets.
* **Island Hydration Control**:
  * Render static Astro components by default.
  * Hydrate React components dynamically **only when active user interaction is required** using explicit directives:
    * `<Calendar client:load />` for immediately interactive elements.
    * `<TelemetryPanel client:visible />` for off-screen/viewport dependent dashboard elements.
* **Astro edge-locals**:
  * Access D1 database bindings and edge secrets strictly via Astro's edge locals (`Astro.locals.runtime.env`), keeping the edge runtime clean and uniform.

---

## 5. Drizzle ORM & Database Access Standards

* **Transactional Consistency**:
  * Any operation that writes to multiple database tables (e.g., creating a booking *and* writing to the email telemetry log) must be wrapped inside a Drizzle **atomic transaction** (`db.transaction(tx => ...)`) to guarantee database consistency.
* **Prepared Queries Optimization**:
  * High-frequency dynamic routes (such as checking available time intervals or querying verification OTP states) must use Drizzle **Prepared Queries** to eliminate runtime SQL compilation overhead.
* **Strict Migration Management**:
  * Schema alterations are strictly managed via automated migration files generated by Drizzle Kit. Manual SQLite adjustments in the production D1 console are strictly banned.

---

## 6. Cloudflare Workers & Edge Standards

* **Web Standard APIs**:
  * Rely strictly on native Web Standard APIs (`Request`, `Response`, `Headers`, `URL`, `crypto`, `ReadableStream`) rather than Node.js specific libraries (`fs`, `net`, `path`).
  * If Node compatibility is required for external packages, limit its scope via Cloudflare's `nodejs_compat` configuration.
* **Stateless Edge Handlers**:
  * Serverless functions must remain completely stateless. Global in-memory variables must never be relied upon for session or scheduling logic, as isolates boot and terminate dynamically.
