const fs = require('fs');

function patchFile(p) {
    let content = fs.readFileSync(p, 'utf8');

    // Fix nextDate.format() to nextDate.toISOString()
    content = content.replace(/nextDate\.format\(\)/g, "nextDate.toISOString()");

    // Add rendering of Next Follow Up Date in renderHistory
    const targetRenderHistory = `<span style={{ fontWeight: '600', fontSize: '12px', color: '#64748B' }}>
                                {dayjs(item.date).format('DD MMM YYYY, hh:mm A')}
                            </span>
                        </div>`;
    
    // In DashboardModule/index.jsx, it might have fewer spaces.
    // Let's use regex to find the closing div of that header
    content = content.replace(
        /<span style=\{\{ fontWeight: '600', fontSize: '12px', color: '#64748B' \}\}>\s*\{dayjs\(item\.date\)\.format\('DD MMM YYYY, hh:mm A'\)\}\s*<\/span>\s*<\/div>/g,
        `<span style={{ fontWeight: '600', fontSize: '12px', color: '#64748B' }}>
                {dayjs(item.date).format('DD MMM YYYY, hh:mm A')}
              </span>
              {item.nextFollowUpDate && (
                <span style={{ fontWeight: '600', fontSize: '12px', color: '#EF4444' }}>
                  Next Follow Up: {dayjs(item.nextFollowUpDate).format('DD MMM YYYY')}
                </span>
              )}
            </div>`
    );

    fs.writeFileSync(p, content);
}

patchFile('src/modules/DashboardModule/index.jsx');
patchFile('src/pages/SolarProject/SolarProjectsPage.jsx');
console.log('Patched correctly');
