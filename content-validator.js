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
        
        // Comprehensive list of commonly misspelled words
        // Focused on words that are almost always errors (not technical terms)
        const commonMisspellings = {
            // Very common typos
            'teh': 'the', 'ahd': 'and', 'adn': 'and', 'fo': 'of', 'ont': 'not',
            'hte': 'the', 'taht': 'that', 'thsi': 'this', 'whcih': 'which',
            'wich': 'which', 'wtih': 'with', 'wiht': 'with', 'form': 'from',
            'fro': 'for', 'yuor': 'your', 'yoru': 'your', 'thier': 'their',
            
            // ie/ei confusion
            'recieve': 'receive', 'beleive': 'believe', 'acheive': 'achieve',
            'breif': 'brief', 'cheif': 'chief', 'feild': 'field',
            'freind': 'friend', 'nieghbor': 'neighbor', 'seize': 'seize',
            'wierd': 'weird', 'yeild': 'yield',
            
            // Double letters
            'occured': 'occurred', 'occuring': 'occurring', 'begining': 'beginning',
            'comming': 'coming', 'runing': 'running', 'stoping': 'stopping',
            'geting': 'getting', 'puting': 'putting', 'writting': 'writing',
            'planing': 'planning', 'prefered': 'preferred', 'refered': 'referred',
            'transfered': 'transferred', 'omited': 'omitted', 'submited': 'submitted',
            
            // -ance/-ence confusion
            'appearence': 'appearance', 'occurance': 'occurrence', 'existance': 'existence',
            'persistance': 'persistence', 'resistance': 'resistance', 'independance': 'independence',
            
            // -able/-ible confusion
            'responsable': 'responsible', 'accessable': 'accessible', 'compatabile': 'compatible',
            
            // Commonly confused
            'seperate': 'separate', 'definately': 'definitely', 'defiantly': 'definitely',
            'accomodate': 'accommodate', 'calender': 'calendar', 'collegue': 'colleague',
            'goverment': 'government', 'untill': 'until', 'sucessful': 'successful',
            'succesful': 'successful', 'adress': 'address', 'embarass': 'embarrass',
            'harrass': 'harass', 'occassion': 'occasion', 'necesary': 'necessary',
            'neccessary': 'necessary', 'recomend': 'recommend', 'commited': 'committed',
            'finaly': 'finally', 'realy': 'really', 'basicly': 'basically',
            
            // Other frequent mistakes
            'arguement': 'argument', 'enviroment': 'environment', 'managment': 'management',
            'ususally': 'usually', 'usualy': 'usually', 'libary': 'library',
            'Febuary': 'February', 'Wenesday': 'Wednesday', 'tommorow': 'tomorrow',
            'tounge': 'tongue', 'speach': 'speech', 'awsome': 'awesome',
            'wierd': 'weird', 'gaurd': 'guard', 'peice': 'piece',
            'foriegn': 'foreign', 'heighth': 'height', 'theif': 'thief',
            'cheif': 'chief', 'yeild': 'yield', 'sieze': 'seize',
            'liesure': 'leisure', 'posession': 'possession', 'profesion': 'profession',
            'refrence': 'reference', 'pronounciation': 'pronunciation', 'ect': 'etc',
            'alot': 'a lot', 'noone': 'no one', 'eachother': 'each other',
            
            // Technical writing mistakes
            'alowed': 'allowed', 'occassionally': 'occasionally', 'maintenence': 'maintenance',
            'existant': 'existent', 'dependant': 'dependent', 'consistant': 'consistent',
            'persistant': 'persistent', 'apparant': 'apparent', 'suprise': 'surprise',
            'goverment': 'government', 'publically': 'publicly', 'acknowlege': 'acknowledge',
            'knowlege': 'knowledge', 'privelege': 'privilege', 'sacrafice': 'sacrifice',
            'tendancy': 'tendency', 'liason': 'liaison', 'millenium': 'millennium'
        };

        // Skip spell checking for code-like patterns
        // Don't check lines that look like code
        if (this.isCodeLike(text)) {
            return results;
        }

        const words = text.match(/\b[a-zA-Z]+\b/g) || [];
        
        for (const word of words) {
            const lower = word.toLowerCase();
            if (commonMisspellings[lower]) {
                results.push({
                    message: `Spelling error: "${word}"`,
                    suggestion: `Did you mean "${commonMisspellings[lower]}"?`,
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }

    isCodeLike(text) {
        // Skip lines that look like code patterns
        const codePatterns = [
            /^[\s]*[\{\}\[\]\(\);]/, // Starts with brackets/braces
            /^[\s]*const\s/, /^[\s]*let\s/, /^[\s]*var\s/, // Variable declarations
            /^[\s]*function\s/, /^[\s]*class\s/, // Function/class definitions
            /^[\s]*import\s/, /^[\s]*export\s/, // ES6 imports
            /^[\s]*\/\//, /^[\s]*\/\*/, /^[\s]*\*/, // Comments (already code)
            /[a-z]+[A-Z]/, // camelCase
            /\w+-\w+-\w+/, // kebab-case with multiple dashes
            /^[\s]*\$/, // Shell/jQuery
            /:[\s]*[{'"[]/, // JSON-like
            /=[\s]*[{'"[]/, // Object assignment
        ];

        return codePatterns.some(pattern => pattern.test(text));
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
