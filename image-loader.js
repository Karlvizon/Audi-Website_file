/* Image loader: edit IMAGE_DIRECTORY and PAGE_IMAGES below. Paths are relative to index.html. */
(() => {
  "use strict";

  /* Change this one directory to the folder containing your images. */
  const IMAGE_DIRECTORY = "assets-optimized/";

  /* Filenames per slot. Empty strings ("") keep the placeholder. */
  const PAGE_IMAGES = {
    hero: "HERO.webp",
    discoverBackground: "Background.webp",
    discoverHatchbacks: "Audi Hatchbacks.webp",
    discoverSedans: "Audi Sedans.png",
    discoverSuvs: "Audi SUVs.webp",
    discoverElectric: "Audi Electric.webp",
    expertise: "1.webp",
    warranty: "2.webp",
    inspection: "3.webp",
    roadside: "4.webp",
    historyReport: "5.webp",
    findYourMatch: "6.webp",
    additionalResources: "7.webp",
    lineupHatchbacks: "hatchbacks.webp",
    lineupSedans: "Sedans.webp",
    lineupSuvs: "SUV.webp",
    lineupElectric: "Electric.webp"
  };

  /* ---- Loader (no need to edit below) ---- */
  const directory = IMAGE_DIRECTORY && !IMAGE_DIRECTORY.endsWith("/") ? IMAGE_DIRECTORY + "/" : IMAGE_DIRECTORY;
  /* Encode each path segment so spaces and special characters in filenames are safe inside url("..."). */
  const toUrl = (filename) => directory + filename.split("/").map(encodeURIComponent).join("/");
  const slots = [...document.querySelectorAll("[data-image-key]")];

  function loadSlot(slot) {
    if (slot.dataset.imageStatus) return;              /* already started */
    const key = slot.dataset.imageKey;
    const filename = PAGE_IMAGES[key];
    if (!filename) {
      slot.dataset.imageStatus = "placeholder";
      return;
    }
    slot.dataset.imageStatus = "loading";
    const url = toUrl(filename);
    const probe = new Image();
    probe.decoding = "async";
    if (key === "hero") probe.fetchPriority = "high";  /* the hero is the first thing people see */
    probe.onload = () => {
      slot.style.backgroundImage = `url("${url}")`;
      slot.classList.add("placeholder--has-image");   /* sizing/crop + label hiding live in CSS */
      slot.dataset.imageStatus = "loaded";
    };
    probe.onerror = () => {
      slot.dataset.imageStatus = "missing";
      console.warn(`[image loader] "${key}": could not load "${url}". Check the filename, capitalisation and IMAGE_DIRECTORY. Placeholder kept.`);
    };
    probe.src = url;
  }

  /* Images load per page section, about one screen before the section scrolls into view, instead of all at once.
     (Large photos below the fold no longer delay the first screen.) Browsers without IntersectionObserver load everything. */
  const sections = new Map();
  slots.forEach((slot) => {
    const section = slot.closest("header, section") || document.body;
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push(slot);
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        sections.get(entry.target).forEach(loadSlot);
      });
    }, { rootMargin: "100% 0px" });
    sections.forEach((_, section) => observer.observe(section));
  } else {
    slots.forEach(loadSlot);
  }

  /* Typos in PAGE_IMAGES keys would otherwise fail silently. */
  const slotKeys = new Set(slots.map((slot) => slot.dataset.imageKey));
  Object.keys(PAGE_IMAGES).forEach((key) => {
    if (!slotKeys.has(key)) console.warn(`[image loader] PAGE_IMAGES key "${key}" matches no slot (data-image-key) on this page.`);
  });
})();
