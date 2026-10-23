import { l as __toESM, n as require_jsx_runtime, o as require_react } from "../index.js";
import { A as buildProjectTreeIndex, F as MORANDI_COLORS, N as parseProjectMarkdown, _ as buildChatGptContext, d as EmptyState, f as Plus, h as usePlanner, i as Check, p as createLucideIcon, r as Circle, v as buildProjectMarkdown } from "./ui-CjSwuoD-.js";
import { n as useAppNavigation } from "./app-navigation-DNXAglzE.js";
import { t as Timer } from "./timer-CSUERsNy.js";
import { a as ModalShell, t as ScheduleBlockComposer } from "./composers-CfWdIHDn.js";
import { t as Trash2 } from "./trash-2-DHjjW3NH.js";
import { n as FolderTree, t as Ellipsis } from "./ellipsis-SKurWVbg.js";
import { t as ChevronDown } from "./chevron-down-ZQ5WPbjD.js";
import { t as ChevronLeft } from "./chevron-left-DuMDGWXQ.js";
import { t as ChevronRight } from "./chevron-right-0GZKBAFw.js";
//#region node_modules/lucide-react/dist/esm/icons/calendar-days.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CalendarDays = createLucideIcon("CalendarDays", [
	["path", {
		d: "M8 2v4",
		key: "1cmpym"
	}],
	["path", {
		d: "M16 2v4",
		key: "4m81vk"
	}],
	["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "4",
		rx: "2",
		key: "1hopcy"
	}],
	["path", {
		d: "M3 10h18",
		key: "8toen8"
	}],
	["path", {
		d: "M8 14h.01",
		key: "6423bh"
	}],
	["path", {
		d: "M12 14h.01",
		key: "1etili"
	}],
	["path", {
		d: "M16 14h.01",
		key: "1gbofw"
	}],
	["path", {
		d: "M8 18h.01",
		key: "lrp35t"
	}],
	["path", {
		d: "M12 18h.01",
		key: "mhygvu"
	}],
	["path", {
		d: "M16 18h.01",
		key: "kzsmim"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/focus.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Focus = createLucideIcon("Focus", [
	["circle", {
		cx: "12",
		cy: "12",
		r: "3",
		key: "1v7zrd"
	}],
	["path", {
		d: "M3 7V5a2 2 0 0 1 2-2h2",
		key: "aa7l1z"
	}],
	["path", {
		d: "M17 3h2a2 2 0 0 1 2 2v2",
		key: "4qcy5o"
	}],
	["path", {
		d: "M21 17v2a2 2 0 0 1-2 2h-2",
		key: "6vwrx8"
	}],
	["path", {
		d: "M7 21H5a2 2 0 0 1-2-2v-2",
		key: "ioqczr"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/sparkles.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Sparkles = createLucideIcon("Sparkles", [
	["path", {
		d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
		key: "4pj2yx"
	}],
	["path", {
		d: "M20 3v4",
		key: "1olli1"
	}],
	["path", {
		d: "M22 5h-4",
		key: "1gvqau"
	}],
	["path", {
		d: "M4 17v2",
		key: "vumght"
	}],
	["path", {
		d: "M5 18H3",
		key: "zchphs"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/target.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Target = createLucideIcon("Target", [
	["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}],
	["circle", {
		cx: "12",
		cy: "12",
		r: "6",
		key: "1vlfrh"
	}],
	["circle", {
		cx: "12",
		cy: "12",
		r: "2",
		key: "1c9p78"
	}]
]);
//#endregion
//#region components/views/projects/node-tree.tsx
var import_jsx_runtime = require_jsx_runtime();
function NodeTree({ nodes, parentId, mode, collapsed, scheduleBlocks, onCollapse, onMove, onUpdate, onToggle, onFocus, onDelete, onSchedule, treeIndex, collapsedIds, plannedSourceIds }) {
	const index = treeIndex ?? buildProjectTreeIndex(nodes);
	const foldedIds = collapsedIds ?? new Set(collapsed);
	const plannedIds = plannedSourceIds ?? new Set(scheduleBlocks.filter((block) => block.status === "planned").map((block) => block.sourceId));
	const children = index.childrenByParentId.get(parentId) ?? [];
	if (!children.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: children.map((node) => {
		const leaf = index.leafIds.has(node.id);
		const progress = index.progressByNodeId.get(node.id) ?? {
			completed: 0,
			total: 0
		};
		const derivedComplete = leaf ? node.status === "completed" : progress.total > 0 && progress.completed === progress.total;
		const folded = foldedIds.has(node.id);
		const planned = plannedIds.has(node.id);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: [derivedComplete ? "is-completed" : "", node.isFocused ? "is-focused" : ""].filter(Boolean).join(" "),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "outline-node",
				draggable: true,
				onDragStart: (event) => event.dataTransfer.setData("application/project-node", node.id),
				onDragOver: (event) => event.preventDefault(),
				onDrop: (event) => {
					event.stopPropagation();
					onMove(event, node.id);
				},
				children: [
					leaf ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "node-checkpoint",
						type: "button",
						onClick: () => void onToggle(node.id),
						"aria-label": derivedComplete ? "恢复步骤" : "完成步骤",
						children: derivedComplete ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 13 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { size: 14 })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "node-collapse",
						type: "button",
						onClick: () => onCollapse(folded ? collapsed.filter((id) => id !== node.id) : [...collapsed, node.id]),
						"aria-label": folded ? "展开子项" : "折叠子项",
						children: folded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 14 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "node-inline-title",
						defaultValue: node.title,
						rows: 1,
						ref: (element) => resizeNodeTitle(element),
						onInput: (event) => resizeNodeTitle(event.currentTarget),
						onBlur: (event) => {
							const title = event.target.value.replace(/\s+/g, " ").trim();
							event.currentTarget.value = title || node.title;
							resizeNodeTitle(event.currentTarget);
							if (title && title !== node.title) onUpdate(node.id, { title });
						},
						onKeyDown: (event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								event.currentTarget.blur();
							}
							if (event.key === "Tab" && leaf && node.status !== "completed") event.preventDefault();
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: leaf ? planned ? "已安排" : node.isFocused ? "当前推进" : "未设为推进" : `${progress.completed}/${progress.total}` }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "node-hover-actions",
						children: [
							leaf && node.status !== "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: node.needsContinuousTime ? "is-active" : "",
								onClick: () => void onUpdate(node.id, {
									needsContinuousTime: !node.needsContinuousTime,
									isFragmentFriendly: false
								}),
								title: node.needsContinuousTime ? "取消需要连续时间" : "标记为需要连续时间",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, { size: 13 })
							}) : null,
							leaf && node.status !== "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: node.isFragmentFriendly ? "is-active" : "",
								onClick: () => void onUpdate(node.id, {
									isFragmentFriendly: !node.isFragmentFriendly,
									needsContinuousTime: false
								}),
								title: node.isFragmentFriendly ? "取消适合碎片时间" : "标记为适合碎片时间",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 13 })
							}) : null,
							leaf && node.status !== "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: node.isFocused ? "is-active" : "",
								onClick: () => void onFocus(node.id),
								title: node.isFocused ? "取消当前推进" : "设为当前推进",
								children: node.isFocused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { size: 13 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Focus, { size: 13 })
							}) : null,
							leaf && node.status !== "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => onSchedule(node),
								title: "安排到 Calendar",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { size: 13 })
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void onDelete(node.id),
								title: "删除",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 13 })
							})
						]
					})
				]
			}), !folded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeTree, {
				nodes,
				parentId: node.id,
				mode,
				collapsed,
				scheduleBlocks,
				onCollapse,
				onMove,
				onUpdate,
				onToggle,
				onFocus,
				onDelete,
				onSchedule,
				treeIndex: index,
				collapsedIds: foldedIds,
				plannedSourceIds: plannedIds
			}) : null]
		}, node.id);
	}) });
}
function resizeNodeTitle(element) {
	if (!element) return;
	element.style.height = "auto";
	element.style.height = `${element.scrollHeight}px`;
}
//#endregion
//#region components/views/projects/project-outline.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function normalizeCandidateParents(candidates) {
	const depthIndexes = [];
	return candidates.filter((candidate) => candidate.title.trim()).map((candidate, index, validCandidates) => {
		const previousDepth = index ? validCandidates[index - 1].depth : 0;
		const depth = Math.max(0, Math.min(candidate.depth, index ? previousDepth + 1 : 0));
		while (depthIndexes.length > depth) depthIndexes.pop();
		const parentIndex = depth === 0 ? null : depthIndexes[depth - 1] ?? null;
		depthIndexes[depth] = index;
		return {
			...candidate,
			depth: parentIndex == null ? 0 : depth,
			parentIndex
		};
	});
}
//#endregion
//#region components/views/projects/project-initializer.tsx
function ProjectInitializer({ goal, goals, targetProject, movingProject, onCancel, onDelete, onGoalChange, onReady }) {
	const { importProjectOutline } = usePlanner();
	const [title, setTitle] = (0, import_react.useState)(targetProject?.title ?? "");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	async function generateProject(event) {
		event.preventDefault();
		const projectTitle = title.trim();
		if (!projectTitle || loading) return;
		setLoading(true);
		setError("");
		try {
			const response = await fetch("/api/ai/project-outline", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					goal: goal.name,
					project: projectTitle
				})
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.message ?? "Agnes 暂时无法生成 Project。");
			const parsed = parseProjectMarkdown(payload.markdown ?? "");
			if (parsed.errors.length || !parsed.candidates.length) throw new Error(parsed.errors.join("；") || "Agnes 没有返回可用的 Project 大纲。");
			onReady(await importProjectOutline(goal.id, projectTitle, normalizeCandidateParents(parsed.candidates), targetProject?.sourceThoughtIds ?? [], targetProject?.id));
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Project 没有创建成功，请稍后再试。");
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "project-init-panel",
		"aria-label": "Project 初始化",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "project-init-header",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "quiet-back-button",
				type: "button",
				onClick: onCancel,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 15 }), " 返回 Projects"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "section-kicker",
				children: "Project 初始化"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "source-context",
				children: ["Goal · ", goal.name]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "project-init-form",
			"aria-busy": loading,
			onSubmit: generateProject,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "project-init-title",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Project 名称" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						disabled: loading,
						value: title,
						onChange: (event) => setTitle(event.target.value),
						placeholder: "例如：准备暑期实习"
					})]
				}),
				targetProject ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "project-init-goal",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "所属 Goal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: targetProject.goalId,
						disabled: loading || movingProject,
						onChange: (event) => onGoalChange(event.target.value),
						children: goals.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.id,
							children: item.name
						}, item.id))
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "project-init-submit-row",
					children: [targetProject ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "danger-action",
						type: "button",
						disabled: loading,
						onClick: onDelete,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 }), " 删除 Project"]
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "primary-button",
						type: "submit",
						disabled: !title.trim() || loading,
						children: loading ? "正在生成…" : "创建 Project"
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "form-error",
					role: "alert",
					children: error
				}) : null
			]
		})]
	});
}
//#endregion
//#region components/views/projects/project-dialogs.tsx
function ProjectDialogs({ deleteGoalTarget, currentProject, nodeDeleteTarget, endProjectOpen, deleteProjectOpen, deletingGoal, archivingProject, deletingProject, onCloseGoalDelete, onDeleteGoal, onCloseProjectEnd, onArchiveProject, onCloseProjectDelete, onDeleteProject, onCloseNodeDelete, onDeleteNode }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		deleteGoalTarget ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalShell, {
			title: "删除 Goal",
			onClose: onCloseGoalDelete,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "destructive-dialog",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"“",
					deleteGoalTarget.name,
					"”及其中的 Projects、节点和相关安排都会被删除。"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: onCloseGoalDelete,
					children: "取消"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "danger-action is-confirm",
					type: "button",
					disabled: deletingGoal,
					onClick: () => void onDeleteGoal(),
					children: deletingGoal ? "正在删除" : "确认删除"
				})] })]
			})
		}) : null,
		endProjectOpen && currentProject ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalShell, {
			title: "结束 Project",
			onClose: onCloseProjectEnd,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "destructive-dialog",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"结束后，“",
					currentProject.title,
					"”会移到归档 Project。"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: onCloseProjectEnd,
					children: "取消"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "primary-button",
					type: "button",
					disabled: archivingProject,
					onClick: () => void onArchiveProject(),
					children: archivingProject ? "正在归档" : "结束并归档"
				})] })]
			})
		}) : null,
		deleteProjectOpen && currentProject ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalShell, {
			title: "删除 Project",
			onClose: onCloseProjectDelete,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "destructive-dialog",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"“",
					currentProject.title,
					"”的全部节点和相关安排都会被删除。"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: onCloseProjectDelete,
					children: "取消"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "danger-action is-confirm",
					type: "button",
					disabled: deletingProject,
					onClick: () => void onDeleteProject(),
					children: deletingProject ? "正在删除" : "确认删除"
				})] })]
			})
		}) : null,
		nodeDeleteTarget ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalShell, {
			title: "删除步骤",
			onClose: onCloseNodeDelete,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "destructive-dialog",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "这个步骤及其全部子项会被删除，相关未来安排也会移除。" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: onCloseNodeDelete,
					children: "保留"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "danger-action is-confirm",
					type: "button",
					onClick: () => {
						onCloseNodeDelete();
						onDeleteNode(nodeDeleteTarget);
					},
					children: "确认删除"
				})] })]
			})
		}) : null
	] });
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/copy.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Copy = createLucideIcon("Copy", [["rect", {
	width: "14",
	height: "14",
	x: "8",
	y: "8",
	rx: "2",
	ry: "2",
	key: "17jyea"
}], ["path", {
	d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
	key: "zix9uf"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/file-text.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileText = createLucideIcon("FileText", [
	["path", {
		d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
		key: "1rqfz7"
	}],
	["path", {
		d: "M14 2v4a2 2 0 0 0 2 2h4",
		key: "tnqrlb"
	}],
	["path", {
		d: "M10 9H8",
		key: "b1mrlr"
	}],
	["path", {
		d: "M16 13H8",
		key: "t4e002"
	}],
	["path", {
		d: "M16 17H8",
		key: "z1uh3a"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/list-tree.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ListTree = createLucideIcon("ListTree", [
	["path", {
		d: "M21 12h-8",
		key: "1bmf0i"
	}],
	["path", {
		d: "M21 6H8",
		key: "1pqkrb"
	}],
	["path", {
		d: "M21 18h-8",
		key: "1tm79t"
	}],
	["path", {
		d: "M3 6v4c0 1.1.9 2 2 2h3",
		key: "1ywdgy"
	}],
	["path", {
		d: "M3 10v6c0 1.1.9 2 2 2h3",
		key: "2wc746"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/maximize-2.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Maximize2 = createLucideIcon("Maximize2", [
	["polyline", {
		points: "15 3 21 3 21 9",
		key: "mznyad"
	}],
	["polyline", {
		points: "9 21 3 21 3 15",
		key: "1avn1i"
	}],
	["line", {
		x1: "21",
		x2: "14",
		y1: "3",
		y2: "10",
		key: "ota7mn"
	}],
	["line", {
		x1: "3",
		x2: "10",
		y1: "21",
		y2: "14",
		key: "1atl0r"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/zoom-in.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ZoomIn = createLucideIcon("ZoomIn", [
	["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}],
	["line", {
		x1: "21",
		x2: "16.65",
		y1: "21",
		y2: "16.65",
		key: "13gj7c"
	}],
	["line", {
		x1: "11",
		x2: "11",
		y1: "8",
		y2: "14",
		key: "1vmskp"
	}],
	["line", {
		x1: "8",
		x2: "14",
		y1: "11",
		y2: "11",
		key: "durymu"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/zoom-out.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ZoomOut = createLucideIcon("ZoomOut", [
	["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}],
	["line", {
		x1: "21",
		x2: "16.65",
		y1: "21",
		y2: "16.65",
		key: "13gj7c"
	}],
	["line", {
		x1: "8",
		x2: "14",
		y1: "11",
		y2: "11",
		key: "durymu"
	}]
]);
//#endregion
//#region components/views/projects/project-editor.tsx
function ProjectEditor(props) {
	const { project, progress, error, mode } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "project-editor",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectEditorHeader, { ...props }),
			progress.total > 0 && progress.completed === progress.total && project.status === "active" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "project-completion-banner",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "所有步骤都已完成" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Project 不会自动结束，由你确认。" })] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "primary-button",
					type: "button",
					onClick: props.onEndProject,
					children: "确认结束 Project"
				})]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-error",
				role: "alert",
				children: error
			}) : null,
			mode === "markdown" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectMarkdownView, { ...props }) : null,
			mode === "outline" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectOutlineView, { ...props }) : null,
			mode === "map" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectMapView, { ...props }) : null
		]
	});
}
function ProjectEditorHeader({ project, goals, progress, mode, generatedMarkdown, movingProject, copyingProject, onModeChange, onMarkdownChange, onProjectUpdate, onCopyContext, onStatusChange, onCopyProject, onGoalChange, onEndProject, onDeleteProject }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "project-editor-header",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "project-editor-title",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: project.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				progress.completed,
				" / ",
				progress.total,
				" 个可执行步骤已完成",
				project.status !== "active" ? ` · ${projectStatusLabel(project.status)}` : ""
			] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "project-editor-actions",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "project-window-fields",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "project-goal-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "所属 Goal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								"aria-label": "所属 Goal",
								value: project.goalId,
								disabled: movingProject,
								onChange: (event) => onGoalChange(event.target.value),
								children: goals.map((goal) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: goal.id,
									children: goal.name
								}, goal.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "计划开始" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: project.plannedStartDate ?? "",
							onChange: (event) => void onProjectUpdate({ plannedStartDate: event.target.value || null })
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "计划结束" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: project.plannedEndDate ?? "",
							onChange: (event) => void onProjectUpdate({ plannedEndDate: event.target.value || null })
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "segmented-control",
					"aria-label": "Project 呈现方式",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: mode === "outline" ? "is-active" : "",
							onClick: () => onModeChange("outline"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListTree, { size: 14 }), " 大纲"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: mode === "map" ? "is-active" : "",
							onClick: () => onModeChange("map"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { size: 14 }), " 思维导图"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: mode === "markdown" ? "is-active" : "",
							onClick: () => {
								onMarkdownChange(generatedMarkdown);
								onModeChange("markdown");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { size: 14 }), " Markdown"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onCopyContext,
					title: "复制给 GPT",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 15 })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "project-more-menu",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						title: "Project 操作",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 16 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						!isArchivedProject$1(project) ? project.status === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onStatusChange("active"),
							children: "继续 Project"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onStatusChange("paused"),
							children: "暂停 Project"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: copyingProject,
							onClick: onCopyProject,
							children: copyingProject ? "正在复制…" : "复制 Project"
						}),
						!isArchivedProject$1(project) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onEndProject,
							children: "结束 Project"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "danger-action",
							type: "button",
							onClick: onDeleteProject,
							children: "删除 Project"
						})
					] })]
				})
			]
		})]
	});
}
function ProjectMarkdownView({ markdownDraft, onMarkdownChange, onParseMarkdown }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "project-markdown-editor",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			className: "markdown-editor",
			value: markdownDraft,
			onChange: (event) => onMarkdownChange(event.target.value),
			placeholder: "在这里查看或编辑 Project Markdown",
			rows: 18
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "project-markdown-actions",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "secondary-button",
				type: "button",
				onClick: onParseMarkdown,
				children: "解析 Markdown"
			})
		})]
	});
}
function ProjectOutlineView(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectStructure, {
		...props,
		mode: "outline"
	});
}
function ProjectMapView(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mindmap-toolbar",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => props.onMapScaleChange(Math.max(.65, props.mapScale - .1)),
				"aria-label": "缩小",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomOut, { size: 15 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [Math.round(props.mapScale * 100), "%"] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => props.onMapScaleChange(Math.min(1.5, props.mapScale + .1)),
				"aria-label": "放大",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomIn, { size: 15 })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => props.onMapScaleChange(.9),
				title: "适应画布",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { size: 15 })
			})
		] })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectStructure, {
		...props,
		mode: "map"
	})] });
}
function ProjectStructure(props) {
	const { mode, project, nodes, mapScale } = props;
	const tree = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeTree, {
		nodes,
		parentId: null,
		mode,
		collapsed: props.collapsed,
		scheduleBlocks: props.scheduleBlocks,
		onCollapse: props.onCollapse,
		onMove: props.onMoveNode,
		onUpdate: props.onUpdateNode,
		onToggle: props.onToggleNode,
		onFocus: props.onFocusNode,
		onDelete: props.onDeleteNode,
		onSchedule: props.onScheduleNode
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `project-structure ${mode}-mode`,
		onDragOver: (event) => event.preventDefault(),
		onDrop: (event) => void props.onMoveNode(event, null),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: mode === "map" ? "map-transform" : void 0,
			style: mode === "map" ? {
				transform: `scale(${mapScale})`,
				transformOrigin: "top left"
			} : void 0,
			children: mode === "map" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "map-root",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "map-root-card",
					children: project.title
				}), tree]
			}) : tree
		}), !nodes.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { size: 20 }),
			title: "暂无 Project 节点"
		}) : null]
	});
}
function isArchivedProject$1(project) {
	return project.status === "completed" || project.status === "abandoned";
}
function projectStatusLabel(status) {
	return {
		active: "进行中",
		paused: "已暂停",
		completed: "已归档",
		abandoned: "已归档"
	}[status];
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/archive.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Archive = createLucideIcon("Archive", [
	["rect", {
		width: "20",
		height: "5",
		x: "2",
		y: "3",
		rx: "1",
		key: "1wp1u1"
	}],
	["path", {
		d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",
		key: "1s80jp"
	}],
	["path", {
		d: "M10 12h4",
		key: "a56b0p"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/pencil.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Pencil = createLucideIcon("Pencil", [["path", {
	d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
	key: "1a8usu"
}], ["path", {
	d: "m15 5 4 4",
	key: "1mk7zo"
}]]);
//#endregion
//#region components/views/projects/project-navigation.tsx
function GoalRail({ goals, projects, currentGoalId, onSelect, onEdit, onDelete, onCreate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: "projects-goal-rail",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "projects-goal-nav",
			"aria-label": "切换 Goal",
			children: [goals.map((goal, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "projects-goal-item",
				style: { "--swatch": goal.color ?? MORANDI_COLORS[index % MORANDI_COLORS.length] },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: currentGoalId === goal.id ? "projects-goal-link is-active" : "projects-goal-link",
						type: "button",
						onClick: () => onSelect(goal.id),
						"aria-label": `${goal.name}，${projects.filter((project) => project.goalId === goal.id).length} 个 Project`,
						title: goal.name,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "projects-goal-swatch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: goal.name })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "projects-goal-edit",
						type: "button",
						onClick: () => onEdit(goal.id),
						"aria-label": `编辑 Goal：${goal.name}`,
						title: "编辑 Goal",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { size: 14 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "projects-goal-delete",
						type: "button",
						onClick: () => onDelete(goal.id),
						"aria-label": `删除 Goal：${goal.name}`,
						title: "删除 Goal",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
					})
				]
			}, goal.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "projects-goal-add",
				type: "button",
				onClick: onCreate,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "新建 Goal" })
				]
			})]
		})
	});
}
function GoalForm({ name, color, busy, label, busyLabel, onNameChange, onColorChange, onCancel, onSubmit }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "projects-goal-form",
		"aria-label": label,
		onSubmit,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				autoFocus: true,
				"aria-label": "Goal 名称",
				value: name,
				onChange: (event) => onNameChange(event.target.value),
				placeholder: "长期方向，例如：科研"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "morandi-palette",
				"aria-label": "Goal 颜色",
				children: MORANDI_COLORS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: color === item ? "is-active" : "",
					style: { backgroundColor: item },
					onClick: () => onColorChange(item),
					"aria-label": `选择颜色 ${item}`
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "projects-goal-form-actions",
				children: [onCancel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					disabled: busy,
					onClick: onCancel,
					children: "取消"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "primary-button",
					type: "submit",
					disabled: !name.trim() || busy,
					children: busy ? busyLabel : label
				})]
			})
		]
	});
}
function ProjectTabs({ goal, currentProject, activeProjects, archivedProjects, archiveOpen, onSelect, onCreate, onShowActive, onShowArchive }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "project-tabs",
		role: "tablist",
		"aria-label": `${goal.name} 的 Project`,
		children: archiveOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			className: "project-tab-back",
			type: "button",
			onClick: onShowActive,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 14 }), " 返回"]
		}), archivedProjects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			className: currentProject?.id === project.id ? "is-active" : "",
			type: "button",
			role: "tab",
			"aria-selected": currentProject?.id === project.id,
			onClick: () => onSelect(project),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: project.title })
		}, project.id))] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			activeProjects.map((project) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: currentProject?.id === project.id ? "is-active" : "",
				type: "button",
				role: "tab",
				"aria-selected": currentProject?.id === project.id,
				onClick: () => onSelect(project),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: project.title }), project.initializationState === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "待初始化" }) : null]
			}, project.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "project-tab-create",
				type: "button",
				onClick: onCreate,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), " 新建 Project"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "project-tab-archive",
				type: "button",
				onClick: onShowArchive,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { size: 14 }),
					" 归档 Project",
					archivedProjects.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: archivedProjects.length }) : null
				]
			})
		] })
	});
}
//#endregion
//#region components/views/projects/projects-controller.ts
function isArchivedProject(project) {
	return project.status === "completed" || project.status === "abandoned";
}
function useProjectsController() {
	const planner = usePlanner();
	const { intent, navigate } = useAppNavigation();
	const { goals, projects, projectNodes, scheduleBlocks, settings, addGoal, updateGoal, deleteGoal, updateProject, deleteProject, duplicateProject, importProjectOutline, updateProjectNode, moveProjectNode, deleteProjectNode, toggleProjectNode, setProjectNodeFocus, saveSettings } = planner;
	const visibleGoals = goals.filter((goal) => !goal.archived);
	const defaultGoalId = settings.currentGoalId && visibleGoals.some((goal) => goal.id === settings.currentGoalId) ? settings.currentGoalId : visibleGoals[0]?.id ?? "";
	const [goalId, setGoalId] = (0, import_react.useState)(defaultGoalId);
	const [projectId, setProjectId] = (0, import_react.useState)(intent.projectId ?? settings.lastProjectByGoal[defaultGoalId] ?? "");
	const [mode, setMode] = (0, import_react.useState)("outline");
	const [markdownDrafts, setMarkdownDrafts] = (0, import_react.useState)({});
	const [newGoalOpen, setNewGoalOpen] = (0, import_react.useState)(!visibleGoals.length);
	const [newGoal, setNewGoal] = (0, import_react.useState)("");
	const [newGoalColor, setNewGoalColor] = (0, import_react.useState)(MORANDI_COLORS[0]);
	const [collapsed, setCollapsed] = (0, import_react.useState)([]);
	const [blockSource, setBlockSource] = (0, import_react.useState)(null);
	const [initializerOpen, setInitializerOpen] = (0, import_react.useState)(Boolean(intent.initializeProject));
	const [mapScale, setMapScale] = (0, import_react.useState)(1);
	const [notice, setNotice] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [creatingGoal, setCreatingGoal] = (0, import_react.useState)(false);
	const [editingGoalId, setEditingGoalId] = (0, import_react.useState)(null);
	const [goalDraftName, setGoalDraftName] = (0, import_react.useState)("");
	const [goalDraftColor, setGoalDraftColor] = (0, import_react.useState)(MORANDI_COLORS[0]);
	const [savingGoal, setSavingGoal] = (0, import_react.useState)(false);
	const [archiveOpen, setArchiveOpen] = (0, import_react.useState)(false);
	const [deleteGoalTargetId, setDeleteGoalTargetId] = (0, import_react.useState)(null);
	const [deletingGoal, setDeletingGoal] = (0, import_react.useState)(false);
	const [endProjectOpen, setEndProjectOpen] = (0, import_react.useState)(false);
	const [archivingProject, setArchivingProject] = (0, import_react.useState)(false);
	const [deleteProjectOpen, setDeleteProjectOpen] = (0, import_react.useState)(false);
	const [deletingProject, setDeletingProject] = (0, import_react.useState)(false);
	const [movingProject, setMovingProject] = (0, import_react.useState)(false);
	const [copyingProject, setCopyingProject] = (0, import_react.useState)(false);
	const copyingProjectRef = (0, import_react.useRef)(false);
	const [nodeDeleteTarget, setNodeDeleteTarget] = (0, import_react.useState)(null);
	const currentGoalId = visibleGoals.some((goal) => goal.id === goalId) ? goalId : visibleGoals[0]?.id ?? "";
	const currentGoal = visibleGoals.find((goal) => goal.id === currentGoalId) ?? null;
	const deleteGoalTarget = visibleGoals.find((goal) => goal.id === deleteGoalTargetId) ?? null;
	const editingGoal = visibleGoals.find((goal) => goal.id === editingGoalId) ?? null;
	const goalProjects = projects.filter((project) => project.goalId === currentGoalId);
	const activeProjects = goalProjects.filter((project) => !isArchivedProject(project));
	const archivedProjects = goalProjects.filter(isArchivedProject);
	const displayedProjects = archiveOpen ? archivedProjects : activeProjects;
	const preferredProjectId = settings.lastProjectByGoal[currentGoalId];
	const currentProject = displayedProjects.find((project) => project.id === projectId) ?? (!archiveOpen ? activeProjects.find((project) => project.id === preferredProjectId) : null) ?? (!archiveOpen ? activeProjects[0] : null) ?? null;
	const nodes = currentProject ? projectNodes.filter((node) => node.projectId === currentProject.id) : [];
	const generatedMarkdown = currentGoal && currentProject ? buildProjectMarkdown(currentGoal, currentProject, nodes) : "";
	const markdownDraft = currentProject ? markdownDrafts[currentProject.id] ?? generatedMarkdown : "";
	const parentNodeIds = new Set(nodes.map((node) => node.parentId).filter(Boolean));
	const leaves = nodes.filter((node) => !parentNodeIds.has(node.id));
	const progress = {
		completed: leaves.filter((node) => node.status === "completed").length,
		total: leaves.length
	};
	(0, import_react.useEffect)(() => {
		if (!intent.projectId) return;
		const target = projects.find((project) => project.id === intent.projectId);
		if (!target) return;
		const timeout = window.setTimeout(() => {
			setGoalId(target.goalId);
			setProjectId(target.id);
			setArchiveOpen(isArchivedProject(target));
			setInitializerOpen(intent.initializeProject || target.initializationState === "draft");
		}, 0);
		return () => window.clearTimeout(timeout);
	}, [
		intent.initializeProject,
		intent.projectId,
		projects
	]);
	(0, import_react.useEffect)(() => {
		if (!currentGoalId || settings.currentGoalId === currentGoalId) return;
		saveSettings({ currentGoalId });
	}, [
		currentGoalId,
		saveSettings,
		settings.currentGoalId
	]);
	(0, import_react.useEffect)(() => {
		if (!currentGoalId || !currentProject || archiveOpen || isArchivedProject(currentProject)) return;
		if (settings.lastProjectByGoal[currentGoalId] === currentProject.id) return;
		saveSettings({ lastProjectByGoal: {
			...settings.lastProjectByGoal,
			[currentGoalId]: currentProject.id
		} });
	}, [
		archiveOpen,
		currentGoalId,
		currentProject,
		saveSettings,
		settings.lastProjectByGoal
	]);
	(0, import_react.useEffect)(() => {
		if (!notice) return;
		const timeout = window.setTimeout(() => setNotice(""), 2600);
		return () => window.clearTimeout(timeout);
	}, [notice]);
	async function createGoal(event) {
		event.preventDefault();
		if (!newGoal.trim() || creatingGoal) return;
		setCreatingGoal(true);
		setError("");
		try {
			const goal = await addGoal(newGoal, newGoalColor);
			setGoalId(goal.id);
			setProjectId("");
			setNewGoal("");
			setNewGoalOpen(false);
			setNotice(`已进入 Goal：${goal.name}`);
		} catch {
			setError("Goal 没有创建成功，请再试一次。");
		} finally {
			setCreatingGoal(false);
		}
	}
	function startGoalEdit(id) {
		const goal = visibleGoals.find((item) => item.id === id);
		if (!goal) return;
		switchGoal(id);
		setEditingGoalId(id);
		setGoalDraftName(goal.name);
		setGoalDraftColor(goal.color ?? MORANDI_COLORS[0]);
		setNewGoalOpen(false);
	}
	function cancelGoalEdit() {
		setEditingGoalId(null);
		setGoalDraftName("");
	}
	function openGoalCreate() {
		cancelGoalEdit();
		setNewGoalOpen(true);
	}
	async function saveGoal(event) {
		event.preventDefault();
		const name = goalDraftName.trim();
		if (!editingGoal || !name || savingGoal) return;
		setSavingGoal(true);
		setError("");
		try {
			await updateGoal(editingGoal.id, {
				name,
				color: goalDraftColor
			});
			cancelGoalEdit();
			setNotice(`Goal 已更新：${name}`);
		} catch {
			setError("Goal 没有保存成功，请再试一次。");
		} finally {
			setSavingGoal(false);
		}
	}
	async function dropNode(event, parentId) {
		event.preventDefault();
		const id = event.dataTransfer.getData("application/project-node");
		if (!id || id === parentId) return;
		try {
			await moveProjectNode(id, parentId);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "节点移动失败");
		}
	}
	function switchGoal(id) {
		navigate("projects");
		setEditingGoalId(null);
		setNewGoalOpen(false);
		setGoalId(id);
		setProjectId(settings.lastProjectByGoal[id] ?? "");
		setArchiveOpen(false);
		setInitializerOpen(false);
		setError("");
	}
	async function copyContext() {
		if (!currentGoal || !currentProject) return;
		await navigator.clipboard.writeText(buildChatGptContext(currentGoal, currentProject, nodes));
		setNotice("已复制给 GPT。讨论完成后，可在 Markdown 模式粘贴并解析结果。");
	}
	async function changeProjectStatus(status) {
		if (!currentProject) return;
		await updateProject(currentProject.id, { status });
		setNotice(status === "completed" ? "Project 已归档" : status === "paused" ? "Project 已暂停" : "Project 已继续");
	}
	async function removeGoal() {
		if (!deleteGoalTargetId) return;
		const nextGoal = visibleGoals.find((goal) => goal.id !== deleteGoalTargetId) ?? null;
		setDeletingGoal(true);
		setError("");
		try {
			await deleteGoal(deleteGoalTargetId);
			navigate("projects");
			setGoalId(nextGoal?.id ?? "");
			setProjectId(nextGoal ? settings.lastProjectByGoal[nextGoal.id] ?? "" : "");
			setArchiveOpen(false);
			setInitializerOpen(false);
			setDeleteGoalTargetId(null);
			if (editingGoalId === deleteGoalTargetId) cancelGoalEdit();
			setNewGoalOpen(!nextGoal);
			setNotice("Goal 及其中的 Projects 和安排已删除");
		} catch {
			setError("Goal 没有删除成功，请稍后再试。");
		} finally {
			setDeletingGoal(false);
		}
	}
	async function copyProject() {
		if (!currentProject || copyingProjectRef.current) return;
		copyingProjectRef.current = true;
		setCopyingProject(true);
		setError("");
		try {
			const copy = await duplicateProject(currentProject.id);
			if (!copy) return;
			setArchiveOpen(false);
			setProjectId(copy.id);
			setInitializerOpen(copy.initializationState === "draft");
			navigate("projects", { projectId: copy.id });
			setNotice("已复制整棵结构，完成状态与安排已重置");
		} catch {
			setError("Project 没有复制成功，请稍后再试。");
		} finally {
			copyingProjectRef.current = false;
			setCopyingProject(false);
		}
	}
	async function moveCurrentProject(nextGoalId) {
		const project = currentProject;
		const nextGoal = visibleGoals.find((goal) => goal.id === nextGoalId);
		if (!project || !nextGoal || project.goalId === nextGoalId || movingProject) return;
		setMovingProject(true);
		setError("");
		try {
			await updateProject(project.id, {
				goalId: nextGoalId,
				order: projects.filter((item) => item.goalId === nextGoalId).length
			});
			setGoalId(nextGoalId);
			setProjectId(project.id);
			setArchiveOpen(isArchivedProject(project));
			setInitializerOpen(project.initializationState === "draft");
			navigate("projects", { projectId: project.id });
			setNotice(`Project 已移动到 Goal：${nextGoal.name}`);
		} catch {
			setError("Project 没有移动成功，请稍后再试。");
		} finally {
			setMovingProject(false);
		}
	}
	async function removeCurrentProject() {
		if (!currentProject) return;
		const removedProject = currentProject;
		const nextProject = displayedProjects.find((project) => project.id !== removedProject.id);
		setDeletingProject(true);
		setError("");
		setProjectId(nextProject?.id ?? "");
		navigate("projects", nextProject ? { projectId: nextProject.id } : void 0);
		setInitializerOpen(false);
		setDeleteProjectOpen(false);
		try {
			await deleteProject(removedProject.id);
			setNotice("Project 及其安排已删除");
		} catch {
			setProjectId(removedProject.id);
			navigate("projects", { projectId: removedProject.id });
			setInitializerOpen(removedProject.initializationState === "draft");
			setError("Project 没有删除成功，请稍后再试。");
		} finally {
			setDeletingProject(false);
		}
	}
	async function archiveCurrentProject() {
		if (!currentProject) return;
		setArchivingProject(true);
		setError("");
		try {
			await updateProject(currentProject.id, { status: "completed" });
			const nextProject = activeProjects.find((project) => project.id !== currentProject.id);
			navigate("projects", nextProject ? { projectId: nextProject.id } : void 0);
			setArchiveOpen(false);
			setProjectId(nextProject?.id ?? "");
			setEndProjectOpen(false);
			setNotice("Project 已归档");
		} catch {
			setError("Project 没有归档成功，请稍后再试。");
		} finally {
			setArchivingProject(false);
		}
	}
	async function parseMarkdownIntoProject() {
		if (!currentGoal || !currentProject || !markdownDraft.trim()) return;
		const result = parseProjectMarkdown(markdownDraft);
		if (result.errors.length || !result.candidates.length) {
			setError(result.errors.join("；") || "Markdown 中没有可执行节点");
			return;
		}
		try {
			setProjectId((await importProjectOutline(currentGoal.id, currentProject.title, normalizeCandidateParents(result.candidates), currentProject.sourceThoughtIds ?? [], currentProject.id)).id);
			setError("");
			setNotice(`Markdown 已解析为 ${result.candidates.length} 个节点`);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : "Markdown 同步失败");
		}
	}
	function setCurrentMarkdownDraft(value) {
		if (!currentProject) return;
		setMarkdownDrafts((drafts) => ({
			...drafts,
			[currentProject.id]: value
		}));
	}
	return {
		visibleGoals,
		projects,
		currentGoalId,
		currentGoal,
		deleteGoalTarget,
		editingGoal,
		activeProjects,
		archivedProjects,
		currentProject,
		nodes,
		scheduleBlocks,
		progress,
		generatedMarkdown,
		markdownDraft,
		goalStyle: { "--goal-color": currentGoal?.color ?? MORANDI_COLORS[0] },
		mode,
		mapScale,
		collapsed,
		archiveOpen,
		initializerOpen,
		notice,
		error,
		newGoalOpen,
		newGoal,
		newGoalColor,
		creatingGoal,
		goalDraftName,
		goalDraftColor,
		savingGoal,
		deletingGoal,
		archivingProject,
		deletingProject,
		movingProject,
		copyingProject,
		deleteGoalTargetId,
		endProjectOpen,
		deleteProjectOpen,
		nodeDeleteTarget,
		blockSource,
		createGoal,
		saveGoal,
		switchGoal,
		startGoalEdit,
		cancelGoalEdit,
		openGoalCreate,
		setDeleteGoalTargetId,
		setNewGoalOpen,
		setNewGoal,
		setNewGoalColor,
		setGoalDraftName,
		setGoalDraftColor,
		setProjectId,
		setInitializerOpen,
		setArchiveOpen,
		setMode,
		setMapScale,
		setMarkdownDraft: setCurrentMarkdownDraft,
		setCollapsed,
		setBlockSource,
		setEndProjectOpen,
		setDeleteProjectOpen,
		setNodeDeleteTarget,
		setError,
		copyContext,
		copyProject,
		moveCurrentProject,
		changeProjectStatus,
		parseMarkdownIntoProject,
		removeGoal,
		removeCurrentProject,
		archiveCurrentProject,
		dropNode,
		updateProject,
		updateProjectNode,
		toggleProjectNode,
		setProjectNodeFocus,
		deleteProjectNode,
		navigate,
		preferredProjectId
	};
}
//#endregion
//#region components/views/projects/projects-view.tsx
function ProjectsView() {
	const projects = useProjectsController();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		projects.notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "inline-toast",
			role: "status",
			children: projects.notice
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "projects-workspace",
			style: projects.goalStyle,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoalRail, {
				goals: projects.visibleGoals,
				projects: projects.projects,
				currentGoalId: projects.currentGoalId,
				onSelect: projects.switchGoal,
				onEdit: projects.startGoalEdit,
				onDelete: projects.setDeleteGoalTargetId,
				onCreate: projects.openGoalCreate
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "projects-content",
				children: [
					projects.newGoalOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoalForm, {
						name: projects.newGoal,
						color: projects.newGoalColor,
						busy: projects.creatingGoal,
						label: "创建并进入",
						busyLabel: "正在创建…",
						onNameChange: projects.setNewGoal,
						onColorChange: projects.setNewGoalColor,
						onSubmit: projects.createGoal
					}) : null,
					projects.editingGoal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoalForm, {
						name: projects.goalDraftName,
						color: projects.goalDraftColor,
						busy: projects.savingGoal,
						label: "保存 Goal",
						busyLabel: "正在保存…",
						onNameChange: projects.setGoalDraftName,
						onColorChange: projects.setGoalDraftColor,
						onCancel: projects.cancelGoalEdit,
						onSubmit: projects.saveGoal
					}) : null,
					projects.currentGoal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
							className: "projects-goal-heading",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: projects.currentGoal.name })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectTabs, {
							goal: projects.currentGoal,
							currentProject: projects.currentProject,
							activeProjects: projects.activeProjects,
							archivedProjects: projects.archivedProjects,
							archiveOpen: projects.archiveOpen,
							onSelect: (project) => {
								projects.setProjectId(project.id);
								projects.setInitializerOpen(!projects.archiveOpen && project.initializationState === "draft");
								projects.navigate("projects", { projectId: project.id });
							},
							onCreate: () => projects.setInitializerOpen(true),
							onShowActive: () => {
								projects.navigate("projects");
								projects.setArchiveOpen(false);
								projects.setProjectId(projects.activeProjects.find((project) => project.id === projects.preferredProjectId)?.id ?? projects.activeProjects[0]?.id ?? "");
							},
							onShowArchive: () => {
								projects.navigate("projects");
								projects.setArchiveOpen(true);
								projects.setInitializerOpen(false);
								projects.setProjectId("");
							}
						}),
						projects.initializerOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectInitializer, {
							goal: projects.currentGoal,
							goals: projects.visibleGoals,
							targetProject: projects.currentProject?.initializationState === "draft" ? projects.currentProject : null,
							movingProject: projects.movingProject,
							onCancel: () => projects.setInitializerOpen(false),
							onDelete: () => projects.setDeleteProjectOpen(true),
							onGoalChange: (goalId) => void projects.moveCurrentProject(goalId),
							onReady: (project) => {
								projects.setProjectId(project.id);
								projects.setInitializerOpen(false);
								projects.navigate("projects", { projectId: project.id });
							}
						}, `${projects.currentGoal.id}-${projects.currentProject?.id ?? "new"}`) : projects.currentProject ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectEditor, {
							project: projects.currentProject,
							goals: projects.visibleGoals,
							nodes: projects.nodes,
							scheduleBlocks: projects.scheduleBlocks,
							progress: projects.progress,
							mode: projects.mode,
							mapScale: projects.mapScale,
							markdownDraft: projects.markdownDraft,
							generatedMarkdown: projects.generatedMarkdown,
							error: projects.error,
							movingProject: projects.movingProject,
							copyingProject: projects.copyingProject,
							collapsed: projects.collapsed,
							onModeChange: projects.setMode,
							onMapScaleChange: projects.setMapScale,
							onMarkdownChange: projects.setMarkdownDraft,
							onParseMarkdown: () => void projects.parseMarkdownIntoProject(),
							onProjectUpdate: (patch) => projects.updateProject(projects.currentProject.id, patch),
							onGoalChange: (goalId) => void projects.moveCurrentProject(goalId),
							onCopyContext: () => void projects.copyContext(),
							onStatusChange: (status) => void projects.changeProjectStatus(status),
							onCopyProject: () => void projects.copyProject(),
							onEndProject: () => projects.setEndProjectOpen(true),
							onDeleteProject: () => projects.setDeleteProjectOpen(true),
							onCollapse: projects.setCollapsed,
							onMoveNode: projects.dropNode,
							onUpdateNode: projects.updateProjectNode,
							onToggleNode: projects.toggleProjectNode,
							onFocusNode: projects.setProjectNodeFocus,
							onDeleteNode: async (id) => {
								projects.setNodeDeleteTarget(id);
							},
							onScheduleNode: projects.setBlockSource
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { size: 22 }),
							title: projects.archiveOpen ? projects.archivedProjects.length ? "选择归档 Project" : "暂无归档 Project" : "暂无 Project"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { size: 22 }),
						title: "暂无 Goal"
					})
				]
			})]
		}, projects.currentGoalId || "empty"),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScheduleBlockComposer, {
			open: Boolean(projects.blockSource),
			source: projects.blockSource,
			onClose: () => projects.setBlockSource(null)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectDialogs, {
			deleteGoalTarget: projects.deleteGoalTarget,
			currentProject: projects.currentProject,
			nodeDeleteTarget: projects.nodeDeleteTarget,
			endProjectOpen: projects.endProjectOpen,
			deleteProjectOpen: projects.deleteProjectOpen,
			deletingGoal: projects.deletingGoal,
			archivingProject: projects.archivingProject,
			deletingProject: projects.deletingProject,
			onCloseGoalDelete: () => projects.setDeleteGoalTargetId(null),
			onDeleteGoal: projects.removeGoal,
			onCloseProjectEnd: () => projects.setEndProjectOpen(false),
			onArchiveProject: projects.archiveCurrentProject,
			onCloseProjectDelete: () => projects.setDeleteProjectOpen(false),
			onDeleteProject: projects.removeCurrentProject,
			onCloseNodeDelete: () => projects.setNodeDeleteTarget(null),
			onDeleteNode: async (id) => {
				projects.setNodeDeleteTarget(null);
				await projects.deleteProjectNode(id);
			}
		})
	] });
}
//#endregion
export { ProjectsView };
