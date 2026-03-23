import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Select, DatePicker, Switch, Steps, Card, Row, Col, Divider, Table, Tag } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { crud } from '@/redux/crud/actions';
import { useCrudContext } from '@/context/crud';
import { selectCreatedItem } from '@/redux/crud/selectors';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Step } = Steps;
const { Option } = Select;

const StepOne = () => (
    <Row gutter={[24, 24]}>
        <Col span={24}><Divider orientation="left">Personal Information</Divider></Col>
        <Col span={24}>
            <Form.Item name="client" label="Client Name" rules={[{ required: true, message: 'Please enter client name' }]}>
                <Input placeholder="Enter Client Name" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="contactNumber" label="Consumer Number">
                <Input placeholder="Consumer Number" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="consumerNumber" label="Consumer Number (Electricity)">
                <Input placeholder="Electricity Consumer No." />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="solarRooftopApplicationNo" label="Solar Application No">
                <Input placeholder="MahaDiscom/Portal App No." />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="email" label="Email ID" rules={[{ type: 'email' }]}>
                <Input placeholder="Email Address" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="pinCode" label="Pin Code">
                <Input placeholder="Pin Code" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="lightBillGeneratedDate" label="Light Bill Generated Date">
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="currentLoadOnLightBill" label="Current Load on Light Bill (kW)">
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="additionalLoad" label="Additional Load (kW)">
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col span={24}>
            <Form.Item name="address" label="Address">
                <Input.TextArea rows={2} placeholder="Full Address" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="villageCity" label="Village / City">
                <Input placeholder="Village or City" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name="projectState" label="State">
                <Input placeholder='State' />
            </Form.Item>
        </Col>
    </Row>
);

const StepTwo = () => (
    <Row gutter={[24, 24]}>
        <Col span={24}><Divider orientation="left">Solar System Details</Divider></Col>
        <Col span={8}>
            <Form.Item name={['systemDetails', 'systemType']} label="System Type" rules={[{ required: true }]}>
                <Select placeholder="Select Type">
                    <Option value="OnGrid">On Grid</Option>
                    <Option value="Hybrid">Hybrid</Option>
                    <Option value="OffGrid">Off Grid</Option>
                </Select>
            </Form.Item>
        </Col>
        <Col span={8}>
            <Form.Item name={['systemDetails', 'capacity']} label="Solar Capacity (kW)">
                <Input placeholder="e.g. 5kW" />
            </Form.Item>
        </Col>
        <Col span={8}>
            <Form.Item name={['systemDetails', 'structureHeight']} label="Structure Height">
                <Input placeholder="Height in ft/m" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name={['systemDetails', 'solarPanelName']} label="Solar Panel Name">
                <Input placeholder="Panel Brand/Model" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name={['systemDetails', 'solarPanelWatt']} label="Solar Panel Watt">
                <Input placeholder="Wattage per panel" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name={['systemDetails', 'inverterName']} label="Inverter Name">
                <Input placeholder="Inverter Brand/Model" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name={['systemDetails', 'walkway']} label="Structure Walkway" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
        </Col>
    </Row>
);

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

const StepThree = () => (
    <Row gutter={[24, 24]}>
        <Col span={24}><Divider orientation="left">Payment Details</Divider></Col>
        <Col span={24}>
            <Form.Item name={['paymentDetails', 'totalProjectCost']} label="Total Project Cost">
                <InputNumber style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\₹\s?|(,*)/g, '')} />
            </Form.Item>
        </Col>

        {/* Advance Payment 1 */}
        <Col span={8}>
            <Form.Item name={['paymentDetails', 'advancePayment1']} label="Advance Payment 1">
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col span={8}>
            <Form.Item name={['paymentDetails', 'advancePayment1Mode']} label="Mode">
                <Select placeholder="Mode">
                    <Option value="Cash">Cash</Option>
                    <Option value="Online">Online</Option>
                    <Option value="Cheque">Cheque</Option>
                </Select>
            </Form.Item>
        </Col>
        <Col span={8}>
            <Form.Item name={['paymentDetails', 'advancePayment1Date']} label="Date">
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>
        </Col>

        {/* Advance Payment 2 */}
        <Col span={8}>
            <Form.Item name={['paymentDetails', 'advancePayment2']} label="Advance Payment 2">
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col span={8}>
            <Form.Item name={['paymentDetails', 'advancePayment2Mode']} label="Mode">
                <Select placeholder="Mode">
                    <Option value="Cash">Cash</Option>
                    <Option value="Online">Online</Option>
                    <Option value="Cheque">Cheque</Option>
                </Select>
            </Form.Item>
        </Col>
        <Col span={8}>
            <Form.Item name={['paymentDetails', 'advancePayment2Date']} label="Date">
                <DatePicker style={{ width: '100%' }} />
            </Form.Item>
        </Col>

        {/* Advance Payment History Table */}
        <Col span={24}>
            <div style={{ marginTop: 10 }}>
                <AdvanceHistoryTable />
            </div>
        </Col>

        <Col span={24}><Divider orientation="left">Bank & Loan Details</Divider></Col>
        <Col span={12}>
            <Form.Item name={['bankDetails', 'bankName']} label="Bank Name">
                <Input placeholder="Bank Name" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name={['bankDetails', 'sanctionedAmount']} label="Sanctioned Amount">
                <InputNumber style={{ width: '100%' }} />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name={['bankDetails', 'customerIfscCode']} label="Customer IFSC">
                <Input placeholder="IFSC Code" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name={['bankDetails', 'solarRooftopIfscCode']} label="Solar Rooftop IFSC">
                <Input placeholder="Rooftop IFSC Code" />
            </Form.Item>
        </Col>
        <Col span={12}>
            <Form.Item name={['bankDetails', 'totalLoanAmount']} label="Total Loan Amount">
                <InputNumber style={{ width: '100%' }} />
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
                                            <InputNumber style={{ width: '100%' }} placeholder="Amount" formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\₹\s?|(,*)/g, '')} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
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
                                Add Loan Disbursal
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
        </Col>

        {/* Loan History Table */}
        <Col span={24}>
            <div style={{ marginTop: 10 }}>
                <LoanHistoryTable />
            </div>
        </Col>
    </Row>
);

