
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Input, Row, Col, Tag, Dropdown, Modal, Form, Steps, Divider, Select, DatePicker, Switch, InputNumber, Card, Descriptions, Statistic, Tabs, Segmented, Alert } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EllipsisOutlined, ProjectOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined, EyeOutlined, MinusCircleOutlined, MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { crud } from '@/redux/crud/actions';
import { selectListItems, selectCreatedItem, selectUpdatedItem } from '@/redux/crud/selectors';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';
import CompletionDetails from './CompletionDetails';
import ManualPaymentSettlement from './ManualPaymentSettlement';
import '@/style/SolarRedesign.css';

const { Step } = Steps;
const { Option } = Select;
const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const sumAmounts = (items) => Array.isArray(items) ? items.reduce((sum, item) => sum + money(item?.amount), 0) : 0;
const currency = (value) => `₹ ${money(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getFinancials = (pd = {}) => {
    const projectCost = money(pd.totalProjectCost);
    const advances = pd.advancePayments?.length ? sumAmounts(pd.advancePayments) : money(pd.advancePayment1) + money(pd.advancePayment2);
    const loans = pd.loanDisbursals?.length ? sumAmounts(pd.loanDisbursals) : money(pd.loanCreditedAmount);
    const settlements = Array.isArray(pd.settlements) ? pd.settlements : [];
    const refunds = settlements.filter(item => item.type === 'Customer Refund');
    const refunded = money(sumAmounts(refunds));
    const legacyRefunds = money(sumAmounts(refunds.filter(item => item.requestId && !item.reference)));
    const approvedRefunds = money(sumAmounts(settlements.filter(item => item.type === 'Refund Approval')) + legacyRefunds);
    const internallyAllocated = money(sumAmounts(settlements.filter(item => item.type === 'Internal Settlement')));
    const grossReceived = money(advances + loans);
    const netReceived = money(grossReceived - refunded);
    return {
        projectCost, advances: money(advances), loans: money(loans), grossReceived,
        refunded: money(refunded), internallyAllocated: money(internallyAllocated), netReceived,
        remainingDue: Math.max(0, money(projectCost - netReceived)),
        unsettledExcess: Math.max(0, money(Math.max(0, money(grossReceived - projectCost)) - approvedRefunds - internallyAllocated)),
    };
};

const StepOne = () => (
    <Row gutter={[24, 24]}>
        <Col span={24}><Divider orientation="left">Personal Information</Divider></Col>
        <Col span={24}><Form.Item name="client" label="Client Name" rules={[{ required: true, message: 'Please enter client name' }]}><Input placeholder="Enter Client Name" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="contactNumber" label="Contact Number"><Input placeholder="Contact Number" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="consumerNumber" label="Consumer Number (Electricity)"><Input placeholder="Electricity Consumer No." /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="solarRooftopApplicationNo" label="Solar Application No"><Input placeholder="MahaDiscom/Portal App No." /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="email" label="Email ID" rules={[{ type: 'email' }]}><Input placeholder="Email Address" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="pinCode" label="Pin Code"><Input placeholder="Pin Code" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="lightBillGeneratedDate" label="Light Bill Generated Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="currentLoadOnLightBill" label="Current Load on Light Bill (kW)"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="additionalLoad" label="Additional Load (kW)"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={24}><Form.Item name="address" label="Address"><Input.TextArea rows={2} placeholder="Full Address" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="villageCity" label="Village / City"><Input placeholder="Village or City" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="projectState" label="State"><Input placeholder="State" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select placeholder="Select Status"><Option value="Active">Active</Option><Option value="Completed">Completed</Option><Option value="Cancelled">Cancelled</Option></Select></Form.Item></Col>
    </Row>
);

const StepTwo = () => (
    <Row gutter={[24, 24]}>
        <Col span={24}><Divider orientation="left">Solar System Details</Divider></Col>
        <Col xs={24} sm={8}><Form.Item name={['systemDetails', 'systemType']} label="System Type" rules={[{ required: true }]}><Select placeholder="Select Type"><Option value="OnGrid">On Grid</Option><Option value="Hybrid">Hybrid</Option><Option value="OffGrid">Off Grid</Option></Select></Form.Item></Col>
        <Col xs={24} sm={8}><Form.Item name={['systemDetails', 'capacity']} label="Solar Capacity (kW)"><Input placeholder="e.g. 5kW" /></Form.Item></Col>
        <Col xs={24} sm={8}><Form.Item name={['systemDetails', 'structureHeight']} label="Structure Height"><Input placeholder="Height in ft/m" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name={['systemDetails', 'solarPanelName']} label="Solar Panel Name"><Input placeholder="Panel Brand/Model" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name={['systemDetails', 'solarPanelWatt']} label="Solar Panel Watt"><Input placeholder="Wattage per panel" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name={['systemDetails', 'solarPanelNos']} label="Solar Panel NOS"><InputNumber style={{ width: '100%' }} placeholder="Number of panels" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name={['systemDetails', 'inverterName']} label="Inverter Name"><Input placeholder="Inverter Brand/Model" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item name={['systemDetails', 'walkway']} label="Structure Walkway" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
    </Row>
);

const LiveSummary = () => {
    const pd = Form.useWatch('paymentDetails');
    const bank = Form.useWatch('bankDetails');
    const f = getFinancials(pd);
    const sanctioned = money(bank?.sanctionedAmount);
    return (
        <Card size="small" style={{ marginBottom: 20, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <Row gutter={[16, 18]}>
                <Col xs={24} sm={8}><Statistic title="Total Project Cost" value={f.projectCost} prefix="₹" precision={2} /></Col>
                <Col xs={24} sm={8}><Statistic title="Gross Received" value={f.grossReceived} prefix="₹" precision={2} /></Col>
                <Col xs={24} sm={8}><Statistic title="Net Received" value={f.netReceived} prefix="₹" precision={2} valueStyle={{ color: '#059669' }} /></Col>
                <Col xs={24} sm={8}><Statistic title="Customer Refunds" value={f.refunded} prefix="₹" precision={2} /></Col>
                <Col xs={24} sm={8}><Statistic title="Internal Settlements" value={f.internallyAllocated} prefix="₹" precision={2} /></Col>
                <Col xs={24} sm={8}><Statistic title="Remaining Due" value={f.remainingDue} prefix="₹" precision={2} /></Col>
                <Col span={24}><strong>Available Excess: <span style={{ color: '#059669' }}>{currency(f.unsettledExcess)}</span></strong></Col>
            </Row>
            {bank?.isBankLoan && <><Divider style={{ margin: '12px 0' }} /><Row gutter={[16, 16]}>
                <Col xs={24} sm={8}><Statistic title="Sanctioned Loan" value={sanctioned} prefix="₹" precision={2} /></Col>
                <Col xs={24} sm={8}><Statistic title="Loan Disbursed" value={f.loans} prefix="₹" precision={2} /></Col>
                <Col xs={24} sm={8}><Statistic title="Pending Disbursal" value={Math.max(0, money(sanctioned - f.loans))} prefix="₹" precision={2} /></Col>
            </Row></>}
        </Card>
    );
};

const AdvanceHistoryTable = () => {
    const pd = Form.useWatch('paymentDetails') || {};
    const transactions = [];
    if (pd.advancePayments?.length) {
        pd.advancePayments.forEach((payment, index) => {
            if (payment?.amount) transactions.push({ key: `adv_${index}`, description: `Advance Payment ${index + 1}`, mode: payment.mode, date: payment.date, amount: payment.amount, color: 'blue' });
        });
    } else {
        if (pd.advancePayment1) transactions.push({ key: 'legacy1', description: 'Advance Payment 1', mode: pd.advancePayment1Mode, date: pd.advancePayment1Date, amount: pd.advancePayment1, color: 'blue' });
        if (pd.advancePayment2) transactions.push({ key: 'legacy2', description: 'Advance Payment 2', mode: pd.advancePayment2Mode, date: pd.advancePayment2Date, amount: pd.advancePayment2, color: 'blue' });
    }
    if (!transactions.length) return null;
    transactions.sort((a, b) => dayjs(b.date || 0).valueOf() - dayjs(a.date || 0).valueOf());
    return <Table dataSource={transactions} pagination={false} size="small" bordered title={() => <b>Advance Payments History</b>} columns={[
        { title: 'Description', dataIndex: 'description', render: text => <Tag color="blue">{text}</Tag> },
        { title: 'Mode', dataIndex: 'mode', render: text => text || '-' },
        { title: 'Date', dataIndex: 'date', render: date => date ? dayjs(date).format('DD MMM YYYY') : '-' },
        { title: 'Amount', dataIndex: 'amount', align: 'right', render: amount => <b>{currency(amount)}</b> },
    ]} />;
};

const LoanHistoryTable = () => {
    const pd = Form.useWatch('paymentDetails') || {};
    const transactions = [];
    if (pd.loanDisbursals?.length) {
        pd.loanDisbursals.forEach((loan, index) => {
            if (loan?.amount) transactions.push({ key: `loan_${index}`, description: `Loan ${index + 1} Disbursed`, mode: 'Bank Transfer', date: loan.date, amount: loan.amount });
        });
    } else if (pd.loanCreditedAmount) {
        transactions.push({ key: 'legacyLoan', description: 'Loan Amount Bank Credited', mode: 'Bank Transfer', date: pd.loanCreditedDate, amount: pd.loanCreditedAmount });
    }
    if (!transactions.length) return null;
    transactions.sort((a, b) => dayjs(b.date || 0).valueOf() - dayjs(a.date || 0).valueOf());
    return <Table dataSource={transactions} pagination={false} size="small" bordered title={() => <b>Loan Disbursals History</b>} columns={[
        { title: 'Description', dataIndex: 'description', render: text => <Tag color="purple">{text}</Tag> },
        { title: 'Mode', dataIndex: 'mode' },
        { title: 'Date', dataIndex: 'date', render: date => date ? dayjs(date).format('DD MMM YYYY') : '-' },
        { title: 'Amount', dataIndex: 'amount', align: 'right', render: amount => <b>{currency(amount)}</b> },
    ]} />;
};

const amountFormatter = value => `₹ ${value ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const amountParser = value => (value || '').replace(/₹\s?|,/g, '');

const StepThree = ({ financialLocked = false }) => {
    const isBankLoan = Form.useWatch(['bankDetails', 'isBankLoan']);
    return (
        <Row gutter={[24, 24]}>
            <Col span={24}><Divider orientation="left">Payment Details</Divider></Col>
            {financialLocked && <Col span={24}><Alert type="warning" showIcon message="Financial payment amounts are locked" description="This project already has settlement history. Project cost, advances and loan disbursals cannot be changed through ordinary editing. Other project details remain editable." /></Col>}
            <Col span={24}><Form.Item name={['paymentDetails', 'totalProjectCost']} label="Total Project Cost"><InputNumber style={{ width: '100%' }} formatter={amountFormatter} parser={amountParser} disabled={financialLocked} /></Form.Item></Col>
            <Col span={24}>
                <Form.List name={['paymentDetails', 'advancePayments']}>
                    {(fields, { add, remove }) => <>
                        {fields.map(({ key, name, ...restField }, index) => <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16, background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                            <Row gutter={[12, 12]} style={{ flex: 1 }}>
                                <Col xs={24} sm={8}><Form.Item {...restField} name={[name, 'amount']} label={`Advance Payment ${index + 1}`} rules={[{ required: true, message: 'Missing amount' }]}><InputNumber style={{ width: '100%' }} placeholder="Amount" formatter={amountFormatter} parser={amountParser} disabled={financialLocked} /></Form.Item></Col>
                                <Col xs={24} sm={8}><Form.Item {...restField} name={[name, 'mode']} label="Mode" rules={[{ required: true, message: 'Missing mode' }]}><Select placeholder="Mode" disabled={financialLocked}><Option value="Cash">Cash</Option><Option value="Online">Online</Option><Option value="Cheque">Cheque</Option></Select></Form.Item></Col>
                                <Col xs={24} sm={8}><Form.Item {...restField} name={[name, 'date']} label="Date" rules={[{ required: true, message: 'Missing date' }]}><DatePicker style={{ width: '100%' }} disabled={financialLocked} /></Form.Item></Col>
                            </Row>
                            {!financialLocked && <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 38, color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }} />}
                        </div>)}
                        <Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} disabled={financialLocked}>Add Advance Payment</Button></Form.Item>
                    </>}
                </Form.List>
            </Col>
            <Col span={24}><AdvanceHistoryTable /></Col>
            <Col span={24}><Divider orientation="left">Bank & Loan Details</Divider></Col>
            <Col span={24}><Form.Item name={['bankDetails', 'isBankLoan']} label="Is Bank Loan Applied?" valuePropName="checked"><Switch checkedChildren="Yes" unCheckedChildren="No" /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name={['bankDetails', 'bankName']} label="Bank Name"><Input placeholder="Bank Name" disabled={!isBankLoan} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name={['bankDetails', 'sanctionedAmount']} label="Sanctioned Amount"><InputNumber style={{ width: '100%' }} disabled={!isBankLoan} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name={['bankDetails', 'customerIfscCode']} label="Customer IFSC"><Input placeholder="IFSC Code" disabled={!isBankLoan} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name={['bankDetails', 'solarRooftopIfscCode']} label="Solar Rooftop IFSC"><Input placeholder="Rooftop IFSC Code" disabled={!isBankLoan} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name={['bankDetails', 'totalLoanAmount']} label="Total Loan Amount"><InputNumber style={{ width: '100%' }} disabled={!isBankLoan} /></Form.Item></Col>
            <Col span={24}><Divider orientation="left">Loan Disbursals</Divider></Col>
            <Col span={24}>
                <Form.List name={['paymentDetails', 'loanDisbursals']}>
                    {(fields, { add, remove }) => <>
                        {fields.map(({ key, name, ...restField }, index) => <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16, background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                            <Row gutter={[12, 12]} style={{ flex: 1 }}>
                                <Col xs={24} sm={12}><Form.Item {...restField} name={[name, 'amount']} label={`Loan ${index + 1} Amount`} rules={[{ required: true, message: 'Missing amount' }]}><InputNumber style={{ width: '100%' }} placeholder="Amount" formatter={amountFormatter} parser={amountParser} disabled={!isBankLoan || financialLocked} /></Form.Item></Col>
                                <Col xs={24} sm={12}><Form.Item {...restField} name={[name, 'date']} label="Date" rules={[{ required: true, message: 'Missing date' }]}><DatePicker style={{ width: '100%' }} disabled={!isBankLoan || financialLocked} /></Form.Item></Col>
                            </Row>
                            {!financialLocked && isBankLoan && <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 38, color: '#ff4d4f', fontSize: 18, cursor: 'pointer' }} />}
                        </div>)}
                        <Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} disabled={!isBankLoan || financialLocked}>Add Loan Disbursal</Button></Form.Item>
                    </>}
                </Form.List>
            </Col>
            <Col span={24}><LoanHistoryTable /></Col>
            <Col span={24}><div style={{ background: '#f0faff', padding: 15, borderRadius: 8, border: '1px solid #bae7ff', marginTop: 20 }}><LiveSummary /></div></Col>
        </Row>
    );
};

