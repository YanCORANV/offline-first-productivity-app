import { l as __toESM, n as require_jsx_runtime, o as require_react } from "../index.js";
import { $ as taskDateAnchors, C as buildCalendarTimelineScale, E as compactTimelineY, G as localDateKey, H as formatTime, L as daysFrom, M as taskTitleForBlock, Q as startOfWeek, T as compactTimelineMinuteAtY, W as isTaskOccurrenceCompleted, X as sameLocalDay, Z as startOfLocalDay, d as EmptyState, f as Plus, g as nextCourseTaskSlot, h as usePlanner, i as Check, j as projectPath, l as Lightbulb, n as X, p as createLucideIcon, q as newId, r as Circle, z as expandRecurrence } from "./ui-CjSwuoD-.js";
import { n as useAppNavigation } from "./app-navigation-DNXAglzE.js";
import { i as InspectorShell, n as EventComposer, r as TaskComposer, t as ScheduleBlockComposer } from "./composers-CfWdIHDn.js";
import { t as ChevronDown } from "./chevron-down-ZQ5WPbjD.js";
import { t as ChevronLeft } from "./chevron-left-DuMDGWXQ.js";
import { t as ChevronRight } from "./chevron-right-0GZKBAFw.js";
import { n as CalendarPlus, t as Undo2 } from "./undo-2-DW4h1O6F.js";
import { n as Eye, t as EyeOff } from "./eye-off-lo9wt4vt.js";
//#region node_modules/lucide-react/dist/esm/icons/list-todo.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ListTodo = createLucideIcon("ListTodo", [
	["rect", {
		x: "3",
		y: "5",
		width: "6",
		height: "6",
		rx: "1",
		key: "1defrl"
	}],
	["path", {
		d: "m3 17 2 2 4-4",
		key: "1jhpwq"
	}],
	["path", {
		d: "M13 6h8",
		key: "15sg57"
	}],
	["path", {
		d: "M13 12h8",
		key: "h98zly"
	}],
	["path", {
		d: "M13 18h8",
		key: "oe0vm4"
	}]
]);
//#endregion
//#region components/views/calendar/calendar-popover.tsx
var import_jsx_runtime = require_jsx_runtime();
/** Native light-dismiss, Escape and focus return; no second modal system. */
function CalendarPopover({ label, name, children, openKey, className = "" }) {
	const id = (0, import_react.useId)();
	const trigger = (0, import_react.useRef)(null);
	const panel = (0, import_react.useRef)(null);
	const position = () => {
		if (!trigger.current || !panel.current) return;
		const rect = trigger.current.getBoundingClientRect();
		panel.current.style.setProperty("--popover-top", `${rect.bottom + 8}px`);
		const width = Math.min(352, window.innerWidth - 24);
		const right = Math.max(12, Math.min(window.innerWidth - rect.right, window.innerWidth - width - 12));
		panel.current.style.setProperty("--popover-right", `${right}px`);
		panel.current.style.setProperty("--popover-height", `${Math.max(100, window.innerHeight - rect.bottom - 20)}px`);
	};
	(0, import_react.useEffect)(() => {
		const dismiss = () => panel.current?.hidePopover();
		window.addEventListener("resize", dismiss);
		return () => window.removeEventListener("resize", dismiss);
	}, []);
	(0, import_react.useEffect)(() => {
		if (openKey) {
			position();
			panel.current?.showPopover();
		}
	}, [openKey]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref: trigger,
		type: "button",
		className: `calendar-tool ${className}`,
		"aria-label": name,
		popoverTarget: id,
		onClick: position,
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: panel,
		id,
		popover: "auto",
		className: "calendar-toolbar-popover",
		"aria-label": name,
		onClickCapture: (event) => {
			if (event.target.closest("[data-close-popover]")) panel.current?.hidePopover();
		},
		onDragEnd: () => panel.current?.hidePopover(),
		children
	})] });
}
//#endregion
//#region components/views/calendar/completion-choice.tsx
function CompletionChoice({ onClose, onComplete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorShell, {
		title: "完成到哪里？",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "completion-choice",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "这个事项还有其他时间块。默认只完成当前这一次安排。" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "primary-button",
					type: "button",
					onClick: () => void onComplete("block"),
					children: "完成当前时间块"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: () => void onComplete("item"),
					children: "完成整个事项"
				})
			]
		})
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/chevron-up.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ChevronUp = createLucideIcon("ChevronUp", [["path", {
	d: "m18 15-6-6-6 6",
	key: "153udz"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/grip-vertical.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var GripVertical = createLucideIcon("GripVertical", [
	["circle", {
		cx: "9",
		cy: "12",
		r: "1",
		key: "1vctgf"
	}],
	["circle", {
		cx: "9",
		cy: "5",
		r: "1",
		key: "hp0tcf"
	}],
	["circle", {
		cx: "9",
		cy: "19",
		r: "1",
		key: "fkjjf6"
	}],
	["circle", {
		cx: "15",
		cy: "12",
		r: "1",
		key: "1tmaij"
	}],
	["circle", {
		cx: "15",
		cy: "5",
		r: "1",
		key: "19l28e"
	}],
	["circle", {
		cx: "15",
		cy: "19",
		r: "1",
		key: "f4zoj3"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/list-plus.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ListPlus = createLucideIcon("ListPlus", [
	["path", {
		d: "M11 12H3",
		key: "51ecnj"
	}],
	["path", {
		d: "M16 6H3",
		key: "1wxfjs"
	}],
	["path", {
		d: "M16 18H3",
		key: "12xzn7"
	}],
	["path", {
		d: "M18 9v6",
		key: "1twb98"
	}],
	["path", {
		d: "M21 12h-6",
		key: "bt1uis"
	}]
]);
function fittedCalendarHourScale(start, end, availableHeight) {
	if (availableHeight === null) return 120;
	return Math.max(1, availableHeight - 20 - 32) * 120 / Math.max(120, end - start);
}
function taskBelongsToCourseOccurrence(task, eventId, occurrenceDate) {
	if (task.courseEventId !== eventId || task.courseOccurrenceDate !== occurrenceDate) return false;
	return !task.scheduledStartAt || localDateKey(new Date(task.scheduledStartAt)) === occurrenceDate;
}
function calendarEntryLanePriority(entry) {
	if (entry.kind === "event" && entry.item.eventKind === "course") return 0;
	if (entry.kind === "task" && entry.item.courseEventId) return 2;
	return 1;
}
function entriesForDays(days, props, options = {}) {
	const entriesByDay = new Map(days.map((day) => [day.getTime(), []]));
	if (!days.length) return entriesByDay;
	const dayTimeByKey = new Map(days.map((day) => [localDateKey(day), day.getTime()]));
	const blockSourceIdsByKey = /* @__PURE__ */ new Map();
	const nodesById = new Map(props.nodes.map((node) => [node.id, node]));
	for (const block of props.blocks) {
		if (block.status === "skipped") continue;
		const dayTime = dayTimeByKey.get(block.date);
		if (dayTime == null) continue;
		const sourceIds = blockSourceIdsByKey.get(block.date) ?? /* @__PURE__ */ new Set();
		sourceIds.add(block.sourceId);
		blockSourceIdsByKey.set(block.date, sourceIds);
		const node = nodesById.get(block.sourceId);
		entriesByDay.get(dayTime).push({
			kind: "block",
			item: block,
			at: block.startAt ?? "",
			endAt: block.endAt ?? "",
			color: node ? props.nodeColor(node) : "#AFC3D4",
			instanceKey: `block-${block.id}`
		});
	}
	const rangeStart = startOfLocalDay(days[0]);
	const rangeEnd = startOfLocalDay(days.at(-1));
	rangeEnd.setDate(rangeEnd.getDate() + 1);
	rangeEnd.setMilliseconds(-1);
	const occurrencesFor = (direct, recurrenceRule) => {
		const byKey = /* @__PURE__ */ new Map();
		if (direct) {
			const key = localDateKey(new Date(direct));
			if (dayTimeByKey.has(key)) byKey.set(key, direct);
		}
		for (const occurrence of expandRecurrence(recurrenceRule, rangeStart, rangeEnd)) {
			const key = localDateKey(occurrence);
			if (dayTimeByKey.has(key) && !byKey.has(key)) byKey.set(key, occurrence.toISOString());
		}
		return byKey;
	};
	const courseOccurrenceKeys = /* @__PURE__ */ new Set();
	for (const event of props.events) {
		if (event.eventKind !== "course") continue;
		for (const key of occurrencesFor(event.startAt, event.recurrenceRule).keys()) {
			if ((event.excludedOccurrenceKeys ?? []).includes(key)) continue;
			courseOccurrenceKeys.add(event.id + ":" + key);
		}
	}
	for (const task of props.tasks) {
		if (task.planningState === "draft") continue;
		for (const anchor of taskDateAnchors(task)) {
			const occurrences = occurrencesFor(anchor.at, anchor.recurring ? task.recurrenceRule : null);
			for (const [key, occurrence] of occurrences) {
				const isPrimary = anchor.kind === "scheduled" || anchor.kind === "due";
				if (isPrimary && blockSourceIdsByKey.get(key)?.has(task.id)) continue;
				if (!options.hideCourses && isPrimary && task.courseEventId && courseOccurrenceKeys.has(task.courseEventId + ":" + key) && taskBelongsToCourseOccurrence(task, task.courseEventId, key)) continue;
				const dayTime = dayTimeByKey.get(key);
				const at = anchor.timed ? occurrence : "";
				entriesByDay.get(dayTime).push({
					kind: "task",
					item: task,
					occurrenceAt: occurrence,
					at,
					endAt: at && anchor.usesDuration && task.durationMinutes ? new Date(new Date(at).getTime() + task.durationMinutes * 6e4).toISOString() : at,
					color: props.itemColor(task),
					instanceKey: `task-${task.id}-${anchor.kind}-${occurrence}`,
					timingLabel: anchor.kind === "desired" ? "预期完成" : anchor.kind === "deadline" ? "实际截止" : void 0
				});
			}
		}
	}
	for (const event of props.events) {
		if (options.hideCourses && event.eventKind === "course") continue;
		const occurrences = occurrencesFor(event.startAt, event.recurrenceRule);
		const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
		for (const [key, occurrence] of occurrences) {
			if ((event.excludedOccurrenceKeys ?? []).includes(key)) continue;
			const dayTime = dayTimeByKey.get(key);
			entriesByDay.get(dayTime).push({
				kind: "event",
				item: event,
				at: occurrence,
				endAt: new Date(new Date(occurrence).getTime() + duration).toISOString(),
				color: props.itemColor(event),
				instanceKey: `event-${event.id}-${occurrence}`
			});
		}
	}
	for (const entries of entriesByDay.values()) entries.sort((a, b) => a.at.localeCompare(b.at));
	return entriesByDay;
}
function positionEntries(entries, scale, configuredStart, configuredEnd) {
	const prepared = entries.map((entry) => {
		const start = new Date(entry.at);
		const end = entry.endAt ? new Date(entry.endAt) : new Date(start.getTime() + 45 * 6e4);
		const startMinutes = displayClockMinutes(start, configuredStart, configuredEnd);
		const endMinutes = Math.max(startMinutes + 1, startMinutes + (end.getTime() - start.getTime()) / 6e4);
		const top = 10 + compactTimelineY(startMinutes, scale);
		const naturalHeight = compactTimelineY(endMinutes, scale) - compactTimelineY(startMinutes, scale);
		return {
			entry,
			startMinutes,
			endMinutes,
			top,
			height: end.getTime() > start.getTime() ? Math.max(1, naturalHeight) : 32
		};
	});
	prepared.sort((left, right) => left.startMinutes - right.startMinutes || calendarEntryLanePriority(left.entry) - calendarEntryLanePriority(right.entry));
	const positioned = [];
	let cluster = [];
	let clusterEnd = Number.NEGATIVE_INFINITY;
	const flushCluster = () => {
		if (!cluster.length) return;
		const laneEnds = [];
		const clustered = cluster.map((item) => {
			let lane = laneEnds.findIndex((laneEnd) => laneEnd <= item.startMinutes);
			if (lane < 0) {
				lane = laneEnds.length;
				laneEnds.push(item.endMinutes);
			} else laneEnds[lane] = item.endMinutes;
			return {
				...item,
				lane
			};
		});
		const lanes = Math.max(1, laneEnds.length);
		for (const item of clustered) positioned.push({
			entry: item.entry,
			lane: item.lane,
			lanes,
			top: item.top,
			height: item.height
		});
	};
	for (const item of prepared) {
		if (cluster.length && item.startMinutes >= clusterEnd) {
			flushCluster();
			cluster = [];
			clusterEnd = Number.NEGATIVE_INFINITY;
		}
		cluster.push(item);
		clusterEnd = Math.max(clusterEnd, item.endMinutes);
	}
	flushCluster();
	for (let index = 0; index < positioned.length; index++) {
		const current = positioned[index];
		const left = current.lane / current.lanes;
		const right = (current.lane + 1) / current.lanes;
		const next = positioned.slice(index + 1).find((candidate) => candidate.top > current.top && candidate.lane / candidate.lanes < right && (candidate.lane + 1) / candidate.lanes > left);
		if (next) current.height = Math.min(current.height, Math.max(1, next.top - current.top - 1));
	}
	return positioned;
}
function isAllDayEntry(entry) {
	return !entry.at && entry.kind === "task" && entry.item.isAllDay === true;
}
function parseClockMinutes(value) {
	const [hours, minutes] = value.split(":").map(Number);
	return (Number.isFinite(hours) ? hours : 8) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}
function displayClockMinutes(value, configuredStart, configuredEnd) {
	let minutes = value.getHours() * 60 + value.getMinutes();
	if (configuredEnd > 1440 && minutes <= configuredEnd - 1440 && minutes < configuredStart) minutes += 1440;
	return minutes;
}
function formatClockMarker(minutes) {
	const normalized = (minutes % 1440 + 1440) % 1440;
	const hours = Math.floor(normalized / 60);
	const minute = normalized % 60;
	return `${minutes >= 1440 ? "次日 " : ""}${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function taskTimingSummary(item) {
	if (item.scheduledStartAt) {
		const start = formatTime(item.scheduledStartAt);
		const end = item.durationMinutes ? formatTime(new Date(new Date(item.scheduledStartAt).getTime() + item.durationMinutes * 6e4).toISOString()) : "";
		return end ? `${start}-${end}` : start;
	}
	if (item.dueAt) return `截止 ${formatTime(item.dueAt)}`;
	return "待安排";
}
function setDragPayload(event, payload) {
	event.dataTransfer.effectAllowed = "move";
	event.dataTransfer.setData("application/planner-item", JSON.stringify(payload));
}
function readDragPayload(event) {
	try {
		const payload = JSON.parse(event.dataTransfer.getData("application/planner-item"));
		if (!payload.id || ![
			"block",
			"event",
			"task",
			"node",
			"thought"
		].includes(payload.kind)) return null;
		return {
			id: payload.id,
			kind: payload.kind
		};
	} catch {
		return null;
	}
}
async function handleDrop(event, day, withTime, onMove) {
	event.preventDefault();
	const payload = readDragPayload(event);
	if (payload) await onMove(payload, day, withTime);
}
//#endregion
//#region components/views/calendar/calendar-entry-card.tsx
function CalendarEntryCard({ entry, compact = false, showTime = true, hideCourseLocation = false, summaryOnly = false, ...props }) {
	const [courseDropActive, setCourseDropActive] = (0, import_react.useState)(false);
	const title = entry.kind === "task" ? entry.item.title : entry.kind === "event" ? entry.item.title : taskTitleForBlock(entry.item, props.tasks, props.nodes);
	const subtitle = entry.kind === "block" && entry.item.sourceType === "projectNode" ? projectPath(entry.item.sourceId, props.nodes, props.projects, props.goals) : "";
	const note = (entry.kind === "block" && entry.item.sourceType === "task" ? props.tasks.find((task) => task.id === entry.item.sourceId) ?? null : null)?.notes.trim() || "";
	const completed = entry.kind === "task" ? entry.item.recurrenceRule ? isTaskOccurrenceCompleted(entry.item, entry.occurrenceAt || entry.at || (/* @__PURE__ */ new Date()).toISOString()) : entry.item.status === "completed" : entry.kind === "event" ? entry.item.status === "completed" : entry.item.status === "performed";
	const isCourse = entry.kind === "event" && entry.item.eventKind === "course";
	const isCourseTask = entry.kind === "task" && Boolean(entry.item.courseEventId);
	const location = entry.kind === "event" ? entry.item.location : null;
	const occurrenceDate = isCourse && entry.at ? localDateKey(new Date(entry.at)) : "";
	const courseTaskSummary = (isCourse ? props.tasks.filter((task) => task.planningState !== "draft" && taskBelongsToCourseOccurrence(task, entry.item.id, occurrenceDate)).sort((left, right) => (left.scheduledStartAt ?? "").localeCompare(right.scheduledStartAt ?? "")) : []).map((task) => (task.status === "completed" ? "✓ " : "") + task.title).join(" · ");
	const scheduleLabel = entry.kind === "task" ? entry.timingLabel ?? (entry.item.courseEventId ? "课内事项" : !entry.at ? entry.item.isAllDay ? "全天" : "待安排" : "") : "";
	const canDrag = (entry.kind !== "task" || !entry.timingLabel) && (entry.kind === "block" || !entry.item.recurrenceRule);
	const accessibleTitle = showTime && entry.at ? `${title} · ${formatTime(entry.at)}${entry.endAt && entry.endAt !== entry.at ? `–${formatTime(entry.endAt)}` : ""}` : title;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: [
			compact ? "compact-calendar-item unified-item" : "time-calendar-item",
			isCourse ? "is-course" : "",
			isCourseTask ? "is-course-task" : "",
			courseDropActive ? "is-drop-target" : "",
			completed ? "is-performed" : "",
			summaryOnly ? "is-summary" : ""
		].join(" "),
		style: { "--item-color": entry.color },
		onDragEnter: isCourse ? (event) => {
			event.preventDefault();
			event.stopPropagation();
			setCourseDropActive(true);
		} : void 0,
		onDragOver: isCourse ? (event) => {
			event.preventDefault();
			event.stopPropagation();
			event.dataTransfer.dropEffect = "move";
		} : void 0,
		onDragLeave: isCourse ? () => setCourseDropActive(false) : void 0,
		onDrop: entry.kind === "event" && entry.item.eventKind === "course" ? (event) => {
			event.preventDefault();
			event.stopPropagation();
			setCourseDropActive(false);
			const payload = readDragPayload(event);
			if (payload) props.onCourseDrop(payload, entry.item, entry.at, entry.endAt);
		} : void 0,
		children: [
			!isCourse && !(summaryOnly && compact) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "item-inline-check",
				type: "button",
				onClick: () => {
					if (entry.kind === "task") props.onTaskComplete(entry.item, entry.occurrenceAt || entry.at || void 0);
					else if (entry.kind === "event") props.onEventComplete(entry.item);
					else props.onBlockComplete(entry.item);
				},
				"aria-label": completed ? `恢复 ${title}` : `完成 ${title}`,
				children: completed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { size: 13 })
			}) : null,
			entry.kind === "event" && isCourse && !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "course-task-trigger",
				type: "button",
				onClick: () => props.onCourseTasks(entry.item, entry.at, entry.endAt),
				"aria-label": `在本节 ${title} 中安排事项`,
				title: "在本节课中安排事项",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListPlus, { size: 13 })
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "calendar-item-main",
				type: "button",
				"aria-label": accessibleTitle,
				title: accessibleTitle,
				draggable: canDrag || void 0,
				onDragStart: canDrag ? (event) => setDragPayload(event, {
					kind: entry.kind,
					id: entry.item.id
				}) : void 0,
				onClick: () => {
					if (entry.kind === "task") props.onTask(entry.item, entry.occurrenceAt || entry.at || void 0);
					else if (entry.kind === "event") props.onEvent(entry.item, entry.at);
					else props.onBlock(entry.item);
				},
				children: [showTime && entry.at ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("time", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "calendar-time-start",
					children: formatTime(entry.at)
				}), entry.endAt && entry.endAt !== entry.at ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "calendar-time-end",
					children: ["–", formatTime(entry.endAt)]
				}) : null] }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
					title,
					children: title
				}), summaryOnly ? null : courseTaskSummary ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", {
					className: "course-card-task-summary",
					title: courseTaskSummary,
					children: ["事项 · ", courseTaskSummary]
				}) : scheduleLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: scheduleLabel }) : location && (!isCourse || !hideCourseLocation) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {
					title: location,
					children: location
				}) : subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: subtitle }) : note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: note }) : null] })]
			}),
			canDrag && !(summaryOnly && compact) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "calendar-drag-handle",
				draggable: true,
				onDragStart: (event) => setDragPayload(event, {
					kind: entry.kind,
					id: entry.item.id
				}),
				"aria-hidden": "true",
				title: "拖动以调整时间",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
					size: 12,
					"aria-hidden": "true"
				})
			}) : null
		]
	});
}
//#endregion
//#region components/views/calendar/month-calendar.tsx
var MONTH_COLLAPSED_ENTRY_LIMIT = 3;
function MonthCalendar({ days, anchor, entriesByDay, ...props }) {
	const [expandedDay, setExpandedDay] = (0, import_react.useState)(null);
	const monthKey = `${anchor.getFullYear()}-${anchor.getMonth()}`;
	const expandableDayKeys = new Set(days.filter((day) => (entriesByDay.get(day.getTime())?.length ?? 0) > MONTH_COLLAPSED_ENTRY_LIMIT).map(localDateKey));
	const activeExpandedDayKey = expandedDay?.monthKey === monthKey && expandableDayKeys.has(expandedDay.dayKey) ? expandedDay.dayKey : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: `month-grid execution-calendar ${activeExpandedDayKey ? "has-expanded-day" : ""}`,
		children: [[
			"一",
			"二",
			"三",
			"四",
			"五",
			"六",
			"日"
		].map((label) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "month-weekday",
			children: ["周", label]
		}, label)), days.map((day) => {
			const entries = entriesByDay.get(day.getTime()) ?? [];
			const dayKey = localDateKey(day);
			const expanded = activeExpandedDayKey === dayKey;
			const visibleEntries = expanded ? entries : entries.slice(0, MONTH_COLLAPSED_ENTRY_LIMIT);
			const hiddenCount = entries.length - MONTH_COLLAPSED_ENTRY_LIMIT;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: [
					"calendar-column month-day",
					day.getMonth() !== anchor.getMonth() ? "is-outside" : "",
					sameLocalDay((/* @__PURE__ */ new Date()).toISOString(), day) ? "is-today" : "",
					expanded ? "is-expanded" : ""
				].filter(Boolean).join(" "),
				onDragOver: (event) => event.preventDefault(),
				onDrop: (event) => void handleDrop(event, day, false, props.onMove),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
						dateTime: dayKey,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: day.getDate() })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "calendar-day-quick-add",
						onClick: () => props.onAdd(day),
						"aria-label": `创建 ${day.getMonth() + 1} 月 ${day.getDate()} 日完整事项`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							size: 15,
							"aria-hidden": "true"
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "calendar-column-items",
						id: `month-day-items-${dayKey}`,
						children: visibleEntries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarEntryCard, {
							entry,
							compact: true,
							showTime: false,
							...props
						}, entry.instanceKey))
					}),
					entries.length > MONTH_COLLAPSED_ENTRY_LIMIT ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "month-day-toggle",
						type: "button",
						"aria-expanded": expanded,
						"aria-controls": `month-day-items-${dayKey}`,
						onClick: () => setExpandedDay(expanded ? null : {
							monthKey,
							dayKey
						}),
						children: [expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 12 }), expanded ? "收起" : `还有 ${hiddenCount} 项`]
					}) : null
				]
			}, dayKey);
		})]
	});
}
//#endregion
//#region components/views/calendar/use-calendar-timeline-height.ts
/** Measure layout space, not scroll position; never rescale while scrolling. */
function useCalendarTimelineHeight(active) {
	const timelineRef = (0, import_react.useRef)(null);
	const [availableHeight, setAvailableHeight] = (0, import_react.useState)(null);
	(0, import_react.useLayoutEffect)(() => {
		if (!active || !timelineRef.current) return;
		const timeline = timelineRef.current;
		const page = timeline.closest(".page-container");
		const workspace = timeline.closest(".calendar-page-layout");
		let frame = 0;
		const measure = () => {
			const top = timeline.getBoundingClientRect().top + window.scrollY;
			const bottomSpace = page ? parseFloat(getComputedStyle(page).paddingBottom) : 16;
			const next = Math.max(80, Math.floor(window.innerHeight - top - bottomSpace - 2));
			setAvailableHeight((previous) => previous === next ? previous : next);
		};
		const scheduleMeasure = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		};
		measure();
		const observer = new ResizeObserver(scheduleMeasure);
		if (workspace) observer.observe(workspace);
		if (page) observer.observe(page);
		observer.observe(timeline);
		window.addEventListener("resize", scheduleMeasure);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener("resize", scheduleMeasure);
		};
	}, [active]);
	return {
		timelineRef,
		availableHeight
	};
}
//#endregion
//#region components/views/calendar/time-grid.tsx
function TimeGrid({ days, entriesByDay, presentation = "overview", ...props }) {
	const { timelineRef, availableHeight } = useCalendarTimelineHeight(presentation === "timeline");
	const [selectedDayIndex, setSelectedDayIndex] = (0, import_react.useState)(() => Math.max(0, days.findIndex((day) => sameLocalDay((/* @__PURE__ */ new Date()).toISOString(), day))));
	const selectedDay = days[selectedDayIndex] ?? days[0];
	const selectedEntries = selectedDay ? entriesByDay.get(selectedDay.getTime()) ?? [] : [];
	const now = /* @__PURE__ */ new Date();
	const startMinute = parseClockMinutes(props.displayStart);
	const configuredEnd = parseClockMinutes(props.displayEnd);
	const endMinute = configuredEnd <= startMinute ? configuredEnd + 1440 : configuredEnd;
	const timedEntriesByDay = days.map((day) => (entriesByDay.get(day.getTime()) ?? []).filter((entry) => entry.at));
	const timelineStart = startMinute;
	const timelineEnd = endMinute;
	const { scale, markerMinutes } = buildCalendarTimelineScale(timelineStart, timelineEnd, fittedCalendarHourScale(timelineStart, timelineEnd, availableHeight));
	const positionedEntriesByDay = timedEntriesByDay.map((entries) => positionEntries(entries, scale, startMinute, endMinute));
	const entryBottom = positionedEntriesByDay.flat().reduce((maximum, entry) => Math.max(maximum, entry.top + entry.height), 0);
	const height = availableHeight ?? Math.max(180, scale.height + 20, entryBottom + 10);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: [
			"time-grid",
			`is-${presentation}`,
			days.length === 1 ? "calendar-day-grid" : ""
		].filter(Boolean).join(" "),
		style: { "--calendar-days": days.length },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "time-grid-corner",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "time-grid-day-headings",
				children: days.map((day, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: sameLocalDay(now.toISOString(), day) ? "time-grid-day-heading is-today" : "time-grid-day-heading",
					"data-calendar-day-heading": true,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "time-grid-day-label",
						"aria-label": `查看 ${day.getMonth() + 1} 月 ${day.getDate()} 日事项`,
						"aria-pressed": selectedDayIndex === index,
						onClick: () => setSelectedDayIndex(index),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(day) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: day.getDate() })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "calendar-day-quick-add",
						"aria-label": `创建 ${day.getMonth() + 1} 月 ${day.getDate()} 日完整事项`,
						onClick: () => props.onAdd(day),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							size: 16,
							"aria-hidden": "true"
						})
					})]
				}, localDateKey(day)))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "calendar-week-overview",
				children: days.map((day, index) => {
					const entries = entriesByDay.get(day.getTime()) ?? [];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "calendar-overview-day",
						"data-selected": selectedDayIndex === index,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayColors, { entries }), entries.length ? entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarEntryCard, {
							entry,
							compact: true,
							summaryOnly: true,
							...props
						}, entry.instanceKey)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "calendar-overview-empty",
							children: "—"
						})]
					}, localDateKey(day));
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "calendar-selected-day",
				"aria-label": "当天完整事项",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: selectedDay ? `${selectedDay.getMonth() + 1} 月 ${selectedDay.getDate()} 日` : "" }), selectedEntries.length ? selectedEntries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarEntryCard, {
					entry,
					compact: true,
					...props
				}, entry.instanceKey)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "当天没有事项" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "time-grid-all-day-label" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "time-grid-all-day",
				children: days.map((day) => {
					const allDay = (entriesByDay.get(day.getTime()) ?? []).filter((entry) => !entry.at);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "all-day-column",
						onDragOver: (event) => event.preventDefault(),
						onDrop: (event) => void handleDrop(event, day, false, props.onMove),
						children: [allDay.slice(0, 1).map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarEntryCard, {
							entry,
							compact: true,
							summaryOnly: true,
							hideCourseLocation: days.length > 1,
							...props
						}, entry.instanceKey)), allDay.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPopover, {
							name: `查看 ${day.getMonth() + 1} 月 ${day.getDate()} 日无具体时间事项`,
							className: "all-day-more",
							label: `+${allDay.length - 1}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "calendar-date-items",
								children: allDay.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									"data-close-popover": true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarEntryCard, {
										entry,
										compact: true,
										...props
									})
								}, entry.instanceKey))
							})
						}) : null]
					}, localDateKey(day));
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: timelineRef,
				className: "time-grid-hours",
				style: { height },
				children: markerMinutes.map((minute) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: [
						"sparse-time-label",
						minute === timelineStart ? "is-start" : "",
						minute === timelineEnd ? "is-end" : ""
					].filter(Boolean).join(" "),
					style: { top: Math.min(height - 1, 10 + compactTimelineY(minute, scale)) },
					children: formatClockMarker(minute)
				}, minute))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "time-grid-days",
				style: { height },
				children: [markerMinutes.map((minute) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sparse-time-rule",
					style: { top: Math.min(height - 1, 10 + compactTimelineY(minute, scale)) }
				}, minute)), days.map((day, dayIndex) => {
					const entries = positionedEntriesByDay[dayIndex];
					const dayEntries = entriesByDay.get(day.getTime()) ?? [];
					const today = sameLocalDay(now.toISOString(), day);
					const nowMinute = displayClockMinutes(now, startMinute, endMinute);
					const nowTop = 10 + compactTimelineY(nowMinute, scale);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: today ? "time-day-column is-today" : "time-day-column",
						onDragOver: (event) => event.preventDefault(),
						onDrop: (event) => {
							const rect = event.currentTarget.getBoundingClientRect();
							const y = Math.max(0, Math.min(scale.height, event.clientY - rect.top - 10));
							const target = new Date(day);
							const targetMinute = Math.round(compactTimelineMinuteAtY(y, scale) / 15) * 15;
							target.setHours(0, targetMinute, 0, 0);
							handleDrop(event, target, true, props.onMove);
						},
						onDoubleClick: (event) => {
							if (event.target.closest("button, article")) return;
							const rect = event.currentTarget.getBoundingClientRect();
							const y = Math.max(0, Math.min(scale.height, event.clientY - rect.top - 10));
							const target = new Date(day);
							const targetMinute = Math.round(compactTimelineMinuteAtY(y, scale) / 15) * 15;
							target.setHours(0, targetMinute, 0, 0);
							props.onAdd(target, true);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayColors, { entries: dayEntries }),
							today && nowMinute >= scale.startMinute && nowMinute <= scale.endMinute ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "current-time-line",
								style: { top: nowTop }
							}) : null,
							entries.map(({ entry, top, height: entryHeight, lane, lanes }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: [
									"positioned-calendar-entry",
									lanes > 1 ? "is-concurrent" : "",
									entry.kind === "event" && entry.item.eventKind === "course" && Date.parse(entry.endAt) < now.getTime() ? "is-past-course" : ""
								].filter(Boolean).join(" "),
								style: {
									top,
									height: entryHeight,
									left: `calc(${lane / lanes * 100}% + 1px)`,
									width: `calc(${100 / lanes}% - 2px)`
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarEntryCard, {
									entry,
									summaryOnly: true,
									hideCourseLocation: days.length > 1,
									...props
								})
							}, entry.instanceKey))
						]
					}, localDateKey(day));
				})]
			})
		]
	});
}
function DayColors({ entries }) {
	const allDayEntries = entries.filter(isAllDayEntry);
	return allDayEntries.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "calendar-day-colors",
		"aria-hidden": "true",
		children: allDayEntries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { "--item-color": entry.color } }, entry.instanceKey))
	}) : null;
}
//#endregion
//#region components/views/calendar/candidate-pool.tsx
function CandidatePool({ candidates, limit, busyId, targetTaskId, targetNodeId, onLimitChange, onOpen, onDelete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPopover, {
		name: `待落实 ${candidates.length}`,
		openKey: targetTaskId || targetNodeId,
		label: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "待落实" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "candidate-count",
			children: candidates.length
		})] }),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "unscheduled-panel candidate-pool",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "candidate-list",
				children: candidates.length ? candidates.slice(0, limit).map((candidate) => {
					const candidateId = `${candidate.kind}-${candidate.item.id}`;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: [
							"unscheduled-item",
							candidate.kind === "task" && candidate.item.id === targetTaskId || candidate.kind === "node" && candidate.item.id === targetNodeId ? "is-target" : "",
							busyId === candidateId ? "is-busy" : ""
						].filter(Boolean).join(" "),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "candidate-open-button",
							"data-close-popover": true,
							type: "button",
							draggable: true,
							disabled: busyId !== null,
							onDragStart: (event) => setDragPayload(event, {
								kind: candidate.kind,
								id: candidate.item.id
							}),
							onClick: () => onOpen(candidate),
							children: [candidate.kind === "thought" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListTodo, { size: 14 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: busyId === candidateId ? "正在准备事项…" : candidate.kind === "thought" ? candidate.item.content : candidate.item.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: candidate.caption })] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "candidate-delete",
							type: "button",
							"aria-label": "删除待落实事项",
							onClick: () => onDelete(candidate),
							children: "×"
						})]
					}, candidateId);
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 18 }),
					title: "没有待落实内容"
				})
			}), candidates.length > limit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "candidate-more",
				type: "button",
				onClick: () => onLimitChange(candidates.length),
				children: [
					"查看其余 ",
					candidates.length - limit,
					" 项"
				]
			}) : candidates.length > 8 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "candidate-more",
				type: "button",
				onClick: () => onLimitChange(8),
				children: "收起"
			}) : null]
		})
	});
}
//#endregion
//#region components/views/calendar/calendar-toolbar.tsx
function CalendarToolbar({ view, onViewChange, children, onMove, onToday, onAdd, hideCourses, onHideCoursesChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "calendar-toolbar",
		"aria-label": "日历工具栏",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "calendar-navigation",
				"aria-label": "切换日期",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "calendar-tool calendar-tool-icon",
						type: "button",
						onClick: () => onMove(-1),
						"aria-label": "上一段时间",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 18 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "calendar-tool",
						type: "button",
						onClick: onToday,
						children: "今天"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "calendar-tool calendar-tool-icon",
						type: "button",
						onClick: () => onMove(1),
						"aria-label": "下一段时间",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 18 })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "calendar-view-select",
				"aria-label": "日历视图",
				value: view,
				onChange: (event) => onViewChange(event.target.value),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "overview",
						children: "周概览"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "timeline",
						children: "周时间轴"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "month",
						children: "月视图"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "calendar-toolbar-actions",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "calendar-tool calendar-add-button",
						type: "button",
						onClick: onAdd,
						"aria-label": "新增事项",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPlus, { size: 16 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "新增" })]
					}),
					children,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "calendar-tool",
						type: "button",
						"aria-pressed": hideCourses,
						onClick: () => onHideCoursesChange(!hideCourses),
						children: [hideCourses ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 16 }), hideCourses ? "显示课程表" : "隐藏课程表"]
					})
				]
			})
		]
	});
}
//#endregion
//#region components/views/calendar/calendar-workspace.tsx
function CalendarWorkspace({ mode, presentation, days, anchor, periodLabel, calendarProps, hideCourses }) {
	const entriesByDay = (0, import_react.useMemo)(() => entriesForDays(days, calendarProps, { hideCourses }), [
		calendarProps.blocks,
		calendarProps.events,
		calendarProps.itemColor,
		calendarProps.nodeColor,
		calendarProps.nodes,
		calendarProps.tasks,
		days,
		hideCourses
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: ["calendar-workspace", `calendar-${mode}`].filter(Boolean).join(" "),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "calendar-main",
			children: [mode === "month" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "calendar-period-heading",
				"aria-live": "polite",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: periodLabel })
			}) : null, mode === "month" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthCalendar, {
				days,
				anchor,
				entriesByDay,
				...calendarProps
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeGrid, {
				days,
				entriesByDay,
				presentation,
				...calendarProps
			})]
		})
	});
}
//#endregion
//#region components/views/calendar/calendar-quick-add-model.ts
function quickTaskEntries(rows) {
	return rows.map((row) => ({
		title: row.title.trim(),
		completed: row.completed
	})).filter((row) => row.title.length > 0);
}
function splitQuickTaskText(title, start, end, inserted) {
	return `${title.slice(0, start)}${inserted}${title.slice(end)}`.split(/\r\n|\r|\n/);
}
//#endregion
//#region components/views/calendar/calendar-quick-add-controller.ts
function emptyRow(title = "") {
	return {
		id: newId("quick-task"),
		title,
		completed: false
	};
}
function useCalendarQuickAdd({ initialRows, onSave, onClose }) {
	const [rows, setRows] = (0, import_react.useState)(() => initialRows?.length ? initialRows : [emptyRow()]);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [removed, setRemoved] = (0, import_react.useState)(null);
	const inputs = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const savingRef = (0, import_react.useRef)(false);
	const entries = quickTaskEntries(rows);
	(0, import_react.useEffect)(() => {
		const frame = requestAnimationFrame(() => inputs.current.values().next().value?.focus());
		return () => cancelAnimationFrame(frame);
	}, []);
	(0, import_react.useLayoutEffect)(() => {
		for (const input of inputs.current.values()) {
			input.style.height = "auto";
			input.style.height = `${input.scrollHeight + 2}px`;
		}
	}, [rows]);
	function focusRow(id) {
		requestAnimationFrame(() => {
			const input = inputs.current.get(id);
			input?.focus();
			input?.setSelectionRange(input.value.length, input.value.length);
		});
	}
	function updateRow(id, patch) {
		if (savingRef.current) return;
		setRows((current) => current.map((row) => row.id === id ? {
			...row,
			...patch
		} : row));
		setError("");
	}
	function addRow() {
		if (savingRef.current) return;
		const blank = rows.find((row) => !row.title.trim());
		if (blank) return focusRow(blank.id);
		const row = emptyRow();
		setRows((current) => [...current, row]);
		focusRow(row.id);
	}
	function insertText(id, start, end, text) {
		if (savingRef.current) return;
		const index = rows.findIndex((row) => row.id === id);
		const row = rows[index];
		if (!row) return;
		if (text === "\n" && !row.title.trim()) {
			focusRow(rows[index + 1]?.id ?? id);
			return;
		}
		const lines = splitQuickTaskText(row.title, start, end, text);
		const inserted = lines.slice(1).map((title) => emptyRow(title));
		setRows([
			...rows.slice(0, index),
			{
				...row,
				title: lines[0]
			},
			...inserted,
			...rows.slice(index + 1)
		]);
		setError("");
		focusRow(inserted.at(-1)?.id ?? id);
	}
	function removeRow(id) {
		if (savingRef.current) return;
		const index = rows.findIndex((row) => row.id === id);
		if (index < 0) return;
		if (rows[index].title.trim()) setRemoved({
			row: rows[index],
			index
		});
		const next = rows.filter((row) => row.id !== id);
		if (!next.length) next.push(emptyRow());
		setRows(next);
		setError("");
		focusRow(next[Math.max(0, index - 1)].id);
	}
	function undoRemove() {
		if (!removed || savingRef.current) return;
		const next = rows.filter((row) => row.title.trim());
		next.splice(Math.min(removed.index, next.length), 0, removed.row);
		setRows(next);
		focusRow(removed.row.id);
		setRemoved(null);
	}
	function close() {
		if (!savingRef.current) onClose(rows);
	}
	async function submit() {
		if (!entries.length || savingRef.current) return;
		savingRef.current = true;
		setSaving(true);
		setError("");
		try {
			await onSave(entries);
		} catch {
			setError("未能保存，内容已保留，请重试。");
		} finally {
			savingRef.current = false;
			setSaving(false);
		}
	}
	return {
		rows,
		entries,
		inputs,
		saving,
		error,
		removed,
		updateRow,
		addRow,
		insertText,
		removeRow,
		undoRemove,
		close,
		submit
	};
}
//#endregion
//#region components/views/calendar/calendar-quick-add.tsx
function CalendarQuickAdd(props) {
	const editor = useCalendarQuickAdd(props);
	const { rows, entries, saving, error } = editor;
	const dateLabel = new Intl.DateTimeFormat("zh-CN", {
		month: "long",
		day: "numeric",
		weekday: "short"
	}).format(props.date);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorShell, {
		title: `快速添加 · ${dateLabel}`,
		panelClassName: "calendar-quick-add-inspector",
		onClose: editor.close,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "calendar-quick-add-form",
			"aria-busy": saving,
			onSubmit: (event) => {
				event.preventDefault();
				editor.submit();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "calendar-quick-add-list",
					"aria-label": `${dateLabel}事项清单`,
					children: rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: row.completed ? "calendar-quick-add-row is-completed" : "calendar-quick-add-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "calendar-quick-add-check",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "sr-only",
									children: [
										"第 ",
										index + 1,
										" 项已完成"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									disabled: saving,
									checked: row.completed,
									onChange: (event) => editor.updateRow(row.id, { completed: event.target.checked })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								ref: (element) => {
									if (element) editor.inputs.current.set(row.id, element);
									else editor.inputs.current.delete(row.id);
								},
								className: "calendar-quick-add-title",
								rows: 1,
								disabled: saving,
								value: row.title,
								placeholder: "输入事项",
								"aria-label": `第 ${index + 1} 项内容`,
								autoComplete: "off",
								enterKeyHint: "next",
								onChange: (event) => {
									const title = event.target.value;
									if (/[\r\n]/.test(title) && !event.nativeEvent.isComposing) editor.insertText(row.id, 0, row.title.length, title);
									else editor.updateRow(row.id, { title });
								},
								onPaste: (event) => {
									const text = event.clipboardData.getData("text/plain");
									if (!/[\r\n]/.test(text)) return;
									event.preventDefault();
									editor.insertText(row.id, event.currentTarget.selectionStart, event.currentTarget.selectionEnd, text);
								},
								onKeyDown: (event) => {
									if (event.nativeEvent.isComposing || event.keyCode === 229) return;
									if (event.key === "Enter") {
										event.preventDefault();
										if (event.ctrlKey || event.metaKey) editor.submit();
										else editor.insertText(row.id, event.currentTarget.selectionStart, event.currentTarget.selectionEnd, "\n");
									} else if (event.key === "Backspace" && !row.title && rows.length > 1) {
										event.preventDefault();
										editor.removeRow(row.id);
									}
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: saving,
								className: "calendar-quick-add-remove",
								"aria-label": `移除第 ${index + 1} 项`,
								onClick: () => editor.removeRow(row.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
									size: 16,
									"aria-hidden": "true"
								})
							})
						]
					}, row.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "calendar-quick-add-footer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "icon-button calendar-quick-add-more",
						type: "button",
						"aria-label": "添加一行",
						title: "添加一行",
						disabled: saving,
						onClick: editor.addRow,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							size: 16,
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "calendar-quick-add-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "secondary-button",
							type: "button",
							"aria-label": "暂存草稿并关闭",
							onClick: editor.close,
							disabled: saving,
							children: "暂存"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "primary-button",
							type: "submit",
							disabled: !entries.length || saving,
							children: saving ? "正在添加…" : entries.length ? `添加 ${entries.length} 项` : "添加"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "calendar-quick-add-status",
					children: error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						role: "alert",
						children: error
					}) : editor.removed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "calendar-quick-add-undo",
						role: "status",
						children: ["已移除一行", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "text-button",
							type: "button",
							disabled: saving,
							onClick: editor.undoRemove,
							children: "撤销"
						})]
					}) : null
				})
			]
		})
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/log-out.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var LogOut = createLucideIcon("LogOut", [
	["path", {
		d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
		key: "1uf3rs"
	}],
	["polyline", {
		points: "16 17 21 12 16 7",
		key: "1gabdz"
	}],
	["line", {
		x1: "21",
		x2: "9",
		y1: "12",
		y2: "12",
		key: "1uyos4"
	}]
]);
//#endregion
//#region components/views/calendar/course-task-panel.tsx
function CourseTaskPanel({ occurrence, canUndoCourseChange, onClose, onEdit, onRemoveFromCourse, onUndoCourseChange }) {
	const { addTask, tasks, settings, toggleTask } = usePlanner();
	const [title, setTitle] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [removingTaskId, setRemovingTaskId] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const occurrenceDate = localDateKey(new Date(occurrence.startAt));
	const courseTasks = (0, import_react.useMemo)(() => tasks.filter((task) => task.planningState !== "draft" && taskBelongsToCourseOccurrence(task, occurrence.event.id, occurrenceDate)).sort((left, right) => (left.scheduledStartAt ?? "").localeCompare(right.scheduledStartAt ?? "")), [
		occurrence.event.id,
		occurrenceDate,
		tasks
	]);
	async function createTask(event) {
		event.preventDefault();
		const nextTitle = title.trim();
		if (!nextTitle || saving) return;
		setSaving(true);
		setError("");
		try {
			const slot = nextCourseTaskSlot(occurrence.startAt, occurrence.endAt, courseTasks);
			const due = new Date(occurrence.startAt);
			due.setHours(23, 59, 0, 0);
			const ordinaryType = settings.itemTypes.find((type) => type.id !== "course" && type.id !== "deadline" && type.name.trim().toLowerCase() !== "deadline");
			await addTask({
				title: nextTitle,
				planningState: "planned",
				taskKind: "ordinary",
				dueAt: due.toISOString(),
				scheduledStartAt: slot.startAt,
				durationMinutes: slot.durationMinutes,
				isAllDay: false,
				recurrenceRule: null,
				itemTypeId: ordinaryType?.id ?? "research",
				courseEventId: occurrence.event.id,
				courseOccurrenceDate: occurrenceDate
			});
			setTitle("");
		} catch {
			setError("没有创建成功，请重试。");
		} finally {
			setSaving(false);
		}
	}
	async function removeTask(task) {
		if (removingTaskId) return;
		setRemovingTaskId(task.id);
		setError("");
		try {
			await onRemoveFromCourse(task);
		} catch {
			setError("没有移出成功，请重试。");
		} finally {
			setRemovingTaskId(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorShell, {
		title: "本节课 · " + occurrence.event.title,
		panelClassName: "course-task-inspector",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "course-task-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "course-task-summary",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: occurrenceDate }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
							formatTime(occurrence.startAt),
							"–",
							formatTime(occurrence.endAt)
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "新增事项会优先安排在本节课剩余时段内，之后仍可单独调整。" })
					]
				}),
				canUndoCourseChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "course-task-undo",
					role: "status",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "刚才的课程安排可以恢复。" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "course-task-action",
						type: "button",
						onClick: () => void onUndoCourseChange(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { size: 14 }), " 撤销刚才的课程安排变更"]
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "course-task-quick-add",
					onSubmit: createTask,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "这节课准备做什么？" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: title,
						onChange: (event) => setTitle(event.target.value),
						placeholder: "例如：整理实验记录"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "primary-button",
						type: "submit",
						disabled: !title.trim() || saving,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }),
							" ",
							saving ? "添加中…" : "添加事项"
						]
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "course-task-error",
					role: "status",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "course-task-list",
					"aria-label": "本节课的事项",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "section-heading",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "已安排" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [courseTasks.length, " 项"] })]
					}), courseTasks.length ? courseTasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: task.status === "completed" ? "course-task-row is-completed" : "course-task-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "item-inline-check",
								type: "button",
								"aria-label": (task.status === "completed" ? "恢复 " : "完成 ") + task.title,
								onClick: () => void toggleTask(task.id, task.scheduledStartAt ?? void 0),
								children: task.status === "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { size: 13 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "course-task-open",
								type: "button",
								onClick: () => onEdit(task),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: task.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [task.scheduledStartAt ? formatTime(task.scheduledStartAt) : "待安排", task.scheduledStartAt && task.durationMinutes ? "–" + formatTime(new Date(new Date(task.scheduledStartAt).getTime() + task.durationMinutes * 6e4).toISOString()) : ""] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "course-task-action course-task-remove",
								type: "button",
								disabled: removingTaskId !== null,
								"aria-label": "将 " + task.title + " 移出本节课",
								title: "移出本节课并返回待落实",
								onClick: () => void removeTask(task),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { size: 13 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: removingTaskId === task.id ? "移出中…" : "移出" })]
							})
						]
					}, task.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "course-task-empty",
						children: "还没有安排事项。"
					})]
				})
			]
		})
	});
}
//#endregion
//#region components/views/calendar/calendar-controller.ts
function useCalendarController() {
	const planner = usePlanner();
	const { intent } = useAppNavigation();
	const { tasks, events, thoughts, goals, projects, projectNodes, scheduleBlocks, settings, addTasks, addScheduleBlock, deleteScheduleBlock, convertThoughtToDraft, updateTask, updateEvent, updateScheduleBlock, toggleTask, completeScheduleBlock, deleteTask, deleteProjectNode, updateThoughtStatus } = planner;
	const [mode, setMode] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return "week";
		const remembered = window.sessionStorage.getItem("quiet-plan-calendar-mode");
		return remembered === "month" || remembered === "week" ? remembered : "week";
	});
	const [hideCourses, setHideCourses] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return false;
		return window.sessionStorage.getItem("quiet-plan-calendar-hide-courses") === "true";
	});
	const [anchor, setAnchor] = (0, import_react.useState)(startOfLocalDay(/* @__PURE__ */ new Date()));
	const [candidateLimit, setCandidateLimit] = (0, import_react.useState)(8);
	const [itemComposer, setItemComposer] = (0, import_react.useState)(false);
	const [quickAddDate, setQuickAddDate] = (0, import_react.useState)(null);
	const [quickAddDrafts, setQuickAddDrafts] = (0, import_react.useState)({});
	const [composerDate, setComposerDate] = (0, import_react.useState)();
	const [editingTask, setEditingTask] = (0, import_react.useState)(null);
	const [taskOccurrenceAt, setTaskOccurrenceAt] = (0, import_react.useState)();
	const [prefillDraftDate, setPrefillDraftDate] = (0, import_react.useState)(false);
	const [composerWithTime, setComposerWithTime] = (0, import_react.useState)(false);
	const [editingEvent, setEditingEvent] = (0, import_react.useState)(null);
	const [courseTaskOccurrence, setCourseTaskOccurrence] = (0, import_react.useState)(null);
	const [blockSource, setBlockSource] = (0, import_react.useState)(null);
	const [editingBlock, setEditingBlock] = (0, import_react.useState)(null);
	const [completionBlock, setCompletionBlock] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)("");
	const undoMoveRef = (0, import_react.useRef)(null);
	const [canUndoMove, setCanUndoMove] = (0, import_react.useState)(false);
	const [candidateBusy, setCandidateBusy] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		window.sessionStorage.setItem("quiet-plan-calendar-mode", mode);
	}, [mode]);
	(0, import_react.useEffect)(() => {
		window.sessionStorage.setItem("quiet-plan-calendar-hide-courses", String(hideCourses));
	}, [hideCourses]);
	(0, import_react.useEffect)(() => {
		if (!notice) return;
		const timeout = window.setTimeout(() => {
			setNotice("");
			if (!courseTaskOccurrence) {
				undoMoveRef.current = null;
				setCanUndoMove(false);
			}
		}, 5e3);
		return () => window.clearTimeout(timeout);
	}, [courseTaskOccurrence, notice]);
	function showNotice(message) {
		undoMoveRef.current = null;
		setCanUndoMove(false);
		setNotice(message);
	}
	function offerMoveUndo(message, undo) {
		undoMoveRef.current = undo;
		setCanUndoMove(true);
		setNotice(message);
	}
	async function undoLastMove() {
		const undo = undoMoveRef.current;
		if (!undo) return;
		undoMoveRef.current = null;
		setCanUndoMove(false);
		try {
			if (undo.kind === "task") await updateTask(undo.id, undo.patch);
			else if (undo.kind === "event") await updateEvent(undo.id, undo.patch);
			else if (undo.kind === "block") await updateScheduleBlock(undo.id, undo.patch);
			else await deleteScheduleBlock(undo.id);
			setNotice("已撤销移动");
		} catch {
			setNotice("撤销失败，请重试。");
		}
	}
	const candidates = (0, import_react.useMemo)(() => {
		const scheduledNodeIds = new Set(scheduleBlocks.filter((block) => block.status === "planned").map((block) => block.sourceId));
		const parentNodeIds = new Set(projectNodes.map((node) => node.parentId).filter((id) => Boolean(id)));
		const nodesById = new Map(projectNodes.map((node) => [node.id, node]));
		const projectsById = new Map(projects.map((project) => [project.id, project]));
		const goalsById = new Map(goals.map((goal) => [goal.id, goal]));
		const pathFor = (node) => {
			const project = projectsById.get(node.projectId);
			const goal = project ? goalsById.get(project.goalId) : void 0;
			const names = [];
			let current = node.parentId ? nodesById.get(node.parentId) : void 0;
			while (current) {
				names.unshift(current.title);
				current = current.parentId ? nodesById.get(current.parentId) : void 0;
			}
			return [
				goal?.name,
				project?.title,
				...names
			].filter(Boolean).join(" › ");
		};
		const leaves = projectNodes.filter((node) => node.status === "open" && node.isFocused && !parentNodeIds.has(node.id) && !scheduledNodeIds.has(node.id)).map((item) => ({
			kind: "node",
			item,
			caption: `当前推进 · ${pathFor(item)}`
		}));
		const draftTasks = tasks.filter((task) => task.status === "open" && task.planningState === "draft").map((item) => ({
			kind: "task",
			item,
			caption: taskTimingSummary(item)
		}));
		const openThoughts = thoughts.filter((thought) => thought.status === "inbox").map((item) => ({
			kind: "thought",
			item,
			caption: "Quick Thought · 先转为事项再安排"
		}));
		return [
			...draftTasks,
			...leaves,
			...openThoughts
		].slice(0, 24);
	}, [
		goals,
		projectNodes,
		projects,
		scheduleBlocks,
		tasks,
		thoughts
	]);
	const days = (0, import_react.useMemo)(() => mode === "week" ? daysFrom(startOfWeek(anchor), 7) : daysFrom(startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1)), 42), [anchor, mode]);
	const periodLabel = (0, import_react.useMemo)(() => mode === "month" ? `${anchor.getFullYear()} 年 ${anchor.getMonth() + 1} 月` : "", [anchor, mode]);
	function move(direction) {
		const next = new Date(anchor);
		if (mode === "week") next.setDate(next.getDate() + direction * 7);
		if (mode === "month") next.setMonth(next.getMonth() + direction);
		setAnchor(next);
	}
	function addItemForDate(date, withTime = false) {
		setComposerDate(date);
		setPrefillDraftDate(true);
		setComposerWithTime(withTime);
		setEditingTask(null);
		setItemComposer(true);
	}
	function openQuickAdd(date) {
		closeTaskComposer();
		setQuickAddDate(new Date(date));
	}
	function closeQuickAdd(rows) {
		if (!quickAddDate) return;
		const key = localDateKey(quickAddDate);
		setQuickAddDrafts((current) => ({
			...current,
			[key]: rows
		}));
		setQuickAddDate(null);
	}
	async function saveQuickTasks(entries) {
		if (!quickAddDate) return;
		const due = new Date(quickAddDate);
		due.setHours(23, 59, 0, 0);
		await addTasks(entries.map((entry) => ({
			title: entry.title,
			status: entry.completed ? "completed" : "open",
			planningState: "planned",
			dueAt: due.toISOString(),
			scheduledStartAt: null,
			durationMinutes: null,
			isAllDay: false
		})));
		const key = localDateKey(quickAddDate);
		setQuickAddDrafts((current) => {
			const next = { ...current };
			delete next[key];
			return next;
		});
		const dateLabel = new Intl.DateTimeFormat("zh-CN", {
			month: "long",
			day: "numeric"
		}).format(quickAddDate);
		setQuickAddDate(null);
		const completed = entries.filter((entry) => entry.completed).length;
		showNotice(`${dateLabel} 已添加 ${entries.length} 项${completed ? `，其中 ${completed} 项已完成` : "，均为待安排"}`);
	}
	async function moveItem(payload, targetDate, withTime) {
		const date = localDateKey(targetDate);
		if (payload.kind === "thought") {
			const task = await convertThoughtToDraft(payload.id);
			if (!task) return;
			const due = new Date(targetDate);
			due.setHours(23, 59, 0, 0);
			await updateTask(task.id, {
				planningState: "planned",
				dueAt: due.toISOString(),
				scheduledStartAt: withTime ? targetDate.toISOString() : null
			});
			showNotice("想法已转为事项并安排，可从来源追溯");
			return;
		}
		if (payload.kind === "node") {
			const end = withTime ? new Date(targetDate.getTime() + 60 * 6e4).toISOString() : null;
			offerMoveUndo("项目步骤已安排", {
				kind: "new-block",
				id: (await addScheduleBlock({
					sourceType: "projectNode",
					sourceId: payload.id,
					date,
					startAt: withTime ? targetDate.toISOString() : null,
					endAt: end
				})).id
			});
			return;
		}
		if (payload.kind === "task") {
			const task = tasks.find((item) => item.id === payload.id);
			if (!task) return;
			if (task.recurrenceRule) {
				showNotice("重复事项请在编辑器中调整系列时间。");
				return;
			}
			const due = new Date(targetDate);
			due.setHours(23, 59, 0, 0);
			let scheduledStartAt = withTime ? targetDate.toISOString() : null;
			if (!withTime && task.scheduledStartAt) {
				const previous = new Date(task.scheduledStartAt);
				const moved = new Date(targetDate);
				moved.setHours(previous.getHours(), previous.getMinutes(), 0, 0);
				scheduledStartAt = moved.toISOString();
			}
			await updateTask(task.id, {
				planningState: "planned",
				dueAt: due.toISOString(),
				scheduledStartAt
			});
			offerMoveUndo("事项已移动", {
				kind: "task",
				id: task.id,
				patch: {
					planningState: task.planningState,
					dueAt: task.dueAt,
					scheduledStartAt: task.scheduledStartAt
				}
			});
			return;
		}
		if (payload.kind === "block") {
			const block = scheduleBlocks.find((item) => item.id === payload.id);
			if (!block) return;
			if (!withTime || !block.startAt || !block.endAt) {
				await updateScheduleBlock(block.id, {
					date,
					startAt: withTime ? targetDate.toISOString() : null,
					endAt: withTime ? new Date(targetDate.getTime() + 60 * 6e4).toISOString() : null
				});
				offerMoveUndo("时间块已移动", {
					kind: "block",
					id: block.id,
					patch: {
						date: block.date,
						startAt: block.startAt,
						endAt: block.endAt
					}
				});
				return;
			}
			const duration = new Date(block.endAt).getTime() - new Date(block.startAt).getTime();
			await updateScheduleBlock(block.id, {
				date,
				startAt: targetDate.toISOString(),
				endAt: new Date(targetDate.getTime() + duration).toISOString()
			});
			offerMoveUndo("时间块已移动", {
				kind: "block",
				id: block.id,
				patch: {
					date: block.date,
					startAt: block.startAt,
					endAt: block.endAt
				}
			});
			return;
		}
		const event = events.find((item) => item.id === payload.id);
		if (!event) return;
		if (event.recurrenceRule) {
			showNotice("重复日程请在编辑器中调整系列时间。");
			return;
		}
		const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
		await updateEvent(event.id, {
			startAt: targetDate.toISOString(),
			endAt: new Date(targetDate.getTime() + duration).toISOString()
		});
		offerMoveUndo("日程已移动", {
			kind: "event",
			id: event.id,
			patch: {
				startAt: event.startAt,
				endAt: event.endAt
			}
		});
	}
	async function moveItemToCourse(payload, event, startAt, endAt) {
		if (payload.kind !== "task" && payload.kind !== "thought") {
			showNotice("课程内只能安排事项；请先将项目步骤转为事项。");
			return;
		}
		const converted = payload.kind === "thought";
		const task = converted ? await convertThoughtToDraft(payload.id) : tasks.find((item) => item.id === payload.id) ?? null;
		if (!task) return;
		if (task.recurrenceRule) {
			showNotice("重复事项请先在编辑器中取消重复，再安排到课程内。");
			return;
		}
		const occurrenceDate = localDateKey(new Date(startAt));
		const slot = nextCourseTaskSlot(startAt, endAt, tasks.filter((item) => item.id !== task.id && item.planningState !== "draft" && taskBelongsToCourseOccurrence(item, event.id, occurrenceDate)).sort((left, right) => (left.scheduledStartAt ?? "").localeCompare(right.scheduledStartAt ?? "")));
		const due = new Date(startAt);
		due.setHours(23, 59, 0, 0);
		await updateTask(task.id, {
			planningState: "planned",
			dueAt: due.toISOString(),
			scheduledStartAt: slot.startAt,
			durationMinutes: slot.durationMinutes,
			isAllDay: false,
			courseEventId: event.id,
			courseOccurrenceDate: occurrenceDate
		});
		setCourseTaskOccurrence({
			event,
			startAt,
			endAt
		});
		if (converted) {
			showNotice(`想法已转为事项并安排到 ${event.title}`);
			return;
		}
		offerMoveUndo(`事项已安排到 ${event.title}`, {
			kind: "task",
			id: task.id,
			patch: {
				planningState: task.planningState,
				dueAt: task.dueAt,
				scheduledStartAt: task.scheduledStartAt,
				durationMinutes: task.durationMinutes,
				isAllDay: task.isAllDay,
				courseEventId: task.courseEventId,
				courseOccurrenceDate: task.courseOccurrenceDate
			}
		});
	}
	async function removeTaskFromCourse(task) {
		if (!task.courseEventId || !task.courseOccurrenceDate) return;
		await updateTask(task.id, {
			planningState: "draft",
			dueAt: null,
			scheduledStartAt: null,
			isAllDay: false,
			courseEventId: null,
			courseOccurrenceDate: null
		});
		offerMoveUndo("事项已移出课程并返回待落实", {
			kind: "task",
			id: task.id,
			patch: {
				planningState: task.planningState,
				dueAt: task.dueAt,
				scheduledStartAt: task.scheduledStartAt,
				isAllDay: task.isAllDay,
				courseEventId: task.courseEventId,
				courseOccurrenceDate: task.courseOccurrenceDate
			}
		});
	}
	async function deleteCandidate(candidate) {
		if (candidate.kind === "task") await deleteTask(candidate.item.id);
		else if (candidate.kind === "node") await deleteProjectNode(candidate.item.id);
		else await updateThoughtStatus([candidate.item.id], "deleted", "已删除");
	}
	function openCandidate(candidate) {
		if (candidate.kind === "task") {
			setEditingTask(candidate.item);
			setComposerDate(anchor);
			setPrefillDraftDate(true);
			setComposerWithTime(false);
			return;
		}
		if (candidate.kind === "node") {
			setBlockSource(candidate.item);
			setComposerDate(anchor);
			return;
		}
		setCandidateBusy(`${candidate.kind}-${candidate.item.id}`);
		convertThoughtToDraft(candidate.item.id).then((task) => {
			if (!task) return;
			setEditingTask(task);
			setComposerDate(anchor);
			setPrefillDraftDate(true);
			setComposerWithTime(false);
		}).catch(() => showNotice("没有转换成功，请重试。")).finally(() => setCandidateBusy(null));
	}
	function openBlock(block) {
		setBlockSource(block.sourceType === "task" ? tasks.find((task) => task.id === block.sourceId) ?? null : projectNodes.find((node) => node.id === block.sourceId) ?? null);
		setEditingBlock(block);
	}
	async function requestBlockCompletion(block) {
		if (block.status === "performed") {
			await updateScheduleBlock(block.id, { status: "planned" });
			return;
		}
		if (scheduleBlocks.filter((candidate) => candidate.sourceType === block.sourceType && candidate.sourceId === block.sourceId && candidate.status === "planned").length > 1) setCompletionBlock(block);
		else await completeScheduleBlock(block.id, "item");
	}
	async function completeSelectedBlock(scope) {
		if (!completionBlock) return;
		const block = completionBlock;
		setCompletionBlock(null);
		try {
			await completeScheduleBlock(block.id, scope);
			showNotice(scope === "block" ? "已完成当前时间块" : "已完成整个事项");
		} catch {
			showNotice("没有完成成功，请重试。");
		}
	}
	const itemColor = (0, import_react.useCallback)((item) => item.colorOverride || settings.itemTypes.find((type) => type.id === item.itemTypeId)?.color || settings.itemTypes[0]?.color || "#AFC3D4", [settings.itemTypes]);
	const nodeColor = (0, import_react.useCallback)((node) => {
		const project = projects.find((item) => item.id === node.projectId);
		return goals.find((goal) => goal.id === project?.goalId)?.color ?? "#AFC3D4";
	}, [goals, projects]);
	const calendarProps = {
		tasks,
		events,
		blocks: scheduleBlocks,
		nodes: projectNodes,
		goals,
		projects,
		displayStart: settings.calendarDisplayStart,
		displayEnd: settings.calendarDisplayEnd,
		itemColor,
		nodeColor,
		onTask: openTask,
		onTaskComplete: (task, occurrenceAt) => {
			toggleTask(task.id, occurrenceAt).catch(() => showNotice("完成状态更新失败，请重试。"));
		},
		onEvent: (event, occurrenceAt) => setEditingEvent({
			event,
			occurrenceAt
		}),
		onCourseTasks: (event, startAt, endAt) => setCourseTaskOccurrence({
			event,
			startAt,
			endAt
		}),
		onCourseDrop: moveItemToCourse,
		onEventComplete: (event) => void updateEvent(event.id, {
			status: event.status === "completed" ? "open" : "completed",
			completedAt: event.status === "completed" ? null : (/* @__PURE__ */ new Date()).toISOString()
		}),
		onBlock: openBlock,
		onBlockComplete: (block) => void requestBlockCompletion(block),
		onAdd: addItemForDate,
		onQuickAdd: openQuickAdd,
		onMove: moveItem
	};
	function openTask(task, occurrenceAt) {
		setItemComposer(false);
		setTaskOccurrenceAt(occurrenceAt);
		setEditingTask(task);
	}
	function closeTaskComposer() {
		setTaskOccurrenceAt(void 0);
		setItemComposer(false);
		setEditingTask(null);
		setComposerDate(void 0);
		setPrefillDraftDate(false);
		setComposerWithTime(false);
	}
	function closeScheduleComposer() {
		setBlockSource(null);
		setEditingBlock(null);
		setComposerDate(void 0);
	}
	function closeCourseTaskPanel() {
		setCourseTaskOccurrence(null);
		if (notice) return;
		undoMoveRef.current = null;
		setCanUndoMove(false);
	}
	function changeMode(nextMode) {
		setMode(nextMode);
	}
	function goToday() {
		setAnchor(startOfLocalDay(/* @__PURE__ */ new Date()));
	}
	return {
		mode,
		hideCourses,
		anchor,
		candidateLimit,
		itemComposer,
		quickAddDate,
		quickAddDraft: quickAddDate ? quickAddDrafts[localDateKey(quickAddDate)] : void 0,
		composerDate,
		editingTask,
		taskOccurrenceAt,
		prefillDraftDate,
		composerWithTime,
		editingEvent,
		blockSource,
		courseTaskOccurrence,
		editingBlock,
		completionBlock,
		notice,
		canUndoMove,
		candidateBusy,
		candidates,
		days,
		periodLabel,
		targetTaskId: intent.taskId,
		targetNodeId: intent.nodeId,
		calendarProps,
		changeMode,
		setHideCourses,
		move,
		goToday,
		setCandidateLimit,
		addItemForDate,
		openQuickAdd,
		closeQuickAdd,
		saveQuickTasks,
		deleteCandidate,
		openCandidate,
		closeTaskComposer,
		closeScheduleComposer,
		openTask,
		setEditingEvent,
		setCompletionBlock,
		closeCourseTaskPanel,
		completeSelectedBlock,
		removeTaskFromCourse,
		undoLastMove
	};
}
//#endregion
//#region components/views/calendar/calendar-view.tsx
function PlanView() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarView, {});
}
function CalendarView() {
	const calendar = useCalendarController();
	const [presentation, setPresentation] = (0, import_react.useState)("overview");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "calendar-page-layout",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarToolbar, {
				view: calendar.mode === "month" ? "month" : presentation,
				onViewChange: (view) => {
					if (view !== "month") setPresentation(view);
					calendar.changeMode(view === "month" ? "month" : "week");
				},
				onMove: calendar.move,
				onToday: calendar.goToday,
				onAdd: () => calendar.addItemForDate(calendar.anchor),
				hideCourses: calendar.hideCourses,
				onHideCoursesChange: calendar.setHideCourses,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandidatePool, {
					candidates: calendar.candidates,
					limit: calendar.candidateLimit,
					busyId: calendar.candidateBusy,
					targetTaskId: calendar.targetTaskId,
					targetNodeId: calendar.targetNodeId,
					onLimitChange: calendar.setCandidateLimit,
					onOpen: calendar.openCandidate,
					onDelete: (candidate) => void calendar.deleteCandidate(candidate)
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "calendar-page-main",
				children: [calendar.notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "inline-toast calendar-move-toast",
					role: "status",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: calendar.notice }), calendar.canUndoMove ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "text-button",
						type: "button",
						onClick: () => void calendar.undoLastMove(),
						children: "撤销"
					}) : null]
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarWorkspace, {
					mode: calendar.mode,
					presentation,
					days: calendar.days,
					anchor: calendar.anchor,
					periodLabel: calendar.periodLabel,
					calendarProps: calendar.calendarProps,
					hideCourses: calendar.hideCourses
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskComposer, {
			open: calendar.itemComposer || Boolean(calendar.editingTask),
			task: calendar.editingTask,
			occurrenceAt: calendar.taskOccurrenceAt,
			defaultDate: calendar.composerDate,
			defaultTime: calendar.composerWithTime,
			prefillDraftDate: calendar.prefillDraftDate,
			onQuickAdd: calendar.openQuickAdd,
			onClose: calendar.closeTaskComposer
		}),
		calendar.quickAddDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarQuickAdd, {
			date: calendar.quickAddDate,
			initialRows: calendar.quickAddDraft,
			onClose: calendar.closeQuickAdd,
			onSave: calendar.saveQuickTasks
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventComposer, {
			open: Boolean(calendar.editingEvent),
			event: calendar.editingEvent?.event,
			occurrenceAt: calendar.editingEvent?.occurrenceAt,
			onClose: () => calendar.setEditingEvent(null)
		}),
		calendar.courseTaskOccurrence ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CourseTaskPanel, {
			occurrence: calendar.courseTaskOccurrence,
			canUndoCourseChange: calendar.canUndoMove,
			onClose: calendar.closeCourseTaskPanel,
			onUndoCourseChange: calendar.undoLastMove,
			onRemoveFromCourse: calendar.removeTaskFromCourse,
			onEdit: (task) => {
				calendar.closeCourseTaskPanel();
				calendar.openTask(task);
			}
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScheduleBlockComposer, {
			open: Boolean(calendar.blockSource),
			source: calendar.blockSource,
			block: calendar.editingBlock,
			defaultDate: calendar.composerDate ?? calendar.anchor,
			onClose: calendar.closeScheduleComposer
		}),
		calendar.completionBlock ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompletionChoice, {
			onClose: () => calendar.setCompletionBlock(null),
			onComplete: calendar.completeSelectedBlock
		}) : null
	] });
}
//#endregion
export { CalendarView, PlanView };
