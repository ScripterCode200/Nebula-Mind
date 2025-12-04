import dbConnect from '@/lib/db';
import Notebook from '@/models/Notebook';
import User from '@/models/User';

async function checkDuplicates() {
    await dbConnect();

    // Find the user (assuming single user or we can list all)
    // For now, let's just list all notebooks and group by name
    const notebooks = await Notebook.find({}).sort({ createdAt: -1 });

    console.log(`Total Notebooks: ${notebooks.length}`);

    const counts: Record<string, number> = {};
    notebooks.forEach(n => {
        counts[n.name] = (counts[n.name] || 0) + 1;
    });

    console.log('Duplicate Counts:');
    for (const [name, count] of Object.entries(counts)) {
        if (count > 1) {
            console.log(`- "${name}": ${count} copies`);
            // Print timestamps of the first few to see if they are simultaneous
            const copies = notebooks.filter(n => n.name === name);
            copies.forEach(c => console.log(`  - Created at: ${c.createdAt}`));
        }
    }
}

checkDuplicates().catch(console.error).finally(() => process.exit());
