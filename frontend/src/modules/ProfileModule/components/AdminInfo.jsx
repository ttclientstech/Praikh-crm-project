import { useEffect, useState } from 'react';
import { useProfileContext } from '@/context/profileContext';
import { generate as uniqueId } from 'shortid';
import { EditOutlined, LockOutlined, LogoutOutlined, SafetyOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Descriptions, Divider, Row, Modal, Form, Input, message } from 'antd';
import { request } from '@/request';
import { PageHeader } from '@ant-design/pro-layout';
import { useSelector } from 'react-redux';

import { useNavigate } from 'react-router-dom';

import { selectCurrentAdmin } from '@/redux/auth/selectors';

import useLanguage from '@/locale/useLanguage';
import { FILE_BASE_URL } from '@/config/serverApiConfig';

const AdminInfo = ({ config }) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { profileContextAction } = useProfileContext();
  const { modal, updatePanel } = profileContextAction;
  const { ENTITY_NAME } = config;
  const currentAdmin = useSelector(selectCurrentAdmin);

  const [isUpdateCodeOpen, setIsUpdateCodeOpen] = useState(false);
  const [codeForm] = Form.useForm();

  const handleUpdateCode = async (values) => {
    try {
      const response = await request.patch({ entity: 'commission/updateCode', jsonData: { newAccessCode: values.newAccessCode } });
      if (response.success) {
        message.success('Access Code Reset Successfully');
        setIsUpdateCodeOpen(false);
        codeForm.resetFields();
      } else {
        message.error(response.message || 'Failed to update code');
      }
    } catch (error) {
      message.error('Error updating code');
    }
  };

  return (
    <>
      <PageHeader
        onBack={() => window.history.back()}
        title={ENTITY_NAME}
        ghost={false}
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              updatePanel.open();
            }}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            icon={<LockOutlined />}
            onClick={() => {
              modal.open();
            }}
          >
            {translate('Update Password')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            icon={<SafetyOutlined />}
            onClick={() => {
              setIsUpdateCodeOpen(true);
            }}
          >
            Update Access Code
          </Button>,
        ]}
        style={{
          padding: '20px 0px',
        }}
      ></PageHeader>
      <Row align="middle">
        <Col xs={{ span: 24 }} sm={{ span: 7 }} md={{ span: 5 }}>
          <Avatar
            className="last left"
            src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
            size={96}
            style={{
              color: '#f56a00',
              backgroundColor: currentAdmin?.photo ? 'none' : '#fde3cf',
              boxShadow: 'rgba(150, 190, 238, 0.35) 0px 0px 15px 3px',
              fontSize: '48px',
            }}
            alt={`${currentAdmin?.name}`}
          >
            {currentAdmin?.name.charAt(0).toUpperCase()}
          </Avatar>
        </Col>
        <Col xs={{ span: 24 }} sm={{ span: 18 }}>
          <Descriptions column={1} size="middle">
            <Descriptions.Item label={translate('first name')}>
              {currentAdmin?.name}
            </Descriptions.Item>
            <Descriptions.Item label={translate('last name')}>
              {currentAdmin?.surname}
            </Descriptions.Item>
            <Descriptions.Item label={translate('email')}>{currentAdmin?.email}</Descriptions.Item>
            <Descriptions.Item label={translate('role')}>{currentAdmin?.role}</Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
      <Divider />
      <Button
        key={`${uniqueId()}`}
        icon={<LogoutOutlined />}
        className="right"
        onClick={() => navigate('/logout')}
      >
        {translate('Logout')}
      </Button>

      <Modal
        title="Update Commission Access Code"
        open={isUpdateCodeOpen}
        onCancel={() => setIsUpdateCodeOpen(false)}
        onOk={() => codeForm.submit()}
      >
        <Form form={codeForm} layout="vertical" onFinish={handleUpdateCode}>
          <Form.Item name="newAccessCode" label="New Access Code" rules={[{ required: true, message: 'Please enter a code' }]}>
            <Input placeholder="Enter new access code" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
export default AdminInfo;
