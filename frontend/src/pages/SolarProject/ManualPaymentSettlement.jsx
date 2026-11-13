import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { request } from '@/request';

const { Text } = Typography;

const money = (value) =>
  Math.round((Number(value) || 0) * 100) / 100;

const currency = (value) =>
  `₹ ${money(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const sumAmounts = (items) =>
  Array.isArray(items)
    ? items.reduce(
        (total, item) => total + money(item?.amount),
        0
      )
    : 0;

const calculateFallbackFinancials = (project) => {
  const details = project?.paymentDetails || {};
  const settlements = details.settlements || [];

  const projectCost = money(details.totalProjectCost);

  const advances = details.advancePayments?.length
    ? sumAmounts(details.advancePayments)
    : money(details.advancePayment1) +
      money(details.advancePayment2);

  const loans = details.loanDisbursals?.length
    ? sumAmounts(details.loanDisbursals)
    : money(details.loanCreditedAmount);

  const grossReceived = money(advances + loans);

  const refunded = money(
    sumAmounts(
      settlements.filter(
        (item) => item.type === 'Customer Refund'
      )
    )
  );

  const legacyRefunds = money(
    sumAmounts(
      settlements.filter(
        (item) =>
          item.type === 'Customer Refund' &&
          item.requestId &&
          !item.reference
      )
    )
  );

  const approvedRefunds = money(
    sumAmounts(
      settlements.filter(
        (item) => item.type === 'Refund Approval'
      )
    ) + legacyRefunds
  );

  const internalSettlements = money(
    sumAmounts(
      settlements.filter(
        (item) => item.type === 'Internal Settlement'
      )
    )
  );

  const netReceived = money(grossReceived - refunded);
  const excess = Math.max(
    0,
    money(grossReceived - projectCost)
  );

  return {
    projectCost,
    advances: money(advances),
    loans: money(loans),
    grossReceived,
    netReceived,
    refunded,
    approvedRefunds,
    internalSettlements,
    remainingDue: Math.max(
      0,
      money(projectCost - netReceived)
    ),
    excess,
    refundPayable: Math.max(
      0,
      money(approvedRefunds - refunded)
    ),
    unallocatedExcess: Math.max(
      0,
      money(
        excess -
          approvedRefunds -
          internalSettlements
      )
    ),
  };
};

const normalizeFinancials = (response, project) => {
  const fallback = calculateFallbackFinancials(project);

  if (!response || typeof response !== 'object') {
    return fallback;
  }

  const numberFrom = (keys, defaultValue) => {
    for (const key of keys) {
      if (
        response[key] !== undefined &&
        response[key] !== null &&
        Number.isFinite(Number(response[key]))
      ) {
        return money(response[key]);
      }
    }

    return defaultValue;
  };

  return {
    projectCost: numberFrom(
      ['totalProjectCost', 'projectCost'],
      fallback.projectCost
    ),
    advances: numberFrom(
      ['advanceReceived', 'advances'],
      fallback.advances
    ),
    loans: numberFrom(
      ['loanReceived', 'loans', 'loanDisbursed'],
      fallback.loans
    ),
    grossReceived: numberFrom(
      ['grossReceived'],
      fallback.grossReceived
    ),
    netReceived: numberFrom(
      ['netReceived'],
      fallback.netReceived
    ),
    refunded: numberFrom(
      ['refunded', 'totalRefunded'],
      fallback.refunded
    ),
    approvedRefunds: numberFrom(
      ['approvedRefunds', 'totalApprovedRefunds'],
      fallback.approvedRefunds
    ),
    internalSettlements: numberFrom(
      ['internalSettlements', 'internallyAllocated'],
      fallback.internalSettlements
    ),
    remainingDue: numberFrom(
      ['remaining', 'remainingDue'],
      fallback.remainingDue
    ),
    excess: numberFrom(
      ['excess'],
      fallback.excess
    ),
    refundPayable: numberFrom(
      ['refundPayable'],
      fallback.refundPayable
    ),
    unallocatedExcess: numberFrom(
      ['unallocatedExcess'],
      fallback.unallocatedExcess
    ),
  };
};

const getActionLimit = (type, financials) => {
  if (type === 'Customer Refund') {
    return money(financials.refundPayable);
  }

  return money(financials.unallocatedExcess);
};

const endpointFor = (type, projectId) => {
  if (type === 'Refund Approval') {
    return `solarproject/refund/approve/${projectId}`;
  }

  if (type === 'Customer Refund') {
    return `solarproject/refund/pay/${projectId}`;
  }

  if (type === 'Internal Settlement') {
    return `solarproject/settlement/internal/${projectId}`;
  }

  return null;
};

const generateReference = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `settlement_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 12)}`;
};

export default function ManualPaymentSettlement({
  record,
  onRecorded,
}) {
  const [form] = Form.useForm();

  const [project, setProject] = useState(record);
  const [financials, setFinancials] = useState(() =>
    calculateFallbackFinancials(record)
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [financialReady, setFinancialReady] = useState(false);
  const [financialError, setFinancialError] = useState('');

  const submittingRef = useRef(false);
  const pendingReference = useRef(null);
  const activeProjectId = useRef(record?._id);

  const settlementType = Form.useWatch('type', form);

  const projectId = record?._id;

  const isCompleted =
    String(project?.status || '').toLowerCase() ===
      'completed' ||
    project?.completionDetails?.siteStatus ===
      'Completed';

  const refreshFinancials = useCallback(
    async (id) => {
      const response = await request.get({
        entity: `solarproject/financial/${id}`,
      });

      if (activeProjectId.current !== id) {
        return null;
      }

      if (!response?.success || !response?.result) {
        throw new Error(
          response?.message ||
            'Unable to load financial details.'
        );
      }

      setFinancials(
        normalizeFinancials(response.result, project)
      );

      setFinancialReady(true);
      setFinancialError('');

      return response.result;
    },
    [project]
  );

  const refreshProject = useCallback(async () => {
    if (!projectId) return null;

    setRefreshing(true);

    try {
      const response = await request.read({
        entity: 'solarproject',
        id: projectId,
      });

      if (activeProjectId.current !== projectId) {
        return null;
      }

      if (!response?.success || !response?.result) {
        throw new Error(
          response?.message ||
            'Unable to refresh project.'
        );
      }

      const updatedProject = response.result;
      setProject(updatedProject);

      await refreshFinancials(projectId);

      return updatedProject;
    } catch (error) {
      setFinancialReady(false);
      setFinancialError(
        error?.message ||
          'Unable to refresh project financials.'
      );
      message.error(
        error?.message || 'Unable to refresh project.'
      );
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [projectId, refreshFinancials]);

  useEffect(() => {
    activeProjectId.current = projectId;
    setProject(record);
    setFinancials(calculateFallbackFinancials(record));
    setFinancialReady(false);
    setFinancialError('');
    pendingReference.current = null;
    form.resetFields();

    if (!projectId) return;

    let cancelled = false;

    const loadFinancials = async () => {
      try {
        const response = await request.get({
          entity: `solarproject/financial/${projectId}`,
        });

        if (
          cancelled ||
          activeProjectId.current !== projectId
        ) {
          return;
        }

        if (!response?.success || !response?.result) {
          throw new Error(
            response?.message ||
              'Unable to load financial details.'
          );
        }

        setFinancials(
          normalizeFinancials(response.result, record)
        );
        setFinancialReady(true);
        setFinancialError('');
      } catch (error) {
        if (!cancelled) {
          setFinancialReady(false);
          setFinancialError(
            error?.message ||
              'Unable to load financial details.'
          );
        }
      }
    };

    loadFinancials();

    return () => {
      cancelled = true;
    };
  }, [projectId, form , record]);

  const handleValuesChange = () => {
    pendingReference.current = null;
  };

  const handleRecord = async (values) => {
    if (
      !projectId ||
      submittingRef.current ||
      !financialReady
    ) {
      return;
    }

    const type = values.type;
    const endpoint = endpointFor(type, projectId);

    if (!endpoint) {
      message.error('Invalid settlement type.');
      return;
    }

    if (type === 'Refund Approval' && !isCompleted) {
      message.error(
        'Refund approval requires a completed project.'
      );
      return;
    }

    const amount = money(values.amount);
    const available = getActionLimit(type, financials);

    if (
      !Number.isFinite(Number(values.amount)) ||
      amount <= 0 ||
      amount > available ||
      Math.abs(
        Number(values.amount) * 100 -
          Math.round(Number(values.amount) * 100)
      ) > 0.000001
    ) {
      message.error(
        `Enter a valid amount up to ${currency(available)}.`
      );
      return;
    }

    if (!pendingReference.current) {
      pendingReference.current = generateReference();
    }

    const reference = pendingReference.current;

    const payload = {
      amount,
      reference,
      date: values.date.toISOString(),
      remark: values.remark?.trim() || '',
      mode: values.mode,
      performedBy: values.performedBy.trim(),
    };

    submittingRef.current = true;
    setLoading(true);

    try {
      const response = await request.post({
        entity: endpoint,
        jsonData: payload,
      });

      if (!response?.success) {
        message.error(
          response?.message ||
            'Transaction could not be recorded.'
        );

        // Do not automatically retry a failed write.
        // Refresh to inspect the authoritative balance.
        await refreshProject();
        return;
      }

      message.success(
        response.message ||
          'Transaction recorded successfully.'
      );

      pendingReference.current = null;
      form.resetFields();

      const refreshedProject = await refreshProject();

      if (refreshedProject && onRecorded) {
        onRecorded(refreshedProject);
      }
    } catch (error) {
      message.error(
        error?.message ||
          'Transaction status is uncertain. Refresh before retrying.'
      );

      await refreshProject();
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const settlements =
    project?.paymentDetails?.settlements || [];

  const availableAmount = getActionLimit(
    settlementType,
    financials
  );

  const canApprove =
    isCompleted &&
    money(financials.unallocatedExcess) > 0;

  const canRefund =
    money(financials.refundPayable) > 0;

  const canSettleInternally =
    money(financials.unallocatedExcess) > 0;

  const canRecord =
    financialReady &&
    ((settlementType === 'Refund Approval' &&
      canApprove) ||
      (settlementType === 'Customer Refund' &&
        canRefund) ||
      (settlementType === 'Internal Settlement' &&
        canSettleInternally));

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (value) =>
        value ? dayjs(value).format('DD MMM YYYY') : '-',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (value) => {
        const color =
          value === 'Refund Approval'
            ? 'gold'
            : value === 'Customer Refund'
              ? 'red'
              : 'blue';

        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value) => (
        <strong>{currency(value)}</strong>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'mode',
      key: 'mode',
      render: (value) => value || '-',
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
      render: (value) => value || '-',
    },
    {
      title: 'Reference / Remark',
      key: 'details',
      render: (_, item) => {
        const reference =
          item.reference ||
          item.allocationReference ||
          item.requestId;

        return (
          <div>
            {reference && (
              <div>
                <Text strong>{reference}</Text>
              </div>
            )}
            {item.remark && (
              <Text type="secondary">
                {item.remark}
              </Text>
            )}
            {!reference && !item.remark && '-'}
          </div>
        );
      },
    },
  ];

  if (!projectId) return null;

  return (
    <Card
      title="Manual Payment Settlement"
      size="small"
      style={{ marginTop: 20 }}
      extra={
        <Button
          size="small"
          loading={refreshing}
          disabled={loading}
          onClick={refreshProject}
        >
          Refresh
        </Button>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Settlement accounting"
        description="Refund Approval reserves eligible excess for a customer refund. Customer Refund reduces net received. Internal Settlement allocates unallocated excess without reducing net received. Transactions are retained in the settlement history."
      />

      {financialError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Financial data unavailable"
          description={financialError}
        />
      )}

      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2 }}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Project Status">
          <Tag color={isCompleted ? 'green' : 'blue'}>
            {project?.status || 'Unknown'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Project Cost">
          {currency(financials.projectCost)}
        </Descriptions.Item>

        <Descriptions.Item label="Advance Received">
          {currency(financials.advances)}
        </Descriptions.Item>

        <Descriptions.Item label="Loan Received">
          {currency(financials.loans)}
        </Descriptions.Item>

        <Descriptions.Item label="Gross Received">
          <Text strong style={{ color: '#059669' }}>
            {currency(financials.grossReceived)}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item label="Customer Refunds">
          {currency(financials.refunded)}
        </Descriptions.Item>

        <Descriptions.Item label="Net Received">
          <Text strong style={{ color: '#059669' }}>
            {currency(financials.netReceived)}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item label="Remaining Due">
          <Text strong style={{ color: '#ea580c' }}>
            {currency(financials.remainingDue)}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item label="Total Excess">
          {currency(financials.excess)}
        </Descriptions.Item>

        <Descriptions.Item label="Internal Settlements">
          {currency(financials.internalSettlements)}
        </Descriptions.Item>

        <Descriptions.Item label="Approved Refunds">
          {currency(financials.approvedRefunds)}
        </Descriptions.Item>

        <Descriptions.Item label="Approved Refund Payable">
          <Text strong style={{ color: '#dc2626' }}>
            {currency(financials.refundPayable)}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item
          label="Unallocated Excess"
          span={2}
        >
          <Text
            strong
            style={{
              fontSize: 18,
              color:
                financials.unallocatedExcess > 0
                  ? '#d97706'
                  : '#64748b',
            }}
          >
            {currency(financials.unallocatedExcess)}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      {!financialReady && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
          message="Settlement actions unavailable"
          description="Refresh the project to load verified financial balances before recording a transaction."
        />
      )}

      {financialReady &&
        !canApprove &&
        !canRefund &&
        !canSettleInternally && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
            message="No settlement action is currently available."
            description="The project has no unallocated excess or approved refund payable."
          />
        )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleRecord}
        onValuesChange={handleValuesChange}
        initialValues={{
          type: 'Internal Settlement',
          date: dayjs(),
        }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="type"
              label="Settlement Action"
              rules={[
                {
                  required: true,
                  message: 'Select a settlement action.',
                },
              ]}
            >
              <Select
                options={[
                  {
                    label: 'Refund Approval',
                    value: 'Refund Approval',
                    disabled: !canApprove,
                  },
                  {
                    label: 'Customer Refund',
                    value: 'Customer Refund',
                    disabled: !canRefund,
                  },
                  {
                    label: 'Internal Settlement',
                    value: 'Internal Settlement',
                    disabled: !canSettleInternally,
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="amount"
              label="Transaction Amount"
              rules={[
                {
                  required: true,
                  message: 'Enter transaction amount.',
                },
                {
                  validator: (_, value) => {
                    const numeric = Number(value);

                    if (
                      Number.isFinite(numeric) &&
                      numeric > 0 &&
                      numeric <= availableAmount &&
                      Math.abs(
                        numeric * 100 -
                          Math.round(numeric * 100)
                      ) < 0.000001
                    ) {
                      return Promise.resolve();
                    }

                    return Promise.reject(
                      new Error(
                        `Enter an amount up to ${currency(
                          availableAmount
                        )} with at most two decimal places.`
                      )
                    );
                  },
                },
              ]}
            >
              <InputNumber
                min={0.01}
                max={availableAmount}
                precision={2}
                style={{ width: '100%' }}
                addonBefore="₹"
                disabled={!canRecord}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="performedBy"
              label="Settlement Transaction Performed By"
              rules={[
                { required: true, whitespace: true, message: 'Enter the name of the person who performed this transaction.' },
                { max: 120, message: 'Name must be 120 characters or fewer.' },
              ]}
            >
              <Input
                maxLength={120}
                placeholder="Enter full name manually"
                disabled={!canRecord}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="mode"
              label="Transaction Done In"
              rules={[{ required: true, message: 'Select how the transaction was recorded.' }]}
            >
              <Select
                placeholder="Select transaction method"
                disabled={!canRecord}
                options={[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'UPI', value: 'UPI' },
                  { label: 'Bank Transfer', value: 'Bank Transfer' },
                  { label: 'Cheque', value: 'Cheque' },
                  { label: 'Online', value: 'Online' },
                  { label: 'Administrative Approval (no payment)', value: 'Administrative Approval' },
                  { label: 'Other', value: 'Other' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="date"
              label="Transaction Date"
              rules={[
                {
                  required: true,
                  message: 'Select transaction date.',
                },
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD MMM YYYY"
                disabledDate={(date) =>
                  date.isAfter(dayjs(), 'day')
                }
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="remark"
              label="Remark (Optional)"
            >
              <Input.TextArea
                rows={2}
                maxLength={2000}
                showCount
                placeholder="Additional transaction details"
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Popconfirm
              title={`Confirm ${settlementType || 'transaction'}`}
              description="This financial transaction will be recorded in the project's permanent settlement history. Continue?"
              onConfirm={() => form.submit()}
              okText="Confirm & Record"
              cancelText="Cancel"
              disabled={
                !canRecord || loading || refreshing
              }
            >
              <Button
                type="primary"
                loading={loading}
                disabled={
                  !canRecord || loading || refreshing
                }
              >
                Record Transaction
              </Button>
            </Popconfirm>
          </Col>
        </Row>
      </Form>

      <div style={{ marginTop: 24 }}>
        <Text strong>
          Settlement Transaction History
        </Text>

        <Table
          style={{ marginTop: 12 }}
          size="small"
          bordered
          rowKey={(item) =>
            item._id ||
            item.requestId ||
            item.reference
          }
          dataSource={[...settlements].sort(
            (a, b) =>
              new Date(b.createdAt || b.date) -
              new Date(a.createdAt || a.date)
          )}
          columns={columns}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 850 }}
          locale={{
            emptyText:
              'No settlements recorded for this project.',
          }}
        />
      </div>
    </Card>
  );
}
