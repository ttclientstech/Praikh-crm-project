import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Popconfirm, Row, Spin, Statistic, Table, Tabs, Tag, notification } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined, FilePdfOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { useMoney } from '@/settings';
import { request } from '@/request';
import { FILE_BASE_URL } from '@/config/serverApiConfig';
import UploadDocumentModal from './UploadDocumentModal';
import CompletionDetails from '@/pages/SolarProject/CompletionDetails';
import ProjectDocumentGenerator from './ProjectDocumentGenerator';

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const sum = (entries) => Array.isArray(entries)
  ? money(entries.reduce((total, entry) => total + money(entry?.amount), 0))
  : 0;

// Used only if the financial endpoint cannot be reached. Matches the backend's
// settlement rules, including the implicit approval for historical refunds.
function calculateLocalFinancials(project) {
  const details = project?.paymentDetails || {};
  const settlements = details.settlements || [];
  const cost = money(details.totalProjectCost);
  const advances = details.advancePayments?.length
    ? sum(details.advancePayments)
    : money(money(details.advancePayment1) + money(details.advancePayment2));
  const loans = details.loanDisbursals?.length
    ? sum(details.loanDisbursals)
    : money(details.loanCreditedAmount);
  const grossReceived = money(advances + loans);
  const refunded = sum(settlements.filter((entry) => entry.type === 'Customer Refund'));
  const legacyRefunds = sum(settlements.filter((entry) =>
    entry.type === 'Customer Refund' && entry.requestId && !entry.reference
  ));
  const approved = money(sum(settlements.filter((entry) => entry.type === 'Refund Approval')) + legacyRefunds);
  const internallySettled = sum(settlements.filter((entry) => entry.type === 'Internal Settlement'));
  const netReceived = money(grossReceived - refunded);
  const excess = Math.max(0, money(grossReceived - cost));
  return {
    totalProjectCost: cost,
    grossReceived,
    netReceived,
    refunded,
    remaining: Math.max(0, money(cost - netReceived)),
    excess,
    refundPayable: Math.max(0, money(approved - refunded)),
    unallocatedExcess: Math.max(0, money(excess - approved - internallySettled)),
    settlements,
  };
}

function mergeFinancials(project, result) {
  const fallback = calculateLocalFinancials(project);
  if (!result || typeof result !== 'object') return fallback;
  const pick = (keys, defaultValue) => {
    for (const key of keys) {
      if (result[key] !== undefined && result[key] !== null && Number.isFinite(Number(result[key]))) {
        return money(result[key]);
      }
    }
    return defaultValue;
  };
  return {
    ...fallback,
    totalProjectCost: pick(['totalProjectCost', 'cost'], fallback.totalProjectCost),
    grossReceived: pick(['grossReceived', 'gross'], fallback.grossReceived),
    netReceived: pick(['netReceived', 'net'], fallback.netReceived),
    refunded: pick(['refunded', 'customerRefunded', 'totalRefunded'], fallback.refunded),
    remaining: Math.max(0, pick(['remaining', 'remainingDue', 'pendingAmount'], fallback.remaining)),
    excess: Math.max(0, pick(['excess', 'totalExcess'], fallback.excess)),
    refundPayable: Math.max(0, pick(['refundPayable', 'approvedRefundPayable'], fallback.refundPayable)),
    unallocatedExcess: Math.max(0, pick(['unallocatedExcess', 'unallocated'], fallback.unallocatedExcess)),
    settlements: Array.isArray(result.settlements) ? result.settlements : fallback.settlements,
  };
}

