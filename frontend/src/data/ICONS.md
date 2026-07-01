# ═══════════════════════════════════════════════════════════════
# RSP (Recipe.IO) — REACT ICONS STANDARDIZATION PROMPT
# For: Cursor IDE Implementation
# ═══════════════════════════════════════════════════════════════

## 🎯 TASK

Analyze the attached file **`icons.txt`** and all attached UI/UX screenshots (Profile page, Dashboard, My Recipes, Create Recipe, Saved Recipes). Study the entire document and understand the intended icon system before making any changes.

Implement a complete **React Icons standardization** across the entire RSP project.

---

## 🚨 REQUIREMENTS

- Use **React Icons only** (`react-icons` package). Do not introduce any other icon libraries.
- Replace existing emojis, Unicode symbols, raw SVGs, or inconsistent icons with the specified React Icons listed below.
- Keep all existing text labels exactly as they are — only add or replace the icons.
- **Reuse the same React Icon for the same functionality throughout the entire project** (e.g., if `FaHeart` is used for Likes on one page, use `FaHeart` for Likes on every other page — never mix icon sets for the same action).
- If any action, button, stat, or feature is missing an icon, add an appropriate React Icon following the same standard established below.
- Match the existing icon sizes and spacing taken from the old icon/emoji it replaces. Only adjust alignment if visually necessary to fit the new icon.
- Only apply color where explicitly required (e.g., `FaHeart` red, `FaFire` orange/red); otherwise icons inherit the existing theme/text colors.

## ❌ DO NOT

- Do not change layouts, UI/UX, colors, themes, typography, responsiveness, animations, spacing, authentication, routing, APIs, MongoDB Atlas integration, Cloudinary integration, validations, or business logic.
- Do not redesign any page.
- Only perform the React Icons integration and standardization while preserving the current behavior and appearance of the RSP application.

---

## 📦 ICON LIBRARY SETUP

If `react-icons` is not already installed, install it:
```bash
npm install react-icons
```

All icons should be imported from their respective sub-packages, e.g.:
```javascript
import { FaHeart, FaFire, FaStar } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa6";
import { IoMdShareAlt } from "react-icons/io";
import { IoEyeSharp } from "react-icons/io5";
import { CiSaveDown2, CiSearch } from "react-icons/ci";
import { TiCamera } from "react-icons/ti";
import { MdReportProblem, MdAdd } from "react-icons/md";
import { GiSpellBook } from "react-icons/gi";
import { BsPeopleFill } from "react-icons/bs";
import { FaClipboardList } from "react-icons/fa";
import { ImBooks } from "react-icons/im";
import { RiDraftFill } from "react-icons/ri";
import { SiBookstack } from "react-icons/si";
import { TfiWrite } from "react-icons/tfi";
import ReactCountryFlag from "react-country-flag";
```
(`react-country-flag` is a separate small package required for Task 3 — install if missing: `npm install react-country-flag`)

---

## 🗂️ MASTER ICON MAPPING TABLE (Reuse These Globally)

| Functionality / Label | React Icon | Notes |
|---|---|---|
| Like / Favorite (filled / active) | `FaHeart` (fa) | Red color |
| Like / Favorite (outline / inactive) | `FaRegHeart` (fa6) | Default theme color |
| Search | `CiSearch` (ci) | |
| Fire / Calories | `FaFire` (fa) | Orange/red color |
| Share | `IoMdShareAlt` (io) | |
| Save / Add to Favorites | `CiSaveDown2` (ci) | |
| Views | `IoEyeSharp` (io5) | |
| Add Recipe Snap / Camera | `TiCamera` (ti) | |
| Report | `MdReportProblem` (md) | |
| About / Recipe Book | `GiSpellBook` (gi) | |
| People / Servings | `BsPeopleFill` (bs) | |
| Step List / Instructions | `FaClipboardList` (fa) | |
| Rating / Star | `FaStar` (fa) | |
| Total Recipes / Books | `ImBooks` (im) | |
| Draft status | `RiDraftFill` (ri) | |
| All / Stack | `SiBookstack` (si) | |
| Add / Create / Plus | `MdAdd` (md) | |
| Empty state / Write | `TfiWrite` (tfi) | |
| Cuisine flags | `ReactCountryFlag` (react-country-flag) | |

---

## 📋 PAGE-BY-PAGE IMPLEMENTATION SPEC

### 1. Landing Page — Top 4 Food Cards (`LANDING_TOP_RECIPES`)
- `"0 (0 reviews)"` rating text → replace the rating display with `FaHeart` (red) ahead of/representing the review indicator, keeping the existing text exactly as is (e.g. icon + `"0 (0 reviews)"`).

### 2. Landing Page — `Foodslider.jsx`
- `{ icon: '🔥', val: current.kcal }` → replace `'🔥'` emoji with `FaFire` (fa) React Icon component, same size/position, orange/red color.

