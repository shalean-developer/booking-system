export function HomeClientLogos() {
  const clients = [
    { name: "Oliver", color: "text-purple-600" },
    { name: "Travelers", color: "text-red-600" },
    { name: "waves", color: "text-green-600" },
    { name: "goldlines", color: "text-orange-600" },
    { name: "RotaShow", color: "text-purple-600" },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {clients.map((client, index) => (
            <div
              key={index}
              className={`text-2xl sm:text-3xl font-bold ${client.color} opacity-60 hover:opacity-100 transition-opacity`}
            >
              {client.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

