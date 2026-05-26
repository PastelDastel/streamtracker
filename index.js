#!/usr/bin/env node
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
  quiet: true,
});
const { program } = require("commander");
const chalk = require("chalk");
const {
  addStreamer,
  removeStreamer,
  getStreamers,
  addLolAccount,
  removeLolAccount,
  getLolAccounts,
} = require("./storage");
const { getStreamer, getLiveStatus } = require("./api/twitch");
const {
  getAccountByRiotId,
  getRankInfo,
  getCurrentGame,
  getChampionName,
  getMatch,
  getMatchHistory,
  getQueueName,
} = require("./api/riot");

program
  .name("streamtracker")
  .description("Tracks Twitch streamers and their LoL accounts")
  .version("1.0.0");

program
  .command("add <twitch>")
  .description("Add a streamer with optional LoL accounts")
  .option(
    "--lol <accounts>",
    "Comma-separated list of LoL accounts (format: gameName#tag#region) es: --lol Desperate#adi#eun1,AnotherPlayer#tag#na1",
  )
  .action(async (twitch, options) => {
    const twitchData = await getStreamer(twitch);
    if (!twitchData) {
      console.log(chalk.red(`✗ Streamer "${twitch}" not found on Twitch`));
      return;
    }

    const lolAccounts = [];
    if (options.lol) {
      const entries = options.lol.split(",").map((e) => e.trim());
      for (const entry of entries) {
        const parts = entry.split("#");
        if (parts.length !== 3) {
          console.log(
            chalk.yellow(`⚠ LoL account ignored (wrong format): ${entry}`),
          );
          continue;
        }
        lolAccounts.push({
          gameName: parts[0],
          tagLine: parts[1],
          region: parts[2],
        });
      }
    }

    const added = addStreamer(twitch, lolAccounts);
    if (!added) {
      console.log(chalk.yellow(`⚠ ${twitch} is already in the list`));
      return;
    }

    console.log(chalk.green(`✓ Added: ${twitchData.display_name}`));
    if (lolAccounts.length > 0) {
      console.log(
        `  LoL Accounts: ${lolAccounts.map((a) => `${a.gameName}#${a.tagLine}`).join(", ")}`,
      );
    }
  });

program
  .command("remove <twitch>")
  .description("Remove a streamer")
  .action((twitch) => {
    const removed = removeStreamer(twitch);
    if (!removed) {
      console.log(chalk.red(`✗ "${twitch}" not found in the list`));
      return;
    }
    console.log(chalk.green(`✓ Removed: ${twitch}`));
  });

program
  .command("list")
  .description("Show saved streamers and their LoL accounts")
  .action(() => {
    const streamers = getStreamers();
    if (streamers.length === 0) {
      console.log("No streamers saved.");
      return;
    }
    console.log("\nSaved Streamers:\n");
    for (const s of streamers) {
      console.log(`  • ${s.twitch} `);
      if (s.lolAccounts.length > 0) {
        for (const acc of s.lolAccounts) {
          console.log(
            chalk.cyan(
              `     └─ LoL: ${acc.gameName}#${acc.tagLine} (${acc.region})`,
            ),
          );
        }
      }
      console.log("  Added on: " + new Date(s.addedAt).toLocaleString());
    }
    console.log("");
  });

