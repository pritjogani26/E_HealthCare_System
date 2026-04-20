// test_date.js
const apt = {
  slot_date: "2026-04-18",
  start_time: "14:00:00"
};

const d = new Date(`${apt.slot_date}T${apt.start_time}`);
console.log("Date parsed:", d);
console.log("Is future?", d > new Date());
