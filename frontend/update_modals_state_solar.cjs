const fs = require('fs');

const path = 'src/pages/SolarProject/SolarProjectsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add state variable nextDate
content = content.replace(/const \[newRemark, setNewRemark\] = useState\(''\);/, "const [newRemark, setNewRemark] = useState('');\n    const [nextDate, setNextDate] = useState(null);");

// Replace the handleSave logic
const handleSaveOldRegex = /const handleSave = \(type\) => \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?\}, 800\);\s*\};/;
const handleSaveNew = `const handleSave = (type) => {
        if (!newRemark.trim()) return;
        setSubmitting(true);

        const historyField = type === 'Loan' ? 'loanRemarksHistory' : 'personalRemarksHistory';
        const currentHistory = record[historyField] || [];

        const newEntry = { 
            comment: newRemark, 
            date: new Date() 
        };
        if (nextDate) {
            newEntry.nextFollowUpDate = nextDate.format();
        }

        const updateData = {
            [historyField]: [...currentHistory, newEntry]
        };
        if (nextDate) {
            updateData.nextFollowUpDate = nextDate.format();
        }

        dispatch(crud.update({ entity, id: record._id, jsonData: updateData }));

        setTimeout(() => {
            setNewRemark('');
            setNextDate(null);
            setSubmitting(false);
            dispatch(crud.list({ entity, options: { items: 1000 } }));
        }, 800);
    };`;

content = content.replace(handleSaveOldRegex, handleSaveNew);
fs.writeFileSync(path, content);
console.log('SUCCESS');
