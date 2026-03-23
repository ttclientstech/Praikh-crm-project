import { useEffect, useState, cloneElement } from 'react';
import { Row, Col, Button, Spin, Card, Select, Space, Typography, Tag, Progress, Modal, Table, Input, Form, message, Divider, Tabs } from 'antd';
import '@/style/DashboardRedesign.css'; // Ensure CSS is loaded
import { useMoney } from '@/settings';
import { request } from '@/request';
import useOnFetch from '@/hooks/useOnFetch';
import { useNavigate } from 'react-router-dom';
import {
  PlusOutlined,
  FilterOutlined,
  ClearOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  AppstoreOutlined,
  MessageOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getStateOptions, getCityOptions } from '@/utils/stateCityData';

const { Title, Text } = Typography;

const StatsCard = ({ title, value, icon, color, suffix = '', precision = 0, formatter }) => {
  return (
    <div className="stats-card-modern">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stats-title">{title}</div>
          <div className="stats-value">
            {formatter ? formatter(value) : value}{suffix && <span style={{ fontSize: '18px', fontWeight: '600', marginLeft: '4px', opacity: 0.7 }}>{suffix}</span>}
          </div>
        </div>
        <div className="stats-icon-wrapper" style={{ background: `${color}15`, color: color }}>
          {cloneElement(icon, { style: { fontSize: '22px' } })}
        </div>
      </div>
    </div>
  )
}

