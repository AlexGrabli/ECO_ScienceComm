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
  if (config.leader?.name) document.getElementById("leader-name").textContent = config.leader.name;
  if (config.leader?.position) document.getElementById("leader-position").textContent = config.leader.position;
  const students = Array.isArray(config.students) ? config.students.filter(student => student?.name) : [];
  if (students.length) {
    const list = document.getElementById("student-list");
    list.replaceChildren();
    students.forEach(student => {
      const member = document.createElement("div");
      member.className = "student-member";
      const name = document.createElement("h3");
      name.textContent = student.name;
      const role = document.createElement("p");
      role.textContent = student.role || "Участник актива СНО";
      member.append(name, role);
      list.append(member);
    });
  }
  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
  const formatDate = value => new Intl.DateTimeFormat("ru-RU", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}).format(new Date(`${value}T12:00:00Z`));
  function renderPublications(items, containerId, external) {
    const publications = Array.isArray(items) ? items.filter(item => item?.title && item.source && /^https?:/.test(safeUrl(item.url) || "") && validDate(item.date)) : [];
    if (!publications.length) return;
    publications.sort((a, b) => external ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    const container = document.getElementById(containerId);
    container.replaceChildren();
    publications.forEach(item => {
      const article = document.createElement("article");
      article.className = "publication";
      const meta = document.createElement("p");
      meta.className = "publication-meta";
      const time = document.createElement("time");
      time.dateTime = item.date;
      time.textContent = `${external ? "Начало: " : "Опубликовано: "}${formatDate(item.date)}`;
      if (external && validDate(item.endDate) && item.endDate >= item.date) {
        time.textContent = `Даты: ${formatDate(item.date)} — ${formatDate(item.endDate)}`;
      }
      meta.append(time);
      if (external && item.type) meta.append(document.createTextNode(` · ${item.type}`));
      const title = document.createElement("h3");
      const titleLink = document.createElement("a");
      titleLink.href = safeUrl(item.url);
      titleLink.textContent = item.title;
      title.append(titleLink);
      article.append(meta, title);
      if (external && item.location) {
        const location = document.createElement("p");
        location.className = "publication-location";
        location.textContent = item.location;
        article.append(location);
      }
      if (item.summary) {
        const description = document.createElement("p");
        description.textContent = item.summary;
        article.append(description);
      }
      if (external && validDate(item.deadline)) {
        const deadline = document.createElement("p");
        deadline.className = "publication-deadline";
        deadline.textContent = `Заявки до ${formatDate(item.deadline)}`;
        article.append(deadline);
      } else if (external && item.deadlineNote) {
        const note = document.createElement("p");
        note.className = "publication-deadline-note";
        note.textContent = item.deadlineNote;
        article.append(note);
      }
      const source = document.createElement("a");
      source.className = "text-link publication-source";
      source.href = safeUrl(item.url);
      source.textContent = `${external ? "Организатор" : "Источник"}: ${item.source} ↗`;
      article.append(source);
      container.append(article);
    });
  }
  renderPublications(config.news, "news-list", false);
  renderPublications(config.opportunities, "opportunity-list", true);
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
