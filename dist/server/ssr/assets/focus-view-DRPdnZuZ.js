import { n as require_jsx_runtime } from "../index.js";
import { t as QuickActionsPanel } from "./quick-actions-panel-tSuCeHw7.js";
import { t as Timer } from "./timer-CSUERsNy.js";
/* empty css               */
//#region components/views/quick/focus-view.tsx
var import_jsx_runtime = require_jsx_runtime();
function FocusView() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "quick-page quick-focus-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "quick-page-brand",
				href: "/today",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { size: 18 }), "Quiet Plan"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "quick-page-center quick-focus-page-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: "Quick Focus"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "我有一点时间" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionsPanel, {
						mode: "focus",
						onClose: () => void 0
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
export { FocusView };