program
  .command("check [twitch]")
  .description("Check the status of a streamer or all saved streamers")
  .action(async (twitch) => {
    const streamers = getStreamers();
    if (streamers.length === 0) {
      console.log("No streamers saved. Use: streamtracker add <twitch>");
      return;
    }

    const targets = twitch
      ? streamers.filter((s) => s.twitch.toLowerCase() === twitch.toLowerCase())
      : streamers;

    if (targets.length === 0) {
      console.log(chalk.red(`✗ "${twitch}" not found in the list`));
      return;
    }

    for (const s of targets) {
      console.log(chalk.bold(`\n── ${s.twitch} ──`));

      // Twitch status
      const live = await getLiveStatus(s.twitch);
      if (live.live) {
        console.log(
          chalk.green(`  🔴 LIVE`) +
            ` — ${live.game} — ${live.viewers.toLocaleString()} viewers`,
        );
        console.log(`     "${live.title}"`);
      } else {
        console.log(chalk.gray(`  ⚫ Offline`));
      }

      // LoL accounts
      for (const acc of s.lolAccounts) {
        console.log(
          chalk.cyan(`\n  LoL: ${acc.gameName}#${acc.tagLine} (${acc.region})`),
        );
        try {
          const account = await getAccountByRiotId(
            acc.gameName,
            acc.tagLine,
            acc.region,
          );
          const rank = await getRankInfo(account.puuid, acc.region);
          const soloQ = rank.find((r) => r.queueType === "RANKED_SOLO_5x5");
          const flexQ = rank.find((r) => r.queueType === "RANKED_FLEX_SR");
          const inGame = await getCurrentGame(account.puuid, acc.region);

          if (soloQ) {
            console.log(
              `  SoloQ: ${soloQ.tier} ${soloQ.rank} ${soloQ.leaguePoints}LP (${soloQ.wins}W ${soloQ.losses}L)`,
            );
          } else {
            console.log(`  SoloQ: Unranked`);
          }

          if (flexQ) {
            console.log(
              `  FlexQ: ${flexQ.tier} ${flexQ.rank} ${flexQ.leaguePoints}LP (${flexQ.wins}W ${flexQ.losses}L)`,
            );
          } else {
            console.log(`  FlexQ: Unranked`);
          }

          if (inGame) {
            const player = inGame.participants.find(
              (p) => p.puuid === account.puuid,
            );
            const champName = player?.championId
              ? await getChampionName(player.championId)
              : "unknown";
            console.log(chalk.yellow(`  🎮 In game — ${champName}`));
          }
        } catch (err) {
          console.log(chalk.red(`  ✗ Error: ${err.message}`));
        }
      }
    }
    console.log("");
  });

program
  .command("add-lol <account>")
  .description("Add a standalone LoL account. Format: gameName#tag#region")
  .action(async (account) => {
    const parts = account.split("#");
    if (parts.length !== 3) {
      console.log(chalk.red(`✗ Incorrect format. Use: gameName#tag#region`));
      return;
    }
    const [gameName, tagLine, region] = parts;

    try {
      const acc = await getAccountByRiotId(gameName, tagLine, region);
      const added = addLolAccount(acc.gameName, tagLine, region);
      if (!added) {
        console.log(
          chalk.yellow(`⚠ ${gameName}#${tagLine} already in the list`),
        );
        return;
      }
      console.log(
        chalk.green(`✓ Added: ${acc.gameName}#${tagLine} (${region})`),
      );
    } catch (err) {
      console.log(chalk.red(`✗ ${err.message}`));
    }
  });

program
  .command("remove-lol <account>")
  .description("Remove a standalone LoL account. Format: gameName#tag#region")
  .action((account) => {
    const parts = account.split("#");
    if (parts.length !== 3) {
      console.log(chalk.red(`✗ Incorrect format. Use: gameName#tag#region`));
      return;
    }
    const [gameName, tagLine, region] = parts;
    const removed = removeLolAccount(gameName, tagLine, region);
    if (!removed) {
      console.log(chalk.red(`✗ Account not found in the list`));
      return;
    }
    console.log(chalk.green(`✓ Removed: ${gameName}#${tagLine}`));
  });

