export function HomeFeaturedIn() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">As Featured In</h2>
          <p className="text-base sm:text-lg text-gray-600">
            Leading publications have recognized our commitment to excellence.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 opacity-60">
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400">CLEANING TIMES</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400">HOME MAGAZINE</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400">BUSINESS WEEKLY</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400">LOCAL NEWS</div>
          </div>
        </div>
      </div>
    </section>
  );
}
