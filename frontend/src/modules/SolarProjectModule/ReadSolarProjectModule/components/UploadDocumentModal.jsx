import { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, Button, Select, notification, Divider, Space, Typography } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { request } from '@/request';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { useParams } from 'react-router-dom';

const DEFAULT_OPTIONS = [
    'Proposal', 'Contract', 'Design', 'Invoice', 'Govt Approval', 'Warranty', 'Site Photo'
];

export default function UploadDocumentModal({ open, onCancel, entity }) {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState(DEFAULT_OPTIONS);
    const [api, contextHolder] = notification.useNotification();
    const dispatch = useDispatch();
    const { id } = useParams();

    // Watch documentType to conditional render input
    const documentType = Form.useWatch('documentType', form);

    useEffect(() => {
        if (open) {
            // Load custom types from local storage on open
            const savedTypes = JSON.parse(localStorage.getItem('customDocumentTypes') || '[]');
            setOptions([...new Set([...DEFAULT_OPTIONS, ...savedTypes])]);
            form.resetFields();
            setFileList([]);
        }
    }, [open, form]);

    const handleUpload = async (values) => {
        if (fileList.length === 0) {
            api.error({ message: 'Please select a file to upload' });
            return;
        }

        let finalDocumentType = values.documentType;

        // Handle Custom Type Logic
        if (values.documentType === 'Other') {
            const customType = values.customDocumentType?.trim();
            if (!customType) {
                api.error({ message: 'Please enter the custom document type name' });
                return;
            }
            finalDocumentType = customType;

            // Save new type to local storage
            const currentSaved = JSON.parse(localStorage.getItem('customDocumentTypes') || '[]');
            if (!currentSaved.includes(customType) && !DEFAULT_OPTIONS.includes(customType)) {
                const newSaved = [...currentSaved, customType];
                localStorage.setItem('customDocumentTypes', JSON.stringify(newSaved));
                setOptions([...new Set([...DEFAULT_OPTIONS, ...newSaved])]);
            }
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', fileList[0]);
        formData.append('documentType', finalDocumentType);

        try {
            const response = await request.post({
                entity: `${entity}/upload/${id}`,
                jsonData: formData,
            });

            if (response.success) {
                api.success({ message: 'Document uploaded successfully' });
                form.resetFields();
                setFileList([]);
                dispatch(erp.read({ entity, id })); // Refresh data
                setTimeout(() => onCancel(), 1000); // Small delay so user sees success
            } else {
                api.error({ message: response.message || 'Upload failed' });
            }
        } catch (error) {
            api.error({ message: error.message || 'Upload failed' });
        } finally {
            setIsLoading(false);
        }
    };

    const uploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            setFileList([file]); // Allow only 1 file
            return false; // Prevent auto upload
        },
        fileList,
    };

    return (
        <Modal
            title="Upload Project Document"
            open={open}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            {contextHolder}
            <Form form={form} layout="vertical" onFinish={handleUpload}>
                <Form.Item
                    name="documentType"
                    label="Document Type"
                    rules={[{ required: true, message: 'Please select document type' }]}
                >
                    <Select
                        placeholder="Select Document Type"
                        dropdownRender={(menu) => (
                            <>
                                {menu}
                            </>
                        )}
                    >
                        {options.map(opt => (
                            <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                        ))}
                        <Select.Option key="Other" value="Other" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                            <PlusOutlined /> Add Custom Type (Other)
                        </Select.Option>
                    </Select>
                </Form.Item>

                {documentType === 'Other' && (
                    <Form.Item
                        name="customDocumentType"
                        label="Enter Document Name"
                        rules={[{ required: true, message: 'Please enter the name of the document' }]}
                    >
                        <Input placeholder="e.g. Site Clearance, Inspection Report" autoFocus />
                    </Form.Item>
                )}

                <Form.Item label="File">
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Select File</Button>
                    </Upload>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={isLoading} block>
                        Upload
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}
