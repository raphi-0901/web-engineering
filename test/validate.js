// Copyright (c) 2021 TU Wien - All Rights Reserved.
// Unauthorized copying of this file is strictly prohibited.
//
// Contributors:
//   Michael Schröder <michael.schroeder@tuwien.ac.at>
//   Jürgen Cito <juergen.cito@tuwien.ac.at>

const { HtmlValidate } = require("html-validate");
const path = require('path');

const htmlvalidate = new HtmlValidate({
  plugins: ["<rootDir>/html-validate-tuwien"],
  extends: ["html-validate:recommended"],
  rules: {
    "no-unknown-elements": "error",
    "missing-doctype": "error",
    "no-missing-references": "error",
    "no-trailing-whitespace": "warn",
    "tuwien/input-missing-label": "error"
  }
});

function validateHtml(file) {
  const report = htmlvalidate.validateFile(file);
  let minusPoints = 0;
  let failureMessage = null;
  let errors = [];
  if (!report.valid) {
    failureMessage = `HTML does not validate (${report.errorCount} errors, ${report.warningCount} warnings).\n`;
    for (const r of report.results) {
      for (const e of r.messages) {
        const type = e.severity == 2 ? 'error' : 'warning';
        errors.push(`[${type}] ${path.basename(r.filePath)}:${e.line}:${e.column}: ${e.message}\n`);
        if (type == 'error') {
          minusPoints += 0.5;
        }
      }
    }
  }
  return { 
    status: report.valid ? 'passed' : 'failed',
    minusPoints, 
    failureMessage, 
    errors 
  }
}

module.exports = { validateHtml }