export function LocalSolarProjectForm({ isUpdate = false, record, onSuccess, initialStep = 0 }) {
    const dispatch = useDispatch();
    const currentAdmin = useSelector(selectCurrentAdmin);
    const isOwner = currentAdmin?.role === 'owner';
    const entity = 'solarProject';
    const { isLoading: isLoadingCreate, isSuccess: isSuccessCreate } = useSelector(selectCreatedItem);
    const { isLoading: isLoadingUpdate, isSuccess: isSuccessUpdate } = useSelector(selectUpdatedItem);
    const isLoading = isUpdate ? isLoadingUpdate : isLoadingCreate;
    const isSuccess = isUpdate ? isSuccessUpdate : isSuccessCreate;
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [latestRecord, setLatestRecord] = useState(record);
    const [refreshingRecord, setRefreshingRecord] = useState(false);
    const financialLocked = isUpdate && (latestRecord?.paymentDetails?.settlements?.length || 0) > 0;
    const steps = [
        { title: 'Personal Info', content: 'Personal Information & Client Details' },
        { title: 'Solar System', content: 'System Configuration & Details' },
        { title: 'Payment & Bank', content: 'Financials, Loans, and Payment Tracker' },
    ];

    const populateForm = useCallback((project) => {
        const values = { ...project, paymentDetails: { ...(project.paymentDetails || {}) } };
        if (values.lightBillGeneratedDate) values.lightBillGeneratedDate = dayjs(values.lightBillGeneratedDate);
        const pd = values.paymentDetails;
        if (!pd.advancePayments?.length) {
            const migrated = [];
            if (pd.advancePayment1) migrated.push({ amount: pd.advancePayment1, mode: pd.advancePayment1Mode, date: pd.advancePayment1Date ? dayjs(pd.advancePayment1Date) : null });
            if (pd.advancePayment2) migrated.push({ amount: pd.advancePayment2, mode: pd.advancePayment2Mode, date: pd.advancePayment2Date ? dayjs(pd.advancePayment2Date) : null });
            pd.advancePayments = migrated;
        } else pd.advancePayments = pd.advancePayments.map(p => ({ ...p, date: p.date ? dayjs(p.date) : null }));
        if (!pd.loanDisbursals?.length) {
            pd.loanDisbursals = pd.loanCreditedAmount ? [{ amount: pd.loanCreditedAmount, date: pd.loanCreditedDate ? dayjs(pd.loanCreditedDate) : null }] : [];
        } else pd.loanDisbursals = pd.loanDisbursals.map(l => ({ ...l, date: l.date ? dayjs(l.date) : null }));
        form.setFieldsValue(values);
    }, [form]);

    useEffect(() => {
        setLatestRecord(record);
        form.resetFields();
        if (isUpdate && record) populateForm(record);
        else form.setFieldsValue({ projectState: 'Maharashtra', status: 'Active' });
    }, [isUpdate, record, form, populateForm]);

    useEffect(() => {
        if (isSuccess) {
            dispatch(crud.resetAction({ actionType: isUpdate ? 'update' : 'create' }));
            dispatch(crud.list({ entity }));
            onSuccess?.();
        }
    }, [isSuccess, dispatch, isUpdate, onSuccess]);

    const handleSettlementRecorded = (updatedProject) => {
        if (!updatedProject) return;
        setLatestRecord(updatedProject);
        // Refresh saved financials, but preserve unrelated unsaved edits in the form.
        const pd = updatedProject.paymentDetails || {};
        const currentPd = form.getFieldValue('paymentDetails') || {};
        const savedPd = { ...pd };
        savedPd.advancePayments = pd.advancePayments?.length
            ? pd.advancePayments.map(p => ({ ...p, date: p.date ? dayjs(p.date) : null }))
            : [pd.advancePayment1 && { amount: pd.advancePayment1, mode: pd.advancePayment1Mode, date: pd.advancePayment1Date ? dayjs(pd.advancePayment1Date) : null }, pd.advancePayment2 && { amount: pd.advancePayment2, mode: pd.advancePayment2Mode, date: pd.advancePayment2Date ? dayjs(pd.advancePayment2Date) : null }].filter(Boolean);
        savedPd.loanDisbursals = pd.loanDisbursals?.length
            ? pd.loanDisbursals.map(l => ({ ...l, date: l.date ? dayjs(l.date) : null }))
            : (pd.loanCreditedAmount ? [{ amount: pd.loanCreditedAmount, date: pd.loanCreditedDate ? dayjs(pd.loanCreditedDate) : null }] : []);
        form.setFieldsValue({ paymentDetails: { ...currentPd, ...savedPd } });
        dispatch(crud.list({ entity, options: { items: 1000 } }));
    };

    const refreshSavedRecord = async () => {
        if (!record?._id) return;
        setRefreshingRecord(true);
        try {
            const response = await request.read({ entity: 'solarProject', id: record._id });
            if (response?.success && response.result) handleSettlementRecorded(response.result);
            else Modal.error({ title: 'Refresh failed', content: 'Could not load the latest saved project data.' });
        } catch (error) {
            Modal.error({ title: 'Refresh failed', content: error?.message || 'Could not load the latest saved project data.' });
        } finally {
            setRefreshingRecord(false);
        }
    };

    const onFinish = (values) => {
        const pd = { ...(values.paymentDetails || {}) };
        delete pd.settlements;
        if (financialLocked) {
            ['totalProjectCost', 'advancePayments', 'advancePayment1', 'advancePayment2', 'loanDisbursals', 'loanCreditedAmount'].forEach(key => delete pd[key]);
        } else {
            pd.advancePayments = (pd.advancePayments || []).map(p => ({ ...p, date: p.date ? dayjs(p.date).format() : undefined }));
            pd.loanDisbursals = (pd.loanDisbursals || []).map(l => ({ ...l, date: l.date ? dayjs(l.date).format() : undefined }));
        }
        const jsonData = {
            ...values,
            lightBillGeneratedDate: values.lightBillGeneratedDate ? dayjs(values.lightBillGeneratedDate).format() : undefined,
            paymentDetails: pd,
        };
        if (isUpdate) dispatch(crud.update({ entity, id: record._id, jsonData }));
        else dispatch(crud.create({ entity, jsonData }));
    };

    const stepFields = [
        ['client', 'contactNumber', 'consumerNumber', 'solarRooftopApplicationNo', 'email', 'pinCode', 'lightBillGeneratedDate', 'currentLoadOnLightBill', 'additionalLoad', 'address', 'villageCity', 'projectState', 'status'],
        [['systemDetails', 'systemType'], ['systemDetails', 'capacity'], ['systemDetails', 'structureHeight'], ['systemDetails', 'solarPanelName'], ['systemDetails', 'solarPanelWatt'], ['systemDetails', 'solarPanelNos'], ['systemDetails', 'inverterName'], ['systemDetails', 'walkway']],
        [['paymentDetails', 'totalProjectCost'], ['paymentDetails', 'advancePayments'], ['bankDetails', 'isBankLoan'], ['bankDetails', 'bankName'], ['bankDetails', 'sanctionedAmount'], ['bankDetails', 'customerIfscCode'], ['bankDetails', 'solarRooftopIfscCode'], ['bankDetails', 'totalLoanAmount'], ['paymentDetails', 'loanDisbursals']],
    ];
    const next = () => form.validateFields(stepFields[currentStep]).then(() => setCurrentStep(step => step + 1)).catch(err => console.log('Validation Failed:', err));
    const prev = () => setCurrentStep(step => step - 1);

    return (
        <div style={{ marginTop: 20 }}>
            <Steps current={currentStep} style={{ marginBottom: 40 }} size="small">{steps.map(item => <Step key={item.title} title={item.title} />)}</Steps>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ projectState: 'Maharashtra', status: 'Active' }} preserve>
                <div style={{ marginBottom: 30, minHeight: 400 }}>
                    <div style={{ display: currentStep === 0 ? 'block' : 'none' }}><StepOne /></div>
                    <div style={{ display: currentStep === 1 ? 'block' : 'none' }}><StepTwo /></div>
                    <div style={{ display: currentStep === 2 ? 'block' : 'none' }}><StepThree financialLocked={financialLocked} /></div>
                </div>
                <div style={{ textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                    {currentStep > 0 && <Button style={{ margin: '0 8px' }} onClick={prev}>Previous</Button>}
                    {currentStep < steps.length - 1 && <Button type="primary" onClick={next}>Next</Button>}
                    {currentStep === steps.length - 1 && <Button type="primary" htmlType="submit" loading={isLoading}>{isUpdate ? 'Update Project' : 'Save Project'}</Button>}
                </div>
            </Form>
            {isUpdate && latestRecord?._id && currentStep === 2 && <>
                <div style={{ marginTop: 16, textAlign: 'right' }}><Button size="small" onClick={refreshSavedRecord} loading={refreshingRecord}>Refresh Saved Project Data</Button></div>
                {isOwner && <ManualPaymentSettlement record={latestRecord} onRecorded={handleSettlementRecorded} />}
            </>}
        </div>
    );
}

