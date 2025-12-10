const pdfLib = require('pdf-parse');

async function test() {
    console.log('Keys:', Object.keys(pdfLib));

    // Check if PDFParse is the function
    if (typeof pdfLib.PDFParse === 'function') {
        console.log('pdfLib.PDFParse is a function!');
    } else {
        console.log('pdfLib.PDFParse is type:', typeof pdfLib.PDFParse);
    }

    // Try to find ANY function
    for (const key of Object.keys(pdfLib)) {
        if (typeof pdfLib[key] === 'function') {
            console.log(`Found function: ${key}`);
        }
    }
}

test();
