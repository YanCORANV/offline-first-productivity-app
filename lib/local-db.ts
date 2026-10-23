"use client";

import Dexie, { type EntityTable } from "dexie";
import type {
  AiRun,
  CalendarEvent,
  PlannerSettings,
  PlannerTask,
  QuickThought,
  SyncConflict,
  SyncOperation,
  Goal,
  Project,
  ProjectNode,
  ScheduleBlock,
  FragmentActivity,
  ItemTypeOption,
  MissedNotification,
  OriginLink,
} from "./domain";
import {
  DEFAULT_ITEM_TYPES,
  normalizeFragmentMinutes,
} from "./domain";

export class PlannerDatabase extends Dexie {
  thoughts!: EntityTable<QuickThought, "id">;
  tasks!: EntityTable<PlannerTask, "id">;
  events!: EntityTable<CalendarEvent, "id">;
  aiRuns!: EntityTable<AiRun, "id">;
  settings!: EntityTable<PlannerSettings, "id">;
  operations!: EntityTable<SyncOperation, "id">;
  conflicts!: EntityTable<SyncConflict, "id">;
  goals!: EntityTable<Goal, "id">;
  projects!: EntityTable<Project, "id">;
  projectNodes!: EntityTable<ProjectNode, "id">;
  scheduleBlocks!: EntityTable<ScheduleBlock, "id">;
  fragmentActivities!: EntityTable<FragmentActivity, "id">;
  notifications!: EntityTable<MissedNotification, "id">;
  originLinks!: EntityTable<OriginLink, "id">;

