// sectionBus.js
// Tiny pub/sub used to connect the Skills section to the other sections
// (Projects, Experience, Education, Certificates) without prop-drilling.
//
// When a skill is clicked and matched to an item somewhere on the page,
// Skills calls `navigateToItem(...)`. The matching section (identified by
// `section`) is subscribed via `onNavigateToItem(...)` and reacts by
// expanding the right category, opening that item's modal, and scrolling
// itself into view.

export const SECTION_NAV_EVENT = "section-nav-open";

// section: "projects" | "experience" | "education" | "certificates"
// categoryId: the id of the category the item lives in (for expanding it)
// itemId: the id of the specific item whose modal should open
export function navigateToItem({ section, categoryId, itemId }) {
  window.dispatchEvent(
    new CustomEvent(SECTION_NAV_EVENT, { detail: { section, categoryId, itemId } })
  );
}

// Subscribe a section to navigation events meant for it.
// Returns an unsubscribe function — call it from a useEffect cleanup.
export function onNavigateToItem(section, handler) {
  const listener = (e) => {
    if (e.detail?.section === section) handler(e.detail);
  };
  window.addEventListener(SECTION_NAV_EVENT, listener);
  return () => window.removeEventListener(SECTION_NAV_EVENT, listener);
}