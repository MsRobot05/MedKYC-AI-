export default function Dashboard() {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Blood group</p>
          <p className="text-2xl font-semibold">--</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Allergies logged</p>
          <p className="text-2xl font-semibold">--</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Past visits</p>
          <p className="text-2xl font-semibold">--</p>
        </div>
      </div>
    </div>
  );
}