function RemarkModal({ visible, onCancel, record, entity, initialTab = 'loan', mode = 'add' }) {
    const dispatch = useDispatch();
    const [newRemark, setNewRemark] = useState('');
    const [nextDate, setNextDate] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    if (!record) return null;
    const handleSave = (type) => {
        if (!newRemark.trim()) return;
        setSubmitting(true);
        const historyField = type === 'Loan' ? 'loanRemarksHistory' : 'personalRemarksHistory';
        const newEntry = { comment: newRemark, date: new Date() };
        if (nextDate) newEntry.nextFollowUpDate = nextDate.toISOString();
        const updateData = { [historyField]: [...(record[historyField] || []), newEntry] };
        if (nextDate) updateData.nextFollowUpDate = nextDate.toISOString();
        dispatch(crud.update({ entity, id: record._id, jsonData: updateData }));
        setTimeout(() => {
            setNewRemark(''); setNextDate(null); setSubmitting(false);
            dispatch(crud.list({ entity, options: { items: 1000 } }));
        }, 800);
    };
    const renderHistory = (history) => <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 20, padding: mode === 'history' ? 0 : 10, background: mode === 'history' ? 'transparent' : '#F8FAFC', borderRadius: 8 }}>
        {(!history?.length) ? <p style={{ color: '#94A3B8', textAlign: 'center', padding: 20 }}>No history yet</p> :
            (mode === 'history' ? history.slice().reverse() : [history[history.length - 1]]).map((item, index) => <div key={index} style={{ marginBottom: mode === 'history' ? 16 : 0, padding: mode === 'history' ? 12 : 0, background: mode === 'history' ? '#F8FAFC' : 'transparent', borderRadius: 8, border: mode === 'history' ? '1px solid #E2E8F0' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 12, color: '#64748B' }}>{dayjs(item.date).format('DD MMM YYYY, hh:mm A')}</span>{item.nextFollowUpDate && <span style={{ fontWeight: 600, fontSize: 12, color: '#EF4444' }}>Next Follow Up: {dayjs(item.nextFollowUpDate).format('DD MMM YYYY')}</span>}</div>
                <div style={{ color: '#1E293B', fontSize: 14 }}>{item.comment}</div>
            </div>)}
    </div>;
    const tabItems = [
        { key: 'loan', label: 'Remarks on Loan', children: <div>{renderHistory(record.loanRemarksHistory)}{mode === 'add' && <><Input.TextArea rows={3} placeholder="Add new loan remark..." value={newRemark} onChange={e => setNewRemark(e.target.value)} style={{ marginBottom: 10 }} /><DatePicker placeholder="Next Follow Up Date" style={{ width: '100%', marginBottom: 10 }} value={nextDate} onChange={setNextDate} /><Button type="primary" onClick={() => handleSave('Loan')} loading={submitting} style={{ marginTop: 10, width: '100%' }}>Save Loan Remark</Button></>}</div> },
        { key: 'personal', label: 'Remarks on Personal', children: <div>{renderHistory(record.personalRemarksHistory)}{mode === 'add' && <><Input.TextArea rows={3} placeholder="Add new personal remark..." value={newRemark} onChange={e => setNewRemark(e.target.value)} style={{ marginBottom: 10 }} /><DatePicker placeholder="Next Follow Up Date" style={{ width: '100%', marginBottom: 10 }} value={nextDate} onChange={setNextDate} /><Button type="primary" onClick={() => handleSave('Personal')} loading={submitting} style={{ marginTop: 10, width: '100%' }}>Save Personal Remark</Button></>}</div> },
    ];
    return <Modal title={mode === 'add' ? `Add Remark: ${record.client}` : `Remark History: ${record.client}`} open={visible} onCancel={onCancel} footer={null} width={500} centered destroyOnClose><Tabs defaultActiveKey={initialTab} items={tabItems} onChange={() => setNewRemark('')} /></Modal>;
}