  constructor() {
    super("planner-v1");
    this.version(1).stores({
      thoughts: "id, status, createdAt, updatedAt, version",
      tasks: "id, status, dueAt, scheduledStartAt, updatedAt, version",
      events: "id, startAt, endAt, updatedAt, version",
      aiRuns: "id, status, createdAt",
      settings: "id",
      operations: "id, status, createdAt, entityType, entityId",
      conflicts: "id, operationId, entityType, entityId, createdAt",
    });
    this.version(2)
      .stores({
        thoughts: "id, status, createdAt, updatedAt, version",
        tasks: "id, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, updatedAt, version",
        events: "id, eventKind, startAt, endAt, updatedAt, version",
        aiRuns: "id, status, createdAt",
        settings: "id",
        operations: "id, status, createdAt, entityType, entityId",
        conflicts: "id, operationId, entityType, entityId, createdAt",
        goals: "id, order, archived, updatedAt, version",
        projects: "id, goalId, status, order, updatedAt, version",
        projectNodes: "id, projectId, parentId, order, status, isFocused, updatedAt, version",
        scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
        phases: "id, startDate, endDate, updatedAt, version",
        reviews: "id, kind, periodKey, completedAt, updatedAt, version",
        fragmentActivities: "id, durationBucket, enabled, updatedAt, version",
        notifications: "id, readAt, createdAt",
        originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version",
      })
      .upgrade(async (transaction) => {
        await Promise.all([
          transaction.table("thoughts").clear(),
          transaction.table("tasks").clear(),
          transaction.table("events").clear(),
          transaction.table("aiRuns").clear(),
          transaction.table("settings").clear(),
          transaction.table("operations").clear(),
          transaction.table("conflicts").clear(),
        ]);
      });
    this.version(3)
      .stores({
        thoughts: "id, status, createdAt, updatedAt, version",
        tasks: "id, planningState, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, updatedAt, version",
        events: "id, eventKind, startAt, endAt, updatedAt, version",
        aiRuns: "id, status, createdAt",
        settings: "id",
        operations: "id, status, createdAt, entityType, entityId",
        conflicts: "id, operationId, entityType, entityId, createdAt",
        goals: "id, order, archived, updatedAt, version",
        projects: "id, goalId, status, initializationState, order, updatedAt, version",
        projectNodes: "id, projectId, parentId, order, status, isFocused, updatedAt, version",
        scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
        phases: "id, startDate, endDate, updatedAt, version",
        reviews: "id, kind, periodKey, completedAt, updatedAt, version",
        fragmentActivities: "id, durationBucket, enabled, updatedAt, version",
        notifications: "id, readAt, createdAt",
        originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version",
      })
      .upgrade(async (transaction) => {
        const nodes = await transaction.table("projectNodes").toArray();
        const projectIdsWithNodes = new Set(nodes.map((node) => String(node.projectId)));
        await transaction.table("tasks").toCollection().modify((task) => {
          task.planningState = task.planningState ?? "planned";
        });
        await transaction.table("projects").toCollection().modify((project) => {
          project.initializationState =
            project.initializationState ??
            (projectIdsWithNodes.has(String(project.id)) ? "ready" : "draft");
          project.importCheckpoint = null;
        });
        await transaction.table("thoughts").toCollection().modify((thought) => {
          if (thought.status === "someday") {
            thought.status = "inbox";
            thought.processedAt = null;
            thought.resultLabel = null;
          }
        });
      });
    this.version(4)
      .stores({
        thoughts: "id, status, createdAt, updatedAt, version",
        tasks: "id, planningState, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, updatedAt, version",
        events: "id, eventKind, startAt, endAt, updatedAt, version",
        aiRuns: "id, status, createdAt",
        settings: "id",
        operations: "id, status, createdAt, entityType, entityId",
        conflicts: "id, operationId, entityType, entityId, createdAt",
        goals: "id, order, archived, updatedAt, version",
        projects: "id, goalId, status, initializationState, plannedStartDate, plannedEndDate, order, updatedAt, version",
        projectNodes: "id, projectId, parentId, order, status, isFocused, needsContinuousTime, updatedAt, version",
        scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
        phases: null,
        reviews: "id, kind, periodKey, completedAt, updatedAt, version",
        fragmentActivities: "id, durationBucket, enabled, updatedAt, version",
        notifications: "id, readAt, createdAt",
        originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version",
      })
      .upgrade(async (transaction) => {
        await transaction.table("tasks").toCollection().modify((task) => {
          task.needsContinuousTime = Boolean(task.needsContinuousTime);
          delete task.durationBucket;
        });
        await transaction.table("projectNodes").toCollection().modify((node) => {
          node.needsContinuousTime = Boolean(node.needsContinuousTime);
          delete node.durationBucket;
        });
        await transaction.table("projects").toCollection().modify((project) => {
          project.plannedStartDate ??= null;
          project.plannedEndDate ??= null;
        });
        await transaction.table("settings").toCollection().modify((settings) => {
          settings.defaultWakeTime ??= settings.availableDayStart ?? "08:00";
          settings.defaultSleepTime ??= settings.availableDayEnd ?? "00:30";
          settings.sleepOverrides ??= {};
          delete settings.availableDayStart;
          delete settings.availableDayEnd;
        });
      });
    this.version(5)
      .stores({
        thoughts: "id, status, createdAt, updatedAt, version",
        tasks: "id, planningState, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, updatedAt, version",
        events: "id, eventKind, startAt, endAt, updatedAt, version",
        aiRuns: "id, status, createdAt",
        settings: "id",
        operations: "id, status, createdAt, entityType, entityId",
        conflicts: "id, operationId, entityType, entityId, createdAt",
        goals: "id, order, archived, updatedAt, version",
        projects: "id, goalId, status, initializationState, plannedStartDate, plannedEndDate, order, updatedAt, version",
        projectNodes: "id, projectId, parentId, order, status, isFocused, needsContinuousTime, updatedAt, version",
        scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
        reviews: "id, kind, periodKey, completedAt, updatedAt, version",
        fragmentActivities: "id, durationBucket, enabled, updatedAt, version",
        notifications: "id, readAt, createdAt",
        originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version",
      })
      .upgrade(async (transaction) => {
        await transaction.table("events").toCollection().modify((event) => {
          event.location ??= null;
        });
        await transaction.table("settings").toCollection().modify((settings) => {
          settings.calendarDisplayStart ??= "08:00";
          settings.calendarDisplayEnd ??= "02:00";
          if (!settings.itemTypes?.some((type: ItemTypeOption) => type.id === "course")) {
            const courseType = DEFAULT_ITEM_TYPES.find((type) => type.id === "course");
            if (courseType) {
              settings.itemTypes = [...(settings.itemTypes ?? []), { ...courseType }];
            }
          }
        });
      });
    this.version(6)
      .stores({
        thoughts: "id, status, createdAt, updatedAt, version",
        tasks: "id, planningState, status, taskKind, dueAt, desiredCompletionAt, actualDeadlineAt, isFragmentFriendly, updatedAt, version",
        events: "id, eventKind, startAt, endAt, updatedAt, version",
        aiRuns: "id, status, createdAt",
        settings: "id",
        operations: "id, status, createdAt, entityType, entityId",
        conflicts: "id, operationId, entityType, entityId, createdAt",
        goals: "id, order, archived, updatedAt, version",
        projects: "id, goalId, status, initializationState, plannedStartDate, plannedEndDate, order, updatedAt, version",
        projectNodes: "id, projectId, parentId, order, status, isFocused, needsContinuousTime, isFragmentFriendly, updatedAt, version",
        scheduleBlocks: "id, sourceType, sourceId, date, startAt, status, updatedAt, version",
        reviews: "id, kind, periodKey, completedAt, updatedAt, version",
        fragmentActivities: "id, enabled, updatedAt, version",
        notifications: "id, readAt, createdAt",
        originLinks: "id, sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, updatedAt, version",
      })
      .upgrade(async (transaction) => {
        await transaction.table("tasks").toCollection().modify((task) => {
          task.isFragmentFriendly = Boolean(task.isFragmentFriendly);
          if (task.needsContinuousTime) task.isFragmentFriendly = false;
        });
        await transaction.table("projectNodes").toCollection().modify((node) => {
          node.isFragmentFriendly = Boolean(node.isFragmentFriendly);
          if (node.needsContinuousTime) node.isFragmentFriendly = false;
        });
        await transaction.table("fragmentActivities").toCollection().modify((activity) => {
          activity.eligibleMinutes = normalizeFragmentMinutes(
            activity.eligibleMinutes,
            activity.durationBucket,
          );
          delete activity.durationBucket;
        });
      });
    this.version(7)
      .stores({ reviews: null })
      .upgrade(async (transaction) => {
        await Promise.all([
          transaction.table("operations").where("entityType").equals("review").delete(),
          transaction.table("conflicts").where("entityType").equals("review").delete(),
        ]);
        await transaction.table("settings").toCollection().modify((settings) => {
          delete settings.reviewTime;
          delete settings.weeklyReviewTime;
          delete settings.monthlyReviewTime;
          delete settings.dailyReviewEnabled;
          delete settings.weeklyReviewEnabled;
          delete settings.monthlyReviewEnabled;
        });
      });
  }
}

let database: PlannerDatabase | null = null;

export function getPlannerDb(): PlannerDatabase {
  if (typeof window === "undefined") {
    throw new Error("Planner database is only available in the browser.");
  }
  database ??= new PlannerDatabase();
  return database;
}
