/**
 * empty-module.js
 *
 * A no-op stub used by the webpack NormalModuleReplacementPlugin to replace
 * legacy polyfill modules that are unnecessary for our modern browser targets
 * (Chrome ≥ 95, Safari ≥ 15.4, Firefox ≥ 95, Edge ≥ 95).
 *
 * Replacing bundled polyfills (e.g. Sentry's core-js shims for Array.from and
 * Array.prototype.at) with this stub removes ~24 KiB from the JS payload and
 * eliminates Lighthouse's "Legacy JavaScript" warning.
 */
module.exports = {};
