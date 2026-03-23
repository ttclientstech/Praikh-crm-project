import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Input, Row, Col, Avatar, Tag, Dropdown, Modal, Form } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    EllipsisOutlined,
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    GlobalOutlined,
    PhoneOutlined,
    MailOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { crud } from '@/redux/crud/actions';
import { selectListItems, selectCreatedItem, selectUpdatedItem, selectCurrentItem } from '@/redux/crud/selectors';
import { fields } from './config';
import DynamicForm from '@/forms/DynamicForm';
import useLanguage from '@/locale/useLanguage';
import Loading from '@/components/Loading';
import '@/style/CustomerRedesign.css'; // New Styles

// --- Local Components for Create/Update to avoid Context Side-Effects ---
// ... (CreateForm and UpdateForm logic remains same)

function CustomerCreateForm({ onSuccess, config }) {
    const { entity } = config;
    const dispatch = useDispatch();
    const { isLoading, isSuccess } = useSelector(selectCreatedItem);
    const [form] = Form.useForm();
    const translate = useLanguage();

    const onSubmit = (fieldsValue) => {
        dispatch(crud.create({ entity, jsonData: fieldsValue }));
    };

    useEffect(() => {
        if (isSuccess) {
            form.resetFields();
            dispatch(crud.resetAction({ actionType: 'create' }));
            dispatch(crud.list({ entity }));
            onSuccess();
        }
    }, [isSuccess]);

    return (
        <Loading isLoading={isLoading}>
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <DynamicForm fields={fields} />
                <Form.Item>
                    <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                        {translate('Submit')}
                    </Button>
                </Form.Item>
            </Form>
        </Loading>
    );
}

function CustomerUpdateForm({ onSuccess, config }) {
    const { entity } = config;
    const dispatch = useDispatch();
    const { current, isLoading, isSuccess } = useSelector(selectUpdatedItem);

    const [form] = Form.useForm();
    const translate = useLanguage();

    const onSubmit = (fieldsValue) => {
        const id = current._id;
        dispatch(crud.update({ entity, id, jsonData: fieldsValue }));
    };

    useEffect(() => {
        if (current) {
            // Replicate date logic from original UpdateForm
            let newValues = { ...current };
            const dateFields = ['birthday', 'date', 'expiredDate', 'created', 'updated'];
            dateFields.forEach(field => {
                if (newValues[field]) {
                    newValues[field] = dayjs(newValues[field]);
                }
            });
            form.resetFields();
            form.setFieldsValue(newValues);
        }
    }, [current]);

    useEffect(() => {
        if (isSuccess) {
            form.resetFields();
            dispatch(crud.resetAction({ actionType: 'update' }));
            dispatch(crud.list({ entity }));
            onSuccess();
        }
    }, [isSuccess]);

    return (
        <Loading isLoading={isLoading}>
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <DynamicForm fields={fields} isUpdateForm={true} />
                <Form.Item>
                    <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                        {translate('Save')}
                    </Button>
                </Form.Item>
            </Form>
        </Loading>
    );
}

// --- Main Page Component ---

