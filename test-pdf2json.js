const fs = require('fs');
const PDFParser = require("pdf2json");

async function test() {
    try {
        console.log('Downloading dummy PDF...');
        const response = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
        if (!response.ok) throw new Error('Failed to download PDF');

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('PDF downloaded. Size:', buffer.length);

        const pdfParser = new PDFParser(this, 1); // 1 = text only

        pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            console.log('Parsed successfully!');
            // pdfData is the raw data, we need to extract text from it
            // But with option 1 (text only), it might be different.
            // Actually, pdf2json returns a JSON object representing the PDF.
            // We need to extract text from pages.

            const rawText = pdfParser.getRawTextContent();
            console.log('Raw text length:', rawText.length);
            console.log('Raw text preview:', rawText.substring(0, 100));
        });

        pdfParser.parseBuffer(buffer);

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
