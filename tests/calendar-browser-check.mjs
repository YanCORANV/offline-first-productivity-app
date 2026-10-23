import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { startOfWeek, DEFAULT_SETTINGS } from "../lib/domain.ts";
const requireRuntime = createRequire(process.env.QUIET_PLAN_BROWSER_RUNTIME + "/package.json");
const { chromium } = requireRuntime("playwright");
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, timezoneId: "America/Chicago", serviceWorkers: "block" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.route("**/api/**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"Isolated browser check"}' }));
const week = startOfWeek(new Date());
const at = (day, hour, minute = 0) => { const date = new Date(week); date.setDate(date.getDate() + day); date.setHours(hour, minute, 0, 0); return date.toISOString(); };
const common = { version: 1, createdAt: at(0, 8), updatedAt: at(0, 8), notes: "", status: "open", reminderRules: [], originThoughtIds: [] };
const task = (id, day, start, duration, extra = {}) => ({
  ...common, id, title: id, entityType: "task", planningState: "planned", taskKind: "ordinary", itemTypeId: "temporary",
  scheduledStartAt: start == null ? null : at(day, start), dueAt: at(day, 23, 59), durationMinutes: duration,
  isAllDay: false, recurrenceRule: null, needsContinuousTime: false, isFragmentFriendly: false, completedOccurrenceKeys: [], ...extra,
});
const course = (id, day, hour, minute, duration) => ({
  ...common, id: id + "-" + day, title: id, entityType: "event", eventKind: "course", itemTypeId: "course",
  startAt: at(day, hour, minute), endAt: at(day, hour, minute + duration), recurrenceRule: null, timezone: "America/Chicago",
});
const tasks = [
  task("330-quiz", 1, 10, 50, { itemTypeId: "deadline" }),
  task("career fair", 2, null, null, { isAllDay: true, colorOverride: "#D8C39F" }),
  task("全天准备", 4, null, null, { isAllDay: true, colorOverride: "#AFC3D4" }),
  task("全天出行", 4, null, null, { isAllDay: true, colorOverride: "#AFC4B1" }),
  task("待安排事项", 0, null, null),
  task("阅读论文", 3, 15, 50),
  task("周末练琴", 6, 10, 50),
  task("电话", 3, 18, null),
  task("整理备忘", 0, null, null, { planningState: "draft", dueAt: null }),
];
const events = [course("ECE364", 1, 9, 30, 80), course("HK102", 1, 13, 0, 50), course("ECE391", 1, 14, 0, 80), course("391-Dis", 2, 9, 0, 50), course("ECE330", 3, 11, 0, 80)];
await mkdir(new URL("../outputs/", import.meta.url), { recursive: true });
try {
  await page.goto("http://localhost:3000/calendar");
  await page.waitForSelector(".time-grid");
  await page.evaluate(async ({ tasks, events, settings }) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("planner-v1");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(["tasks", "events", "settings"], "readwrite");
        for (const task of tasks) tx.objectStore("tasks").put(task);
        for (const event of events) tx.objectStore("events").put(event);
        tx.objectStore("settings").put(settings);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, { tasks, events, settings: { ...DEFAULT_SETTINGS, calendarDisplayStart: "08:00", calendarDisplayEnd: "22:00" } });
  await page.reload();
  await page.waitForSelector('.calendar-item-main[aria-label^="330-quiz"]');
  const results = [];
  for (const width of [1600, 1280, 768, 414, 375, 320]) {
    console.log("Checking width " + width);
    await page.setViewportSize({ width, height: 1100 });
    await page.waitForTimeout(200);
    if (await page.locator(".calendar-week-overview").isVisible()) await page.locator(".time-grid-day-label").nth(1).click();
    results.push(await page.evaluate(() => {
      const grid = document.querySelector(".time-grid");
      const headings = [...document.querySelectorAll(".time-grid-day-heading")].map((node) => {
        const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width };
      });
      const cards = [...document.querySelectorAll(".time-calendar-item, .calendar-selected-day .compact-calendar-item")].filter((node) => node.getBoundingClientRect().width > 0).map((node) => {
        const main = node.querySelector(".calendar-item-main");
        const rect = node.getBoundingClientRect();
        return {
          title: main.getAttribute("aria-label"), width: rect.width, height: rect.height,
          text: [...node.querySelectorAll("time > span, strong")].map((text) => {
            const range = document.createRange(); range.selectNodeContents(text);
            const textRect = range.getBoundingClientRect();
            return { content: text.textContent, left: textRect.left, right: textRect.right, bottom: textRect.bottom, clipped: textRect.right > rect.right + 1 || textRect.left < rect.left - 1 || textRect.bottom > rect.bottom + 1 };
          }),
        };
      });
      return { width: innerWidth, pageWidth: document.documentElement.scrollWidth, gridWidth: grid.clientWidth, gridScrollWidth: grid.scrollWidth, headings, allDayHeight: document.querySelector(".time-grid-all-day").getBoundingClientRect().height, colors: document.querySelectorAll(".calendar-day-colors > span").length, cards };
    }));
    await page.screenshot({ path: fileURLToPath(new URL("../outputs/calendar-" + width + ".png", import.meta.url)), fullPage: false });
  }
  for (const result of results) {
    assert.equal(result.pageWidth, result.width, "Page must not overflow horizontally");
    assert.equal(result.gridScrollWidth, result.gridWidth, "All seven days must fit");
    assert.equal(result.headings.length, 7);
    assert.ok(result.headings.every((heading) => Math.abs(heading.width - result.headings[0].width) < 1));
    assert.ok(result.cards.every((card) => card.text.every((text) => !text.clipped)), "Time or title was clipped");
  }
  console.log("Checking explicit timeline choice on wide screens");
  for (const width of [1600, 1280]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.getByRole("combobox", { name: "日历视图" }).selectOption("timeline");
    assert.ok(await page.locator(".time-grid-days").isVisible());
    assert.ok(!(await page.locator(".calendar-week-overview").isVisible()));
    const quiz = page.locator(".time-grid-days").getByRole("button", { name: "330-quiz · 10:00–10:50", exact: true });
    await quiz.waitFor();
    assert.ok(await quiz.evaluate((node) => {
      const card = node.closest("article").getBoundingClientRect();
      return [...node.querySelectorAll("strong")].every((text) => {
        const range = document.createRange(); range.selectNodeContents(text);
        const rect = range.getBoundingClientRect();
        return rect.bottom <= card.bottom + 1 && rect.right <= card.right + 1;
      });
    }), "50-minute title must remain visible in a fitted timeline");
    assert.match(await quiz.getAttribute("title"), /10:00–10:50/);
    await page.screenshot({ path: fileURLToPath(new URL("../outputs/calendar-timeline-" + width + ".png", import.meta.url)), fullPage: false });
    await page.setViewportSize({ width: 768, height: 1100 });
    assert.ok(await page.locator(".time-grid-days").isVisible(), "Resize must not change explicit presentation choice");
    await page.getByRole("combobox", { name: "日历视图" }).selectOption("overview");
    assert.ok(await page.locator(".calendar-week-overview").isVisible());
  }
  console.log("Checking entire timeline at 100% desktop viewport sizes");
  for (const [width, height] of [[1920, 1080], [1536, 864], [1366, 768], [1280, 720]]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("combobox", { name: "日历视图" }).selectOption("timeline");
    await page.waitForFunction(() => {
      const axis = document.querySelector(".time-grid-days").getBoundingClientRect();
      return axis.height > 0 && axis.bottom <= innerHeight && document.documentElement.scrollHeight <= innerHeight + 1;
    });
    const geometry = await page.evaluate(() => ({
      viewport: innerHeight,
      document: document.documentElement.scrollHeight,
      bottom: document.querySelector(".time-grid-days").getBoundingClientRect().bottom,
    }));
    console.log({ width, height, ...geometry });
    await page.screenshot({ path: fileURLToPath(new URL("../outputs/calendar-fit-" + width + "x" + height + ".png", import.meta.url)), fullPage: false });
    const gridTop = await page.locator(".calendar-main").evaluate((node) => node.getBoundingClientRect().top);
    await page.getByRole("button", { name: /^待落实 / }).click();
    await page.waitForFunction(() => document.documentElement.scrollHeight <= innerHeight + 1);
    assert.equal(await page.locator(".calendar-main").evaluate((node) => node.getBoundingClientRect().top), gridTop);
    await page.keyboard.press("Escape");
    assert.ok(await page.locator(".calendar-toolbar").evaluate((node) => node.getBoundingClientRect().height < 48), "Desktop toolbar must occupy one compact row");
  }
  await page.getByRole("combobox", { name: "日历视图" }).selectOption("overview");
  console.log("Checking completion, restore, edit and all-day mode changes");
  console.log("Checking top candidate disclosure on mobile and desktop");
  for (const width of [375, 1600]) {
    await page.setViewportSize({ width, height: 1100 });
    const pool = page.locator(".candidate-pool");
    assert.equal(await pool.isVisible(), false);
    await page.getByRole("button", { name: /^待落实 / }).click();
    await pool.getByRole("button", { name: /整理备忘/ }).waitFor({ state: "visible" });
    assert.ok(await pool.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight;
    }));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await pool.getByRole("button", { name: /整理备忘/ }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("dialog").getByRole("button", { name: "关闭", exact: true }).click();
    await page.getByRole("button", { name: /^待落实 / }).click();
    await page.screenshot({ path: fileURLToPath(new URL("../outputs/calendar-candidates-" + width + ".png", import.meta.url)), fullPage: false });
    await page.keyboard.press("Escape");
    assert.equal(await pool.isVisible(), false);
  }
  await page.getByRole("button", { name: "隐藏课程表", exact: true }).click();
  await page.getByRole("button", { name: "显示课程表", exact: true }).click();
  await page.getByRole("combobox", { name: "日历视图" }).selectOption("month");
  await page.getByRole("combobox", { name: "日历视图" }).selectOption("overview");
  await page.locator(".time-grid-day-label").nth(1).click();
  await page.setViewportSize({ width: 320, height: 1100 });
  await page.locator(".calendar-selected-day").getByRole("button", { name: "完成 330-quiz", exact: true }).click();
  await page.locator(".calendar-selected-day").getByRole("button", { name: "恢复 330-quiz", exact: true }).click();
  await page.locator(".calendar-selected-day").getByRole("button", { name: "330-quiz · 10:00–10:50", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "关闭", exact: true }).click();
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.locator(".calendar-week-overview").getByRole("button", { name: "career fair", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "待安排", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "保存事项", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".time-grid-days .calendar-day-colors > span").length === 2);
  await page.locator(".calendar-week-overview").getByRole("button", { name: "career fair", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "全天", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "保存事项", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".time-grid-days .calendar-day-colors > span").length === 3);
  console.log("Checking overnight display range fits at 100%");
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("planner-v1");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("settings", "readwrite");
        const settings = tx.objectStore("settings");
        const all = settings.getAll();
        all.onsuccess = () => all.result.forEach((value) => settings.put({ ...value, calendarDisplayEnd: "02:00" }));
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.reload();
  await page.getByRole("combobox", { name: "日历视图" }).selectOption("timeline");
  await page.waitForFunction(() => document.querySelector(".time-grid-hours .is-end")?.textContent.includes("02:00") && document.documentElement.scrollHeight <= innerHeight + 1);
  await page.screenshot({ path: fileURLToPath(new URL("../outputs/calendar-fit-overnight.png", import.meta.url)), fullPage: false });
  assert.deepEqual(errors, []);
  await writeFile(new URL("../outputs/calendar-browser-results.json", import.meta.url), JSON.stringify({ results, errors, interactions: "passed" }, null, 2));
  console.log(JSON.stringify({ results: results.map(({ width, pageWidth, gridWidth, gridScrollWidth, cards }) => ({ width, pageWidth, gridWidth, gridScrollWidth, clipped: cards.filter((card) => card.text.some((text) => text.clipped)).map((card) => card.title) })), errors }, null, 2));
} finally { await browser.close(); }
