# MASTER PROMPT — RSP Authentication, Profile, Recipe & Dashboard Workflows
# Paste this entire file into Cursor AI with the full project open.
# Source: RSP–Authentication,Functionality&Workflow.txt + 6 reference screenshots.

---

## ROLE

You are a Senior MERN Stack Engineer working inside my existing Recipe.IO (RSP) project.
Before changing anything, open and read the actual current implementation of every file
referenced below. Compare it against the workflows specified in this prompt. If a feature
already behaves exactly as specified, do NOT touch it. If it's broken, incomplete, or
missing, implement it exactly as described.

---

## ABSOLUTE CONSTRAINTS

- Do NOT change any colors, themes, typography, spacing, animations, or visual design.
- Do NOT change any component that is already working correctly per the spec below.
- Do NOT add a Follow/Followers/Following system — RSP intentionally has none.
- Do NOT add an Admin system — RSP is fully user-driven (already removed).
- Do NOT break existing routes, MongoDB Atlas integration, or Cloudinary integration.
- Preserve all current UI/UX exactly. Only fix/implement the functional logic described.
- Every database read/write must scope to the correct user — never leak one user's
  private data (drafts, edit controls) into another user's public view.

---

## CURRENT STATE OBSERVED FROM SCREENSHOTS (use as ground truth before changing anything)

| Screenshot | Page | Observed State |
|---|---|---|
| Image 1 | `/profile` (My Profile) | Shows Member Since, Shared Recipes, Location, Favorite Cuisine, Latest Recipe, Edit Profile, View My Recipes, Back to Dashboard, Logout. **Missing:** Recipes count (draft+public), Total Views, Total Likes, AVG Rating, Bio, Change Password button — all required per spec below. |
| Image 2 | `/dashboard` → My Recipes widget | Each card shows only **View / Edit / Delete**. **Missing Draft/Publish toggle and Copy** — inconsistent with the My Recipes page (Image 6), which already has the full correct button set. |
| Image 3 | `/dashboard` → Top Recipes + Quick Actions | "No views data yet." empty state correct. Quick Actions (Create Recipe → Start Creating, My Recipes → View Recipes, Profile → Go to Profile) appear correctly wired. |
| Image 4 | `/add-recipe` | Categories, Cuisine Type, Servings, Cook Time, Image upload (drag/drop + paste URL) present. Need to verify validation rules match spec (see Task 09). |
| Image 5 | `/saved-recipes` | Card renders correctly with Remove button. Doc explicitly flags a **"Failed to Update Saved Recipe"** runtime error — must be fixed (Task 03). |
| Image 6 | `/my-recipes` | Cards correctly show **View / Edit / Draft / Copy / Delete** — this is the CORRECT button set. Use this exact same set on the Dashboard widget (Image 2) to fix that inconsistency. |

---

## TASK 01 — JWT Session Persistence (7-Day Expiry)
### Priority: HIGH | Status: VERIFY → FIX IF BROKEN

**Backend — auth controller (login endpoint):**
```js
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
```
Verify this exact `expiresIn: "7d"` value is set. If it's shorter (e.g. "1h", "1d") or missing, fix it.

**Frontend — token storage:**
- Confirm token is stored in `localStorage` (not `sessionStorage`) after login.
- Confirm an axios interceptor or auth context reads `localStorage` on app mount/refresh
  to restore the logged-in session — user must stay logged in after closing and
  reopening the browser, not just on tab refresh.
- Confirm there is logic that decodes the JWT expiry and triggers logout + redirect to
  `/login` automatically only when the token has actually expired (not on every reload).

**Expected workflow (must match exactly):**
```
Login → JWT (7d) → localStorage → Close Browser → Reopen → Still Logged In
→ After 7 days → JWT expired → Redirect to /login
```
Do not change any UI, routes, or styling — only verify/fix this session behavior.

---

## TASK 02 — Reaction System Bug Fix (😋 👍 🔥)
### Priority: HIGH | Status: BROKEN — "Failed to add reaction" error confirmed in doc

**Find the reaction endpoint** (likely `POST /api/recipes/:id/react` or similar).

**Required logic:**
```js
// Reaction schema on Recipe model — must support per-user, per-type tracking:
reactions: [{ userId: ObjectId, type: String }]  // type: "😋" | "👍" | "🔥"

// Toggle logic:
POST /api/recipes/:id/react   body: { type: "👍" }
  1. Find existing reaction by { recipeId, userId, type }
  2. If exists → remove it (toggle off), decrement count
  3. If not exists → add it (toggle on), increment count
  4. One user can only have ONE active reaction of a GIVEN type per recipe
     (but can have all three types active simultaneously if desired — confirm
     against existing UI behavior, do not change the UI, only fix the backend logic)
  5. Return updated reactionCounts: { "😋": n, "👍": n, "🔥": n }
```

