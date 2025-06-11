import { Outlet } from 'react-router-dom';
import Header from "../Header";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-palette-brown">
      <Header />
      <div
        className="container mx-auto grow bg-palette-brown flex flex-col text-white px-4 md:px-6"
        style={{ minHeight: 'calc(99vh - 64px)' }}
      >
        <div className="flex-grow flex flex-col">
          <div className="flex-grow w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}