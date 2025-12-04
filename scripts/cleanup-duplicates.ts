import dbConnect from '@/lib/db';
import Notebook from '@/models/Notebook';

async function cleanupDuplicates() {
    await dbConnect();

    const notebooks = await Notebook.find({}).sort({ createdAt: 1 }); // Oldest first
    const seen = new Set();
    const duplicates = [];

    for (const notebook of notebooks) {
        const key = `${notebook.userId}-${notebook.title}`;
        if (seen.has(key)) {
            duplicates.push(notebook._id);
        } else {
            seen.add(key);
        }
    }

    console.log(`Found ${duplicates.length} duplicates to delete.`);

    if (duplicates.length > 0) {
        const res = await Notebook.deleteMany({ _id: { $in: duplicates } });
        console.log(`Deleted ${res.deletedCount} duplicate notebooks.`);
    }
}

cleanupDuplicates().catch(console.error).finally(() => process.exit());