function RemarkModal({ visible, onCancel, record, entity, initialTab = 'loan', mode = 'add', onUpdateSuccess }) {
  const [newRemark, setNewRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!record) return null;

  const handleSave = async (type) => {
    if (!newRemark.trim()) return;
    setSubmitting(true);

    const historyField = type === 'Loan' ? 'loanRemarksHistory' : 'personalRemarksHistory';
    const currentHistory = record[historyField] || [];

    const updateData = {
      [historyField]: [...currentHistory, { comment: newRemark, date: new Date() }]
    };

    try {
      const response = await request.update({ entity, id: record._id, jsonData: updateData });
      if (response && response.success) {
        message.success(`${type} remark added successfully`);
        if (onUpdateSuccess) onUpdateSuccess();
        setNewRemark('');
      } else {
        message.error('Failed to add remark');
      }
    } catch (error) {
      message.error('Error adding remark');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHistory = (history) => (
    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px', padding: mode === 'history' ? '0' : '10px', background: mode === 'history' ? 'transparent' : '#F8FAFC', borderRadius: '8px' }}>
      {(!history || history.length === 0) ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>No history yet</p>
      ) : (
        (mode === 'history' ? history.slice().reverse() : [history[history.length - 1]]).map((item, index) => (
          <div key={index} style={{ marginBottom: mode === 'history' ? '16px' : '0', padding: mode === 'history' ? '12px' : '0', background: mode === 'history' ? '#F8FAFC' : 'transparent', borderRadius: '8px', border: mode === 'history' ? '1px solid #E2E8F0' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', fontSize: '12px', color: '#64748B' }}>
                {dayjs(item.date).format('DD MMM YYYY, hh:mm A')}
              </span>
            </div>
            <div style={{ color: '#1E293B', fontSize: '14px' }}>{item.comment}</div>
          </div>
        ))
      )}
    </div>
  );

  const tabItems = [
    {
      key: 'loan',
      label: 'Remarks on Loan',
      children: (
        <div>
          {renderHistory(record.loanRemarksHistory)}
          {mode === 'add' && (
            <>
              <Input.TextArea
                rows={3}
                placeholder="Add new loan remark..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
              />
              <Button
                type="primary"
                onClick={() => handleSave('Loan')}
                loading={submitting}
                style={{ marginTop: '10px', width: '100%' }}
              >
                Save Loan Remark
              </Button>
            </>
          )}
        </div>
      )
    },
    {
      key: 'personal',
      label: 'Remarks on Personal',
      children: (
        <div>
          {renderHistory(record.personalRemarksHistory)}
          {mode === 'add' && (
            <>
              <Input.TextArea
                rows={3}
                placeholder="Add new personal remark..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
              />
              <Button
                type="primary"
                onClick={() => handleSave('Personal')}
                loading={submitting}
                style={{ marginTop: '10px', width: '100%' }}
              >
                Save Personal Remark
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <Modal
      title={mode === 'add' ? `Add Remark: ${record.client}` : `Remark History: ${record.client}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
      centered
      destroyOnClose
    >
      <Tabs defaultActiveKey={initialTab} items={tabItems} onChange={() => setNewRemark('')} />
    </Modal>
  );
}

export default function DashboardModule() {
  const navigate = useNavigate();
  const { moneyFormatter } = useMoney();

  const [filters, setFilters] = useState({ state: null, city: null });
  const [cityOptions, setCityOptions] = useState([]);

  const { result, isLoading, isSuccess, onFetch } = useOnFetch();

  const fetchData = (currentFilters = filters) => {
    const options = {};
    if (currentFilters.state) options.state = currentFilters.state;
    if (currentFilters.city) options.city = currentFilters.city;

    return request.summary({
      entity: 'solarProject',
      options: options
    });
  };

  /* Custom Locations State */
  const [customLocations, setCustomLocations] = useState({ states: [], cities: {} });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationForm] = Form.useForm();
  const [locationType, setLocationType] = useState('state'); // 'state' or 'city'

  const fetchCustomLocations = async () => {
    try {
      const response = await request.get({ entity: 'commission/customLocations' });
      if (response && response.success) {
        setCustomLocations(response.result);
      }
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    onFetch(fetchData());
    fetchCustomLocations();
  }, []);

  const getMergedStateOptions = () => {
    const staticOpts = getStateOptions();
    const customOpts = (customLocations.states || []).map(s => ({ value: s, label: s }));
    // Remove duplicates if any
    const all = [...staticOpts, ...customOpts];
    const unique = all.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);

    return [...unique, { value: 'ADD_NEW_STATE', label: <span style={{ color: '#1890ff' }}><PlusOutlined /> Add New State</span> }];
  };

  const getMergedCityOptions = (state) => {
    if (!state || state === 'ADD_NEW_STATE') return [];
    const staticOpts = getCityOptions(state);
    const customOpts = (customLocations.cities && customLocations.cities[state] ? customLocations.cities[state] : []).map(c => ({ value: c, label: c }));

    // Remove duplicates if any
    const all = [...staticOpts, ...customOpts];
    const unique = all.filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);

    return [...unique, { value: 'ADD_NEW_CITY', label: <span style={{ color: '#1890ff' }}><PlusOutlined /> Add New City</span> }];
  };

  const handleStateChange = (value) => {
    if (value === 'ADD_NEW_STATE') {
      setLocationType('state');
      setIsLocationModalOpen(true);
      // Do not set filter yet
    } else {
      setFilters(prev => ({ ...prev, state: value, city: null }));
      // Update city options based on new merged logic
      // We don't need to manually setCityOptions state if we compute it on render or in a memo, 
      // but existing code uses a state `cityOptions`. Let's update it.
      // Actually, better to just rely on `getMergedCityOptions` during render or update the state here.
      // The existing code has `setCityOptions(getCityOptions(value))`.
      // Let's defer this update to a helper or just recalculate.
      // But `cityOptions` is used in the Select below.
      // Let's update `cityOptions` logic in `handleStateChange` to use the helper.
      // We need to access the helper, but helper uses `customLocations` state.
    }
  };

  // Helper moved inside or accessible
  // To avoid complexity, I will replace the handleStateChange fully below.

  /* Dashboard Stats State */
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    workCompletedPercentage: 0,
    pendingProjects: 0,
    totalReceivable: 0
  });

  useEffect(() => {
    if (isSuccess && result) {
      setStats(result);
    }
  }, [isSuccess, result]);

  const handleAddLocation = async (values) => {
    try {
      const body = { type: locationType, value: values.name };
      if (locationType === 'city') {
        body.parentState = filters.state;
      }

      const response = await request.post({ entity: 'commission/addCustomLocation', jsonData: body });
      if (response.success) {
        message.success(`${locationType === 'state' ? 'State' : 'City'} added successfully`);
        setCustomLocations(response.result); // Update local state
        setIsLocationModalOpen(false);
        locationForm.resetFields();

        // If added state, auto-select it? Maybe. User asked to be able to use it.
        // If added city, auto-select it?
        if (locationType === 'state') {
          setFilters(prev => ({ ...prev, state: values.name, city: null }));
        } else {
          setFilters(prev => ({ ...prev, city: values.name }));
        }
      } else {
        message.error('Failed to add location');
      }
    } catch (e) {
      message.error('Error adding location');
    }
  };



  // Effect to update city options when state or customLocations change
  useEffect(() => {
    if (filters.state && filters.state !== 'ADD_NEW_STATE') {
      const merged = getMergedCityOptions(filters.state);
      setCityOptions(merged);
    } else {
      setCityOptions([]);
    }
  }, [filters.state, customLocations]);

  const handleCityChange = (value) => {
    if (value === 'ADD_NEW_CITY') {
      setLocationType('city');
      setIsLocationModalOpen(true);
    } else {
      setFilters(prev => ({ ...prev, city: value }));
    }
  };

  const applyFilters = () => {
    onFetch(fetchData(filters));
  };

  const clearFilters = () => {
    setFilters({ state: null, city: null });
    setCityOptions([]);
    onFetch(fetchData({ state: null, city: null }));
  };


  /* Revenue Modal State */
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [revenueData, setRevenueData] = useState([]);
  const [isRevenueLoading, setIsRevenueLoading] = useState(false);

  const handleRevenueClick = async () => {
    setIsRevenueModalOpen(true);
    setIsRevenueLoading(true);

    const options = {
      items: 1000, // Fetch all for now
    };
    if (filters.state) options.state = filters.state;
    if (filters.city) options.city = filters.city;

    try {
      const response = await request.list({ entity: 'solarProject', options });
      if (response && response.success) {
        const result = response.result;
        // Handle both array (if simplified) or object with items (standard pagination)
        const items = Array.isArray(result) ? result : (result && result.items ? result.items : []);
        setRevenueData(items);
      }
    } catch (error) {
      console.log("Error fetching revenue details:", error);
    } finally {
      setIsRevenueLoading(false);
    }
  };

  /* Remark State & Handlers */
  const [isDashboardRemarkModalOpen, setIsDashboardRemarkModalOpen] = useState(false);
  const [remarkRecord, setRemarkRecord] = useState(null);
  const [remarkMode, setRemarkMode] = useState('add');

  const handleRemarkClick = (record, mode = 'add') => {
    setRemarkRecord(record);
    setRemarkMode(mode);
    setIsDashboardRemarkModalOpen(true);
  };

  const handleRemarkUpdateSuccess = async () => {
    // Re-fetch the current record to update the modal content
    try {
      const response = await request.read({ entity: 'solarProject', id: remarkRecord._id });
      if (response && response.success) {
        setRemarkRecord(response.result);
      }
    } catch (e) { console.log(e); }

    // Optionally refresh whatever lists are currently open
    if (isPendingModalOpen) handlePendingProjectsClick();
    if (isCompletedModalOpen) handleCompletedSitesClick();
    if (isProjectsModalOpen) handleTotalProjectsClick();
    if (isRevenueModalOpen) handleRevenueClick();
  };

  const revenueColumns = [
    {
      title: 'Project Name',
      dataIndex: 'client',
      key: 'client',
      render: (text) => <b>{text}</b>
    },
    {
      title: 'Contact',
      dataIndex: 'contactNumber',
      key: 'contactNumber',
    },
    {
      title: 'Total Cost',
      dataIndex: ['paymentDetails', 'totalProjectCost'],
      key: 'totalProjectCost',
      render: (val) => moneyFormatter({ amount: val || 0 })
    },
    {
      title: 'Received',
      key: 'received',
      render: (_, record) => {
        const pd = record.paymentDetails || {};
        const totalAdvances = pd.advancePayments?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const totalReceived = totalAdvances + (pd.loanCreditedAmount || 0);
        return <span style={{ color: '#10B981' }}>{moneyFormatter({ amount: totalReceived })}</span>;
      }
    },
    {
      title: 'Remaining',
      key: 'remaining',
      render: (_, record) => {
        const pd = record.paymentDetails || {};
        const totalAdvances = pd.advancePayments?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const totalReceived = totalAdvances + (pd.loanCreditedAmount || 0);
        const remaining = (pd.totalProjectCost || 0) - totalReceived;
        return <span style={{ color: '#EF4444', fontWeight: 'bold' }}>{moneyFormatter({ amount: remaining })}</span>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/solarProject/read/${record._id}`)}>
          View Detail
        </Button>
      )
    },
    {
      title: 'Remark',
      key: 'remark',
      align: 'center',
      render: (text, record) => (
        <Button
          type="text"
          icon={<MessageOutlined style={{ fontSize: '18px', color: '#6366F1' }} />}
          onClick={() => handleRemarkClick(record, 'add')}
        />
      )
    }
  ];

  /* Total Projects Modal State */
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [projectsData, setProjectsData] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  const handleTotalProjectsClick = async () => {
    setIsProjectsModalOpen(true);
    setIsProjectsLoading(true);

    const options = {
      items: 1000,
    };
    if (filters.state) options.state = filters.state;
    if (filters.city) options.city = filters.city;

    try {
      const response = await request.list({ entity: 'solarProject', options });
      if (response && response.success) {
        const result = response.result;
        const items = Array.isArray(result) ? result : (result && result.items ? result.items : []);
        setProjectsData(items);
      }
    } catch (error) {
      console.log("Error fetching project list:", error);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const projectListColumns = [
    {
      title: 'Project Name',
      dataIndex: 'client',
      key: 'client',
      render: (text) => <b>{text}</b>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : status === 'Completed' ? 'blue' : 'default'}>
          {status || 'Active'}
        </Tag>
      )
    },
    {
      title: 'City',
      dataIndex: 'villageCity',
      key: 'villageCity',
      render: (text) => text || '--'
    },
    {
      title: 'Total Cost',
      dataIndex: ['paymentDetails', 'totalProjectCost'],
      key: 'totalProjectCost',
      render: (val) => moneyFormatter({ amount: val || 0 })
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => navigate(`/solarProject/read/${record._id}`)}>
          View Detail
        </Button>
      )
    },
    {
      title: 'Remark',
      key: 'remark',
      align: 'center',
      render: (text, record) => (
        <Button
          type="text"
          icon={<MessageOutlined style={{ fontSize: '18px', color: '#6366F1' }} />}
          onClick={() => handleRemarkClick(record, 'add')}
        />
      )
    }
  ];

  /* Completed Sites Modal State */
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [completedData, setCompletedData] = useState([]);
  const [isCompletedLoading, setIsCompletedLoading] = useState(false);

  const handleCompletedSitesClick = async () => {
    setIsCompletedModalOpen(true);
    setIsCompletedLoading(true);

    const options = {
      items: 1000,
    };
    if (filters.state) options.state = filters.state;
    if (filters.city) options.city = filters.city;

    try {
      const response = await request.list({ entity: 'solarProject', options });
      if (response && response.success) {
        const result = response.result;
        const items = Array.isArray(result) ? result : (result && result.items ? result.items : []);

        // Filter for Completed Projects
        // Filter for Completed Projects
        const filteredItems = items.filter(item => item.status === 'Completed');

        setCompletedData(filteredItems);
      }
    } catch (error) {
      console.log("Error fetching completed projects:", error);
    } finally {
      setIsCompletedLoading(false);
    }
  };

  /* Pending Projects Modal State */
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);

  const handlePendingProjectsClick = async () => {
    setIsPendingModalOpen(true);
    setIsPendingLoading(true);

    const options = {
      items: 1000,
    };
    if (filters.state) options.state = filters.state;
    if (filters.city) options.city = filters.city;

    try {
      const response = await request.list({ entity: 'solarProject', options });
      if (response && response.success) {
        const result = response.result;
        const items = Array.isArray(result) ? result : (result && result.items ? result.items : []);

        // Filter for Pending Projects
        const filteredItems = items.filter(item => item.status === 'Active');

        setPendingData(filteredItems);
      }
    } catch (error) {
      console.log("Error fetching pending projects:", error);
    } finally {
      setIsPendingLoading(false);
    }
  };


  return (
    <div style={{ padding: '20px' }}>
      {/* Header section with filters */}
      <div className="dashboard-header-card">
        <div className="header-title-group">
          <div className="header-icon-box">
            <AppstoreOutlined />
          </div>
          <div className="header-title">
            <h3>Company Dashboard</h3>
            <p className="header-subtitle">Overview of all solar projects & status</p>
          </div>
        </div>

        <Space wrap size={16}>
          <Select
            placeholder="Select State"
            style={{ width: 180 }}
            value={filters.state}
            onChange={handleStateChange}
            options={getMergedStateOptions()}
            allowClear
            size="large"
            className="dashboard-filter-select"
            variant="borderless"
          />
          <Select
            placeholder="Select City"
            style={{ width: 180 }}
            value={filters.city}
            onChange={handleCityChange}
            options={cityOptions}
            disabled={!filters.state}
            allowClear
            size="large"
            className="dashboard-filter-select"
            variant="borderless"
          />
          <Button type="primary" size="large" icon={<FilterOutlined />} onClick={applyFilters} className="action-btn" ghost style={{ background: 'white', color: '#333', borderColor: '#E2E8F0' }}>
            Apply
          </Button>
          <Button size="large" icon={<ClearOutlined />} onClick={clearFilters} className="action-btn">
            Clear
          </Button>
          <Button type="primary" size="large" className="action-btn primary-cta" icon={<PlusOutlined />} onClick={() => navigate('/solarProject')}>
            New Project
          </Button>
        </Space>
      </div>

      {/* Main Dashboard Cards - Grid shows immediately for fast cached feel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Dark Navy Card - Total Receivable */}
        <div
          className="navy-card"
          style={{ gridRow: 'span 2', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
          onClick={handleRevenueClick}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="navy-card-title">
            <span>Total Receivable</span>
            <div className="navy-card-icon" style={{ fontSize: '24px', fontWeight: 'bold' }}>₹</div>
          </div>
          <div className="navy-card-value">{moneyFormatter({ amount: stats.totalReceivable })}</div>
          <div style={{ fontSize: '13px', opacity: 0.6, marginTop: 'auto' }}>
            Total Project Cost - Total Received
          </div>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255,255,255,0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'white'
          }}>Click for Details</div>
        </div>

        {/* Widget - Total Projects */}
        <div
          className="widget-card"
          onClick={handleTotalProjectsClick}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="widget-label">
            Total Projects
            <ProjectOutlined className="widget-icon-small" />
          </div>
          <div className="widget-number">{stats.totalProjects}</div>
        </div>

        {/* Widget - Completed Sites */}
        <div
          className="widget-card"
          onClick={handleCompletedSitesClick}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="widget-label">
            Completed Sites
            <CheckCircleOutlined className="widget-icon-small" style={{ color: '#10B981' }} />
          </div>
          <div className="widget-number">{stats.completedProjects}</div>
        </div>

        {/* Widget - Avg Work */}
        <div className="widget-card">
          <div className="widget-label">
            Avg. Work Completed
            <RiseOutlined className="widget-icon-small" style={{ color: '#722ED1' }} />
          </div>
          <div className="widget-number">
            {(Number(stats.workCompletedPercentage) || 0).toFixed(1)}%
          </div>
          <Progress
            percent={Number(stats.workCompletedPercentage) || 0}
            showInfo={false}
            strokeColor="#F59E0B"
            trailColor="#F1F5F9"
            size="small"
            style={{ marginTop: 10 }}
          />
        </div>

        {/* Widget - Pending */}
        <div
          className="widget-card"
          onClick={handlePendingProjectsClick}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="widget-label">
            Pending Projects
            <ClockCircleOutlined className="widget-icon-small" style={{ color: '#F59E0B' }} />
          </div>
          <div className="widget-number">{stats.pendingProjects}</div>
        </div>
      </div>

      {/* Modals placed within the page container */}
      <Modal
        title="Project Financial Details"
        open={isRevenueModalOpen}
        onCancel={() => setIsRevenueModalOpen(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setIsRevenueModalOpen(false)}>Close</Button>
        ]}
        centered
      >
        <div className="table-responsive">
          <Table
            columns={revenueColumns}
            dataSource={revenueData}
            loading={isRevenueLoading}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      </Modal>

      <Modal
        title="All Solar Projects"
        open={isProjectsModalOpen}
        onCancel={() => setIsProjectsModalOpen(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setIsProjectsModalOpen(false)}>Close</Button>
        ]}
        centered
      >
        <div className="table-responsive">
          <Table
            columns={projectListColumns}
            dataSource={projectsData}
            loading={isProjectsLoading}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      </Modal>

      <Modal
        title="Completed Solar Sites"
        open={isCompletedModalOpen}
        onCancel={() => setIsCompletedModalOpen(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setIsCompletedModalOpen(false)}>Close</Button>
        ]}
        centered
      >
        <div className="table-responsive">
          <Table
            columns={projectListColumns}
            dataSource={completedData}
            loading={isCompletedLoading}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      </Modal>

      <Modal
        title="Pending Solar Projects"
        open={isPendingModalOpen}
        onCancel={() => setIsPendingModalOpen(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setIsPendingModalOpen(false)}>Close</Button>
        ]}
        centered
      >
        <div className="table-responsive">
          <Table
            columns={projectListColumns}
            dataSource={pendingData}
            loading={isPendingLoading}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      </Modal>

      <Modal
        title={`Add New ${locationType === 'state' ? 'State' : 'City'}`}
        open={isLocationModalOpen}
        onCancel={() => setIsLocationModalOpen(false)}
        footer={null}
      >
        <Form form={locationForm} onFinish={handleAddLocation} layout="vertical">
          <Form.Item name="name" label={`${locationType === 'state' ? 'State' : 'City'} Name`} rules={[{ required: true }]}>
            <Input placeholder={`Enter ${locationType === 'state' ? 'State' : 'City'} Name`} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Add</Button>
          </Form.Item>
        </Form>
      </Modal>

      <RemarkModal
        visible={isDashboardRemarkModalOpen}
        onCancel={() => setIsDashboardRemarkModalOpen(false)}
        record={remarkRecord}
        entity="solarProject"
        mode={remarkMode}
        onUpdateSuccess={handleRemarkUpdateSuccess}
      />
    </div>
  );
}