function LocalSolarProjectView({ record }) {
    if (!record) return null;
    const { client, systemDetails, bankDetails, paymentDetails, status, proejctCity, projectState, contactNumber, email, consumerNumber, lightBillGeneratedDate, solarRooftopApplicationNo } = record;
    const f = getFinancials(paymentDetails);
    const items = [
        { key: '1', label: 'System & Configuration', children: <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="System Type">{systemDetails?.systemType}</Descriptions.Item><Descriptions.Item label="Capacity">{systemDetails?.capacity}</Descriptions.Item><Descriptions.Item label="Panel Name">{systemDetails?.solarPanelName}</Descriptions.Item><Descriptions.Item label="Panel Wattage">{systemDetails?.solarPanelWatt}</Descriptions.Item><Descriptions.Item label="Inverter Name">{systemDetails?.inverterName}</Descriptions.Item><Descriptions.Item label="Structure Height">{systemDetails?.structureHeight}</Descriptions.Item><Descriptions.Item label="Walkway">{systemDetails?.walkway ? 'Yes' : 'No'}</Descriptions.Item>
        </Descriptions> },
        { key: '2', label: 'Financials', children: <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}><Card type="inner" title="Payment Overview" size="small"><Statistic title="Total Cost" value={f.projectCost} prefix="₹" precision={2} /><div style={{ marginTop: 10 }}>
                <div><b>Advance:</b> {currency(f.advances)}</div><div><b>Loan Credited:</b> {currency(f.loans)}</div><Divider style={{ margin: '8px 0' }} />
                <div><b>Gross Received:</b> {currency(f.grossReceived)}</div><div><b>Customer Refunds:</b> {currency(f.refunded)}</div><div><b>Internal Settlements:</b> {currency(f.internallyAllocated)}</div>
                <div style={{ color: '#10B981', fontWeight: 'bold' }}>Net Received: {currency(f.netReceived)}</div><div style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16, marginTop: 5 }}>Due Balance: {currency(f.remainingDue)}</div><div><b>Available Excess:</b> {currency(f.unsettledExcess)}</div>
            </div></Card></Col>
            <Col xs={24} sm={12}><Card type="inner" title="Bank Details" size="small"><p><b>Bank:</b> {bankDetails?.bankName || 'N/A'}</p><p><b>Loan Amount:</b> {currency(bankDetails?.totalLoanAmount)}</p><p><b>Sanctioned:</b> {currency(bankDetails?.sanctionedAmount)}</p></Card></Col>
        </Row> },
        { key: '3', label: 'Completion Status', children: <CompletionDetails item={record} entity="solarProject" /> },
        { key: '4', label: 'Client Info', children: <Descriptions size="small" bordered column={1}>
            <Descriptions.Item label="Name">{client}</Descriptions.Item><Descriptions.Item label="Contact">{contactNumber}</Descriptions.Item><Descriptions.Item label="Email">{email}</Descriptions.Item><Descriptions.Item label="Consumer Number">{consumerNumber || 'N/A'}</Descriptions.Item><Descriptions.Item label="Light Bill Gen. Date">{lightBillGeneratedDate ? dayjs(lightBillGeneratedDate).format('DD MMM YYYY') : 'N/A'}</Descriptions.Item><Descriptions.Item label="Current Load (kW)">{record.currentLoadOnLightBill || 'N/A'}</Descriptions.Item><Descriptions.Item label="Additional Load (kW)">{record.additionalLoad || 'N/A'}</Descriptions.Item><Descriptions.Item label="Location">{projectState}, {proejctCity || record.villageCity}</Descriptions.Item>
        </Descriptions> },
    ];
    return <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><div><h2 style={{ margin: 0, marginBottom: 8 }}>{client}</h2><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}><Tag color="cyan">Consumer No: {consumerNumber || 'N/A'}</Tag><Tag color="geekblue">App No: {solarRooftopApplicationNo || 'N/A'}</Tag><Tag color="purple">Bill Date: {lightBillGeneratedDate ? dayjs(lightBillGeneratedDate).format('DD MMM YYYY') : 'N/A'}</Tag><Tag color="blue">Capacity: {systemDetails?.capacity || 'N/A'}</Tag></div></div><Tag color={status === 'Active' ? 'green' : 'blue'}>{status}</Tag></div><Tabs defaultActiveKey="1" items={items} /></div>;
}

