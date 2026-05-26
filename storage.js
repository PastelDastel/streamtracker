const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

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

// Import function
async function importFromFile(filePath, getStreamer) {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.log(chalk.red(`✗ File not found: ${resolvedPath}`));
    return;
  }

  try {
    const fileContent = fs.readFileSync(resolvedPath, "utf-8");
    const fileData = JSON.parse(fileContent);

    let totalImported = 0;
    let totalSkipped = 0;

    // Import standalone LoL accounts
    if (fileData.lolAccounts && Array.isArray(fileData.lolAccounts)) {
      let importedCount = 0;
      let skippedCount = 0;

      console.log(chalk.bold("\n── LoL Accounts ──"));

      for (const account of fileData.lolAccounts) {
        if (account.gameName && account.tagLine && account.region) {
          const added = addLolAccount(
            account.gameName,
            account.tagLine,
            account.region,
          );
          if (added) {
            console.log(
              chalk.green(
                `✓ Added: ${account.gameName}#${account.tagLine} (${account.region})`,
              ),
            );
            importedCount++;
          } else {
            console.log(
              chalk.yellow(
                `⚠ Duplicate: ${account.gameName}#${account.tagLine} (${account.region})`,
              ),
            );
            skippedCount++;
          }
        } else {
          console.log(
            chalk.yellow(`⚠ Invalid format: ${JSON.stringify(account)}`),
          );
        }
      }

      if (importedCount > 0 || skippedCount > 0) {
        console.log(
          chalk.bold(
            `LoL Accounts - ✓ Imported: ${importedCount} | ⚠ Skipped: ${skippedCount}`,
          ),
        );
      }

      totalImported += importedCount;
      totalSkipped += skippedCount;
    }

    // Import streamers with their LoL accounts
    if (fileData.streamers && Array.isArray(fileData.streamers)) {
      let streamerImported = 0;
      let streamerSkipped = 0;
      let accountsImported = 0;
      let accountsSkipped = 0;

      console.log(chalk.bold("\n── Streamers ──"));

      for (const streamer of fileData.streamers) {
        if (streamer.twitch) {
          // Verify the streamer exists on Twitch
          const streamerData = await getStreamer(streamer.twitch);
          if (!streamerData) {
            console.log(
              chalk.yellow(
                `⚠ Streamer not found on Twitch, skipping: ${streamer.twitch}`,
              ),
            );
            streamerSkipped++;
            continue;
          }

          // Collect valid LoL accounts from the streamer data
          const streamerAccounts = (streamer.lolAccounts || []).filter(
            (acc) => acc.gameName && acc.tagLine && acc.region,
          );

          // Try to add the streamer
          const added = addStreamer(streamer.twitch, streamerAccounts);
          if (added) {
            streamerImported++;
            console.log(
              chalk.green(`✓ Imported streamer: ${streamerData.display_name}`),
            );

            // Also add their LoL accounts to the global list
            for (const account of streamerAccounts) {
              const accountAdded = addLolAccount(
                account.gameName,
                account.tagLine,
                account.region,
              );
              if (accountAdded) {
                accountsImported++;
              } else {
                accountsSkipped++;
                console.log(
                  chalk.yellow(
                    `  ⚠ Duplicate LoL account: ${account.gameName}#${account.tagLine}`,
                  ),
                );
              }
            }

            if (streamerAccounts.length > 0) {
              console.log(
                chalk.gray(
                  `  LoL Accounts: ${streamerAccounts.map((a) => `${a.gameName}#${a.tagLine}`).join(", ")}`,
                ),
              );
            }
          } else {
            streamerSkipped++;
            console.log(
              chalk.yellow(`⚠ Streamer already exists: ${streamer.twitch}`),
            );
          }
        }
      }

      if (streamerImported > 0 || streamerSkipped > 0) {
        console.log(
          chalk.bold(
            `\nStreamers - ✓ Imported: ${streamerImported} | ⚠ Skipped: ${streamerSkipped}`,
          ),
        );
        if (accountsImported > 0 || accountsSkipped > 0) {
          console.log(
            chalk.bold(
              `Streamer Accounts - ✓ Imported: ${accountsImported} | ⚠ Skipped: ${accountsSkipped}`,
            ),
          );
        }
      }

      totalImported += streamerImported + accountsImported;
      totalSkipped += streamerSkipped + accountsSkipped;
    }

    // Final summary
    if (totalImported === 0 && totalSkipped === 0) {
      console.log(chalk.red("\n✗ No valid data found in file"));
    } else {
      console.log(chalk.bold(`\n── Total ──`));
      console.log(
        chalk.bold(
          `✓ Total Imported: ${totalImported} | ⚠ Total Skipped: ${totalSkipped}`,
        ),
      );
    }
  } catch (error) {
    console.log(chalk.red(`✗ Error reading/parsing file: ${error.message}`));
  }
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
  importFromFile,
};
