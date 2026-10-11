import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DashboardRouter from '../features/dashboard/DashboardRouter';
import MembersList from '../features/members/MembersList';
import MemberProfile from '../features/members/MemberProfile';
import MembershipPlans from '../features/memberships/MembershipPlans';
import CoachesList from '../features/coaches/CoachesList';
import FacilitiesList from '../features/facilities/FacilitiesList';
import BookingsPage from '../features/bookings/BookingsPage';
import PaymentsPage from '../features/payments/PaymentsPage';
import AttendancePage from '../features/attendance/AttendancePage';
import EquipmentInventory from '../features/equipment/EquipmentInventory';
import TournamentsPage from '../features/tournaments/TournamentsPage';
import PerformancePage from '../features/performance/PerformancePage';
import NotificationsPage from '../features/notifications/NotificationsPage';
import ReportsPage from '../features/reports/ReportsPage';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import ResetPassword from '../features/auth/ResetPassword';
import UpdatePassword from '../features/auth/UpdatePassword';
import Unauthorized from '../features/auth/Unauthorized';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardRouter /> },
          { 
            path: 'members', 
            element: <ProtectedRoute allowedRoles={['admin', 'coach']} />,
            children: [
              { index: true, element: <MembersList /> },
              { path: ':id', element: <MemberProfile /> }
            ]
          },
          { 
            path: 'memberships', 
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: [{ index: true, element: <MembershipPlans /> }]
          },
          { 
            path: 'coaches', 
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: [{ index: true, element: <CoachesList /> }]
          },
          { 
            path: 'facilities', 
            element: <ProtectedRoute allowedRoles={['admin', 'coach']} />,
            children: [{ index: true, element: <FacilitiesList /> }]
          },
          { 
            path: 'bookings', 
            element: <ProtectedRoute allowedRoles={['admin', 'coach', 'member']} />,
            children: [{ index: true, element: <BookingsPage /> }]
          },
          { path: 'payments', element: <PaymentsPage /> },
          { path: 'attendance', element: <AttendancePage /> },
          { path: 'equipment', element: <EquipmentInventory /> },
          { path: 'tournaments', element: <TournamentsPage /> },
          { path: 'performance', element: <PerformancePage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { 
            path: 'reports', 
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: [{ index: true, element: <ReportsPage /> }]
          },
        ]
      }
    ]
  },
  { path: '/auth/login', element: <Login /> },
  { path: '/auth/register', element: <Register /> },
  { path: '/auth/reset', element: <ResetPassword /> },
  { path: '/auth/update-password', element: <UpdatePassword /> },
  { path: '/unauthorized', element: <Unauthorized /> }
], {
  basename: import.meta.env.BASE_URL
});
