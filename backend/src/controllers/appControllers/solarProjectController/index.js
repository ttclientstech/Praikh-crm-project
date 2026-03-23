const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('SolarProject');



// Override the summary method to provide Dashboard Stats
methods.summary = async (req, res) => {
    try {
        const Model = mongoose.model('SolarProject');
        const { state, city } = req.query;

        let query = { removed: false };
        if (state) query.projectState = { $regex: new RegExp(state, 'i') };
        if (city) query.villageCity = { $regex: new RegExp(city, 'i') }; // Filter by villageCity as used in Frontend

        // 1. Total Projects
        const totalProjects = await Model.countDocuments(query);

        // 2. Completed Sites
        const completedQuery = {
            ...query,
            $or: [
                { status: 'Completed' },
                { 'completionDetails.isInstallationCompleted': true }
            ]
        };
        const completedProjects = await Model.countDocuments(completedQuery);

        // 3. Work Completed Percentage
        const workCompletedPercentage = totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(2) : 0;

        // 4. Total Pending Work
        const pendingProjects = totalProjects - completedProjects;

        // 5. Total Receivable Payment
        const financialStats = await Model.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: "$paymentDetails.totalProjectCost" },
                    totalAdvance: { $sum: { $sum: "$paymentDetails.advancePayments.amount" } },
                    totalLoanCredited: { $sum: "$paymentDetails.loanCreditedAmount" }
                }
            }
        ]);

        let totalReceivable = 0;
        if (financialStats.length > 0) {
            const stats = financialStats[0];
            const totalReceived = (stats.totalAdvance || 0) + (stats.totalLoanCredited || 0);
            totalReceivable = (stats.totalCost || 0) - totalReceived;
        }

        return res.status(200).json({
            success: true,
            result: {
                totalProjects,
                completedProjects,
                workCompletedPercentage,
                pendingProjects,
                totalReceivable
            },
            message: 'Dashboard stats retrieved successfully',
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            result: null,
            message: err.message,
        });
    }
};

const cloudinary = require('@/config/cloudinary');

methods.upload = async (req, res) => {
    try {
        const { id } = req.params;
        const Model = mongoose.model('SolarProject');



        // Construct file data
        // req.upload is set by singleStorageUpload middleware
        const fileData = {
            name: req.upload.fileName,
            url: req.upload.filePath,
            type: req.body.documentType || 'Document', // type passed from frontend or default
            uploadDate: new Date()
        };

        const result = await Model.findByIdAndUpdate(
            id,
            { $push: { projectDocuments: fileData } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                result: null,
                message: 'No document found by this id: ' + id,
            });
        }

        const UploadModel = mongoose.model('Upload');
        const fileType = req.upload.fieldExt.substring(1).toLowerCase();

        await UploadModel.create({
            modelName: 'SolarProject',
            fieldId: id,
            fileName: req.upload.fileName,
            fileType: fileType,
            isPublic: true,
            userID: req.user?._id || id,
            isSecure: true,
            path: req.upload.filePath,
        });

        return res.status(200).json({
            success: true,
            result,
            message: 'Document uploaded successfully',
        });

    } catch (err) {
        console.error("Upload Error:", err);
        return res.status(500).json({
            success: false,
            result: null,
            message: err.message,
        });
    }
};

methods.deleteDocument = async (req, res) => {
    try {
        const { id, docId } = req.params;
        const Model = mongoose.model('SolarProject');

        // 1. Find the project and the document
        const project = await Model.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        const document = project.projectDocuments.id(docId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
            });
        }

        // 2. Delete from Cloudinary if it's a Cloudinary URL
        if (document.url && document.url.includes('cloudinary.com')) {
            try {
                const parts = document.url.split('/');
                const fileNameWithExt = parts[parts.length - 1];
                const ext = fileNameWithExt.split('.').pop().toLowerCase();

                // For 'raw' files, we need the extension in the public_id
                let publicId = `parikh-crm/${fileNameWithExt.split('.')[0]}`;
                const resource_type = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : 'raw';

                if (resource_type === 'raw') {
                    publicId = `parikh-crm/${fileNameWithExt}`;
                }

                await cloudinary.uploader.destroy(publicId, { resource_type });
            } catch (cloudErr) {
                console.error("Cloudinary Deletion Error:", cloudErr);
            }
        }

        // 3. Remove from Database
        project.projectDocuments.pull(docId);
        await project.save();

        return res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (err) {
        console.error("Delete Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = methods;
