"use strict";
const path = require("path");
const fs = require("fs");
const jsYAML = require("js-yaml");
const sortArrayBy = require("sort-array-by");
const { describe, specify } = require("mocha-sugar-free");
const runWebPlatformTest = require("./run-web-platform-test.js")(path.resolve(__dirname, "tests"));

const EXPECTED_MANIFEST_VERSION = 4;

const manifestFilename = path.resolve(__dirname, "tests/MANIFEST.json");
const manifestString = fs.readFileSync(manifestFilename, { encoding: "utf-8" });
const manifest = JSON.parse(manifestString);

if (manifest.version !== EXPECTED_MANIFEST_VERSION) {
  throw new Error(`WPT manifest format mismatch; expected ${EXPECTED_MANIFEST_VERSION} but got ${manifest.version}`);
}

const toRunFilename = path.resolve(__dirname, "to-run.yaml");
const toRunString = fs.readFileSync(toRunFilename, { encoding: "utf-8" });
const toRunDocs = sortArrayBy(doc => doc.DIR, jsYAML.safeLoadAll(toRunString, { filename: toRunFilename }));

const testharnessTests = manifest.items.testharness;

describe("Web platform tests", () => {
  // This could be optimized further by knowing that toRunDocs is in alphabetical order.
  // For now we assume toRunDocs is small enough that this doesn't matter.
  for (const filePath of Object.keys(testharnessTests)) {
    for (const toRunDoc of toRunDocs) {
      if (filePath.startsWith(toRunDoc.DIR + "/")) {
        const testFiles = testharnessTests[filePath].map(value => value[[0]]);
        for (const testFile of testFiles) {
          const testFilePath = stripPrefix(testFile, "/");
          // Globally disable worker tests
          if (testFilePath.endsWith(".worker.html")) {
            continue;
          }

          const result = toRunDoc[stripPrefix(testFilePath, toRunDoc.DIR + "/")];

          if (result) {
            specify.skip(testFilePath);
          } else {
            runWebPlatformTest(testFilePath);
          }
        }
      }
    }
  }
});

function stripPrefix(string, prefix) {
  return string.substring(prefix.length);
}
