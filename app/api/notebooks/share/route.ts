import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Notebook from '@/models/Notebook';
import User from '@/models/User';
import NotificationModel from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const auth = await verifyAuth(req);

        if (!auth || !auth.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = auth.userId;

        // Get sender details for the notification
        const sender = await User.findById(userId).select('name').lean();
        const senderName = sender?.name || 'A user';

        const { notebookId, recipientIds } = await req.json();

        if (!notebookId || !recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
            return NextResponse.json({ error: 'Missing notebook or recipients' }, { status: 400 });
        }

        try {
            const log = `
Time: ${new Date().toISOString()}
Sender: ${userId}
Notebook: ${notebookId}
Recipients: ${JSON.stringify(recipientIds)}
             `;
            fs.appendFileSync(path.join(process.cwd(), 'debug-share.log'), log);
        } catch (e) { }

        // 1. Verify Notebook Ownership
        const notebook = await Notebook.findOne({ _id: notebookId, userId });
        if (!notebook) {
            try { fs.appendFileSync(path.join(process.cwd(), 'debug-share.log'), `ERROR: Notebook found? NO. (Ownership check failed)\n`); } catch (e) { }
            console.error(`Share failed: Notebook ${notebookId} not found or user ${userId} not owner.`);
            return NextResponse.json({ error: 'Notebook not found or you do not have permission to share it.' }, { status: 404 });
        }
        try { fs.appendFileSync(path.join(process.cwd(), 'debug-share.log'), `Notebook Found: ${notebook.title}\n`); } catch (e) { }

        // 2. Process Recipients
        const results = [];
        for (const recipientId of recipientIds) {
            // Verify Recipient exists
            const recipient = await User.findById(recipientId).select('_id name');
            if (!recipient) {
                results.push({ id: recipientId, status: 'failed', reason: 'User not found' });
                continue;
            }

            if (recipient._id.toString() === userId) {
                results.push({ id: recipientId, status: 'failed', reason: 'Cannot share with self' });
                continue;
            }

            // Check if already shared
            // Check if already shared
            const isAlreadyShared = (notebook.sharedWith || []).some((share: any) => share.userId === recipientId);
            if (isAlreadyShared) {
                results.push({ id: recipientId, status: 'skipped', reason: 'Already shared' });
                continue;
            }

            // Update Notebook using native driver
            const updateResult = await Notebook.collection.updateOne(
                { _id: new mongoose.Types.ObjectId(notebookId) },
                {
                    $addToSet: {
                        sharedWith: {
                            userId: recipientId,
                            sharedAt: new Date(),
                            permission: 'view'
                        }
                    }
                }
            );

            console.log(`Shared with ${recipientId}.`);
            try { fs.appendFileSync(path.join(process.cwd(), 'debug-share.log'), `Native Update Result for ${recipientId}: ${JSON.stringify(updateResult)}\n`); } catch (e) { }

            // Create Notification
            await NotificationModel.create({
                recipientId: recipientId,
                senderId: userId,
                title: 'New Shared Notebook',
                message: `${senderName} shared "${notebook.title}" with you.`,
                type: 'SHARE_NOTEBOOK',
                notebookId: notebookId,
                link: `/notebook/${notebookId}`
            });

            results.push({ id: recipientId, status: 'success' });
        }

        // ... existing code ...
        try { fs.appendFileSync(path.join(process.cwd(), 'debug-share.log'), `Results: ${JSON.stringify(results)}\n`); } catch (e) { }
        return NextResponse.json({ success: true, results, message: 'Notebook shared successfully!' });

    } catch (error) {
        try { fs.appendFileSync(path.join(process.cwd(), 'debug-share.log'), `EXCEPTION: ${error}\n`); } catch (e) { }
        console.error('Share Notebook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
