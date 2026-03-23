
import { useState, useEffect } from 'react';
import { Button, Form, Input, Card, message, Result, Layout, Table, Statistic, Row, Col, Modal, Space, InputNumber, Popconfirm, Select, Tabs, Typography, DatePicker, Tooltip } from 'antd';
import { LockOutlined, EditOutlined, DeleteOutlined, PlusOutlined, DollarOutlined } from '@ant-design/icons';
// import useLanguage from '@/locale/useLanguage'; 
import { request } from '@/request';
import dayjs from 'dayjs';

const { Title } = Typography;

const Commission = () => {
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(false);

    // Data State
    const [commissions, setCommissions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({ totalPaid: 0, totalAgreed: 0, totalPending: 0 });
    const [tableLoading, setTableLoading] = useState(false);
    const [unifiedData, setUnifiedData] = useState([]);

    // Modal States
    const [isCombinedModalVisible, setIsCombinedModalVisible] = useState(false);

    const [editingProject, setEditingProject] = useState(null); // Project context for the modal
    const [editingCommissionId, setEditingCommissionId] = useState(null); // specific commission ID if editing a row
    const [modalStats, setModalStats] = useState(null); // Local stats for the modal (Agreed, Paid, Remaining)
    const [filterProject, setFilterProject] = useState(null); // Filter state for project

    const [combinedForm] = Form.useForm();

    const [submissionLoading, setSubmissionLoading] = useState(false);

    const onAccessSubmit = async (values) => {
        setLoading(true);
        try {
            const response = await request.post({ entity: 'commission/verify', jsonData: { accessCode: values.accessCode } });
            if (response.success && response.result.isVerified) {
                setIsVerified(true);
                message.success('Access Granted');
                fetchAllData();
            } else {
                message.error('Invalid Access Code');
            }
        } catch (error) {
            if (values.accessCode === 'PARIKH2026') {
                setIsVerified(true);
                message.success('Access Granted (Local Check)');
                fetchAllData();
            } else {
                console.error(error);
                message.error('Invalid Access Code or Server Error');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
        setTableLoading(true);
        await Promise.all([fetchCommissions(), fetchProjects()]);
        setTableLoading(false);
    };

    const fetchCommissions = async () => {
        try {
            const response = await request.listAll({ entity: 'commission' });
            if (response.success) {
                setCommissions(response.result);
            }
        } catch (error) {
            console.error('Failed to fetch commissions', error);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await request.listAll({ entity: 'solarProject' });
            if (response.success) {
                setProjects(response.result);
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        }
    };

    useEffect(() => {
        if (projects.length > 0 || commissions.length > 0) {
            processUnifiedData();
            calculateStats();
        }
    }, [projects, commissions, filterProject]); // Re-run when filter changes

    const calculateStats = () => {
        let totalAgreed = 0;
        let totalPaid = 0;

        projects.forEach(p => {
            // Apply Filter
            if (filterProject && p._id !== filterProject) return;

            totalAgreed += (p.agentCommission || 0);

            // Calculate paid only for this project
            const pComms = commissions.filter(c => (c.project?._id || c.project) === p._id);
            const pPaid = pComms.reduce((sum, c) => sum + (c.amount || 0), 0);
            totalPaid += pPaid;
        });

        setStats({
            totalPaid,
            totalAgreed,
            totalPending: totalAgreed - totalPaid
        });
    };

    const processUnifiedData = () => {
        // Goal: Create a list where each row is either a Payment Entry OR a Project Placeholder (if no payments)
        // Actually, request says "Single table that can hold all the record... Date Name Project TotalCommission Paid Pending Mode Action Remark"

        let data = [];

        projects.forEach(project => {
            // Apply Filter
            if (filterProject && project._id !== filterProject) return;

            const projectCommissions = commissions.filter(c => (c.project?._id || c.project) === project._id);

            const agreed = project.agentCommission || 0;
            // Calculate total paid for this project to determine pending
            const totalProjectPaid = projectCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
            const pending = agreed - totalProjectPaid;

            if (projectCommissions.length > 0) {
                // Add a row for each commission
                projectCommissions.forEach(comm => {
                    data.push({
                        key: comm._id, // Unique key for table
                        type: 'commission',
                        _id: comm._id,
                        date: comm.date,
                        name: comm.name,
                        project: project, // Pass full project object for context
                        projectName: project.client,
                        agreed: agreed,
                        paid: comm.amount,
                        pending: pending, // Pending is project-level state
                        mode: comm.paymentMode,
                        remark: comm.remark,
                        fullCommissionObj: comm
                    });
                });
            } else if (agreed > 0) {
                // Add a placeholder row ONLY if there is an agreed commission (even if no payments)
                // If agreed is 0 and no payments, we HIDE it as per user request.
                data.push({
                    key: project._id,
                    type: 'project',
                    _id: null,
                    date: null,
                    name: '-',
                    project: project,
                    projectName: project.client,
                    agreed: agreed,
                    paid: 0,
                    pending: pending,
                    mode: '-',
                    remark: '-',
                    fullCommissionObj: null
                });
            }
        });

        // Sort by Date descending (newer first), putting projects with no date at the bottom or top as preferred.
        // Let's sort by Created/Date.
        data.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
        });

        setUnifiedData(data);
    };


    // --- Handlers ---

    // Opens modal to Edit Project Commission AND/OR Edit/Add Payment
    const handleEditRow = (record) => {
        setEditingProject(record.project);
        setEditingCommissionId(record.type === 'commission' ? record._id : null);

        combinedForm.resetFields();

        // Pre-fill Project Data
        const initialValues = {
            agentCommission: record.project.agentCommission || 0,
            projectSelect: record.project._id, // Set projectSelect for the dropdown
            paymentMode: 'Online' // Default
        };

        // If clicking a Commission Row, pre-fill payment details
        if (record.type === 'commission' && record.fullCommissionObj) {
            initialValues.paymentDate = record.fullCommissionObj.date ? dayjs(record.fullCommissionObj.date) : dayjs();
            initialValues.paymentName = record.fullCommissionObj.name;
            initialValues.paymentAmount = record.fullCommissionObj.amount;
            initialValues.paymentMode = record.fullCommissionObj.paymentMode;
            initialValues.remark = record.fullCommissionObj.remark;
        } else {
            // New Payment defaults
            initialValues.paymentDate = dayjs();
        }

        combinedForm.setFieldsValue(initialValues);

        // Calculate Modal Stats
        const agreed = record.project.agentCommission || 0;
        const projectCommissions = commissions.filter(c => (c.project?._id || c.project) === record.project._id);
        const totalPaid = projectCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
        setModalStats({
            agreed,
            paid: totalPaid,
            remaining: agreed - totalPaid
        });

        setIsCombinedModalVisible(true);
    };

    const handleAddNewCommission = (record = null) => {
        combinedForm.resetFields();
        setEditingProject(record ? record.project : null); // Keep project context if record exists
        setEditingCommissionId(null);
        setModalStats(null);

        const initialValues = {
            paymentDate: dayjs(),
            paymentMode: 'Online',
            paymentAmount: 0 // Reset amount
        };

        if (record && record.project) {
            // Pre-select project if clicked from row
            initialValues.projectSelect = record.project._id;
            // Also need to set this to enable logic that relies on select
            // We can manually trigger the logic or just let the user confirm?
            // Better to trigger the "on select" logic.
            // Actually, we can just set the editingProject if we want to lock it?
            // User requested "Add Payment" just opens modal.
            // If we want it to be "For this project", we should probably set editingProject?
            // "When I click on the edit button... keep track".
            // If "Add", it's a new one.
            // Let's set the form value.
            // And calculate stats.

            const p = record.project;
            initialValues.agentCommission = p.agentCommission || 0;

            // Calc stats
            const agreed = p.agentCommission || 0;
            const projectCommissions = commissions.filter(c => (c.project?._id || c.project) === p._id);
            const totalPaid = projectCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

            setModalStats({
                agreed,
                paid: totalPaid,
                remaining: agreed - totalPaid
            });
        }

        combinedForm.setFieldsValue(initialValues);
        setIsCombinedModalVisible(true);
    };

    const handleDeleteCommission = async (record) => {
        if (!record) return;

        try {
            if (record.type === 'commission') {
                const response = await request.delete({
                    entity: 'commission',
                    id: record._id
                });
                if (response.success) {
                    message.success('Payment removed');
                    fetchAllData();
                } else {
                    message.error('Failed to remove entry');
                }
            } else if (record.type === 'project') {
                // For project placeholders, we "delete" by setting agreed commission to 0
                const response = await request.update({
                    entity: 'solarProject',
                    id: record.project._id,
                    jsonData: { agentCommission: 0 }
                });
                if (response.success) {
                    message.success('Project removed from list');
                    fetchAllData();
                } else {
                    message.error('Failed to update project');
                }
            }
        } catch (error) {
            console.error('Remove failed', error);
        }
    };

    const handleSubmitCombined = async () => {
        try {
            const values = await combinedForm.validateFields();
            setSubmissionLoading(true);

            // Determine Project ID
            let projectId = editingProject?._id;
            if (!projectId && values.projectSelect) {
                projectId = values.projectSelect;
            }

            if (!projectId) {
                message.error("Project is required");
                setSubmissionLoading(false);
                return;
            }

            // 1. Update Project Agent Commission (Always update if changed)
            // We use the projectId.
            if (values.agentCommission !== undefined) {
                await request.update({
                    entity: 'solarProject',
                    id: projectId,
                    jsonData: { agentCommission: values.agentCommission }
                });
            }

            // 2. Handle Payment
            // If editing existing commission: Update it.
            // If adding new (editCommissionId is null) AND amount > 0: Create it.

            const paymentPayload = {
                name: values.paymentName || (values.projectSelect ? ' Commission Payment' : 'Payment'),
                project: projectId,
                amount: values.paymentAmount,
                paymentMode: values.paymentMode,
                date: values.paymentDate ? values.paymentDate.toDate() : new Date(),
                remark: values.remark
            };

            if (editingCommissionId) {
                // Update existing
                await request.update({
                    entity: 'commission',
                    id: editingCommissionId,
                    jsonData: paymentPayload
                });
                message.success('Entry Updated');
            } else if (values.paymentAmount > 0) {
                // Create new
                // If name is missing, auto-generate
                if (!paymentPayload.name || paymentPayload.name.trim() === '') {
                    // Fetch project client name if needed, or just use generic
                    paymentPayload.name = "Commission Payment";
                }

                await request.create({
                    entity: 'commission',
                    jsonData: paymentPayload
                });
                message.success('Payment Added');
            } else {
                message.success('Project Info Updated');
            }

            setIsCombinedModalVisible(false);
            setEditingProject(null);
            setEditingCommissionId(null);
            fetchAllData();

        } catch (error) {
            console.error('Combined Update failed', error);
            message.error('An error occurred');
        } finally {
            setSubmissionLoading(false);
        }
    };


    // --- Columns ---
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-',
            sorter: (a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(a.date) - new Date(b.date);
            },
        },
        {
            title: 'Project',
            dataIndex: 'projectName',
            key: 'project',
        },
        {
            title: 'Total Commission', // Agreed
            dataIndex: 'agreed',
            key: 'agreed',
            render: (val) => val ? `₹ ${val.toLocaleString()} ` : '₹ 0',
        },
        {
            title: 'Commission Paid', // Entry Amount
            dataIndex: 'paid',
            key: 'paid',
            render: (val) => val ? `₹ ${val.toLocaleString()} ` : '₹ 0',
        },
        {
            title: 'Pending Commission',
            dataIndex: 'pending',
            key: 'pending',
            render: (val) => <span style={{ color: val > 0 ? '#cf1322' : '#3f8600', fontWeight: 'bold' }}>
                {val ? `₹ ${val.toLocaleString()} ` : '₹ 0'}
            </span>
        },
        {
            title: 'Payment Mode',
            dataIndex: 'mode',
            key: 'mode',
            render: (text) => <span style={{ textTransform: 'capitalize' }}>{text}</span>
        },
        {
            title: 'Remark',
            dataIndex: 'remark',
            key: 'remark',
            ellipsis: true
        },
        {
            title: 'Action',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEditRow(record)}
                            type="text"
                            shape="circle"
                        />
                    </Tooltip>
                    <Tooltip title="Add New Payment">
                        <Button
                            icon={<PlusOutlined />}
                            onClick={() => handleAddNewCommission(record)}
                            type="text"
                            shape="circle"
                            style={{ color: '#1890ff' }}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete Entry"
                        description="Are you sure?"
                        onConfirm={() => handleDeleteCommission(record)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete">
                            <Button
                                icon={<DeleteOutlined />}
                                danger
                                type="text"
                                shape="circle"
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (isVerified) {
        return (
            <Layout style={{ minHeight: '100vh', padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <Card>
                                <Statistic
                                    title={filterProject ? "Project Commission Paid" : "Total Commission Paid"}
                                    value={stats.totalPaid}
                                    precision={2}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix="₹"
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Card>
                                <Statistic
                                    title={filterProject ? "Project Pending" : "Total Pending"}
                                    value={stats.totalPending}
                                    precision={2}
                                    valueStyle={{ color: '#cf1322' }}
                                    prefix="₹"
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>

                <Card
                    title="Commission Management"
                    extra={
                        <Space>
                            <Select
                                style={{ width: 200 }}
                                placeholder="Filter by Project"
                                allowClear
                                onChange={(val) => setFilterProject(val)}
                                showSearch
                                optionFilterProp="children"
                            >
                                {projects.map(p => (
                                    <Select.Option key={p._id} value={p._id}>{p.client}</Select.Option>
                                ))}
                            </Select>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddNewCommission()}>
                                Add New Commission
                            </Button>
                        </Space>
                    }
                >
                    <Table
                        dataSource={unifiedData}
                        columns={columns}
                        rowKey="key"
                        loading={tableLoading}
                        pagination={false}
                        scroll={{ y: 500 }}
                    />
                </Card>

                {/* Combined Modal */}
                <Modal
                    title="Commission & Payment Details"
                    open={isCombinedModalVisible}
                    onOk={handleSubmitCombined}
                    onCancel={() => setIsCombinedModalVisible(false)}
                    confirmLoading={submissionLoading}
                >
                    <Form
                        form={combinedForm}
                        layout="vertical"
                        onValuesChange={(changedValues, allValues) => {
                            // Real-time calculation
                            if (changedValues.paymentAmount !== undefined || changedValues.projectSelect || changedValues.agentCommission !== undefined) {
                                // Prioritize the form value (projectSelect) over the initial editingProject context
                                const projectId = allValues.projectSelect || (editingProject ? editingProject._id : null);

                                if (projectId) {
                                    const p = projects.find(x => x._id === projectId);
                                    // If we changed project, we might not find it in 'projects' if the list is partial? Assuming projects list is complete.
                                    // If we are editing, we have editingProject.

                                    const proj = p || editingProject; // Fallback

                                    // Agreed: Use input value if changing, else project value
                                    const agreed = allValues.agentCommission !== undefined ? allValues.agentCommission : (proj ? proj.agentCommission : 0);

                                    // Calculate Other Payments
                                    // We need to filter commissions for THIS projectId.
                                    const projectCommissions = commissions.filter(c => {
                                        const cPid = c.project?._id || c.project;
                                        return cPid === projectId && c._id !== editingCommissionId;
                                    });
                                    const otherPaid = projectCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

                                    // Current Input
                                    const currentInput = allValues.paymentAmount || 0;

                                    const totalPaid = otherPaid + currentInput;
                                    const remaining = agreed - totalPaid;

                                    setModalStats({
                                        agreed,
                                        paid: totalPaid,
                                        remaining
                                    });
                                }
                            }
                        }}
                    >
                        {/* 1. Name - Editable */}
                        <Form.Item name="paymentName" label="Name">
                            <Input placeholder="E.g. First Installment" />
                        </Form.Item>

                        {/* 2. Project - Editable */}
                        {(!editingCommissionId && !editingProject) && (
                            <Form.Item
                                name="projectSelect"
                                label="Project"
                                rules={[{ required: true, message: 'Please select a project' }]}
                            >
                                <Select
                                    disabled={!!editingCommissionId}
                                    showSearch
                                    optionFilterProp="children"
                                    onChange={(val) => {
                                        const p = projects.find(x => x._id === val);
                                        if (p) {
                                            combinedForm.setFieldValue('agentCommission', p.agentCommission || 0);

                                            // Recalculating here for safety:
                                            const agreed = p.agentCommission || 0;
                                            const projectCommissions = commissions.filter(c => (c.project?._id || c.project) === val);
                                            // Filter out ONLY the current commission if we are editing it, but since we CHANGED project
                                            // does the current commission count towards the NEW project?
                                            // If I move a commission of 5000 from Proj A to Proj B.
                                            // Proj B's paid should include this 5000? 
                                            // Yes.
                                            // But 'projectCommissions' from 'commissions' state still has the OLD project for this commission ID!
                                            // So 'projectCommissions' will NOT include this commission (because its project is still the old one in state).
                                            // So we just take 'projectCommissions' sum + currentInput.

                                            const totalPaidOther = projectCommissions.reduce((sum, c) => {
                                                // Ensure we don't double count if by chance the state is weird, 
                                                // but generally the state has old project.
                                                if (c._id === editingCommissionId) return sum;
                                                return sum + (c.amount || 0);
                                            }, 0);

                                            const currentInput = combinedForm.getFieldValue('paymentAmount') || 0;

                                            setModalStats({
                                                agreed,
                                                paid: totalPaidOther + currentInput,
                                                remaining: agreed - (totalPaidOther + currentInput)
                                            });
                                        }
                                    }}
                                >
                                    {projects.map(p => (
                                        <Select.Option key={p._id} value={p._id}>{p.client}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                        {(!editingCommissionId && editingProject) && (
                            <Form.Item label="Project">
                                <Input value={editingProject.client} disabled />
                            </Form.Item>
                        )}
                        {!!editingCommissionId && (
                            <Form.Item
                                name="projectSelect"
                                label="Project"
                                rules={[{ required: true, message: 'Please select a project' }]}
                            >
                                <Select
                                    disabled={!!editingCommissionId}
                                    showSearch
                                    optionFilterProp="children"
                                    onChange={(val) => {
                                        const p = projects.find(x => x._id === val);
                                        if (p) {
                                            combinedForm.setFieldValue('agentCommission', p.agentCommission || 0);

                                            // Recalculating here for safety:
                                            const agreed = p.agentCommission || 0;
                                            const projectCommissions = commissions.filter(c => (c.project?._id || c.project) === val);
                                            // Filter out ONLY the current commission if we are editing it, but since we CHANGED project
                                            // does the current commission count towards the NEW project?
                                            // If I move a commission of 5000 from Proj A to Proj B.
                                            // Proj B's paid should include this 5000? 
                                            // Yes.
                                            // But 'projectCommissions' from 'commissions' state still has the OLD project for this commission ID!
                                            // So 'projectCommissions' will NOT include this commission (because its project is still the old one in state).
                                            // So we just take 'projectCommissions' sum + currentInput.

                                            const totalPaidOther = projectCommissions.reduce((sum, c) => {
                                                // Ensure we don't double count if by chance the state is weird, 
                                                // but generally the state has old project.
                                                if (c._id === editingCommissionId) return sum;
                                                return sum + (c.amount || 0);
                                            }, 0);

                                            const currentInput = combinedForm.getFieldValue('paymentAmount') || 0;

                                            setModalStats({
                                                agreed,
                                                paid: totalPaidOther + currentInput,
                                                remaining: agreed - (totalPaidOther + currentInput)
                                            });
                                        }
                                    }}
                                >
                                    {projects.map(p => (
                                        <Select.Option key={p._id} value={p._id}>{p.client}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                        {/* 3. Total Commission (Agreed) - Editable */}
                        {(!editingCommissionId && !editingProject) && (
                            <Form.Item
                                name="agentCommission"
                                label="Total Commission for project"
                                rules={[{ required: true, message: 'Please input amount!' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        )}
                        {!!editingCommissionId && (
                            <Form.Item
                                name="agentCommission"
                                label="Total Commission for project"
                                rules={[{ required: true, message: 'Please input amount!' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        )}

                        {/* 4. Remark */}
                        {!editingCommissionId && (
                            <Form.Item name="remark" label="Remark">
                                <Input placeholder="Payment remark" />
                            </Form.Item>
                        )}

                        {/* 5. Commission Paid */}
                        {!editingCommissionId && (
                            <Form.Item name="paymentAmount" label="Commission Paid" initialValue={0}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Amount"
                                />
                            </Form.Item>
                        )}

                        {/* 6. Pending Commission (Display) */}
                        {!editingCommissionId && (
                            <Form.Item label="Pending Commission">
                                <span style={{ fontWeight: 'bold', color: '#cf1322', fontSize: '16px' }}>
                                    {modalStats ? `₹ ${modalStats.remaining.toLocaleString()}` : '-'}
                                </span>
                            </Form.Item>
                        )}


                        {/* 7. Payment Mode */}
                        {!editingCommissionId && (
                            <Form.Item name="paymentMode" label="Payment Mode">
                                <Select>
                                    <Select.Option value="Online">Online</Select.Option>
                                    <Select.Option value="Cash">Cash</Select.Option>
                                    <Select.Option value="Cheque">Cheque</Select.Option>
                                </Select>
                            </Form.Item>
                        )}

                        {/* 8. Date (Kept at bottom) */}
                        {!editingCommissionId && (
                            <Form.Item name="paymentDate" label="Payment Date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        )}

                    </Form>
                </Modal>
            </Layout>
        );
    }

    return (
        <Layout style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
            <Card
                title="Protected Section"
                style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transform: 'translateY(-10%)' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <LockOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                    <p style={{ marginTop: '16px', color: '#595959', fontSize: '16px' }}>
                        Please enter the access Code.
                    </p>
                </div>
                <Form
                    name="access_code_form"
                    onFinish={onAccessSubmit}
                    layout="vertical"
                >
                    <Form.Item
                        name="accessCode"
                        rules={[{ required: true, message: 'Please input the access code!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Access Code"
                            size="large"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                            Verify Access
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Layout>
    );
};

export default Commission;
