import { Row, Col, Card, Typography, Statistic, Button, Divider, Tag, Space, Descriptions } from 'antd';
import {
  ThunderboltOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  BuildOutlined,
  ExperimentOutlined,
  BankOutlined,
  RocketOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const About = () => {
  return (
    <div style={{ padding: '40px', background: '#f0f2f5', minHeight: '100vh' }}>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <Title level={1} style={{ color: '#1890ff', marginBottom: '10px' }}>Parikh Renewable</Title>
        <Title level={3} style={{ fontWeight: 'normal', marginTop: '0', color: '#595959' }}>
          Empowering a Sustainable Future with Solar Energy
        </Title>
        <Paragraph style={{ fontSize: '18px', maxWidth: '800px', margin: '20px auto', color: '#8c8c8c' }}>
          Established in 2024, Parikh Renewable is a premier provider of end-to-end Solar EPC services.
          We are dedicated to accelerating India's energy transition through reliable clean energy solutions
          for industrial, commercial, and residential clients.
        </Paragraph>
        <Button type="primary" size="large" icon={<RocketOutlined />} shape="round" style={{ height: '50px', padding: '0 40px', fontSize: '18px' }}>
          Explore Our Solutions
        </Button>
      </div>

      {/* Impact Stats */}
      <Row gutter={[24, 24]} justify="center" style={{ marginBottom: '60px' }}>
        <Col xs={24} sm={8} md={6}>
          <Card bordered={false} className="shadow" style={{ textAlign: 'center', height: '100%' }}>
            <ThunderboltOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '20px' }} />
            <Statistic title="Installed Capacity" value="1.2 GW" valueStyle={{ color: '#000', fontWeight: 'bold' }} />
            <Text type="secondary">Solar Generation Installed</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card bordered={false} className="shadow" style={{ textAlign: 'center', height: '100%' }}>
            <EnvironmentOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '20px' }} />
            <Statistic title="Carbon Offset" value="850k" suffix="Tons" valueStyle={{ color: '#000', fontWeight: 'bold' }} />
            <Text type="secondary">CO₂ Emissions Avoided</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card bordered={false} className="shadow" style={{ textAlign: 'center', height: '100%' }}>
            <TeamOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '20px' }} />
            <Statistic title="Clients Served" value={500} suffix="+" valueStyle={{ color: '#000', fontWeight: 'bold' }} />
            <Text type="secondary">Industrial & Commercial Partners</Text>
          </Card>
        </Col>
      </Row>

      {/* Corporate Profile Snapshot */}
      <Divider orientation="left"><span style={{ fontSize: '24px', color: '#262626' }}>Company Profile</span></Divider>
      <Card bordered={false} className="shadow" style={{ marginBottom: '60px' }}>
        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
          <Descriptions.Item label="Company Name">Parikh Renewable</Descriptions.Item>
          <Descriptions.Item label="Founded Year">2024</Descriptions.Item>
          <Descriptions.Item label="Headquarters">Sambhaji Nagar (Aurangabad), India</Descriptions.Item>
          <Descriptions.Item label="Industry">Solar EPC & Clean Energy</Descriptions.Item>
          <Descriptions.Item label="Core Services">EPC, O&M, Consulting, Material Supply</Descriptions.Item>
          <Descriptions.Item label="Target Markets">Industrial, Commercial, Residential</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Solutions & Services */}
      <Divider orientation="left"><span style={{ fontSize: '24px', color: '#262626' }}>Our Expertise</span></Divider>
      <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
        <Col xs={24} md={12} lg={6}>
          <Card
            title={<><BuildOutlined /> Turnkey EPC</>}
            bordered={false}
            className="shadow"
            style={{ height: '100%' }}
            headStyle={{ color: '#1890ff', fontSize: '18px' }}
          >
            <Paragraph>
              Complete project lifecycle management from design and engineering to procurement, installation, and final commissioning.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card
            title={<><ToolOutlined /> O & M Services</>}
            bordered={false}
            className="shadow"
            style={{ height: '100%' }}
            headStyle={{ color: '#1890ff', fontSize: '18px' }}
          >
            <Paragraph>
              Ensuring peak performance with preventive maintenance, remote monitoring, panel cleaning, and breakdown repairs.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card
            title={<><ExperimentOutlined /> Consulting</>}
            bordered={false}
            className="shadow"
            style={{ height: '100%' }}
            headStyle={{ color: '#1890ff', fontSize: '18px' }}
          >
            <Paragraph>
              Expert feasibility studies, regulatory support, and approvals guidance to navigate compliance and reduce project delays.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card
            title={<><SafetyCertificateOutlined /> Manufacturing</>}
            bordered={false}
            className="shadow"
            style={{ height: '100%' }}
            headStyle={{ color: '#1890ff', fontSize: '18px' }}
          >
            <Paragraph>
              Production of high-quality Solar BOS components, including robust mounting structures for long-lasting stability.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* Offerings Section */}
      <Row gutter={[48, 24]} align="middle" style={{ marginBottom: '60px', background: '#fff', padding: '40px', borderRadius: '8px' }} className="shadow">
        <Col xs={24} md={10}>
          <Title level={2}>What We Offer</Title>
          <Paragraph style={{ fontSize: '16px' }}>
            We provide tailored solar solutions to meet diverse energy needs, from large-scale industrial plants to rural electrification.
          </Paragraph>
        </Col>
        <Col xs={24} md={14}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card type="inner" title="On-Grid Solar Systems">
              Grid-connected systems optimized for commercial & industrial power consumption reduction.
            </Card>
            <Card type="inner" title="Off-Grid Solar Systems">
              Standalone sustainable power solutions perfect for remote locations with unreliable grid access.
            </Card>
            <Card type="inner" title="Solar Water Pumps">
              Reliable irrigation and water supply solutions for agricultural and rural development.
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Clients Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={2} style={{ marginBottom: '30px' }}>Trusted By Industry Leaders</Title>
        <Paragraph type="secondary" style={{ marginBottom: '40px' }}>
          We are proud to serve some of India's most reputed enterprises.
        </Paragraph>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
          {['Tata Motors', 'Bajaj', 'Siemens', 'L&T', 'Godrej', 'Mahindra', 'Reliance', 'Adani', 'Waaree', 'Eastman'].map(client => (
            <Tag key={client} color="blue" style={{ padding: '8px 20px', fontSize: '16px', borderRadius: '20px' }}>
              {client}
            </Tag>
          ))}
        </div>
      </div>

      {/* Footer / CTA */}
      <Divider />
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Title level={4}>Ready to switch to clean energy?</Title>
        <Space size="middle">
          <Button type="primary" size="large" icon={<BankOutlined />}>Contact Sales</Button>
          <Button size="large">View Projects</Button>
        </Space>
      </div>
    </div>
  );
};

export default About;
