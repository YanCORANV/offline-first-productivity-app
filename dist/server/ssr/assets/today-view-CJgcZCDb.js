import { l as __toESM, n as require_jsx_runtime, o as require_react } from "../index.js";
import { D as formatGapDuration, E as compactTimelineY, G as localDateKey, H as formatTime, M as taskTitleForBlock, O as resolveTimelineWindow, R as eventOccurrenceOnDay, S as recommendationTargetDate, V as formatFullDate, Z as startOfLocalDay, b as freeTimeRanges, d as EmptyState, et as taskOccurrencesOnDay, h as usePlanner, i as Check, k as timelineOffsetMinutes, n as X, p as createLucideIcon, r as Circle, t as TaskRow, u as PageHeader, w as buildCompactTimelineScale, x as recommendCandidatesForGaps, y as buildAdvanceCandidates } from "./ui-CjSwuoD-.js";
import { n as useAppNavigation } from "./app-navigation-DNXAglzE.js";
import { i as InspectorShell, n as EventComposer, r as TaskComposer, t as ScheduleBlockComposer } from "./composers-CfWdIHDn.js";
import { t as Trash2 } from "./trash-2-DHjjW3NH.js";
import { t as ChevronRight } from "./chevron-right-0GZKBAFw.js";
import { n as Eye, t as EyeOff } from "./eye-off-lo9wt4vt.js";
//#region node_modules/lucide-react/dist/esm/icons/moon.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Moon = createLucideIcon("Moon", [["path", {
	d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
	key: "a7tn18"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/sunrise.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Sunrise = createLucideIcon("Sunrise", [
	["path", {
		d: "M12 2v8",
		key: "1q4o3n"
	}],
	["path", {
		d: "m4.93 10.93 1.41 1.41",
		key: "2a7f42"
	}],
	["path", {
		d: "M2 18h2",
		key: "j10viu"
	}],
	["path", {
		d: "M20 18h2",
		key: "wocana"
	}],
	["path", {
		d: "m19.07 10.93-1.41 1.41",
		key: "15zs5n"
	}],
	["path", {
		d: "M22 22H2",
		key: "19qnx5"
	}],
	["path", {
		d: "m8 6 4-4 4 4",
		key: "ybng9g"
	}],
	["path", {
		d: "M16 18a4 4 0 0 0-8 0",
		key: "1lzouq"
	}]
]);
//#endregion
//#region components/views/today/today-time-grid.tsx
var import_jsx_runtime = require_jsx_runtime();
var HOUR_HEIGHT = 60;
var TIMELINE_PADDING = 18;
function TodayTimeGrid({ entries, now, displayStart, displayEnd, onTask, onEvent, onBlock, onTaskComplete, onEventComplete, onBlockComplete }) {
	const timelineWindow = resolveTimelineWindow(now, displayStart, displayEnd, entries.map((entry) => ({
		startAt: entry.at,
		endAt: entry.endAt
	})));
	const scale = buildCompactTimelineScale(0, timelineWindow.totalMinutes, entries.map((entry) => ({
		startMinute: timelineOffsetMinutes(entry.at, timelineWindow),
		endMinute: Math.max(timelineOffsetMinutes(entry.at, timelineWindow) + 20, timelineOffsetMinutes(entry.endAt, timelineWindow))
	})), HOUR_HEIGHT);
	const height = Math.max(150, scale.height + TIMELINE_PADDING * 2);
	const currentMinute = timelineOffsetMinutes(now, timelineWindow);
	const currentTop = TIMELINE_PADDING + compactTimelineY(currentMinute, scale);
	const positionedEntries = positionTodayEntries(entries);
	const markerTimes = Array.from(new Map([
		timelineWindow.start,
		...entries.map((entry) => new Date(entry.at)),
		...entries.map((entry) => new Date(entry.endAt)),
		timelineWindow.end
	].map((value) => [value.getTime(), value])).values()).sort((a, b) => a.getTime() - b.getTime());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "today-spatial-timeline",
		style: { height },
		children: [
			markerTimes.map((marker) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: [
					"today-time-marker",
					marker.getTime() === timelineWindow.start.getTime() ? "is-start" : "",
					marker.getTime() === timelineWindow.end.getTime() ? "is-end" : ""
				].filter(Boolean).join(" "),
				style: { top: Math.min(height - 1, TIMELINE_PADDING + compactTimelineY(timelineOffsetMinutes(marker, timelineWindow), scale)) },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { children: formatTime(marker.toISOString()) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})]
			}, marker.getTime())),
			scale.segments.filter((segment) => segment.isGap && segment.endMinute - segment.startMinute > 20).map((segment) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "timeline-gap-label",
				style: {
					top: TIMELINE_PADDING + segment.top,
					height: segment.height
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatGapDuration(segment.endMinute - segment.startMinute) })
			}, `${segment.startMinute}-${segment.endMinute}`)),
			currentMinute >= 0 && currentMinute <= scale.endMinute ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "today-current-line",
				style: { top: currentTop }
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "today-event-layer",
				children: positionedEntries.map(({ entry, lane, lanes }) => {
					const startMinute = timelineOffsetMinutes(entry.at, timelineWindow);
					const endMinute = timelineOffsetMinutes(entry.endAt, timelineWindow);
					const top = TIMELINE_PADDING + compactTimelineY(startMinute, scale);
					const entryHeight = Math.max(30, compactTimelineY(endMinute, scale) - compactTimelineY(startMinute, scale));
					const completed = entry.kind === "task" ? entry.item.status === "completed" : entry.kind === "event" ? entry.item.status === "completed" : entry.item.status === "performed";
					const failed = entry.kind === "task" && entry.item.status === "failed";
					const event = entry.kind === "event" ? entry.item : null;
					const isCourse = event?.eventKind === "course";
					const eventLocation = event?.location ?? null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: `today-time-item ${completed ? "is-completed" : ""} ${failed ? "is-failed" : ""}`,
						style: {
							"--item-color": entry.color,
							top,
							height: entryHeight,
							left: `${lane / lanes * 100}%`,
							width: `calc(${100 / lanes}% - 3px)`
						},
						children: [!isCourse ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "item-inline-check",
							type: "button",
							onClick: () => {
								if (entry.kind === "task") onTaskComplete(entry.item, entry.at);
								else if (entry.kind === "event") onEventComplete(entry.item);
								else onBlockComplete(entry.item);
							},
							children: failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12 }) : completed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { size: 13 })
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								if (entry.kind === "task") onTask(entry.item);
								else if (entry.kind === "event") onEvent(entry.item);
								else onBlock(entry.item);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("time", { children: [formatTime(entry.at), entry.endAt !== entry.at ? `–${formatTime(entry.endAt)}` : ""] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: entry.title }),
								entry.timingLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: entry.timingLabel }) : eventLocation ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: eventLocation }) : null
							]
						})]
					}, entry.instanceKey ?? `${entry.kind}-${entry.item.id}`);
				})
			})
		]
	});
}
function positionTodayEntries(entries) {
	const sorted = [...entries].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
	const result = [];
	let group = [];
	let laneEnds = [];
	let groupEnd = -Infinity;
	const flush = () => {
		const lanes = Math.max(1, laneEnds.length);
		result.push(...group.map((item) => ({
			...item,
			lanes
		})));
		group = [];
		laneEnds = [];
		groupEnd = -Infinity;
	};
	for (const entry of sorted) {
		const start = new Date(entry.at).getTime();
		const end = Math.max(start + 20 * 6e4, new Date(entry.endAt).getTime());
		if (group.length && start >= groupEnd) flush();
		const availableLane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
		const lane = availableLane === -1 ? laneEnds.length : availableLane;
		laneEnds[lane] = end;
		groupEnd = Math.max(groupEnd, end);
		group.push({
			entry,
			lane
		});
	}
	if (group.length) flush();
	return result;
}
function TodayUntimedItem({ entry, onTask, onBlock, onTaskComplete, onBlockComplete }) {
	const completed = entry.kind === "task" ? entry.item.status === "completed" : entry.item.status === "performed";
	const failed = entry.kind === "task" && entry.item.status === "failed";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `${completed ? "is-completed" : ""} ${failed ? "is-failed" : ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			className: "item-inline-check",
			type: "button",
			onClick: () => entry.kind === "task" ? onTaskComplete(entry.item) : onBlockComplete(entry.item),
			children: failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 12 }) : completed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 12 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { size: 13 })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => entry.kind === "task" ? onTask(entry.item) : onBlock(entry.item),
			children: entry.title
		})]
	});
}
//#endregion
//#region components/views/today/today-summary.ts
function buildGapSummary(ranges) {
	if (!ranges.length) return "没有达到 20 分钟的连续空档";
	const largest = Math.max(...ranges.map((range) => range.minutes));
	const long = ranges.filter((range) => range.minutes >= 120).length;
	const short = ranges.length - long;
	return [
		long ? `${long} 个长空档` : "",
		short ? `${short} 个短空档` : "",
		`最长 ${formatGapMinutes(largest)}`
	].filter(Boolean).join(" · ");
}
function formatGapMinutes(minutes) {
	if (minutes < 60) return `${minutes} 分钟`;
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return remainder ? `${hours} 小时 ${remainder} 分` : `${hours} 小时`;
}
function buildTodaySummary(events, blocks, overdue) {
	if (!events && !blocks && !overdue) return "今天没有必须完成的安排。";
	const parts = [];
	if (events) parts.push(`${events} 条固定事项`);
	if (blocks) parts.push(`${blocks} 个执行时间块`);
	if (overdue) parts.push(`${overdue} 项逾期`);
	return parts.join("，");
}
//#endregion
//#region components/views/today/advance-panel.tsx
function AdvancePanel({ targetDate, targetDateKey, sleepTime, freeRanges, tab, candidates, largestGap, onSleepTimeChange, onTabChange, onCandidate, onDelete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "advance-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "advance-panel-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "需要推进" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("time", {
					dateTime: targetDateKey,
					children: [
						targetDate.getMonth() + 1,
						" 月 ",
						targetDate.getDate(),
						" 日"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "sleep-override",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { size: 14 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "预计入睡" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "time",
							value: sleepTime,
							onChange: (event) => onSleepTimeChange(event.target.value)
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "gap-summary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sunrise, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: buildGapSummary(freeRanges) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "advance-tabs segmented-control",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: tab === "recommended" ? "is-active" : "",
					onClick: () => onTabChange("recommended"),
					children: [
						"适合 ",
						targetDate.getMonth() + 1,
						"/",
						targetDate.getDate()
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: tab === "all" ? "is-active" : "",
					onClick: () => onTabChange("all"),
					children: "全部可推进"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "advance-list",
				children: candidates.length ? candidates.map((candidate) => {
					const constraint = candidate.needsContinuousTime ? "连续时间" : candidate.isFragmentFriendly ? "碎片时间" : null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "advance-candidate",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "advance-candidate-main",
							type: "button",
							onClick: () => onCandidate(candidate.source),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "advance-candidate-copy",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: candidate.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: candidate.caption })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "advance-candidate-action",
								"aria-hidden": "true",
								children: [constraint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: constraint }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16 })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "advance-candidate-delete icon-button",
							type: "button",
							"aria-label": `永久删除${candidate.title}`,
							onClick: () => {
								if (window.confirm(`确定永久删除“${candidate.title}”吗？`)) onDelete(candidate.source);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 })
						})]
					}, `${candidate.source.entityType}-${candidate.id}`);
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "advance-empty",
					children: tab === "recommended" ? largestGap < 20 ? "这一天没有达到 20 分钟的连续空档。" : "当前没有适合这些空档的事项；Project 步骤需先设为当前推进。" : "没有尚未安排的事项；Project 步骤需先设为当前推进。"
				})
			})
		]
	});
}
//#endregion
//#region components/views/today/today-completion-choice.tsx
function TodayCompletionChoice({ block, onClose, onComplete }) {
	if (!block) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorShell, {
		title: "完成到哪里？",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "completion-choice",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "这个事项还有其他时间块。默认只完成当前时间块。" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "primary-button",
					type: "button",
					onClick: () => onComplete(block, "block"),
					children: "完成当前时间块"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: () => onComplete(block, "item"),
					children: "完成整个事项"
				})
			]
		})
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/calendar-clock.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CalendarClock = createLucideIcon("CalendarClock", [
	["path", {
		d: "M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",
		key: "1osxxc"
	}],
	["path", {
		d: "M16 2v4",
		key: "4m81vk"
	}],
	["path", {
		d: "M8 2v4",
		key: "1cmpym"
	}],
	["path", {
		d: "M3 10h5",
		key: "r794hk"
	}],
	["path", {
		d: "M17.5 17.5 16 16.3V14",
		key: "akvzfd"
	}],
	["circle", {
		cx: "16",
		cy: "16",
		r: "6",
		key: "qoo3c4"
	}]
]);
//#endregion
//#region components/views/today/today-schedule-section.tsx
function TodayScheduleSection({ allDay, untimed, timed, now, displayStart, displayEnd, hideCourses = false, onHideCoursesChange, onOpenCalendar, onTask, onEvent, onBlock, onTaskComplete, onEventComplete, onBlockComplete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "content-card timeline-card today-schedule-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "section-heading today-schedule-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "今天的安排" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "today-schedule-actions",
					children: [onHideCoursesChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "text-button",
						type: "button",
						"aria-pressed": hideCourses,
						onClick: () => onHideCoursesChange(!hideCourses),
						children: [hideCourses ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 14 }), hideCourses ? "显示课程表" : "隐藏课程表"]
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "text-button",
						type: "button",
						onClick: onOpenCalendar,
						children: ["打开 Calendar ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14 })]
					})]
				})]
			}),
			allDay.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "today-agenda-row is-all-day",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "全天" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: allDay.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayUntimedItem, {
					entry,
					onTask,
					onBlock,
					onTaskComplete: (task) => onTaskComplete(task),
					onBlockComplete
				}, `${entry.kind}-${entry.item.id}`)) })]
			}) : null,
			untimed.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "today-agenda-row is-untimed",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "待安排" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: untimed.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayUntimedItem, {
					entry,
					onTask,
					onBlock,
					onTaskComplete: (task) => onTaskComplete(task),
					onBlockComplete
				}, `${entry.kind}-${entry.item.id}`)) })]
			}) : null,
			timed.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayTimeGrid, {
				entries: timed,
				now,
				displayStart,
				displayEnd,
				onTask,
				onEvent,
				onBlock,
				onTaskComplete,
				onEventComplete,
				onBlockComplete
			}) : allDay.length || untimed.length ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarClock, { size: 20 }),
				title: "今天还没有安排"
			})
		]
	});
}
//#endregion
//#region components/views/today/today-summary-cards.tsx
function TodaySummaryCards({ assignments, thoughts, openSections, onSectionChange, onTask, onThought, onOpenInbox }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "today-collapsible-card",
		open: openSections.deadlines,
		onToggle: (event) => onSectionChange("deadlines", event.currentTarget.open),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Deadline" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "count-label",
			children: assignments.length
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "today-collapsible-body",
			children: assignments.length ? assignments.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskRow, {
				task,
				onOpen: onTask
			}, task.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "today-quiet-empty",
				children: "目前没有 Deadline。"
			})
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "today-collapsible-card inbox-preview",
		open: openSections.inbox,
		onToggle: (event) => onSectionChange("inbox", event.currentTarget.open),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Inbox" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "count-label",
			children: thoughts.length
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "today-collapsible-body",
			children: thoughts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "thought-stack",
				children: thoughts.map((thought) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "today-thought-row",
					type: "button",
					onClick: () => onThought(thought.id),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: thought.content }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "处理" })]
				}, thought.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "card-footnote text-button",
				type: "button",
				onClick: onOpenInbox,
				children: "打开 Inbox"
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "today-quiet-empty",
				children: "Inbox 为空。"
			})
		})]
	})] });
}
//#endregion
//#region components/views/today/today-model.ts
function useTodayModel({ tasks, events, thoughts, goals, projects, projectNodes, scheduleBlocks, settings, now, advanceTab, hideCourses = false }) {
	const todayKey = localDateKey(now);
	const hourKey = `${todayKey}:${now.getHours()}`;
	const todayDate = (0, import_react.useMemo)(() => /* @__PURE__ */ new Date(`${todayKey}T12:00:00`), [todayKey]);
	const todayStart = (0, import_react.useMemo)(() => startOfLocalDay(todayDate), [todayDate]);
	const modelNow = (0, import_react.useMemo)(() => {
		const [date, hour] = hourKey.split(":");
		return /* @__PURE__ */ new Date(`${date}T${hour.padStart(2, "0")}:00:00`);
	}, [hourKey]);
	const targetDate = (0, import_react.useMemo)(() => recommendationTargetDate(modelNow), [modelNow]);
	const targetDateKey = localDateKey(targetDate);
	const targetSleepTime = settings.sleepOverrides[targetDateKey] ?? settings.defaultSleepTime;
	const dayEvents = (0, import_react.useMemo)(() => events.filter((event) => {
		if (hideCourses && (event.eventKind === "course" || event.itemTypeId === "course")) return false;
		return Boolean(eventOccurrenceOnDay(event, todayDate));
	}), [
		events,
		hideCourses,
		todayDate
	]);
	const effectiveDayEvents = (0, import_react.useMemo)(() => dayEvents.map((event) => {
		const occurrence = eventOccurrenceOnDay(event, todayDate) ?? event.startAt;
		const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
		return {
			...event,
			startAt: occurrence,
			endAt: new Date(new Date(occurrence).getTime() + duration).toISOString()
		};
	}), [dayEvents, todayDate]);
	const dayBlocks = (0, import_react.useMemo)(() => scheduleBlocks.filter((block) => block.date === todayKey && block.status !== "skipped"), [scheduleBlocks, todayKey]);
	const dayBlockSources = (0, import_react.useMemo)(() => new Set(dayBlocks.map((block) => block.sourceId)), [dayBlocks]);
	const dayTaskOccurrences = (0, import_react.useMemo)(() => tasks.flatMap((task) => taskOccurrencesOnDay(task, todayDate).filter(({ anchor }) => {
		return !(anchor.kind === "scheduled" || anchor.kind === "due") || !dayBlockSources.has(task.id);
	}).map((occurrence) => ({
		task,
		...occurrence
	}))), [
		dayBlockSources,
		tasks,
		todayDate
	]);
	const overdueTasks = (0, import_react.useMemo)(() => tasks.filter((task) => {
		if (task.status !== "open" || task.planningState === "draft") return false;
		const anchor = task.taskKind === "assignment" ? task.desiredCompletionAt ?? task.actualDeadlineAt : task.dueAt;
		return Boolean(anchor && new Date(anchor) < todayStart);
	}), [tasks, todayStart]);
	const assignments = (0, import_react.useMemo)(() => tasks.filter((task) => task.taskKind === "assignment" && task.assignmentStatus !== "submitted" && task.status === "open"), [tasks]);
	const inboxThoughts = (0, import_react.useMemo)(() => thoughts.filter((thought) => thought.status === "inbox"), [thoughts]);
	const freeRanges = (0, import_react.useMemo)(() => freeTimeRanges(targetDate, settings.defaultWakeTime, targetSleepTime, events, scheduleBlocks, tasks, 20), [
		events,
		scheduleBlocks,
		settings.defaultWakeTime,
		targetDate,
		targetSleepTime,
		tasks
	]);
	const largestGap = Math.max(0, ...freeRanges.map((range) => range.minutes));
	const allAdvanceCandidates = (0, import_react.useMemo)(() => buildAdvanceCandidates({
		tasks,
		projectNodes,
		projects,
		goals,
		scheduleBlocks,
		targetDate,
		now: modelNow
	}), [
		goals,
		modelNow,
		projectNodes,
		projects,
		scheduleBlocks,
		targetDate,
		tasks
	]);
	const recommendedCandidates = (0, import_react.useMemo)(() => recommendCandidatesForGaps(allAdvanceCandidates, freeRanges), [allAdvanceCandidates, freeRanges]);
	const visibleAdvanceCandidates = advanceTab === "recommended" ? recommendedCandidates : allAdvanceCandidates;
	const allDay = (0, import_react.useMemo)(() => dayTaskOccurrences.filter(({ task, anchor }) => task.isAllDay && !anchor.timed).map(({ task }) => ({
		kind: "task",
		item: task,
		title: task.title
	})), [dayTaskOccurrences]);
	const untimed = (0, import_react.useMemo)(() => [...dayTaskOccurrences.filter(({ task, anchor }) => !task.isAllDay && !anchor.timed).map(({ task }) => ({
		kind: "task",
		item: task,
		title: task.title
	})), ...dayBlocks.filter((block) => !block.startAt).map((block) => ({
		kind: "block",
		item: block,
		title: taskTitleForBlock(block, tasks, projectNodes)
	}))], [
		dayBlocks,
		dayTaskOccurrences,
		projectNodes,
		tasks
	]);
	const lookup = (0, import_react.useMemo)(() => ({
		itemTypeColors: new Map(settings.itemTypes.map((type) => [type.id, type.color])),
		nodesById: new Map(projectNodes.map((node) => [node.id, node])),
		projectsById: new Map(projects.map((project) => [project.id, project])),
		goalsById: new Map(goals.map((goal) => [goal.id, goal]))
	}), [
		goals,
		projectNodes,
		projects,
		settings.itemTypes
	]);
	return {
		targetDate,
		targetDateKey,
		targetSleepTime,
		dayEvents,
		dayBlocks,
		overdueTasks,
		assignments,
		inboxThoughts,
		freeRanges,
		largestGap,
		visibleAdvanceCandidates,
		allDay,
		untimed,
		timed: (0, import_react.useMemo)(() => [
			...effectiveDayEvents.map((event) => ({
				kind: "event",
				item: event,
				at: event.startAt,
				endAt: event.endAt,
				title: event.title,
				color: event.colorOverride || lookup.itemTypeColors.get(event.itemTypeId) || "#B9B2CC"
			})),
			...dayTaskOccurrences.filter(({ anchor }) => anchor.timed).map(({ task, anchor, occurrenceAt }) => ({
				kind: "task",
				item: task,
				at: occurrenceAt,
				endAt: anchor.usesDuration && task.durationMinutes ? new Date(new Date(occurrenceAt).getTime() + task.durationMinutes * 6e4).toISOString() : occurrenceAt,
				title: task.title,
				color: task.colorOverride || lookup.itemTypeColors.get(task.itemTypeId) || "#AFC3D4",
				instanceKey: `task-${task.id}-${anchor.kind}-${occurrenceAt}`,
				timingLabel: anchor.kind === "desired" ? "预期完成" : anchor.kind === "deadline" ? "实际截止" : void 0
			})),
			...dayBlocks.filter((block) => block.startAt).map((block) => {
				const node = lookup.nodesById.get(block.sourceId);
				const project = node ? lookup.projectsById.get(node.projectId) : void 0;
				const goal = project ? lookup.goalsById.get(project.goalId) : void 0;
				return {
					kind: "block",
					item: block,
					at: block.startAt,
					endAt: block.endAt ?? new Date(new Date(block.startAt).getTime() + 60 * 6e4).toISOString(),
					title: taskTitleForBlock(block, tasks, projectNodes),
					color: goal?.color ?? "#AFC3D4"
				};
			})
		].sort((a, b) => a.at.localeCompare(b.at)), [
			dayBlocks,
			dayTaskOccurrences,
			effectiveDayEvents,
			lookup,
			projectNodes,
			tasks
		])
	};
}
//#endregion
//#region components/views/today/today-view.tsx
function TodayView() {
	const planner = usePlanner();
	const { navigate } = useAppNavigation();
	const { tasks, events, thoughts, goals, projects, projectNodes, scheduleBlocks, settings, completeScheduleBlock, toggleTask, updateEvent, updateScheduleBlock, deleteTask, deleteProjectNode, saveSettings } = planner;
	const [editingTask, setEditingTask] = (0, import_react.useState)(null);
	const [editingEvent, setEditingEvent] = (0, import_react.useState)(null);
	const [editingBlock, setEditingBlock] = (0, import_react.useState)(null);
	const [blockSource, setBlockSource] = (0, import_react.useState)(null);
	const [advanceTab, setAdvanceTab] = (0, import_react.useState)("recommended");
	const [openSections, setOpenSections] = (0, import_react.useState)({
		deadlines: true,
		inbox: true
	});
	const [completionBlock, setCompletionBlock] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)("");
	const [hideCourses, setHideCourses] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return false;
		return window.sessionStorage.getItem("quiet-plan-calendar-hide-courses") === "true";
	});
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		const timer = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 6e4);
		return () => window.clearInterval(timer);
	}, []);
	(0, import_react.useEffect)(() => {
		window.sessionStorage.setItem("quiet-plan-calendar-hide-courses", String(hideCourses));
	}, [hideCourses]);
	(0, import_react.useEffect)(() => {
		if (!notice) return;
		const timer = window.setTimeout(() => setNotice(""), 2400);
		return () => window.clearTimeout(timer);
	}, [notice]);
	const { targetDate, targetDateKey, targetSleepTime, dayEvents, dayBlocks, overdueTasks, assignments, inboxThoughts, freeRanges, largestGap, visibleAdvanceCandidates, allDay, untimed, timed } = useTodayModel({
		tasks,
		events,
		thoughts,
		goals,
		projects,
		projectNodes,
		scheduleBlocks,
		settings,
		now,
		advanceTab,
		hideCourses
	});
	async function completeBlock(block) {
		if (block.status === "performed") {
			await updateScheduleBlock(block.id, { status: "planned" });
			return;
		}
		if (scheduleBlocks.filter((candidate) => candidate.sourceType === block.sourceType && candidate.sourceId === block.sourceId && candidate.status === "planned").length > 1) setCompletionBlock(block);
		else await completeScheduleBlock(block.id, "item");
	}
	function openBlock(block) {
		setBlockSource(block.sourceType === "task" ? tasks.find((task) => task.id === block.sourceId) ?? null : projectNodes.find((node) => node.id === block.sourceId) ?? null);
		setEditingBlock(block);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: formatFullDate(now),
			description: buildTodaySummary(dayEvents.length, dayBlocks.length, overdueTasks.length)
		}),
		notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "inline-toast",
			role: "status",
			children: notice
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "today-layout",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "today-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayScheduleSection, {
					allDay,
					untimed,
					timed,
					now,
					displayStart: settings.calendarDisplayStart,
					displayEnd: settings.calendarDisplayEnd,
					hideCourses,
					onHideCoursesChange: setHideCourses,
					onOpenCalendar: () => navigate("calendar"),
					onTask: setEditingTask,
					onEvent: setEditingEvent,
					onBlock: openBlock,
					onTaskComplete: (task, at) => void toggleTask(task.id, at),
					onEventComplete: (event) => void updateEvent(event.id, {
						status: event.status === "completed" ? "open" : "completed",
						completedAt: event.status === "completed" ? null : (/* @__PURE__ */ new Date()).toISOString()
					}),
					onBlockComplete: (block) => void completeBlock(block)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "today-side-column",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdvancePanel, {
						targetDate,
						targetDateKey,
						sleepTime: targetSleepTime,
						freeRanges,
						tab: advanceTab,
						candidates: visibleAdvanceCandidates,
						largestGap,
						onSleepTimeChange: (time) => void saveSettings({ sleepOverrides: {
							...settings.sleepOverrides,
							[targetDateKey]: time
						} }),
						onTabChange: setAdvanceTab,
						onCandidate: (source) => {
							setBlockSource(source);
							setEditingBlock(null);
						},
						onDelete: async (source) => {
							try {
								if (source.entityType === "task") await deleteTask(source.id);
								else await deleteProjectNode(source.id);
								setNotice("事项已永久删除");
							} catch {
								setNotice("删除失败，请重试。");
							}
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodaySummaryCards, {
						assignments,
						thoughts: inboxThoughts,
						openSections,
						onSectionChange: (section, open) => setOpenSections((current) => current[section] === open ? current : {
							...current,
							[section]: open
						}),
						onTask: setEditingTask,
						onThought: (thoughtId) => navigate("inbox", { thoughtId }),
						onOpenInbox: () => navigate("inbox")
					})]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskComposer, {
			open: Boolean(editingTask),
			task: editingTask,
			onClose: () => setEditingTask(null)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventComposer, {
			open: Boolean(editingEvent),
			event: editingEvent,
			occurrenceAt: editingEvent?.startAt,
			onClose: () => setEditingEvent(null)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScheduleBlockComposer, {
			open: Boolean(blockSource),
			source: blockSource,
			block: editingBlock,
			defaultDate: targetDate,
			onClose: () => {
				setBlockSource(null);
				setEditingBlock(null);
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayCompletionChoice, {
			block: completionBlock,
			onClose: () => setCompletionBlock(null),
			onComplete: (block, scope) => {
				setCompletionBlock(null);
				completeScheduleBlock(block.id, scope).then(() => setNotice(scope === "block" ? "已完成当前时间块" : "已完成整个事项")).catch(() => setNotice("没有完成成功，请重试。"));
			}
		})
	] });
}
//#endregion
export { TodayView };
