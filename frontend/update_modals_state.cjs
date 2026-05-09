const fs = require('fs');

function updateFile(path) {
    let content = fs.readFileSync(path, 'utf8');

    // Add state variable nextDate
    content = content.replace(/const \[newRemark, setNewRemark\] = useState\(''\);/, "const [newRemark, setNewRemark] = useState('');\n    const [nextDate, setNextDate] = useState(null);");

    // Replace the handleSave logic
    const handleSaveOldRegex = /const handleSave = async \(\s*type\s*\) => \{[\s\S]*?finally\s*\{\s*setSubmitting\(false\);\s*\}\s*\};/;
    const handleSaveNew = `const handleSave = async (type) => {
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

        try {
            const response = await request.update({ entity, id: record._id, jsonData: updateData });
            if (response && response.success) {
                message.success(\`\${type} remark added successfully\`);
                if (typeof onUpdateSuccess !== 'undefined' && onUpdateSuccess) onUpdateSuccess();
                if (typeof dispatch !== 'undefined') dispatch(crud.list({ entity }));
                setNewRemark('');
                setNextDate(null);
            } else {
                message.error('Failed to add remark');
            }
        } catch (error) {
            message.error('Error adding remark');
        } finally {
            setSubmitting(false);
        }
    };`;

    if (handleSaveOldRegex.test(content)) {
        content = content.replace(handleSaveOldRegex, handleSaveNew);
        fs.writeFileSync(path, content);
        console.log('SUCCESS ' + path);
    } else {
        console.log('FAILED TO MATCH handleSave IN ' + path);
    }
}

updateFile('src/modules/DashboardModule/index.jsx');
updateFile('src/pages/SolarProject/SolarProjectsPage.jsx');
