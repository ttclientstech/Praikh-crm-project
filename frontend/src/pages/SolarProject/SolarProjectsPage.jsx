import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Input, Row, Col, Avatar, Tag, Dropdown, Modal, Form, Steps, Divider, Select, DatePicker, Switch, InputNumber, Card, Descriptions, Statistic, Tabs, Segmented } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    EllipsisOutlined,
    ProjectOutlined,
    EditOutlined,
    DeleteOutlined,
    ThunderboltOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    BankOutlined,
    DollarOutlined,
    MinusCircleOutlined,
    MessageOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { crud } from '@/redux/crud/actions';
import { selectListItems, selectCreatedItem, selectUpdatedItem } from '@/redux/crud/selectors';
import useLanguage from '@/locale/useLanguage';
import Loading from '@/components/Loading';
import CompletionDetails from './CompletionDetails';
import '@/style/SolarRedesign.css'; // New Styles

const { Step } = Steps;
const { Option } = Select;

// --- Local Solar Form to avoid Context Dependencies ---

const StepOne = () => (
    <Row gutter={[24, 24]}>
        <Col span={24}><Divider orientation="left">Personal Information</Divider></Col>
        <Col xs={24} sm={24}>
            <Form.Item name="client" label="Client Name" rules={[{ required: true, message: 'Please enter client name' }]}>
                <Input placeholder="Enter Client Name" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="contactNumber" label="Contact Number">
                <Input placeholder="Contact Number" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="consumerNumber" label="Consumer Number (Electricity)">
                <Input placeholder="Electricity Consumer No." />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="solarRooftopApplicationNo" label="Solar Application No">
                <Input placeholder="MahaDiscom/Portal App No." />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="email" label="Email ID" rules={[{ type: 'email' }]}>
                <Input placeholder="Email Address" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="pinCode" label="Pin Code">
                <Input placeholder="Pin Code" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="lightBillGeneratedDate" label="Light Bill Generated Date">
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="currentLoadOnLightBill" label="Current Load on Light Bill (kW)">
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="additionalLoad" label="Additional Load (kW)">
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col span={24}>
            <Form.Item name="address" label="Address">
                <Input.TextArea rows={2} placeholder="Full Address" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="villageCity" label="Village / City">
                <Input placeholder="Village or City" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="projectState" label="State">
                <Input placeholder='State' />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select placeholder="Select Status">
                    <Option value="Active">Active</Option>
                    <Option value="Completed">Completed</Option>
                    <Option value="Cancelled">Cancelled</Option>
                </Select>
            </Form.Item>
        </Col>
    </Row>
);

const StepTwo = () => (
    <Row gutter={[24, 24]}>
        <Col span={24}><Divider orientation="left">Solar System Details</Divider></Col>
        <Col xs={24} sm={8}>
            <Form.Item name={['systemDetails', 'systemType']} label="System Type" rules={[{ required: true }]}>
                <Select placeholder="Select Type">
                    <Option value="OnGrid">On Grid</Option>
                    <Option value="Hybrid">Hybrid</Option>
                    <Option value="OffGrid">Off Grid</Option>
                </Select>
            </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
            <Form.Item name={['systemDetails', 'capacity']} label="Solar Capacity (kW)">
                <Input placeholder="e.g. 5kW" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
            <Form.Item name={['systemDetails', 'structureHeight']} label="Structure Height">
                <Input placeholder="Height in ft/m" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name={['systemDetails', 'solarPanelName']} label="Solar Panel Name">
                <Input placeholder="Panel Brand/Model" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name={['systemDetails', 'solarPanelWatt']} label="Solar Panel Watt">
                <Input placeholder="Wattage per panel" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name={['systemDetails', 'solarPanelNos']} label="Solar Panel NOS">
                <InputNumber style={{ width: '100%' }} placeholder="Number of panels" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name={['systemDetails', 'inverterName']} label="Inverter Name">
                <Input placeholder="Inverter Brand/Model" />
            </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
            <Form.Item name={['systemDetails', 'walkway']} label="Structure Walkway" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
        </Col>
    </Row>
);

