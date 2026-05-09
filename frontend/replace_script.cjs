const fs = require('fs');

let content = fs.readFileSync('src/modules/DashboardModule/index.jsx', 'utf8');

const new_code_1 = `        const totalAdvances = (pd.advancePayments?.length > 0) ? pd.advancePayments.reduce((sum, item) => sum + (item.amount || 0), 0) : ((pd.advancePayment1 || 0) + (pd.advancePayment2 || 0));
        const totalLoans = (pd.loanDisbursals?.length > 0) ? pd.loanDisbursals.reduce((sum, item) => sum + (item.amount || 0), 0) : (pd.loanCreditedAmount || 0);
        const totalReceived = totalAdvances + totalLoans;`;

content = content.replace(/const totalAdvances = pd\.advancePayments\?\.reduce\(\(sum, item\) => sum \+ \(item\.amount \|\| 0\), 0\) \|\| 0;\s*const totalLoans = \(pd\.loanDisbursals\?\.reduce\(\(sum, item\) => sum \+ \(item\.amount \|\| 0\), 0\) \|\| 0\) \+ \(pd\.loanCreditedAmount \|\| 0\);\s*const totalReceived = totalAdvances \+ totalLoans;/g, new_code_1);

fs.writeFileSync('src/modules/DashboardModule/index.jsx', content);
console.log('SUCCESS');
