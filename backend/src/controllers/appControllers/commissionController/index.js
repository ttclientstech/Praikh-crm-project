const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

function modelController() {
    const methods = createCRUDController('Commission');

    methods.update = async (req, res) => {
        try {
            const { id } = req.params;
            // Restrict updates to only 'name' and 'project'
            const { name, project } = req.body;

            const Model = mongoose.model('Commission');

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (project !== undefined) updateData.project = project;

            updateData.updated = Date.now();

            const result = await Model.findOneAndUpdate(
                { _id: id, removed: false },
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Commission not found',
                });
            }

            return res.status(200).json({
                success: true,
                result,
                message: 'Commission updated successfully',
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                error: error.message
            });
        }
    };

    methods.listAll = async (req, res) => {
        const Model = mongoose.model('Commission');
        const result = await Model.find({ removed: false, enabled: true }).sort({ created: 'desc' }).exec();
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                result,
                message: 'Successfully found all documents',
            });
        } else {
            return res.status(203).json({
                success: false,
                result: [],
                message: 'Collection is Empty',
            });
        }
    };

    methods.verifyAccessCode = async (req, res) => {
        try {
            const { accessCode } = req.body;
            const Setting = mongoose.model('Setting');
            const setting = await Setting.findOne({ settingKey: 'commission_access_code' });

            const validCode = setting ? setting.settingValue : 'PARIKH2026';

            if (accessCode === validCode) {
                return res.status(200).json({
                    success: true,
                    result: {
                        isVerified: true,
                    },
                    message: 'Access Granted',
                });
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid Access Code',
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error',
            });
        }
    };

    methods.updateAccessCode = async (req, res) => {
        try {
            const { newAccessCode } = req.body;
            const Setting = mongoose.model('Setting');

            await Setting.findOneAndUpdate(
                { settingKey: 'commission_access_code' },
                {
                    settingCategory: 'commission',
                    settingKey: 'commission_access_code',
                    settingValue: newAccessCode,
                    valueType: 'String'
                },
                { upsert: true, new: true }
            );

            return res.status(200).json({
                success: true,
                message: 'Access Code Updated Successfully',
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update access code',
            });
        }
    };

    methods.getCustomLocations = async (req, res) => {
        try {
            const Setting = mongoose.model('Setting');
            const setting = await Setting.findOne({ settingKey: 'custom_locations' });

            return res.status(200).json({
                success: true,
                result: setting ? setting.settingValue : { states: [], cities: {} }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal Server Error',
            });
        }
    };

    methods.addCustomLocation = async (req, res) => {
        try {
            const { type, value, parentState } = req.body; // type: 'state' or 'city'
            const Setting = mongoose.model('Setting');

            let setting = await Setting.findOne({ settingKey: 'custom_locations' });
            let data = setting ? setting.settingValue : { states: [], cities: {} };

            // Ensure structure
            if (!data.states) data.states = [];
            if (!data.cities) data.cities = {};

            if (type === 'state') {
                if (!data.states.includes(value)) {
                    data.states.push(value);
                    // Init cities for this state
                    if (!data.cities[value]) data.cities[value] = [];
                }
            } else if (type === 'city') {
                if (parentState) {
                    if (!data.cities[parentState]) data.cities[parentState] = [];
                    if (!data.cities[parentState].includes(value)) {
                        data.cities[parentState].push(value);
                    }
                }
            }

            await Setting.findOneAndUpdate(
                { settingKey: 'custom_locations' },
                {
                    settingCategory: 'general',
                    settingKey: 'custom_locations',
                    settingValue: data,
                    valueType: 'JSON'
                },
                { upsert: true, new: true }
            );

            return res.status(200).json({
                success: true,
                message: 'Location Added Successfully',
                result: data
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to add location',
            });
        }
    };

    return methods;
}

module.exports = modelController();
