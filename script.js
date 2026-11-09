"use strict";
(() => {
  const config = window.SNO_CONFIG || {};
  const safeUrl = value => {
    try {
      const url = new URL(value);
      return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  if (config.institution) document.getElementById("institution").textContent = config.institution;
  const contactUrl = safeUrl(config.contactUrl);
  if (contactUrl) {
    const container = document.getElementById("join-contact");
    const link = document.createElement("a");
    link.className = "button light";
    link.href = contactUrl;
    link.textContent = `${config.contactLabel || "Написать организаторам"} ↗`;
    container.replaceChildren(link);
  }
  const events = Array.isArray(config.events) ? config.events : [];
  const validEvents = events.filter(event => {
    if (!event || !event.title || !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return false;
    const parsed = new Date(`${event.date}T12:00:00`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === event.date;
  }).sort((a, b) => a.date.localeCompare(b.date));
  if (validEvents.length) {
    const list = document.getElementById("event-list");
    list.replaceChildren();
    validEvents.forEach(event => {
      const row = document.createElement("article");
      row.className = "event-row";
      const time = document.createElement("time");
      time.dateTime = event.date;
      time.textContent = new Intl.DateTimeFormat("ru-RU", {day: "numeric", month: "long", year: "numeric"}).format(new Date(`${event.date}T12:00:00`));
      const info = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = event.title;
      const location = document.createElement("p");
      location.textContent = event.location || "Место уточняется";
      info.append(title, location);
      row.append(time, info);
      const href = safeUrl(event.url);
      if (href) {
        const link = document.createElement("a");
        link.className = "text-link";
        link.href = href;
        link.textContent = "Подробнее ↗";
        link.setAttribute("aria-label", `Подробнее: ${event.title}`);
        row.append(link);
      }
      list.append(row);
    });
  }
  function openGuide() {
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target instanceof HTMLDetailsElement) target.open = true;
  }
  window.addEventListener("hashchange", openGuide);
  openGuide();
})();