export default function SolarProjectsPage() {
    const dispatch = useDispatch();
    const translate = useLanguage();
    const entity = 'solarProject';
    const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);
    const { pagination, items: dataSource } = listResult || { pagination: {}, items: [] };
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [isRemarkModalVisible, setIsRemarkModalVisible] = useState(false);
    const [remarkMode, setRemarkMode] = useState('add');
    const [isEdit, setIsEdit] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const handleFormSuccess = useCallback(() => setIsFormModalVisible(false), []);
    useEffect(() => { dispatch(crud.list({ entity, options: { items: 1000 } })); }, [dispatch]);
    const handleRefresh = () => dispatch(crud.list({ entity, options: { items: 1000 } }));
    const handleSearch = e => {
        const value = e.target.value;
        setSearchText(value);
        dispatch(crud.list({ entity, options: { q: value, fields: 'client,systemDetails.systemType', items: 1000 } }));
    };
    const handleAdd = () => { setIsEdit(false); setCurrentRecord(null); dispatch(crud.resetAction({ actionType: 'create' })); setIsFormModalVisible(true); };
    const handleEdit = record => { setIsEdit(true); setCurrentRecord(record); dispatch(crud.currentAction({ actionType: 'update', data: record })); setIsFormModalVisible(true); };
    const handleView = record => { setCurrentRecord(record); setIsViewModalVisible(true); };
    const handleRemark = (record, mode = 'add') => { setCurrentRecord(record); setRemarkMode(mode); setIsRemarkModalVisible(true); };
    const handleDelete = record => Modal.confirm({ title: translate('delete_confirmation'), content: `${translate('are_you_sure_delete')} ${record.client}?`, okText: translate('delete'), okType: 'danger', cancelText: translate('cancel'), onOk: () => { dispatch(crud.delete({ entity, id: record._id })); setTimeout(handleRefresh, 500); } });
    const columns = [
        { title: 'SR NO.', key: 'srNo', render: (_, record, index) => <div style={{ fontWeight: 500, color: '#64748B', display: 'flex', justifyContent: 'center', alignItems: 'center', width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9' }}>{index + 1}</div> },
        { title: 'CLIENT NAME', dataIndex: 'client', key: 'client', render: (name, record) => <div className="client-cell"><Link to={`/solarProject/read/${record._id}`} className="client-name-link" style={{ marginLeft: 0 }}>{name}</Link></div> },
        { title: 'STATUS', dataIndex: 'status', key: 'status', render: status => <span className={`status-badge status-${status || 'Active'}`}>{status || 'Active'}</span> },
        { title: 'DATE', dataIndex: 'created', key: 'created', render: date => <span style={{ color: '#64748B' }}>{dayjs(date).format('DD MMM YYYY')}</span> },
        { title: 'CITY', dataIndex: 'villageCity', key: 'villageCity', render: text => text || <span style={{ color: '#94A3B8' }}>--</span> },
        { title: 'SYSTEM TYPE', dataIndex: ['systemDetails', 'systemType'], key: 'systemType', render: text => <span className="system-tag">{text}</span> },
        { title: 'CAPACITY', dataIndex: ['systemDetails', 'capacity'], key: 'capacity', render: text => <b>{text}</b> },
        { title: 'TOTAL COST', dataIndex: ['paymentDetails', 'totalProjectCost'], key: 'totalProjectCost', render: value => <span className="cost-highlight">{currency(value)}</span> },
        { title: 'REMARK', key: 'remark', align: 'center', render: (_, record) => <Button type="text" icon={<MessageOutlined style={{ fontSize: 18, color: '#6366F1' }} />} onClick={() => handleRemark(record, 'add')} /> },
        { title: '', key: 'action', width: 60, render: (_, record) => {
            const items = [
                { key: 'view', label: 'View Details', icon: <EyeOutlined />, onClick: () => handleView(record) },
                { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => handleEdit(record) },
                { key: 'remarks', label: 'View Remarks History', icon: <MessageOutlined />, onClick: () => handleRemark(record, 'history') },
                { type: 'divider' },
                { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record) },
            ];
            return <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight"><EllipsisOutlined className="action-menu-trigger" style={{ cursor: 'pointer' }} /></Dropdown>;
        } },
    ];
    return <div className="solar-page-container">
        <div className="solar-header"><div className="solar-title-area"><h2><span className="solar-icon-accent"><ThunderboltOutlined /></span> Solar Projects List</h2><p>Manage and track all solar installations</p></div><div className="solar-actions">
            <Input prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: 18 }} />} placeholder="Search projects by client or type..." className="search-pill-solar" variant="borderless" value={searchText} onChange={handleSearch} allowClear />
            <Button className="icon-btn-round" type="text" onClick={handleRefresh}><ReloadOutlined style={{ fontSize: 18 }} /></Button>
            <Button className="btn-gradient-primary" icon={<PlusOutlined />} onClick={handleAdd}>Add New Solar Project</Button>
        </div></div>
        <div style={{ padding: '0 24px', marginBottom: 16 }}><Segmented options={['ALL', 'Current', 'Completed']} value={filterStatus} onChange={setFilterStatus} size="large" style={{ background: '#f8fafc', padding: 4, borderRadius: 8, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} /></div>
        <div className="stats-row"><div className="kpi-energy-card"><div className="energy-icon-box"><ProjectOutlined /></div><div className="energy-content"><h3>{pagination.total || 0}</h3><p>Total Projects</p></div></div></div>
        <div className="floating-data-table"><Table className="custom-table" columns={columns} dataSource={[...(dataSource || [])].sort((a, b) => new Date(b.created) - new Date(a.created)).filter(item => filterStatus === 'ALL' || (item.status || 'Active') === ({ Current: 'Active', Completed: 'Completed' }[filterStatus]))} loading={listIsLoading} rowKey="_id" pagination={false} scroll={{ x: 1000, y: 450 }} /></div>
        <Modal title={isEdit ? 'Edit Solar Project' : 'Add New Solar Project'} open={isFormModalVisible} onCancel={() => setIsFormModalVisible(false)} footer={null} width={800} centered destroyOnClose maskClosable={false} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <LocalSolarProjectForm isUpdate={isEdit} record={currentRecord} onSuccess={handleFormSuccess} />
        </Modal>
        <Modal title="Project Details" open={isViewModalVisible} onCancel={() => setIsViewModalVisible(false)} footer={[<Button key="close" onClick={() => setIsViewModalVisible(false)}>Close</Button>]} width={700} centered destroyOnClose><LocalSolarProjectView record={currentRecord} /></Modal>
        <RemarkModal visible={isRemarkModalVisible} onCancel={() => setIsRemarkModalVisible(false)} record={currentRecord} entity={entity} mode={remarkMode} />
    </div>;
}
