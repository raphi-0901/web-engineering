// Copyright (c) 2021 TU Wien - All Rights Reserved.
// Unauthorized copying of this file is strictly prohibited.
//
// Contributors:
//   Michael Schröder <michael.schroeder@tuwien.ac.at>
//   Jürgen Cito <juergen.cito@tuwien.ac.at>

const { validateHtml } = require('./validate.js');
const { takeScreenshots, testVisual } = require('./visual.js');
const { generateReport } = require('./reporter.js');
const path = require('path');
const fs = require('fs');
const ora = require('ora');
const chalk = require('chalk');

//----------------------------------------------------------------------------

const testConfig = require('./config.json');

SCREENSHOTS_EXPECTED_DIR = path.resolve('screenshots', 'expected')
SCREENSHOTS_ACTUAL_DIR = path.resolve('screenshots', 'actual')
REPORT_DIR = path.resolve('report')

let screenshots = {}
for (const target of testConfig) {
  for (const test of target.tests) {
    if (test.type != 'visual') continue;
    screenshots[test.testId] = {
      file: target.filePath,
      expected: path.join(SCREENSHOTS_EXPECTED_DIR, test.testId + '.png'),
      actual: path.join(SCREENSHOTS_ACTUAL_DIR, test.testId + '.png'),
      resolution: test.resolution
    }
  }
}

//----------------------------------------------------------------------------

const _spinner = ora();
let _startTime, _stopTime;

function startSpinner(text, prefix = '') {
  _startTime = process.hrtime();
  _spinner.prefixText = prefix;
  _spinner.start(text)
}

function stopSpinner(success) {
  _stopTime = process.hrtime(_startTime);
  const secs = (_stopTime[0]+_stopTime[1]/Math.pow(10,9)).toFixed(3);
  const text = _spinner.text + chalk.gray(` (${secs}s)`);
  if (success) {
    _spinner.succeed(text);
  } else {
    _spinner.fail(text);
  }
}

//----------------------------------------------------------------------------

(async () => {

if (process.argv.length > 2 && process.argv[2] == 'baseline') {
  startSpinner('Taking expected screenshots for baseline');
  fs.rmSync(SCREENSHOTS_EXPECTED_DIR, { recursive: true, force: true });
  fs.mkdirSync(SCREENSHOTS_EXPECTED_DIR, { recursive: true });
  await takeScreenshots(Object.values(screenshots), 'expected');
  stopSpinner(true)
  process.exit(0);
}

let missingExpectedShots = []
for (let testId in screenshots) {
  if (!fs.existsSync(screenshots[testId].expected)) {
    missingExpectedShots.push(testId)
  }
}
if (missingExpectedShots.length > 0) {
  console.error(`Missing expected screenshots for ${missingExpectedShots}. Please run with the 'baseline' argument first.`)
  process.exit(1);
}

fs.rmSync(REPORT_DIR, { recursive: true, force: true });
fs.mkdirSync(REPORT_DIR, { recursive: true })  

startSpinner('Taking screenshots');
fs.rmSync(SCREENSHOTS_ACTUAL_DIR, { recursive: true, force: true });
fs.mkdirSync(SCREENSHOTS_ACTUAL_DIR, { recursive: true })
await takeScreenshots(Object.values(screenshots), 'actual')
stopSpinner(true);

let sections = [];
for (const target of testConfig) {
  testFileName = path.basename(target.filePath)
  console.log(`\n${testFileName}`);
  let tests = [];
  for (const desc of target.tests) {    
    if (desc.type == 'validate') {
      const description = 'Has valid HTML';
      startSpinner(`${desc.testId} - ${description}`, ' ');
      const result = validateHtml(target.filePath)
      result.description = description
      result.testId = desc.testId
      tests.push(result)
    } else if (desc.type == 'visual') {
      const width = screenshots[desc.testId].resolution.width;
      const description = `Looks correct at ${width}px width`;
      startSpinner(`${desc.testId} - ${description}`, ' ');
      const result = await testVisual(screenshots[desc.testId], desc.parameters)
      result.description = description
      result.testId = desc.testId
      tests.push(result)
    }
    stopSpinner(tests[tests.length-1].status == 'passed');
  }
  sections.push({ testFileName, tests })
}

generateReport('A1', 14, sections, REPORT_DIR);

})().catch(e => {
  console.error(e);
  process.exit(1);
});