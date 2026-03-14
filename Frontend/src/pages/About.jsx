import OudAlKhalid from "../assets/OudAlKhalid.png";
export default function About() {
  return (
    <main className="bg-black mt-10 min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-serif mb-6">
          About BinKhalid
        </h1>

        <p className="text-gray-300 leading-relaxed mb-6">
          BinKhalid is a luxury fragrance house inspired by the richness of
          oriental perfumery and modern craftsmanship. Our mission is to craft
          premium perfumes that define individuality, confidence, and timeless
          elegance.
        </p>

        <p className="text-gray-400 leading-relaxed mb-10">
          Each scent is curated using rare ingredients sourced from around the
          world, blended by expert perfumers to deliver long-lasting and
          distinctive fragrances for those who seek excellence in every detail.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <img
            src={OudAlKhalid}
            alt="Our Story"
            className="w-full h-80 object-cover border border-white/10"
          />
          <div>
            <h2 className="text-xl font-serif mb-4">
              Our Philosophy
            </h2>
            <p className="text-gray-300 leading-relaxed">
              We believe fragrance is a form of art — a silent language that
              expresses personality and mood. At BinKhalid, every bottle
              reflects dedication to quality, luxury, and authenticity.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
