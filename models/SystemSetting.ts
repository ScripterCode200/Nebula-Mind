import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
    key: string;
    value: any;
    alphaMode?: boolean; // Added based on the snippet
    maintenanceMode?: boolean; // Added based on the snippet
    aiModel?: string; // Added
    antiCheatEnabled?: boolean; // Added
    enableDirectCaptions?: boolean; // Strategy 1 Toggle
}

const SystemSettingSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    alphaMode: { type: Boolean, default: false }, // Added
    maintenanceMode: { type: Boolean, default: false }, // Added
    aiModel: { type: String, default: 'gemini-2.5-flash' }, // Added
    antiCheatEnabled: { type: Boolean, default: true }, // Added - Default ON
    enableDirectCaptions: { type: Boolean, default: false } // Compliance Default: OFF
});

export default mongoose.models.SystemSetting || mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