### 3. Home Page — Hero Banners (`HOME_HERO_BANNERS`)
- Cuisine category headings currently show no flag (text only): `"🇮🇹 Italian Cuisine"`, `"🇮🇳 Indian Cuisine"`, `"🇺🇸 American Cuisine"`, `"🇨🇳 Chinese Cuisine"`, `"🇸🇦 Arabic Cuisine"`.
- Replace the raw flag emoji prefix with `ReactCountryFlag` component for each, rendering as **Flag + Cuisine Name**:
```jsx
import ReactCountryFlag from "react-country-flag";

<ReactCountryFlag countryCode="IT" svg style={{ width: "1.5em", height: "1.5em", marginRight: "8px" }} /> Italian Cuisine
<ReactCountryFlag countryCode="IN" svg style={{ width: "1.5em", height: "1.5em", marginRight: "8px" }} /> Indian Cuisine
<ReactCountryFlag countryCode="US" svg style={{ width: "1.5em", height: "1.5em", marginRight: "8px" }} /> American Cuisine
<ReactCountryFlag countryCode="CN" svg style={{ width: "1.5em", height: "1.5em", marginRight: "8px" }} /> Chinese Cuisine
<ReactCountryFlag countryCode="SA" svg style={{ width: "1.5em", height: "1.5em", marginRight: "8px" }} /> Arabic Cuisine
```

### 4. Home Page — `RecipeCardgrid.jsx`
- Top-right like icon on each card: `{recipeFavorite ? "*" : "+"}` → replace:
  - `"+"` (unfavorited state) → `FaRegHeart` (fa6)
  - `"*"` (favorited state) → `FaHeart` (fa), red color
- Additional card details requiring icons (`HOME_RECIPE_CARDS`):
  - **Non-Veg / Veg indicator** → use a small colored dot/square indicator already styled in UI, OR if an icon is required, use `GiMeat` (gi) for Non-veg and `GiLeafSwirl` (gi) for Veg — pick whichever fits the existing badge style without altering layout.
  - **Author (e.g. "by Shinu S Lulu")** → `GiChefToque` (gi) — chef hat icon, prefixed before author name.
  - **Difficulty** (e.g. "Medium") → `MdSignalCellularAlt` (md) or `GiSkills` (gi) — use a difficulty/level icon.
  - **Preparation Time** → `MdAccessTime` (md) — clock/time icon.
  - **Ratings (numeric, e.g. "4.5")** → `FaStar` (fa).
  - **"No Ratings Yet"** → `FaRegStar` (fa) — outline star icon for empty rating state.
  - **"View Recipe →"** → keep text, replace the `→` arrow character with `FaArrowRight` (fa) or `MdArrowForward` (md) React Icon, same position (trailing).