const LiveSummary = () => {
    const paymentDetails = Form.useWatch('paymentDetails');
    const bankDetails = Form.useWatch('bankDetails');

    const totalCost = paymentDetails?.totalProjectCost || 0;
    const advancePayments = paymentDetails?.advancePayments || [];
    const loanDisbursals = paymentDetails?.loanDisbursals || [];
    const legacyLoan = paymentDetails?.loanCreditedAmount || 0;

    const totalAdvances = advancePayments.reduce((sum, item) => sum + (item?.amount || 0), 0);
    const totalLoans = loanDisbursals.reduce((sum, item) => sum + (item?.amount || 0), 0) + legacyLoan;
    const totalReceived = totalAdvances + totalLoans;
    const remaining = totalCost - totalReceived;

    const isBankLoan = bankDetails?.isBankLoan;
    const sanctionedAmount = bankDetails?.sanctionedAmount || 0;
    const remainingLoan = sanctionedAmount - totalLoans;

    const currency = (val) => `₹ ${val || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return (
        <Card size="small" style={{ marginBottom: 20, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <Row justify="space-around">
                <Col>
                    <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>Total Project Cost</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>{currency(totalCost)}</div>
                </Col>
                <Col>
                    <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>Total Received</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#10b981' }}>{currency(totalReceived)}</div>
                </Col>
                <Col>
                    <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>Remaining Balance</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ef4444' }}>{currency(remaining)}</div>
                </Col>
            </Row>

            {isBankLoan && (
                <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Row justify="space-around">
                        <Col>
                            <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>Sanctioned Loan</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>{currency(sanctionedAmount)}</div>
                        </Col>
                        <Col>
                            <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>Loan Disbursed</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#8b5cf6' }}>{currency(totalLoans)}</div>
                        </Col>
                        <Col>
                            <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>Pending Disbursal</div>
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: remainingLoan > 0 ? '#f59e0b' : '#10b981' }}>{currency(remainingLoan)}</div>
                        </Col>
                    </Row>
                </>
            )}
        </Card>
    );
}

const AdvanceHistoryTable = () => {
    const paymentDetails = Form.useWatch('paymentDetails');
    const advancePayments = paymentDetails?.advancePayments || [];
    const legacyAdvance1 = paymentDetails?.advancePayment1;
    const legacyAdvance2 = paymentDetails?.advancePayment2;

    const transactions = [];

    if (advancePayments && advancePayments.length > 0) {
        advancePayments.forEach((payment, index) => {
            if (payment && payment.amount) {
                transactions.push({
                    key: `adv_${index}`,
                    description: `Advance Payment ${index + 1}`,
                    mode: payment.mode,
                    date: payment.date,
                    amount: payment.amount,
                    color: 'blue'
                });
            }
        });
    }

    if (legacyAdvance1) {
        transactions.push({
            key: 'adv_legacy_1',
            description: 'Advance Payment 1',
            mode: paymentDetails.advancePayment1Mode,
            date: paymentDetails.advancePayment1Date,
            amount: legacyAdvance1,
            color: 'blue'
        });
    }
    if (legacyAdvance2) {
        transactions.push({
            key: 'adv_legacy_2',
            description: 'Advance Payment 2',
            mode: paymentDetails.advancePayment2Mode,
            date: paymentDetails.advancePayment2Date,
            amount: legacyAdvance2,
            color: 'blue'
        });
    }

    transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const columns = [
        { title: 'Description', dataIndex: 'description', key: 'description', render: (text, record) => <Tag color={record.color}>{text}</Tag> },
        { title: 'Mode', dataIndex: 'mode', key: 'mode', render: (text) => text || '-' },
        { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-' },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (amount) => <b>{`₹ ${amount}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</b> }
    ];

    if (transactions.length === 0) return null;

    return (
        <Table dataSource={transactions} columns={columns} pagination={false} size="small" bordered title={() => <b>Advance Payments History</b>} />
    );
}

