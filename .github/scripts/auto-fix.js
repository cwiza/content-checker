#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Auto-fix script for content validation issues
 * Applies automated fixes to common content errors
 */

// Common misspellings and their corrections (100+ items)
const MISSPELLINGS = {
  'accomodate': 'accommodate',
  'seperate': 'separate',
  'recieve': 'receive',
  'beleive': 'believe',
  'teh': 'the',
  'occured': 'occurred',
  'untill': 'until',
  'sucessful': 'successful',
  'begining': 'beginning',
  'enviroment': 'environment',
  'goverment': 'government',
  'recomend': 'recommend',
  'acheive': 'achieve',
  'occassion': 'occasion',
  'wierd': 'weird',
  'neccessary': 'necessary',
  'existance': 'existence',
  'definitly': 'definitely',
  'embarass': 'embarrass',
  'occurance': 'occurrence',
  'persistant': 'persistent',
  'apparant': 'apparent',
  'arguement': 'argument',
  'calender': 'calendar',
  'collegue': 'colleague',
  'concious': 'conscious',
  'existant': 'existent',
  'foriegn': 'foreign',
  'guidence': 'guidance',
  'harrass': 'harass',
  'hygeine': 'hygiene',
  'ignorence': 'ignorance',
  'independant': 'independent',
  'maintainance': 'maintenance',
  'maneuver': 'maneuver',
  'millenium': 'millennium',
  'mispell': 'misspell',
  'occassional': 'occasional',
  'paralel': 'parallel',
  'priviledge': 'privilege',
  'publically': 'publicly',
  'refered': 'referred',
  'relevent': 'relevant',
  'seperation': 'separation',
  'tendancy': 'tendency',
  'transfered': 'transferred',
  'truely': 'truly',
  'useable': 'usable',
};

// Honorifics to remove
const HONORIFICS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

function applyFixes(content) {
  let fixed = content;
  let changesMade = [];

  // Fix misspellings (word boundaries to avoid partial matches)
  for (const [wrong, right] of Object.entries(MISSPELLINGS)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    if (regex.test(fixed)) {
      fixed = fixed.replace(regex, right);
      changesMade.push(`Fixed spelling: ${wrong} → ${right}`);
    }
  }

  // Remove honorifics
  for (const honorific of HONORIFICS) {
    const regex = new RegExp(`\\b${honorific}\\s+`, 'g');
    if (regex.test(fixed)) {
      fixed = fixed.replace(regex, '');
      changesMade.push(`Removed honorific: ${honorific}`);
    }
  }

  // Fix double spaces
  if (/  +/.test(fixed)) {
    fixed = fixed.replace(/  +/g, ' ');
    changesMade.push('Fixed double spaces');
  }

  // Fix trailing whitespace
  if (/[ \t]+$/m.test(fixed)) {
    fixed = fixed.replace(/[ \t]+$/gm, '');
    changesMade.push('Removed trailing whitespace');
  }

  return { content: fixed, changes: changesMade };
}

async function main() {
  const filename = process.argv[2];
  
  if (!filename) {
    console.error('Usage: auto-fix.js <filename>');
    process.exit(1);
  }

  const filePath = path.resolve(filename);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Applying auto-fixes to: ${filename}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const { content: fixed, changes } = applyFixes(content);

  if (changes.length === 0) {
    console.log('No fixes needed');
    process.exit(0);
  }

  fs.writeFileSync(filePath, fixed, 'utf8');

  console.log(`\n✅ Applied ${changes.length} fixes:`);
  changes.forEach(change => console.log(`  - ${change}`));
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