**Debug the actual 500/400 error first:**
- Check if `userId` is being correctly extracted from the auth middleware (`req.user._id`).
- Check if the recipe `_id` param is being correctly cast to ObjectId before the query.
- Check if `reactionCounts` field exists on all 38 migrated recipes (if it's `undefined`
  on older documents, an increment operation on a non-existent field can throw).
- Add `reactionCounts: { 😋: 0, 👍: 0, 🔥: 0 }` as a schema default so it's never undefined.

**Frontend:** No UI changes. Only fix the API call / error handling so the existing
reaction buttons work without throwing the "Failed to add reaction" popup.

---

## TASK 03 — Saved Recipe Bug Fix
### Priority: HIGH | Status: BROKEN — "Failed to Update Saved Recipe" error confirmed in doc

**Find the save/unsave endpoint** (likely `POST /api/users/save-recipe/:recipeId` or similar).

**Required logic:**
```js
PUT /api/users/saved-recipes/:recipeId
  1. Find logged-in user (req.user._id)
  2. Check if recipeId already exists in user.savedRecipes[]
  3. If exists → $pull (remove) → "Removed from Saved Recipes"
  4. If not exists → $addToSet (add) → "Saved to Saved Recipes"
  5. Return updated savedRecipes array or a simple success boolean
```

**Debug the actual error:**
- Check that `user.savedRecipes` field exists as an array default (`[]`) in the User
  schema — if it's `undefined` on existing user documents, `$addToSet`/`$pull` can fail
  silently or the read before it can throw.
- Check that the recipe `_id` being sent from the frontend matches the format expected
  by the backend (Mongo ObjectId string vs legacyId — confirm which one Saved Recipes
  uses and make it consistent).
- Check for a duplicate or conflicting route definition that might be intercepting this
  request before it reaches the correct controller.

**Frontend:** No UI changes. Only fix the underlying API call so:
```
Recipe Card / Recipe Details
   → Click "Save Recipe" or "Add to Favourites"
   → Recipe _id stored in User.savedRecipes[]
   → Card UI immediately reflects "Saved" state
   → Recipe appears in /saved-recipes page
```

---

## TASK 04 — Add to Favourites = Like + Save Combined
### Priority: HIGH | Status: NEEDS IMPLEMENTATION

**Target element:**
```jsx
<button className="recipe-ghost-pill" onClick={addToShopping}>Add to Favorites</button>
```

**Required behavior — clicking this single button must perform BOTH actions atomically:**
```js
const handleAddToFavorites = async (recipeId) => {
  // 1. Save recipe (same logic as Task 03)
  // 2. Like recipe (same logic as the existing Like button, respecting one-like-per-user)
  // Both must succeed together. If either fails, show one combined error toast.
  // On success: button state reflects both "Saved" and "Liked" simultaneously.
};
```

Rename the handler from `addToShopping` to something accurate like `handleAddToFavorites`
only if doing so doesn't break any other reference — otherwise keep the existing function
name and just fix its internal logic. Do not change the button's className or visible text.

---

## TASK 05 — Remove Follow System Entirely → Replace with "View Profile"
### Priority: HIGH | Status: NEEDS IMPLEMENTATION (explicit removal + replacement)

