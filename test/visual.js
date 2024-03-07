// Copyright (c) 2021 TU Wien - All Rights Reserved.
// Unauthorized copying of this file is strictly prohibited.
//
// Contributors:
//   Michael Schröder <michael.schroeder@tuwien.ac.at>
//   Jürgen Cito <juergen.cito@tuwien.ac.at>

const puppeteer = require('puppeteer');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function takeScreenshots(shots, outFileKey = 'actual') {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--single-process', '--font-render-hinting=none', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  for (const shot of shots) {
    await page.setViewport({ 
      width: shot.resolution.width,
      height: shot.resolution.height ?? 1,
      isMobile: shot.resolution.isMobile ?? false,
      deviceScaleFactor: shot.resolution.deviceScaleFactor ?? 1
    });
    const url = 'file://' + path.resolve(shot.file);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.screenshot({ 
      path: shot[outFileKey], 
      fullPage: shot.resolution.fullPage ?? false 
    });  
  }
  browser.close();
}

function plural(n,a,b) {
  return n == 1 ? a : b
}

function listFormat(arr) {
  if (arr.length === 1) return arr[0];
  const firsts = arr.slice(0, arr.length - 1);
  const last = arr[arr.length - 1];
  return firsts.join(', ') + ' and ' + last;
}

async function testVisual(shot, params) {
  const { stdout, stderr } = await exec(`python3 compare.py "${shot.expected}" "${shot.actual}" '${JSON.stringify(params)}'`);
  const result = JSON.parse(stdout);

  const numMatching = result.matches.filter(m => m.moved == false).length;
  const numMoved = result.matches.filter(m => m.moved == true).length;
  const numMissing = result.leftovers.a.length;
  const numExtra = result.leftovers.b.length;

  let minusPoints = Math.min(1, numMoved + numMissing + numExtra);

  let failureMessage = null  
  let visualTestError = null
  if (minusPoints > 0) {
    let msgs = []
    if (numMoved > 0) {
      msgs.push(`<span class="mark-moved">${numMoved} component${plural(numMoved, ' is', 's are')} in the wrong place</span>`);
    }    
    if (numExtra > 0) {
      msgs.push(`there ${plural(numExtra, 'is', 'are')} <span class="mark-extra">${numExtra} unexpected component${plural(numExtra, '', 's')}</span>`);
    }
    if (numMissing > 0) {
      msgs.push(`<span class="mark-missing">${numMissing} expected component${plural(numMissing, ' is', 's are')} missing</span>`);
    }
    failureMessage = `The page does not look correct: ${listFormat(msgs)}.`
    visualTestError = {
      expected: path.relative('.', shot.expected),
      actual: path.relative('.', shot.actual),
      result: JSON.stringify(result),
      numMatching: numMatching,
      numMoved: numMoved,
      numMissing: numMissing,
      numExtra: numExtra
    }
  }  

  return { 
    status: minusPoints > 0 ? 'failed' : 'passed',
    minusPoints, 
    failureMessage,
    visualTestError,
    errors: []    
  }
}

module.exports = { takeScreenshots, testVisual }
