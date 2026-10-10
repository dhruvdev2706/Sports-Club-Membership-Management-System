import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = ['auth', 'dashboard', 'members', 'memberships', 'coaches', 'facilities', 'bookings', 'payments', 'attendance', 'equipment', 'tournaments', 'performance', 'notifications', 'reports'];
const components = {
  auth: ['Login', 'Register', 'Unauthorized'],
  dashboard: ['AdminDashboard', 'CoachDashboard', 'MemberDashboard'],
  members: ['MembersList', 'MemberProfile'],
  memberships: ['MembershipPlans'],
  coaches: ['CoachesList'],
  facilities: ['FacilitiesList'],
  bookings: ['BookingsPage'],
  payments: ['PaymentsPage'],
  attendance: ['AttendancePage'],
  equipment: ['EquipmentInventory'],
  tournaments: ['TournamentsPage'],
  performance: ['PerformancePage'],
  notifications: ['NotificationsPage'],
  reports: ['ReportsPage']
};

dirs.forEach(d => {
  const dir = path.join(__dirname, 'src', 'features', d);
  fs.mkdirSync(dir, { recursive: true });
  if (components[d]) {
    components[d].forEach(c => {
      fs.writeFileSync(path.join(dir, c + '.tsx'), `export default function ${c}() {\n  return (\n    <div className="p-6">\n      <h1 className="text-2xl font-bold">${c}</h1>\n      <p>Placeholder for ${c}</p>\n    </div>\n  );\n}\n`);
    });
  }
});

fs.mkdirSync(path.join(__dirname, 'src', 'components', 'layout'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'src', 'components', 'ui'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'src', 'app'), { recursive: true });
console.log('Pages generated!');
