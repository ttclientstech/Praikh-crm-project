const fs = require('fs');

const path = 'src/pages/SolarProject/SolarProjectsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add DatePicker to imports
if (!content.includes('DatePicker')) {
    content = content.replace('Table, Progress, Spin, message, Row, Col } from \'antd\';', 'Table, Progress, Spin, message, Row, Col, DatePicker } from \'antd\';');
}

// 2. Update RemarkModal
const modalOld = `function RemarkModal({ visible, mode, record, initialTab, onCancel, onUpdateSuccess }) {
    const [newRemark, setNewRemark] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const entity = 'solarProject';

    const handleSave = async (type) => {
        if (!newRemark.trim()) return;
        setSubmitting(true);

        const historyField = type === 'Loan' ? 'loanRemarksHistory' : 'personalRemarksHistory';
        const currentHistory = record[historyField] || [];

        const updateData = {
            [historyField]: [...currentHistory, { comment: newRemark, date: new Date() }]
        };

        try {
            const response = await request.update({ entity, id: record._id, jsonData: updateData });
            if (response && response.success) {
                message.success(\`\${type} remark added successfully\`);
                if (onUpdateSuccess) onUpdateSuccess();
                setNewRemark('');
            } else {
                message.error('Failed to add remark');
            }
        } catch (error) {
            message.error('Error adding remark');
        } finally {
            setSubmitting(false);
        }
    };`;

const modalNew = `function RemarkModal({ visible, mode, record, initialTab, onCancel, onUpdateSuccess }) {
    const [newRemark, setNewRemark] = useState('');
    const [nextDate, setNextDate] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const entity = 'solarProject';

    const handleSave = async (type) => {
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
                if (onUpdateSuccess) onUpdateSuccess();
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

content = content.replace(modalOld, modalNew);

// 3. Update renderHistory to show follow-up date
const renderOld = `                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', fontSize: '12px', color: '#64748B' }}>
                                {dayjs(item.date).format('DD MMM YYYY, hh:mm A')}
                            </span>
                        </div>
                        <div style={{ color: '#1E293B', fontSize: '14px' }}>{item.comment}</div>`;

const renderNew = `                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', fontSize: '12px', color: '#64748B' }}>
                                {dayjs(item.date).format('DD MMM YYYY, hh:mm A')}
                            </span>
                            {item.nextFollowUpDate && (
                                <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 'bold' }}>
                                    Follow Up: {dayjs(item.nextFollowUpDate).format('DD MMM YYYY')}
                                </span>
                            )}
                        </div>
                        <div style={{ color: '#1E293B', fontSize: '14px' }}>{item.comment}</div>`;

content = content.replace(renderOld, renderNew);

// 4. Update the input fields to include DatePicker
const textareaOld1 = `<Input.TextArea
                                rows={3}
                                placeholder="Add new loan remark..."
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                            />
                            <Button`;

const textareaNew1 = `<Input.TextArea
                                rows={3}
                                placeholder="Add new loan remark..."
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                                style={{ marginBottom: '10px' }}
                            />
                            <DatePicker 
                                placeholder="Next Follow Up Date" 
                                style={{ width: '100%', marginBottom: '10px' }} 
                                value={nextDate}
                                onChange={(date) => setNextDate(date)}
                            />
                            <Button`;

content = content.replace(textareaOld1, textareaNew1);

const textareaOld2 = `<Input.TextArea
                                rows={3}
                                placeholder="Add new personal remark..."
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                            />
                            <Button`;

const textareaNew2 = `<Input.TextArea
                                rows={3}
                                placeholder="Add new personal remark..."
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                                style={{ marginBottom: '10px' }}
                            />
                            <DatePicker 
                                placeholder="Next Follow Up Date" 
                                style={{ width: '100%', marginBottom: '10px' }} 
                                value={nextDate}
                                onChange={(date) => setNextDate(date)}
                            />
                            <Button`;

content = content.replace(textareaOld2, textareaNew2);

fs.writeFileSync(path, content);
console.log('SUCCESS SolarProjectsPage');
