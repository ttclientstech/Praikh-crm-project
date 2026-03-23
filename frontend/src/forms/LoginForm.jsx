import React from 'react';
import { Form, Input, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

import useLanguage from '@/locale/useLanguage';

export default function LoginForm() {
  const translate = useLanguage();
  return (
    <div className="login-form-wrapper">
      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            message: translate('Please enter your email'),
          },
          {
            type: 'email',
            message: translate('Please enter a valid email'),
          },
        ]}
        className="custom-input-group"
      >
        <Input
          prefix={<UserOutlined className="site-form-item-icon" />}
          placeholder={translate('email')}
          type="email"
          size="large"
          className="custom-input"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: translate('Please enter your password'),
          },
        ]}
        className="custom-input-group"
      >
        <Input.Password
          prefix={<LockOutlined className="site-form-item-icon" />}
          placeholder={translate('password')}
          size="large"
          className="custom-input"
        />
      </Form.Item>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>{translate('Remember me')}</Checkbox>
        </Form.Item>
      </div>
    </div>
  );
}
