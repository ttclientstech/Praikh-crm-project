const fs = require('fs');

let content = fs.readFileSync('src/controllers/appControllers/solarProjectController/index.js', 'utf8');

const new_code = `        const financialStats = await Model.aggregate([
            { $match: query },
            {
                $project: {
                    projectCost: { $ifNull: ["$paymentDetails.totalProjectCost", 0] },
                    advances: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ["$paymentDetails.advancePayments", []] } }, 0] },
                            then: { $sum: "$paymentDetails.advancePayments.amount" },
                            else: { $add: [{ $ifNull: ["$paymentDetails.advancePayment1", 0] }, { $ifNull: ["$paymentDetails.advancePayment2", 0] }] }
                        }
                    },
                    loans: {
                        $cond: {
                            if: { $gt: [{ $size: { $ifNull: ["$paymentDetails.loanDisbursals", []] } }, 0] },
                            then: { $sum: "$paymentDetails.loanDisbursals.amount" },
                            else: { $ifNull: ["$paymentDetails.loanCreditedAmount", 0] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: "$projectCost" },
                    totalReceived: { $sum: { $add: ["$advances", "$loans"] } }
                }
            }
        ]);

        let totalReceivable = 0;
        if (financialStats.length > 0) {
            const stats = financialStats[0];
            totalReceivable = (stats.totalCost || 0) - (stats.totalReceived || 0);
        }

        // 6. Today Follow Up
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const followUpQuery = {
            ...query,
            status: { $ne: 'Completed' },
            nextFollowUpDate: { $lte: endOfDay }
        };
        const todayFollowUpCount = await Model.countDocuments(followUpQuery);

        return res.status(200).json({
            success: true,
            result: {
                totalProjects,
                completedProjects,
                workCompletedPercentage,
                pendingProjects,
                totalReceivable,
                todayFollowUpCount
            },`;

// We will use a split/join or indexOf approach to be foolproof.
const idx1 = content.indexOf('const financialStats = await Model.aggregate([');
const idx2 = content.indexOf(`message: 'Dashboard stats retrieved successfully',`);

if (idx1 !== -1 && idx2 !== -1) {
    const p1 = content.substring(0, idx1);
    const p2 = content.substring(idx2);
    content = p1 + new_code + '\n            ' + p2;
    fs.writeFileSync('src/controllers/appControllers/solarProjectController/index.js', content);
    console.log('SUCCESS');
} else {
    console.log('FAILED');
}