export default function CustomerPage() {
    const dispatch = useDispatch();
    const translate = useLanguage();
    const entity = 'prospect';

    // Redux Selectors
    const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);
    const { pagination, items: dataSource } = listResult || { pagination: {}, items: [] };

    // Local State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Fetch Data on Mount
    useEffect(() => {
        dispatch(crud.list({ entity, options: { items: 1000 } }));
    }, [dispatch]);

    // Handlers
    const handleRefresh = () => {
        dispatch(crud.list({ entity, options: { items: 1000 } }));
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchText(value);
        const options = { q: value, fields: 'name,email', items: 1000 };
        dispatch(crud.list({ entity, options }));
    };

    const handleAdd = () => {
        setIsEdit(false);
        dispatch(crud.resetAction({ actionType: 'create' }));
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setIsEdit(true);
        dispatch(crud.currentAction({ actionType: 'update', data: record }));
        setIsModalVisible(true);
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: translate('delete_confirmation'),
            content: `${translate('are_you_sure_delete')} ${record.name}?`,
            okText: translate('delete'),
            okType: 'danger',
            cancelText: translate('cancel'),
            onOk: () => {
                dispatch(crud.delete({ entity, id: record._id }));
                setTimeout(() => handleRefresh(), 500);
            }
        });
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
    };

    // Config
    const config = { entity };

    // Table Columns
    const columns = [
        {
            title: translate('Name'),
            dataIndex: 'name',
            key: 'name',
            render: (name) => (
                <div className="customer-name-cell">
                    <div className="customer-avatar">
                        {name ? name.charAt(0).toUpperCase() : <UserOutlined />}
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '15px' }}>{name}</div>
                    </div>
                </div>
            )
        },
        {
            title: translate('City'),
            dataIndex: 'city',
            key: 'city',
            render: (city) => (
                city ? <span className="country-pill" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>{city}</span> : <span style={{ color: '#9ca3af' }}>N/A</span>
            )
        },
        {
            title: translate('Address'),
            dataIndex: 'address',
            key: 'address',
            render: (text) => <span style={{ color: '#4b5563', fontSize: '14px' }}>{text || 'N/A'}</span>
        },
        {
            title: translate('Phone'),
            dataIndex: 'phone',
            key: 'phone',
            render: (phone) => (
                <span className="contact-info">
                    {phone ? <><PhoneOutlined style={{ color: '#3b82f6' }} />{phone}</> : 'N/A'}
                </span>
            )
        },
        {
            title: translate('Email'),
            dataIndex: 'email',
            key: 'email',
            render: (email) => (
                <span className="contact-info">
                    {email ? <><MailOutlined style={{ color: '#3b82f6' }} />{email}</> : 'N/A'}
                </span>
            )
        },
        {
            title: '',
            key: 'action',
            width: 60,
            render: (_, record) => {
                const items = [
                    { key: 'edit', label: translate('Edit'), icon: <EditOutlined />, onClick: () => handleEdit(record) },
                    { type: 'divider' },
                    { key: 'delete', label: translate('Delete'), icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record) },
                ];
                return (
                    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                        <EllipsisOutlined className="action-menu-btn" style={{ cursor: 'pointer' }} />
                    </Dropdown>
                )
            }
        }
    ];

    return (
        <div className="customer-page-container">
            {/* Header */}
            <div className="customer-header">
                <div className="customer-title-area">
                    <h2>
                        {translate('Prospects List')}
                    </h2>
                    <p>{translate('Manage your customer relationships effectively')}</p>
                </div>
                <div className="customer-actions">
                    <Input
                        prefix={<SearchOutlined style={{ color: '#9ca3af', fontSize: '18px' }} />}
                        placeholder={translate('Search...')}
                        className="search-pill"
                        variant="borderless"
                        value={searchText}
                        onChange={handleSearch}
                        allowClear
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button className="refresh-btn" type="text" onClick={handleRefresh}>
                            <ReloadOutlined style={{ fontSize: '18px' }} />
                        </Button>
                        <Button className="add-customer-btn" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            {translate('Add New Customer')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="mini-kpi-card">
                    <div className="kpi-icon-box">
                        <UserOutlined />
                    </div>
                    <div className="kpi-content">
                        <h3>{pagination.total || 0}</h3>
                        <p>{translate('Total Customers')}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="floating-table-card">
                <Table
                    className="custom-table"
                    columns={columns}
                    dataSource={dataSource}
                    loading={listIsLoading}
                    rowKey="_id"
                    pagination={false}
                    scroll={{ x: 1000, y: 450 }}
                />
            </div>

            {/* Modal for Add/Edit */}
            <Modal
                title={isEdit ? translate('Edit Customer') : translate('Add New Customer')}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                destroyOnClose
                centered
                maskClosable={false}
                width={600}
            >
                {isEdit ? (
                    <CustomerUpdateForm config={config} onSuccess={handleModalClose} />
                ) : (
                    <CustomerCreateForm config={config} onSuccess={handleModalClose} />
                )}
            </Modal>
        </div>
    );
}
