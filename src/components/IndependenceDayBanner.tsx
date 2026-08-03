import { Flag } from 'lucide-react';

export const IndependenceDayBanner = () => {
  const isAugust = new Date().getMonth() === 7; // August

  if (!isAugust) return null;

  return (
    <div className="relative overflow-hidden bg-red-600 text-white rounded-xl p-6 shadow-md mb-8 flex items-center justify-between">
      <div className="relative z-10">
        <h2 className="text-xl font-extrabold tracking-tight">Dirgahayu Republik Indonesia</h2>
        <p className="text-red-50 font-medium mt-1">Mari mengenang semangat perjuangan pahlawan bangsa.</p>
      </div>
      <Flag className="w-16 h-16 text-red-200 opacity-30" />
    </div>
  );
};
