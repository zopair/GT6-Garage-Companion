const clean = (value) => String(value ?? "").trim();
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createGarageState() {
  return { cars: [], races: [], setups: [] };
}

export function addCar(state, input) {
  const make = clean(input.make);
  const model = clean(input.model);
  if (!make || !model) throw new Error("Car make and model are required.");
  const car = {
    id: makeId(),
    make,
    model,
    year: clean(input.year),
    pp: clean(input.pp),
    power: clean(input.power),
    weight: clean(input.weight),
    createdAt: new Date().toISOString()
  };
  return { ...state, cars: [...state.cars, car] };
}

export function addRace(state, input) {
  const event = clean(input.event);
  const track = clean(input.track);
  const position = Number(input.position);
  if (!event || !track) throw new Error("Race event and track are required.");
  if (!Number.isInteger(position) || position < 1) throw new Error("Race position must be a positive whole number.");
  const bestLap = input.bestLap === "" || input.bestLap == null ? null : Number(input.bestLap);
  if (bestLap !== null && (!Number.isFinite(bestLap) || bestLap <= 0)) throw new Error("Best lap must be a positive number.");
  const race = { id: makeId(), event, track, position, bestLap, date: clean(input.date) || new Date().toISOString().slice(0, 10) };
  return { ...state, races: [race, ...state.races] };
}

export function addSetup(state, input) {
  const carId = clean(input.carId);
  const name = clean(input.name);
  if (!carId) throw new Error("A car reference is required for each setup.");
  if (!name) throw new Error("Setup name is required.");
  const setup = { id: makeId(), carId, name, notes: clean(input.notes), createdAt: new Date().toISOString() };
  return { ...state, setups: [setup, ...state.setups] };
}
