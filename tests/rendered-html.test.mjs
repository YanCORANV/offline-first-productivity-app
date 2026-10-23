import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/today") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("run", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the planner shell on every primary route", async () => {
  for (const pathname of [
    "/today",
    "/quick",
    "/focus",
    "/inbox",
    "/calendar",
    "/projects",
    "/settings",
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.match(html, /<title>[^<]*(?:Quiet|Yan's) Plan<\/title>/i);
    assert.match(html, /Quiet Plan|Yan's Plan/);
    assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
  }
});

test("PWA manifest exposes the direct quick-action shortcuts", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
  );
  assert.equal(manifest.start_url, "/today");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/quick"));
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/focus"));
});

test("service worker handles offline shell, sync and push", async () => {
  const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const syncClient = await readFile(new URL("../lib/sync-client.ts", import.meta.url), "utf8");
  assert.match(worker, /planner-sync/);
  assert.match(worker, /runBackgroundSync/);
  assert.match(worker, /navigator\?\.locks/);
  assert.match(worker, /fetchWithTimeout/);
  assert.match(worker, /database\.transaction\(storeNames, "readwrite"\)/);
  assert.doesNotMatch(worker, /SYNC_WRITE_BATCH_SIZE/);
  assert.match(syncClient, /navigator\.locks\.request/);
  assert.match(syncClient, /db\.transaction\("rw", tables/);
  assert.doesNotMatch(syncClient, /CLOUD_WRITE_BATCH_SIZE/);
  assert.match(syncClient, /table\.bulkPut\(applicable\)/);
  assert.match(syncClient, /shouldApplyCloudRecord/);
  assert.doesNotMatch(syncClient, /db\.thoughts,[\s\S]*db\.settings/);
  assert.match(worker, /showNotification/);
  assert.match(worker, /notificationclick/);
});

test("Projects keeps the vertical Goal rail and Project tabs", async () => {
  const view = await readFile(
    new URL("../components/views/projects/projects-view.tsx", import.meta.url),
    "utf8",
  );
  const projectComponents = await readFile(
    new URL("../components/views/projects/project-components.tsx", import.meta.url),
    "utf8",
  );
  const projectModules = (
    await Promise.all(
      ["project-outline.ts", "project-initializer.tsx", "node-tree.tsx", "projects-controller.ts"].map((file) =>
        readFile(new URL(`../components/views/projects/${file}`, import.meta.url), "utf8"),
      ),
    )
  ).join("\n");
  const projectNavigation = await readFile(
    new URL("../components/views/projects/project-navigation.tsx", import.meta.url),
    "utf8",
  );
  const projectEditor = await readFile(
    new URL("../components/views/projects/project-editor.tsx", import.meta.url),
    "utf8",
  );
  const projectDialogs = await readFile(
    new URL("../components/views/projects/project-dialogs.tsx", import.meta.url),
    "utf8",
  );
  const projectSource = [view, projectComponents, projectModules, projectNavigation, projectEditor, projectDialogs].join("\n");
  const styles = await readFile(
    new URL("../components/views/projects/projects.css", import.meta.url),
    "utf8",
  );
  const projectStyles = (
    await Promise.all(
      [
        "projects-layout.css",
        "project-navigation.css",
        "project-initializer.css",
        "project-editor.css",
        "project-node-tree.css",
        "project-dialogs.css",
      ].map((file) =>
        readFile(new URL(`../components/views/projects/${file}`, import.meta.url), "utf8"),
      ),
    )
  ).join("\n");
  assert.match(projectNavigation, /className="projects-goal-rail"/);
  assert.match(projectNavigation, /aria-label=\{`编辑 Goal：\$\{goal\.name\}`\}/);
  assert.match(projectNavigation, /export function GoalForm/);
  assert.match(projectNavigation, /className="project-tabs"/);
  assert.match(projectEditor, /className="project-editor-title"/);
  assert.match(projectSource, /parseMarkdownIntoProject/);
  assert.match(projectSource, /"--goal-color": currentGoal\?\.color/);
  assert.match(projectSource, /await updateGoal\(editingGoal\.id, \{ name, color: goalDraftColor \}\)/);
  assert.match(styles, /@import "\.\/projects-layout\.css";/);
  assert.match(projectStyles, /--project-soft: color-mix\(in srgb, var\(--goal-color\)/);
  assert.match(projectStyles, /\.project-editor[\s\S]*?border: var\(--rule-hair\) solid var\(--project-border\)/);
  assert.match(projectStyles, /\.project-init-panel[\s\S]*?background:[\s\S]*?color-mix/);
  assert.match(projectStyles, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.projects-workspace \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(projectStyles, /\.projects-goal-nav \{[\s\S]*?flex-direction: row;[\s\S]*?overflow-x: auto/);
  assert.match(projectStyles, /\.project-editor-actions \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) repeat\(2, 2\.5rem\)/);
  assert.match(projectSource, /<textarea[\s\S]*?className="node-inline-title"[\s\S]*?resizeNodeTitle/);
  assert.match(projectStyles, /\.outline-mode \.outline-node \{[\s\S]*?grid-template-columns: 1\.75rem minmax\(0, 1fr\)/);
  assert.match(projectStyles, /\.outline-mode \.node-hover-actions \{[\s\S]*?grid-row: 2/);
  assert.doesNotMatch(
    view,
    /goal-switcher|goal-card|project-switcher|project-quick-create|导入 Project|导入 GPT Markdown|从空白开始|project-init-methods|outline-preview-editor/,
  );
});

test("Calendar keeps candidates above the full-width calendar with task timing", async () => {
  const view = await readFile(
    new URL("../components/views/calendar/calendar-view.tsx", import.meta.url),
    "utf8",
  );
  const grid = await readFile(
    new URL("../components/views/calendar/calendar-grid.tsx", import.meta.url),
    "utf8",
  );
  const candidates = await readFile(
    new URL("../components/views/calendar/candidate-pool.tsx", import.meta.url),
    "utf8",
  );
  const calendarLayout = await readFile(
    new URL("../components/views/calendar/calendar-layout.css", import.meta.url),
    "utf8",
  );
  const calendarEntryStyles = await readFile(
    new URL("../components/views/calendar/calendar-entry-card.css", import.meta.url),
    "utf8",
  );
  const candidatePoolStyles = await readFile(
    new URL("../components/views/calendar/candidate-pool.css", import.meta.url),
    "utf8",
  );
  const courseTaskPanelStyles = await readFile(
    new URL("../components/views/calendar/course-task-panel.css", import.meta.url),
    "utf8",
  );
  const calendarFiles = [
    "calendar-controller.ts",
    "calendar-model.ts",
    "calendar-entry-card.tsx",
    "time-grid.tsx",
    "month-calendar.tsx",
    "calendar-toolbar.tsx",
    "calendar-workspace.tsx",
    "course-task-panel.tsx",
    "completion-choice.tsx",
  ];
  const calendarModules = await Promise.all(
    calendarFiles.map((file) =>
      readFile(new URL(`../components/views/calendar/${file}`, import.meta.url), "utf8"),
    ),
  );
  const calendarSource = [view, grid, candidates, ...calendarModules].join("\n");
  assert.match(view, /className="calendar-page-layout"/);
  assert.doesNotMatch(view, /calendar-view-rail|calendar-view-filter/);
  assert.match(calendarSource, /aria-label="日历视图"/);
  assert.match(calendarSource, /value="overview">周概览/);
  assert.match(calendarSource, /value="timeline">周时间轴/);
  assert.match(calendarSource, /value="month">月视图/);
  assert.match(calendarSource, /calendar-tool calendar-add-button/);
  assert.doesNotMatch(view, /<PageHeader|title="日历"/);
  assert.match(calendarLayout, /\.calendar-page-layout[\s\S]*display: flex/);
  assert.match(calendarLayout, /\.calendar-toolbar \{[\s\S]*?display: flex/);
  assert.doesNotMatch(calendarLayout, /calendar-toolbar-spacer/);
  assert.match(candidates, /className="unscheduled-panel candidate-pool"/);
  assert.match(candidates, /<CalendarPopover/);
  assert.doesNotMatch(candidates, /<details|<summary/);
  const workspace = calendarModules[calendarFiles.indexOf("calendar-workspace.tsx")];
  assert.doesNotMatch(workspace, /<CandidatePool/);
  assert.ok(view.indexOf("<CandidatePool") > view.indexOf("<CalendarToolbar"));
  assert.ok(view.indexOf("<CandidatePool") < view.indexOf("</CalendarToolbar>"));
  assert.doesNotMatch(calendarLayout, /minmax\(14rem, 16rem\)/);
  assert.doesNotMatch(candidatePoolStyles, /position: sticky|overflow: auto/);
  assert.match(calendarSource, /unscheduled-panel candidate-pool/);
  assert.doesNotMatch(calendarSource, /收起待落实|打开待落实|candidates-open/);
  assert.match(calendarSource, /taskTimingSummary\(item\)/);
  assert.match(calendarSource, /node\.status === "open" &&[\s\S]*?node\.isFocused &&/);
  assert.match(candidates, /className="candidate-delete"/);
  assert.match(calendarSource, /showTime=\{false\}/);
  assert.match(calendarSource, /blockTask\?\.notes\.trim\(\)/);
  assert.match(calendarSource, /for \(const anchor of taskDateAnchors\(task\)\)/);
  assert.match(calendarSource, /timingLabel: anchor\.kind === "desired"/);
  assert.match(calendarSource, /calendarEntryLanePriority/);
  assert.match(calendarSource, /left\.startMinutes - right\.startMinutes \|\|[\s\S]*?calendarEntryLanePriority/);
  assert.match(calendarSource, /className="calendar-time-end"/);
  assert.match(calendarSource, /aria-label=\{accessibleTitle\}/);
  assert.match(calendarSource, /isCourse \? "is-course" : ""/);
  assert.match(calendarSource, /isCourseTask \? "is-course-task" : ""/);
  assert.match(calendarEntryStyles, /container: calendar-card \/ size/);
  assert.match(calendarEntryStyles, /-webkit-line-clamp: var\(--calendar-title-lines\)/);
  assert.match(calendarEntryStyles, /@container calendar-card \(min-height: 7rem\)[\s\S]*?--calendar-title-lines: 3/);
  assert.match(calendarEntryStyles, /\.time-calendar-item \.calendar-item-main \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(calendarEntryStyles, /\.time-calendar-item > \.item-inline-check \{[\s\S]*?position: absolute/);
  assert.doesNotMatch(calendarEntryStyles, /is-condensed|is-concurrent|is-roomy|\.calendar-time-end\s*\{/);
  assert.doesNotMatch(calendarSource, /STACKED_ENTRY_MIN_HEIGHT|ROOMY_ENTRY_MIN_HEIGHT|COURSE_ENTRY_MIN_HEIGHT/);
  assert.match(candidatePoolStyles, /\.candidate-open-button strong \{[\s\S]*?-webkit-line-clamp: 3/);
  assert.match(calendarSource, /CALENDAR_ENTRY_MIN_HEIGHT = 32/);
  assert.doesNotMatch(calendarSource, /calendarDayColumns|calendar-days-min-width/);
  assert.match(calendarSource, /entries\.filter\(isAllDayEntry\)/);
  assert.doesNotMatch(calendarSource, /clusterTop|top: item\.top \+ shift/);
  assert.match(calendarSource, /entry\.item\.eventKind === "course"[\s\S]*?Date\.parse\(entry\.endAt\) < now\.getTime\(\)/);
  assert.match(calendarSource, /\? "is-past-course"/);
  assert.match(calendarEntryStyles, /\.positioned-calendar-entry\.is-past-course \.time-calendar-item\.is-course/);
  assert.doesNotMatch(calendarSource, /entryHeight < 42/);
  assert.doesNotMatch(view, /type CalendarMode = "day"/);
  assert.doesNotMatch(view, /candidate-strip/);
  assert.match(calendarSource, /onCourseTasks/);
  assert.match(calendarSource, /onCourseDrop: moveItemToCourse/);
  assert.match(calendarSource, /onRemoveFromCourse=\{calendar\.removeTaskFromCourse\}/);
  assert.match(calendarSource, /if \(!courseTaskOccurrence\)[\s\S]*?setCanUndoMove\(false\)/);
  assert.match(calendarSource, /planningState: "draft",[\s\S]*?courseEventId: null,[\s\S]*?courseOccurrenceDate: null/);
  assert.match(calendarSource, /事项已移出课程并返回待落实/);
  assert.match(calendarSource, /撤销刚才的课程安排变更/);
  assert.match(calendarSource, /移出本节课并返回待落实/);
  assert.match(courseTaskPanelStyles, /\.course-task-undo/);
  assert.match(courseTaskPanelStyles, /\.course-task-remove/);
  assert.match(calendarSource, /readDragPayload/);
  assert.match(calendarSource, /event\.stopPropagation\(\)/);
  assert.match(calendarSource, /courseEventId: event\.id/);
  assert.match(calendarEntryStyles, /\.time-calendar-item\.is-course\.is-drop-target/);
  assert.match(calendarSource, /className="course-task-trigger"/);
  assert.doesNotMatch(calendarSource, />-\${formatTime\(entry\.endAt\)\}<\/span>/);
  assert.match(calendarSource, /courseEventId: occurrence\.event\.id/);
  assert.match(calendarSource, /courseOccurrenceDate: occurrenceDate/);
  assert.match(calendarSource, /taskBelongsToCourseOccurrence/);
  assert.match(calendarSource, /hideCourseLocation=\{days\.length > 1\}/);
  assert.match(calendarSource, /course-card-task-summary/);
  assert.match(calendarSource, /MONTH_COLLAPSED_ENTRY_LIMIT = 3/);
  assert.match(calendarSource, /还有 \$\{hiddenCount\} 项/);
  assert.match(calendarSource, /aria-expanded=\{expanded\}/);
  assert.match(calendarSource, /quiet-plan-calendar-hide-courses/);
  assert.match(calendarSource, /entriesForDays\(days, calendarProps, \{ hideCourses \}\)/);
  assert.match(calendarSource, /options\.hideCourses && event\.eventKind === "course"/);
  assert.match(calendarSource, /!options\.hideCourses &&[\s\S]*?task\.courseEventId &&[\s\S]*?courseOccurrenceKeys\.has/);
  assert.match(calendarSource, /隐藏课程表/);
  assert.match(calendarSource, /periodLabel/);
  assert.match(calendarSource, /anchor\.getFullYear\(\).*anchor\.getMonth\(\) \+ 1/s);
  assert.match(calendarSource, /className="calendar-period-heading"/);
  assert.match(calendarSource, /nextCourseTaskSlot/);
  assert.match(calendarSource, /"添加事项"/);
});

test("feature modules keep compatibility facades instead of mixed implementations", async () => {
  const planning = await readFile(new URL("../lib/planning.ts", import.meta.url), "utf8");
  const planningModules = (
    await Promise.all(
      ["project-outline.ts", "project-tree.ts", "timeline.ts", "recommendations.ts", "project-markdown.ts", "course-tasks.ts"].map((file) =>
        readFile(new URL(`../lib/planning/${file}`, import.meta.url), "utf8"),
      ),
    )
  ).join("\n");
  const ui = await readFile(new URL("../components/ui.tsx", import.meta.url), "utf8");
  const uiStyles = await readFile(new URL("../components/ui.css", import.meta.url), "utf8");
  const event = await readFile(
    new URL("../components/event-composer/event-composer.tsx", import.meta.url),
    "utf8",
  );
  const eventSections = await readFile(
    new URL("../components/event-composer/event-sections.tsx", import.meta.url),
    "utf8",
  );
  const taskComposer = await readFile(
    new URL("../components/task-composer/task-composer.tsx", import.meta.url),
    "utf8",
  );
  const taskSchedule = await readFile(
    new URL("../components/task-composer/sections/schedule-section.tsx", import.meta.url),
    "utf8",
  );
  assert.match(planning, /from "\.\/planning\/recommendations\.ts"/);
  assert.match(planning, /from "\.\/planning\/course-tasks\.ts"/);
  assert.doesNotMatch(planning, /export function (freeTimeRanges|buildAdvanceCandidates|parseProjectMarkdown)/);
  assert.match(planningModules, /export function freeTimeRanges/);
  assert.match(planningModules, /export function parseProjectMarkdown/);
  assert.match(ui, /export \{ TaskRow \} from "\.\/ui\/task-row"/);
  assert.match(uiStyles, /@import "\.\/ui\/ui-capture\.css";/);
  assert.match(uiStyles, /@import "\.\/ui\/ui-task\.css";/);
  assert.match(event, /<EventScheduleSection/);
  assert.match(event, /event\?\.eventKind === "course"/);
  assert.match(event, /<TaskComposer[\s\S]*?courseEvent=\{event\}/);
  assert.match(event, /settings\.itemTypes\.filter\(\(type\) => type\.id !== "course"\)/);
  assert.match(event, /<EventColorSection/);
  assert.match(eventSections, /export function EventTypeSection/);
  assert.doesNotMatch(eventSections, /event-course-schedule|event-course-weekdays/);
  assert.match(taskComposer, /const defaultDateKey = localDateKey/);
  assert.match(taskComposer, /duration === "none"/);
  assert.match(taskSchedule, /添加结束时间/);
  assert.match(taskSchedule, /aria-label="移除结束时间"/);
  assert.doesNotMatch(taskSchedule, /无持续时间（时间点）|<select\s+value=\{duration\}/);
  assert.match(taskComposer, /actualDeadlineAt: actualDeadlineIso/);
  assert.match(taskComposer, /scheduledStartAt: isDeadline \? null : scheduledIso/);
  assert.match(taskComposer, /durationMinutes: isDeadline \? null/);
  assert.match(taskSchedule, /实际截止日期/);
  assert.match(taskSchedule, /task-date-repeat-row.*is-deadline/);
  assert.doesNotMatch(taskSchedule, /date-display-field|task-date-control/);
  assert.doesNotMatch(taskSchedule, /deadline-time-point-summary/);
  assert.doesNotMatch(taskSchedule, /<span>实际截止时间<\/span>/);
});

test("shared quick actions keep calculation and display boundaries", async () => {
  const quickPanel = await readFile(new URL("../components/quick-actions-panel.tsx", import.meta.url), "utf8");
  const quickModel = await readFile(new URL("../components/quick-actions-model.ts", import.meta.url), "utf8");
  const quickFocus = await readFile(new URL("../components/quick-actions-focus.tsx", import.meta.url), "utf8");
  assert.match(quickPanel, /<QuickFocusSection/);
  assert.doesNotMatch(quickPanel, /buildAdvanceCandidates|recommendationTargetDate/);
  assert.match(quickModel, /export function buildQuickCandidates/);
  assert.match(quickFocus, /export function QuickFocusSection/);
});

test("page coordinators keep domain side effects in feature controllers", async () => {
  const calendarView = await readFile(new URL("../components/views/calendar/calendar-view.tsx", import.meta.url), "utf8");
  const calendarController = await readFile(new URL("../components/views/calendar/calendar-controller.ts", import.meta.url), "utf8");
  const projectsView = await readFile(new URL("../components/views/projects/projects-view.tsx", import.meta.url), "utf8");
  const projectsController = await readFile(new URL("../components/views/projects/projects-controller.ts", import.meta.url), "utf8");
  const settingsView = await readFile(new URL("../components/views/settings/settings-view.tsx", import.meta.url), "utf8");
  const settingsController = await readFile(new URL("../components/views/settings/settings-controller.ts", import.meta.url), "utf8");
  const todayFacade = await readFile(new URL("../components/views/today/today-timeline.tsx", import.meta.url), "utf8");
  const todayGrid = await readFile(new URL("../components/views/today/today-time-grid.tsx", import.meta.url), "utf8");
  const importMutations = await readFile(new URL("../components/planner-provider/project/project-import-mutations.ts", import.meta.url), "utf8");
  assert.match(calendarView, /useCalendarController/);
  assert.doesNotMatch(calendarView, /buildAdvanceCandidates|convertThoughtToDraft|updateScheduleBlock/);
  assert.match(calendarController, /export function useCalendarController/);
  assert.match(projectsView, /useProjectsController/);
  assert.doesNotMatch(projectsView, /parseProjectMarkdown|navigator\.clipboard|fetch\(/);
  assert.match(projectsController, /export function useProjectsController/);
  assert.match(settingsView, /useSettingsController/);
  assert.doesNotMatch(settingsView, /Notification\.requestPermission|navigator\.serviceWorker|fetch\(/);
  assert.match(settingsController, /export function useSettingsController/);
  assert.match(todayFacade, /from "\.\/today-time-grid"/);
  assert.match(todayGrid, /export function TodayTimeGrid/);
  assert.match(importMutations, /targetProjectId/);
  assert.match(importMutations, /setScheduleBlocks/);
  assert.match(importMutations, /nodeDeleteUpdates/);
});

test("Inbox keeps capture aligned without mobile focus zoom", async () => {
  const view = await readFile(
    new URL("../components/views/inbox/inbox-view.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../components/views/inbox/inbox-capture.css", import.meta.url),
    "utf8",
  );
  assert.match(view, /className="inbox-active-header"/);
  assert.match(view, /className="inbox-header-capture"/);
  assert.doesNotMatch(view, /className="inbox-capture"/);
  assert.match(styles, /\.inbox-active-header input,[\s\S]*font-size: var\(--text-base\)/);
});

test("Settings keeps desktop and mobile editing rows compact", async () => {
  const view = await readFile(
    new URL("../components/views/settings/settings-view.tsx", import.meta.url),
    "utf8",
  );
  const itemTypes = await readFile(
    new URL("../components/views/settings/item-type-settings.tsx", import.meta.url),
    "utf8",
  );
  const layout = await readFile(
    new URL("../components/views/settings/settings-layout.css", import.meta.url),
    "utf8",
  );
  const itemTypeStyles = await readFile(
    new URL("../components/views/settings/item-type-settings.css", import.meta.url),
    "utf8",
  );
  const activityStyles = await readFile(
    new URL("../components/views/settings/activity-settings.css", import.meta.url),
    "utf8",
  );
  assert.match(view, /className="settings-page"/);
  assert.doesNotMatch(view, /ReviewSettingsSection|Review 与提醒/);
  const schedule = await readFile(new URL("../components/views/settings/schedule-settings.tsx", import.meta.url), "utf8");
  assert.match(itemTypes, /type="color"[\s\S]*?value=\{type\.color\}/);
  assert.doesNotMatch(itemTypes, /paletteTypeId|morandi-palette/);
  assert.match(schedule, /起床时间/);
  assert.match(schedule, /入睡时间/);
  assert.doesNotMatch(schedule, /通常起床|通常入睡|settings-footnote|<p>/);
  assert.equal((schedule.match(/<button/g) ?? []).length, 0);
  assert.doesNotMatch(schedule + itemTypes, /保存时间设置|保存分类修改/);
  assert.doesNotMatch(schedule + itemTypes, /primary-button/);
  assert.match(layout, /\.settings-save-row \{[\s\S]*?display: flex/);
  assert.match(layout, /@container settings-schedule \(min-width: 40rem\)/);
  assert.match(layout, /\.settings-time-grid \{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(itemTypeStyles, /grid-template-columns: minmax\(10rem, 20rem\) var\(--touch-height\) 2rem/);
  assert.match(itemTypeStyles, /grid-template-columns: minmax\(0, 1fr\) var\(--touch-height\) auto/);
  assert.doesNotMatch(itemTypeStyles, /\.item-type-settings > div > input \{ grid-column: 1 \/ -1/);
  assert.match(activityStyles, /\.activity-create \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 2\.5rem/);
  assert.match(activityStyles, /\.activity-create > input \{[\s\S]*?flex: none/);
});

test("Task editor keeps the chosen type stable and advanced fields visible", async () => {
  const composer = await readFile(
    new URL("../components/task-composer/task-composer.tsx", import.meta.url),
    "utf8",
  );
  const sectionFiles = ["title-section.tsx", "schedule-section.tsx", "organization-section.tsx", "notes-section.tsx"];
  const sections = (
    await Promise.all(
      sectionFiles.map((file) =>
        readFile(new URL(`../components/task-composer/sections/${file}`, import.meta.url), "utf8"),
      ),
    )
  ).join("\n");
  const taskStyleEntry = await readFile(
    new URL("../components/task-composer/task-composer.css", import.meta.url),
    "utf8",
  );
  const taskStyles = (
    await Promise.all(
      ["task-layout.css", "task-schedule.css", "task-organization.css", "task-notes-actions.css"].map((file) =>
        readFile(new URL(`../components/task-composer/${file}`, import.meta.url), "utf8"),
      ),
    )
  ).join("\n");
  const globalStyles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const composerShared = await readFile(
    new URL("../components/composer-shared.tsx", import.meta.url),
    "utf8",
  );
  assert.match(composer, /initializedTaskDraftRef\.current === draftIdentity/);
  assert.match(composer, /panelClassName="task-composer-inspector"/);
  assert.match(composer, /<TaskTitleSection/);
  assert.match(composer, /<TaskScheduleSection/);
  assert.match(composer, /<TaskOrganizationSection/);
  assert.match(sections, /<TaskNotesSection/);
  assert.match(sections, /className="task-schedule-overrides"/);
  assert.match(sections, /className={`task-date-repeat-row/);
  assert.match(sections, /className={`task-time-entry-row/);
  assert.match(sections, /className="field task-repeat-field"/);
  assert.match(sections, /className="task-repeat-details"/);
  assert.match(sections, /task-start-field/);
  assert.match(sections, /\["unscheduled", "待安排"\]/);
  assert.match(sections, /\["all-day", "全天"\]/);
  assert.doesNotMatch(sections, /\["timed", "固定时间"\]|固定时间|task-schedule-mode/);
  assert.match(sections, /required=\{isDeadline \|\| hasTime\}/);
  assert.match(sections, /task-end-time-control/);
  assert.match(sections, /task-end-time-input-shell/);
  assert.match(sections, /<span>开始时间<\/span>/);
  assert.match(sections, /<span>结束时间<\/span>\s*<input\s+type="time"/);
  assert.match(sections, /添加结束时间/);
  assert.match(sections, /aria-label="移除结束时间"/);
  assert.doesNotMatch(sections, /onEndTimeChange\(""\)/);
  assert.doesNotMatch(sections, /当天要做但暂时不确定具体时间|结束时间早于开始时间时，将按次日计算。/);
  assert.doesNotMatch(sections, /placeholder="输入分钟数"/);
  assert.match(sections, /!isCourse && !isAllDay && !hasTime/);
  assert.match(sections, /className="course-term-grid"/);
  assert.match(sections, /className="course-weekday-selector"/);
  assert.match(sections, /className="course-time-grid"/);
  assert.match(sections, /className="course-schedule-summary"/);
  assert.match(composer, /className="task-editor-columns"/);
  assert.match(sections, /className="type-create-panel"/);
  assert.match(sections, /<ProjectColorPicker/);
  assert.match(composer, /itemTypeId,\s*colorOverride:\s*task\?\.colorOverride/);
  assert.match(composer, /itemTypeId:\s*"course",\s*colorOverride:\s*null/);
  assert.match(composer, /makeCourseRecurrenceRule/);
  assert.match(composer, /firstCourseDateOnOrAfter/);
  assert.match(composer, /if \(courseEvent\) await updateEvent\(courseEvent\.id, coursePatch\)/);
  assert.match(composer, /itemTypeId: "course",\s*colorOverride: null/);
  assert.match(sections, /aria-label="新建分类"/);
  assert.match(composer, /有尚未保存的修改，确定要离开吗？/);
  assert.match(composer, /if \(saving\) return;/);
  assert.match(composer, /setSaveError\("保存失败，请稍后重试。"\);/);
  assert.match(composer, /if \(!taskScheduleReady\)/);
  assert.match(composer, /Boolean\(task\?\.scheduledStartAt\) \|\|\s*!task/);
  assert.match(composer, /const currentTime = defaultDateTime\.slice\(11, 16\)/);
  assert.match(composer, /: task\?\.scheduledStartAt\s*\? task\.durationMinutes\s*:\s*60/);
  assert.match(composer, /: currentTime;/);
  assert.match(sections, /value=\{isDeadline \|\| hasTime \? startTime : ""\}/);
  assert.match(composer, /type TaskScheduleMode = "timed" \| "unscheduled" \| "all-day" \| "morning" \| "afternoon"/);
  assert.match(composer, /const hasTime = scheduleMode === "timed" \|\| scheduleMode === "morning" \|\| scheduleMode === "afternoon"/);
  assert.match(composer, /const isAllDay = scheduleMode === "all-day"/);
  assert.match(sections, /if \(scheduleMode === mode\) return;/);
  assert.doesNotMatch(composer, /setHasTime|setIsAllDay/);
  assert.doesNotMatch(composer, /durationPresets|estimatedEnd/);
  assert.match(composer, /finally \{\s*setSaving\(false\);/);
  assert.match(composer, /submitAttempted && !title\.trim\(\)/);
  assert.match(composer, /preset: "daily"/);
  assert.match(composer, /preset: "weekdays"/);
  assert.match(composer, /preset: "weekly"/);
  assert.match(composer, /preset: "monthly"/);
  assert.match(composer, /preset: "custom"/);
  assert.match(sections, /className="task-notes-section"/);
  assert.match(taskStyleEntry, /@import "\.\/task-layout\.css";/);
  assert.match(taskStyleEntry, /@import "\.\/task-schedule\.css";/);
  assert.match(taskStyleEntry, /@import "\.\/task-organization\.css";/);
  assert.match(taskStyleEntry, /@import "\.\/task-notes-actions\.css";/);
  assert.match(taskStyles, /\.task-composer-form \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(taskStyles, /\.task-editor-scroll \{[\s\S]*?overflow: auto/);
  assert.match(taskStyles, /\.task-schedule-overrides button\.is-active/);
  assert.match(taskStyles, /\.task-date-repeat-row/);
  assert.match(taskStyles, /\.task-time-entry-row\.has-time/);
  assert.match(taskStyles, /\.task-start-field input/);
  assert.match(taskStyles, /\.task-end-time-control/);
  assert.match(taskStyles, /\.task-end-time-input-shell/);
  assert.match(taskStyles, /\.course-weekday-selector button\.is-active/);
  assert.doesNotMatch(taskStyles, /\.task-schedule-mode|\.task-schedule-options|\.task-time-range|\.task-time-field|\.task-time-divider|\.task-time-toggle|\.task-time-switch|\.task-start-time|\.task-duration-row|\.custom-end-time-field|\.type-create-popover|\.type-custom-color/);
  assert.doesNotMatch(taskStyles, /\.task-preference-segmented span\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(composerShared, /handleToggleCustom/);
  assert.match(composerShared, /className="reminder-custom-inline-controls"/);
  assert.match(composerShared, /aria-label="自定义提醒时长"/);
  assert.doesNotMatch(composerShared, /reminder-custom-remove/);
  assert.doesNotMatch(composerShared, /disabled=\{!customActive\}/);
  assert.doesNotMatch(composerShared, /notificationState|需先在设置中启用此设备的提醒/);
  assert.doesNotMatch(taskStyles, /reminder-device-note/);
  assert.doesNotMatch(globalStyles, /\.task-composer-inspector|\.task-editor-columns|\.task-schedule-mode|\.task-preference-segmented/);
  assert.doesNotMatch(composer, /适合至少 120 分钟的完整空档/);
  assert.doesNotMatch(composer, /会出现在短空档和“我有一点时间”中/);
  assert.doesNotMatch(composer, /<details className="advanced-fields">/);
});

test("global styles are an import-only ownership map", async () => {
  const globalStyles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const meaningfulLines = globalStyles
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  assert.ok(meaningfulLines.every((line) => line.startsWith("@import ")));
  assert.doesNotMatch(globalStyles, /styles\/views\//);
  assert.doesNotMatch(globalStyles, /\{[\s\S]*\}/);
});

test("feature styles stay outside the global base and avoid structural inference", async () => {
  const baseStyles = await readFile(
    new URL("../app/styles/base.css", import.meta.url),
    "utf8",
  );
  const overlaysStyles = await readFile(
    new URL("../app/styles/overlays.css", import.meta.url),
    "utf8",
  );
  const cssFiles = [
    "../app/styles/base.css",
    "../app/styles/controls.css",
    "../app/styles/overlays.css",
    "../app/styles/shell.css",
    "../components/task-composer/task-composer.css",
    "../components/views/calendar/calendar.css",
    "../components/views/projects/projects.css",
    "../components/views/settings/settings.css",
    "../components/views/today/today.css",
    "../components/views/inbox/inbox.css",
  ];
  const styles = (
    await Promise.all(cssFiles.map((file) => readFile(new URL(file, import.meta.url), "utf8")))
  ).join("\n");
  assert.doesNotMatch(baseStyles, /\.(?:calendar|today|projects|settings|task-composer)-/);
  assert.doesNotMatch(styles, /:has\(/);
  assert.doesNotMatch(styles, /@layer\s+legacy/);
  assert.doesNotMatch(overlaysStyles, /task-composer-form|:not\(/);
});

test("feature CSS entry files are ownership maps", async () => {
  const entries = [
    ["projects", ["projects-layout", "project-navigation", "project-initializer", "project-editor", "project-node-tree", "project-dialogs"]],
    ["settings", ["settings-layout", "item-type-settings", "activity-settings", "service-settings"]],
    ["inbox", ["inbox-layout", "inbox-project", "inbox-capture"]],
  ];
  for (const [feature, modules] of entries) {
    const source = await readFile(new URL(`../components/views/${feature}/${feature}.css`, import.meta.url), "utf8");
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    assert.ok(lines.every((line) => line.startsWith("@import ")), feature);
    for (const moduleName of modules) assert.match(source, new RegExp(`@import \\"\\./${moduleName}\\.css\\";`));
  }
});

test("Quick entry routes and mobile bottom navigation keep explicit ownership", async () => {
  const plannerApp = await readFile(new URL("../components/planner-app.tsx", import.meta.url), "utf8");
  const shell = await readFile(new URL("../components/app-shell/planner-shell.tsx", import.meta.url), "utf8");
  const views = await readFile(new URL("../components/app-shell/view-loader.tsx", import.meta.url), "utf8");
  const sidebar = await readFile(new URL("../components/app-shell/desktop-sidebar.tsx", import.meta.url), "utf8");
  const mobile = await readFile(new URL("../components/app-shell/mobile-navigation.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/styles/shell.css", import.meta.url), "utf8");
  assert.match(plannerApp, /PlannerAppShell/);
  assert.match(shell, /if \(view === "quick" \|\| view === "focus"\)/);
  assert.match(views, /export function ActivePlannerView/);
  assert.match(sidebar, /className="sidebar"/);
  assert.doesNotMatch(shell, /mobileMenu|sidebar-scrim/);
  assert.doesNotMatch(mobile, /onOpenMenu|<Menu/);
  assert.match(mobile, /mobile-more-menu/);
  assert.match(styles, /grid-template-columns: repeat\(3,/);
  assert.match(styles, /\.bottom-nav \{[\s\S]*?inset: auto 0 0;/);
  assert.match(styles, /\.mobile-direct-actions \{[\s\S]*?inset: calc\(env\(safe-area-inset-top\)/);
  assert.doesNotMatch(styles, /\.sidebar\.is-open/);
});

test("Planner provider keeps storage boundaries in domain modules", async () => {
  const provider = await readFile(
    new URL("../components/planner-provider.tsx", import.meta.url),
    "utf8",
  );
  const contracts = await readFile(
    new URL("../components/planner-provider/contracts.ts", import.meta.url),
    "utf8",
  );
  const internals = await readFile(
    new URL("../components/planner-provider/internals.ts", import.meta.url),
    "utf8",
  );
  const schedule = await readFile(
    new URL("../components/planner-provider/schedule-mutations.ts", import.meta.url),
    "utf8",
  );
  const support = await readFile(
    new URL("../components/planner-provider/support-mutations.ts", import.meta.url),
    "utf8",
  );
  const initialization = await readFile(
    new URL("../components/planner-provider/initialization.ts", import.meta.url),
    "utf8",
  );
  const items = await readFile(
    new URL("../components/planner-provider/item-mutations.ts", import.meta.url),
    "utf8",
  );
  const projects = await readFile(
    new URL("../components/planner-provider/project-mutations.ts", import.meta.url),
    "utf8",
  );
  const sync = await readFile(
    new URL("../components/planner-provider/sync-controller.ts", import.meta.url),
    "utf8",
  );
  assert.match(provider, /from "\.\/planner-provider\/contracts"/);
  assert.match(initialization, /from "\.\/internals"/);
  assert.doesNotMatch(provider, /from "\.\/planner-provider\/internals"/);
  assert.match(provider, /useScheduleBlockMutations/);
  assert.match(contracts, /export interface PlannerContextValue/);
  assert.match(internals, /export function operationFor/);
  assert.match(internals, /export function normalizeTasks/);
  assert.match(initialization, /export async function readPlannerSnapshot/);
  assert.match(initialization, /export async function preparePlannerStorage/);
  assert.match(initialization, /export function subscribeToPlannerStorage/);
  assert.match(schedule, /export function useScheduleBlockMutations/);
  assert.match(support, /export function useSupportMutations/);
  assert.match(support, /const saveSettings = useCallback/);
  assert.match(items, /export function useItemMutations/);
  assert.match(projects, /export function useProjectMutations/);
  assert.match(sync, /export function useSyncController/);
  assert.doesNotMatch(provider, /const addTask = useCallback/);
  assert.doesNotMatch(provider, /const addProjectNode = useCallback/);
});

test("bulk local conflict resolution merges operations per entity", async () => {
  const support = await readFile(
    new URL("../components/planner-provider/support-mutations.ts", import.meta.url),
    "utf8",
  );
  assert.match(support, /const groups = new Map<string, typeof conflicts>\(\)/);
  assert.match(support, /const mergedPatch = Object\.assign\(\{\}, \.\.\.ordered\.map/);
  assert.match(support, /await db\.operations\.bulkDelete\(ordered\.map/);
  assert.match(support, /patch: mergedPatch/);
});

test("Goal deletion persists cascades with bulk writes", async () => {
  const mutations = await readFile(
    new URL("../components/planner-provider/project/goal-mutations.ts", import.meta.url),
    "utf8",
  );
  assert.match(mutations, /db\.projects\.bulkUpdate/);
  assert.match(mutations, /db\.projectNodes\.bulkUpdate/);
  assert.match(mutations, /db\.scheduleBlocks\.bulkUpdate/);
  assert.match(mutations, /db\.originLinks\.bulkUpdate/);
  assert.match(mutations, /db\.operations\.bulkPut\(operations\)/);
  assert.doesNotMatch(
    mutations,
    /for \(const \{ current, patch \} of (?:project|node|block|link)Updates\)/,
  );
});

test("Projects can move, delete drafts, and copy atomically without repeat clicks", async () => {
  const view = await readFile(
    new URL("../components/views/projects/projects-view.tsx", import.meta.url),
    "utf8",
  );
  const editor = await readFile(
    new URL("../components/views/projects/project-editor.tsx", import.meta.url),
    "utf8",
  );
  const initializer = await readFile(
    new URL("../components/views/projects/project-initializer.tsx", import.meta.url),
    "utf8",
  );
  const controller = await readFile(
    new URL("../components/views/projects/projects-controller.ts", import.meta.url),
    "utf8",
  );
  const mutations = await readFile(
    new URL("../components/planner-provider/project/project-import-mutations.ts", import.meta.url),
    "utf8",
  );

  assert.match(editor, /aria-label="所属 Goal"/);
  assert.match(view, /onGoalChange=\{\(goalId\) => void projects\.moveCurrentProject\(goalId\)\}/);
  assert.match(controller, /goalId: nextGoalId/);
  assert.match(initializer, /targetProject \? \(/);
  assert.match(initializer, /删除 Project/);
  assert.match(view, /onDelete=\{\(\) => projects\.setDeleteProjectOpen\(true\)\}/);
  assert.match(controller, /copyingProjectRef\.current/);
  assert.match(editor, /disabled=\{copyingProject\}/);
  assert.match(mutations, /db\.projectNodes\.bulkPut\(copies\)/);
  assert.match(mutations, /db\.operations\.bulkPut/);
  assert.doesNotMatch(mutations, /for \(const node of pending\)/);
});

test("periodic refreshes avoid duplicate sync and repeated heavy derivation", async () => {
  const syncController = await readFile(
    new URL("../components/planner-provider/sync-controller.ts", import.meta.url),
    "utf8",
  );
  const provider = await readFile(
    new URL("../components/planner-provider.tsx", import.meta.url),
    "utf8",
  );
  const calendarWorkspace = await readFile(
    new URL("../components/views/calendar/calendar-workspace.tsx", import.meta.url),
    "utf8",
  );
  const timeGrid = await readFile(
    new URL("../components/views/calendar/time-grid.tsx", import.meta.url),
    "utf8",
  );
  const projectTree = await readFile(
    new URL("../lib/planning/project-tree.ts", import.meta.url),
    "utf8",
  );
  const today = await readFile(
    new URL("../components/views/today/today-view.tsx", import.meta.url),
    "utf8",
  );

  assert.match(syncController, /runSync\(false, false\)/);
  assert.doesNotMatch(syncController, /PLANNER_SYNC_COMPLETED/);
  assert.match(syncController, /60_000/);
  assert.match(provider, /retainMatchingRecords/);
  assert.match(calendarWorkspace, /entriesForDays\(days, calendarProps, \{ hideCourses \}\)/);
  assert.doesNotMatch(timeGrid, /entriesForDay\(day, props\)/);
  assert.match(projectTree, /export function buildProjectTreeIndex/);
  assert.match(today, /60_000/);
});

test("Today keeps every workspace visible without the inactive pane tabs", async () => {
  const view = await readFile(
    new URL("../components/views/today/today-view.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../components/views/today/today.css", import.meta.url),
    "utf8",
  );
  const todayStyles = (
    await Promise.all(
      ["today-layout.css", "today-sections.css", "today-timeline.css"].map((file) =>
        readFile(new URL(`../components/views/today/${file}`, import.meta.url), "utf8"),
      ),
    )
  ).join("\n");
  const sections = await readFile(
    new URL("../components/views/today/today-sections.tsx", import.meta.url),
    "utf8",
  );
  const todayModules = (
    await Promise.all(
      [
        "today-schedule-section.tsx",
        "today-time-grid.tsx",
        "today-summary.ts",
        "advance-panel.tsx",
        "today-summary-cards.tsx",
        "today-completion-choice.tsx",
      ].map((file) =>
        readFile(new URL(`../components/views/today/${file}`, import.meta.url), "utf8"),
      ),
    )
  ).join("\n");
  const todaySource = `${view}\n${sections}\n${todayModules}`;
  assert.match(view, /<aside className="today-side-column">/);
  assert.match(styles, /@import "\.\/today-layout\.css";/);
  assert.match(todayStyles, /grid-template-columns: minmax\(16rem, 1\.2fr\) minmax\(11rem, 0\.9fr\) minmax\(11rem, 0\.9fr\) minmax\(18rem, 1\.25fr\)/);
  assert.match(todayStyles, /\.today-side-column \{\n  display: contents;/);
  assert.match(todaySource, /<strong>Deadline<\/strong>/);
  assert.match(todaySource, /<strong>Inbox<\/strong>/);
  assert.doesNotMatch(todaySource, /mobilePane|today-mobile-tabs|is-mobile-active/);
  assert.doesNotMatch(todaySource, /待完成与待提交|待处理想法/);
});

test("Today candidates support permanent deletion and soft timeline guides", async () => {
  const advance = await readFile(
    new URL("../components/views/today/advance-panel.tsx", import.meta.url),
    "utf8",
  );
  const today = await readFile(
    new URL("../components/views/today/today-view.tsx", import.meta.url),
    "utf8",
  );
  const sections = await readFile(
    new URL("../components/views/today/today-sections.css", import.meta.url),
    "utf8",
  );
  const timeline = await readFile(
    new URL("../components/views/today/today-timeline.css", import.meta.url),
    "utf8",
  );
  const schedule = await readFile(
    new URL("../components/schedule-block-composer/schedule-block-composer.tsx", import.meta.url),
    "utf8",
  );
  assert.match(advance, /Trash2/);
  assert.match(advance, /永久删除/);
  assert.match(advance, /advance-candidate-action/);
  assert.doesNotMatch(advance, /普通事项|Plus/);
  assert.match(today, /deleteTask/);
  assert.match(today, /deleteProjectNode/);
  assert.match(sections, /\.advance-panel[\s\S]*background: var\(--color-paper\)/);
  assert.match(sections, /\.today-collapsible-card[\s\S]*background: var\(--color-paper\)/);
  assert.match(timeline, /border-block-start: var\(--rule-hair\) dashed/);
  assert.match(schedule, /type="time"/);
  assert.doesNotMatch(schedule, /type="datetime-local"/);
  assert.match(schedule, /结束时间必须晚于开始时间/);
});

test("Today separates all-day and date-only tasks while keeping only date-only tasks advanceable", async () => {
  const model = await readFile(
    new URL("../components/views/today/today-model.ts", import.meta.url),
    "utf8",
  );
  const schedule = await readFile(
    new URL("../components/views/today/today-schedule-section.tsx", import.meta.url),
    "utf8",
  );
  const recommendations = await readFile(
    new URL("../lib/planning/recommendations.ts", import.meta.url),
    "utf8",
  );

  assert.match(model, /taskOccurrencesOnDay\(task, todayDate\)/);
  assert.match(model, /task\.isAllDay && !anchor\.timed/);
  assert.match(model, /!task\.isAllDay && !anchor\.timed/);
  assert.match(model, /map\(\(\{ task, occurrenceAt \}\)/);
  assert.doesNotMatch(model, /recommendationKey/);
  assert.match(schedule, /<span>全天<\/span>/);
  assert.match(schedule, /<span>待安排<\/span>/);
  assert.match(schedule, /isTaskOccurrenceCompleted/);
  assert.match(recommendations, /task\.isAllDay \|\|/);
  assert.match(recommendations, /hasOpenAllDayTask/);
});
