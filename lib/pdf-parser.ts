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
    return new Promise((resolve, reject) => {
        // Timeout safety
        const timeout = setTimeout(() => {
            console.warn('[PDF Parser] Parsing timed out after 20s');
            resolve('PDF text extraction timed out.');
        }, 20000);

        try {
            console.log('[PDF Parser] Loading pdf2json...');
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const PDFParser = require('pdf2json');
            const pdfParser = new PDFParser(null, 1); // 1 = text mode

            pdfParser.on("pdfParser_dataError", (errData: any) => {
                clearTimeout(timeout);
                console.error('[PDF Parser] Data Error:', errData.parserError);
                reject(new Error(errData.parserError));
            });

            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                clearTimeout(timeout);
                try {
                    // Extract text from the raw data
                    // pdf2json returns a complex object. We need to walk through pages -> texts -> R (array of text runs) -> T (URI encoded text)
                    let extractedText = '';

                    const pages = pdfData.Pages || [];
                    console.log(`[PDF Parser] Pages found: ${pages.length}`);

                    pages.forEach((page: any) => {
                        const texts = page.Texts || [];
                        texts.forEach((textItem: any) => {
                            const R = textItem.R || [];
                            R.forEach((run: any) => {
                                if (run.T) {
                                    // Decode URI encoded text safely
                                    try {
                                        extractedText += decodeURIComponent(run.T) + ' ';
                                    } catch (e) {
                                        // Fallback for malformed URI sequences
                                        extractedText += run.T + ' ';
                                    }
                                }
                            });
                        });
                        extractedText += '\n'; // Page break
                    });

                    extractedText = extractedText.trim();
                    console.log(`[PDF Parser] Extracted text length: ${extractedText.length}`);
                    if (extractedText.length > 0) {
                        console.log(`[PDF Parser] Text preview: ${extractedText.substring(0, 100)}...`);
                    } else {
                        console.warn('[PDF Parser] Extracted 0 characters.');
                    }

                    resolve(extractedText);
                } catch (err) {
                    console.error('[PDF Parser] Error processing parsed data:', err);
                    reject(err);
                }
            });

            console.log('[PDF Parser] Parsing buffer of size:', buffer.length);
            pdfParser.parseBuffer(buffer);

        } catch (error) {
            clearTimeout(timeout);
            console.error('Error initializing pdf2json:', error);
            // Fallback
            const sizeInKB = (buffer.length / 1024).toFixed(2);
            resolve(`PDF document received (${sizeInKB} KB). Text extraction failed. Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}
