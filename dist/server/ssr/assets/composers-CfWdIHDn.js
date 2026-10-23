import { l as __toESM, n as require_jsx_runtime, o as require_react, t as require_react_dom } from "../index.js";
import { B as firstCourseDateOnOrAfter, F as MORANDI_COLORS, G as localDateKey, I as courseWeekdayForDate, J as parseRepeatPreset, K as makeCourseRecurrenceRule, P as DEFAULT_ITEM_TYPES, U as fromDateTimeLocal, W as isTaskOccurrenceCompleted, Y as recurrenceWeekdays, f as Plus, h as usePlanner, n as X, nt as rrulestr, p as createLucideIcon, q as newId, rt as RRule, tt as toDateTimeLocal } from "./ui-CjSwuoD-.js";
import { t as Trash2 } from "./trash-2-DHjjW3NH.js";
//#region components/composer-shell.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ModalShell({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverlayShell, {
		className: "modal",
		title,
		onClose,
		children
	});
}
function InspectorShell({ title, onClose, panelClassName, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverlayShell, {
		className: "inspector",
		panelClassName,
		title,
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "inspector-body",
			children
		})
	});
}
function OverlayShell({ className, panelClassName, title, onClose, children }) {
	const panelRef = (0, import_react.useRef)(null);
	const closeRef = (0, import_react.useRef)(onClose);
	(0, import_react.useEffect)(() => {
		closeRef.current = onClose;
	}, [onClose]);
	(0, import_react.useEffect)(() => {
		const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const onKeyDown = (event) => {
			if (event.key === "Escape") {
				closeRef.current();
				return;
			}
			if (event.key !== "Tab") return;
			const focusable = Array.from(panelRef.current?.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])") ?? []).filter((element) => !element.hidden);
			if (!focusable.length) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);
		(panelRef.current?.querySelector("input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])"))?.focus({ preventScroll: true });
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = previousOverflow;
			previouslyFocused?.focus({ preventScroll: true });
		};
	}, []);
	if (typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `${className}-backdrop overlay-backdrop`,
		role: "presentation",
		onMouseDown: (event) => {
			if (event.currentTarget === event.target) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			ref: panelRef,
			className: `${className === "modal" ? "modal-card" : "inspector-panel"} overlay-panel${panelClassName ? ` ${panelClassName}` : ""}`,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: `modal-header ${className}-header`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "icon-button",
					type: "button",
					onClick: onClose,
					"aria-label": "关闭",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
				})]
			}), children]
		})
	}), document.body);
}
//#endregion
//#region components/composer-shared.tsx
var reminderOptions = [
	{
		value: 0,
		label: "到点"
	},
	{
		value: 60,
		label: "提前 1 小时"
	},
	{
		value: 1440,
		label: "提前 1 天"
	}
];
var reminderPresetValues = new Set(reminderOptions.map((option) => option.value));
function ReminderPicker({ values, onChange }) {
	const customOffset = values.find((value) => !reminderPresetValues.has(value));
	const customActive = customOffset != null;
	const editableOffset = customOffset ?? 30;
	const customUnit = editableOffset >= 1440 && editableOffset % 1440 === 0 ? 1440 : editableOffset >= 60 && editableOffset % 60 === 0 ? 60 : 1;
	const customAmount = Math.max(1, editableOffset / customUnit);
	function replaceCustom(nextOffset) {
		const presets = values.filter((value) => reminderPresetValues.has(value));
		onChange([...new Set([...presets, Math.max(1, Math.round(nextOffset))])]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "reminder-picker",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "提醒" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "reminder-options",
			children: [reminderOptions.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: values.includes(option.value) ? "is-checked" : void 0,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: values.includes(option.value),
					onChange: (event) => {
						const next = event.target.checked ? [...values, option.value] : values.filter((value) => value !== option.value);
						onChange([...new Set(next)]);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: option.label })]
			}, option.value)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `reminder-custom-option ${customActive ? "is-checked" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "reminder-custom-label",
					children: "自定义"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "reminder-custom-controls",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: "1",
							step: "1",
							value: customAmount,
							"aria-label": "自定义提醒时长",
							onChange: (event) => replaceCustom((Number(event.target.value) || 1) * customUnit)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: customUnit,
							"aria-label": "自定义提醒单位",
							onChange: (event) => replaceCustom(customAmount * Number(event.target.value)),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "1",
									children: "分钟"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "60",
									children: "小时"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "1440",
									children: "天"
								})
							]
						}),
						customActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "reminder-custom-remove",
							"aria-label": "移除自定义提醒",
							onClick: () => onChange(values.filter((value) => reminderPresetValues.has(value))),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								size: 14,
								"aria-hidden": "true"
							})
						}) : null
					]
				})]
			})]
		})]
	});
}
function makeRules(offsets, anchor) {
	return offsets.map((offsetMinutes) => ({
		id: newId("reminder"),
		offsetMinutes,
		anchor
	}));
}
function makeCustomRepeatRule(unit, interval, weekdays, startAt, recurrenceEndAt) {
	if (!startAt) return null;
	const dayCodes = [
		RRule.MO,
		RRule.TU,
		RRule.WE,
		RRule.TH,
		RRule.FR,
		RRule.SA,
		RRule.SU
	];
	const options = {
		dtstart: new Date(startAt),
		freq: unit === "daily" ? RRule.DAILY : unit === "weekly" ? RRule.WEEKLY : RRule.MONTHLY,
		interval: Math.max(1, interval)
	};
	if (unit === "weekly" && weekdays.length) options.byweekday = weekdays.map((day) => dayCodes[day]);
	if (recurrenceEndAt) options.until = /* @__PURE__ */ new Date(`${recurrenceEndAt}T23:59:59`);
	return new RRule(options).toString();
}
//#endregion
//#region components/task-composer/actions.tsx
function ComposerActions({ saving, enabled, onClose, label, deleteLabel = "删除", onDelete, failLabel, onFail }) {
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const [failing, setFailing] = (0, import_react.useState)(false);
	const [deleteError, setDeleteError] = (0, import_react.useState)("");
	async function handleDelete() {
		if (!onDelete || deleting || failing) return;
		setDeleting(true);
		setDeleteError("");
		try {
			await onDelete();
		} catch {
			setDeleteError("删除失败，请稍后重试。");
			setDeleting(false);
		}
	}
	async function handleFail() {
		if (!onFail || deleting || failing) return;
		setFailing(true);
		setDeleteError("");
		try {
			await onFail();
		} catch {
			setDeleteError("更新状态失败，请稍后重试。");
			setFailing(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "composer-action-area",
		children: [deleteError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {
			className: "composer-delete-error",
			role: "alert",
			children: deleteError
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "composer-actions",
			children: [
				onDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "danger-action",
					type: "button",
					disabled: deleting || failing || saving,
					onClick: () => void handleDelete(),
					children: deleting ? "删除中" : deleteLabel
				}) : null,
				onFail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					disabled: deleting || failing || saving,
					onClick: () => void handleFail(),
					children: failing ? "处理中" : failLabel ?? "标记为失败"
				}) : null,
				!onDelete && !onFail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "composer-action-spacer" }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: onClose,
					children: "取消"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "primary-button",
					type: "submit",
					disabled: !enabled || saving || deleting || failing,
					children: saving ? "保存中" : label
				})
			]
		})]
	});
}
//#endregion
//#region components/task-composer/sections/title-section.tsx
function TaskTitleSection({ title, isCourse = false, showError, onTitleChange, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "task-title-section",
		"aria-label": isCourse ? "课程名称" : "事项名称",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `task-title-row ${showError ? "has-error" : ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "task-title-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "task-title-input",
					autoFocus: true,
					value: title,
					"aria-invalid": showError,
					"aria-describedby": showError ? "task-title-error" : void 0,
					onChange: (event) => onTitleChange(event.target.value),
					placeholder: isCourse ? "请输入课程名称，例如：ECE 470 机器人学" : "请输入事项名称"
				}), showError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", {
					id: "task-title-error",
					children: [
						"请输入",
						isCourse ? "课程" : "事项",
						"名称"
					]
				}) : null]
			}), children]
		})
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/repeat-2.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Repeat2 = createLucideIcon("Repeat2", [
	["path", {
		d: "m2 9 3-3 3 3",
		key: "1ltn5i"
	}],
	["path", {
		d: "M13 18H7a2 2 0 0 1-2-2V6",
		key: "1r6tfw"
	}],
	["path", {
		d: "m22 15-3 3-3-3",
		key: "4rnwn2"
	}],
	["path", {
		d: "M11 6h6a2 2 0 0 1 2 2v10",
		key: "2f72bc"
	}]
]);
//#endregion
//#region components/task-composer/sections/notes-section.tsx
function TaskNotesSection({ notes, origins, onNotesChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "task-notes-section",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "field",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "备注" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: notes,
				onChange: (event) => onNotesChange(event.target.value),
				placeholder: "添加与该事项有关的补充信息……"
			})]
		}), origins?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			className: "origin-details",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [
				"来自 ",
				origins.length,
				" 条 Quick Thought"
			] }), origins.map((thought) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: thought.content || "原想法已删除" }, thought.id))]
		}) : null]
	});
}
//#endregion
//#region components/task-composer/sections/schedule-section.tsx
function TaskScheduleSection({ isCourse, isDeadline, date, courseFirstDate, scheduleMode, location, startTime, endTime, duration, assignmentStatus, desiredAt, repeat, repeatInterval, repeatUnit, repeatWeekdays, recurrenceEndAt, repeatSummary, notes, origins, onNotesChange, onDateChange, onScheduleModeChange, onLocationChange, onStartTimeChange, onEndTimeChange, onDurationChange, onAssignmentStatusChange, onDesiredAtChange, onRepeatChange, onRepeatIntervalChange, onRepeatUnitChange, onRepeatWeekdaysChange, onRecurrenceEndAtChange, onDirty }) {
	const hasTime = scheduleMode === "timed" || scheduleMode === "morning" || scheduleMode === "afternoon";
	function activateTimedMode() {
		if (scheduleMode === "timed") return;
		onDirty();
		onScheduleModeChange("timed");
	}
	function selectScheduleOverride(mode) {
		if (scheduleMode === mode) return;
		onDirty();
		if (mode === "morning") {
			onStartTimeChange("09:00");
			onEndTimeChange("12:00");
			onDurationChange("custom");
		} else if (mode === "afternoon") {
			onStartTimeChange("12:00");
			onEndTimeChange("18:00");
			onDurationChange("custom");
		} else if (mode === "unscheduled" || mode === "all-day") onDurationChange("none");
		onScheduleModeChange(mode);
	}
	if (isCourse) {
		const weekdayLabels = [
			"一",
			"二",
			"三",
			"四",
			"五",
			"六",
			"日"
		];
		const selectedDays = repeatWeekdays.slice().sort((a, b) => a - b).map((day) => `周${weekdayLabels[day]}`).join("、");
		const dateRangeValid = Boolean(date && recurrenceEndAt && courseFirstDate && recurrenceEndAt >= courseFirstDate);
		const timeRangeValid = Boolean(startTime && endTime && startTime !== endTime);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "task-editor-section task-schedule-column is-course course-schedule-section",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "course-section-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "课程安排" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "一门课程只需录入一次，可同时选择一周内的多个上课日。" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "course-term-grid",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "学期开始" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: date,
							required: true,
							"aria-invalid": Boolean(date && recurrenceEndAt && !dateRangeValid),
							onChange: (event) => onDateChange(event.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "学期结束" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: recurrenceEndAt,
							min: date || void 0,
							required: true,
							"aria-invalid": Boolean(recurrenceEndAt && !dateRangeValid),
							onChange: (event) => onRecurrenceEndAtChange(event.target.value)
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "course-weekday-fieldset",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("legend", { children: ["每周上课日 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "可多选" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "course-weekday-selector",
						children: weekdayLabels.map((label, index) => {
							const selected = repeatWeekdays.includes(index);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: selected ? "is-active" : "",
								"aria-pressed": selected,
								"aria-label": `周${label}`,
								onClick: () => {
									onDirty();
									onRepeatWeekdaysChange(selected ? repeatWeekdays.filter((day) => day !== index) : [...repeatWeekdays, index]);
								},
								children: label
							}, label);
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "course-time-grid",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "开始时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								value: startTime,
								required: true,
								"aria-invalid": Boolean(startTime && endTime && !timeRangeValid),
								onChange: (event) => onStartTimeChange(event.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "course-time-divider",
							"aria-hidden": "true",
							children: "至"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "结束时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								value: endTime,
								required: true,
								"aria-invalid": Boolean(startTime && endTime && !timeRangeValid),
								onChange: (event) => onEndTimeChange(event.target.value)
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field course-location-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["上课地点 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "可选" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: location,
						onChange: (event) => onLocationChange(event.target.value),
						placeholder: "例如：教学楼 A203"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "course-schedule-summary",
					"aria-live": "polite",
					children: !timeRangeValid ? "结束时间不能与开始时间相同。" : selectedDays ? `${selectedDays} · ${startTime}–${endTime}${dateRangeValid ? ` · ${date} 至 ${recurrenceEndAt}` : ""}` : "请选择每周上课日和时间。"
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "task-editor-section task-schedule-column is-task",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `task-date-repeat-row ${isDeadline ? "is-deadline" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isDeadline ? "实际截止日期" : "日期" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": isDeadline ? "实际截止日期" : "日期",
						type: "date",
						value: date,
						onChange: (event) => onDateChange(event.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field task-repeat-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat2, {
						size: 14,
						"aria-hidden": "true"
					}), " 重复"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: repeat,
						onChange: (event) => onRepeatChange(event.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "none",
								children: "不重复"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "daily",
								children: "每天"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "weekdays",
								children: "工作日"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "weekly",
								children: "每周"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "monthly",
								children: "每月"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "custom",
								children: "自定义"
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `task-time-entry-row ${isDeadline ? "is-deadline" : hasTime ? "has-time" : "is-overridden"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: `field task-start-field ${!hasTime && !isDeadline ? "is-overridden" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isDeadline ? "截止时间" : "开始时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "time",
							required: isDeadline || hasTime,
							value: isDeadline || hasTime ? startTime : "",
							"aria-label": !isDeadline && !hasTime ? "选择开始时间" : void 0,
							onClick: activateTimedMode,
							onChange: (event) => {
								activateTimedMode();
								onStartTimeChange(event.target.value);
							}
						})]
					}),
					!isDeadline && hasTime ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `task-end-time-control ${duration === "custom" ? "has-end" : ""}`,
						children: [duration === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field task-end-time-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "结束时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `task-end-time-input-shell ${startTime === endTime ? "is-invalid" : ""}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "time",
									required: true,
									value: endTime,
									"aria-label": "结束时间",
									"aria-invalid": startTime === endTime,
									"aria-describedby": startTime === endTime ? "task-end-time-error" : void 0,
									onChange: (event) => {
										onDirty();
										onEndTimeChange(event.target.value);
										onDurationChange("custom");
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "task-time-end-remove",
									type: "button",
									"aria-label": "移除结束时间",
									onClick: () => {
										onDirty();
										onDurationChange("none");
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
										size: 15,
										"aria-hidden": "true"
									})
								})]
							})]
						}) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "task-time-end-add",
							type: "button",
							onClick: () => {
								onDirty();
								onDurationChange("custom");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								size: 15,
								"aria-hidden": "true"
							}), "添加结束时间"]
						}), duration === "custom" && startTime === endTime ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {
							id: "task-end-time-error",
							className: "field-error",
							children: "结束时间不能与开始时间相同。"
						}) : null]
					}) : null,
					!isDeadline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "task-schedule-overrides",
						role: "group",
						"aria-label": "时间安排",
						children: [
							["unscheduled", "待安排"],
							["all-day", "全天"],
							["morning", "仅上午"],
							["afternoon", "仅下午"]
						].map(([mode, label]) => {
							const active = scheduleMode === mode;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: active ? "is-active" : "",
								"aria-pressed": active,
								onClick: () => selectScheduleOverride(mode),
								children: label
							}, mode);
						})
					}) : null
				]
			}),
			isDeadline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "deadline-fields",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "field-grid",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "状态" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: assignmentStatus,
							onChange: (event) => onAssignmentStatusChange(event.target.value),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "todo",
									children: "待完成"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "content_done",
									children: "内容已完成、待提交"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "submitted",
									children: "已提交"
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "预期完成时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "datetime-local",
							value: desiredAt,
							onChange: (event) => onDesiredAtChange(event.target.value)
						})]
					})]
				})
			}) : null,
			repeat !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "task-repeat-details",
				children: [
					repeat === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "custom-repeat-panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "间隔" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: "1",
									value: repeatInterval,
									onChange: (event) => onRepeatIntervalChange(event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "单位" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: repeatUnit,
									onChange: (event) => onRepeatUnitChange(event.target.value),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "daily",
											children: "天"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "weekly",
											children: "周"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "monthly",
											children: "月"
										})
									]
								})]
							}),
							repeatUnit === "weekly" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "repeat-weekdays",
								children: [
									"一",
									"二",
									"三",
									"四",
									"五",
									"六",
									"日"
								].map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: repeatWeekdays.includes(index) ? "is-active" : "",
									onClick: () => {
										onDirty();
										onRepeatWeekdaysChange(repeatWeekdays.includes(index) ? repeatWeekdays.filter((day) => day !== index) : [...repeatWeekdays, index]);
									},
									children: label
								}, label))
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field task-repeat-end-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "结束日期" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: recurrenceEndAt,
							onChange: (event) => onRecurrenceEndAtChange(event.target.value)
						})]
					}),
					repeatSummary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", {
						className: "repeat-summary",
						children: repeatSummary
					}) : null
				]
			}) : null,
			!isCourse ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskNotesSection, {
				notes,
				origins,
				onNotesChange
			}) : null
		]
	});
}
//#endregion
//#region components/task-composer/sections/organization-section.tsx
function TaskOrganizationSection({ itemTypes, editingTask, itemTypeId, newTypeName, newTypeColor, showTypeCreator, isCourse, hasTime, isAllDay, timePreference, reminders, onItemTypeChange, onNewTypeNameChange, onNewTypeColorChange, onShowTypeCreatorChange, onRemoveCustomType, onCreateCustomType, onCourseSelected, onTimePreferenceChange, onRemindersChange, onDirty }) {
	const visibleTypes = itemTypes.filter((type) => type.id !== "course" || !editingTask);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "task-editor-section task-organization-column",
		"aria-label": isCourse ? "分类与提醒" : "分类与执行偏好",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "item-type-section",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "field-heading",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "field-label",
							children: "分类"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "item-type-options",
						children: [visibleTypes.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `item-type-option ${itemTypeId === type.id ? "is-active" : ""}`,
							style: { "--item-type-color": type.color },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "item-type-select",
								type: "button",
								onClick: () => {
									onDirty();
									onItemTypeChange(type.id);
									if (type.id === "course") onCourseSelected();
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "item-type-name",
									children: type.name
								})
							}), !DEFAULT_ITEM_TYPES.some((item) => item.id === type.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "item-type-delete-wrap",
								"aria-label": `删除类型 ${type.name}`,
								onClick: (event) => {
									event.stopPropagation();
									onRemoveCustomType(type.id);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									size: 14,
									"aria-hidden": "true"
								})
							}) : null]
						}, type.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "new-type-trigger",
							type: "button",
							onClick: () => onShowTypeCreatorChange(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " 新建类型"]
						})]
					}),
					showTypeCreator ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "type-create-panel",
						role: "group",
						"aria-label": "新建类型",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field type-create-name",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "类型名称" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									autoFocus: true,
									value: newTypeName,
									placeholder: "例如：阅读",
									onChange: (event) => onNewTypeNameChange(event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
								className: "type-color-fieldset",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "颜色" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "type-create-palette",
									"aria-label": "选择类型颜色",
									children: [MORANDI_COLORS.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": "选择颜色 " + color,
										"aria-pressed": newTypeColor === color,
										className: newTypeColor === color ? "is-active" : "",
										style: { "--swatch-color": color },
										onClick: () => {
											onDirty();
											onNewTypeColorChange(color);
										}
									}, color)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "type-color-picker",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "color",
											value: newTypeColor,
											"aria-label": "更多类型颜色",
											onChange: (event) => {
												onDirty();
												onNewTypeColorChange(event.target.value);
											}
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "更多颜色" })]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "type-create-actions",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "secondary-button",
									onClick: () => onShowTypeCreatorChange(false),
									children: "取消"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "primary-button",
									type: "button",
									disabled: !newTypeName.trim(),
									onClick: () => void onCreateCustomType(),
									children: "创建"
								})]
							})
						]
					}) : null
				]
			}),
			!isCourse && !isAllDay && !hasTime ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "task-preference-fieldset",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "时间偏好" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "task-preference-segmented",
					children: [
						["none", "无偏好"],
						["continuous", "需要连续时间"],
						["fragment", "可拆分执行"]
					].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "time-preference",
						checked: timePreference === value,
						onChange: () => onTimePreferenceChange(value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })] }, value))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReminderPicker, {
				values: reminders,
				onChange: onRemindersChange
			})
		]
	});
}
//#endregion
//#region components/task-composer/task-composer.tsx
function restoreRepeatDraft(rule) {
	if (!rule) return {
		preset: "none",
		interval: "1",
		unit: "weekly",
		weekdays: []
	};
	try {
		const options = rrulestr(rule).options;
		const interval = String(options.interval ?? 1);
		const weekdays = recurrenceWeekdays(rule);
		if (options.freq === RRule.DAILY && interval === "1") return {
			preset: "daily",
			interval,
			unit: "daily",
			weekdays: []
		};
		if (options.freq === RRule.WEEKLY && interval === "1" && weekdays.length === 5 && weekdays.every((day) => day >= 0 && day <= 4)) return {
			preset: "weekdays",
			interval,
			unit: "weekly",
			weekdays
		};
		if (options.freq === RRule.WEEKLY && interval === "1" && weekdays.length <= 1) return {
			preset: "weekly",
			interval,
			unit: "weekly",
			weekdays
		};
		if (options.freq === RRule.MONTHLY && interval === "1") return {
			preset: "monthly",
			interval,
			unit: "monthly",
			weekdays: []
		};
		return {
			preset: "custom",
			interval,
			unit: options.freq === RRule.DAILY ? "daily" : options.freq === RRule.MONTHLY ? "monthly" : "weekly",
			weekdays
		};
	} catch {
		return {
			preset: "custom",
			interval: "1",
			unit: "weekly",
			weekdays: []
		};
	}
}
function clockAfterMinutes(clock, minutes) {
	const [hours, currentMinutes] = clock.split(":").map(Number);
	const total = (hours * 60 + currentMinutes + minutes) % 1440;
	return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function minutesBetweenClockTimes(start, end) {
	if (!start || !end || start === end) return null;
	const [startHour, startMinute] = start.split(":").map(Number);
	const [endHour, endMinute] = end.split(":").map(Number);
	let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
	if (minutes < 0) minutes += 1440;
	return minutes || null;
}
function TaskComposer({ open, task, occurrenceAt, courseEvent, courseOccurrenceAt, defaultDate, defaultTime = false, prefillDraftDate = false, onQuickAdd, onClose }) {
	const { addTask, addEvent, updateTask, toggleTask, tasks, updateEvent, deleteTask, deleteEvent, thoughts, settings, saveSettings, removeItemType } = usePlanner();
	const origins = (courseEvent?.originThoughtIds ?? task?.originThoughtIds ?? []).map((id) => thoughts.find((thought) => thought.id === id)).filter((thought) => Boolean(thought));
	const [title, setTitle] = (0, import_react.useState)("");
	const [assignmentStatus, setAssignmentStatus] = (0, import_react.useState)("todo");
	const [date, setDate] = (0, import_react.useState)("");
	const [scheduleMode, setScheduleMode] = (0, import_react.useState)("timed");
	const [startTime, setStartTime] = (0, import_react.useState)("09:00");
	const [endTime, setEndTime] = (0, import_react.useState)("10:00");
	const [location, setLocation] = (0, import_react.useState)("");
	const [recurrenceEndAt, setRecurrenceEndAt] = (0, import_react.useState)("");
	const [desiredAt, setDesiredAt] = (0, import_react.useState)("");
	const [duration, setDuration] = (0, import_react.useState)("");
	const [timePreference, setTimePreference] = (0, import_react.useState)("none");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [repeat, setRepeat] = (0, import_react.useState)("none");
	const [repeatInterval, setRepeatInterval] = (0, import_react.useState)("1");
	const [repeatUnit, setRepeatUnit] = (0, import_react.useState)("weekly");
	const [repeatWeekdays, setRepeatWeekdays] = (0, import_react.useState)([]);
	const [reminders, setReminders] = (0, import_react.useState)([]);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [saveError, setSaveError] = (0, import_react.useState)("");
	const [submitAttempted, setSubmitAttempted] = (0, import_react.useState)(false);
	const [itemTypeId, setItemTypeId] = (0, import_react.useState)("research");
	const [newTypeName, setNewTypeName] = (0, import_react.useState)("");
	const [newTypeColor, setNewTypeColor] = (0, import_react.useState)(MORANDI_COLORS[0]);
	const [showTypeCreator, setShowTypeCreator] = (0, import_react.useState)(false);
	const [dirty, setDirty] = (0, import_react.useState)(false);
	const initializedTaskDraftRef = (0, import_react.useRef)(null);
	const currentTask = task ? tasks.find((item) => item.id === task.id) ?? task : null;
	const completionOccurrenceAt = occurrenceAt ?? task?.scheduledStartAt ?? task?.actualDeadlineAt ?? task?.dueAt ?? (/* @__PURE__ */ new Date()).toISOString();
	const taskCompleted = currentTask ? currentTask.recurrenceRule ? isTaskOccurrenceCompleted(currentTask, completionOccurrenceAt) : currentTask.status === "completed" : false;
	(0, import_react.useEffect)(() => {
		if (!open) {
			initializedTaskDraftRef.current = null;
			return;
		}
		const draftIdentity = courseEvent?.id ?? task?.id ?? "new-task";
		if (initializedTaskDraftRef.current === draftIdentity) return;
		initializedTaskDraftRef.current = draftIdentity;
		setTitle(courseEvent?.title ?? task?.title ?? "");
		setAssignmentStatus(task?.assignmentStatus ?? "todo");
		const now = /* @__PURE__ */ new Date();
		const existingDeadlineAt = task?.taskKind === "assignment" ? task.actualDeadlineAt ?? task.scheduledStartAt ?? task.dueAt : null;
		const dateSource = courseEvent?.startAt ?? existingDeadlineAt ?? task?.dueAt ?? task?.scheduledStartAt ?? defaultDate?.toISOString() ?? now.toISOString();
		const defaultDateKey = localDateKey(new Date(dateSource));
		const defaultDateTime = toDateTimeLocal(now.toISOString());
		const currentTime = defaultDateTime.slice(11, 16);
		setDate(defaultDateKey);
		const nextIsAllDay = !courseEvent && task?.taskKind !== "assignment" && Boolean(task?.isAllDay);
		const nextHasTime = !nextIsAllDay && (Boolean(courseEvent) || Boolean(existingDeadlineAt) || Boolean(task?.scheduledStartAt) || !task);
		const nextStartTime = courseEvent?.startAt ? toDateTimeLocal(courseEvent.startAt).slice(11, 16) : existingDeadlineAt ? toDateTimeLocal(existingDeadlineAt).slice(11, 16) : task?.scheduledStartAt ? toDateTimeLocal(task.scheduledStartAt).slice(11, 16) : defaultDate && defaultTime ? `${String(defaultDate.getHours()).padStart(2, "0")}:${String(defaultDate.getMinutes()).padStart(2, "0")}` : currentTime;
		const nextDuration = courseEvent ? Math.max(1, Math.round((new Date(courseEvent.endAt).getTime() - new Date(courseEvent.startAt).getTime()) / 6e4)) : task?.taskKind === "assignment" ? null : task?.scheduledStartAt ? task.durationMinutes : 60;
		const computedEndTime = courseEvent?.endAt ? toDateTimeLocal(courseEvent.endAt).slice(11, 16) : clockAfterMinutes(nextStartTime, nextDuration ?? 60);
		setScheduleMode(nextIsAllDay ? "all-day" : nextHasTime ? nextStartTime === "09:00" && computedEndTime === "12:00" ? "morning" : nextStartTime === "12:00" && computedEndTime === "18:00" ? "afternoon" : "timed" : "unscheduled");
		setStartTime(nextStartTime);
		setEndTime(computedEndTime);
		setLocation(courseEvent?.location ?? "");
		setRecurrenceEndAt(courseEvent?.recurrenceEndAt?.slice(0, 10) ?? defaultDateKey);
		setDesiredAt(toDateTimeLocal(task?.desiredCompletionAt ?? null) || defaultDateTime);
		setDuration(nextDuration == null ? "none" : "custom");
		setTimePreference(task?.needsContinuousTime ? "continuous" : task?.isFragmentFriendly ? "fragment" : "none");
		setNotes(task?.notes ?? "");
		const repeatDraft = restoreRepeatDraft(courseEvent?.recurrenceRule ?? task?.recurrenceRule);
		setRepeat(repeatDraft.preset);
		setRepeatInterval(repeatDraft.interval);
		setRepeatUnit(repeatDraft.unit);
		setRepeatWeekdays(repeatDraft.weekdays);
		setReminders((courseEvent?.reminderRules ?? task?.reminderRules ?? []).map((rule) => rule.offsetMinutes));
		setItemTypeId(courseEvent ? "course" : task?.taskKind === "assignment" ? "deadline" : task?.itemTypeId ?? settings.itemTypes[0]?.id ?? "research");
		setNewTypeName("");
		setNewTypeColor(MORANDI_COLORS[settings.itemTypes.length % MORANDI_COLORS.length]);
		setShowTypeCreator(false);
		setDirty(false);
		setSaveError("");
		setSubmitAttempted(false);
	}, [
		courseEvent,
		defaultDate,
		defaultTime,
		open,
		prefillDraftDate,
		settings.itemTypes,
		task
	]);
	const selectedType = settings.itemTypes.find((type) => type.id === itemTypeId) ?? settings.itemTypes[0];
	const hasTime = scheduleMode === "timed" || scheduleMode === "morning" || scheduleMode === "afternoon";
	const isAllDay = scheduleMode === "all-day";
	const isDeadline = itemTypeId === "deadline" || selectedType?.name.trim().toLowerCase() === "deadline";
	const isCourse = Boolean(courseEvent) || !task && itemTypeId === "course";
	const courseFirstDate = isCourse ? firstCourseDateOnOrAfter(date, repeatWeekdays) : "";
	const courseReady = Boolean(date && recurrenceEndAt && courseFirstDate && recurrenceEndAt >= courseFirstDate && repeatWeekdays.length && startTime && endTime && startTime !== endTime);
	const customDurationMinutes = duration === "custom" ? minutesBetweenClockTimes(startTime, endTime) : null;
	const effectiveDuration = !isDeadline && duration === "custom" ? customDurationMinutes : null;
	const taskScheduleReady = isDeadline ? Boolean(date && startTime) : !hasTime || Boolean(startTime && (duration === "none" || effectiveDuration));
	const repeatSummary = repeat === "none" ? "" : repeat === "daily" ? "每天重复" : repeat === "weekdays" ? "每个工作日重复" : repeat === "weekly" ? "每周重复" : repeat === "monthly" ? "每月重复" : `每 ${repeatInterval || 1} ${repeatUnit === "daily" ? "天" : repeatUnit === "weekly" ? "周" : "月"}${repeatUnit === "weekly" && repeatWeekdays.length ? `（周${repeatWeekdays.map((day) => [
		"一",
		"二",
		"三",
		"四",
		"五",
		"六",
		"日"
	][day]).join("、")}）` : ""}重复`;
	function canLeave() {
		return !saving && (!dirty || window.confirm("有尚未保存的修改，确定要离开吗？"));
	}
	function requestClose() {
		if (canLeave()) onClose();
	}
	async function changeCompletion() {
		if (!currentTask || saving) return;
		setSaving(true);
		setSaveError("");
		try {
			await toggleTask(currentTask.id, completionOccurrenceAt);
			if (currentTask.taskKind === "assignment" && !currentTask.recurrenceRule) setAssignmentStatus(taskCompleted ? "todo" : "submitted");
		} catch {
			setSaveError("完成状态更新失败，请稍后重试。");
		} finally {
			setSaving(false);
		}
	}
	async function removeCustomType(typeId) {
		try {
			await removeItemType(typeId);
			setDirty(true);
			if (itemTypeId === typeId) setItemTypeId("research");
		} catch {
			setSaveError("类型删除失败，请稍后重试。");
		}
	}
	async function createCustomType() {
		const name = newTypeName.trim();
		if (!name) return;
		const id = `type_${Date.now().toString(36)}`;
		try {
			await saveSettings({ itemTypes: [...settings.itemTypes, {
				id,
				name,
				color: newTypeColor
			}] });
			setDirty(true);
			setItemTypeId(id);
			setNewTypeName("");
			setShowTypeCreator(false);
		} catch {
			setSaveError("类型创建失败，请稍后重试。");
		}
	}
	async function submit(event) {
		event.preventDefault();
		if (saving) return;
		setSubmitAttempted(true);
		if (!title.trim()) return;
		if (!taskScheduleReady) {
			setSaveError(isDeadline ? "请填写实际截止日期和截止时间。" : duration === "custom" ? "请填写有效的开始时间和结束时间。" : "请填写开始时间。");
			return;
		}
		if (isCourse && !courseReady) {
			setSaveError("请完整填写学期起止日期、每周上课日和上课时段。");
			return;
		}
		setSaving(true);
		setSaveError("");
		try {
			const scheduledDate = isCourse ? courseFirstDate : date;
			const scheduledIso = hasTime && !isAllDay && scheduledDate ? fromDateTimeLocal(`${scheduledDate}T${startTime}`) : null;
			const dayEndIso = date ? fromDateTimeLocal(`${date}T23:59`) : null;
			const actualDeadlineIso = isDeadline ? scheduledIso : null;
			if (isDeadline && !actualDeadlineIso) {
				setSaveError("请填写实际截止日期和截止时间。");
				return;
			}
			if (isCourse && scheduledIso) {
				const courseEndIso = fromDateTimeLocal(`${scheduledDate}T${endTime}`);
				if (!courseEndIso) return;
				let end = new Date(courseEndIso);
				if (end.getTime() <= new Date(scheduledIso).getTime()) end = new Date(end.getTime() + 1440 * 6e4);
				const coursePatch = {
					title,
					eventKind: "course",
					startAt: scheduledIso,
					endAt: end.toISOString(),
					timezone: settings.timezone,
					recurrenceRule: makeCourseRecurrenceRule(scheduledIso, repeatWeekdays, recurrenceEndAt),
					recurrenceEndAt: recurrenceEndAt || null,
					notes: "",
					location: location.trim() || null,
					itemTypeId: "course",
					colorOverride: null,
					reminderOffsetMinutes: reminders[0] ?? null,
					reminderRules: makeRules(reminders, "start")
				};
				if (courseEvent) await updateEvent(courseEvent.id, coursePatch);
				else await addEvent(coursePatch);
				onClose();
				return;
			}
			const taskKind = isDeadline ? "assignment" : "ordinary";
			const reminderRules = makeRules(reminders, isDeadline ? "deadline" : "start");
			const patch = {
				title,
				status: isDeadline && assignmentStatus === "submitted" ? "completed" : "open",
				planningState: date ? "planned" : "draft",
				taskKind,
				notes,
				dueAt: isDeadline ? actualDeadlineIso : dayEndIso,
				desiredCompletionAt: isDeadline ? fromDateTimeLocal(desiredAt) : null,
				actualDeadlineAt: actualDeadlineIso,
				assignmentStatus: isDeadline ? assignmentStatus : null,
				scheduledStartAt: isDeadline ? null : scheduledIso,
				isAllDay: isDeadline ? false : !isCourse && isAllDay,
				itemTypeId,
				colorOverride: task?.colorOverride ?? null,
				durationMinutes: isDeadline ? null : hasTime && !isAllDay ? effectiveDuration : null,
				needsContinuousTime: !isAllDay && !hasTime && timePreference === "continuous",
				isFragmentFriendly: !isAllDay && !hasTime && timePreference === "fragment",
				recurrenceRule: repeat === "custom" ? makeCustomRepeatRule(repeatUnit, Number(repeatInterval) || 1, repeatWeekdays, actualDeadlineIso || scheduledIso || dayEndIso, recurrenceEndAt) : parseRepeatPreset(repeat, actualDeadlineIso || scheduledIso || dayEndIso, recurrenceEndAt),
				reminderOffsetMinutes: reminders[0] ?? null,
				reminderRules
			};
			if (task) {
				const nextStatus = isDeadline && assignmentStatus === "submitted" && !currentTask?.recurrenceRule ? "completed" : currentTask?.status ?? task.status;
				await updateTask(task.id, {
					...patch,
					status: nextStatus,
					completedAt: nextStatus === "completed" ? currentTask?.completedAt ?? (/* @__PURE__ */ new Date()).toISOString() : currentTask?.completedAt ?? null
				});
			} else await addTask(patch);
			onClose();
		} catch {
			setSaveError("保存失败，请稍后重试。");
		} finally {
			setSaving(false);
		}
	}
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorShell, {
		title: courseEvent ? "编辑课程" : task ? "编辑事项" : isCourse ? "新增课程" : "新增事项",
		panelClassName: "task-composer-inspector",
		onClose: requestClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: `composer-form task-composer-form ${isCourse ? "is-course" : ""}`,
			onSubmit: submit,
			onChange: () => setDirty(true),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskTitleSection, {
					title,
					isCourse,
					showError: submitAttempted && !title.trim(),
					onTitleChange: setTitle,
					children: task && !isCourse ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "task-completion-action secondary-button",
						type: "button",
						disabled: saving,
						"aria-pressed": taskCompleted,
						onClick: () => void changeCompletion(),
						children: [taskCompleted ? "恢复未完成" : "标记完成", task.recurrenceRule ? "（本次）" : ""]
					}) : !task && !courseEvent && onQuickAdd ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "secondary-button",
						type: "button",
						disabled: saving || !date,
						onClick: () => {
							if (date && canLeave()) onQuickAdd(/* @__PURE__ */ new Date(`${date}T00:00:00`));
						},
						children: "快速添加"
					}) : null
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "task-editor-scroll",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "task-editor-columns",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskScheduleSection, {
							isCourse,
							isDeadline,
							date,
							courseFirstDate,
							scheduleMode,
							location,
							startTime,
							endTime,
							duration,
							assignmentStatus,
							desiredAt,
							repeat,
							repeatInterval,
							repeatUnit,
							repeatWeekdays,
							recurrenceEndAt,
							repeatSummary,
							notes,
							origins,
							onNotesChange: setNotes,
							onDateChange: setDate,
							onScheduleModeChange: (value) => {
								setScheduleMode(value);
								setTimePreference("none");
							},
							onLocationChange: setLocation,
							onStartTimeChange: setStartTime,
							onEndTimeChange: setEndTime,
							onDurationChange: setDuration,
							onAssignmentStatusChange: setAssignmentStatus,
							onDesiredAtChange: setDesiredAt,
							onRepeatChange: setRepeat,
							onRepeatIntervalChange: setRepeatInterval,
							onRepeatUnitChange: setRepeatUnit,
							onRepeatWeekdaysChange: setRepeatWeekdays,
							onRecurrenceEndAtChange: setRecurrenceEndAt,
							onDirty: () => setDirty(true)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskOrganizationSection, {
							itemTypes: settings.itemTypes,
							editingTask: Boolean(task),
							itemTypeId,
							newTypeName,
							newTypeColor,
							showTypeCreator,
							isCourse,
							hasTime,
							isAllDay,
							timePreference,
							reminders,
							onItemTypeChange: (value) => {
								setItemTypeId(value);
								const nextType = settings.itemTypes.find((type) => type.id === value);
								if (value === "deadline" || nextType?.name.trim().toLowerCase() === "deadline") {
									setScheduleMode("timed");
									setDuration("none");
									setTimePreference("none");
								} else if (isDeadline) {
									setDuration("custom");
									setEndTime((current) => current || clockAfterMinutes(startTime, 60));
								}
							},
							onNewTypeNameChange: setNewTypeName,
							onNewTypeColorChange: setNewTypeColor,
							onShowTypeCreatorChange: setShowTypeCreator,
							onRemoveCustomType: removeCustomType,
							onCreateCustomType: createCustomType,
							onCourseSelected: () => {
								setScheduleMode("timed");
								setTimePreference("none");
								setRepeat("weekly");
								if (!repeatWeekdays.length && date) setRepeatWeekdays([courseWeekdayForDate(date)]);
							},
							onTimePreferenceChange: setTimePreference,
							onRemindersChange: (values) => {
								setDirty(true);
								setReminders(values);
							},
							onDirty: () => setDirty(true)
						})]
					})
				}),
				saveError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "task-save-error",
					role: "alert",
					children: saveError
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComposerActions, {
					saving,
					enabled: dirty && Boolean(title.trim()) && taskScheduleReady && (!isCourse || courseReady),
					onClose: requestClose,
					label: isCourse ? "保存课程" : "保存事项",
					deleteLabel: courseEvent?.recurrenceRule && courseOccurrenceAt ? "删除本次课程" : void 0,
					onDelete: courseEvent ? async () => {
						if (courseEvent.recurrenceRule && courseOccurrenceAt) {
							const occurrenceKey = localDateKey(new Date(courseOccurrenceAt));
							await updateEvent(courseEvent.id, { excludedOccurrenceKeys: Array.from(new Set([...courseEvent.excludedOccurrenceKeys ?? [], occurrenceKey])) });
						} else await deleteEvent(courseEvent.id);
						onClose();
					} : task ? async () => {
						await deleteTask(task.id);
						onClose();
					} : void 0,
					failLabel: task?.status === "failed" ? "恢复为待办" : "标记为失败",
					onFail: task ? async () => {
						const nextStatus = task.status === "failed" ? "open" : "failed";
						await updateTask(task.id, {
							status: nextStatus,
							completedAt: null
						});
						onClose();
					} : void 0
				})
			]
		})
	});
}
//#endregion
//#region components/event-composer/event-sections.tsx
function EventTitleSection({ title, previewColor, typeName, onTitleChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "item-color-preview title-edit-preview",
		style: { "--preview-color": previewColor },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "item-preview-check" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "title-preview-input",
			autoFocus: true,
			value: title,
			onChange: (event) => onTitleChange(event.target.value),
			placeholder: "需要完成什么？"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: typeName })] })]
	});
}
function EventTypeSection({ itemTypes, selectedId, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "item-type-section",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "field-label",
			children: "类型"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "item-type-options",
			children: itemTypes.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: selectedId === type.id ? "is-active" : "",
				type: "button",
				onClick: () => onSelect(type.id),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { backgroundColor: type.color } }), type.name]
			}, type.id))
		})]
	});
}
function EventColorSection({ colorOverride, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "field item-color-field",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "颜色" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "morandi-palette",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: !colorOverride ? "is-active default-color-button" : "default-color-button",
				onClick: () => onChange(""),
				children: "类型默认"
			}), MORANDI_COLORS.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: colorOverride === color ? "is-active" : "",
				style: { backgroundColor: color },
				onClick: () => onChange(color),
				"aria-label": `选择颜色 ${color}`
			}, color))]
		})]
	});
}
function EventScheduleSection({ startAt, endAt, repeat, recurrenceEndAt, onStartChange, onEndChange, onRepeatChange, onRecurrenceEndChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "field-grid",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "开始" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "datetime-local",
					value: startAt,
					onChange: (event) => onStartChange(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "结束" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "datetime-local",
					value: endAt,
					onChange: (event) => onEndChange(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "重复" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: repeat,
					onChange: (event) => onRepeatChange(event.target.value),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "none",
							children: "不重复"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "daily",
							children: "每天"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "weekdays",
							children: "工作日"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "weekly",
							children: "每周"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "monthly",
							children: "每月"
						})
					]
				})]
			}),
			repeat !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "重复结束（可选）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: recurrenceEndAt,
					onChange: (event) => onRecurrenceEndChange(event.target.value)
				})]
			}) : null
		]
	});
}
function EventNotesSection({ notes, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "field",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "备注" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			value: notes,
			onChange: (event) => onChange(event.target.value)
		})]
	});
}
function EventOriginsSection({ origins }) {
	if (!origins.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "origin-details",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [
			"来自 ",
			origins.length,
			" 条 Quick Thought"
		] }), origins.map((thought) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: thought.content || "原想法已删除" }, thought.id))]
	});
}
//#endregion
//#region components/event-composer/event-composer.tsx
function EventComposer({ open, event, defaultDate, occurrenceAt, onClose }) {
	if (event?.eventKind === "course") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskComposer, {
		open,
		courseEvent: event,
		defaultDate,
		courseOccurrenceAt: occurrenceAt,
		defaultTime: true,
		onClose
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StandardEventComposer, {
		open,
		event,
		defaultDate,
		occurrenceAt,
		onClose
	});
}
function StandardEventComposer({ open, event, defaultDate, occurrenceAt, onClose }) {
	const { addEvent, updateEvent, deleteEvent, thoughts, settings } = usePlanner();
	const origins = event ? event.originThoughtIds.map((id) => thoughts.find((thought) => thought.id === id)).filter((thought) => Boolean(thought)) : [];
	const baseStart = (0, import_react.useMemo)(() => {
		const date = defaultDate ? new Date(defaultDate) : /* @__PURE__ */ new Date();
		date.setHours(9, 0, 0, 0);
		return date;
	}, [defaultDate]);
	const [title, setTitle] = (0, import_react.useState)("");
	const [itemTypeId, setItemTypeId] = (0, import_react.useState)("temporary");
	const [colorOverride, setColorOverride] = (0, import_react.useState)("");
	const [startAt, setStartAt] = (0, import_react.useState)("");
	const [endAt, setEndAt] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [repeat, setRepeat] = (0, import_react.useState)("none");
	const [recurrenceEndAt, setRecurrenceEndAt] = (0, import_react.useState)("");
	const [reminders, setReminders] = (0, import_react.useState)([]);
	const [saving, setSaving] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setTitle(event?.title ?? "");
		setItemTypeId(event?.itemTypeId ?? "temporary");
		setColorOverride(event?.colorOverride ?? "");
		setStartAt(toDateTimeLocal(event?.startAt ?? baseStart.toISOString()));
		setEndAt(toDateTimeLocal(event?.endAt ?? new Date(baseStart.getTime() + 30 * 6e4).toISOString()));
		setNotes(event?.notes ?? "");
		setRepeat(event?.recurrenceRule ? "weekly" : "none");
		setRecurrenceEndAt(event?.recurrenceEndAt?.slice(0, 10) ?? localDateKey(baseStart));
		setReminders((event?.reminderRules ?? []).map((rule) => rule.offsetMinutes));
	}, [
		baseStart,
		event,
		open
	]);
	async function submit(formEvent) {
		formEvent.preventDefault();
		const startIso = fromDateTimeLocal(startAt);
		const endIso = fromDateTimeLocal(endAt);
		if (!title.trim() || !startIso || !endIso) return;
		setSaving(true);
		const patch = {
			title,
			eventKind: event?.eventKind === "exam" ? "exam" : "event",
			itemTypeId,
			colorOverride: colorOverride || null,
			location: null,
			notes,
			startAt: startIso,
			endAt: endIso,
			recurrenceRule: parseRepeatPreset(repeat === "custom" ? "weekly" : repeat, startIso, repeat === "none" ? null : recurrenceEndAt || null),
			excludedOccurrenceKeys: repeat === "none" ? [] : event?.excludedOccurrenceKeys ?? [],
			recurrenceEndAt: repeat === "none" ? null : recurrenceEndAt || null,
			reminderOffsetMinutes: reminders[0] ?? null,
			reminderRules: makeRules(reminders, "start"),
			timezone: settings.timezone
		};
		try {
			if (event) await updateEvent(event.id, patch);
			else await addEvent(patch);
			onClose();
		} finally {
			setSaving(false);
		}
	}
	if (!open) return null;
	const selectedEventType = settings.itemTypes.find((type) => type.id === itemTypeId) ?? settings.itemTypes[0];
	const eventPreviewColor = colorOverride || selectedEventType?.color || "#AFC3D4";
	function selectType(nextId) {
		setItemTypeId(nextId);
		setColorOverride("");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorShell, {
		title: event ? "编辑日程" : "新建日程",
		panelClassName: "event-composer-inspector",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "composer-form event-composer-form",
			onSubmit: submit,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventTitleSection, {
					title,
					previewColor: eventPreviewColor,
					typeName: selectedEventType?.name ?? "未选择类型",
					onTitleChange: setTitle
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventTypeSection, {
					itemTypes: settings.itemTypes.filter((type) => type.id !== "course"),
					selectedId: itemTypeId,
					onSelect: selectType
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventColorSection, {
					colorOverride,
					onChange: setColorOverride
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventScheduleSection, {
					startAt,
					endAt,
					repeat,
					recurrenceEndAt,
					onStartChange: setStartAt,
					onEndChange: setEndAt,
					onRepeatChange: setRepeat,
					onRecurrenceEndChange: setRecurrenceEndAt
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReminderPicker, {
					values: reminders,
					onChange: setReminders
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventNotesSection, {
					notes,
					onChange: setNotes
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventOriginsSection, { origins }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComposerActions, {
					saving,
					enabled: Boolean(title.trim()),
					onClose,
					label: "保存日程",
					deleteLabel: event?.recurrenceRule && occurrenceAt ? "删除本次日程" : void 0,
					onDelete: event ? async () => {
						if (event.recurrenceRule && occurrenceAt) {
							const occurrenceKey = localDateKey(new Date(occurrenceAt));
							await updateEvent(event.id, { excludedOccurrenceKeys: Array.from(new Set([...event.excludedOccurrenceKeys ?? [], occurrenceKey])) });
						} else await deleteEvent(event.id);
						onClose();
					} : void 0
				})
			]
		})
	});
}
//#endregion
//#region components/schedule-block-composer/schedule-block-composer.tsx
function timeLocal(value) {
	const local = toDateTimeLocal(value);
	return local ? local.slice(11, 16) : "";
}
function ScheduleBlockComposer({ open, source, block, defaultDate, onClose }) {
	const { addScheduleBlock, updateScheduleBlock, deleteScheduleBlock } = usePlanner();
	const base = (0, import_react.useMemo)(() => defaultDate ?? /* @__PURE__ */ new Date(), [defaultDate]);
	const [date, setDate] = (0, import_react.useState)(localDateKey(base));
	const [startAt, setStartAt] = (0, import_react.useState)("");
	const [endAt, setEndAt] = (0, import_react.useState)("");
	const [reminders, setReminders] = (0, import_react.useState)([]);
	const [status, setStatus] = (0, import_react.useState)("planned");
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setDate(block?.date ?? localDateKey(base));
		setStartAt(timeLocal(block?.startAt));
		setEndAt(timeLocal(block?.endAt));
		setReminders((block?.reminderRules ?? []).map((rule) => rule.offsetMinutes));
		setStatus(block?.status ?? "planned");
		setError("");
	}, [
		base,
		block,
		open
	]);
	async function submit(event) {
		event.preventDefault();
		if (!source) return;
		const startIso = startAt ? fromDateTimeLocal(`${date}T${startAt}`) : null;
		const endIso = endAt ? fromDateTimeLocal(`${date}T${endAt}`) : null;
		if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
			setError("结束时间必须晚于开始时间，时间块不能跨日。");
			return;
		}
		const patch = {
			sourceType: source.entityType === "task" ? "task" : "projectNode",
			sourceId: source.id,
			date,
			startAt: startIso,
			endAt: endIso,
			reminderRules: makeRules(reminders, "start"),
			status
		};
		if (block) await updateScheduleBlock(block.id, patch);
		else await addScheduleBlock(patch);
		onClose();
	}
	if (!open || !source) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorShell, {
		title: `安排：${source.title}`,
		panelClassName: "schedule-block-composer-inspector",
		onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "composer-form schedule-block-composer-form",
			onSubmit: submit,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "日期" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "field-grid",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "开始时间（可选）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "time",
							value: startAt,
							onChange: (e) => setStartAt(e.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "结束时间（可选）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "time",
							value: endAt,
							onChange: (e) => setEndAt(e.target.value)
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "task-schedule-overrides",
					role: "group",
					"aria-label": "快捷时段",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: startAt === "09:00" && endAt === "12:00" ? "is-active" : "",
							onClick: () => {
								setStartAt("09:00");
								setEndAt("12:00");
							},
							children: "仅上午"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: startAt === "12:00" && endAt === "18:00" ? "is-active" : "",
							onClick: () => {
								setStartAt("12:00");
								setEndAt("18:00");
							},
							children: "仅下午"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: !startAt && !endAt ? "is-active" : "",
							onClick: () => {
								setStartAt("");
								setEndAt("");
							},
							children: "待安排"
						})
					]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "schedule-block-error",
					role: "alert",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReminderPicker, {
					values: reminders,
					onChange: setReminders
				}),
				block ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "执行状态" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: status,
						onChange: (event) => setStatus(event.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "planned",
								children: "计划"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "performed",
								children: "已执行（不自动完成任务）"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "skipped",
								children: "已跳过"
							})
						]
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComposerActions, {
					enabled: Boolean(date),
					onClose,
					label: "保存时间块",
					onDelete: block ? async () => {
						await deleteScheduleBlock(block.id);
						onClose();
					} : void 0
				})
			]
		})
	});
}
//#endregion
export { ModalShell as a, InspectorShell as i, EventComposer as n, TaskComposer as r, ScheduleBlockComposer as t };
