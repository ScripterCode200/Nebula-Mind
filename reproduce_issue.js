// Polyfill DOMMatrix
console.log('Initial DOMMatrix type:', typeof DOMMatrix);

// Force polyfill or wrap native to allow call without new
// pdf-parse often calls DOMMatrix() without new, which fails with native class
global.DOMMatrix = class DOMMatrixPolyfill {
    constructor() {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    multiply() { return this; }
    transformPoint(p) { return p; }
    inverse() { return this; }
    toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
};

// Allow call without new
const OriginalDOMMatrix = global.DOMMatrix;
global.DOMMatrix = function () {
    return new OriginalDOMMatrix();
}
// Copy prototype so instanceof works if needed (though pdf-parse might not check)
global.DOMMatrix.prototype = OriginalDOMMatrix.prototype;


const pdf = require('pdf-parse');

async function test() {
    try {
        console.log('Downloading dummy PDF...');
        const response = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        if (!response.ok) throw new Error('Failed to download PDF');

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('PDF downloaded. Size:', buffer.length);

        const pdfLib = require('pdf-parse');
        let pdfFunc = pdfLib;
        if (typeof pdfLib.PDFParse === 'function') {
            pdfFunc = pdfLib.PDFParse;
            console.log('Using pdfLib.PDFParse');
        } else if (typeof pdfLib.default === 'function') {
            pdfFunc = pdfLib.default;
            console.log('Using pdfLib.default');
        } else {
            console.log('Using pdfLib directly');
        }

        if (typeof pdfFunc !== 'function') {
            throw new Error(`pdf-parse is not a function. Type: ${typeof pdfFunc}`);
        }

        console.log('Parsing PDF...');
        let data;
        try {
            data = await pdfFunc(buffer);
        } catch (e) {
            console.log('Caught error:', e.message);
            if (e.message.includes("Class constructors cannot be invoked without 'new'")) {
                console.log('Caught class constructor error, trying with new...');
                // @ts-ignore
                data = await new pdfFunc(buffer);
            } else {
                throw e;
            }
        }

        console.log('Parsed successfully!');
        if (typeof data.getPageText === 'function') {
            console.log('Calling getPageText(1)... (1-based index usually)');
            try {
                const text = await data.getPageText(1);
                console.log('Page 1 Text length:', text.length);
                console.log('Page 1 Text preview:', text.substring(0, 100));
            } catch (e) {
                console.log('getPageText(1) failed:', e.message);
                try {
                    console.log('Trying getPageText(0)...');
                    const text = await data.getPageText(0);
                    console.log('Page 0 Text length:', text.length);
                    console.log('Page 0 Text preview:', text.substring(0, 100));
                } catch (e2) {
                    console.log('getPageText(0) failed:', e2.message);
                }
            }
        } else {
            console.log('Data does not have getPageText method.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
