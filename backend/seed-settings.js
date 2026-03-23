require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { globSync } = require('glob');
const fs = require('fs');
const path = require('path');

// Import model definition directly to avoid require issues if index.js is complex
const Schema = mongoose.Schema;
const settingSchema = new Schema({
    removed: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    settingCategory: { type: String, required: true },
    settingKey: { type: String, required: true },
    settingValue: { type: mongoose.Schema.Types.Mixed },
    valueType: { type: String, default: 'String' },
    isPrivate: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
});

const Setting = mongoose.model('Setting', settingSchema);

mongoose.connect(process.env.DATABASE);

async function seedSettings() {
    try {
        console.log('Connecting to database...');

        // Check if settings exist
        const count = await Setting.countDocuments();
        if (count > 0) {
            console.log(`Database already contains ${count} settings. Skipping seed.`);
            process.exit(0);
        }

        console.log('Seeding default settings...');
        const settingFiles = [];
        const pattern = './src/setup/defaultSettings/**/*.json';
        const settingsFiles = globSync(pattern);

        for (const filePath of settingsFiles) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const settings = JSON.parse(fileContent);
            settingFiles.push(...settings);
        }

        if (settingFiles.length === 0) {
            console.log('No default settings found in ./src/setup/defaultSettings');
            process.exit(1);
        }

        await Setting.insertMany(settingFiles);

        console.log(`SUCCESS: Created ${settingFiles.length} settings!`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding settings:', error);
        process.exit(1);
    }
}

seedSettings();
