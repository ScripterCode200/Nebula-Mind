const path = require('path');
const { pathToFileURL } = require('url');

async function test() {
    try {
        console.log('Importing pdfjs-dist...');
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Set worker path
        const workerPath = path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
        console.log('Worker set to:', pdfjsLib.GlobalWorkerOptions.workerSrc);

        console.log('Loading PDF...');
        const loadingTask = pdfjsLib.getDocument('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        const pdf = await loadingTask.promise;
        console.log('PDF loaded. Pages:', pdf.numPages);

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        console.log('Text extracted:', fullText.trim());
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
