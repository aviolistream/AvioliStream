import PosterCard from './PosterCard';

export default function ContentRow({ title, items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="font-display uppercase tracking-wide text-xl mb-3 px-8">{title}</h2>
      <div className="scroll-row flex gap-3 overflow-x-auto px-8 pb-2">
        {items.map((item) => (
          <PosterCard key={item.id} content={item} />
        ))}
      </div>
    </section>
  );
}
