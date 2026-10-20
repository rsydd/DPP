const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = __dirname;

function ensureFile(fileName, defaultValue) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2) + "\n", "utf-8");
  }
  return filePath;
}

function readJson(fileName, defaultValue = []) {
  const filePath = ensureFile(fileName, defaultValue);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    throw new Error(`File ${fileName} tidak berisi JSON yang valid.`);
  }
}

function writeJson(fileName, data) {
  const filePath = ensureFile(fileName, []);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

module.exports = { readJson, writeJson };
