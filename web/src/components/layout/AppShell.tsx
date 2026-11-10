import * as React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { EventDialog } from '../../features/events/EventDialog';
import { initSocket, disconnectSocket } from '../../lib/socket';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventDialogOpen, setEventDialogOpen] = React.useState(false);

  React.useEffect(() => {
    initSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar onNewEvent={() => setEventDialogOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
          <div className="mx-auto max-w-7xl w-full">{children}</div>
        </main>

        {/* Mobile Navigation */}
        <BottomNav onNewEvent={() => setEventDialogOpen(true)} />
      </div>

      {/* Modal Event Dialog */}
      <EventDialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)} />
    </div>
  );
};
