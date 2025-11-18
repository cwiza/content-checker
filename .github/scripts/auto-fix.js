#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const filename = process.argv[2];

// Security: Validate filename and prevent path traversal
if (!filename) {
    console.error('No filename provided');
    process.exit(1);
}

// Reject path traversal attempts
if (filename.includes('..') || filename.startsWith('/')) {
    console.error('Invalid filename: path traversal detected');
    process.exit(1);
}

// Resolve to absolute path within repo
const resolvedPath = path.resolve(process.cwd(), filename);
const repoRoot = process.cwd();

// Ensure file is within repository
if (!resolvedPath.startsWith(repoRoot)) {
    console.error('Invalid filename: outside repository');
    process.exit(1);
}

if (!fs.existsSync(resolvedPath)) {
    console.error('File not found:', filename);
    process.exit(1);
}

let content = fs.readFileSync(resolvedPath, 'utf8');

// Apply common fixes
const fixes = {
    // Spelling corrections
    'definately': 'definitely',
    'recieve': 'receive',
    'occured': 'occurred',
    'seperate': 'separate',
    'accomodate': 'accommodate',
    'beleive': 'believe',
    'calender': 'calendar',
    'collegue': 'colleague',
    'goverment': 'government',
    'untill': 'until',
    'succesful': 'successful',
    'begining': 'beginning',
    
    // Grammar fixes
    'could of': 'could have',
    'should of': 'should have',
    'would of': 'would have'
};

// Apply word-for-word replacements
for (const [wrong, correct] of Object.entries(fixes)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    content = content.replace(regex, correct);
}

// Remove honorifics
content = content.replace(/\bMr\.\s+/g, '');
content = content.replace(/\bMrs\.\s+/g, '');
content = content.replace(/\bMs\.\s+/g, '');
content = content.replace(/\bDr\.\s+/g, '');
content = content.replace(/\bProf\.\s+/g, '');

// Write fixed content
fs.writeFileSync(resolvedPath, content, 'utf8');
console.log(`✅ Applied auto-fixes to ${filename}`);
