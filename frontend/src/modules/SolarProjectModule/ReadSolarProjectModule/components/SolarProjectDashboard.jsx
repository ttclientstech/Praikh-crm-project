import { useState } from 'react';
import { Modal, Form, Input, Button, Table, Descriptions, Row, Col, Card, Statistic, Tag, Tabs, Divider, notification, Popconfirm } from 'antd';
import { useMoney } from '@/settings';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    FilePdfOutlined,
    DownloadOutlined,
    FileImageOutlined,
    UploadOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { request } from '@/request';

import UploadDocumentModal from './UploadDocumentModal';
import { FILE_BASE_URL } from '@/config/serverApiConfig';
import CompletionDetails from '@/pages/SolarProject/CompletionDetails';



export default function SolarProjectDashboard({ selectedItem }) {
    const { moneyFormatter } = useMoney();
    const {
        client,
        systemDetails,
        bankDetails,
        paymentDetails,
        completionDetails,
        status,
        proejctCity,
        projectState,
        projectDocuments,
        consumerNumber,
        lightBillGeneratedDate,
        solarRooftopApplicationNo
    } = selectedItem;

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const dispatch = useDispatch();

    const handleDeleteDocument = async (docId) => {
        try {
            const response = await request.delete({
                entity: `solarProject/delete-document/${selectedItem._id}`,
                id: docId
            });

            if (response.success) {
                notification.success({ message: 'Document deleted successfully' });
                dispatch(erp.read({ entity: 'solarProject', id: selectedItem._id }));
            } else {
                notification.error({ message: response.message || 'Deletion failed' });
            }
        } catch (error) {
            notification.error({ message: error.message || 'Deletion failed' });
        }
    };

    const getStatusColor = (status) => {
        if (status === 'Completed') return 'success';
        if (status === 'Cancelled') return 'error';
        return 'processing';
    };

    const items = [
        {
            key: '1',
            label: 'Overview',
            children: <OverviewTab selectedItem={selectedItem} moneyFormatter={moneyFormatter} />,
        },
        {
            key: 'completion',
            label: 'Site Status & Completion',
            children: <CompletionDetails item={selectedItem} entity="solarProject" />,
        },
        {
            key: '2',
            label: 'System Details',
            children: <SystemDetailsTab systemDetails={systemDetails} />,
        },
        {
            key: '3',
            label: 'Bank & Finance',
            children: <BankFinanceTab bankDetails={bankDetails} paymentDetails={paymentDetails} moneyFormatter={moneyFormatter} />,
        },
        {
            key: '4',
            label: 'Documents',
            children: <DocumentsTab
                documents={projectDocuments}
                onUpload={() => setIsUploadModalOpen(true)}
                onDelete={handleDeleteDocument}
            />,
        }
    ];

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0 }}>{client} - {systemDetails?.capacity} Solar Project</h1>
                    <p style={{ margin: 0 }}>{projectState}, {proejctCity}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                        <Tag color="cyan">Consumer No: {consumerNumber || 'N/A'}</Tag>
                        <Tag color="geekblue">App No: {solarRooftopApplicationNo || 'N/A'}</Tag>
                        <Tag color="purple">Bill Date: {lightBillGeneratedDate ? dayjs(lightBillGeneratedDate).format('DD MMM YYYY') : 'N/A'}</Tag>
                    </div>
                </div>
                <Tag color={getStatusColor(status)} style={{ fontSize: '16px', padding: '5px 15px', margin: 0 }}>{status}</Tag>
            </div>

            <Tabs defaultActiveKey="1" items={items} />

            <UploadDocumentModal
                open={isUploadModalOpen}
                onCancel={() => setIsUploadModalOpen(false)}
                entity="solarProject"
            />


        </div>
    );
}

