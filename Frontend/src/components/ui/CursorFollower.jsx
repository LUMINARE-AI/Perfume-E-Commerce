import { useEffect, useRef } from "react";

export default function CursorFollower() {
  const followerRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("mousemove", onMouseMove);

    const animate = () => {
      // smooth follow (lerp)
      pos.current.x += (mouse.current.x - pos.current.x) * 0.12;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.12;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${
          pos.current.x - 10
        }px, ${pos.current.y - 10}px, 0)`;
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div
      ref={followerRef}
      className="cursor-follower fixed top-0 left-0 w-5 h-5 rounded-full pointer-events-none z-9999
           border border-yellow-400 mix-blend-difference"
    />
  );
}
