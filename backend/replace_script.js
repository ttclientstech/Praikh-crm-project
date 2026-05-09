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
        }`;

const pattern = /const financialStats = await Model\.aggregate\(\[\s*\{ \$match: query \},\s*\{\s*\$group: \{\s*_id: null,\s*totalCost: \{ \$sum: "\$paymentDetails\.totalProjectCost" \},\s*totalAdvance: \{ \$sum: \{ \$sum: "\$paymentDetails\.advancePayments\.amount" \} \},\s*totalLoanCredited: \{ \$sum: "\$paymentDetails\.loanCreditedAmount" \},\s*totalLoanDisbursed: \{ \$sum: \{ \$sum: "\$paymentDetails\.loanDisbursals\.amount" \} \}\s*\}\s*\}\s*\]\);\s*let totalReceivable = 0;\s*if \(financialStats\.length > 0\) \{\s*const stats = financialStats\[0\];\s*const totalReceived = \(stats\.totalAdvance \|\| 0\) \+ \(stats\.totalLoanCredited \|\| 0\) \+ \(stats\.totalLoanDisbursed \|\| 0\);\s*totalReceivable = \(stats\.totalCost \|\| 0\) - totalReceived;\s*\}/;

if (pattern.test(content)) {
    content = content.replace(pattern, new_code);
    fs.writeFileSync('src/controllers/appControllers/solarProjectController/index.js', content);
    console.log('SUCCESS');
} else {
    console.log('FAILED TO MATCH');
}
