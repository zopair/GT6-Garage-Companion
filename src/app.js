import { addCar, addRace, addSetup, createGarageState } from "./garage.js";

const STORAGE_KEY = "gt6-garage-companion-v1";
const $ = (selector) => document.querySelector(selector);
const loadState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.cars) && Array.isArray(saved.races) && Array.isArray(saved.setups)) return saved;
  } catch { /* Recover with a clean local state when stored data is invalid. */ }
  return createGarageState();
};
let state = loadState();
let activeTab = "cars";

const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const formatCount = (value) => String(value).padStart(2, "0");
const carName = (id) => {
  const car = state.cars.find((item) => item.id === id);
  return car ? `${car.make} ${car.model}` : "Unlinked vehicle";
};

function renderStats() {
  $("#car-count").textContent = formatCount(state.cars.length);
  $("#race-count").textContent = formatCount(state.races.length);
  $("#setup-count").textContent = formatCount(state.setups.length);
  const times = state.races.map((race) => race.bestLap).filter((time) => Number.isFinite(time) && time > 0);
  $("#best-lap").textContent = times.length ? Math.min(...times).toFixed(2) : "—";
}

function renderRecords() {
  const config = {
    cars: { kicker: "YOUR LINEUP", title: "CAR COLLECTION", index: "01", empty: "NO CARS IN THE GARAGE", hint: "Add your first vehicle using the form." },
    races: { kicker: "EVERY LAP COUNTS", title: "RACE LOG", index: "02", empty: "NO RACES RECORDED", hint: "Record an event to start tracking progress." },
    setups: { kicker: "FIND YOUR EDGE", title: "SETUP NOTEBOOK", index: "03", empty: "NO SETUPS SAVED", hint: "Save a setup note and build your tuning history." }
  }[activeTab];
  $("#panel-kicker").textContent = config.kicker;
  $("#panel-title").textContent = config.title;
  $("#panel-index").textContent = config.index;
  const records = state[activeTab];
  if (!records.length) {
    $("#records").innerHTML = `<div class="empty-state"><strong>${config.empty}</strong>${config.hint}</div>`;
    return;
  }
  $("#records").innerHTML = records.map((item) => {
    if (activeTab === "cars") return `<article class="record"><div><div class="record-title">${escapeHTML(item.make)} ${escapeHTML(item.model)}</div><div class="record-sub">${escapeHTML([item.year, item.power && item.power + " HP", item.weight && item.weight + " KG"].filter(Boolean).join(" · ") || "SPECIFICATIONS NOT ENTERED")}</div></div><div class="record-tag">${escapeHTML(item.pp ? "PP " + item.pp : "GARAGE")}</div></article>`;
    if (activeTab === "races") return `<article class="record"><div><div class="record-title">${escapeHTML(item.event)}</div><div class="record-sub">${escapeHTML(item.track)} · ${escapeHTML(item.date)}</div></div><div class="record-tag">${escapeHTML("#" + item.position)}<br>${item.bestLap ? escapeHTML(item.bestLap.toFixed(2) + " SEC") : "NO LAP"}</div></article>`;
    return `<article class="record"><div><div class="record-title">${escapeHTML(item.name)}</div><div class="record-sub">${escapeHTML(carName(item.carId))} · ${escapeHTML(new Date(item.createdAt).toLocaleDateString())}</div></div><div class="record-tag">SETUP FILE</div></article>`;
  }).join("");
}

function field(label, name, placeholder, type = "text", required = false) {
  return `<div class="field"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" placeholder="${placeholder}" ${required ? "required" : ""}></div>`;
}

function renderForm() {
  const forms = {
    cars: {
      kicker: "ADD TO THE LINEUP", title: "NEW VEHICLE",
      html: field("MANUFACTURER", "make", "e.g. Nissan", "text", true) + field("MODEL", "model", "e.g. GT-R Premium", "text", true) + field("MODEL YEAR", "year", "e.g. 2015", "number") + field("PERFORMANCE POINTS", "pp", "e.g. 550", "number") + field("POWER · HP", "power", "e.g. 545", "number") + field("WEIGHT · KG", "weight", "e.g. 1740", "number")
    },
    races: {
      kicker: "LOG YOUR RESULT", title: "NEW RACE",
      html: field("EVENT NAME", "event", "e.g. Sunday Cup", "text", true) + field("TRACK", "track", "e.g. Trial Mountain", "text", true) + field("FINISH POSITION", "position", "1", "number", true) + field("BEST LAP · SECONDS", "bestLap", "e.g. 102.450", "number") + field("RACE DATE", "date", "", "date")
    },
    setups: {
      kicker: "DOCUMENT YOUR TUNING", title: "SAVE SETUP",
      html: `<div class="field"><label for="field-carId">VEHICLE</label><select id="field-carId" name="carId" required><option value="">Choose a car</option>${state.cars.map((car) => `<option value="${escapeHTML(car.id)}">${escapeHTML(car.make)} ${escapeHTML(car.model)}</option>`).join("")}</select></div>` + field("SETUP NAME", "name", "e.g. Trial Mountain baseline", "text", true) + `<div class="field"><label for="field-notes">TUNING NOTES</label><textarea id="field-notes" name="notes" placeholder="Suspension, gearing, aero, driving notes..."></textarea></div>`
    }
  }[activeTab];
  $("#form-kicker").textContent = forms.kicker;
  $("#form-title").textContent = forms.title;
  $("#form-message").textContent = "";
  $("#record-form").innerHTML = forms.html + '<button class="button button-primary form-submit" type="submit">SAVE RECORD <span>↗</span></button>';
}

function render() {
  renderStats();
  renderRecords();
  renderForm();
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === activeTab));
}

document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
  activeTab = button.dataset.tab;
  render();
}));

$("#record-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    if (activeTab === "cars") state = addCar(state, values);
    if (activeTab === "races") state = addRace(state, values);
    if (activeTab === "setups") state = addSetup(state, values);
    persist();
    render();
    $("#form-message").textContent = "RECORD SAVED ON THIS DEVICE.";
  } catch (error) {
    $("#form-message").textContent = error.message;
  }
});

$("#export-data").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), ...state }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "gt6-garage-backup.json";
  anchor.click();
  URL.revokeObjectURL(url);
});

$("#import-data").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !Array.isArray(parsed.cars) || !Array.isArray(parsed.races) || !Array.isArray(parsed.setups)) throw new Error("Backup format is not recognized.");
    state = { cars: parsed.cars, races: parsed.races, setups: parsed.setups };
    persist();
    render();
    $("#form-message").textContent = "BACKUP RESTORED SUCCESSFULLY.";
  } catch (error) {
    $("#form-message").textContent = error.message || "Could not read this backup.";
  } finally {
    event.target.value = "";
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

render();
