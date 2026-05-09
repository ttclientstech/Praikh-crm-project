const fs = require('fs');
const p = 'src/modules/DashboardModule/index.jsx';
let content = fs.readFileSync(p, 'utf8');

// Remove from StatsCard
const badCode = `
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

content = content.replace(badCode, "  return (");

// Add to DashboardModule properly
// We'll find `const handlePendingProjectsClick = async () => {` and insert it right before that.
const correctPlaceCode = `
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

  const handlePendingProjectsClick = async () => {`;

content = content.replace("  const handlePendingProjectsClick = async () => {", correctPlaceCode);

fs.writeFileSync(p, content);
console.log("Fixed location");
