const axios = require("axios");
require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
  quiet: true,
});
const RIOT_KEY = process.env.RIOT_API_KEY;

function getRegionalRoute(region) {
  const map = {
    euw1: "europe",
    eun1: "europe",
    tr1: "europe",
    ru: "europe",
    na1: "americas",
    br1: "americas",
    la1: "americas",
    la2: "americas",
    kr: "asia",
    jp1: "asia",
    oc1: "sea",
  };
  return map[region.toLowerCase()] || "europe";
}
function getQueueName(queueId) {
  const queues = {
    420: "SoloQ",
    440: "FlexQ",
    400: "Draft",
    430: "Blind",
    450: "ARAM",
    490: "Quickplay",
    900: "URF",
    1900: "URF",
    720: "ARAM Clash",
    700: "Clash",
    1700: "Arena",
    1710: "Arena",
    830: "Bot Intro",
    840: "Bot Beginner",
    850: "Bot Intermediate",
  };
  return queues[queueId] || `Mode(${queueId})`;
}

async function getAccountByRiotId(gameName, tagLine, region = "euw1") {
  const route = getRegionalRoute(region);
  try {
    const res = await axios.get(
      `https://${route}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { "X-Riot-Token": RIOT_KEY } },
    );
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404)
      throw new Error(`Account "${gameName}#${tagLine}" not found in region ${region}`);
    if (status === 401) throw new Error(`Riot API key not valid or expired`);
    if (status === 403)
      throw new Error(`Riot API key not authorized for this resource`);
    if (status === 429)
      throw new Error(
        `Rate limit Riot API exceeded, please try again in a few seconds`,
      );
    throw new Error(
      `Error Riot API (${status}): ${err.response?.data?.status?.message || err.message}`,
    );
  }
}

async function getSummonerByPuuid(puuid, region = "euw1") {
  try {
    const res = await axios.get(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": RIOT_KEY } },
    );
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404)
      throw new Error(`Summoner not found for this PUUID`);
    if (status === 401) throw new Error(`Riot API key not valid or expired`);
    if (status === 403)
      throw new Error(`Riot API key not authorized for this resource`);
    if (status === 429)
      throw new Error(
        `Rate limit Riot API exceeded, please try again in a few seconds`,
      );
    throw new Error(
      `Error Riot API (${status}): ${err.response?.data?.status?.message || err.message}`,
    );
  }
}

async function getRankInfo(puuid, region = "euw1") {
  try {
    const res = await axios.get(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": RIOT_KEY } },
    );
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404)
      throw new Error(`No rank data found for this player`);
    if (status === 401) throw new Error(`Riot API key not valid or expired`);
    if (status === 403)
      throw new Error(`Riot API key not authorized for this resource`);
    if (status === 429)
      throw new Error(
        `Rate limit Riot API exceeded, please try again in a few seconds`,
      );
    throw new Error(
      `Error Riot API (${status}): ${err.response?.data?.status?.message || err.message}`,
    );
  }
}

async function getCurrentGame(puuid, region = "euw1") {
  try {
    const res = await axios.get(
      `https://${region}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
      { headers: { "X-Riot-Token": RIOT_KEY } },
    );
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) return null; // non in game, non è un errore
    if (status === 401) throw new Error(`Riot API key not valid or expired`);
    if (status === 403)
      throw new Error(`Riot API key not authorized for this resource`);
    if (status === 429)
      throw new Error(
        `Rate limit Riot API exceeded, please try again in a few seconds`,
      );
    throw new Error(
      `Error Riot API (${status}): ${err.response?.data?.status?.message || err.message}`,
    );
  }
}

async function getMatchHistory(puuid, region = "euw1", count = 20) {
  const route = getRegionalRoute(region);
  try {
    const res = await axios.get(
      `https://${route}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        headers: { "X-Riot-Token": RIOT_KEY },
        params: { count },
      },
    );
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404)
      throw new Error(`No matches found for this player`);
    if (status === 401) throw new Error(`Riot API key not valid or expired`);
    if (status === 403)
      throw new Error(`Riot API key not authorized for this resource`);
    if (status === 429)
      throw new Error(
        `Rate limit Riot API exceeded, please try again in a few seconds`,
      );
    throw new Error(
      `Error Riot API (${status}): ${err.response?.data?.status?.message || err.message}`,
    );
  }
}

async function getMatch(matchId, region = "euw1") {
  const route = getRegionalRoute(region);
  try {
    const res = await axios.get(
      `https://${route}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      { headers: { "X-Riot-Token": RIOT_KEY } },
    );
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) throw new Error(`Match "${matchId}" not found`);
    if (status === 401) throw new Error(`Riot API key not valid or expired`);
    if (status === 403)
      throw new Error(`Riot API key not authorized for this resource`);
    if (status === 429)
      throw new Error(
        `Rate limit Riot API exceeded, please try again in a few seconds`,
      );
    throw new Error(
      `Error Riot API (${status}): ${err.response?.data?.status?.message || err.message}`,
    );
  }
}
async function getChampionName(championId) {
  try {
    // prendi la versione corrente del gioco
    const versionRes = await axios.get(
      "https://ddragon.leagueoflegends.com/api/versions.json",
    );
    const version = versionRes.data[0];

    // prendi la lista dei champion
    const champRes = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    );
    const champions = champRes.data.data;

    const match = Object.values(champions).find(
      (c) => parseInt(c.key) === championId,
    );
    return match ? match.name : `Champion #${championId}`;
  } catch (err) {
    return `Champion #${championId}`;
  }
}
module.exports = {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankInfo,
  getCurrentGame,
  getMatchHistory,
  getMatch,
  getChampionName,
  getQueueName,
};
