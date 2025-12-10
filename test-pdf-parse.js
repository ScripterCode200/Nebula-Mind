const pdfLib = require('pdf-parse');
console.log('pdf-parse export type:', typeof pdfLib);
console.log('pdf-parse export keys:', Object.keys(pdfLib));
console.log('pdf-parse default:', pdfLib.default);
const pdf = pdfLib.default || pdfLib;

async function testPdfParse() {
    console.log('Testing pdf-parse...');

    // Polyfill DOMMatrix if needed (mimicking the route.ts fix)
    if (typeof DOMMatrix === 'undefined') {
        global.DOMMatrix = class DOMMatrix {
            constructor() { }
            translate() { return this; }
            scale() { return this; }
            rotate() { return this; }
            multiply() { return this; }
            transformPoint(p) { return p; }
            inverse() { return this; }
            toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
        };
    }

    try {
        // Fetch dummy PDF
        const response = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await pdf(buffer);
        console.log('Success! Text length:', data.text.length);
        console.log('Preview:', data.text.substring(0, 100));
    } catch (error) {
        console.error('Error:', error);
    }
}

testPdfParse();
