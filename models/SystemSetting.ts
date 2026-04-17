import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
    key: string;
    value: any;
    alphaMode?: boolean; // Added based on the snippet
    maintenanceMode?: boolean; // Added based on the snippet
    aiModel?: string; // Added
    useVertexAI?: boolean; // Toggle between Vertex AI and Standard Gemini API
    antiCheatEnabled?: boolean; // Added
    enableDirectCaptions?: boolean; // Strategy 1 Toggle
    enableAutoDailyGoals?: boolean; // Added for Automatic Goal Generation Control
    enableArtificialProxy?: boolean; // Toggles whether to use artificial proxy list vs local server IP
    orchestratorVisualType?: 'svg' | 'image'; // Topic visualization preference
}

const SystemSettingSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    alphaMode: { type: Boolean, default: false }, // Added
    maintenanceMode: { type: Boolean, default: false }, // Added
    aiModel: { type: String, default: 'gemini-2.0-flash-001' }, // Standardizing on the 2.0 Flash Backbone
    useVertexAI: { type: Boolean, default: false }, // Default to standard Gemini due to Vertex expiration
    antiCheatEnabled: { type: Boolean, default: true }, // Added - Default ON
    enableDirectCaptions: { type: Boolean, default: false }, // Compliance Default: OFF
    enableAutoDailyGoals: { type: Boolean, default: true }, // Default ON
    enableArtificialProxy: { type: Boolean, default: true }, // Default ON
    orchestratorVisualType: { type: String, enum: ['svg', 'image'], default: 'svg' }
});

export default mongoose.models.SystemSetting || mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
