const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors()); app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
const orders = [];
const MATERIALS = {
  'Birch 1/4"': { rate:0.0171,cnc:1.0,grade:'A/B Sanded',color:'#9E6028',stack:2 },
  'Birch 1/2"': { rate:0.0265,cnc:1.1,grade:'A/B Sanded',color:'#9E6028',stack:1 },
  'Birch 3/4"': { rate:0.0342,cnc:1.25,grade:'A/B Sanded',color:'#9E6028',stack:1 },
  'MDF 1/2"': { rate:0.0148,cnc:0.85,grade:'Smooth B/S',color:'#6A625A',stack:1 },
  'Baltic Birch 3/4"': { rate:0.0418,cnc:1.2,grade:'B/BB 13-ply',color:'#B8904A',stack:1 }
};
const CNC_RATE = 2;
const MACHINE_IPM = 90;

function calcPrice(mat, sqin, mins) {
  const m = MATERIALS[mat];
  if (!m) return null;
  const mc = sqin * m.rate;
  const cc = (mins / 60) * CNC_RATE * m.cnc;
  const cost = mc + cc + 0.15;
  const price = cost / 0.8;
  return { material_cost: mc.toFixed(2), cnc_cost: cc.toFixed(2), margin: (price - cost).toFixed(2), price: price.toFixed(2) };
}

const SYSTEM = `You are the SmartBuild AI for BoroWood CNC shop Statesboro GA. Design wood pieces for customers.

MATERIALS (only these 5):
- Birch 1/4" | $0.0171/sqin | cnc_mult 1.0 | A/B Sanded | STACKABLE: cut 2 sheets at once
- Birch 1/2" | $0.0265/sqin | cnc_mult 1.1 | A/B Sanded | no stacking
- Birch 3/4" | $0.0342/sqin | cnc_mult 1.25 | A/B Sanded | no stacking
- MDF 1/2" | $0.0148/sqin | cnc_mult 0.85 | Smooth B/S | no stacking
- Baltic Birch 3/4" | $0.0418/sqin | cnc_mult 1.2 | B/BB 13-ply | no stacking

CNC MACHINE: runs at 90 IPM (inches per minute).
CNC RATE: $2/hour.

STACKING RULE:
- Birch 1/4" ONLY: stack 2 sheets at a time. So for N pieces, you only need ceil(N/2) passes.
- All other materials: 1 sheet per pass, N pieces = N passes.

CUT TIME FORMULA:
1. Calculate passes = ceil(quantity / stack_factor) [1/4" birch: stack=2, others: stack=1]
2. Estimate cut path per pass in inches (perimeter of one piece * 1.2 for tabs/entry)
3. cut_minutes = (cut_path_per_pass * passes) / 90
4. Round up to nearest 0.5 min
5. cut_time = human readable (e.g. "12 min", "1.5 hours")

Examples:
- 50 circles 12" dia, Birch 1/4": passes=ceil(50/2)=25, cut_path_per_pass=pi*12*1.2=45.2", total_cut=25*45.2=1131", cut_minutes=1131/90=12.6 min -> "13 min"
- 10 rectangles 24"x12", Birch 3/4": passes=10, cut_path_per_pass=2*(24+12)*1.2=86.4", total=864", cut_minutes=864/90=9.6 min -> "10 min"

PRICING FORMULA:
- material_cost = sqin * rate (total sqin for ALL pieces)
- cnc_cost = (cut_minutes / 60) * 2 * cnc_mult
- cost = material_cost + cnc_cost + 0.15
- price = cost / 0.80
- Round to nearest cent

RESPONSE FORMAT:
One craftsman sentence, then:
<DESIGN>{"type":"...","name":"...","width":"...","depth_height":"...","thickness":"...","sqin":0,"cut_minutes":0,"cut_time":"...","material":"...","grade":"...","material_reason":"...","build_notes":"...","material_cost":"0.00","cnc_cost":"0.00","margin":"0.00","price":"0.00"}</DESIGN>

ALWAYS use properly quoted JSON keys.`;

app.post('/api/design', async (req, res) => {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) return res.status(500).json({ error: 'No API key' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, system: SYSTEM, messages: req.body.history || req.body.messages })
    });
    const d = await r.json();
    if (d.error) return res.status(400).json({ error: d.error.message });
    res.json(d);
  } catch (e) { res.status(500).json({ error: 'Claude failed' }); }
});

app.post('/api/price', (req, res) => {
  const p = calcPrice(req.body.material, req.body.sqin, req.body.cut_minutes);
  p ? res.json(p) : res.status(400).json({ error: 'Bad material' });
});

app.post('/api/orders', (req, res) => {
  const o = { id: 'SB-' + String(Math.floor(10000 + Math.random() * 90000)), timestamp: new Date().toISOString(), status: 'in_production', ready_at: new Date(Date.now() + 3600000).toISOString(), ...req.body };
  orders.push(o);
  console.log('[ORDER]', o.id);
  res.json({ success: true, order: o });
});

app.get('/api/orders', (req, res) => res.json(orders.slice().reverse()));
app.patch('/api/orders/:id', (req, res) => {
  const o = orders.find(x => x.id === req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  Object.assign(o, req.body);
  res.json(o);
});
app.get('/api/materials', (req, res) => res.json(MATERIALS));
app.get('/api/health', (req, res) => res.json({ status: 'ok', node: 'NODE-001', location: 'Statesboro GA', machine_ipm: MACHINE_IPM, cnc_rate: CNC_RATE, stacking: '1/4in birch=2 sheets', uptime: process.uptime() }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('BoroWood SmartBuild Node 001 on port', PORT));