program
  .command("check-lol [account]")
  .description(
    "Infodump su un account LoL. Formato: gameName#tag#region. Se omesso controlla tutti.",
  )
  .action(async (account) => {
    let targets = [];

    if (account) {
      const parts = account.split("#");
      if (parts.length !== 3) {
        console.log(chalk.red(`✗ Formato errato. Usa: gameName#tag#region`));
        return;
      }
      targets = [{ gameName: parts[0], tagLine: parts[1], region: parts[2] }];
    } else {
      targets = getLolAccounts();
      if (targets.length === 0) {
        console.log(
          "Nessun account LoL salvato. Usa: streamtracker add-lol <account>",
        );
        return;
      }
    }

    for (const acc of targets) {
      console.log(
        chalk.bold(`\n── ${acc.gameName}#${acc.tagLine} (${acc.region}) ──`),
      );

      try {
        // Fetch and print rank immediately
        const riot = await getAccountByRiotId(
          acc.gameName,
          acc.tagLine,
          acc.region,
        );

        const rank = await getRankInfo(riot.puuid, acc.region);
        const soloQ = rank.find((r) => r.queueType === "RANKED_SOLO_5x5");
        const flexQ = rank.find((r) => r.queueType === "RANKED_FLEX_SR");

        if (soloQ) {
          const wr = ((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100).toFixed(
            1,
          );
          console.log(
            `  SoloQ: ${soloQ.tier} ${soloQ.rank} ${soloQ.leaguePoints}LP (${soloQ.wins}W ${soloQ.losses}L) ${wr}% WR`,
          );
        } else {
          console.log(`  SoloQ: Unranked`);
        }

        if (flexQ) {
          const wr = ((flexQ.wins / (flexQ.wins + flexQ.losses)) * 100).toFixed(
            1,
          );
          console.log(
            `  FlexQ: ${flexQ.tier} ${flexQ.rank} ${flexQ.leaguePoints}LP (${flexQ.wins}W ${flexQ.losses}L) ${wr}% WR`,
          );
        } else {
          console.log(`  FlexQ: Unranked`);
        }

        // Fetch and print in-game status immediately
        const inGame = await getCurrentGame(riot.puuid, acc.region);
        if (inGame) {
          const player = inGame.participants.find(
            (p) => p.puuid === riot.puuid,
          );
          const champName = player?.championId
            ? await getChampionName(player.championId)
            : "unknown";
          console.log(chalk.yellow(`  🎮 In game — ${champName}`));
        }

        // Fetch match IDs, then print each match as it loads
        const matchIds = await getMatchHistory(riot.puuid, acc.region, 20);
        console.log(chalk.cyan(`\n  Last ${matchIds.length} Games:`));

        let totalWins = 0;
        let totalGames = 0;

        for (const matchId of matchIds) {
          const match = await getMatch(matchId, acc.region);
          const player = match.info.participants.find(
            (p) => p.puuid === riot.puuid,
          );
          if (!player) continue;

          const won = player.win;
          const kda = `${player.kills}/${player.deaths}/${player.assists}`;
          const champ = player.championName;
          const cs = player.totalMinionsKilled + player.neutralMinionsKilled;
          const duration = Math.floor(match.info.gameDuration / 60);
          const queue = getQueueName(match.info.queueId);
          const date = new Date(
            match.info.gameStartTimestamp,
          ).toLocaleDateString("it-IT");

          totalGames++;
          if (won) totalWins++;

          // Print each match immediately as it resolves
          const result = won ? chalk.green("W") : chalk.red("L");
          console.log(
            `  ${result} ${champ.padEnd(15)} ${kda.padEnd(12)} CS:${cs.toString().padEnd(5)} ${duration}min  ${queue.padEnd(10)} ${date}`,
          );
        }

        // Print summary after all matches
        if (totalGames > 0) {
          const totalWR = ((totalWins / totalGames) * 100).toFixed(1);
          console.log(
            chalk.bold(
              `\n  WR last ${totalGames} Games: ${totalWins}W ${totalGames - totalWins}L (${totalWR}%)`,
            ),
          );
        }
      } catch (err) {
        console.log(chalk.red(`  ✗ ${err.message}`));
      }
    }
    console.log("");
  });

program.parse();
