import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { router } from './app/router';
import { AuthProvider } from './features/auth/AuthContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="top-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: '#141414',
              border: '1px solid #282828',
              color: '#F5F5F5',
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              fontSize: '13px',
            }
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
