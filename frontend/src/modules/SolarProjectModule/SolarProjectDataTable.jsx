import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    EllipsisOutlined,
    RedoOutlined,
    ArrowLeftOutlined,
    ThunderboltOutlined,
    BankOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { Dropdown, Table, Button, Input, Tag, Descriptions, Badge, Card, Row, Col, Typography } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { useSelector, useDispatch } from 'react-redux';
import { crud } from '@/redux/crud/actions';
import { selectListItems } from '@/redux/crud/selectors';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import { generate as uniqueId } from 'shortid';
import { useCrudContext } from '@/context/crud';
import dayjs from 'dayjs';

const { Text } = Typography;

function AddNewItem({ config }) {
    const { crudContextAction } = useCrudContext();
    const { collapsedBox, panel } = crudContextAction;
    const { ADD_NEW_ENTITY } = config;

    const handelClick = () => {
        panel.open();
        collapsedBox.close();
    };

    return (
        <Button onClick={handelClick} type="primary">
            {ADD_NEW_ENTITY}
        </Button>
    );
}

export default function SolarProjectDataTable({ config }) {
    let { entity, DATATABLE_TITLE } = config;
    const { crudContextAction } = useCrudContext();
    const { panel, collapsedBox, modal, readBox, editBox } = crudContextAction;
    const translate = useLanguage();
    const { moneyFormatter } = useMoney();

    const items = [
        { label: translate('Show'), key: 'read', icon: <EyeOutlined /> },
        { label: translate('Edit'), key: 'edit', icon: <EditOutlined /> },
        { type: 'divider' },
        { label: translate('Delete'), key: 'delete', icon: <DeleteOutlined /> },
    ];

    const handleRead = (record) => {
        dispatch(crud.currentItem({ data: record }));
        panel.open();
        collapsedBox.open();
        readBox.open();
    };
    function handleEdit(record) {
        dispatch(crud.currentItem({ data: record }));
        dispatch(crud.currentAction({ actionType: 'update', data: record }));
        editBox.open();
        panel.open();
        collapsedBox.open();
    }
    function handleDelete(record) {
        dispatch(crud.currentAction({ actionType: 'delete', data: record }));
        modal.open();
    }

    const navigate = useNavigate();

    // --- CUSTOM COLUMNS FOR MAIN TABLE ---
    const columns = [
        {
            title: 'Client Name',
            dataIndex: 'client',
            key: 'client',
            render: (text, record) => (
                <a style={{ fontWeight: 'bold' }} onClick={() => navigate(`/solarProject/read/${record._id}`)}>{text}</a>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'Active' ? 'processing' : status === 'Completed' ? 'success' : 'error';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'City',
            dataIndex: 'proejctCity',
            key: 'proejctCity',
        },
        {
            title: 'System Type',
            dataIndex: ['systemDetails', 'systemType'],
            key: 'systemType',
        },
        {
            title: 'Capacity',
            dataIndex: ['systemDetails', 'capacity'],
            key: 'capacity',
            render: (text) => <b>{text}</b>
        },
        {
            title: 'Total Cost',
            dataIndex: ['paymentDetails', 'totalProjectCost'],
            key: 'totalProjectCost',
            render: (amount) => moneyFormatter({ amount })
        },
        {
            title: '',
            key: 'action',
            fixed: 'right',
            render: (_, record) => (
                <Dropdown
                    menu={{
                        items,
                        onClick: ({ key }) => {
                            if (key === 'read') handleRead(record);
                            else if (key === 'edit') handleEdit(record);
                            else if (key === 'delete') handleDelete(record);
                        },
                    }}
                    trigger={['click']}
                >
                    <EllipsisOutlined style={{ cursor: 'pointer', fontSize: '24px' }} onClick={(e) => e.preventDefault()} />
                </Dropdown>
            ),
        },
    ];

    // --- EXPANDED ROW RENDER ---
    const expandedRowRender = (record) => {
        return (
            <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
                <Row gutter={[24, 24]}>
                    <Col span={8}>
                        <Card size="small" title={<><ThunderboltOutlined /> System Details</>} bordered={false}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Panel">{record.systemDetails?.solarPanelName} ({record.systemDetails?.solarPanelWatt})</Descriptions.Item>
                                <Descriptions.Item label="Inverter">{record.systemDetails?.inverterName}</Descriptions.Item>
                                <Descriptions.Item label="Structure">{record.systemDetails?.structureHeight} (Walkway: {record.systemDetails?.walkway ? 'Yes' : 'No'})</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" title={<><BankOutlined /> Bank & Finance</>} bordered={false}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Bank">{record.bankDetails?.bankName}</Descriptions.Item>
                                <Descriptions.Item label="Loan Amount">{moneyFormatter({ amount: record.bankDetails?.totalLoanAmount })}</Descriptions.Item>
                                <Descriptions.Item label="Sanctioned">{moneyFormatter({ amount: record.bankDetails?.sanctionedAmount })}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" title={<><DollarOutlined /> Payment Status</>} bordered={false}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Project Cost">{moneyFormatter({ amount: record.paymentDetails?.totalProjectCost })}</Descriptions.Item>
                                <Descriptions.Item label="Received">
                                    {moneyFormatter({ amount: (record.paymentDetails?.advancePayment || 0) + (record.paymentDetails?.loanCreditedAmount || 0) })}
                                </Descriptions.Item>
                                <Descriptions.Item label="Pending">
                                    {moneyFormatter({ amount: (record.paymentDetails?.totalProjectCost || 0) - ((record.paymentDetails?.advancePayment || 0) + (record.paymentDetails?.loanCreditedAmount || 0)) })}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    };

    const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);
    const { pagination, items: dataSource } = listResult;
    const dispatch = useDispatch();

    const handelDataTableLoad = useCallback((pagination) => {
        const options = { page: pagination.current || 1, items: pagination.pageSize || 10 };
        dispatch(crud.list({ entity, options }));
    }, []);

    const filterTable = (e) => {
        const value = e.target.value;
        const options = { q: value, fields: config.searchConfig?.searchFields || '' };
        dispatch(crud.list({ entity, options }));
    };

    const dispatcher = () => {
        dispatch(crud.list({ entity }));
    };

    useEffect(() => {
        const controller = new AbortController();
        dispatcher();
        return () => {
            controller.abort();
        };
    }, []);

    return (
        <>
            <PageHeader
                onBack={() => window.history.back()}
                backIcon={<ArrowLeftOutlined />}
                title={DATATABLE_TITLE}
                ghost={false}
                extra={[
                    <Input
                        key={`searchFilterDataTable}`}
                        onChange={filterTable}
                        placeholder={translate('search')}
                        allowClear
                        style={{ width: 250 }}
                    />,
                    <Button onClick={handelDataTableLoad} key={`${uniqueId()}`} icon={<RedoOutlined />}>
                        {translate('Refresh')}
                    </Button>,
                    <AddNewItem key={`${uniqueId()}`} config={config} />,
                ]}
                style={{ padding: '20px 0px' }}
            ></PageHeader>

            <Table
                columns={columns}
                rowKey={(item) => item._id}
                dataSource={dataSource}
                pagination={pagination}
                loading={listIsLoading}
                onChange={handelDataTableLoad}
                expandable={{ expandedRowRender, rowExpandable: (record) => true }}
                scroll={{ x: true }}
            />
        </>
    );
}
