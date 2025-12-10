async function test() {
    try {
        console.log('Trying require("pdf-parse/lib/pdf-parse.js")...');
        const pdf1 = require('pdf-parse/lib/pdf-parse.js');
        console.log('Type:', typeof pdf1);
        if (typeof pdf1 === 'function') console.log('Found it!');
    } catch (e) { console.log('Failed:', e.message); }

    try {
        console.log('Trying require("pdf-parse/index.js")...');
        const pdf2 = require('pdf-parse/index.js');
        console.log('Type:', typeof pdf2);
        if (typeof pdf2 === 'function') console.log('Found it!');
    } catch (e) { console.log('Failed:', e.message); }
}

test();
