import { Outlet, useLocation } from 'react-router-dom';
import Chat from '../Chat';
import Header from "../Header";

export default function MainLayout() {
  const location = useLocation();
  const showChat = location.pathname.includes('trivia-lobby') || location.pathname.includes('trivia-game');

  return (
    <div className="min-h-screen flex flex-col bg-palette-brown">
      <Header />
      <div 
        className="container mx-auto grow bg-palette-brown flex flex-col text-white px-4 md:px-6" 
        style={{ minHeight: 'calc(99vh - 64px)' }}
      >
        <div className="flex-grow flex flex-col lg:flex-row">
          <div className={`flex-grow ${showChat ? 'lg:w-1/2' : 'w-full'} ${showChat ? 'mb-6 lg:mb-0' : ''}`}>
            <Outlet />
          </div>
          {showChat && (
            <div className="w-full lg:w-1/2 lg:pl-8 xl:pl-20">
              <div className="border border-white max-w-lg mx-auto lg:mx-8 mt-4 lg:mt-14 mb-2">
                <Chat />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}