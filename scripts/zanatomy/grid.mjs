// 균일 격자 최근접점
export class Grid {
  constructor(points, cell) { this.cell = cell; this.map = new Map(); this.points = points; points.forEach((p, i) => { const k = this.key(p); (this.map.get(k) ?? this.map.set(k, []).get(k)).push(i); }); }
  key(p) { return `${Math.floor(p.x / this.cell)},${Math.floor(p.y / this.cell)},${Math.floor(p.z / this.cell)}`; }
  nearest(p, maxRing = 6) {
    const cx = Math.floor(p.x / this.cell), cy = Math.floor(p.y / this.cell), cz = Math.floor(p.z / this.cell);
    let best = null, bd = Infinity;
    for (let r = 0; r <= maxRing; r++) {
      for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) for (let z = cz - r; z <= cz + r; z++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy), Math.abs(z - cz)) !== r) continue;
        for (const i of this.map.get(`${x},${y},${z}`) ?? []) { const d = this.points[i].distanceToSquared(p); if (d < bd) { bd = d; best = this.points[i]; } }
      }
      if (best && Math.sqrt(bd) < r * this.cell) break;
    }
    return { point: best, dist: Math.sqrt(bd) };
  }
}

