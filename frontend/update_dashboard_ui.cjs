const fs = require('fs');

const path = 'src/modules/DashboardModule/index.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add follow up card
const widgetHtmlOld = `{/* Widget - Pending Projects */}
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
      </div>`;

const widgetHtmlNew = `{/* Widget - Pending Projects */}
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

        {/* Widget - Today Follow Up */}
        <div
          className="widget-card"
          onClick={handleFollowUpClick}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="widget-label">
            Today Follow Up
            <ClockCircleOutlined className="widget-icon-small" style={{ color: '#EF4444' }} />
          </div>
          <div className="widget-number">{stats.todayFollowUpCount || 0}</div>
        </div>
      </div>`;

content = content.replace(widgetHtmlOld, widgetHtmlNew);

// 2. Add follow up modal state and logic
const modalStateOld = `/* Pending Projects Modal State */`;
const modalStateNew = `/* Today Follow Up Modal State */
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState([]);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  const handleFollowUpClick = async () => {
    setIsFollowUpModalOpen(true);
    setIsFollowUpLoading(true);

    const options = { items: 1000 };
    if (filters.state) options.state = filters.state;
    if (filters.city) options.city = filters.city;

    try {
      const response = await request.list({ entity: 'solarProject', options });
      if (response && response.success) {
        const result = response.result;
        const items = Array.isArray(result) ? result : (result && result.items ? result.items : []);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        
        const filteredItems = items.filter(item => 
          item.status !== 'Completed' && 
          item.nextFollowUpDate && 
          new Date(item.nextFollowUpDate) <= endOfDay
        );
        setFollowUpData(filteredItems);
      }
    } catch (error) {
      console.log("Error fetching follow up projects:", error);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  /* Pending Projects Modal State */`;

content = content.replace(modalStateOld, modalStateNew);

// 3. Add follow up modal JSX
const modalJsxOld = `      <Modal
        title="Pending Projects"`;
const modalJsxNew = `      <Modal
        title="Today Follow Up"
        open={isFollowUpModalOpen}
        onCancel={() => setIsFollowUpModalOpen(false)}
        footer={null}
        width={1000}
        centered
        destroyOnClose
      >
        <div className="table-responsive">
          <Table
            columns={projectListColumns}
            dataSource={followUpData}
            loading={isFollowUpLoading}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      </Modal>

      <Modal
        title="Pending Projects"`;

content = content.replace(modalJsxOld, modalJsxNew);

// 4. Update re-fetch logic
const refetchOld = `if (isProjectsModalOpen) handleTotalProjectsClick();
    if (isRevenueModalOpen) handleRevenueClick();`;
const refetchNew = `if (isProjectsModalOpen) handleTotalProjectsClick();
    if (isRevenueModalOpen) handleRevenueClick();
    if (isFollowUpModalOpen) handleFollowUpClick();`;

content = content.replace(refetchOld, refetchNew);

fs.writeFileSync(path, content);
console.log('SUCCESS Dashboard UI');
