/* Page script: blurred side copies, card strip (centring, arrows, drag) and tablet/phone auto-scroll. */
(() => {
  "use strict";

  /* ---- 1) Blurred side copies ---- */
  document.querySelectorAll("[data-mirror-of]").forEach((mirror) => {
    const slot = document.querySelector(`[data-image-key="${mirror.dataset.mirrorOf}"]`);
    if (!slot) return;
    const sync = () => {
      if (!slot.classList.contains("placeholder--has-image")) return;
      mirror.style.backgroundImage = slot.style.backgroundImage;
      mirror.classList.add("is-ready");
    };
    if ("MutationObserver" in window) new MutationObserver(sync).observe(slot, { attributes: true, attributeFilter: ["class", "style"] });
    sync();
  });

  /* ---- 2) Card strip ---- */
  const root = document.querySelector("[data-carousel]");
  if (!root) return;
  const scroller = root.querySelector(".carousel__scroller");
  const cards = [...root.querySelectorAll(".card")];
  const prev = root.querySelector(".carousel__arrow--prev");
  const next = root.querySelector(".carousel__arrow--next");
  const small = window.matchMedia("(max-width: 1099px)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const AUTOPLAY_MS = 4500;

  let interacted = false;   /* once true: no more re-centring and no more auto-scroll */
  let inView = true;

  const maxScroll = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);
  const smooth = () => (reduce.matches ? "auto" : "smooth");
  const pitch = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : scroller.clientWidth * 0.8);

  function update() {
    const max = maxScroll();
    root.toggleAttribute("data-fits", max <= 1);
    prev.disabled = scroller.scrollLeft <= 1;
    next.disabled = scroller.scrollLeft >= max - 1;
  }

  /* Desktop: start centred, as in the PDF. Tablet/phone: start at the first card. */
  function layout() {
    if (!interacted) scroller.scrollLeft = small.matches ? 0 : maxScroll() / 2;
    update();
  }

  scroller.addEventListener("scroll", update, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(scroller);
  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);
  small.addEventListener("change", layout);
  layout();

  /* Arrows */
  prev.addEventListener("click", () => { interacted = true; scroller.scrollBy({ left: -pitch(), behavior: smooth() }); });
  next.addEventListener("click", () => { interacted = true; scroller.scrollBy({ left: pitch(), behavior: smooth() }); });

  /* Any user interaction stops auto-scroll for good (and stops re-centring on resize) */
  const touch = () => { interacted = true; };
  scroller.addEventListener("touchstart", touch, { passive: true });
  scroller.addEventListener("pointerdown", touch);
  scroller.addEventListener("keydown", touch);
  scroller.addEventListener("wheel", (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) interacted = true; }, { passive: true });

  /* Mouse drag (touch uses native swiping) */
  let drag = null;
  let justDragged = false;
  scroller.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || maxScroll() <= 1) return;
    drag = { x: e.clientX, left: scroller.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 5) return;
      drag.moved = true;
      scroller.classList.add("is-dragging");
    }
    scroller.scrollLeft = drag.left - dx;
  });
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) { justDragged = true; setTimeout(() => { justDragged = false; }, 0); }
    scroller.classList.remove("is-dragging");
    drag = null;
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  scroller.addEventListener("click", (e) => { if (justDragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  scroller.addEventListener("dragstart", (e) => e.preventDefault());

  /* Tablet/phone auto-scroll: one card every 4.5s, looping */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { inView = entries[entries.length - 1].isIntersecting; }, { threshold: 0.25 }).observe(root);
  }
  setInterval(() => {
    if (interacted || !small.matches || reduce.matches || document.hidden || !inView) return;
    if (root.matches(":hover") || root.matches(":focus-within")) return;
    const gutter = parseFloat(getComputedStyle(scroller).scrollPaddingLeft) || 0;
    const max = maxScroll();
    const cur = scroller.scrollLeft;
    if (max <= 1) return;
    /* Visual (skewed) left edge, because that is the edge scroll-snap aligns */
    const edge = scroller.getBoundingClientRect().left;
    let to = cards.map((c) => cur + c.getBoundingClientRect().left - edge - gutter).find((t) => t > cur + 4);
    to = (to === undefined || cur >= max - 4) ? 0 : Math.min(to, max);
    scroller.scrollTo({ left: to, behavior: "smooth" });
  }, AUTOPLAY_MS);
})();