function OverviewTab({ selectedItem, moneyFormatter }) {
    const { paymentDetails, completionDetails } = selectedItem;

    // Calculate Pending Amount
    const totalCost = paymentDetails?.totalProjectCost || 0;
    const totalAdvances = paymentDetails?.advancePayments?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const received = totalAdvances + (paymentDetails?.loanCreditedAmount || 0);
    const pending = totalCost - received;

    return (
        <Row gutter={[24, 24]}>
            <Col span={8}>
                <Card title="Completion Status" bordered={false} className="shadow">
                    <Statistic
                        title="Installation"
                        value={completionDetails?.isInstallationCompleted ? "Completed" : "Pending"}
                        valueStyle={{ color: completionDetails?.isInstallationCompleted ? '#3f8600' : '#cf1322' }}
                        prefix={completionDetails?.isInstallationCompleted ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    />
                    {completionDetails?.completionDate && (
                        <div style={{ marginTop: 10 }}>Completed On: {dayjs(completionDetails.completionDate).format('DD MMM YYYY')}</div>
                    )}
                </Card>
            </Col>
            <Col span={8}>
                <Card title="Payment Status" bordered={false} className="shadow">
                    <Statistic
                        title="Total Cost"
                        value={totalCost}
                        formatter={(val) => moneyFormatter({ amount: val })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15 }}>
                        <div>
                            <div style={{ fontSize: 12, color: '#888' }}>Received</div>
                            <div style={{ color: '#3f8600', fontWeight: 'bold' }}>{moneyFormatter({ amount: received })}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: '#888' }}>Pending</div>
                            <div style={{ color: '#cf1322', fontWeight: 'bold' }}>{moneyFormatter({ amount: pending })}</div>
                        </div>
                    </div>
                </Card>
            </Col>
            <Col span={8}>
                <Card title="Next Actions" bordered={false} className="shadow" style={{ minHeight: '100%' }}>
                    {/* Placeholder for Next Actions or Reminders */}
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <p>Manage Project Status or Payments from Lists</p>
                    </div>
                </Card>
            </Col>
        </Row>
    )
}

function SystemDetailsTab({ systemDetails }) {
    if (!systemDetails) return <p>No System Details Available</p>
    return (
        <Card className="shadow" bordered={false}>
            <Descriptions title="Technical Specifications" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                <Descriptions.Item label="System Type">{systemDetails.systemType}</Descriptions.Item>
                <Descriptions.Item label="Capacity">{systemDetails.capacity}</Descriptions.Item>
                <Descriptions.Item label="Panel Name">{systemDetails.solarPanelName}</Descriptions.Item>
                <Descriptions.Item label="Panel Wattage">{systemDetails.solarPanelWatt}</Descriptions.Item>
                <Descriptions.Item label="Inverter Name">{systemDetails.inverterName}</Descriptions.Item>
                <Descriptions.Item label="Structure Height">{systemDetails.structureHeight}</Descriptions.Item>
                <Descriptions.Item label="Walkway">{systemDetails.walkway ? 'Yes' : 'No'}</Descriptions.Item>
            </Descriptions>
        </Card>
    )
}

