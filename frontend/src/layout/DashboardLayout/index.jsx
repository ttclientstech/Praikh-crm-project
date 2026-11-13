import '@/style/DashboardRedesign.css';

export default function DashboardLayout({ children }) {
  return (
    <div
      className="dashboard-layout-wrapper"
      style={{
        marginLeft: 0,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}