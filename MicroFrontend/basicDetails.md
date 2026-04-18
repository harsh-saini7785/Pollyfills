# Microfrontends — Complete Guide

> Covers: what MFEs are, Vite module federation setup, challenges & solutions, React version conflicts, and all 4 version mismatch strategies.

---

## Table of Contents

1. [What is a Microfrontend?](#1-what-is-a-microfrontend)
2. [Architecture Overview](#2-architecture-overview)
3. [Vite Module Federation Setup](#3-vite-module-federation-setup)
4. [Cross-MFE Communication](#4-cross-mfe-communication)
5. [Common Challenges & Solutions](#5-common-challenges--solutions)
6. [React Version Conflicts](#6-react-version-conflicts)
7. [Strategy 1 — API Shim / Polyfill](#7-strategy-1--api-shim--polyfill)
8. [Strategy 2 — strictVersion: false](#8-strategy-2--strictversion-false)
9. [Strategy 3 — Feature Detection](#9-strategy-3--feature-detection)
10. [Strategy 4 — iframe Isolation](#10-strategy-4--iframe-isolation)
11. [Choosing the Right Strategy](#11-choosing-the-right-strategy)

---

## 1. What is a Microfrontend?

A **microfrontend** is an architectural pattern where a large frontend application is broken into smaller, independently deployable pieces — each owned by a separate team.

Think of it as **microservices for the UI**:

- Each "micro app" can use its own tech stack
- Each can be deployed independently with its own CI/CD pipeline
- Teams work autonomously without stepping on each other
- A **shell / host app** orchestrates all the pieces together

### When to use microfrontends

Microfrontends shine when you have:

- Multiple teams working on different business domains (e.g. checkout, catalog, user profile)
- A need for independent deployment cycles per team
- Large applications where a monorepo starts to slow everyone down

For small or single-team projects, the added complexity of module federation is usually not worth it — a well-organized monorepo is simpler.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Shell / Host App                    │
│       Orchestrates routing, shared deps, layout      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              Header MFE (Team Alpha)          │   │
│  │         Navigation, auth status               │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌───────────────────┐  ┌────────────────────────┐  │
│  │   Product MFE     │  │      Cart MFE           │  │
│  │   (Team Beta)     │  │    (Team Gamma)          │  │
│  │ Catalog, search   │  │  Basket, checkout        │  │
│  │                   │  │                          │  │
│  │ remoteEntry.js    │  │  remoteEntry.js           │  │
│  │ exposes:          │  │  exposes:                 │  │
│  │ /ProductApp       │  │  /CartApp                 │  │
│  └───────────────────┘  └────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Shared Module Layer                │   │
│  │   React, React-DOM (singleton)                │   │
│  │   Design system, Auth utils                   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 3. Vite Module Federation Setup

Vite supports module federation via the `@originjs/vite-plugin-federation` plugin.

### Installation

```bash
npm install @originjs/vite-plugin-federation --save-dev
```

Run this in **both** the host and every remote app.

---

### Remote app — exposes a component

```js
// remote/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'productApp',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductApp': './src/ProductApp.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext', // REQUIRED for module federation
  },
});
```

---

### Host app — consumes the remote

```js
// host/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        productApp: import.meta.env.VITE_PRODUCT_MFE_URL,
        // e.g. 'http://localhost:5001/assets/remoteEntry.js' in dev
        // e.g. 'https://cdn.company.com/product/remoteEntry.js' in prod
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
  },
});
```

---

### Consuming a remote in the host

```jsx
// host/src/App.jsx
import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Lazy-import the remote component — Vite handles the network fetch
const ProductApp = lazy(() => import('productApp/ProductApp'));

export default function App() {
  return (
    <ErrorBoundary fallback={<div>Product section unavailable</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <ProductApp />
      </Suspense>
    </ErrorBoundary>
  );
}
```

> **Always wrap remote imports in both `Suspense` and `ErrorBoundary`.** If a remote fails to load (network error, bad deploy), your whole shell crashes without them.

---

### TypeScript — declare remote modules

The host won't know the types of remote modules. Declare them manually:

```ts
// host/src/declarations.d.ts
declare module 'productApp/ProductApp' {
  const ProductApp: React.FC;
  export default ProductApp;
}

declare module 'cartApp/CartApp' {
  const CartApp: React.FC<{ userId: string }>;
  export default CartApp;
}
```

---

### Environment URLs (dev vs prod)

```js
// host/vite.config.js
remotes: {
  productApp: import.meta.env.VITE_PRODUCT_MFE_URL,
}

// .env.development
VITE_PRODUCT_MFE_URL=http://localhost:5001/assets/remoteEntry.js

// .env.production
VITE_PRODUCT_MFE_URL=https://cdn.company.com/product/assets/remoteEntry.js
```

---

## 4. Cross-MFE Communication

MFEs must stay decoupled — they should not import from each other directly. Use a shared event bus pattern.

### Custom event bus

```js
// shared/src/eventBus.js
// This utility can be a shared npm package, or inlined in each MFE

export const emit = (eventName, data) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
};

export const on = (eventName, handler) => {
  window.addEventListener(eventName, (e) => handler(e.detail));
};

export const off = (eventName, handler) => {
  window.removeEventListener(eventName, handler);
};
```

### Usage in MFEs

```js
// Product MFE — fires an event when user adds to cart
import { emit } from 'shared/eventBus';

function ProductCard({ product }) {
  const handleAdd = () => {
    emit('product:added', { id: product.id, name: product.name, price: product.price });
  };
  return <button onClick={handleAdd}>Add to cart</button>;
}

// Cart MFE — listens for the event
import { on, off } from 'shared/eventBus';
import { useEffect } from 'react';

function Cart() {
  useEffect(() => {
    const handler = ({ id, name, price }) => {
      dispatch(addItem({ id, name, price }));
    };
    on('product:added', handler);
    return () => off('product:added', handler); // cleanup on unmount
  }, []);

  return <div>...</div>;
}
```

---

## 5. Common Challenges & Solutions

### Challenge 1 — Duplicate React instances

**Problem:** Multiple MFEs each bundle their own React → hooks errors, bloated bundle, broken context.

**Solution:** Mark React as a singleton in the shared config:

```js
shared: {
  react: { singleton: true, requiredVersion: '^18.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
}
```

With `singleton: true`, only one copy of React is loaded regardless of how many MFEs request it.

---

### Challenge 2 — CSS style conflicts

**Problem:** Global CSS from one MFE bleeds into another (e.g. `body { font-size: 14px }` or `.btn { color: red }`).

**Solutions:**

```js
// Option A — CSS Modules (auto-scoped class names)
// styles.module.css
.button { color: red; }

// Component
import styles from './styles.module.css';
<button className={styles.button}>Click</button>
// Renders as: <button class="button_a1b2c3">Click</button>

// Option B — Shadow DOM via Web Components
class MyWidget extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>button { color: red; }</style>
      <button>Click</button>
    `;
    // Styles are fully scoped to this shadow root — can't leak out
  }
}
customElements.define('my-widget', MyWidget);
```

---

### Challenge 3 — Routing conflicts

**Problem:** Each MFE has its own React Router, clashing with the shell's router.

**Solution:** Shell owns top-level routes. MFEs use `MemoryRouter` internally.

```jsx
// Host — owns all top-level routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/products/*" element={<ProductMFE basePath="/products" />} />
        <Route path="/cart/*" element={<CartMFE basePath="/cart" />} />
      </Routes>
    </BrowserRouter>
  );
}

// Product MFE — uses MemoryRouter, receives basePath as a prop
import { MemoryRouter, Routes, Route } from 'react-router-dom';

export default function ProductApp({ basePath }) {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/:id" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>
  );
}
```

---

### Challenge 4 — Build target

**Problem:** Default Vite build target doesn't support ES module features needed by federation.

**Solution:** Always add this to both host and remote configs:

```js
build: {
  target: 'esnext',
}
```

---

### Challenge 5 — Contract / API version mismatch

**Problem:** Remote exposes a component with a different prop interface than what the host expects after a deploy.

**Solution:** Pin shared dep versions in CI and use contract testing.

```js
// In CI pipeline — check that remote's exposed interface matches what host expects
// Tools: Pact (contract testing), or a simple TypeScript check

// Also: use strict semver in requiredVersion
shared: {
  react: {
    singleton: true,
    requiredVersion: '18.2.0', // pin exact version, not a range
  },
}
```

---

## 6. React Version Conflicts

When the host runs React 18 and a remote was built for React 16, module federation runs a **version negotiation algorithm** at runtime. The outcome depends on your config.

### How version negotiation works

```
Remote MFE requests React from shared scope
         │
         ▼
Is React already loaded in shared scope?
    No → Load it fresh
    Yes → Is the version compatible with requiredVersion?
              Yes → Reuse it (ideal)
              No  → Is singleton: true set?
                        Yes → Force the loaded version, log a warning
                        No  → Load a second copy → BREAKS (two Reacts = hook errors)
```

### What "two React instances" causes

```
Uncaught Error: Invalid hook call.
Hooks can only be called inside of a function component.
```

This happens because the remote's hooks run against React 16's internal state while the host's context runs on React 18's — they have separate `ReactCurrentDispatcher` references and neither recognises the other's components.

---

### Real API breakages between React 16 and 18

| API | React 16 | React 18 | Result when forced onto 18 |
|---|---|---|---|
| `ReactDOM.render()` | ✅ Primary API | ⚠️ Deprecated | Works with warning |
| `ReactDOM.createRoot()` | ❌ Doesn't exist | ✅ New API | Crash if 16 code tries to call it |
| `useId()` | ❌ Doesn't exist | ✅ New hook | Crash if host passes it to remote |
| `unstable_ConcurrentMode` | ✅ Exists | ❌ Removed | Crash on import |
| `useState`, `useEffect`, `useContext` | ✅ | ✅ | Safe — same behaviour |
| Class components | ✅ | ✅ | Safe — still supported |
| `componentWillMount` | ⚠️ Legacy | ⚠️ Legacy | Works but deprecated in both |

---

## 7. Strategy 1 — API Shim / Polyfill

### What it is

A shim intercepts calls to old/removed APIs and redirects them to their modern equivalents — like a translator sitting between your old code and the new React runtime.

### What it prevents

Prevents hard crashes when the remote calls an API (like `ReactDOM.render`) that is deprecated or removed in the version it's being forced to run on.

### When to use it

When you know exactly which specific API is the problem and there is a direct React 18 equivalent for it.

### How to implement it

```js
// remote/src/shims.js
// This file MUST be imported before anything else in bootstrap.js

import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';

if (!ReactDOM.__shimmed) {
  // Intercept the old ReactDOM.render() call
  ReactDOM.render = (element, container, callback) => {
    // Translate to React 18's createRoot API
    if (!container._reactRoot) {
      container._reactRoot = createRoot(container);
    }
    container._reactRoot.render(element);
    if (callback) callback();
  };
  ReactDOM.__shimmed = true; // prevent double-patching
}
```

```js
// remote/src/bootstrap.js
import './shims.js'; // ← MUST be first import

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// This still calls the "old" API — but shims.js has already patched it
ReactDOM.render(<App />, document.getElementById('root'));
```

### How it works step by step

1. Remote boots, receives React 18 from the shared scope (forced by singleton)
2. `shims.js` runs first and patches `ReactDOM.render` before any component code runs
3. Remote calls `ReactDOM.render(...)` as it always did
4. Shim intercepts the call and redirects it to `createRoot(...).render(...)`
5. React 18 renders correctly — the remote code never needed to change

### Limitation

Only works when a direct translation exists. If the remote uses a truly removed API with no React 18 equivalent (like internal `unstable_*` APIs), a shim cannot help.

---

## 8. Strategy 2 — strictVersion: false

### What it is

A config flag that tells module federation's runtime: "instead of throwing an error when versions don't match, just log a warning and continue with whatever version is available."

### What it prevents

Prevents the hard load failure that occurs when the remote's `requiredVersion` doesn't satisfy what's in the shared scope. The MFE loads and runs instead of failing completely.

### When to use it

During gradual migration when you want the app to keep running while you fix the real incompatibilities. **Do not treat this as a permanent solution.**

### How to implement it

```js
// remote/vite.config.js
import federation from '@originjs/vite-plugin-federation';

export default {
  plugins: [
    federation({
      name: 'cartApp',
      filename: 'remoteEntry.js',
      exposes: { './CartApp': './src/CartApp.jsx' },
      shared: {
        react: {
          singleton: true,
          strictVersion: false,      // don't throw on mismatch — just warn
          requiredVersion: '>=16.8.0', // wide range — compatible with 16 OR 18
        },
        'react-dom': {
          singleton: true,
          strictVersion: false,
          requiredVersion: '>=16.8.0',
        },
      },
    }),
  ],
  build: { target: 'esnext' },
};
```

```js
// host/vite.config.js
federation({
  name: 'host',
  remotes: { cartApp: import.meta.env.VITE_CART_MFE_URL },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
})
```

### How it works step by step

1. Remote declares it needs React `>=16.8.0`
2. Shared scope has React 18 (loaded by host first)
3. Without `strictVersion: false` → module federation throws, MFE does not mount
4. With `strictVersion: false` → a console warning is logged, React 18 is handed to the remote anyway
5. Remote runs on React 18 — code may or may not work depending on what APIs it calls

### Console warning you will see

```
[Module Federation] Shared module react@16.x.x is not found in shared scope default.
Falling back to local copy.
```

### Limitation

This does **not** fix the underlying incompatibility. It only silences the version guard. If the remote's code actually calls a removed API, it will still crash — just later, inside a component render, which is harder to trace.

---

## 9. Strategy 3 — Feature Detection

### What it is

Instead of assuming which React version you're running on, you check for the API's existence at runtime before calling it. If the React 18 API exists, use it. If not, fall back to the React 16 way. The code handles both environments explicitly.

### What it prevents

Prevents "X is not a function" crashes when a version-specific hook or API doesn't exist in the runtime version. The code degrades gracefully instead of crashing.

### When to use it

When the remote uses a handful of version-sensitive APIs and you want robust code that genuinely works on both React 16 and React 18.

### How to implement it

```js
// remote/src/utils/renderApp.js
import ReactDOM from 'react-dom';

export function renderApp(element, container) {
  if (ReactDOM.createRoot) {
    // Running on React 18 — use the new API
    ReactDOM.createRoot(container).render(element);
  } else {
    // Running on React 16 — use the old API
    ReactDOM.render(element, container);
  }
}
```

```js
// remote/src/hooks/useStableId.js
import React from 'react';

// useId was introduced in React 18 — guard it with a fallback
const useStableId = React.useId
  ? React.useId
  : () => `id-${Math.random().toString(36).slice(2)}`;

export default useStableId;
```

```js
// remote/src/utils/batchUpdates.js
import ReactDOM from 'react-dom';

// unstable_batchedUpdates works in both 16 and 18 but the import path changed
export function batchUpdates(fn) {
  if (ReactDOM.flushSync) {
    // React 18: batching is automatic, but flushSync available for edge cases
    fn();
  } else {
    ReactDOM.unstable_batchedUpdates(fn);
  }
}
```

```jsx
// remote/src/App.jsx — putting it all together
import React from 'react';
import { renderApp } from './utils/renderApp';
import useStableId from './hooks/useStableId';

function ContactForm() {
  const formId = useStableId(); // works on React 16 AND 18

  return (
    <form id={formId}>
      <label htmlFor={`${formId}-email`}>Email</label>
      <input id={`${formId}-email`} type="email" />
    </form>
  );
}

// Works on both React 16 and 18
renderApp(<ContactForm />, document.getElementById('root'));
```

### How it works step by step

1. Remote receives React from the shared scope (could be 16 or 18 — doesn't matter)
2. Before calling any version-specific API, the code checks: does this API exist?
3. If yes → call the modern version
4. If no → fall back to the legacy version
5. App works correctly in either environment

### Limitation

You have to manually audit your entire codebase and identify every version-sensitive API. In large apps this means many guards to add and maintain. The code also permanently carries both code paths, even after you fully migrate to React 18.

---

## 10. Strategy 4 — iframe Isolation

### What it is

The remote MFE is not loaded via module federation at all. It runs as a completely separate web application inside an `<iframe>`. Each iframe has its own JavaScript context — React 16 inside the iframe has zero awareness of React 18 in the host. Communication happens via `postMessage` across the iframe boundary.

### What it prevents

Prevents **all** version conflicts permanently. No shared scope, no singleton negotiation, no hook errors. The two React instances live in completely separate browser contexts and can never interfere with each other.

### When to use it

- You cannot modify the legacy MFE's code at all
- The incompatibility is too deep to patch (e.g. entirely different rendering model)
- You need a 100% ironclad guarantee of isolation
- The legacy MFE is a third-party app you don't own

### How to implement it

```jsx
// HOST (React 18) — src/components/LegacyCart.jsx
import { useEffect, useRef, useCallback } from 'react';

export function LegacyCart({ onCartUpdate, currentUser }) {
  const iframeRef = useRef(null);
  const LEGACY_ORIGIN = 'http://legacy-cart.company.com';

  // Listen for messages FROM the iframe
  useEffect(() => {
    function handleMessage(event) {
      // ALWAYS verify origin — never use '*' in production
      if (event.origin !== LEGACY_ORIGIN) return;

      switch (event.data.type) {
        case 'CART_UPDATED':
          onCartUpdate(event.data.payload);
          break;
        case 'CHECKOUT_COMPLETE':
          window.location.href = '/order-confirmation';
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onCartUpdate]);

  // Send data INTO the iframe
  const sendToIframe = useCallback((type, payload) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type, payload },
      LEGACY_ORIGIN
    );
  }, []);

  // When currentUser changes in the host, sync it to the iframe
  useEffect(() => {
    if (currentUser) {
      sendToIframe('SET_USER', currentUser);
    }
  }, [currentUser, sendToIframe]);

  return (
    <iframe
      ref={iframeRef}
      src={LEGACY_ORIGIN}
      style={{ border: 'none', width: '100%', height: '500px' }}
      title="Shopping cart"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
}
```

```js
// LEGACY MFE (React 16) — runs as a fully standalone app inside the iframe
// src/index.js

import React from 'react';
import ReactDOM from 'react-dom'; // React 16's ReactDOM — totally isolated
import App from './App';
import store from './store';

const HOST_ORIGIN = 'http://host.company.com';

// Listen for messages FROM the host
window.addEventListener('message', (event) => {
  if (event.origin !== HOST_ORIGIN) return;

  switch (event.data.type) {
    case 'SET_USER':
      store.dispatch(setUser(event.data.payload));
      break;
    case 'APPLY_COUPON':
      store.dispatch(applyCoupon(event.data.payload));
      break;
  }
});

// Notify host when cart changes
store.subscribe(() => {
  const state = store.getState();
  window.parent.postMessage(
    { type: 'CART_UPDATED', payload: state.cart },
    HOST_ORIGIN // target origin — always specify this, never use '*'
  );
});

// Boot normally — React 16 render, completely isolated
ReactDOM.render(<App />, document.getElementById('root'));
```

### How it works step by step

1. Host (React 18) renders an `<iframe src="http://legacy-mfe.company.com">`
2. Browser creates a completely separate JS context for the iframe
3. Legacy MFE (React 16) boots inside the iframe — its own React, its own DOM, its own memory
4. When the user does something in the MFE, it fires `window.parent.postMessage()`
5. Host listens with `window.addEventListener('message')` and updates its own state

### Auto-sizing the iframe height

```js
// In legacy MFE — report its own height to the host
const observer = new ResizeObserver(() => {
  window.parent.postMessage(
    {
      type: 'RESIZE',
      payload: { height: document.body.scrollHeight },
    },
    HOST_ORIGIN
  );
});
observer.observe(document.body);

// In host — apply the reported height to the iframe
function handleMessage(event) {
  if (event.data.type === 'RESIZE') {
    iframeRef.current.style.height = event.data.payload.height + 'px';
  }
}
```

### Limitation

iframes come with real costs:

- Height auto-sizing requires extra postMessage plumbing
- Communication is verbose and not type-safe without additional tooling
- No shared React context, Redux store, or auth tokens — everything must cross the postMessage boundary explicitly
- Accessibility is harder (focus management, screen reader announcements)
- Some CSS features (e.g. `position: fixed` modals) behave unexpectedly inside iframes

---

## 11. Choosing the Right Strategy

Think of the 4 strategies as a spectrum from "quick patch" to "full isolation":

```
Quick patch ──────────────────────────────── Full isolation
     │                                              │
  Strategy 1      Strategy 2      Strategy 3   Strategy 4
   API Shim     strictVersion   Feature detect    iframe
  (surgical)     (escape hatch)   (robust)      (nuclear)
```

### Decision table

| Your situation | Recommended strategy |
|---|---|
| Remote uses `ReactDOM.render` — nothing else unusual | Strategy 1 — shim it |
| Mid-migration, just want to stop the crashes temporarily | Strategy 2 — `strictVersion: false` |
| Remote uses a handful of version-specific APIs you can enumerate | Strategy 3 — feature detect |
| Deep incompatibility, can't touch the remote code | Strategy 4 — iframe |
| You control both apps | Upgrade the remote to React 18 — eliminates the problem entirely |
| `unstable_*` APIs or truly removed internals | Strategy 4 — nothing else can save you here |

### Combining strategies in practice

In most real projects you end up combining them:

1. Set `strictVersion: false` to stop immediate fires (Strategy 2)
2. Add shims for specific broken APIs (Strategy 1)
3. Feature-detect anywhere the code diverges intentionally (Strategy 3)
4. Plan to either upgrade or iframe-isolate the truly incompatible MFEs over time (Strategy 4)

### The golden rule

> **Never have two React instances in the same JS context without a DOM boundary between them.**

`singleton: true` enforces one copy. Web Components or iframes provide the DOM boundary when you genuinely need two.

---

## Quick Reference

### Vite federation config — minimal safe setup (all on React 18)

```js
// Both host and remote
shared: {
  react: { singleton: true, requiredVersion: '^18.0.0' },
  'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
}
build: { target: 'esnext' }
```

### Checklist before going to production

- [ ] `build.target` set to `'esnext'` in all apps
- [ ] Remote URLs use environment variables (not hardcoded localhost)
- [ ] All remote imports wrapped in `<Suspense>` + `<ErrorBoundary>`
- [ ] CSS scoped via CSS Modules or Shadow DOM
- [ ] Shell owns all top-level routes; MFEs use `MemoryRouter`
- [ ] `postMessage` origins verified (never use `'*'`)
- [ ] TypeScript declarations for all remote modules
- [ ] CI checks that shared dep versions don't drift between teams
