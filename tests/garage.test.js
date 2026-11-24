import test from "node:test";
import assert from "node:assert/strict";
import { addCar, addRace, addSetup, createGarageState } from "../src/garage.js";

test("creates an empty garage with stable collections", () => {
  assert.deepEqual(createGarageState(), { cars: [], races: [], setups: [] });
});

test("adds a car with normalized required fields", () => {
  const state = addCar(createGarageState(), { make: " Nissan ", model: " GT-R " });
  assert.equal(state.cars.length, 1);
  assert.equal(state.cars[0].make, "Nissan");
  assert.equal(state.cars[0].model, "GT-R");
  assert.ok(state.cars[0].id);
});

test("rejects a car without a make or model", () => {
  assert.throws(() => addCar(createGarageState(), { make: "Nissan", model: " " }), /make and model/i);
});

test("records race results with numeric lap times", () => {
  const state = addRace(createGarageState(), { event: "Sunday Cup", track: "Trial Mountain", position: 1, bestLap: 102.45 });
  assert.equal(state.races[0].position, 1);
  assert.equal(state.races[0].bestLap, 102.45);
});

test("rejects invalid race positions", () => {
  assert.throws(() => addRace(createGarageState(), { event: "Cup", track: "Track", position: 0 }), /position/i);
});

test("stores named setup versions against a car", () => {
  const state = addSetup(createGarageState(), { carId: "car-1", name: "Track baseline", notes: "Stable braking" });
  assert.equal(state.setups[0].carId, "car-1");
  assert.equal(state.setups[0].name, "Track baseline");
});

test("rejects setup records without a car reference", () => {
  assert.throws(() => addSetup(createGarageState(), { carId: "", name: "Baseline" }), /car/i);
});
