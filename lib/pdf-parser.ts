// Robust DOMMatrix Polyfill
if (typeof DOMMatrix === 'undefined') {
    // @ts-ignore
    // @ts-ignore
    global.DOMMatrix = function DOMMatrix(arg?: any) {
        // Allow calling as function (factory) or constructor
        if (!(this instanceof DOMMatrix)) {
            // @ts-ignore
            return new DOMMatrix(arg);
        }

        const self = this as any;

        // Initialize identity matrix
        self.a = 1; self.b = 0; self.c = 0; self.d = 1; self.e = 0; self.f = 0;

        // Mock methods required by pdf.js
        self.translate = function () { return self; };
        self.scale = function () { return self; };
        self.rotate = function () { return self; };
        self.multiply = function () { return self; };
        self.transformPoint = function (p: any) { return p; };
        self.inverse = function () { return self; };
        self.toString = function () { return "matrix(1, 0, 0, 1, 0, 0)"; };

        return self;
    };
}

export async function parsePDF(buffer: Buffer): Promise<string> {
    try {
        console.log('[PDF Parser] Loading pdf-parse...');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfLib = require('pdf-parse');

        // Handle different export structures
        let pdfFunc = pdfLib;
        if (typeof pdfLib.PDFParse === 'function') {
            pdfFunc = pdfLib.PDFParse;
        } else if (typeof pdfLib.default === 'function') {
            pdfFunc = pdfLib.default;
        }

        if (typeof pdfFunc !== 'function') {
            throw new Error(`pdf-parse is not a function. Type: ${typeof pdfFunc}`);
        }

        console.log('[PDF Parser] Parsing buffer of size:', buffer.length);
        const data = await pdfFunc(buffer);

        const text = data.text.trim();
        console.log(`[PDF Parser] Extracted text length: ${text.length}`);
        if (text.length > 0) {
            console.log(`[PDF Parser] Text preview: ${text.substring(0, 100)}...`);
        }

        return text;
    } catch (error) {
        console.error('Error parsing PDF with pdf-parse:', error);
        // Fallback
        const sizeInKB = (buffer.length / 1024).toFixed(2);
        return `PDF document received (${sizeInKB} KB). Text extraction failed. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
}
