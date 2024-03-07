// Copyright (c) 2021 TU Wien - All Rights Reserved.
// Unauthorized copying of this file is strictly prohibited.
//
// Contributors:
//   Michael Schröder <michael.schroeder@tuwien.ac.at>
//   Jürgen Cito <juergen.cito@tuwien.ac.at>

const fs = require('fs');
const path = require('path');
const mustache = require('mustache');

function generateReport(title, maxPoints, sections, outputDir) {
  const startTime = new Date();
  let report = {
    title, 
    maxPoints,
    sections,
    startTime: startTime.toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' UTC',
    minusPoints: 0,
    numTotalTests: 0, 
    numFailedTests: 0, 
    numPassedTests: 0
  }
  let jsonResults = []

  for (const section of sections) {
    for (const test of section.tests) {
      report.numTotalTests += 1;
      let jsonResult = { id: test.testId, minusPoints: test.minusPoints }      
      if (test.status == 'failed') {
        report.numFailedTests += 1;
        report.minusPoints += test.minusPoints;
        jsonResult.error = [test.failureMessage, ...test.errors].join('\n');
      } else {
        report.numPassedTests += 1;
      }
      jsonResults.push(jsonResult);
    }
  }

  report.totalPoints = Math.max(0, report.maxPoints - report.minusPoints);

  if (report.totalPoints >= report.maxPoints) {
    report.partyFace = '🥳';
  }

  console.log(`\nYou have \u001b[1m${report.totalPoints} points\u001b[0m on ${report.title}.`)
  
  for (let section of sections) {
    for (let test of section.tests) {
      if (test.visualTestError) {
        const expMoved = path.join(outputDir, `${test.testId}.expected.png`)
        fs.copyFileSync(test.visualTestError.expected, expMoved)
        test.visualTestError.expected = path.relative(outputDir, expMoved)

        const actMoved = path.join(outputDir, `${test.testId}.actual.png`)
        fs.renameSync(test.visualTestError.actual, actMoved)
        test.visualTestError.actual = path.relative(outputDir, actMoved)
      }
    }
  }

  const reportFile = path.join(outputDir, 'report.html');
  const jsonFile = path.join(outputDir, 'report.json');

  const json = JSON.stringify({
    timestamp: startTime.toISOString(),
    maxPoints: report.maxPoints,
    minusPoints: report.minusPoints,
    seed: 0,
    results: jsonResults
  });
  fs.writeFileSync(jsonFile, json, { encoding: 'utf-8' });

  const templateFile = path.join(__dirname, 'report.mustache.html');
  const template = fs.readFileSync(templateFile, 'utf-8');
  const html = mustache.render(template, report);
  fs.writeFileSync(reportFile, html, { encoding: 'utf-8' });
  console.log(`See \u001b[1m${path.basename(reportFile)}\u001b[0m for details.`);
}

module.exports = { generateReport }
