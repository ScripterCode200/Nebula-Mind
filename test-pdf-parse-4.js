const pdfLib = require('pdf-parse');

// Polyfill DOMMatrix
if (typeof DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
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

async function test() {
    console.log('Type of PDFParse:', typeof pdfLib.PDFParse);

    try {
        const response = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Calling pdfLib.PDFParse(buffer)...');
        // Try calling it as a function
        // Note: pdf-parse usually returns a promise
        const data = await pdfLib.PDFParse(buffer);
        console.log('Success! Text length:', data.text.length);
    } catch (e) {
        console.log('Error calling PDFParse:', e.message);

        // Try new PDFParse?
        try {
            console.log('Trying new pdfLib.PDFParse(buffer)...');
            const parser = new pdfLib.PDFParse();
            // This might not be how it works
        } catch (e2) {
            console.log('Error creating new PDFParse:', e2.message);
        }
    }
}

test();