export default function SolarProjectDashboard({ selectedItem }) {
  const { moneyFormatter } = useMoney();
  const dispatch = useDispatch();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [serverFinancials, setServerFinancials] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState(false);
  const projectId = selectedItem?._id;

  useEffect(() => {
    let active = true;
    setServerFinancials(null);
    setFinancialError(false);
    if (!projectId) return () => { active = false; };
    setFinancialLoading(true);
    request.get({ entity: `solarproject/financial/${projectId}` })
      .then((response) => {
        if (!active) return;
        if (response?.success && response.result) {
          setServerFinancials(response.result);
        } else {
          setFinancialError(true);
        }
      })
      .catch(() => { if (active) setFinancialError(true); })
      .finally(() => { if (active) setFinancialLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  const financials = useMemo(
    () => mergeFinancials(selectedItem, serverFinancials),
    [selectedItem, serverFinancials]
  );

  if (!selectedItem) return null;

  const {
    client, systemDetails, bankDetails, paymentDetails,
    status, proejctCity, projectState, projectDocuments, consumerNumber,
    lightBillGeneratedDate, solarRooftopApplicationNo,
  } = selectedItem;

  const handleDeleteDocument = async (docId) => {
    try {
      const response = await request.delete({
        entity: `solarProject/delete-document/${projectId}`,
        id: docId,
      });
      if (response?.success) {
        notification.success({ message: 'Document deleted successfully' });
        dispatch(erp.read({ entity: 'solarProject', id: projectId }));
      } else {
        notification.error({ message: response?.message || 'Deletion failed' });
      }
    } catch (error) {
      notification.error({ message: error?.message || 'Deletion failed' });
    }
  };

  const items = [
    { key: '1', label: 'Overview', children: <OverviewTab selectedItem={selectedItem} financials={financials} moneyFormatter={moneyFormatter} /> },
    { key: 'completion', label: 'Site Status & Completion', children: <CompletionDetails item={selectedItem} entity="solarProject" /> },
    { key: '2', label: 'System Details', children: <SystemDetailsTab systemDetails={systemDetails} /> },
    { key: '3', label: 'Bank & Finance', children: <BankFinanceTab bankDetails={bankDetails} paymentDetails={paymentDetails} financials={financials} moneyFormatter={moneyFormatter} /> },
    { key: '4', label: 'Documents', children: <DocumentsTab documents={projectDocuments} onUpload={() => setIsUploadModalOpen(true)} onDelete={handleDeleteDocument} /> },
    { key: 'generate-doc', label: 'Generate Document', children: <ProjectDocumentGenerator project={selectedItem} /> },
  ];

  return (
    <div style={{ padding: 20, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, overflowWrap: 'anywhere' }}>{client} - {systemDetails?.capacity} Solar Project</h1>
          <p style={{ margin: 0 }}>{projectState}, {proejctCity}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <Tag color="cyan">Consumer No: {consumerNumber || 'N/A'}</Tag>
            <Tag color="geekblue">App No: {solarRooftopApplicationNo || 'N/A'}</Tag>
            <Tag color="purple">Bill Date: {lightBillGeneratedDate ? dayjs(lightBillGeneratedDate).format('DD MMM YYYY') : 'N/A'}</Tag>
          </div>
        </div>
        <Tag color={status === 'Completed' ? 'success' : status === 'Cancelled' ? 'error' : 'processing'} style={{ fontSize: 16, padding: '5px 15px' }}>
          {status || 'Active'}
        </Tag>
      </div>
      {financialLoading && <div style={{ marginBottom: 12 }}><Spin size="small" /> Loading financial balances...</div>}
      {financialError && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }}
          message="Financial API unavailable. Showing balances calculated from the loaded project record; refresh before making settlement decisions." />
      )}
      <Tabs defaultActiveKey="1" items={items} />
      <UploadDocumentModal open={isUploadModalOpen} onCancel={() => setIsUploadModalOpen(false)} entity="solarProject" />
    </div>
  );
}

function OverviewTab({ selectedItem, financials, moneyFormatter }) {
  const completionDetails = selectedItem?.completionDetails;
  const financialItems = [
    { label: 'Net Credited', value: financials.netReceived, color: '#15803d' },
    { label: 'Pending Amount', value: financials.remaining, color: financials.remaining > 0 ? '#dc2626' : '#334155' },
    { label: 'Unallocated Extra', value: financials.unallocatedExcess, color: '#d97706' },
  ];
  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={8}>
        <Card title="Completion Status" bordered={false} className="shadow" style={{ height: '100%' }}>
          <Statistic title="Installation" value={completionDetails?.isInstallationCompleted ? 'Completed' : 'Pending'}
            valueStyle={{ color: completionDetails?.isInstallationCompleted ? '#3f8600' : '#cf1322' }}
            prefix={completionDetails?.isInstallationCompleted ? <CheckCircleOutlined /> : <ClockCircleOutlined />} />
          {completionDetails?.completionDate && <div style={{ marginTop: 10 }}>Completed On: {dayjs(completionDetails.completionDate).format('DD MMM YYYY')}</div>}
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="Payment Status" bordered={false} className="shadow" style={{ height: '100%' }}>
          <Statistic title="Quotation Cost" value={financials.totalProjectCost} formatter={(value) => moneyFormatter({ amount: value })} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: 16, marginTop: 18 }}>
            {financialItems.map((item) => (
              <div key={item.label}>
                <div style={{ color: '#64748b', fontSize: 12 }}>{item.label}</div>
                <div style={{ color: item.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{moneyFormatter({ amount: item.value })}</div>
              </div>
            ))}
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="Next Actions" bordered={false} className="shadow" style={{ height: '100%' }}>
          <div style={{ textAlign: 'center', padding: 20 }}><p>Manage Project Status or Payments from Lists</p></div>
        </Card>
      </Col>
    </Row>
  );
}

