const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/Omkar Patil/Music/CRM/Solar-CRM-Project/backend/.env' });

async function checkProject() {
    try {
        await mongoose.connect(process.env.DATABASE);
        console.log('Connected to DB');

        const SolarProject = require('./src/models/appModels/SolarProject');

        // Find the most recent project or a specific one if possible
        const project = await SolarProject.findOne().sort({ updated: -1 }); // Get latest updated

        if (project) {
            console.log('Project ID:', project._id);
            console.log('Client:', project.client);
            console.log('Completion Details:', JSON.stringify(project.completionDetails, null, 2));
        } else {
            console.log('No project found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkProject();
