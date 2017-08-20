"use strict";
const path = require("path");
const fs = require("fs");
const jsYAML = require("js-yaml");
const { describe, xspecify } = require("mocha-sugar-free");
const runWebPlatformTest = require("./run-web-platform-test.js")(path.resolve(__dirname, "tests"));

const EXPECTED_MANIFEST_VERSION = 4;

const toRunFilename = path.resolve(__dirname, "to-run.yaml");
const toRunString = fs.readFileSync(toRunFilename, { encoding: "utf-8" });

const manifestFilename = path.resolve(__dirname, "tests/MANIFEST.json");
const manifestString = fs.readFileSync(manifestFilename, { encoding: "utf-8" });
const manifest = JSON.parse(manifestString);

if (manifest.version !== EXPECTED_MANIFEST_VERSION) {
  throw new Error(`WPT manifest format mismatch; expected ${EXPECTED_MANIFEST_VERSION} but got ${manifest.version}`);
}

const toRunDocuments = jsYAML.safeLoadAll(toRunString, { filename: toRunFilename });
const toRunDirs = toRunDocuments.map(doc => doc.DIR).sort();

describe("Web platform tests", () => {
  // This could be optimized further by knowing that toRunDirs is in alphabetical order.
  // For now we assume toRunDirs is small enough that this doesn't matter.
  for (const filePath of Object.keys(manifest.paths)) {
    for (let toRunDirIndex = 0; toRunDirIndex < toRunDirs.length; ++toRunDirIndex) {
      const toRunDir = toRunDirs[toRunDirIndex];
      if (filePath.startsWith(toRunDir + "/")) {
        const fileType = manifest.paths[filePath][1];

        if (fileType === "testharness") {
          const result = toRunDocuments[toRunDirIndex][stripPrefix(filePath, toRunDir + "/")];

          if (result && result[0].includes("fail")) {
            xspecify(filePath);
          } else {
            runWebPlatformTest(filePath);
          }
        }
      }
    }
  }
});

function stripPrefix(string, prefix) {
  return string.substring(prefix.length);
}