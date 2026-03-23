require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');
const Admin = require('./src/models/coreModels/Admin');
const AdminPassword = require('./src/models/coreModels/AdminPassword');

mongoose.connect(process.env.DATABASE);

async function createAdmin() {
    try {
        console.log('Connecting to database...');
        // specific user
        const email = 'admin@gmail.com';
        const password = 'admin123';
        const name = 'Admin';
        const surname = 'User';

        console.log(`Checking if user ${email} exists...`);
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            console.log('Admin with this email already exists.');
            process.exit(0);
        }

        console.log('Creating new Admin document...');
        const newAdmin = new Admin({
            email,
            name,
            surname,
            enabled: true,
            role: 'owner'
        });

        const savedAdmin = await newAdmin.save();
        console.log('Admin saved:', savedAdmin._id);

        console.log('Generatng password hash...');
        const newAdminPassword = new AdminPassword();
        const salt = uniqueId();
        const passwordHash = newAdminPassword.generateHash(salt, password);

        const passwordData = {
            password: passwordHash,
            emailVerified: true,
            salt: salt,
            user: savedAdmin._id
        };

        await new AdminPassword(passwordData).save();

        console.log(`\nSUCCESS: Admin user created successfully!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
