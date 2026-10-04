export type ThemePref = "system" | "light" | "dark";

export const THEME_KEY = "pickl-theme";

/**
 * Runs in <head> before the page paints, so there's no light flash in dark mode.
 * Also follows the OS setting live while the preference is "system".
 */
export const THEME_SCRIPT = `(function(){try{var k="${THEME_KEY}",m=window.matchMedia("(prefers-color-scheme: dark)");function a(){var t=localStorage.getItem(k)||"system";document.documentElement.classList.toggle("dark",t==="dark"||(t==="system"&&m.matches));}a();m.addEventListener("change",a);window.addEventListener("storage",function(e){if(e.key===k)a();});}catch(e){}})();`;

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* storage blocked — still apply for this page */
  }
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}
