import { l as __toESM, n as require_jsx_runtime, o as require_react } from "../index.js";
import { S as recommendationTargetDate, c as QuickCapture, h as usePlanner, p as createLucideIcon, y as buildAdvanceCandidates } from "./ui-CjSwuoD-.js";
import { n as useAppNavigation } from "./app-navigation-DNXAglzE.js";
import { t as Timer } from "./timer-CSUERsNy.js";
//#region node_modules/lucide-react/dist/esm/icons/arrow-right.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ArrowRight = createLucideIcon("ArrowRight", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}], ["path", {
	d: "m12 5 7 7-7 7",
	key: "xquz4c"
}]]);
//#endregion
//#region components/quick-actions-model.ts
var DURATION_OPTIONS = [
	15,
	30,
	60,
	90
];
function buildQuickCandidates({ duration, tasks, thoughts, goals, projects, projectNodes, scheduleBlocks, fragmentActivities }) {
	if (!duration) return [];
	const sharedCandidates = buildAdvanceCandidates({
		tasks,
		projectNodes,
		projects,
		goals,
		scheduleBlocks,
		targetDate: recommendationTargetDate(/* @__PURE__ */ new Date())
	}).filter((candidate) => candidate.isFragmentFriendly && !candidate.startsLater).map((candidate) => ({
		id: candidate.id,
		title: candidate.title,
		caption: candidate.caption,
		kind: candidate.source.entityType === "task" ? "task" : "node"
	}));
	const inboxCount = thoughts.filter((thought) => thought.status === "inbox").length;
	const result = [
		...sharedCandidates,
		...inboxCount ? [{
			id: "inbox",
			title: `整理 Inbox（${inboxCount} 条）`,
			caption: "把一个想法落实为下一步",
			kind: "inbox"
		}] : [],
		...fragmentActivities.filter((activity) => activity.enabled && activity.eligibleMinutes.includes(duration)).map((activity) => ({
			id: activity.id,
			title: activity.title,
			caption: "固定碎片活动",
			kind: "activity"
		}))
	];
	if (!result.length) result.push({
		id: "quiet-break",
		title: "离开屏幕，安静休息一下",
		caption: "没有必须填满的空白时间",
		kind: "activity"
	});
	return result.slice(0, 3);
}
//#endregion
//#region components/quick-actions-focus.tsx
var import_jsx_runtime = require_jsx_runtime();
function QuickFocusSection({ duration, candidates, message, onDurationChange, onCandidate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "quick-focus-section",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "这段时间适合做什么？" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "直接选择可用时长。" })] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "duration-pills",
				children: DURATION_OPTIONS.map((minutes) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: duration === minutes ? "is-active" : "",
					onClick: () => onDurationChange(minutes),
					children: [minutes, " 分钟"]
				}, minutes))
			}),
			duration ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "quick-focus-results",
				children: candidates.map((candidate) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onCandidate(candidate),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: candidate.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: candidate.caption })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 15 })]
				}, `${candidate.kind}-${candidate.id}`))
			}, duration) : null,
			message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "inline-note",
				role: "status",
				children: message
			}) : null
		]
	});
}
//#endregion
//#region components/quick-actions-panel.tsx
function QuickActionsPanel({ mode, onClose }) {
	const { tasks, thoughts, goals, projects, projectNodes, scheduleBlocks, fragmentActivities } = usePlanner();
	const { navigate } = useAppNavigation();
	const [duration, setDuration] = (0, import_react.useState)(null);
	const [message, setMessage] = (0, import_react.useState)("");
	const candidates = (0, import_react.useMemo)(() => buildQuickCandidates({
		duration,
		tasks,
		thoughts,
		goals,
		projects,
		projectNodes,
		scheduleBlocks,
		fragmentActivities
	}), [
		duration,
		fragmentActivities,
		goals,
		projectNodes,
		projects,
		scheduleBlocks,
		tasks,
		thoughts
	]);
	function openCandidate(candidate) {
		if (candidate.kind === "task") {
			navigate("calendar", {
				taskId: candidate.id,
				openCandidates: true
			});
			onClose();
			return;
		}
		if (candidate.kind === "node") {
			navigate("calendar", {
				nodeId: candidate.id,
				openCandidates: true
			});
			onClose();
			return;
		}
		if (candidate.kind === "inbox") {
			navigate("inbox");
			onClose();
			return;
		}
		setMessage(`现在可以：${candidate.title}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "quick-actions-panel",
		children: [mode === "capture" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickCapture, {
			autoFocus: true,
			onSaved: onClose
		}) }) : null, mode === "focus" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickFocusSection, {
			duration,
			candidates,
			message,
			onDurationChange: (next) => {
				setDuration(next);
				setMessage("");
			},
			onCandidate: openCandidate
		}) : null]
	});
}
//#endregion
export { QuickActionsPanel as t };
