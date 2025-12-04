import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
    key: string;
    value: any;
    alphaMode?: boolean; // Added based on the snippet
    maintenanceMode?: boolean; // Added based on the snippet
}

const SystemSettingSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    alphaMode: { type: Boolean, default: false }, // Added
    maintenanceMode: { type: Boolean, default: false } // Added
});

export default mongoose.models.SystemSetting || mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
