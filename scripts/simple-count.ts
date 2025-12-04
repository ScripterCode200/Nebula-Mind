import dbConnect from '@/lib/db';
import Notebook from '@/models/Notebook';

async function simpleCount() {
    try {
        await dbConnect();
        const count = await Notebook.countDocuments({});
        console.log(`Total notebooks: ${count}`);
    } catch (e) {
        console.error(e);
    }
}

simpleCount().catch(console.error).finally(() => process.exit());
