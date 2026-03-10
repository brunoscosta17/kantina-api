const fs = require('fs');
const file = 'c:/projects/Kantina/kantina-api/insomnia-kantina-api-railway.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Delete existing Reports group if accidentally added before
data.resources = data.resources.filter(r => r.name !== 'Reports' || r._type !== 'request_group');

// Add Reports Request Group
const reportsGroup = {
  "_id": "fld_reports",
  "_type": "request_group",
  "parentId": "wrk_kantina_api_railway",
  "name": "Reports",
  "environment": {},
  "metaSortKey": 8
};

const dailySummaryReq = {
  "_id": "req_daily_summary",
  "_type": "request",
  "parentId": "fld_reports",
  "name": "Daily Summary",
  "method": "GET",
  "url": "{{ _.base_url }}/reports/daily-summary",
  "body": {},
  "parameters": [],
  "headers": [
    { "name": "x-tenant", "value": "{{ _.tenantId }}" }
  ],
  "authentication": {
    "type": "bearer",
    "token": "{{ _.access_token }}"
  }
};

data.resources.push(reportsGroup, dailySummaryReq);

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Insomnia JSON updated.');