function SystemDetailsTab({ systemDetails }) {
  if (!systemDetails) return <p>No System Details Available</p>;
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
  );
}

function BankFinanceTab({ bankDetails, paymentDetails, financials, moneyFormatter }) {
  const transactions = useMemo(() => {
    const rows = [];
    const advances = paymentDetails?.advancePayments || [];
    if (advances.length) {
      advances.forEach((entry, index) => {
        if (money(entry.amount) !== 0) rows.push({
          key: `advance_${index}`, type: 'Advance Payment', description: `Advance Payment ${index + 1}`,
          mode: entry.mode, date: entry.date, amount: money(entry.amount), color: 'blue',
        });
      });
    } else {
      [paymentDetails?.advancePayment1, paymentDetails?.advancePayment2].forEach((amount, index) => {
        if (money(amount) !== 0) rows.push({ key: `legacy_advance_${index}`, type: 'Advance Payment',
          description: `Advance Payment ${index + 1}`, amount: money(amount), color: 'blue' });
      });
    }
    const loans = paymentDetails?.loanDisbursals || [];
    if (loans.length) {
      loans.forEach((entry, index) => {
        if (money(entry.amount) !== 0) rows.push({ key: `loan_${index}`, type: 'Loan Disbursal',
          description: `Loan Disbursal ${index + 1}`, mode: entry.mode || entry.bank || entry.bankName,
          date: entry.date, amount: money(entry.amount), color: 'purple' });
      });
    } else if (money(paymentDetails?.loanCreditedAmount) !== 0) {
      rows.push({ key: 'legacy_loan', type: 'Loan Disbursal', description: 'Loan Amount Bank Credited',
        mode: paymentDetails?.loanCreditedBank || 'Bank Transfer', date: paymentDetails?.loanCreditedDate,
        amount: money(paymentDetails?.loanCreditedAmount), color: 'purple' });
    }
    (financials.settlements || []).forEach((entry, index) => {
      if (!['Refund Approval', 'Customer Refund', 'Internal Settlement'].includes(entry.type)) return;
      rows.push({ key: `settlement_${entry._id || index}`, type: entry.type,
        description: entry.type, mode: entry.mode, date: entry.date || entry.createdAt,
        amount: money(entry.amount), color: entry.type === 'Customer Refund' ? 'red' : entry.type === 'Refund Approval' ? 'orange' : 'cyan',
        reference: entry.reference || entry.allocationReference || entry.requestId,
        processedBy: entry.performedBy || entry.processedBy || '',
      });
    });
    return rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [paymentDetails, financials.settlements]);

  const columns = [
    { title: 'Transaction', dataIndex: 'description', key: 'description', width: 195,
      render: (value, record) => <Tag color={record.color}>{value}</Tag> },
    { title: 'Mode', dataIndex: 'mode', key: 'mode', width: 135, render: (value) => value || '—' },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 135,
      render: (value) => value && dayjs(value).isValid() ? dayjs(value).format('DD MMM YYYY') : '—' },
    { title: 'Reference', dataIndex: 'reference', key: 'reference', width: 175, render: (value) => value || '—' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 145, align: 'right',
      render: (value, record) => <span style={{ fontWeight: 700, color: record.type === 'Customer Refund' ? '#dc2626' : undefined }}>
        {record.type === 'Customer Refund' ? '−' : ''}{moneyFormatter({ amount: value })}
      </span> },
  ];
  const balances = [
    { label: 'Quotation Cost', amount: financials.totalProjectCost, color: '#334155' },
    { label: 'Gross Received', amount: financials.grossReceived, color: '#15803d' },
    { label: 'Customer Refunded', amount: financials.refunded, color: '#dc2626' },
    { label: 'Net Credited', amount: financials.netReceived, color: '#15803d' },
    { label: 'Pending Amount', amount: financials.remaining, color: '#dc2626' },
    { label: 'Unallocated Extra', amount: financials.unallocatedExcess, color: '#d97706' },
    { label: 'Approved Refund Payable', amount: financials.refundPayable, color: '#dc2626' },
  ];
  return (
    <Row gutter={[20, 20]}>
      <Col span={24}>
        <Card title="Payment Transaction History" className="shadow" bordered={false}>
          <Table dataSource={transactions} columns={columns} rowKey="key" size="small"
            scroll={{ x: 785, y: 390 }} pagination={{ pageSize: 8, showSizeChanger: false }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 18 }}>
            {balances.map(({ label, amount, color }) => (
              <div key={label} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <div style={{ color: '#64748b', fontSize: 12 }}>{label}</div>
                <div style={{ color, fontWeight: 700, fontSize: 16 }}>{moneyFormatter({ amount })}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
            Refund approvals and internal settlements are recorded for audit but are not cash received or paid.
            Only Customer Refund transactions reduce Net Credited.
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
  );
}

function DocumentsTab({ documents, onUpload, onDelete }) {
  const docItems = documents || [];
  return (
    <Card title="Project Documents" className="shadow" bordered={false}
      extra={<Button type="primary" icon={<UploadOutlined />} onClick={onUpload}>Upload Document</Button>}>
      {docItems.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15 }}>
          {docItems.map((doc, index) => {
            const fileUrl = doc.url?.startsWith('http') ? doc.url : FILE_BASE_URL + (doc.url || '');
            return (
              <div key={doc._id || index} style={{ position: 'relative' }}>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                  <Card hoverable size="small" style={{ width: 180 }}>
                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
                      <FilePdfOutlined style={{ fontSize: 32, color: '#f5222d' }} />
                    </div>
                    <Card.Meta
                      title={<div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>}
                      description={<div style={{ fontSize: 10 }}>{doc.type}</div>} />
                    <div style={{ marginTop: 10, fontSize: 10, color: '#888' }}>
                      {doc.uploadDate ? dayjs(doc.uploadDate).format('DD MMM YYYY') : '—'}
                    </div>
                  </Card>
                </a>
                <Popconfirm title="Delete document?" onConfirm={() => onDelete(doc._id)} okText="Yes" cancelText="No">
                  <Button type="primary" shape="circle" danger size="small" icon={<DeleteOutlined />}
                    style={{ position: 'absolute', top: -10, right: -10, zIndex: 10 }}
                    onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} />
                </Popconfirm>
              </div>
            );
          })}
        </div>
      ) : <p>No documents uploaded yet.</p>}
    </Card>
  );
}
