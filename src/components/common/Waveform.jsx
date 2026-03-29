import { useEffect, useRef } from "react";

export default function Waveform({ current, status }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const dataRef = useRef(Array(200).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    const draw = () => {
      const noise = status === "critical" ? 0.4 : status === "warning" ? 0.15 : 0.04;
      const newVal = current + (Math.random() - 0.5) * noise;
      dataRef.current.push(newVal);
      if (dataRef.current.length > W) dataRef.current.shift();

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#020508";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(30,40,64,0.8)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < W; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
      }
      for (let j = 0; j < H; j += 20) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke();
      }

      // Waveform
      const max = 2.5, color = status === "critical" ? "#ff2244" : status === "warning" ? "#ff6b00" : "#00d4ff";
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;

      dataRef.current.forEach((v, i) => {
        const x = i;
        const y = H - (v / max) * H * 0.8 - H * 0.05;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Current label
      ctx.fillStyle = color;
      ctx.font = "bold 11px 'Share Tech Mono'";
      ctx.fillText(`${newVal.toFixed(3)}A`, W - 70, 16);

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [current, status]);

  return <canvas ref={canvasRef} width={500} height={80} style={{ width: "100%", height: "80px", display: "block" }} />;
}