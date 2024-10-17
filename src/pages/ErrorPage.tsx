import Header from "@/components/Header";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-palette-brown">
      <Header />
      <div className="grow bg-palette-brown flex flex-col text-white justify-center items-center">
        <h1 className="text-xl font-bold">Something Went Wrong!</h1>
      </div>
    </div>
  );
}
