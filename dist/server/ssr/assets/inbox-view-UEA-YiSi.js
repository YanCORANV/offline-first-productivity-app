import { l as __toESM, n as require_jsx_runtime, o as require_react } from "../index.js";
import { F as MORANDI_COLORS, c as QuickCapture, h as usePlanner, i as Check, n as X, p as createLucideIcon, u as PageHeader } from "./ui-CjSwuoD-.js";
import { n as useAppNavigation } from "./app-navigation-DNXAglzE.js";
import { t as Trash2 } from "./trash-2-DHjjW3NH.js";
import { t as ChevronDown } from "./chevron-down-ZQ5WPbjD.js";
import { n as CalendarPlus, t as Undo2 } from "./undo-2-DW4h1O6F.js";
//#region node_modules/lucide-react/dist/esm/icons/folder-plus.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FolderPlus = createLucideIcon("FolderPlus", [
	["path", {
		d: "M12 10v6",
		key: "1bos4e"
	}],
	["path", {
		d: "M9 13h6",
		key: "1uhe8q"
	}],
	["path", {
		d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
		key: "1kt360"
	}]
]);
//#endregion
//#region components/views/inbox/inbox-project-panel.tsx
var import_jsx_runtime = require_jsx_runtime();
function InboxProjectPanel({ thought, goals, busy, onClose, onConfirm }) {
	const visibleGoals = (0, import_react.useMemo)(() => goals.filter((goal) => !goal.archived), [goals]);
	const [projectTitle, setProjectTitle] = (0, import_react.useState)(thought.content);
	const [goalName, setGoalName] = (0, import_react.useState)(visibleGoals[0]?.name ?? "");
	const [goalColor, setGoalColor] = (0, import_react.useState)(visibleGoals[0]?.color ?? MORANDI_COLORS[0]);
	const [goalMenuOpen, setGoalMenuOpen] = (0, import_react.useState)(false);
	const goalPickerRef = (0, import_react.useRef)(null);
	const selectedGoal = visibleGoals.find((goal) => normalizeName(goal.name) === normalizeName(goalName)) ?? null;
	(0, import_react.useEffect)(() => {
		if (!goalMenuOpen) return;
		function closeGoalMenu(event) {
			if (!goalPickerRef.current?.contains(event.target)) setGoalMenuOpen(false);
		}
		document.addEventListener("pointerdown", closeGoalMenu);
		return () => document.removeEventListener("pointerdown", closeGoalMenu);
	}, [goalMenuOpen]);
	function changeGoalName(value) {
		setGoalName(value);
		setGoalMenuOpen(true);
		const existingGoal = visibleGoals.find((goal) => normalizeName(goal.name) === normalizeName(value));
		if (existingGoal?.color) setGoalColor(existingGoal.color);
	}
	function selectGoal(goal) {
		setGoalName(goal.name);
		setGoalColor(goal.color);
		setGoalMenuOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "inbox-project-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "inbox-project-header",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "开始 Project" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "icon-button",
					type: "button",
					onClick: onClose,
					"aria-label": "关闭 Project 设置",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 15 })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "inbox-project-fields",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Project 名称" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: projectTitle,
						onChange: (event) => setProjectTitle(event.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "field inbox-goal-field",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Goal" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inbox-goal-picker",
							ref: goalPickerRef,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: goalMenuOpen ? "inbox-goal-input is-open" : "inbox-goal-input",
								style: { backgroundColor: goalColor },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: goalName,
									onChange: (event) => changeGoalName(event.target.value),
									onFocus: () => setGoalMenuOpen(true),
									onClick: () => setGoalMenuOpen(true),
									onKeyDown: (event) => {
										if (event.key === "Escape") setGoalMenuOpen(false);
										if (event.key === "ArrowDown") setGoalMenuOpen(true);
									},
									placeholder: "选择或输入 Goal",
									role: "combobox",
									"aria-expanded": goalMenuOpen,
									"aria-controls": "inbox-goal-options",
									"aria-autocomplete": "list"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "inbox-goal-toggle",
									type: "button",
									onClick: () => setGoalMenuOpen((open) => !open),
									"aria-label": goalMenuOpen ? "收起 Goal 列表" : "展开 Goal 列表",
									"aria-expanded": goalMenuOpen,
									"aria-controls": "inbox-goal-options",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 16 })
								})]
							}), goalMenuOpen && visibleGoals.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "inbox-goal-options",
								id: "inbox-goal-options",
								role: "listbox",
								children: visibleGoals.map((goal) => {
									const active = goal.id === selectedGoal?.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: active ? "is-active" : "",
										onClick: () => selectGoal(goal),
										role: "option",
										"aria-selected": active,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												style: { backgroundColor: goal.color },
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: goal.name }),
											active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 15 }) : null
										]
									}, goal.id);
								})
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "inbox-goal-colors",
							"aria-label": "Goal 颜色",
							children: MORANDI_COLORS.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: color === goalColor ? "is-active" : "",
								style: { background: color },
								onClick: () => setGoalColor(color),
								disabled: Boolean(selectedGoal),
								"aria-label": `选择颜色 ${color}`,
								"aria-pressed": color === goalColor
							}, color))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "inbox-project-actions",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: onClose,
					children: "取消"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "primary-button",
					type: "button",
					disabled: busy || !goalName.trim() || !projectTitle.trim(),
					onClick: () => onConfirm({
						goalId: selectedGoal?.id ?? null,
						goalName,
						goalColor,
						projectTitle
					}),
					children: "创建 Project"
				})]
			})
		]
	});
}
function normalizeName(value) {
	return value.trim().toLocaleLowerCase();
}
//#endregion
//#region components/views/inbox/inbox-item.tsx
function InboxItem({ thought, goals, rowBusy, projectOpen, onConvert, onBeginProject, onDelete, onCloseProject, onConfirmProject }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "inbox-item",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "inbox-item-content",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inbox-thought-dot" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: thought.content }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: formatCapturedAt(thought.createdAt) })] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "inbox-item-actions",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: rowBusy,
						onClick: onConvert,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarPlus, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "转为事项" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: rowBusy,
						onClick: onBeginProject,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "开始 Project" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "danger-action",
						type: "button",
						disabled: rowBusy,
						onClick: onDelete,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "删除" })]
					})
				]
			}),
			projectOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InboxProjectPanel, {
				thought,
				goals,
				busy: rowBusy,
				onClose: onCloseProject,
				onConfirm: onConfirmProject
			}) : null
		]
	});
}
function formatCapturedAt(value) {
	return new Intl.DateTimeFormat("zh-CN", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	}).format(new Date(value));
}
//#endregion
//#region components/views/inbox/inbox-view.tsx
function InboxView() {
	const { thoughts, goals, convertThoughtToDraft, updateThoughtStatus, restoreThought, deleteTask, addGoal, addProject } = usePlanner();
	const { navigate } = useAppNavigation();
	const [projectThoughtId, setProjectThoughtId] = (0, import_react.useState)(null);
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)({ text: "" });
	const [draftTaskId, setDraftTaskId] = (0, import_react.useState)("");
	const inbox = (0, import_react.useMemo)(() => thoughts.filter((thought) => thought.status === "inbox"), [thoughts]);
	const visibleGoals = (0, import_react.useMemo)(() => goals.filter((goal) => !goal.archived), [goals]);
	(0, import_react.useEffect)(() => {
		if (!notice.text) return;
		const timer = window.setTimeout(() => setNotice({ text: "" }), 5e3);
		return () => window.clearTimeout(timer);
	}, [notice]);
	async function convertToTask(id) {
		setBusyId(id);
		try {
			const task = await convertThoughtToDraft(id);
			if (task) {
				setDraftTaskId(task.id);
				setNotice({
					text: "已转为待落实事项。",
					thoughtId: id,
					taskId: task.id,
					kind: "convert"
				});
			}
		} catch {
			setNotice({ text: "未能保存这次处理，请重试。" });
		} finally {
			setBusyId(null);
		}
	}
	async function removeThought(id) {
		setBusyId(id);
		try {
			await updateThoughtStatus([id], "deleted", "已删除");
			setNotice({
				text: "想法已删除。",
				thoughtId: id,
				kind: "delete"
			});
		} catch {
			setNotice({ text: "未能删除，请重试。" });
		} finally {
			setBusyId(null);
		}
	}
	async function undoNotice() {
		if (!notice.thoughtId) return;
		try {
			if (notice.kind === "convert" && notice.taskId) {
				await deleteTask(notice.taskId);
				await updateThoughtStatus([notice.thoughtId], "inbox", "已撤销事项转换");
				setNotice({ text: "已撤销，想法已回到 Inbox。" });
			} else {
				await restoreThought(notice.thoughtId);
				setNotice({ text: "已恢复到 Inbox。" });
			}
		} catch {
			setNotice({ text: "未能恢复，请重试。" });
		}
	}
	async function confirmProject(thoughtId, input) {
		const projectThought = thoughts.find((thought) => thought.id === thoughtId);
		if (!projectThought || !input.goalName.trim() || !input.projectTitle.trim()) return;
		setBusyId(thoughtId);
		try {
			const project = await addProject((input.goalId ? visibleGoals.find((item) => item.id === input.goalId) ?? await addGoal(input.goalName.trim(), input.goalColor) : await addGoal(input.goalName.trim(), input.goalColor)).id, input.projectTitle.trim(), [projectThought.id]);
			await updateThoughtStatus([projectThought.id], "archived", "已开始 Project");
			setProjectThoughtId(null);
			navigate("projects", {
				projectId: project.id,
				initializeProject: true,
				returnTo: "inbox"
			});
		} catch {
			setNotice({ text: "未能创建 Project，请重试。" });
		} finally {
			setBusyId(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		inbox.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "inbox-active-header",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
				title: "处理 Inbox",
				description: `${inbox.length} 条想法等待下一步。`,
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "inbox-header-capture",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickCapture, { compact: true })
				})
			})
		}) : null,
		notice.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "inbox-notice",
			role: "status",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: notice.text }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "inbox-notice-actions",
					children: [notice.kind === "convert" && draftTaskId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => navigate("calendar", {
							taskId: draftTaskId,
							openCandidates: true
						}),
						children: "去安排"
					}) : null, notice.thoughtId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void undoNotice(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { size: 14 }), "撤销"]
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "icon-button inbox-notice-close",
					type: "button",
					onClick: () => setNotice({ text: "" }),
					"aria-label": "关闭提示",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
				})
			]
		}) : null,
		inbox.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "inbox-list",
			children: inbox.map((thought) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InboxItem, {
				thought,
				goals: visibleGoals,
				rowBusy: busyId === thought.id,
				projectOpen: projectThoughtId === thought.id,
				onConvert: () => void convertToTask(thought.id),
				onBeginProject: () => setProjectThoughtId(thought.id),
				onDelete: () => void removeThought(thought.id),
				onCloseProject: () => setProjectThoughtId(null),
				onConfirmProject: (input) => void confirmProject(thought.id, input)
			}, thought.id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "inbox-empty-entry",
			"aria-label": "记录 Inbox 想法",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickCapture, {
				compact: true,
				autoFocus: true
			})
		})
	] });
}
//#endregion
export { InboxView };
