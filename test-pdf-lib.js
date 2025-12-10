const { PDFDocument } = require('pdf-lib');

async function test() {
    try {
        console.log('Fetching PDF...');
        const response = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        const arrayBuffer = await response.arrayBuffer();

        console.log('Loading PDF with pdf-lib...');
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = pdfDoc.getPages();

        console.log('PDF loaded. Pages:', pages.length);

        // pdf-lib is primarily for creating/modifying PDFs, not extracting text
        // But let's check if it has text extraction capabilities
        console.log('Note: pdf-lib is designed for PDF creation/modification, not text extraction');
        console.log('For text extraction, we need a different approach');

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
