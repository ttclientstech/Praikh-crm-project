import React from 'react';
import { Card, Row, Col, Typography, Layout } from 'antd';
import { LinkOutlined, ExportOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;

const EXTERNAL_LINKS = [
    { name: 'LIGHTBILL', link: 'https://wss.mahadiscom.in/wss/wss?uiActionName=getCustAccountLogin', description: 'Access and manage electricity bill details' },
    { name: 'PM SURYAGHAR YOJNA', link: 'https://pmsuryaghar.gov.in/#/', description: 'Official portal for PM Surya Ghar Yojna' },
    { name: 'MAHADISCOM', link: 'https://www.mahadiscom.in/ismart/', description: 'Mahadiscom iSmart Solar Portal' },
    { name: 'DCR', link: 'https://solardcrportal.nise.res.in/Account/Login', description: 'Solar DCR Portal Login' },
    { name: 'SOLAR RTS STATUS', link: 'https://css.mahadiscom.in/UI/ROOFTOP/Solar_RTS.aspx', description: 'Check Solar RTS Application Status' }
];

export default function ExternalLinks() {
    return (
        <Content style={{ padding: '24px', minHeight: '100vh' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>External Portal Links</Title>
                <Text type="secondary">Quick access to important external solar and utility portals</Text>
            </div>
            
            <Row gutter={[24, 24]}>
                {EXTERNAL_LINKS.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <Card
                                hoverable
                                style={{ 
                                    height: '100%', 
                                    borderRadius: '12px',
                                    border: '1px solid #e8e8e8',
                                    transition: 'all 0.3s'
                                }}
                                bodyStyle={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    justifyContent: 'space-between',
                                    height: '100%',
                                    padding: '24px'
                                }}
                            >
                                <div>
                                    <div style={{ 
                                        width: '48px', 
                                        height: '48px', 
                                        borderRadius: '10px', 
                                        background: '#e6f7ff', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <LinkOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                    </div>
                                    <Title level={4} style={{ margin: '0 0 8px 0' }}>{item.name}</Title>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>{item.description}</Text>
                                </div>
                                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                    <Text strong style={{ color: '#1890ff' }}>
                                        Open Portal <ExportOutlined style={{ marginLeft: '4px' }} />
                                    </Text>
                                </div>
                            </Card>
                        </a>
                    </Col>
                ))}
            </Row>
        </Content>
    );
}
