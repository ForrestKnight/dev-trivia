import { Outlet, useLocation } from 'react-router-dom';
import Chat from '../Chat';
import Header from "../Header";

export default function MainLayout() {
  const location = useLocation();
  const showChat = location.pathname.includes('trivia-lobby') || location.pathname.includes('trivia-game');

  return (
    <div className="min-h-screen flex flex-col bg-palette-brown">
      <Header />
      <div className="container mx-auto grow bg-palette-brown flex flex-col text-white" style={{ minHeight: 'calc(99vh - 64px)' }}>
        <div className="flex-grow">
          <Outlet />
        </div>
        {showChat && (
          <div className="sm:mx-8 border border-white max-w-lg mb-2">
            <Chat />
          </div>
        )}
      </div>
    </div>
  );
}