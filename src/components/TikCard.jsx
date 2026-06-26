export default function TikCard({ tik, onView }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
        {tik.image ? (
          <img src={tik.image} alt={tik.area} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-xs font-bold text-center p-1"
            style={{ backgroundColor: '#E07B22' }}
          >
            este TIK
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{tik.area}</p>
        <p className="text-gray-500 text-xs truncate">{tik.description}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          <span className="inline-block w-3 h-3 mr-1">📍</span>
          {tik.date}, {tik.time} · {tik.location}
        </p>
      </div>

      <button
        onClick={() => onView && onView(tik)}
        className="flex-shrink-0 btn-orange text-xs px-4 py-2"
      >
        Visualizar o tik
      </button>
    </div>
  )
}
