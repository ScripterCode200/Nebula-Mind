const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function test() {
    try {
        console.log('Downloading dummy PDF...');
        const response = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        if (!response.ok) throw new Error('Failed to download PDF');

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('PDF downloaded. Size:', buffer.length);

        // Convert Buffer to Uint8Array
        const uint8Array = new Uint8Array(buffer);

        console.log('Loading PDF document...');
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const doc = await loadingTask.promise;

        console.log('PDF loaded. Pages:', doc.numPages);

        let fullText = '';

        for (let i = 1; i <= doc.numPages; i++) {
            console.log(`Processing page ${i}...`);
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        console.log('Extraction complete!');
        console.log('Text length:', fullText.length);
        console.log('Text preview:', fullText.substring(0, 100));

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