function BankFinanceTab({ bankDetails, paymentDetails, moneyFormatter }) {
    const advancePayments = paymentDetails?.advancePayments || [];
    const loanCredited = paymentDetails?.loanCreditedAmount;

    // Construct Transaction History Data
    const transactions = [];

    // Add Advances
    if (advancePayments.length > 0) {
        advancePayments.forEach((payment, index) => {
            if (payment.amount) {
                transactions.push({
                    key: `adv_${index}`,
                    type: 'Advance Payment',
                    description: `Advance Payment ${index + 1}`,
                    mode: payment.mode,
                    date: payment.date,
                    amount: payment.amount,
                    color: 'blue'
                });
            }
        });
    }

    // Add Loan Credit
    if (loanCredited) {
        transactions.push({
            key: 'loan_credit',
            type: 'Loan Disbursal',
            description: 'Loan Amount Bank Credited',
            mode: paymentDetails.loanCreditedBank || 'Bank Transfer',
            date: paymentDetails.loanCreditedDate,
            amount: loanCredited,
            color: 'purple'
        });
    }

    // Sort by Date (Newest First)
    transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const columns = [
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text, record) => <Tag color={record.color}>{text}</Tag>
        },
        {
            title: 'Mode',
            dataIndex: 'mode',
            key: 'mode',
            render: (text) => text || '-'
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-'
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (amount) => <span style={{ fontWeight: 'bold' }}>{moneyFormatter({ amount })}</span>
        }
    ];

    return (
        <Row gutter={[24, 24]}>
            <Col span={24}>
                <Card title="Payment Transaction History" className="shadow" bordered={false}>
                    <Table
                        dataSource={transactions}
                        columns={columns}
                        pagination={false}
                        summary={(pageData) => {
                            const totalReceived = pageData.reduce((sum, curr) => sum + curr.amount, 0);
                            const totalCost = paymentDetails?.totalProjectCost || 0;
                            const pending = totalCost - totalReceived;

                            return (
                                <Table.Summary.Row style={{ background: '#fafafa' }}>
                                    <Table.Summary.Cell index={0} colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Received:</Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right">
                                        <span style={{ color: '#3f8600', fontWeight: 'bold' }}>{moneyFormatter({ amount: totalReceived })}</span>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            );
                        }}
                    />
                    <div style={{ marginTop: 20, textAlign: 'right', padding: '10px 20px', background: '#fff1f0', borderRadius: '4px', border: '1px solid #ffa39e' }}>
                        <span style={{ marginRight: 10, fontWeight: 'bold' }}>Pending Balance:</span>
                        <span style={{ color: '#cf1322', fontWeight: 'bold', fontSize: '16px' }}>
                            {moneyFormatter({ amount: (paymentDetails?.totalProjectCost || 0) - transactions.reduce((sum, t) => sum + t.amount, 0) })}
                        </span>
                    </div>
                </Card>
            </Col>
            <Col span={24}>
                <Card title="Bank Details" className="shadow" bordered={false}>
                    <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} bordered size="small">
                        <Descriptions.Item label="Bank Name">{bankDetails?.bankName}</Descriptions.Item>
                        <Descriptions.Item label="Customer IFSC">{bankDetails?.customerIfscCode}</Descriptions.Item>
                        <Descriptions.Item label="Rooftop IFSC">{bankDetails?.solarRooftopIfscCode}</Descriptions.Item>
                        <Descriptions.Item label="Sanctioned Amount">{moneyFormatter({ amount: bankDetails?.sanctionedAmount })}</Descriptions.Item>
                        <Descriptions.Item label="Total Loan Amount">{moneyFormatter({ amount: bankDetails?.totalLoanAmount })}</Descriptions.Item>
                    </Descriptions>
                </Card>
            </Col>
        </Row>
    )
}

function DocumentsTab({ documents, onUpload, onDelete }) {
    const docItems = documents || [];
    return (
        <Card title="Project Documents" className="shadow" bordered={false} extra={<Button type="primary" icon={<UploadOutlined />} onClick={onUpload}>Upload Document</Button>}>
            {docItems.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
                    {docItems.map((doc, index) => {
                        const fileUrl = (doc.url && doc.url.startsWith('http')) ? doc.url : FILE_BASE_URL + (doc.url || '');
                        return (
                            <div key={doc._id || index} style={{ position: 'relative' }}>
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                                    <Card
                                        hoverable
                                        size="small"
                                        style={{ width: 180 }}
                                    >
                                        <div style={{ textAlign: 'center', marginBottom: 10 }}>
                                            <FilePdfOutlined style={{ fontSize: 32, color: '#f5222d' }} />
                                        </div>
                                        <Card.Meta
                                            title={<div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>}
                                            description={<div style={{ fontSize: '10px' }}>{doc.type}</div>}
                                        />
                                        <div style={{ marginTop: 10, fontSize: 10, color: '#888' }}>{dayjs(doc.uploadDate).format('DD MMM YYYY')}</div>
                                    </Card>
                                </a>
                                <Popconfirm
                                    title="Delete document?"
                                    onConfirm={() => onDelete(doc._id)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <Button
                                        type="primary"
                                        shape="circle"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        style={{ position: 'absolute', top: -10, right: -10, zIndex: 10 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    />
                                </Popconfirm>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p>No documents uploaded yet.</p>
            )}
        </Card>
    )
}
