const axios = require("axios");
require("dotenv").config({ path: require("path").join(__dirname, "../.env"), quiet: true });
let accessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });

  accessToken = res.data.access_token;
  tokenExpiry = Date.now() + res.data.expires_in * 1000 - 60000;
  return accessToken;
}

async function getHeaders() {
  const token = await getAccessToken();
  return {
    "Client-ID": process.env.TWITCH_CLIENT_ID,
    Authorization: `Bearer ${token}`,
  };
}

async function getStreamer(username) {
  const headers = await getHeaders();
  const res = await axios.get("https://api.twitch.tv/helix/users", {
    headers,
    params: { login: username },
  });
  return res.data.data[0] || null;
}

async function getLiveStatus(username) {
  const headers = await getHeaders();
  const res = await axios.get("https://api.twitch.tv/helix/streams", {
    headers,
    params: { user_login: username },
  });
  const stream = res.data.data[0] || null;
  return stream
    ? {
        live: true,
        title: stream.title,
        game: stream.game_name,
        viewers: stream.viewer_count,
        startedAt: stream.started_at,
      }
    : { live: false };
}

module.exports = { getStreamer, getLiveStatus };
