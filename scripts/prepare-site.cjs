// Обновляет карточки конференций и проектов в HTML и версии CSS/JS перед публикацией.
// Запуск из любой папки: node scripts/prepare-site.cjs
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "site-config.js"), "utf8"), context);
const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
const formatDate = value => new Intl.DateTimeFormat("ru-RU", {day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T12:00:00Z`));
const items = context.window.SNO_CONFIG.opportunities || [];
const cards = items.map(item => {
  if (!item.title || !item.source || !validDate(item.date) || !/^https?:$/.test(new URL(item.url).protocol)) throw new Error("Проверьте данные конференции: " + item.title);
  return item;
}).sort((a, b) => a.date.localeCompare(b.date)).map(item => {
  const range = validDate(item.endDate) && item.endDate >= item.date;
  const dates = range ? `Даты: ${formatDate(item.date)} — ${formatDate(item.endDate)}` : `Начало: ${formatDate(item.date)}`;
  return `<article class="publication">
        <p class="publication-meta"><time datetime="${escape(item.date)}">${escape(dates)}</time>${item.type ? ` · ${escape(item.type)}` : ""}</p>
        <h3><a href="${escape(item.url)}">${escape(item.title)}</a></h3>
        ${item.location ? `<p class="publication-location">${escape(item.location)}</p>` : ""}
        ${item.summary ? `<p>${escape(item.summary)}</p>` : ""}
        ${validDate(item.deadline) ? `<p class="publication-deadline">Заявки до ${escape(formatDate(item.deadline))}</p>` : item.deadlineNote ? `<p class="publication-deadline-note">${escape(item.deadlineNote)}</p>` : ""}
        <a class="text-link publication-source" href="${escape(item.url)}">Организатор: ${escape(item.source)} ↗</a>
      </article>`;
}).join("\n      ");
const file = path.join(root, "index.html");
let html = fs.readFileSync(file, "utf8");
const marker = /<!-- opportunities:start -->[\s\S]*?<!-- opportunities:end -->/;
if (!marker.test(html)) throw new Error("Не найдены границы карточек в index.html");
html = html.replace(marker, `<!-- opportunities:start -->\n      ${cards || '<p class="section-intro">Новые объявления скоро появятся.</p>'}\n      <!-- opportunities:end -->`);
const projects = context.window.SNO_CONFIG.projects || [];
const projectCards = projects.map(project => {
  if (!project.title || !project.summary || !project.supervisor || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(project.email)) throw new Error("Проверьте название, описание, руководителя и почту проекта: " + project.title);
  const fields = [["Руководитель", project.supervisor], ["Для кого", project.audience], ["Результат", project.outcome], ["Сроки и формат", project.duration], ["Участники", project.places]];
  const contact = `mailto:${project.email}?subject=${encodeURIComponent("Участие в проекте СНО: " + project.title)}`;
  return `<article class="project-card"><p class="eyebrow">ПРОЕКТ СНО</p><h3>${escape(project.title)}</h3><p>${escape(project.summary)}</p><dl>${fields.filter(([,value]) => value).map(([label,value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join("")}</dl><a class="text-link" href="${escape(contact)}">Обсудить участие ↗</a></article>`;
}).join("\n      ");
const projectMarker = /<!-- projects:start -->[\s\S]*?<!-- projects:end -->/;
if (!projectMarker.test(html)) throw new Error("Не найдены границы проектов в index.html");
const emptyProjects = '<div class="section-empty"><span class="empty-mark" aria-hidden="true">↗</span><div><h3>Собираем первые предложения</h3><p>Здесь появятся проекты преподавателей с задачами, условиями участия и контактами руководителей. Можно предложить собственную идею руководителю СНО.</p></div></div>';
html = html.replace(projectMarker, `<!-- projects:start -->\n      ${projectCards || emptyProjects}\n      <!-- projects:end -->`);
const submissionBody = "Название проекта:\n\nКраткое описание:\n\nЗадачи студента:\n\nОжидаемый результат:\n\nРуководитель (ФИО, должность):\n\nКонтакты руководителя:\n\nДля кого (курс, навыки, опыт):\n\nСроки и формат работы:\n\nЧисло участников:\n\nЧему готовы обучить:\n";
const submissionUrl = `mailto:alexandrov_na@rgau-msha.ru?subject=${encodeURIComponent("Проект для студентов СНО")}&body=${encodeURIComponent(submissionBody)}`;
html = html.replace(/(id="project-submit-link" href=")[^"]*"/, `$1${escape(submissionUrl)}"`);
for (const name of ["styles.css", "site-config.js", "script.js"]) {
  const hash = createHash("sha256").update(fs.readFileSync(path.join(root, name))).digest("hex").slice(0, 12);
  const pattern = new RegExp(`((?:src|href)="\\./${name.replaceAll(".", "\\.")})(?:\\?v=[^"\\s]*)?"`, "g");
  html = html.replace(pattern, `$1?v=${hash}"`);
}
fs.writeFileSync(file, html, "utf8");
console.log(`Prepared ${items.length} conference cards, ${projects.length} projects and CSS/JS versions.`);
