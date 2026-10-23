import { l as __toESM, n as require_jsx_runtime, o as require_react } from "../index.js";
import { F as MORANDI_COLORS, P as DEFAULT_ITEM_TYPES, f as Plus, h as usePlanner, o as LoaderCircle, p as createLucideIcon, s as Cloud, u as PageHeader } from "./ui-CjSwuoD-.js";
import { t as Trash2 } from "./trash-2-DHjjW3NH.js";
//#region node_modules/lucide-react/dist/esm/icons/map-pin.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var MapPin = createLucideIcon("MapPin", [["path", {
	d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
	key: "1r0f0z"
}], ["circle", {
	cx: "12",
	cy: "10",
	r: "3",
	key: "ilqhr7"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/clock-3.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Clock3 = createLucideIcon("Clock3", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["polyline", {
	points: "12 6 12 12 16.5 12",
	key: "1aq6pp"
}]]);
//#endregion
//#region components/views/settings/schedule-settings.tsx
var import_jsx_runtime = require_jsx_runtime();
function ScheduleSettingsSection({ form, setForm, onSave }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "settings-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "settings-card-heading",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "时间设置" }) })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "settings-schedule-content",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-schedule-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "settings-time-group",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "默认作息" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "field-grid settings-time-grid",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "起床时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								value: form.defaultWakeTime,
								onChange: (event) => setForm((current) => ({
									...current,
									defaultWakeTime: event.target.value
								}))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "入睡时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								value: form.defaultSleepTime,
								onChange: (event) => setForm((current) => ({
									...current,
									defaultSleepTime: event.target.value
								}))
							})]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "settings-time-group",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "时间轴显示范围" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "field-grid settings-time-grid",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "开始时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								value: form.calendarDisplayStart,
								onChange: (event) => setForm((current) => ({
									...current,
									calendarDisplayStart: event.target.value
								}))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "结束时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "time",
								value: form.calendarDisplayEnd,
								onChange: (event) => setForm((current) => ({
									...current,
									calendarDisplayEnd: event.target.value
								}))
							})]
						})]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "field-grid settings-meta-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Inbox 超时提醒" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: form.inboxAgeHours,
							onChange: (event) => setForm((current) => ({
								...current,
								inboxAgeHours: Number(event.target.value)
							})),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "24",
									children: "24 小时"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "48",
									children: "48 小时"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "72",
									children: "3 天"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "168",
									children: "7 天"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "时区" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: form.timezone,
							onChange: (event) => setForm((current) => ({
								...current,
								timezone: event.target.value
							}))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "secondary-button",
						type: "button",
						onClick: () => void onSave({
							defaultWakeTime: form.defaultWakeTime,
							defaultSleepTime: form.defaultSleepTime,
							calendarDisplayStart: form.calendarDisplayStart,
							calendarDisplayEnd: form.calendarDisplayEnd,
							inboxAgeHours: form.inboxAgeHours,
							timezone: form.timezone,
							lastTimezonePrompt: form.lastTimezonePrompt
						}),
						children: "保存设置"
					})
				]
			})]
		})]
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/palette.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Palette = createLucideIcon("Palette", [
	["circle", {
		cx: "13.5",
		cy: "6.5",
		r: ".5",
		fill: "currentColor",
		key: "1okk4w"
	}],
	["circle", {
		cx: "17.5",
		cy: "10.5",
		r: ".5",
		fill: "currentColor",
		key: "f64h9f"
	}],
	["circle", {
		cx: "8.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor",
		key: "fotxhn"
	}],
	["circle", {
		cx: "6.5",
		cy: "12.5",
		r: ".5",
		fill: "currentColor",
		key: "qy21gx"
	}],
	["path", {
		d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",
		key: "12rzf8"
	}]
]);
//#endregion
//#region components/views/settings/item-type-settings.tsx
function ItemTypesSettingsSection({ form, setForm, itemTypeName, onItemTypeNameChange, onRemove, onSave }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "settings-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-card-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "事项类型" }) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "item-type-settings",
				children: form.itemTypes.map((type) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: type.name,
						"aria-label": "事项类型名称",
						onChange: (event) => setForm((current) => ({
							...current,
							itemTypes: current.itemTypes.map((item) => item.id === type.id ? {
								...item,
								name: event.target.value
							} : item)
						}))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "item-type-color-input",
						type: "color",
						value: type.color,
						"aria-label": `设置 ${type.name} 的颜色`,
						title: `设置 ${type.name} 的颜色：${type.color}`,
						onChange: (event) => {
							const color = event.currentTarget.value;
							setForm((current) => ({
								...current,
								itemTypes: current.itemTypes.map((item) => item.id === type.id ? {
									...item,
									color
								} : item)
							}));
						}
					}),
					!DEFAULT_ITEM_TYPES.some((item) => item.id === type.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "item-type-delete",
						type: "button",
						onClick: () => void onRemove(type.id),
						"aria-label": `删除类型 ${type.name}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
					}) : null
				] }, type.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-save-row settings-create-save-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "inline-create",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: itemTypeName,
						"aria-label": "新增事项类型名称",
						onChange: (event) => onItemTypeNameChange(event.target.value),
						placeholder: "新增事项类型"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "新增事项类型",
						disabled: !itemTypeName.trim(),
						onClick: () => {
							setForm((current) => ({
								...current,
								itemTypes: [...current.itemTypes, {
									id: `type_${Date.now().toString(36)}`,
									name: itemTypeName.trim(),
									color: MORANDI_COLORS[current.itemTypes.length % MORANDI_COLORS.length]
								}]
							}));
							onItemTypeNameChange("");
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "secondary-button",
					type: "button",
					onClick: () => void onSave(),
					children: "保存类型"
				})]
			})
		]
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/bell.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Bell = createLucideIcon("Bell", [["path", {
	d: "M10.268 21a2 2 0 0 0 3.464 0",
	key: "vwvbt9"
}], ["path", {
	d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
	key: "11g9vi"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/smartphone.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Smartphone = createLucideIcon("Smartphone", [["rect", {
	width: "14",
	height: "20",
	x: "5",
	y: "2",
	rx: "2",
	ry: "2",
	key: "1yt0o3"
}], ["path", {
	d: "M12 18h.01",
	key: "mhygvu"
}]]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/circle-check.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CircleCheck = createLucideIcon("CircleCheck", [["circle", {
	cx: "12",
	cy: "12",
	r: "10",
	key: "1mglay"
}], ["path", {
	d: "m9 12 2 2 4-4",
	key: "dzmm74"
}]]);
//#endregion
//#region components/views/settings/settings-controls.tsx
function ServiceRow({ icon, label, connected, loading, impact, instruction }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "service-detail-row",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "service-detail-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "service-name",
					children: [icon, label]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: connected ? "service-status connected" : "service-status",
					children: [connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 13 }) : null, loading ? "检查中" : connected ? "已连接" : "尚未连接"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: impact }),
			!loading && !connected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: instruction }) : null
		]
	});
}
function permissionLabel(permission) {
	if (permission === "granted") return "已允许";
	if (permission === "denied") return "已拒绝";
	if (permission === "unsupported") return "不支持";
	return "尚未请求";
}
function timezonesEquivalent(a, b) {
	if (a === b) return true;
	try {
		const years = [
			/* @__PURE__ */ new Date(),
			new Date(Date.UTC(2026, 0, 15)),
			new Date(Date.UTC(2026, 6, 15))
		];
		const signature = (zone) => years.map((date) => new Intl.DateTimeFormat("en-CA", {
			timeZone: zone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23"
		}).format(date)).join("|");
		return signature(a) === signature(b);
	} catch {
		return false;
	}
}
function urlBase64ToUint8Array(base64String) {
	const base64 = (base64String + "=".repeat((4 - base64String.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}
//#endregion
//#region components/views/settings/settings-notifications.tsx
function DeviceNotificationSection({ settings, status, busy, message, onEnable }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "settings-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-card-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "此设备的提醒" }) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "permission-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "系统权限" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: permissionLabel(settings.notificationState) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-save-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "settings-footnote",
					children: "iPhone 和 iPad 需先把 PWA 添加到主屏幕。"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "secondary-button",
					type: "button",
					disabled: busy || status?.push !== "connected",
					onClick: () => void onEnable(),
					children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "spin",
						size: 16
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 16 }), status?.push === "connected" ? "启用后台提醒" : "先连接提醒服务"]
				})]
			}),
			message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "settings-message",
				children: message
			}) : null
		]
	});
}
function FragmentActivitiesSection({ activities, title, minutes, onTitleChange, onMinutesChange, onAdd, onUpdate, onDelete }) {
	const options = [
		15,
		30,
		60,
		90
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "settings-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-card-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "碎片时间固定活动" }) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "activity-list",
				children: activities.map((activity) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "activity-row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: activity.enabled,
							onChange: (event) => void onUpdate(activity.id, { enabled: event.target.checked }),
							"aria-label": `启用 ${activity.title}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "activity-title-input",
							defaultValue: activity.title,
							onBlur: (event) => {
								const nextTitle = event.currentTarget.value.trim();
								if (nextTitle && nextTitle !== activity.title) onUpdate(activity.id, { title: nextTitle });
							},
							"aria-label": "活动名称"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "activity-minute-options",
							"aria-label": `${activity.title} 适用时段`,
							children: options.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: activity.eligibleMinutes.includes(value) ? "is-active" : "",
								onClick: () => {
									const next = activity.eligibleMinutes.includes(value) ? activity.eligibleMinutes.filter((item) => item !== value) : [...activity.eligibleMinutes, value].sort((a, b) => a - b);
									if (next.length) onUpdate(activity.id, { eligibleMinutes: next });
								},
								children: value
							}, value))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "activity-delete",
							type: "button",
							onClick: () => void onDelete(activity.id),
							"aria-label": `删除 ${activity.title}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
						})
					]
				}, activity.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "inline-create activity-create",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: title,
						onChange: (event) => onTitleChange(event.target.value),
						placeholder: "阅读、Podcast、休息…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "activity-minute-options",
						children: options.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: minutes.includes(value) ? "is-active" : "",
							onClick: () => onMinutesChange((current) => current.includes(value) ? current.length > 1 ? current.filter((item) => item !== value) : current : [...current, value].sort((a, b) => a - b)),
							children: value
						}, value))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void onAdd(),
						"aria-label": "新增碎片活动",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 })
					})
				]
			})
		]
	});
}
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/triangle-alert.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var TriangleAlert = createLucideIcon("TriangleAlert", [
	["path", {
		d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
		key: "wmoenq"
	}],
	["path", {
		d: "M12 9v4",
		key: "juzpu7"
	}],
	["path", {
		d: "M12 17h.01",
		key: "p32p05"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/database.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Database = createLucideIcon("Database", [
	["ellipse", {
		cx: "12",
		cy: "5",
		rx: "9",
		ry: "3",
		key: "msslwz"
	}],
	["path", {
		d: "M3 5V19A9 3 0 0 0 21 19V5",
		key: "1wlel7"
	}],
	["path", {
		d: "M3 12A9 3 0 0 0 21 12",
		key: "mv7ke4"
	}]
]);
//#endregion
//#region node_modules/lucide-react/dist/esm/icons/key-round.js
/**
* @license lucide-react v0.468.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var KeyRound = createLucideIcon("KeyRound", [["path", {
	d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
	key: "1s6t7t"
}], ["circle", {
	cx: "16.5",
	cy: "7.5",
	r: ".5",
	fill: "currentColor",
	key: "w0ekpg"
}]]);
//#endregion
//#region components/views/settings/settings-services.tsx
function ServicesSection({ status, aiVerified, aiBusy, aiMessage, onTestAi }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "settings-card services-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-card-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cloud, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "服务连接" }) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceRow, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { size: 16 }),
				label: "多设备同步",
				connected: status?.cloud === "connected",
				loading: !status,
				impact: "未连接时只保存在本机。",
				instruction: "在服务端配置 SUPABASE_URL 与 SUPABASE_SECRET_KEY。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceRow, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { size: 16 }),
				label: "Agnes AI",
				connected: aiVerified,
				loading: !status,
				impact: "未连接时不能生成 Project 大纲或整理想法。",
				instruction: status?.ai === "connected" ? "Project 拆解和 Inbox 整理已通过真实请求。" : status?.ai === "configured" ? "密钥已配置，请运行真实连接测试。" : "把 Agnes Key 配置为服务端 AGNES_API_KEY。"
			}),
			status?.ai !== "unconfigured" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				className: "secondary-button service-test-button",
				type: "button",
				disabled: aiBusy,
				onClick: () => void onTestAi(),
				children: [aiBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
					className: "spin",
					size: 15
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { size: 15 }), aiBusy ? "正在测试…" : "测试 Agnes 真实连接"]
			}) : null,
			aiMessage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "settings-message",
				children: aiMessage
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceRow, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 16 }),
				label: "后台提醒",
				connected: status?.push === "connected",
				loading: !status,
				impact: "未连接时不会发送后台 Push。",
				instruction: "在服务端配置 VAPID_PUBLIC_KEY 与 VAPID_PRIVATE_KEY。"
			})
		]
	});
}
function PendingNotificationsSection({ notifications, onRead }) {
	const unread = notifications.filter((notification) => !notification.readAt);
	if (!unread.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "settings-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "settings-card-heading",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "错过的提醒" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "离线或未打开 PWA 时未能展示的提醒。" })] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "notification-list",
			children: unread.map((notification) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => void onRead(notification.id),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: notification.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: notification.body })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 15 })]
			}, notification.id))
		})]
	});
}
function ConflictSettingsSection({ conflicts, onResolve, onKeepAllLocal, busy }) {
	if (!conflicts.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "settings-card conflict-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-card-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 18 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "待处理的同步冲突" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "本机修改仍被保留，没有静默覆盖。" })] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "secondary-button",
				type: "button",
				disabled: busy,
				onClick: () => void onKeepAllLocal(),
				children: busy ? "正在处理…" : `全部保留本机（${conflicts.length}）`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "conflict-list",
				children: conflicts.map((conflict) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
					conflict.entityType,
					" · ",
					conflict.entityId.slice(-8)
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: conflict.conflictingFields.join("、") })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "conflict-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void onResolve(conflict.id, "server"),
						children: "使用云端"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void onResolve(conflict.id, "local"),
						children: "保留本机"
					})]
				})] }, conflict.id))
			})
		]
	});
}
//#endregion
//#region components/views/settings/settings-model.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var editableSettingsFields = [
	"defaultWakeTime",
	"defaultSleepTime",
	"calendarDisplayStart",
	"calendarDisplayEnd",
	"inboxAgeHours",
	"timezone",
	"lastTimezonePrompt",
	"itemTypes"
];
function mergeSettingsForm(previous, draft, incoming) {
	const rolledBack = incoming.version < previous.version;
	const edits = editableSettingsFields.filter((key) => rolledBack || JSON.stringify(draft[key]) !== JSON.stringify(previous[key])).map((key) => [key, draft[key]]);
	return {
		...incoming,
		...Object.fromEntries(edits)
	};
}
//#endregion
//#region components/views/settings/settings-controller.ts
function useSettingsController() {
	const { settings, saveSettings, removeItemType, conflicts, resolveConflict, resolveAllConflicts, fragmentActivities, addFragmentActivity, updateFragmentActivity, deleteFragmentActivity, notifications, markNotificationRead } = usePlanner();
	const [form, setForm] = (0, import_react.useState)(settings);
	const previousSettingsRef = (0, import_react.useRef)(settings);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [notificationMessage, setNotificationMessage] = (0, import_react.useState)("");
	const [notificationBusy, setNotificationBusy] = (0, import_react.useState)(false);
	const [aiBusy, setAiBusy] = (0, import_react.useState)(false);
	const [aiVerified, setAiVerified] = (0, import_react.useState)(false);
	const [aiMessage, setAiMessage] = (0, import_react.useState)("");
	const [activityTitle, setActivityTitle] = (0, import_react.useState)("");
	const [activityMinutes, setActivityMinutes] = (0, import_react.useState)([15]);
	const [itemTypeName, setItemTypeName] = (0, import_react.useState)("");
	const [saved, setSaved] = (0, import_react.useState)("");
	const [conflictResolutionBusy, setConflictResolutionBusy] = (0, import_react.useState)(false);
	const detectedTimezone = (0, import_react.useMemo)(() => Intl.DateTimeFormat().resolvedOptions().timeZone || settings.timezone, [settings.timezone]);
	const timezoneChanged = (0, import_react.useMemo)(() => !timezonesEquivalent(detectedTimezone, form.timezone) && form.lastTimezonePrompt !== detectedTimezone, [
		detectedTimezone,
		form.lastTimezonePrompt,
		form.timezone
	]);
	(0, import_react.useEffect)(() => {
		const previous = previousSettingsRef.current;
		previousSettingsRef.current = settings;
		setForm((current) => mergeSettingsForm(previous, current, settings));
	}, [settings]);
	(0, import_react.useEffect)(() => {
		fetch("/api/status").then((response) => response.json()).then((data) => {
			const next = data;
			setStatus(next);
			setAiVerified(next.ai === "connected");
		}).catch(() => setStatus({
			cloud: "unconfigured",
			ai: "unconfigured",
			push: "unconfigured"
		}));
	}, []);
	(0, import_react.useEffect)(() => {
		if (!saved) return;
		const timeout = window.setTimeout(() => setSaved(""), 2200);
		return () => window.clearTimeout(timeout);
	}, [saved]);
	async function save(patch = form) {
		try {
			await saveSettings(patch);
			setSaved("设置已保存");
		} catch {
			setSaved("没有保存成功，请重试");
		}
	}
	async function removeType(id) {
		try {
			if (settings.itemTypes.some((type) => type.id === id)) await removeItemType(id);
			setForm((current) => ({
				...current,
				itemTypes: current.itemTypes.filter((type) => type.id !== id)
			}));
		} catch {
			setSaved("没有删除成功，请重试");
		}
	}
	async function enableNotifications() {
		if (status?.push !== "connected") {
			setNotificationMessage("请先在服务端配置 VAPID 密钥；当前不会请求系统权限。");
			return;
		}
		setNotificationBusy(true);
		setNotificationMessage("");
		try {
			if (!("Notification" in window) || !("serviceWorker" in navigator)) {
				setNotificationMessage("此浏览器不支持后台通知，应用内仍会显示错过的提醒。");
				await saveSettings({ notificationState: "unsupported" });
				return;
			}
			const permission = await Notification.requestPermission();
			await saveSettings({ notificationState: permission });
			if (permission !== "granted") {
				setNotificationMessage("通知权限未开启，可稍后在系统设置中修改。");
				return;
			}
			const keyResponse = await fetch("/api/push/public-key");
			if (!keyResponse.ok) {
				setNotificationMessage("提醒服务未返回公钥，不会显示为已启用。");
				return;
			}
			const { publicKey } = await keyResponse.json();
			const subscription = await (await navigator.serviceWorker.ready).pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey)
			});
			if (!(await fetch("/api/push/subscriptions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					subscription: subscription.toJSON(),
					timezone: detectedTimezone,
					userAgent: navigator.userAgent
				})
			})).ok) throw new Error("设备订阅保存失败");
			setNotificationMessage("此设备已启用后台提醒。");
		} catch (error) {
			setNotificationMessage(error instanceof Error ? error.message : "通知启用失败");
		} finally {
			setNotificationBusy(false);
		}
	}
	async function addActivity() {
		if (!activityTitle.trim() || !activityMinutes.length) return;
		await addFragmentActivity(activityTitle, activityMinutes);
		setActivityTitle("");
	}
	async function testAgnes() {
		setAiBusy(true);
		setAiMessage("");
		try {
			const response = await fetch("/api/ai/status", { method: "POST" });
			const data = await response.json();
			if (!response.ok || data.status !== "connected") throw new Error(data.message ?? "Agnes 连接测试失败");
			setAiVerified(true);
			setAiMessage(`真实连接成功 · ${data.model ?? "agnes-2.5-flash"}`);
		} catch (error) {
			setAiVerified(false);
			setAiMessage(error instanceof Error ? error.message : "Agnes 连接测试失败");
		} finally {
			setAiBusy(false);
		}
	}
	function confirmTimezone() {
		setForm((current) => ({
			...current,
			timezone: detectedTimezone,
			lastTimezonePrompt: detectedTimezone
		}));
	}
	async function keepAllLocalConflicts() {
		if (!conflicts.length || conflictResolutionBusy) return;
		setConflictResolutionBusy(true);
		try {
			const count = await resolveAllConflicts("local");
			setSaved(count ? `已保留 ${count} 个本机修改` : "没有待处理冲突");
		} catch {
			setSaved("冲突处理失败，未完成批量修改");
		} finally {
			setConflictResolutionBusy(false);
		}
	}
	return {
		settings,
		form,
		setForm,
		status,
		notificationMessage,
		notificationBusy,
		aiBusy,
		aiVerified,
		aiMessage,
		activityTitle,
		activityMinutes,
		itemTypeName,
		saved,
		detectedTimezone,
		timezoneChanged,
		conflicts,
		fragmentActivities,
		notifications,
		save,
		saveItemTypes: () => save({ itemTypes: form.itemTypes }),
		enableNotifications,
		addActivity,
		removeItemType: removeType,
		testAgnes,
		confirmTimezone,
		setNotificationMessage,
		setActivityTitle,
		setActivityMinutes,
		setItemTypeName,
		updateFragmentActivity,
		deleteFragmentActivity,
		markNotificationRead,
		resolveConflict,
		keepAllLocalConflicts,
		conflictResolutionBusy
	};
}
//#endregion
//#region components/views/settings/settings-view.tsx
function SettingsView() {
	const controller = useSettingsController();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "settings-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, { title: "设置" }),
			controller.saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: controller.saved.includes("没有") ? "inline-toast is-error" : "inline-toast",
				role: controller.saved.includes("没有") ? "alert" : "status",
				children: controller.saved
			}) : null,
			controller.timezoneChanged ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "timezone-notice",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 18 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["检测到新的设备时区：", controller.detectedTimezone] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "一次性事项保持绝对时间；重复事项按当地钟表重算。" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: controller.confirmTimezone,
						children: "确认切换"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScheduleSettingsSection, {
						form: controller.form,
						setForm: controller.setForm,
						onSave: controller.save
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemTypesSettingsSection, {
						form: controller.form,
						setForm: controller.setForm,
						itemTypeName: controller.itemTypeName,
						onItemTypeNameChange: controller.setItemTypeName,
						onRemove: controller.removeItemType,
						onSave: controller.saveItemTypes
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeviceNotificationSection, {
						settings: controller.settings,
						status: controller.status,
						busy: controller.notificationBusy,
						message: controller.notificationMessage,
						onEnable: controller.enableNotifications
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FragmentActivitiesSection, {
						activities: controller.fragmentActivities,
						title: controller.activityTitle,
						minutes: controller.activityMinutes,
						onTitleChange: controller.setActivityTitle,
						onMinutesChange: controller.setActivityMinutes,
						onAdd: controller.addActivity,
						onUpdate: controller.updateFragmentActivity,
						onDelete: controller.deleteFragmentActivity
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServicesSection, {
						status: controller.status,
						aiVerified: controller.aiVerified,
						aiBusy: controller.aiBusy,
						aiMessage: controller.aiMessage,
						onTestAi: controller.testAgnes
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PendingNotificationsSection, {
						notifications: controller.notifications,
						onRead: controller.markNotificationRead
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConflictSettingsSection, {
						conflicts: controller.conflicts,
						onResolve: controller.resolveConflict,
						onKeepAllLocal: controller.keepAllLocalConflicts,
						busy: controller.conflictResolutionBusy
					})
				]
			})
		]
	});
}
//#endregion
export { SettingsView };
