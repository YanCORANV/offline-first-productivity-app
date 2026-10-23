import { useRef, useState } from "react";
import { Folder, Plus, Trash2 } from "lucide-react";
import { DEFAULT_ITEM_TYPES } from "@/lib/domain";
import type { SettingsFormProps } from "./schedule-settings";

export function ItemTypesSettingsSection({
  form,
  setForm,
  itemTypeName,
  onItemTypeNameChange,
  onRemove,
  onSave: _onSave,
}: SettingsFormProps & {
  itemTypeName: string;
  onItemTypeNameChange: (name: string) => void;
  onRemove: (id: string) => Promise<void>;
  onSave?: () => Promise<void>;
}) {
  const [showAddInput, setShowAddInput] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    if (!itemTypeName.trim()) return;
    const defaultColors = ["#0071e3", "#34c759", "#ff9500", "#af52de", "#ff2d55", "#5856d6", "#00c7be", "#a2845e"];
    const color = defaultColors[form.itemTypes.length % defaultColors.length];
    setForm((current) => ({
      ...current,
      itemTypes: [
        ...current.itemTypes,
        {
          id: `type_${Date.now().toString(36)}`,
          name: itemTypeName.trim(),
          color,
        },
      ],
    }));
    onItemTypeNameChange("");
    setShowAddInput(false);
  }

  return (
    <section className="settings-card item-types-card">
      <div className="settings-card-header">
        <div className="settings-card-header-left">
          <div className="settings-card-icon-badge">
            <Folder size={18} />
          </div>
          <div className="settings-card-title-group">
            <h2>分类管理</h2>
          </div>
        </div>
      </div>

      <div className="category-management-list item-type-settings">
        {form.itemTypes.map((type) => (
          <div key={type.id} className="category-item-row">
            <label
              className="category-color-swatch-label"
              style={{ backgroundColor: type.color }}
              title={`点击修改颜色：${type.color}`}
            >
              <input
                type="color"
                className="category-native-color-picker"
                value={type.color}
                aria-label={`设置 ${type.name} 的颜色`}
                onChange={(event) => {
                  const color = event.currentTarget.value;
                  setForm((current) => ({
                    ...current,
                    itemTypes: current.itemTypes.map((item) =>
                      item.id === type.id ? { ...item, color } : item,
                    ),
                  }));
                }}
              />
            </label>

            <input
              type="text"
              className="category-item-name-input"
              value={type.name}
              aria-label="分类名称"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  itemTypes: current.itemTypes.map((item) =>
                    item.id === type.id ? { ...item, name: event.target.value } : item,
                  ),
                }))
              }
            />

            {!DEFAULT_ITEM_TYPES.some((item) => item.id === type.id) ? (
              <button
                className="category-delete-btn"
                type="button"
                onClick={() => void onRemove(type.id)}
                aria-label={`删除分类 ${type.name}`}
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <span className="category-delete-placeholder" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {showAddInput ? (
        <div className="category-add-field-row">
          <input
            ref={addInputRef}
            autoFocus
            className="category-add-input"
            value={itemTypeName}
            placeholder="输入新分类名称..."
            aria-label="新分类名称"
            onChange={(event) => onItemTypeNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleAdd();
              if (event.key === "Escape") setShowAddInput(false);
            }}
          />
          <button
            type="button"
            className="secondary-button category-confirm-add-btn"
            disabled={!itemTypeName.trim()}
            onClick={handleAdd}
          >
            确认添加
          </button>
          <button
            type="button"
            className="secondary-button category-cancel-add-btn"
            onClick={() => setShowAddInput(false)}
          >
            取消
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="category-add-full-btn"
          onClick={() => {
            setShowAddInput(true);
            setTimeout(() => addInputRef.current?.focus(), 50);
          }}
        >
          <Plus size={16} /> 新增分类
        </button>
      )}
    </section>
  );
}
