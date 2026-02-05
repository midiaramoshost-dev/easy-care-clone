const stats = [
  { value: "500+", label: "Famílias Atendidas" },
  { value: "24/7", label: "Monitoramento" },
  { value: "98%", label: "Satisfação" },
  { value: "5★", label: "Avaliação" },
];

const StatsSection = () => {
  return (
    <section className="py-12 bg-white">
      <div className="container-custom mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
