import { useState, useEffect } from 'react';
import { Form, Button, DatePicker, Switch, Input, Row, Col, Typography, Divider, List, Space, Tag, notification } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, EditOutlined, LinkOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import { useDispatch } from 'react-redux';
import { crud } from '@/redux/crud/actions';

const { Title, Text } = Typography;

export default function CompletionDetails({ item, entity }) {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const DEFAULT_FORMS = [
        { name: 'LIGHTBILL', link: 'https://wss.mahadiscom.in/wss/wss?uiActionName=getCustAccountLogin' },
        { name: 'PM SURYAGHAR YOJNA', link: 'https://pmsuryaghar.gov.in/#/' },
        { name: 'MAHADISCOM', link: 'https://www.mahadiscom.in/ismart/' },
        { name: 'DCR', link: 'https://solardcrportal.nise.res.in/Account/Login' },
        { name: 'SOLAR RTS STATUS', link: 'https://css.mahadiscom.in/UI/ROOFTOP/Solar_RTS.aspx' }
    ];

    useEffect(() => {
        if (item && item.completionDetails) {
            // Merge DB forms with Default forms to get Status
            const dbForms = item.completionDetails.externalForms || [];
            const mergedForms = DEFAULT_FORMS.map(def => {
                const found = dbForms.find(d => d.name === def.name);
                return {
                    ...def,
                    isFilled: found ? found.isFilled : false
                };
            });

            const data = {
                ...item.completionDetails,
                completionDate: item.completionDetails.completionDate ? dayjs(item.completionDetails.completionDate) : null,
                solarPanelSerialNumbers: item.completionDetails.solarPanelSerialNumbers?.length ? item.completionDetails.solarPanelSerialNumbers : [''],
                externalForms: mergedForms
            };
            form.setFieldsValue(data);
            setIsCompleted(item.completionDetails.isInstallationCompleted);
        } else {
            form.setFieldsValue({
                solarPanelSerialNumbers: [''],
                externalForms: DEFAULT_FORMS.map(f => ({ ...f, isFilled: false }))
            });
        }
    }, [item, isEditing]);

    const onFinish = async (values) => {
        const payload = {
            completionDetails: {
                ...values,
                isInstallationCompleted: values.isInstallationCompleted,
                siteStatus: values.isInstallationCompleted ? 'Completed' : 'Pending',
                solarPanelSerialNumbers: values.solarPanelSerialNumbers.filter(s => s),
                externalForms: values.externalForms || []
            }
        };

        const response = await request.update({ entity, id: item._id, jsonData: payload });

        if (response.success) {
            notification.success({ message: 'Completion details updated successfully' });
            setIsEditing(false);
            dispatch(crud.currentItem({ data: response.result }));
        } else {
            notification.error({ message: 'Failed to update details' });
        }
    };

    const StatusTag = ({ status }) => (
        status === 'Completed' ?
            <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag> :
            <Tag icon={<ClockCircleOutlined />} color="warning">Pending</Tag>
    );

    if (!isEditing) {
        const details = item?.completionDetails || {};
        // Ensure we display all 5 forms even in view mode (merged view)
        const displayForms = DEFAULT_FORMS.map(def => {
            const found = (details.externalForms || []).find(d => d.name === def.name);
            return { ...def, isFilled: found ? found.isFilled : false };
        });

        return (
            <div style={{ padding: 24, background: '#fff', borderRadius: 8, marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0 }}>Site Completion Status</Title>
                    <div>
                        <StatusTag status={details.siteStatus || 'Pending'} />
                        <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
                    </div>
                </div>

                <Row gutter={[24, 24]}>
                    <Col span={8}>
                        <Text type="secondary">Installation Completed</Text>
                        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{details.isInstallationCompleted ? 'YES' : 'NO'}</div>
                    </Col>
                    {details.isInstallationCompleted && (
                        <Col span={8}>
                            <Text type="secondary">Completion Date</Text>
                            <div style={{ fontWeight: 'bold' }}>{details.completionDate ? dayjs(details.completionDate).format('DD/MM/YYYY') : '-'}</div>
                        </Col>
                    )}
                    <Col span={8}>
                        <Text type="secondary">Inverter Model</Text>
                        <div style={{ fontWeight: 'bold' }}>{details.inverterModelNumber || '-'}</div>
                    </Col>
                </Row>

                <Divider />

                <Title level={5}>Solar Panels ({details.solarPanelSerialNumbers?.length || 0})</Title>
                <Space wrap>
                    {details.solarPanelSerialNumbers?.map((sn, idx) => (
                        <Tag key={idx} color="blue">{sn}</Tag>
                    ))}
                    {!details.solarPanelSerialNumbers?.length && <Text type="secondary">No serial numbers recorded</Text>}
                </Space>

                <Divider />

                <Title level={5}>External Forms Status</Title>
                <List
                    size="small"
                    dataSource={displayForms}
                    renderItem={form => (
                        <List.Item>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <Space>
                                    <LinkOutlined />
                                    <a href={form.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500 }}>{form.name}</a>
                                </Space>
                                <Tag color={form.isFilled ? 'green' : 'default'}>
                                    {form.isFilled ? <><CheckCircleOutlined /> Filled</> : 'Not Filled'}
                                </Tag>
                            </div>
                        </List.Item>
                    )}
                />
            </div>
        );
    }

    return (
        <div style={{ padding: 24, background: '#f9f9f9', borderRadius: 8, marginTop: 20, border: '1px solid #d9d9d9' }}>
            <Title level={4}>Update Completion Details</Title>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="isInstallationCompleted" label="Installation Completed" valuePropName="checked">
                            <Switch onChange={(checked) => setIsCompleted(checked)} unCheckedChildren="NO" checkedChildren="YES" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="completionDate"
                            label="Completion Date"
                            rules={[{ required: isCompleted, message: 'Date is required when completed' }]}
                        >
                            <DatePicker style={{ width: '100%' }} disabled={!isCompleted} />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            name="inverterModelNumber"
                            label="Inverter Model No."
                            rules={[{ required: true, message: 'Inverter model is required' }]}
                        >
                            <Input placeholder="Enter model number" />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left">Solar Panel Serial Numbers</Divider>
                <Form.List name="solarPanelSerialNumbers">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map((field) => (
                                <Form.Item
                                    required={false}
                                    key={field.key}
                                    style={{ marginBottom: 12 }}
                                >
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Form.Item
                                            {...field}
                                            validateTrigger={['onChange', 'onBlur']}
                                            rules={[
                                                { required: true, whitespace: true, message: "Please input serial number or delete this field." },
                                            ]}
                                            noStyle
                                        >
                                            <Input placeholder="Panel Serial Number" />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                            className="dynamic-delete-button"
                                            onClick={() => remove(field.name)}
                                            style={{ marginTop: 8, color: 'red' }}
                                        />
                                    </div>
                                </Form.Item>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                                    Add Panel Serial Number
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Divider orientation="left">External Forms (Links)</Divider>
                <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                    <Form.List name="externalForms">
                        {(fields) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => {
                                    // Get current value to display name/link correctly
                                    const formValues = form.getFieldValue(['externalForms', name]);
                                    return (
                                        <Row key={key} align="middle" gutter={16} style={{ marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                                            {/* Hidden Fields for Name and Link */}
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'name']}
                                                hidden
                                            >
                                                <Input />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'link']}
                                                hidden
                                            >
                                                <Input />
                                            </Form.Item>

                                            <Col span={12}>
                                                <Space>
                                                    <LinkOutlined style={{ color: '#1890ff' }} />
                                                    <a href={formValues?.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>
                                                        {formValues?.name}
                                                    </a>
                                                </Space>
                                            </Col>
                                            <Col span={12} style={{ textAlign: 'right' }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'isFilled']}
                                                    valuePropName="checked"
                                                    style={{ marginBottom: 0 }}
                                                    label="Form Filled?"
                                                    labelCol={{ span: 18 }}
                                                    wrapperCol={{ span: 6 }}
                                                >
                                                    <Switch checkedChildren="YES" unCheckedChildren="NO" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    );
                                })}
                            </>
                        )}
                    </Form.List>
                </div>

                <div style={{ textAlign: 'right', marginTop: 20 }}>
                    <Space>
                        <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save Details</Button>
                    </Space>
                </div>
            </Form>
        </div>
    );
}