### 5. Home Page — `Foodslider2.jsx`
- **"by [Chef Name]"** → prefix with `GiChefToque` (gi) chef icon (reuse same icon as #4 Author).
- **`🔥 500 cal`** → replace `🔥` emoji with `FaFire` (fa), same orange/red color, keep `"500 cal"` text exactly.
- **Pagination buttons**:
  - `{'← Previous'}` → replace `←` with `FaArrowLeft` (fa) / `MdArrowBack` (md), positioned before "Previous" text.
  - `Next {'→'}` → replace `→` with `FaArrowRight` (fa) / `MdArrowForward` (md), positioned after "Next" text.

### 6. `Recipes.jsx` Page (Recipe Details View)
- **Likes** → `FaRegHeart` (fa6) inactive state / `FaHeart` (fa) active state, red color when liked.
- **Share Link** → `IoMdShareAlt` (io).
- **Add to Favourites** → `CiSaveDown2` (ci).
- **Time** → `MdAccessTime` (md).
- **Difficulty** → reuse same icon chosen in #4 (`MdSignalCellularAlt` or `GiSkills`).
- **Serves** → `{ icon: '🍽', val: current.serves }` → replace `'🍽'` emoji with `BsPeopleFill` (bs) (reuse servings icon across the app) or `GiKnifeFork` (gi) if a plate/cutlery icon is preferred — **must match whichever is used for "For X servings" below for consistency**.
- **Ratings** → `FaStar` (fa) (reuse from #4).
- **"No Ratings Yet"** → `FaRegStar` (fa) (reuse from #4).
- **Views** → `IoEyeSharp` (io5).
- **Add RecipeSnap** → `TiCamera` (ti).
- **Report Recipe** → `MdReportProblem` (md).
- **`<h2>"📖" About This Recipe</h2>`** → replace `"📖"` emoji with `GiSpellBook` (gi), keep `"About This Recipe"` text exactly.
- **Recipe Details card**:
  - Difficulty → reuse icon from above (`MdSignalCellularAlt` or `GiSkills`)
  - Time → reuse `MdAccessTime` (md)
  - Servings → reuse `BsPeopleFill` (bs)
  - Status (Published) → `MdCheckCircle` (md) or `MdPublic` (md) — published/visibility icon
  - Created → `MdCalendarToday` (md) — date icon
- **`"👥" For 4 servings`** → replace `"👥"` emoji with `BsPeopleFill` (bs), keep `"For 4 servings"` text exactly.
- **`<h2>Step-by-Step Instructions ({instructions.length})</h2>`** → prefix with `FaClipboardList` (fa), keep text and count exactly.
- **`<h2>Rate this Recipe</h2>`** → prefix with `FaStar` (fa) (reuse rating icon).

### 7. My Recipes Page (`/my-recipes`)
- **Stats cards**:
  - `"📚" Total Recipes` → `ImBooks` (im)
  - `"👁" Total Views` → `IoEyeSharp` (io5) (reuse from #6)
  - `"❤️" Total Likes` → `FaHeart` (fa), red color (reuse)
  - `"⭐" Avg Rating` → `FaStar` (fa) (reuse)
- **Search input** — `placeholder="Search recipes by title or description..."` → prefix the input with `CiSearch` (ci) icon, keep placeholder text exactly.
- **"All" filter button** → `SiBookstack` (si).
- **"Public" filter button** → `MdPublic` (md) (reuse published icon from #6 Status).
- **"Draft" filter button** → `RiDraftFill` (ri).
- **"Add Recipe" button** → `MdAdd` (md).
- **Empty state** (no recipes found):
  ```jsx
  {searchQuery ? "🔍" : recipes.length === 0 ? "📝" : "📋"}
  ```
  → replace ALL THREE emoji conditions with a single consistent `TfiWrite` (tfi) icon (large size, matching old `fontSize: "64px"`), since the spec calls for `TfiWrite` regardless of state.
- **"Create Your First Recipe" button** → prefix with `MdAdd` (md) (reuse Add icon).

### 8. Favorites Page (`/favorites`)
- **Empty state** `<div>"❤️"</div>` → replace with `FaHeart` (fa), red color, same large size (`72px` equivalent).
- **"Explore Recipes" button** → prefix with `CiSearch` (ci) (reuse search icon).

### 9. Additional Pages Observed in Screenshots (Apply Same Standard — Fill Gaps)

Based on the attached screenshots, also apply icons consistently to these areas not explicitly detailed in `icons.txt` but following the same system:

- **Account / Profile sidebar item** → reuse a person/account icon (`FaUserCircle` from `fa` or similar) prefixing "Account" label — check sidebar already has icons for Home, My Recipes, Saved Recipes, Create Recipe, Dashboard; ensure "Account" and "Logout" sidebar items also use consistent React Icons (Logout already appears to use an icon — keep/standardize using `IoLogOutOutline` or similar from the same family, do not change if already React Icons).
- **Dashboard "Quick Actions" cards** (Create Recipe / My Recipes / Profile) — the emoji icons shown (🔍, 📖, 👤) should be replaced with consistent React Icons: `MdAdd` or `CiSearch`-style create icon, `GiSpellBook` (reuse About icon) for My Recipes, and a profile icon (`FaUserCircle` or `CgProfile`) for Profile — matching size/position of existing emoji.
- **Saved Recipes card heart badge** (top-right corner showing `❤️ 1` count) → replace `❤️` with `FaHeart` (fa), red color, reuse same icon as Likes everywhere else.
- **"Remove" button on Saved Recipes card** — if an icon is desired for consistency with Delete actions elsewhere, this is optional since text-only buttons elsewhere (View/Edit/Delete/Copy/Draft on My Recipes) are not explicitly required to get icons per `icons.txt` — **leave these buttons text-only unless `icons.txt` explicitly lists them, to avoid unrequested UI changes.**

> **Note**: Only apply additions in this section 9 where doing so does not conflict with the "do not redesign" rule — these are gap-fills using the exact same icon families/system already defined above, not new UI elements.

---

## ✅ VERIFICATION REPORT (Required After Implementation)

After completing the implementation, provide a concise verification report listing:

1. **Files modified** — full list of every `.jsx`/`.js` file touched.
2. **Icons added/replaced** — table of old icon/emoji → new React Icon, per file.
3. **Reused icon mappings** — confirm which icons were reused across multiple pages (e.g. `FaHeart` used in Landing Cards, RecipeCardgrid, Recipes.jsx, My Recipes stats, Favorites empty state).
4. **Confirmation statement** that no functionality, layout, UI/UX, color, theme, typography, spacing, animation, authentication, routing, API, MongoDB Atlas, Cloudinary, or validation logic was altered beyond the icon updates.

---

## 🔁 SUMMARY OF GLOBAL ICON REUSE RULE

The single most important rule: **one functionality = one icon, everywhere in the app.** Before adding any icon, check this master table first. If the same action/label appears on a different page, use the exact same icon imported from the exact same react-icons sub-package — never introduce a visually different icon for an already-mapped functionality (e.g. Likes is always `FaHeart`/`FaRegHeart`, Search is always `CiSearch`, Time is always `MdAccessTime`, Servings is always `BsPeopleFill`, Rating is always `FaStar`/`FaRegStar`).