const LoanHistoryTable = () => {
    const paymentDetails = Form.useWatch('paymentDetails');
    const loanDisbursals = paymentDetails?.loanDisbursals || [];
    const legacyLoan = paymentDetails?.loanCreditedAmount;

    const transactions = [];

    if (legacyLoan) {
        transactions.push({
            key: 'loan_credit_legacy',
            description: 'Loan Amount Bank Credited',
            mode: 'Bank Transfer',
            date: paymentDetails.loanCreditedDate,
            amount: legacyLoan,
            color: 'purple'
        });
    }

    if (loanDisbursals && loanDisbursals.length > 0) {
        loanDisbursals.forEach((loan, index) => {
            if (loan && loan.amount) {
                transactions.push({
                    key: `loan_${index}`,
                    description: `Loan ${index + 1} Disbursed`,
                    mode: 'Bank Transfer',
                    date: loan.date,
                    amount: loan.amount,
                    color: 'purple'
                });
            }
        });
    }

    transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const columns = [
        { title: 'Description', dataIndex: 'description', key: 'description', render: (text, record) => <Tag color={record.color}>{text}</Tag> },
        { title: 'Mode', dataIndex: 'mode', key: 'mode', render: (text) => text || '-' },
        { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-' },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (amount) => <b>{`₹ ${amount}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</b> }
    ];

    if (transactions.length === 0) return null;

    return (
        <Table dataSource={transactions} columns={columns} pagination={false} size="small" bordered title={() => <b>Loan Disbursals History</b>} />
    );
}

const StepThree = () => {
    const isBankLoan = Form.useWatch(['bankDetails', 'isBankLoan']);

    return (
        <Row gutter={[24, 24]}>
            <Col span={24}><Divider orientation="left">Payment Details</Divider></Col>
            <Col span={24}>
                <Form.Item name={['paymentDetails', 'totalProjectCost']} label="Total Project Cost">
                    <InputNumber style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\₹\s?|(,*)/g, '')} />
                </Form.Item>
            </Col>

            {/* Dynamic Advance Payments */}
            <Col span={24}>
                <Form.List name={['paymentDetails', 'advancePayments']}>
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <div key={key} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px', background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
                                    <Row gutter={[12, 12]} style={{ flex: 1 }}>
                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'amount']}
                                                label={`Advance Payment ${index + 1}`}
                                                rules={[{ required: true, message: 'Missing amount' }]}
                                            >
                                                <InputNumber style={{ width: '100%' }} placeholder="Amount" formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\₹\s?|(,*)/g, '')} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'mode']}
                                                label="Mode"
                                                rules={[{ required: true, message: 'Missing mode' }]}
                                            >
                                                <Select placeholder="Mode">
                                                    <Option value="Cash">Cash</Option>
                                                    <Option value="Online">Online</Option>
                                                    <Option value="Cheque">Cheque</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'date']}
                                                label="Date"
                                                rules={[{ required: true, message: 'Missing date' }]}
                                            >
                                                <DatePicker style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: '38px', color: '#ff4d4f', fontSize: '18px', cursor: 'pointer' }} />
                                </div>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Advance Payment
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Col>


            {/* Advance Payment History Table matching Dashboard */}
            <Col span={24}>
                <div style={{ marginTop: 10 }}>
                    <AdvanceHistoryTable />
                </div>
            </Col>

            <Col span={24}><Divider orientation="left">Bank & Loan Details</Divider></Col>
            <Col span={24}>
                <Form.Item name={['bankDetails', 'isBankLoan']} label="Is Bank Loan Applied?" valuePropName="checked">
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
                <Form.Item name={['bankDetails', 'bankName']} label="Bank Name">
                    <Input placeholder="Bank Name" disabled={!isBankLoan} />
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item name={['bankDetails', 'sanctionedAmount']} label="Sanctioned Amount">
                    <InputNumber style={{ width: '100%' }} disabled={!isBankLoan} />
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item name={['bankDetails', 'customerIfscCode']} label="Customer IFSC">
                    <Input placeholder="IFSC Code" disabled={!isBankLoan} />
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item name={['bankDetails', 'solarRooftopIfscCode']} label="Solar Rooftop IFSC">
                    <Input placeholder="Rooftop IFSC Code" disabled={!isBankLoan} />
                </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
                <Form.Item name={['bankDetails', 'totalLoanAmount']} label="Total Loan Amount">
                    <InputNumber style={{ width: '100%' }} disabled={!isBankLoan} />
                </Form.Item>
            </Col>

            <Col span={24}><Divider orientation="left">Loan Disbursals</Divider></Col>
            <Col span={24}>
                <Form.List name={['paymentDetails', 'loanDisbursals']}>
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <div key={key} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px', background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
                                    <Row gutter={[12, 12]} style={{ flex: 1 }}>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'amount']}
                                                label={`Loan ${index + 1} Amount`}
                                                rules={[{ required: true, message: 'Missing amount' }]}
                                            >
                                                <InputNumber style={{ width: '100%' }} placeholder="Amount" formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\₹\s?|(,*)/g, '')} disabled={!isBankLoan} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'date']}
                                                label="Date"
                                                rules={[{ required: true, message: 'Missing date' }]}
                                            >
                                                <DatePicker style={{ width: '100%' }} disabled={!isBankLoan} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: '38px', color: '#ff4d4f', fontSize: '18px', cursor: 'pointer', display: isBankLoan ? 'block' : 'none' }} />
                                </div>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} disabled={!isBankLoan}>
                                    Add Loan Disbursal
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Col>

            {/* Loan History Table matching Dashboard */}
            <Col span={24}>
                <div style={{ marginTop: 10 }}>
                    <LoanHistoryTable />
                </div>
            </Col>

            {/* Live Financial Summary */}
            <Col span={24}>
                <div style={{ background: '#f0faff', padding: '15px', borderRadius: '8px', border: '1px solid #bae7ff', marginTop: '20px' }}>
                    <LiveSummary />
                </div>
            </Col>

        </Row >
    );
};


