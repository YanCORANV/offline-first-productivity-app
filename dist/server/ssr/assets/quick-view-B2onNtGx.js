import { l as __toESM, n as require_jsx_runtime, o as require_react } from "../index.js";
import { c as QuickCapture, h as usePlanner, i as Check, l as Lightbulb, p as createLucideIcon } from "./ui-CjSwuoD-.js";
/* empty css               */
//#region node_modules/lucide-react/dist/esm/icons/wifi-off.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var WifiOff = createLucideIcon("WifiOff", [
	["path", {
		d: "M12 20h.01",
		key: "zekei9"
	}],
	["path", {
		d: "M8.5 16.429a5 5 0 0 1 7 0",
		key: "1bycff"
	}],
	["path", {
		d: "M5 12.859a10 10 0 0 1 5.17-2.69",
		key: "1dl1wf"
	}],
	["path", {
		d: "M19 12.859a10 10 0 0 0-2.007-1.523",
		key: "4k23kn"
	}],
	["path", {
		d: "M2 8.82a15 15 0 0 1 4.177-2.643",
		key: "1grhjp"
	}],
	["path", {
		d: "M22 8.82a15 15 0 0 0-11.288-3.764",
		key: "z3jwby"
	}],
	["path", {
		d: "m2 2 20 20",
		key: "1ooewy"
	}]
]);
//#endregion
//#region components/views/quick/quick-view.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function QuickView() {
	const { syncState } = usePlanner();
	const [saved, setSaved] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "quick-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "quick-page-brand",
				href: "/today",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { size: 18 }), "Quiet Plan"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "quick-page-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: "Quick Thought"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "记录想法" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickCapture, {
						compact: true,
						autoFocus: true,
						onSaved: () => {
							setSaved(true);
							window.setTimeout(() => setSaved(false), 1800);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "quick-save-state",
						role: "status",
						children: saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 14 }), " 已进入 Inbox"] }) : syncState === "offline" || syncState === "unconfigured" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { size: 14 }), " 即使离线也会保存"] }) : null
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "quick-back-link",
				href: "/today",
				children: "返回今天"
			})
		]
	});
}
//#endregion
export { QuickView };