export default function SolarProjectForm({ config, isUpdateForm = false }) {
    const translate = useLanguage();
    const dispatch = useDispatch();
    const { crudContextAction } = useCrudContext();
    const { panel, collapsedBox, readBox } = crudContextAction;
    const { isLoading, isSuccess, result } = useSelector(selectCreatedItem);
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: 'Personal Info',
            content: 'Personal Information & Client Details',
        },
        {
            title: 'Solar System',
            content: 'System Configuration & Details',
        },
        {
            title: 'Payment & Bank',
            content: 'Financials, Loans, and Payment Tracker',
        },
    ];

    useEffect(() => {
        if (isSuccess) {
            form.resetFields();
            dispatch(crud.resetAction({ actionType: 'create' }));
            // Open the new item's dashboard
            if (result) {
                dispatch(crud.currentItem({ data: result }));
                panel.open();
                collapsedBox.open();
                readBox.open();
            }
        }
    }, [isSuccess]);

    const onFinish = (values) => {
        // Flatten nested checks if any, though Antd handles dot notation mostly well with initialValues
        // We might need to format dates before sending
        const formattedValues = {
            ...values,
            lightBillGeneratedDate: values.lightBillGeneratedDate ? dayjs(values.lightBillGeneratedDate).format() : undefined,
            paymentDetails: {
                ...values.paymentDetails,
                advancePayment1Date: values.paymentDetails?.advancePayment1Date ? dayjs(values.paymentDetails.advancePayment1Date).format() : undefined,
                advancePayment2Date: values.paymentDetails?.advancePayment2Date ? dayjs(values.paymentDetails.advancePayment2Date).format() : undefined,
                loanDisbursals: (values.paymentDetails?.loanDisbursals || []).map(l => ({
                    ...l,
                    date: l.date ? dayjs(l.date).format() : undefined
                })),
            }
        };
        dispatch(crud.create({ entity: config.entity, jsonData: formattedValues }));
    };

    const stepFields = [
        ['client', 'contactNumber', 'consumerNumber', 'email', 'pinCode', 'lightBillGeneratedDate', 'currentLoadOnLightBill', 'additionalLoad', 'address', 'villageCity', 'projectState'],
        [['systemDetails', 'systemType'], ['systemDetails', 'capacity'], ['systemDetails', 'structureHeight'], ['systemDetails', 'solarPanelName'], ['systemDetails', 'solarPanelWatt'], ['systemDetails', 'inverterName'], ['systemDetails', 'walkway']],
        [['paymentDetails', 'totalProjectCost'], ['paymentDetails', 'advancePayment1'], ['paymentDetails', 'advancePayment1Mode'], ['paymentDetails', 'advancePayment1Date'], ['paymentDetails', 'advancePayment2'], ['paymentDetails', 'advancePayment2Mode'], ['paymentDetails', 'advancePayment2Date'], ['bankDetails', 'bankName'], ['bankDetails', 'sanctionedAmount'], ['bankDetails', 'customerIfscCode'], ['bankDetails', 'solarRooftopIfscCode'], ['bankDetails', 'totalLoanAmount'], ['paymentDetails', 'loanDisbursals']]
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
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Steps current={currentStep} style={{ marginBottom: 40 }}>
                {steps.map(item => <Step key={item.title} title={item.title} />)}
            </Steps>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ projectState: 'Maharashtra' }}
                preserve={true}
            >
                <div style={{ marginBottom: 30, minHeight: 300 }}>
                    <div style={{ display: currentStep === 0 ? 'block' : 'none' }}><StepOne /></div>
                    <div style={{ display: currentStep === 1 ? 'block' : 'none' }}><StepTwo /></div>
                    <div style={{ display: currentStep === 2 ? 'block' : 'none' }}><StepThree /></div>
                </div>

                <div style={{ textAlign: 'center' }}>
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
                            Save Project
                        </Button>
                    )}
                </div>
            </Form>
        </div>
    );
}