function LocalSolarProjectForm({ isUpdate = false, record, onSuccess }) {
    const dispatch = useDispatch();
    const entity = 'solarProject';

    // Selectors based on mode
    const { isLoading: isLoadingCreate, isSuccess: isSuccessCreate } = useSelector(selectCreatedItem);
    const { isLoading: isLoadingUpdate, isSuccess: isSuccessUpdate } = useSelector(selectUpdatedItem);

    const isLoading = isUpdate ? isLoadingUpdate : isLoadingCreate;
    const isSuccess = isUpdate ? isSuccessUpdate : isSuccessCreate;

    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { title: 'Personal Info', content: 'Personal Information & Client Details' },
        { title: 'Solar System', content: 'System Configuration & Details' },
        { title: 'Payment & Bank', content: 'Financials, Loans, and Payment Tracker' },
    ];

    useEffect(() => {
        if (isUpdate && record) {
            // Populate form
            let formatValues = { ...record };
            if (formatValues.lightBillGeneratedDate) {
                formatValues.lightBillGeneratedDate = dayjs(formatValues.lightBillGeneratedDate);
            }
            // Format dates
            if (formatValues.paymentDetails) {
                const pd = formatValues.paymentDetails;
                // Migration: If advancePayment1 or 2 exists but advancePayments array is missing/empty
                if (!pd.advancePayments || pd.advancePayments.length === 0) {
                    const migratedPayments = [];
                    if (pd.advancePayment1) {
                        migratedPayments.push({
                            amount: pd.advancePayment1,
                            mode: pd.advancePayment1Mode,
                            date: pd.advancePayment1Date ? dayjs(pd.advancePayment1Date) : null
                        });
                    }
                    if (pd.advancePayment2) {
                        migratedPayments.push({
                            amount: pd.advancePayment2,
                            mode: pd.advancePayment2Mode,
                            date: pd.advancePayment2Date ? dayjs(pd.advancePayment2Date) : null
                        });
                    }
                    if (migratedPayments.length > 0) {
                        pd.advancePayments = migratedPayments;
                    }
                } else {
                    // Format dates in existing advancePayments array
                    pd.advancePayments = pd.advancePayments.map(p => ({
                        ...p,
                        date: p.date ? dayjs(p.date) : null
                    }));
                }

                // Migrate/Format loanDisbursals
                if (!pd.loanDisbursals || pd.loanDisbursals.length === 0) {
                    if (pd.loanCreditedAmount) {
                        pd.loanDisbursals = [{
                            amount: pd.loanCreditedAmount,
                            date: pd.loanCreditedDate ? dayjs(pd.loanCreditedDate) : null
                        }];
                    }
                } else {
                    pd.loanDisbursals = pd.loanDisbursals.map(l => ({
                        ...l,
                        date: l.date ? dayjs(l.date) : null
                    }));
                }
            }
            form.setFieldsValue(formatValues);
        } else {
            form.resetFields();
            form.setFieldsValue({
                projectState: 'Maharashtra',
                status: 'Active'
            })
        }
    }, [isUpdate, record]);

    useEffect(() => {
        if (isSuccess) {
            dispatch(crud.resetAction({ actionType: isUpdate ? 'update' : 'create' }));
            dispatch(crud.list({ entity }));
            onSuccess();
        }
    }, [isSuccess]);

    const onFinish = (values) => {
        const jsonData = {
            ...values,
            lightBillGeneratedDate: values.lightBillGeneratedDate ? dayjs(values.lightBillGeneratedDate).format() : undefined,
            paymentDetails: {
                ...values.paymentDetails,
                advancePayments: (values.paymentDetails?.advancePayments || []).map(p => ({
                    ...p,
                    date: p.date ? dayjs(p.date).format() : undefined
                })),
                loanDisbursals: (values.paymentDetails?.loanDisbursals || []).map(l => ({
                    ...l,
                    date: l.date ? dayjs(l.date).format() : undefined
                })),
            }
        };

        if (isUpdate) {
            dispatch(crud.update({ entity, id: record._id, jsonData }));
        } else {
            dispatch(crud.create({ entity, jsonData }));
        }
    };

    const stepFields = [
        ['client', 'contactNumber', 'consumerNumber', 'solarRooftopApplicationNo', 'email', 'pinCode', 'lightBillGeneratedDate', 'currentLoadOnLightBill', 'additionalLoad', 'address', 'villageCity', 'projectState', 'status'],
        [['systemDetails', 'systemType'], ['systemDetails', 'capacity'], ['systemDetails', 'structureHeight'], ['systemDetails', 'solarPanelName'], ['systemDetails', 'solarPanelWatt'], ['systemDetails', 'solarPanelNos'], ['systemDetails', 'inverterName'], ['systemDetails', 'walkway']],
        [['paymentDetails', 'totalProjectCost'], ['paymentDetails', 'advancePayments'], ['bankDetails', 'isBankLoan'], ['bankDetails', 'bankName'], ['bankDetails', 'sanctionedAmount'], ['bankDetails', 'customerIfscCode'], ['bankDetails', 'solarRooftopIfscCode'], ['bankDetails', 'totalLoanAmount'], ['paymentDetails', 'loanDisbursals']]
    ];

    const next = () => {
        form.validateFields(stepFields[currentStep]).then(() => {
            setCurrentStep(currentStep + 1);
        }).catch((err) => {
            console.log("Validation Failed:", err);
        });
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    return (
        <div style={{ marginTop: 20 }}>
            <Steps current={currentStep} style={{ marginBottom: 40 }} size="small">
                {steps.map(item => <Step key={item.title} title={item.title} />)}
            </Steps>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ projectState: 'Maharashtra', status: 'Active' }}
                preserve={true}
            >
                <div style={{ marginBottom: 30, minHeight: 400 }}>
                    <div style={{ display: currentStep === 0 ? 'block' : 'none' }}><StepOne /></div>
                    <div style={{ display: currentStep === 1 ? 'block' : 'none' }}><StepTwo /></div>
                    <div style={{ display: currentStep === 2 ? 'block' : 'none' }}><StepThree /></div>
                </div>

                <div style={{ textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                    {currentStep > 0 && (
                        <Button style={{ margin: '0 8px' }} onClick={prev}>
                            Previous
                        </Button>
                    )}
                    {currentStep < steps.length - 1 && (
                        <Button type="primary" onClick={next}>
                            Next
                        </Button>
                    )}
                    {currentStep === steps.length - 1 && (
                        <Button type="primary" htmlType="submit" loading={isLoading}>
                            {isUpdate ? 'Update Project' : 'Save Project'}
                        </Button>
                    )}
                </div>
            </Form>
        </div>
    );
}

