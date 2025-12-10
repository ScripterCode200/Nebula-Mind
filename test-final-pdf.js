const path = require('path');
const { pathToFileURL } = require('url');

async function test() {
    try {
        console.log('Importing pdfjs-dist...');
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Set worker path
        const workerPath = path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
        console.log('Worker set');

        console.log('Fetching PDF...');
        const response = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Loading PDF...');
        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;
        console.log('PDF loaded. Pages:', pdf.numPages);

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        console.log('Extracted text:', fullText.trim());
        console.log('\nSUCCESS! This is the exact code now in lib/pdf-parser.ts');
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
