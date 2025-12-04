import dbConnect from '@/lib/db';
import Notebook from '@/models/Notebook';

async function cleanup() {
    await dbConnect();
    console.log('Connected to DB');

    const notebooks = await Notebook.find({}).sort({ createdAt: 1 });
    console.log(`Fetched ${notebooks.length} notebooks`);

    const seen = new Set();
    const toDelete = [];

    for (const n of notebooks) {
        // key = userId + title (assuming userId is present, otherwise just title)
        const key = `${n.userId}-${n.title}`;
        if (seen.has(key)) {
            console.log(`Duplicate found: ${n.title} (${n._id})`);
            toDelete.push(n._id);
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} duplicates...`);
        await Notebook.deleteMany({ _id: { $in: toDelete } });
        console.log('Done.');
    } else {
        console.log('No duplicates found.');
    }
}

cleanup().catch(console.error).finally(() => process.exit());
