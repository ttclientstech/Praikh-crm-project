const fs = require('fs');
const p = 'src/modules/DashboardModule/index.jsx';
let content = fs.readFileSync(p, 'utf8');

// 1. Add useMemo to react imports
content = content.replace(
  "import { useEffect, useState, cloneElement } from 'react';", 
  "import { useEffect, useState, cloneElement, useMemo } from 'react';"
);

// 2. Add the revenueTotals calculation before the return
const revenueTotalsCode = `
  const revenueTotals = useMemo(() => {
    let received = 0;
    let remaining = 0;
    revenueData.forEach(record => {
        const pd = record.paymentDetails || {};
        const adv = (pd.advancePayments?.length > 0) ? pd.advancePayments.reduce((sum, item) => sum + (item.amount || 0), 0) : ((pd.advancePayment1 || 0) + (pd.advancePayment2 || 0));
        const loans = (pd.loanDisbursals?.length > 0) ? pd.loanDisbursals.reduce((sum, item) => sum + (item.amount || 0), 0) : (pd.loanCreditedAmount || 0);
        const rec = adv + loans;
        received += rec;
        remaining += (pd.totalProjectCost || 0) - rec;
    });
    return { received, remaining };
  }, [revenueData]);

  return (`;

content = content.replace("  return (", revenueTotalsCode);

// 3. Update the Modal title
const modalTitleCode = `<Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '30px' }}>
            <span>Project Financial Details</span>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 'normal' }}>
              <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                Total Received: {moneyFormatter({ amount: revenueTotals.received })}
              </span>
              <span style={{ color: '#EF4444', fontWeight: 'bold' }}>
                Total Remaining: {moneyFormatter({ amount: revenueTotals.remaining })}
              </span>
            </div>
          </div>
        }`;

content = content.replace(/<Modal\s+title="Project Financial Details"/g, modalTitleCode);

fs.writeFileSync(p, content);
console.log('Revenue totals patched successfully');
