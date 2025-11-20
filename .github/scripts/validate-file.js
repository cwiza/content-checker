#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ContentValidator {
    constructor() {
        this.rules = this.initializeRules();
    }

    initializeRules() {
        return [
            {
                name: 'Spelling Check',
                type: 'spelling',
                severity: 'high',
                check: (text, ctx) => this.checkSpelling(text, ctx)
            },
            {
                name: 'Honorifics',
                type: 'honorifics',
                severity: 'critical',
                check: (text, ctx) => this.checkHonorifics(text, ctx)
            },
            {
                name: 'Placeholder Text',
                type: 'placeholder',
                severity: 'high',
                check: (text, ctx) => this.checkPlaceholder(text, ctx)
            },
            {
                name: 'Grammar Check',
                type: 'grammar',
                severity: 'medium',
                check: (text, ctx) => this.checkGrammar(text, ctx)
            },
            {
                name: 'Capitalization',
                type: 'capitalization',
                severity: 'low',
                check: (text, ctx) => this.checkCapitalization(text, ctx)
            }
        ];
    }

    async validateContent(content, filename) {
        const issues = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            for (const rule of this.rules) {
                const context = {
                    filename,
                    lineNumber,
                    fullContent: content
                };

                const results = rule.check(line, context);
                for (const result of results) {
                    issues.push({
                        file: filename,
                        line: result.line,
                        message: result.message,
                        severity: rule.severity,
                        type: rule.type,
                        suggestion: result.suggestion
                    });
                }
            }
        }

        return issues;
    }

    checkSpelling(text, ctx) {
        const results = [];
        const commonMisspellings = {
            // Common typos
            'teh': 'the',
            'taht': 'that',
            'thier': 'their',
            'recieve': 'receive',
            'occured': 'occurred',
            'occuring': 'occurring',
            'seperate': 'separate',
            'definately': 'definitely',
            'accomodate': 'accommodate',
            'beleive': 'believe',
            'calender': 'calendar',
            'collegue': 'colleague',
            'goverment': 'government',
            'untill': 'until',
            'succesful': 'successful',
            'sucessful': 'successful',
            'begining': 'beginning',
            'fring': 'firing',
            'ahd': 'and',
            'adn': 'and',
            'nad': 'and',
            'tiem': 'time',
            'freind': 'friend',
            'freinds': 'friends',
            
            // ie/ei confusion
            'wierd': 'weird',
            'peice': 'piece',
            'breif': 'brief',
            'cheif': 'chief',
            'beleif': 'belief',
            'reciept': 'receipt',
            'decieve': 'deceive',
            'seize': 'seize',
            'nieghbor': 'neighbor',
            'feild': 'field',
            'yeild': 'yield',
            'preist': 'priest',
            'seige': 'siege',
            'theif': 'thief',
            
            // Double letters
            'occassion': 'occasion',
            'occurence': 'occurrence',
            'embarass': 'embarrass',
            'harrass': 'harass',
            'skillful': 'skillful',
            'fullfil': 'fulfill',
            'untill': 'until',
            'comming': 'coming',
            'runing': 'running',
            'occured': 'occurred',
            
            // -ance/-ence confusion
            'independance': 'independence',
            'dependance': 'dependence',
            'appearence': 'appearance',
            'existance': 'existence',
            'persistance': 'persistence',
            'resistance': 'resistance',
            'maintenence': 'maintenance',
            'experiense': 'experience',
            'refrence': 'reference',
            'preferance': 'preference',
            
            // Commonly confused words
            'alot': 'a lot',
            'everytime': 'every time',
            'eachother': 'each other',
            'incase': 'in case',
            'aswell': 'as well',
            'infact': 'in fact',
            'inspite': 'in spite',
            'neverthless': 'nevertheless',
            'noone': 'no one',
            'somtime': 'sometime',
            'uptill': 'up till',
            'upto': 'up to',
            'withthe': 'with the',
            
            // Other common misspellings
            'acheive': 'achieve',
            'adress': 'address',
            'agressive': 'aggressive',
            'arguement': 'argument',
            'commited': 'committed',
            'concious': 'conscious',
            'consious': 'conscious',
            'dissapear': 'disappear',
            'enviroment': 'environment',
            'exsist': 'exist',
            'existance': 'existence',
            'foriegn': 'foreign',
            'grammer': 'grammar',
            'heigth': 'height',
            'hieght': 'height',
            'ignorence': 'ignorance',
            'immitate': 'imitate',
            'independant': 'independent',
            'knowlege': 'knowledge',
            'liason': 'liaison',
            'libary': 'library',
            'lisence': 'license',
            'maintainance': 'maintenance',
            'millenium': 'millennium',
            'minature': 'miniature',
            'mischevious': 'mischievous',
            'neccessary': 'necessary',
            'noticable': 'noticeable',
            'occassion': 'occasion',
            'parliamant': 'parliament',
            'perseverence': 'perseverance',
            'personell': 'personnel',
            'posession': 'possession',
            'prefered': 'preferred',
            'priviledge': 'privilege',
            'probly': 'probably',
            'publically': 'publicly',
            'reccomend': 'recommend',
            'refered': 'referred',
            'relevent': 'relevant',
            'religous': 'religious',
            'responsability': 'responsibility',
            'rythm': 'rhythm',
            'sciense': 'science',
            'secratary': 'secretary',
            'similer': 'similar',
            'sincerly': 'sincerely',
            'strengh': 'strength',
            'sufficent': 'sufficient',
            'supercede': 'supersede',
            'surprize': 'surprise',
            'temperture': 'temperature',
            'tommorrow': 'tomorrow',
            'tounge': 'tongue',
            'truely': 'truly',
            'unforseen': 'unforeseen',
            'unfortunatly': 'unfortunately',
            'useable': 'usable',
            'vaccum': 'vacuum',
            'visable': 'visible',
            'wether': 'whether',
            'withold': 'withhold',
            'writting': 'writing'
        };

        // Check for spacing issues in common phrases
        const spacingIssues = [
            { pattern: /\be\s+mail\b/gi, correct: 'email', word: 'e mail' },
            { pattern: /\bweb\s+site\b/gi, correct: 'website', word: 'web site' },
            { pattern: /\bon\s+line\b/gi, correct: 'online', word: 'on line' },
            { pattern: /\bdata\s+base\b/gi, correct: 'database', word: 'data base' },
            { pattern: /\bany\s+one\b/gi, correct: 'anyone', word: 'any one' },
            { pattern: /\bany\s+where\b/gi, correct: 'anywhere', word: 'any where' },
            { pattern: /\bany\s+way\b/gi, correct: 'anyway', word: 'any way' },
            { pattern: /\bsome\s+one\b/gi, correct: 'someone', word: 'some one' },
            { pattern: /\bsome\s+where\b/gi, correct: 'somewhere', word: 'some where' },
            { pattern: /\bsome\s+times\b/gi, correct: 'sometimes', word: 'some times' }
        ];

        for (const issue of spacingIssues) {
            if (issue.pattern.test(text)) {
                results.push({
                    message: `Spacing error: "${issue.word}"`,
                    suggestion: `Should be "${issue.correct}"`,
                    line: ctx.lineNumber
                });
            }
        }

        const words = text.match(/\b[a-zA-Z]+\b/g) || [];
        
        for (const word of words) {
            const lower = word.toLowerCase();
            if (commonMisspellings[lower]) {
                results.push({
                    message: `Possible spelling error: "${word}"`,
                    suggestion: `Did you mean "${commonMisspellings[lower]}"?`,
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }

    checkHonorifics(text, ctx) {
        const honorifics = /\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sr\.|Jr\.)/gi;
        const matches = text.match(honorifics);

        if (matches) {
            return [{
                message: `Honorific detected: ${matches.join(', ')}. Remove for inclusivity.`,
                suggestion: 'Use first name or full name without honorific',
                line: ctx.lineNumber
            }];
        }

        return [];
    }

    checkPlaceholder(text, ctx) {
        const results = [];
        const placeholders = [
            /lorem ipsum/i,
            /dolor sit amet/i,
            /\bTODO\b/,
            /\bTBD\b/,
            /\bFIXME\b/,
            /placeholder/i,
            /\[.*?\]/,
            /{{.*?}}/,
            /xxx+/i
        ];

        for (const pattern of placeholders) {
            if (pattern.test(text)) {
                results.push({
                    message: `Placeholder text detected: ${text.match(pattern)?.[0]}`,
                    suggestion: 'Replace with actual content',
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }

    checkGrammar(text, ctx) {
        const results = [];
        const grammarRules = [
            { pattern: /\byour\s+welcome\b/i, correct: "you're welcome", message: 'Should be "you\'re welcome" (you are)' },
            { pattern: /\bcould\s+of\b/i, correct: 'could have', message: 'Should be "could have"' },
            { pattern: /\bshould\s+of\b/i, correct: 'should have', message: 'Should be "should have"' },
            { pattern: /\bwould\s+of\b/i, correct: 'would have', message: 'Should be "would have"' }
        ];

        for (const rule of grammarRules) {
            if (rule.pattern.test(text)) {
                results.push({
                    message: `Grammar issue: ${rule.message}`,
                    suggestion: rule.correct,
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }

    checkCapitalization(text, ctx) {
        const results = [];
        const sentences = text.split(/[.!?]+\s+/);
        
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
                results.push({
                    message: `Sentence should start with capital letter: "${trimmed.substring(0, 30)}..."`,
                    suggestion: 'Capitalize first letter',
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }
}

async function main() {
    const file = process.argv[2];
    
    if (!file) {
        console.error('Usage: validate-file.js <filename>');
        process.exit(1);
    }

    if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
    }

    const content = fs.readFileSync(file, 'utf8');
    const validator = new ContentValidator();
    const issues = await validator.validateContent(content, file);

    if (issues.length === 0) {
        console.log(`✅ ${file} - No issues found`);
        return;
    }

    console.log(`\n❌ ${file} - Found ${issues.length} issue(s):\n`);
    
    issues.forEach(issue => {
        const emoji = { critical: '🔴', high: '🟡', medium: '🔵', low: '🟠' }[issue.severity];
        console.log(`${emoji} Line ${issue.line}: ${issue.message}`);
        if (issue.suggestion) {
            console.log(`   💡 ${issue.suggestion}`);
        }
    });

    process.exit(1);
}

main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});
