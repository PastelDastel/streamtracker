const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "data.json");

function load() {
  if (!fs.existsSync(FILE)) return { streamers: [], lolAccounts: [] };
  const data = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  if (!data.lolAccounts) data.lolAccounts = [];
  return data;
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function addStreamer(twitch, lolAccounts = []) {
  const data = load();
  const exists = data.streamers.find(
    (s) => s.twitch.toLowerCase() === twitch.toLowerCase(),
  );
  if (exists) return false;
  data.streamers.push({
    twitch,
    lolAccounts, // array di { gameName, tagLine, region }
    addedAt: new Date().toISOString(),
  });
  save(data);
  return true;
}

function removeStreamer(twitch) {
  const data = load();
  const before = data.streamers.length;
  data.streamers = data.streamers.filter(
    (s) => s.twitch.toLowerCase() !== twitch.toLowerCase(),
  );
  if (data.streamers.length === before) return false;
  save(data);
  return true;
}

function getStreamers() {
  return load().streamers;
}
function addLolAccount(gameName, tagLine, region) {
  const data = load();
  if (!data.lolAccounts) data.lolAccounts = [];

  const exists = data.lolAccounts.find(
    (a) =>
      a.gameName.toLowerCase() === gameName.toLowerCase() &&
      a.tagLine.toLowerCase() === tagLine.toLowerCase() &&
      a.region.toLowerCase() === region.toLowerCase(),
  );
  if (exists) return false;

  data.lolAccounts.push({
    gameName,
    tagLine,
    region,
    addedAt: new Date().toISOString(),
  });
  save(data);
  return true;
}

function removeLolAccount(gameName, tagLine, region) {
  const data = load();
  if (!data.lolAccounts) return false;
  const before = data.lolAccounts.length;
  data.lolAccounts = data.lolAccounts.filter(
    (a) =>
      !(
        a.gameName.toLowerCase() === gameName.toLowerCase() &&
        a.tagLine.toLowerCase() === tagLine.toLowerCase() &&
        a.region.toLowerCase() === region.toLowerCase()
      ),
  );
  if (data.lolAccounts.length === before) return false;
  save(data);
  return true;
}

function getLolAccounts() {
  const data = load();
  return data.lolAccounts || [];
}
module.exports = {
  load,
  save,
  addStreamer,
  removeStreamer,
  getStreamers,
  addLolAccount,
  removeLolAccount,
  getLolAccounts,
};
