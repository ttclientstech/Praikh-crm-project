const fs = require('fs');
const dashboardPath = 'src/pages/SolarProject/SolarProjectsPage.jsx';
let content = fs.readFileSync(dashboardPath, 'utf8');

// Use regex to match the exact tags to avoid whitespace issues
const regexLoan = /<Input\.TextArea\s*rows=\{3\}\s*placeholder="Add new loan remark..."\s*value=\{newRemark\}\s*onChange=\{\(e\) => setNewRemark\(e\.target\.value\)\}\s*\/>\s*<Button/;
const newLoan = `<Input.TextArea
                rows={3}
                placeholder="Add new loan remark..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <DatePicker 
                placeholder="Next Follow Up Date" 
                style={{ width: '100%', marginBottom: '10px' }} 
                value={nextDate}
                onChange={(date) => setNextDate(date)}
              />
              <Button`;

content = content.replace(regexLoan, newLoan);

const regexPersonal = /<Input\.TextArea\s*rows=\{3\}\s*placeholder="Add new personal remark..."\s*value=\{newRemark\}\s*onChange=\{\(e\) => setNewRemark\(e\.target\.value\)\}\s*\/>\s*<Button/;
const newPersonal = `<Input.TextArea
                rows={3}
                placeholder="Add new personal remark..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <DatePicker 
                placeholder="Next Follow Up Date" 
                style={{ width: '100%', marginBottom: '10px' }} 
                value={nextDate}
                onChange={(date) => setNextDate(date)}
              />
              <Button`;

content = content.replace(regexPersonal, newPersonal);

fs.writeFileSync(dashboardPath, content);
console.log('SUCCESS SolarProjectsPage TextAreas');
