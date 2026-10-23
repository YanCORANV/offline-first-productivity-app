import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import type { ReactNode } from "react";

export type CalendarMode = "week" | "month";

export function CalendarToolbar({
  view,
  onViewChange,
  children,
  onMove,
  onToday,
  onAdd,
  hideCourses,
  onHideCoursesChange,
}: {
  view: "overview" | "timeline" | "month";
  onViewChange: (view: "overview" | "timeline" | "month") => void;
  children: ReactNode;
  onMove: (direction: -1 | 1) => void;
  onToday: () => void;
  onAdd: () => void;
  hideCourses: boolean;
  onHideCoursesChange: (hidden: boolean) => void;
}) {
  return (
    <div className="calendar-toolbar" aria-label="日历工具栏">
      <div className="calendar-navigation" aria-label="切换日期">
        <button className="calendar-tool calendar-tool-icon" type="button" onClick={() => onMove(-1)} aria-label="上一段时间" title="上一段时间">
          <ChevronLeft size={18} />
        </button>
        <button className="calendar-tool calendar-tool-icon" type="button" onClick={onToday} aria-label="回到今天" title="回到今天">
          <CalendarIcon size={16} />
        </button>
        <button className="calendar-tool calendar-tool-icon" type="button" onClick={() => onMove(1)} aria-label="下一段时间" title="下一段时间">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-view-segmented" role="radiogroup" aria-label="日历视图">
        <button
          type="button"
          role="radio"
          aria-checked={view === "overview"}
          className={`calendar-view-segment-btn ${view === "overview" ? "is-active" : ""}`}
          onClick={() => onViewChange("overview")}
          value="overview">周概览</button>
        <button
          type="button"
          role="radio"
          aria-checked={view === "timeline"}
          className={`calendar-view-segment-btn ${view === "timeline" ? "is-active" : ""}`}
          onClick={() => onViewChange("timeline")}
          value="timeline">周时间轴</button>
        <button
          type="button"
          role="radio"
          aria-checked={view === "month"}
          className={`calendar-view-segment-btn ${view === "month" ? "is-active" : ""}`}
          onClick={() => onViewChange("month")}
          value="month">月视图</button>
      </div>
      <div className="calendar-toolbar-actions">
        <button className="calendar-tool calendar-add-button" type="button" onClick={onAdd} aria-label="新增事项">
          <CalendarPlus size={16} /><span>新增</span>
        </button>
        {children}
        <button
          className="calendar-tool calendar-tool-icon"
          type="button"
          aria-pressed={hideCourses}
          onClick={() => onHideCoursesChange(!hideCourses)}
          aria-label={hideCourses ? "显示课程表" : "隐藏课程表"}
          title={hideCourses ? "显示课程表" : "隐藏课程表"}
        >
          {hideCourses ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="sr-only">{hideCourses ? "显示课程表" : "隐藏课程表"}</span>
        </button>
      </div>
    </div>
  );
}
