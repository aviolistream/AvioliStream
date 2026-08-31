'use client';

export default function PosterCard({ content }) {
  return (
    <a
      href={`/watch/${content.id}`}
      className="group relative flex-shrink-0 w-[160px] md:w-[190px] rounded-md overflow-hidden bg-surface transition-transform duration-200 hover:scale-[1.04] hover:z-10"
    >
      <div className="aspect-[2/3] w-full bg-surfaceLight relative overflow-hidden">
        {content.posterUrl ? (
          <img
            src={content.posterUrl}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-3 text-center">
            <span className="font-display uppercase tracking-wide text-lg text-muted">{content.title}</span>
          </div>
        )}
      </div>
      <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 left-0 right-0 bg-gradient-to-t from-night via-night/90 to-transparent pt-8">
        <p className="text-sm font-medium truncate">{content.title}</p>
        {content.releaseYear && (
          <p className="text-xs text-muted">{content.releaseYear}</p>
        )}
      </div>
    </a>
  );
}
