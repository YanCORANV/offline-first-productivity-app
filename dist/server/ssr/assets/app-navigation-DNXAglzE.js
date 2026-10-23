import { l as __toESM, o as require_react } from "../index.js";
//#region components/app-navigation.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var AppNavigationContext = (0, import_react.createContext)(null);
function useAppNavigation() {
	const value = (0, import_react.useContext)(AppNavigationContext);
	if (!value) throw new Error("useAppNavigation must be used inside PlannerApp");
	return value;
}
//#endregion
export { useAppNavigation as n, AppNavigationContext as t };