// --- Local View (Read Only + Completion) ---

function RemarkModal({ visible, onCancel, record, entity, initialTab = 'loan', mode = 'add' }) {
    const dispatch = useDispatch();
    const [newRemark, setNewRemark] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!record) return null;

    const handleSave = (type) => {
        if (!newRemark.trim()) return;
        setSubmitting(true);

        const historyField = type === 'Loan' ? 'loanRemarksHistory' : 'personalRemarksHistory';
        const currentHistory = record[historyField] || [];

        const updateData = {
            [historyField]: [...currentHistory, { comment: newRemark, date: new Date() }]
        };

        dispatch(crud.update({ entity, id: record._id, jsonData: updateData }));

        setTimeout(() => {
            setNewRemark('');
            setSubmitting(false);
            // We don't close modal here to let user see the update if list refreshes, 
            // but usually we refresh list
            dispatch(crud.list({ entity, options: { items: 1000 } }));
        }, 800);
    };

    const renderHistory = (history) => (
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', padding: mode === 'history' ? '0' : '10px', background: mode === 'history' ? 'transparent' : '#F8FAFC', borderRadius: '8px' }}>
            {(!history || history.length === 0) ? (
                <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>No history yet</p>
            ) : (
                (mode === 'history' ? history.slice().reverse() : [history[history.length - 1]]).map((item, index) => (
                    <div key={index} style={{ marginBottom: mode === 'history' ? '16px' : '0', padding: mode === 'history' ? '12px' : '0', background: mode === 'history' ? '#F8FAFC' : 'transparent', borderRadius: '8px', border: mode === 'history' ? '1px solid #E2E8F0' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', fontSize: '12px', color: '#64748B' }}>
                                {dayjs(item.date).format('DD MMM YYYY, hh:mm A')}
                            </span>
                        </div>
                        <div style={{ color: '#1E293B', fontSize: '14px' }}>{item.comment}</div>
                    </div>
                ))
            )}
        </div>
    );

    const tabItems = [
        {
            key: 'loan',
            label: 'Remarks on Loan',
            children: (
                <div>
                    {renderHistory(record.loanRemarksHistory)}
                    {mode === 'add' && (
                        <>
                            <Input.TextArea
                                rows={3}
                                placeholder="Add new loan remark..."
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                            />
                            <Button
                                type="primary"
                                onClick={() => handleSave('Loan')}
                                loading={submitting}
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                Save Loan Remark
                            </Button>
                        </>
                    )}
                </div>
            )
        },
        {
            key: 'personal',
            label: 'Remarks on Personal',
            children: (
                <div>
                    {renderHistory(record.personalRemarksHistory)}
                    {mode === 'add' && (
                        <>
                            <Input.TextArea
                                rows={3}
                                placeholder="Add new personal remark..."
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                            />
                            <Button
                                type="primary"
                                onClick={() => handleSave('Personal')}
                                loading={submitting}
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                Save Personal Remark
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <Modal
            title={mode === 'add' ? `Add Remark: ${record.client}` : `Remark History: ${record.client}`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={500}
            centered
            destroyOnClose
        >
            <Tabs defaultActiveKey={initialTab} items={tabItems} onChange={() => setNewRemark('')} />
        </Modal>
    );
}

function LocalSolarProjectView({ record }) {
    if (!record) return null;
    const { client, systemDetails, bankDetails, paymentDetails, completionDetails, status, proejctCity, projectState, contactNumber, email, consumerNumber, lightBillGeneratedDate, solarRooftopApplicationNo } = record;

    // Formatter
    const currency = (val) => val ? `₹ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '₹ 0';

    const totalAdvances = paymentDetails?.advancePayments?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const totalLoans = paymentDetails?.loanDisbursals?.reduce((sum, item) => sum + (item.amount || 0), 0) || (paymentDetails?.loanCreditedAmount || 0);
    const totalReceived = totalAdvances + totalLoans;
    const balanceDue = (paymentDetails?.totalProjectCost || 0) - totalReceived;

    const items = [
        {
            key: '1',
            label: 'System & Configuration',
            children: (
                <Descriptions title="" bordered column={1} size="small">
                    <Descriptions.Item label="System Type">{systemDetails?.systemType}</Descriptions.Item>
                    <Descriptions.Item label="Capacity">{systemDetails?.capacity}</Descriptions.Item>
                    <Descriptions.Item label="Panel Name">{systemDetails?.solarPanelName}</Descriptions.Item>
                    <Descriptions.Item label="Panel Wattage">{systemDetails?.solarPanelWatt}</Descriptions.Item>
                    <Descriptions.Item label="Inverter Name">{systemDetails?.inverterName}</Descriptions.Item>
                    <Descriptions.Item label="Structure Height">{systemDetails?.structureHeight}</Descriptions.Item>
                    <Descriptions.Item label="Walkway">{systemDetails?.walkway ? 'Yes' : 'No'}</Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: '2',
            label: 'Financials',
            children: (
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <Card type="inner" title="Payment Overview" size="small">
                            <Statistic title="Total Cost" value={paymentDetails?.totalProjectCost} prefix="₹" precision={2} />
                            <div style={{ marginTop: 10 }}>
                                <div><b>Advance:</b> {currency(totalAdvances)}</div>
                                <div><b>Loan Credited:</b> {currency(totalLoans)}</div>
                                <Divider style={{ margin: '8px 0' }} />
                                <div style={{ color: '#10B981', fontWeight: 'bold' }}>Total Received: {currency(totalReceived)}</div>
                                <div style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '16px', marginTop: 5 }}>Due Balance: {currency(balanceDue)}</div>
                            </div>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card type="inner" title="Bank Details" size="small">
                            <p><b>Bank:</b> {bankDetails?.bankName || 'N/A'}</p>
                            <p><b>Loan Amount:</b> {currency(bankDetails?.totalLoanAmount)}</p>
                            <p><b>Sanctioned:</b> {currency(bankDetails?.sanctionedAmount)}</p>
                        </Card>
                    </Col>
                </Row>
            ),
        },
        {
            key: '3',
            label: 'Completion Status',
            children: (
                <CompletionDetails item={record} entity="solarProject" />
            )
        },
        {
            key: '4',
            label: 'Client Info',
            children: (
                <Descriptions size="small" bordered column={1}>
                    <Descriptions.Item label="Name">{client}</Descriptions.Item>
                    <Descriptions.Item label="Contact">{contactNumber}</Descriptions.Item>
                    <Descriptions.Item label="Email">{email}</Descriptions.Item>
                    <Descriptions.Item label="Consumer Number">{record.consumerNumber || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Light Bill Gen. Date">{record.lightBillGeneratedDate ? dayjs(record.lightBillGeneratedDate).format('DD MMM YYYY') : 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Current Load (kW)">{record.currentLoadOnLightBill || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Additional Load (kW)">{record.additionalLoad || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Location">{projectState}, {proejctCity}</Descriptions.Item>
                </Descriptions>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ margin: 0, marginBottom: '8px' }}>{client}</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <Tag color="cyan">Consumer No: {consumerNumber || 'N/A'}</Tag>
                        <Tag color="geekblue">App No: {solarRooftopApplicationNo || 'N/A'}</Tag>
                        <Tag color="purple">Bill Date: {lightBillGeneratedDate ? dayjs(lightBillGeneratedDate).format('DD MMM YYYY') : 'N/A'}</Tag>
                        <Tag color="blue">Capacity: {systemDetails?.capacity || 'N/A'}</Tag>
                    </div>
                </div>
                <div>
                    <Tag color={status === 'Active' ? 'green' : 'blue'}>{status}</Tag>
                </div>
            </div>

            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
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
    const [remarkMode, setRemarkMode] = useState('add'); // 'add' or 'history'

    const [isEdit, setIsEdit] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // New Filter State default to ALL

    useEffect(() => {
        dispatch(crud.list({ entity, options: { items: 1000 } }));
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(crud.list({ entity, options: { items: 1000 } }));
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchText(value);
        const options = { q: value, fields: 'client,systemDetails.systemType', items: 1000 };
        dispatch(crud.list({ entity, options }));
    };

    const handleAdd = () => {
        setIsEdit(false);
        setCurrentRecord(null);
        dispatch(crud.resetAction({ actionType: 'create' }));
        setIsFormModalVisible(true);
    };

    const handleEdit = (record) => {
        setIsEdit(true);
        setCurrentRecord(record);
        dispatch(crud.currentAction({ actionType: 'update', data: record }));
        setIsFormModalVisible(true);
    };

    const handleView = (record) => {
        setCurrentRecord(record);
        setIsViewModalVisible(true);
    };

    const handleRemark = (record, mode = 'add') => {
        setCurrentRecord(record);
        setRemarkMode(mode);
        setIsRemarkModalVisible(true);
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: translate('delete_confirmation'),
            content: `${translate('are_you_sure_delete')} ${record.client}?`,
            okText: translate('delete'),
            okType: 'danger',
            cancelText: translate('cancel'),
            onOk: () => {
                dispatch(crud.delete({ entity, id: record._id }));
                setTimeout(() => handleRefresh(), 500);
            }
        });
    };

    const columns = [
        {
            title: 'SR NO.',
            key: 'srNo',
            render: (text, record, index) => (
                <div style={{ fontWeight: '500', color: '#64748B', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9' }}>
                    {index + 1}
                </div>
            )
        },
        {
            title: 'CLIENT NAME',
            dataIndex: 'client',
            key: 'client',
            render: (name, record) => (
                <div className="client-cell">
                    <Link to={`/solarProject/read/${record._id}`} className="client-name-link" style={{ marginLeft: 0 }}>{name}</Link>
                </div>
            )
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <span className={`status-badge status-${status || 'Active'}`}>
                    {status || 'Active'}
                </span>
            )
        },
        {
            title: 'DATE',
            dataIndex: 'created',
            key: 'created',
            render: (date) => <span style={{ color: '#64748B' }}>{dayjs(date).format('DD MMM YYYY')}</span>
        },
        {
            title: 'CITY',
            dataIndex: 'villageCity',
            key: 'villageCity',
            render: (text) => text || <span style={{ color: '#94A3B8' }}>--</span>
        },
        {
            title: 'SYSTEM TYPE',
            dataIndex: ['systemDetails', 'systemType'],
            key: 'systemType',
            render: (text) => <span className="system-tag">{text}</span>
        },
        {
            title: 'CAPACITY',
            dataIndex: ['systemDetails', 'capacity'],
            key: 'capacity',
            render: (text) => <b>{text}</b>
        },
        {
            title: 'TOTAL COST',
            dataIndex: ['paymentDetails', 'totalProjectCost'],
            key: 'totalProjectCost',
            render: (value) => <span className="cost-highlight">₹ {`${value || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
        },
        {
            title: 'REMARK',
            key: 'remark',
            align: 'center',
            render: (text, record) => (
                <Button
                    type="text"
                    icon={<MessageOutlined style={{ fontSize: '18px', color: '#6366F1' }} />}
                    onClick={() => handleRemark(record, 'add')}
                />
            )
        },
        {
            title: '',
            key: 'action',
            width: 60,
            render: (_, record) => {
                const items = [
                    { key: 'view', label: 'View Details', icon: <EyeOutlined />, onClick: () => handleView(record) },
                    { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => handleEdit(record) },
                    { key: 'remarks', label: 'View Remarks History', icon: <MessageOutlined />, onClick: () => handleRemark(record, 'history') },
                    { type: 'divider' },
                    { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record) },
                ];
                return (
                    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                        <EllipsisOutlined className="action-menu-trigger" style={{ cursor: 'pointer' }} />
                    </Dropdown>
                )
            }
        }
    ];

    return (
        <div className="solar-page-container">
            {/* Header */}
            <div className="solar-header">
                <div className="solar-title-area">
                    <h2>
                        <span className="solar-icon-accent"><ThunderboltOutlined /></span>
                        Solar Projects List
                    </h2>
                    <p>Manage and track all solar installations</p>
                </div>
                <div className="solar-actions">
                    <Input
                        prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: '18px' }} />}
                        placeholder="Search projects by client or type..."
                        className="search-pill-solar"
                        variant="borderless"
                        value={searchText}
                        onChange={handleSearch}
                        allowClear
                    />
                    <Button className="icon-btn-round" type="text" onClick={handleRefresh}>
                        <ReloadOutlined style={{ fontSize: '18px' }} />
                    </Button>
                    <Button className="btn-gradient-primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Add New Solar Project
                    </Button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ padding: '0 24px', marginBottom: '16px' }}>
                <Segmented
                    options={['ALL', 'Current', 'Completed']}
                    value={filterStatus}
                    onChange={(val) => setFilterStatus(val)}
                    size="large"
                    style={{ background: '#f8fafc', padding: '4px', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                />
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="kpi-energy-card">
                    <div className="energy-icon-box">
                        <ProjectOutlined />
                    </div>
                    <div className="energy-content">
                        <h3>{pagination.total || 0}</h3>
                        <p>Total Projects</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="floating-data-table">
                <Table
                    className="custom-table"
                    columns={columns}
                    dataSource={[...dataSource]
                        .sort((a, b) => new Date(b.created) - new Date(a.created)) // Consistent Order
                        .filter(item => {
                            if (filterStatus === 'ALL') return true;
                            const statusMap = { 'Current': 'Active', 'Completed': 'Completed' };
                            const s = item.status || 'Active';
                            return s === statusMap[filterStatus];
                        })
                    }
                    loading={false}
                    rowKey="_id"
                    pagination={false}
                    scroll={{ x: 1000, y: 450 }}
                />
            </div>

            {/* Form Modal */}
            <Modal
                title={isEdit ? "Edit Solar Project" : "Add New Solar Project"}
                open={isFormModalVisible}
                onCancel={() => setIsFormModalVisible(false)}
                footer={null}
                width={800}
                centered
                destroyOnClose
                maskClosable={false}
                style={{ borderRadius: '16px', overflow: 'hidden' }}
            >
                <LocalSolarProjectForm
                    isUpdate={isEdit}
                    record={currentRecord}
                    onSuccess={() => setIsFormModalVisible(false)}
                />
            </Modal>

            {/* View Modal */}
            <Modal
                title="Project Details"
                open={isViewModalVisible}
                onCancel={() => setIsViewModalVisible(false)}
                footer={[<Button key="close" onClick={() => setIsViewModalVisible(false)}>Close</Button>]}
                width={700}
                centered
                destroyOnClose
            >
                <LocalSolarProjectView record={currentRecord} />
            </Modal>

            <RemarkModal
                visible={isRemarkModalVisible}
                onCancel={() => setIsRemarkModalVisible(false)}
                record={currentRecord}
                entity={entity}
                mode={remarkMode}
            />
        </div>
    );
}
