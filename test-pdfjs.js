async function test() {
    try {
        console.log('Importing pdfjs-dist...');
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Disable worker for Node.js environment
        pdfjsLib.GlobalWorkerOptions.workerSrc = false;

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
