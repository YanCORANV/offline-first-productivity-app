import { l as __toESM, n as require_jsx_runtime, o as require_react } from "../index.js";
import { G as localDateKey, a as SyncPill, h as usePlanner, l as Lightbulb, m as PlannerProvider, p as createLucideIcon, r as Circle } from "./ui-CjSwuoD-.js";
import { t as QuickActionsPanel } from "./quick-actions-panel-tSuCeHw7.js";
import { t as AppNavigationContext } from "./app-navigation-DNXAglzE.js";
import { i as InspectorShell } from "./composers-CfWdIHDn.js";
import { n as FolderTree, t as Ellipsis } from "./ellipsis-SKurWVbg.js";
//#region node_modules/lucide-react/dist/esm/icons/calendar-range.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CalendarRange = createLucideIcon("CalendarRange", [
	["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "4",
		rx: "2",
		key: "1hopcy"
	}],
	["path", {
		d: "M16 2v4",
		key: "4m81vk"
	}],
	["path", {
		d: "M3 10h18",
		key: "8toen8"
	}],
	["path", {
		d: "M8 2v4",
		key: "1cmpym"
	}],
	["path", {
		d: "M17 14h-6",
		key: "bkmgh3"
	}],
	["path", {
		d: "M13 18H7",
		key: "bb0bb7"
	}],
	["path", {
		d: "M7 14h.01",
		key: "1qa3f1"
	}],
	["path", {
		d: "M17 18h.01",
		key: "1bdyru"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/square-check.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var SquareCheck = createLucideIcon("SquareCheck", [["rect", {
	width: "18",
	height: "18",
	x: "3",
	y: "3",
	rx: "2",
	key: "afitv7"
}], ["path", {
	d: "m9 12 2 2 4-4",
	key: "dzmm74"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/inbox.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Inbox = createLucideIcon("Inbox", [["polyline", {
	points: "22 12 16 12 14 15 10 15 8 12 2 12",
	key: "o97t9d"
}], ["path", {
	d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
	key: "oot6mr"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/settings.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Settings = createLucideIcon("Settings", [["path", {
	d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
	key: "1qme2f"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]);
//#endregion
//#region components/app-shell/navigation.ts
var desktopNav = [
	{
		view: "today",
		label: "Today",
		href: "/today",
		icon: SquareCheck
	},
	{
		view: "calendar",
		label: "Calendar",
		href: "/calendar",
		icon: CalendarRange
	},
	{
		view: "projects",
		label: "Projects",
		href: "/projects",
		icon: FolderTree
	},
	{
		view: "inbox",
		label: "Inbox",
		href: "/inbox",
		icon: Inbox
	},
	{
		view: "settings",
		label: "Settings",
		href: "/settings",
		icon: Settings
	}
];
var mobileNav = desktopNav.filter((item) => [
	"today",
	"calendar",
	"projects",
	"inbox"
].includes(item.view));
var mobileMoreNav = desktopNav.filter((item) => item.view === "settings");
function handleNavigation(event, view, navigate) {
	if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	event.preventDefault();
	navigate(view);
}
function viewFromPath(pathname) {
	const segment = pathname.split("/").filter(Boolean)[0] ?? "today";
	if (segment === "plan") return "calendar";
	if ([
		"today",
		"quick",
		"focus",
		"inbox",
		"calendar",
		"projects",
		"settings"
	].includes(segment)) return segment;
	return "today";
}
function navigationUrl(view, intent) {
	const normalized = view === "plan" ? "calendar" : view;
	const params = new URLSearchParams();
	if (intent.thoughtId) params.set("thought", intent.thoughtId);
	if (intent.projectId) params.set("project", intent.projectId);
	if (intent.taskId) params.set("task", intent.taskId);
	if (intent.openCandidates) params.set("candidates", "1");
	if (intent.initializeProject) params.set("initialize", "1");
	if (intent.returnTo) params.set("return", intent.returnTo);
	const query = params.toString();
	return `/${normalized}${query ? `?${query}` : ""}`;
}
function readIntent(search) {
	const params = new URLSearchParams(search);
	const returnTo = params.get("return");
	return {
		thoughtId: params.get("thought") ?? void 0,
		projectId: params.get("project") ?? void 0,
		taskId: params.get("task") ?? void 0,
		openCandidates: params.get("candidates") === "1",
		initializeProject: params.get("initialize") === "1",
		returnTo: returnTo && [
			"today",
			"calendar",
			"projects",
			"inbox",
			"settings"
		].includes(returnTo) ? returnTo : void 0
	};
}
//#endregion
//#region components/app-shell/sidebar-memo.tsx
var import_jsx_runtime = require_jsx_runtime();
function SidebarMemo() {
	const { tasks, toggleTask, addTask } = usePlanner();
	const [draft, setDraft] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const todayKey = localDateKey(/* @__PURE__ */ new Date());
	const memoTasks = (0, import_react.useMemo)(() => {
		return tasks.filter((task) => {
			if (task.status !== "open" || task.planningState === "draft") return false;
			const taskDate = task.scheduledStartAt?.slice(0, 10) ?? task.dueAt?.slice(0, 10);
			return !taskDate || taskDate <= todayKey;
		}).sort((a, b) => {
			const aTime = a.scheduledStartAt ?? a.dueAt ?? "";
			const bTime = b.scheduledStartAt ?? b.dueAt ?? "";
			return aTime.localeCompare(bTime);
		});
	}, [tasks, todayKey]);
	async function handleQuickAdd(event) {
		event.preventDefault();
		const title = draft.trim();
		if (!title || saving) return;
		setSaving(true);
		try {
			const now = /* @__PURE__ */ new Date();
			now.setHours(23, 59, 0, 0);
			await addTask({
				title,
				planningState: "planned",
				taskKind: "ordinary",
				dueAt: now.toISOString()
			});
			setDraft("");
		} finally {
			setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "sidebar-memo-section",
		"aria-label": "常驻待办备忘录",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sidebar-memo-header",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "sidebar-memo-title-label",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheck, {
						size: 13,
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "待办备忘" })]
				}), memoTasks.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sidebar-memo-count",
					children: memoTasks.length
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sidebar-memo-list",
				role: "list",
				children: memoTasks.length ? memoTasks.map((task) => {
					const taskDate = task.scheduledStartAt?.slice(0, 10) ?? task.dueAt?.slice(0, 10);
					const isOverdue = Boolean(taskDate && taskDate < todayKey);
					const timeStr = task.scheduledStartAt ? task.scheduledStartAt.slice(11, 16) : null;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `sidebar-memo-item ${isOverdue ? "is-overdue" : ""}`,
						role: "listitem",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "sidebar-memo-check",
								type: "button",
								title: `完成：${task.title}`,
								"aria-label": `完成：${task.title}`,
								onClick: () => void toggleTask(task.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { size: 13 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sidebar-memo-item-title",
								title: task.title,
								children: task.title
							}),
							timeStr ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sidebar-memo-time",
								children: timeStr
							}) : isOverdue ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sidebar-memo-overdue-tag",
								children: "逾期"
							}) : null
						]
					}, task.id);
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "sidebar-memo-empty",
					children: "今天没有未完成待办"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
				className: "sidebar-memo-form",
				onSubmit: handleQuickAdd,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "sidebar-memo-input",
					type: "text",
					placeholder: "记一件待办事项... (Enter)",
					value: draft,
					disabled: saving,
					onChange: (event) => setDraft(event.target.value)
				})
			})
		]
	});
}
//#endregion
//#region components/app-shell/desktop-sidebar.tsx
function DesktopSidebar({ view, inboxCount, navigate, onQuickMode }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "sidebar",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "brand",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "brand-mark",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { size: 18 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Quiet Plan" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "sidebar-nav",
				"aria-label": "主要导航",
				children: desktopNav.map((item) => {
					const Icon = item.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: item.href,
						className: view === item.view ? "is-active" : "",
						"aria-current": view === item.view ? "page" : void 0,
						onClick: (event) => handleNavigation(event, item.view, navigate),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }),
							item.view === "inbox" && inboxCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: inboxCount }) : null
						]
					}, item.view);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarMemo, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sidebar-footer",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "quick-nav-link",
					onClick: () => onQuickMode("capture"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { size: 16 }), "记录想法"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SyncPill, {})]
			})
		]
	});
}
//#endregion
//#region components/app-shell/mobile-navigation.tsx
function MobileNavigation({ view, inboxCount, navigate, onQuickMode }) {
	const [moreOpen, setMoreOpen] = (0, import_react.useState)(false);
	const moreActive = mobileMoreNav.some((item) => item.view === view);
	function navigateFromMobile(event, nextView) {
		setMoreOpen(false);
		handleNavigation(event, nextView, navigate);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mobile-topbar",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "mobile-brand",
					href: "/today",
					onClick: (event) => navigateFromMobile(event, "today"),
					children: "Quiet Plan"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SyncPill, {})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `mobile-direct-actions ${moreOpen ? "is-hidden" : ""}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onQuickMode("capture"),
				"aria-label": "记录想法",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { size: 19 })
			})
		}),
		moreOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			className: "mobile-more-scrim",
			type: "button",
			"aria-label": "关闭更多导航",
			onClick: () => setMoreOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "mobile-more-menu",
			id: "mobile-more-menu",
			"aria-label": "更多导航",
			children: mobileMoreNav.map((item) => {
				const Icon = item.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: item.href,
					className: view === item.view ? "is-active" : "",
					"aria-current": view === item.view ? "page" : void 0,
					onClick: (event) => navigateFromMobile(event, item.view),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label })]
				}, item.view);
			})
		})] }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "bottom-nav",
			"aria-label": "移动端导航",
			children: [mobileNav.map((item) => {
				const Icon = item.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: item.href,
					className: view === item.view ? "is-active" : "",
					"aria-current": view === item.view ? "page" : void 0,
					onClick: (event) => navigateFromMobile(event, item.view),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 19 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }),
						item.view === "inbox" && inboxCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: inboxCount }) : null
					]
				}, item.view);
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: moreOpen || moreActive ? "is-active" : "",
				"aria-expanded": moreOpen,
				"aria-controls": "mobile-more-menu",
				onClick: () => setMoreOpen((open) => !open),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 19 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "更多" })]
			})]
		})
	] });
}
//#endregion
//#region components/app-shell/view-loader.tsx
var TodayView = (0, import_react.lazy)(() => import("./today-view-CJgcZCDb.js").then((module) => ({ default: module.TodayView })));
var InboxView = (0, import_react.lazy)(() => import("./inbox-view-UEA-YiSi.js").then((module) => ({ default: module.InboxView })));
var CalendarView = (0, import_react.lazy)(() => import("./calendar-view-C0G2GA4z.js").then((module) => ({ default: module.CalendarView })));
var ProjectsView = (0, import_react.lazy)(() => import("./projects-view-BZ0OXQ9z.js").then((module) => ({ default: module.ProjectsView })));
var SettingsView = (0, import_react.lazy)(() => import("./settings-view-DM2E77fC.js").then((module) => ({ default: module.SettingsView })));
var QuickView$1 = (0, import_react.lazy)(() => import("./quick-view-B2onNtGx.js").then((module) => ({ default: module.QuickView })));
function ViewLoader() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "view-loader",
		"aria-label": "正在准备页面",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
	});
}
function AppStartupSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "app-startup-skeleton",
		"aria-label": "正在打开计划",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "skeleton-line is-title" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "skeleton-line is-copy" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "skeleton-workspace",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})]
			})
		]
	});
}
function ActivePlannerView({ view }) {
	let content;
	if (view === "quick") content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickView$1, {});
	else if (view === "today") content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayView, {});
	else if (view === "calendar" || view === "plan") content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarView, {});
	else if (view === "projects") content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProjectsView, {});
	else if (view === "inbox") content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InboxView, {});
	else if (view === "settings") content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsView, {});
	else content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayView, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "planner-view is-active",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewLoader, {}),
			children: content
		})
	});
}
//#endregion
//#region components/app-shell/planner-shell.tsx
function PlannerAppShell({ initialView }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlannerProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlannerShell, { initialView }) });
}
function PlannerShell({ initialView }) {
	const { ready, thoughts } = usePlanner();
	const [view, setView] = (0, import_react.useState)(initialView);
	const [intent, setIntent] = (0, import_react.useState)(() => typeof window === "undefined" ? {} : readIntent(window.location.search));
	const viewRef = (0, import_react.useRef)(initialView);
	const scrollByView = (0, import_react.useRef)({});
	const [quickMode, setQuickMode] = (0, import_react.useState)(null);
	const inboxCount = (0, import_react.useMemo)(() => thoughts.filter((thought) => thought.status === "inbox").length, [thoughts]);
	(0, import_react.useEffect)(() => {
		viewRef.current = view;
	}, [view]);
	(0, import_react.useEffect)(() => {
		const previous = window.history.scrollRestoration;
		window.history.scrollRestoration = "manual";
		return () => {
			window.history.scrollRestoration = previous;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		const preload = () => {
			Promise.all([
				import("./today-view-CJgcZCDb.js"),
				import("./calendar-view-C0G2GA4z.js"),
				import("./projects-view-BZ0OXQ9z.js"),
				import("./inbox-view-UEA-YiSi.js"),
				import("./settings-view-DM2E77fC.js")
			]);
		};
		if ("requestIdleCallback" in window) {
			const idleId = window.requestIdleCallback(preload, { timeout: 1500 });
			return () => window.cancelIdleCallback(idleId);
		}
		const timerId = setTimeout(preload, 500);
		return () => clearTimeout(timerId);
	}, [ready]);
	const navigate = (0, import_react.useCallback)((nextView, nextIntent = {}) => {
		const normalized = nextView === "plan" ? "calendar" : nextView;
		const currentView = viewRef.current;
		if (currentView !== normalized) scrollByView.current[currentView] = window.scrollY;
		window.history.pushState({
			quietPlanView: normalized,
			quietPlanIntent: nextIntent
		}, "", navigationUrl(normalized, nextIntent));
		setView(normalized);
		setIntent(nextIntent);
		if (currentView !== normalized) window.requestAnimationFrame(() => window.scrollTo({
			top: scrollByView.current[normalized] ?? 0,
			behavior: "auto"
		}));
	}, []);
	(0, import_react.useEffect)(() => {
		const onPopState = () => {
			const nextView = viewFromPath(window.location.pathname);
			scrollByView.current[viewRef.current] = window.scrollY;
			setView(nextView);
			setIntent(readIntent(window.location.search));
			setQuickMode(null);
			window.requestAnimationFrame(() => window.scrollTo({
				top: scrollByView.current[nextView] ?? 0,
				behavior: "auto"
			}));
		};
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);
	const navigation = {
		view,
		intent,
		navigate
	};
	if (view === "quick" || view === "focus") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppNavigationContext.Provider, {
		value: navigation,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewLoader, {}),
			children: view === "quick" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickView, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FocusView, {})
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppNavigationContext.Provider, {
		value: navigation,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "app-shell",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DesktopSidebar, {
					view,
					inboxCount,
					navigate,
					onQuickMode: setQuickMode
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "main-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNavigation, {
						view,
						inboxCount,
						navigate,
						onQuickMode: setQuickMode
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "page-container persistent-view-stack",
						children: [!ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppStartupSkeleton, {}) : null, ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivePlannerView, { view }) : null]
					})]
				}),
				quickMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectorShell, {
					title: "记录想法",
					onClose: () => setQuickMode(null),
					panelClassName: "quick-actions-inspector",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuickActionsPanel, {
						mode: quickMode,
						onClose: () => setQuickMode(null)
					})
				}) : null
			]
		})
	});
}
var QuickView = (0, import_react.lazy)(() => import("./quick-view-B2onNtGx.js").then((module) => ({ default: module.QuickView })));
var FocusView = (0, import_react.lazy)(() => import("./focus-view-DRPdnZuZ.js").then((module) => ({ default: module.FocusView })));
//#endregion
//#region components/planner-app.tsx
function PlannerApp({ view }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlannerAppShell, { initialView: view === "plan" ? "calendar" : view });
}
//#endregion
export { PlannerApp };