**Search the entire codebase for and REMOVE:**
- Any "Follow" / "Unfollow" button component or logic.
- Any `followers` / `following` fields on the User schema (if present, leave the field
  in the schema only if removing it would break migration data — otherwise drop it,
  your call based on what's safest for existing data).
- Any Follow/Unfollow API routes or controllers.
- Any Followers/Following count display anywhere in the UI.

**Replace with — on the Chef Card inside `RecipeDetails.jsx`:**
```jsx
// OLD: <button onClick={handleFollow}>Follow</button>
// NEW:
<button onClick={() => navigate(`/profile/${recipe.createdBy.username}`)}>
  View Profile
</button>
```
Keep the exact same button styling/position the Follow button currently has — only
swap its label, click handler, and remove the follow-state logic.

**Workflow:**
```
RecipeDetails → Chef Card → "View Profile" → /profile/:username → Public Profile
```

---

## TASK 06 — Public Profile (`/profile/:username`) — Build + Fix Wrong Navigation Bug
### Priority: HIGH | Status: PARTIALLY BROKEN — confirmed bug: clicking a searched user opens `/myprofile` (the logged-in user's own profile) instead of the clicked user's profile

**Step A — Add `username` slug to User schema (if not already present):**
```js
username: { type: String, required: true, unique: true, lowercase: true, trim: true }
```
If usernames don't exist yet for seeded/migrated users, generate them from `name`
(lowercase, no spaces, e.g. "Noufa S Sajna" → "noufassajna") in a one-time migration
step, ensuring uniqueness (append a number suffix on collision).

**Step B — New backend route:**
```js
GET /api/users/profile/:username
  → User.findOne({ username: req.params.username })
  → Return PUBLIC-SAFE fields only:
     profileImage, name, username, bio, createdAt, location, favoriteCuisine
  → Plus computed stats (Task 07): recipesCount, sharedRecipesCount, totalViews,
    totalLikes, avgRating, latestRecipe
  → Strip password, email, savedRecipes, and any other private field
```

**Step C — New frontend route + component:**
```jsx
<Route path="/profile/:username" element={<PublicProfile />} />
```
Build `PublicProfile.jsx` reusing the exact same visual layout/styling already used by
the existing My Profile page (Image 1) — same card design, same info-row style — but:

**MUST show:** Profile Picture, Name, Bio, Member Since, Location, Favourite Cuisine,
Recipes count, Shared Recipes count, Total Views, Total Likes, AVG Rating, Latest Recipe,
"Recipes by [Name]" section below with the same RecipeCard grid component already used
on Home / My Recipes / Search Results (no new card design).

**MUST hide:** Edit Profile, Change Password, Dashboard, My Recipes button, Logout,
Back to Dashboard — any owner-only control.

**Step D — Fix the navigation bug:**
Find wherever Search currently navigates a clicked user result. It is incorrectly
hardcoded to `/myprofile` or pulling the logged-in user's ID instead of the clicked
result's username/ID. Fix it to:
```js
onClick={() => navigate(`/profile/${searchResultUser.username}`)}
```
Verify this also applies to the "View Profile" link inside RecipeDetails' chef card (Task 05).

**Step E — Recipes-by-chef section inside Public Profile:**
```js
GET /api/recipes?createdBy=:userId   // or by username, resolve to userId server-side
// Only return isDraft: false recipes — never show another user's drafts publicly.
```

---

## TASK 07 — Profile Statistics — Correct Formulas (My Profile + Public Profile)
### Priority: HIGH | Status: NEEDS VERIFICATION/FIX — Image 1 is missing several required stat fields

**Backend — single stats computation (reuse in both `/api/users/profile` (own) and
`/api/users/profile/:username` (public)):**

```js
// 1. Recipes = Published + Draft (own profile only; public profile counts public only
//    for the "Recipes" label, since drafts aren't visible to others — see note below)
const totalRecipes = await Recipe.countDocuments({ createdBy: userId });

// 2. Shared Recipes = Public only
const sharedRecipes = await Recipe.countDocuments({ createdBy: userId, isDraft: false });

// 3. Total Views = sum of views across all the user's recipes (creator's own views
//    must already be excluded at increment-time — verify the view-increment logic in
//    RecipeDetails' GET /api/recipes/:id does NOT increment when viewer === creator)
const viewsAgg = await Recipe.aggregate([
  { $match: { createdBy: userId } },
  { $group: { _id: null, total: { $sum: "$views" } } }
]);
const totalViews = viewsAgg[0]?.total || 0;

// 4. Total Likes = sum of likes across all the user's recipes
const likesAgg = await Recipe.aggregate([
  { $match: { createdBy: userId } },
  { $group: { _id: null, total: { $sum: "$likes" } } }
]);
const totalLikes = likesAgg[0]?.total || 0;

// 5. AVG Rating = Total Rating Stars Received ÷ Total Rating Count (across all recipes)
const ratingAgg = await Recipe.aggregate([
  { $match: { createdBy: userId, ratingCount: { $gt: 0 } } },
  { $group: { _id: null, stars: { $sum: { $multiply: ["$rating", "$ratingCount"] } },
              count: { $sum: "$ratingCount" } } }
]);
const avgRating = ratingAgg[0] ? (ratingAgg[0].stars / ratingAgg[0].count).toFixed(1) : null;
// Display "No Ratings Yet" or 0.0 if avgRating is null — match existing empty-state style.

// 6. Latest Recipe
const latestRecipe = await Recipe.findOne({ createdBy: userId }).sort({ createdAt: -1 });
// Display format: "Butter Chicken (Indian Cuisine)" — Title + Cuisine

// 7. Member Since = user.createdAt, formatted "MMM YYYY" e.g. "June 2026"
```

**On `/profile` (My Profile) — add the missing stat cards seen as absent in Image 1:**
Recipes, Shared Recipes, Total Views, Total Likes, AVG Rating, Bio.
Use the same visual card/row style already present for Member Since/Location/etc. —
just add the missing rows, don't redesign existing ones.

**Also add (if missing):** a "Change Password" button alongside the existing
Edit Profile / View My Recipes / Back to Dashboard / Logout buttons.

---

## TASK 08 — Search Result UI — Thumbnails + Correct Click Navigation
### Priority: MEDIUM | Status: NEEDS IMPLEMENTATION — current results are text-only

**Backend — `GET /api/search?q=keyword`** must already exist (per earlier migration work).
Confirm/add these exact response fields:

```js
// Recipes
{ title, description, imageUrl, recipeId (or legacyId), category }

// Users
{ fullName, username, profileImage, userId }
```

**Frontend — search dropdown result item styling (do not change overall dropdown
container styling, only add the thumbnail + structure inside each row):**

```jsx
// Recipe result row
<div className="search-result-row" onClick={() => navigate(`/recipe/${result.recipeId}`)}>
  <img src={result.imageUrl} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
  <div>
    <p className="result-title">{result.title}</p>
    <p className="result-desc">{result.description}</p>
    <span className="result-tag">Recipe</span>
  </div>
</div>

// User result row
<div className="search-result-row" onClick={() => navigate(`/profile/${result.username}`)}>
  <img src={result.profileImage || defaultAvatar} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
  <div>
    <p className="result-title">{result.fullName}</p>
    <p className="result-desc">@{result.username}</p>
    <span className="result-tag">User</span>
  </div>
</div>
```

**Responsive thumbnail sizing** (apply via existing responsive width pattern, not new CSS framework):
```
Desktop: 48px | Laptop: 44px | Tablet: 40px | Mobile: 36px
```

**Critical: User result navigation must use `/profile/${username}`, NOT `/myprofile`.**
This directly fixes the bug described in Task 06 Step D, from the search entry point.

---

## TASK 09 — Create Recipe — Full Validation Rules
### Priority: MEDIUM | Status: VERIFY against Image 4 → fix any missing validation

**Add/verify these exact validation rules in the Create Recipe form (frontend) AND
mirror them server-side in the `POST /api/recipes` controller (never trust client-only validation):**

| Field | Rule |
|---|---|
| Title | Required, 3–80 characters |
| Description | Required, 20–300 characters |
| Difficulty | Easy / Medium / Hard only |
| Categories | Min 1, Max 3 selected |
| Cuisine | Required, dropdown (Indian, Italian, Chinese, Arabian, Thai, Japanese, French, etc. — match existing dropdown options, don't redesign it) |
| Servings | Min 1, Max 10 |
| Cook Time | Min 5, Max 300 (minutes) |
| Image | PNG/JPG/JPEG/WEBP only, 100KB–5MB. Invalid → inline message "Image must be between 100KB and 5MB." (no popup/alert — inline text only) |
| Ingredients | Min 2, Max 25. Quantity field: numbers only, no letters. |
| Instructions/Steps | Min 2, Max 25. Remove (X) button only shows when count > minimum. |
| Tags | Optional, Max 5, no duplicates allowed |

**Image upload — two methods, both must work:**
```
Method 1: Click/drag-drop upload → Cloudinary folder "recipes/" → secure_url + public_id
Method 2: Paste Image URL → backend downloads it → uploads to Cloudinary →
          same secure_url + public_id flow → store identically to Method 1
```
Both methods must result in the same `imageUrl` + `imagePublicId` fields on the Recipe document.

**Featured Recipe checkbox:**
```js
// Only ONE featured recipe allowed per user at a time.
// When a recipe is marked featured:
await Recipe.updateMany(
  { createdBy: userId, _id: { $ne: thisRecipeId }, isFeatured: true },
  { $set: { isFeatured: false } }
);
// Then set isFeatured: true on the current recipe.
// Featured recipe shows FIRST in both My Profile and Public Profile recipe grids.
```

**Visibility (Draft vs Public):**
```js
isDraft: true  → visible to creator only; hidden from Home, Search, Public Profile, Recipes page
isDraft: false → visible everywhere
```

**Bottom buttons — confirm exact behavior:**
```
Cancel        → discard changes, no DB write, return to previous state
Save Draft    → isDraft: true, validates minimum required fields only, visible only to creator
Save Changes  → (edit mode only) updates fields, visibility stays unchanged
Publish       → isDraft: false, full validation required, visible globally
Preview       → renders the form data through the actual RecipeDetails layout
                read-only, makes ZERO database writes, "Edit Again" returns to the form
```

---

## TASK 10 — My Recipes Page — Copy Recipe Workflow
### Priority: MEDIUM | Status: VERIFY button exists (Image 6 shows "Copy") → implement logic if missing

```js
POST /api/recipes/:id/copy
  1. Find original recipe by :id
  2. Create new document:
     title: `${original.title} (Copy)`
     ingredients, steps, tags, image: copied as-is (same imageUrl/imagePublicId —
       do not re-upload to Cloudinary, just reference the same image)
     createdBy: req.user._id  (current logged-in user, even if copying someone else's recipe)
     legacyId: undefined (new copies never get a legacyId)
     isDraft: true  (copies start as drafts by default — confirm this matches intended UX)
     New _id, new createdAt
  3. Return the new recipe, redirect to /edit-recipe/:newId or /my-recipes
```

---

## TASK 11 — Delete Protection — Confirmation Dialog (All Delete Actions)
### Priority: MEDIUM | Status: VERIFY exists for Recipe delete → ensure same pattern everywhere

**Required pattern for EVERY delete action in the app (recipe delete from My Recipes,
Dashboard widget, etc.):**
```
Click Delete
  → Modal: "Delete Recipe? This action cannot be undone."
  → [Cancel] [Delete Permanently]
  → Cancel → nothing happens
  → Delete Permanently →
      1. If recipe has imagePublicId → cloudinary.uploader.destroy(imagePublicId)
      2. Recipe.findByIdAndDelete(id)
      3. Removed from: Search index, Public Profile, My Recipes, Dashboard, Home Feed
      4. Create activity record (Task 14): "You deleted '{title}'."
```
Use the project's existing modal/dialog component if one already exists — do not
build a new modal system, do not change its visual style.

---

## TASK 12 — Dashboard Recipe Card Buttons — Match My Recipes Page
### Priority: MEDIUM | Status: CONFIRMED INCONSISTENCY (Image 2 vs Image 6)

The Dashboard's "My Recipes" widget (Image 2) currently shows only **View / Edit / Delete**.
The actual My Recipes page (Image 6) correctly shows **View / Edit / Draft / Copy / Delete**.

**Fix:** Make the Dashboard widget's recipe card use the exact same button row/logic as
My Recipes — reuse the same RecipeCard (or RecipeManageCard) component if one already
exists for My Recipes, rather than duplicating button logic in two places. Do not
change the visual card style, image, or grid layout of the Dashboard widget — only
bring its button set up to parity.

**Draft/Publish toggle button label logic (apply consistently everywhere):**
```js
recipe.isDraft === true  → show "Publish" button → sets isDraft: false
recipe.isDraft === false → show "Draft" button   → sets isDraft: true
```

---

## TASK 13 — Dashboard Single Aggregated API Endpoint
### Priority: MEDIUM | Status: VERIFY a single `GET /api/dashboard` exists; consolidate if multiple separate calls are currently being made

**Required single response shape:**
```js
GET /api/dashboard
{
  user: { name, profileImage, bio, ... },
  stats: { totalRecipes, totalLikes, totalViews, avgRating },
  performanceHighlights: { mostViewed, mostLiked },  // null/empty-state if no data
  topRecipes: { byViews: [...], byLikes: [...] },     // excludes 0-value entries
  myRecipes: [...],       // newest first, published + draft
  savedRecipes: [...],
  recentActivities: [...] // newest first, max 15-20 items
}
```
If the frontend currently makes 4-5 separate API calls to build the Dashboard, consolidate
the backend to gather all of this in one controller and return it as one JSON response —
update the frontend Dashboard component to consume this single endpoint instead. This is
a backend + data-fetching change only; the rendered UI/layout must look identical.

**Performance Highlights logic:**
```js
// Most Viewed: published recipes only, sort views DESC, tie → newest createdAt wins.
//   If all recipes have 0 views → "No Recipe Data Yet."
// Most Liked: same pattern using likes DESC.
```

**Top Recipes logic:**
```js
// Sort by Views: published only, EXCLUDE 0-view recipes, sort DESC.
//   If none qualify → "No Views Data Yet."
// Sort by Likes: same pattern, exclude 0-like recipes.
//   If none qualify → "No Likes Data Yet."
```

---

## TASK 14 — Recent Activity System
### Priority: MEDIUM | Status: NEEDS IMPLEMENTATION (new collection)

**New MongoDB collection: `activities`**
```js
{
  userId: ObjectId,
  type: String,       // "CREATE_RECIPE" | "EDIT_RECIPE" | "DELETE_RECIPE" | "LIKE_RECIPE" |
                       // "SAVE_RECIPE" | "RATE_RECIPE" | "REVIEW_RECIPE" | "UPDATE_PROFILE" |
                       // "SHARE_RECIPE" | "PUBLISH_RECIPE" | "DRAFT_RECIPE"
  message: String,     // pre-built human-readable text, e.g. "You created \"Mojito\"."
  recipeId: ObjectId,  // optional, only when relevant
  recipeTitle: String, // optional
  createdAt: Date,
  expiresAt: Date,      // createdAt + 30 days
}
```

**TTL index (automatic 30-day cleanup, zero manual cleanup needed):**
```js
ActivitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**Create an activity record automatically on these actions (hook into the existing
controllers for each — do not create a new trigger system, just call a shared
`createActivity()` helper at the end of each successful action):**

```
Create recipe        → "You created '{title}'."
Edit/update recipe    → "You updated '{title}'."
Delete recipe         → "You deleted '{title}'."
Save as draft         → "You saved '{title}' as Draft."
Publish draft          → "You published '{title}'."
Like a recipe          → "You liked Chef {creatorName}'s '{title}'."
Rate a recipe           → "You rated '{title}' {stars}★."
Write a review           → "You reviewed '{title}'."
Update profile             → "You updated your profile."
Share a recipe (copy link)  → "You copied the recipe link."
```

**Do NOT log:** search queries, page refreshes, navbar clicks, scrolling, opening menus,
typing in forms, hover effects — keep the feed meaningful, not noisy.

**API:**
```js
GET /api/activity
  → Activity.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20)
  → Only the logged-in user's own activities, never another user's.
```

**Dashboard UI — Recent Activity widget:**
Show icon + message + relative time ("2 hours ago", "Yesterday", "3 days ago").
Reuse existing relative-time formatting utility if the project already has one
(e.g. from a date library already in use) rather than adding a new dependency.

Activity icon map:
```
🍳 Create  ✏️ Edit  🗑️ Delete  🌍 Publish  📝 Draft  ❤️ Save  👍 Like
⭐ Rating  💬 Review  👤 Profile  📤 Share
```

---

## VERIFICATION CHECKLIST (run after implementing all tasks)

```
[ ] Login → close browser → reopen → still logged in (within 7 days)
[ ] After manually expiring/mocking token age past 7d → redirected to /login
[ ] Click 😋 / 👍 / 🔥 on a recipe → count increments, no error popup, toggle works
[ ] Click Save Recipe → no "Failed to Update Saved Recipe" error → appears in /saved-recipes
[ ] Click "Add to Favorites" → recipe is BOTH liked AND saved in one click
[ ] No "Follow" button exists anywhere in the project
[ ] Chef Card → "View Profile" → opens /profile/:username correctly
[ ] Search a user → click result → opens THAT user's public profile, not /myprofile
[ ] Public profile shows NO Edit/Dashboard/Logout/My Recipes owner controls
[ ] My Profile (/profile) shows Recipes, Shared Recipes, Views, Likes, AVG Rating, Bio
[ ] Search results show thumbnails for both recipes and users, correctly sized
[ ] Create Recipe form rejects title <3 or >80 chars, description <20 or >300 chars
[ ] Create Recipe form rejects <2 or >25 ingredients/steps, >5 tags, duplicate tags
[ ] Image upload rejects files <100KB or >5MB with inline message (no popup)
[ ] Only one Featured Recipe can be active per user at a time
[ ] Copy Recipe creates a new document owned by the current user
[ ] Delete shows confirmation dialog before removing anything
[ ] Dashboard recipe cards now show View/Edit/Draft/Copy/Delete (same as My Recipes)
[ ] Dashboard loads from a single GET /api/dashboard call
[ ] Recent Activity logs the 10 listed action types, excludes noise actions
[ ] Activities older than 30 days are automatically gone (TTL index working)
[ ] Zero visual/styling differences anywhere compared to before these changes
```
