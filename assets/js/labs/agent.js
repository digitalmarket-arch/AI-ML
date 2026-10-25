/* AI Marg lab: an AI agent loop, simulated.
   A scripted, fully predictable "LLM" (no real AI model runs) works on a goal in a loop: it writes a Thought, then
   either an Action (a tool call written as JSON) or a final Answer; the loop runs the tool and feeds back its
   Observation. The learner switches tools on and off, sets a human-approval limit for payments and a step limit,
   and can make the first tool call time out. Plain classic script (ES2019). Registers window.AILabs.agent.
   No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  /* ---------- constants and pretend data ---------- */
  var PRICE_PER_1K = 0.2;       // a made-up price: rupees per 1,000 tokens
  var RUNS_PER_DAY = 100000;    // 1 lakh runs a day, to show how small costs add up
  var PASSENGERS = 3;
  var FARE_CAP = 500;           // "under ₹500" a person
  var SEED = 2411;              // seeds the pretend tool reply times and the PNR
  var LIMIT = { min: 500, max: 5000, step: 250 };
  var STEPS = { min: 1, max: 10 };
  var DELAY = { slow: 1500, normal: 700, instant: 0 };
  var BILL = 2350, GST_RATE = 18;
  var RUNS = 87, BALLS = 54;
  var DEFAULTS = { goal: 'train', tools: { search_trains: true, calculator: true, get_weather: true, book_ticket: true }, guard: true, limit: 2000, maxSteps: 6, fail: false };
  var TOOL_ORDER = ['search_trains', 'calculator', 'get_weather', 'book_ticket'];
  var TOOLS = {
    search_trains: { desc: 'List trains between two cities on a date, with fares and seats left', args: { from: 'city', to: 'city', date: 'YYYY-MM-DD' }, help: 'finds trains, fares and seats (pretend data)' },
    calculator: { desc: 'Work out an arithmetic expression exactly', args: { expression: 'text, for example 12 * 7' }, help: 'does exact maths' },
    get_weather: { desc: 'Weather forecast for one city on one day', args: { city: 'city', date: 'YYYY-MM-DD' }, help: 'gives a pretend forecast' },
    book_ticket: { desc: 'Book train seats and pay for them', args: { train: 'name', date: 'YYYY-MM-DD', passengers: 'number', amount_inr: 'number' }, help: 'books seats and pays, so it changes the pretend world' }
  };
  var GOAL_ORDER = ['train', 'gst', 'cricket', 'weather'];
  var GOALS = {
    train: { label: 'Book a train: Pune to Mumbai', short: 'Train booking', text: 'Book the cheapest train from Pune to Mumbai tomorrow under ₹500 and tell me the total for 3 people.' },
    gst: { label: 'Maths: 18% GST on a bill', short: 'GST maths', text: 'What will 18% GST on a ₹2,350 bill be?', note: 'GST (Goods and Services Tax) is the tax added to most bills in India.' },
    cricket: { label: 'Maths: cricket run rate', short: 'Run rate maths', text: 'India need 87 runs from the last 54 balls. What run rate (runs per over) do they need?', note: 'In cricket, an over is 6 balls bowled one after another.' },
    weather: { label: 'Weather: umbrella or not?', short: 'Umbrella check', text: 'Should I carry an umbrella in Mumbai tomorrow?' }
  };
  // what search_trains returns (sorted by departure time, as a real search would be)
  var TRAINS = [
    { name: 'Indrayani Express', departs: '05:55', arrives: '09:10', fare: 455, seats_left: 41 },
    { name: 'Sinhagad Express', departs: '06:05', arrives: '09:55', fare: 385, seats_left: 0 },
    { name: 'Deccan Queen', departs: '07:15', arrives: '10:25', fare: 520, seats_left: 12 },
    { name: 'Pragati Express', departs: '07:50', arrives: '11:05', fare: 415, seats_left: 23 },
    { name: 'Intercity Express', departs: '17:55', arrives: '21:05', fare: 470, seats_left: 8 }
  ];
  var WEATHER = { city: 'Mumbai', rain_chance_percent: 70, summary: 'Thundershowers likely after 4 pm', max_temp_c: 32 };
  // the right choice, worked out from the data: cheapest train under the cap that still has seats for everyone
  var PICK = (function () {
    var under = TRAINS.filter(function (t) { return t.fare < FARE_CAP; }).sort(function (a, b) { return a.fare - b.fare; });
    var pick = under.filter(function (t) { return t.seats_left >= PASSENGERS; })[0];
    return { cheapest: under[0], pick: pick, total: pick.fare * PASSENGERS };
  })();
  // the scripted mental-maths slips (true values are always computed, never typed in)
  var GST_TRUE = BILL * GST_RATE / 100;              // 423
  var GST_TEN = BILL / 10;                           // 235
  var GST_EIGHT = BILL * 8 / 100;                    // 188
  var GST_EIGHT_SLIP = GST_EIGHT - 10;               // 178: a digit slip
  var GST_GUESS = GST_TEN + GST_EIGHT_SLIP;          // 413
  var OVERS = BALLS / 6;                             // 9
  var RR_TRUE = RUNS / OVERS;                        // 9.666...
  var RR_WHOLE = Math.floor(RUNS / OVERS);           // 9
  var RR_LEFT = RUNS - RR_WHOLE * OVERS;             // 6
  var RR_GUESS = RR_WHOLE + RR_LEFT / 100;           // 9.06: the remainder 6 written as .06

  var TASKS = [
    { id: 't1', text: 'Switch on “First tool call times out”, then run the train goal. Watch the agent retry the failed search and still book the ticket.' },
    { id: 't2', text: 'Switch off the calculator and run the GST or cricket goal. Catch the agent’s mental-maths mistake: the lab check puts its guess next to the true value.' },
    { id: 't3', text: 'Set Max steps too low (try 2) and run the train goal, so the loop stops the agent before it can finish.' },
    { id: 't4', text: 'Lower the approval limit to ₹1,000, run the train goal so the guardrail pauses the ' + inr(PICK.total) + ' payment, then approve it.' }
  ];
  var TASK_DONE_MSG = {
    t1: 'the agent retried and still booked the ticket.',
    t2: 'you caught a mental-maths mistake.',
    t3: 'the step limit stopped the agent.',
    t4: 'the guardrail paused a big payment and you approved it.'
  };
  var FLAGS = {
    retry: ['--series-4', 'Retry'],
    error: ['--bad', 'Tool error'],
    guess: ['--series-3', 'Guess, no tool'],
    approval: ['--haldi', 'Waited for approval'],
    rejected: ['--bad', 'Payment rejected']
  };
  // long JSON lines wrap at spaces instead of making the reader scroll sideways
  var PRE_STYLE = 'margin-top:4px;white-space:pre-wrap;overflow-wrap:break-word';
  var LLM_TEXT = { ready: 'ready', thinking: 'thinking…', waiting: 'waiting for tool', paused: 'paused for you', reading: 'reading reply', finished: 'finished', stopped: 'stopped' };

  /* ---------- small helpers ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // Indian digit grouping: 125000 -> 1,25,000
  function group(n) {
    var s = String(Math.round(Math.abs(n)));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return (n < 0 ? '-' : '') + s;
  }
  function inr(n) { return '₹' + group(n); }
  function inr2(n) {
    var paise = Math.round(n * 100), r = paise % 100;
    return '₹' + group(Math.floor(paise / 100)) + '.' + (r < 10 ? '0' : '') + r;
  }
  function tok(s) { return Math.ceil(s.length / 4); }   // about 4 letters of English per token
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function tomorrowISO() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function cloneCfg(c) {
    var t = {};
    TOOL_ORDER.forEach(function (k) { t[k] = !!c.tools[k]; });
    return { goal: c.goal, tools: t, guard: c.guard, limit: c.limit, maxSteps: c.maxSteps, fail: c.fail };
  }
  function inlineJSON(v) {
    if (Array.isArray(v)) return '[' + v.map(inlineJSON).join(', ') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).map(function (k) { return JSON.stringify(k) + ': ' + inlineJSON(v[k]); }).join(', ') + '}';
    return JSON.stringify(v);
  }
  // standard pretty JSON, except that a list of objects keeps one object per line
  function prettyJSON(v, ind) {
    ind = ind || '';
    if (Array.isArray(v)) {
      if (v.length && v[0] && typeof v[0] === 'object') return '[\n' + v.map(function (i) { return ind + '  ' + inlineJSON(i); }).join(',\n') + '\n' + ind + ']';
      return inlineJSON(v);
    }
    if (v && typeof v === 'object') {
      var keys = Object.keys(v);
      if (!keys.length) return '{}';
      return '{\n' + keys.map(function (k) { return ind + '  ' + JSON.stringify(k) + ': ' + prettyJSON(v[k], ind + '  '); }).join(',\n') + '\n' + ind + '}';
    }
    return JSON.stringify(v);
  }
  function copy(o) { var c = {}; Object.keys(o).forEach(function (k) { c[k] = o[k]; }); return c; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- what the LLM reads before every step ---------- */
  function systemPrompt(tools) {
    var lines = [
      'You are a helpful assistant that can use tools.',
      'In each step, write a Thought. Then write EITHER one Action as JSON,',
      '{"tool": "<tool name>", "arguments": {...}}, OR a final Answer.',
      'If no tool can help, answer from what you already know.',
      '',
      'Tools you may use:'
    ];
    var n = 0;
    TOOL_ORDER.forEach(function (t) {
      if (tools[t]) { n++; lines.push(inlineJSON({ name: t, description: TOOLS[t].desc, arguments: TOOLS[t].args })); }
    });
    if (!n) lines.push('(none)');
    return lines.join('\n');
  }

  /* ---------- the scripted agent ---------- */
  function newRun(cfg, date) {
    return {
      cfg: cfg, date: date, steps: [], rng: mulberry32(SEED),
      mem: { failNext: cfg.fail, lastError: '', trains: null, total: null, calc: null, weather: null, bookDone: false, booked: false, retried: false, pnr: '' },
      used: { search_trains: 0, calculator: 0, get_weather: 0, book_ticket: 0 }, toolNote: {},
      toolCalls: 0, tokens: 0, histTok: 0,
      baseTok: tok(systemPrompt(cfg.tools)) + tok('Goal: ' + GOALS[cfg.goal].text),
      started: false, over: false, awaiting: false, pendingStop: false, result: '', last: null, example: false
    };
  }
  function bookArgs(r) { return { train: PICK.pick.name, date: r.date, passengers: PASSENGERS, amount_inr: r.mem.total }; }
  function noBookAnswer() {
    return 'I can’t book tickets, because the book_ticket tool is switched off. The cheapest train under ' + inr(FARE_CAP) + ' with seats is ' + PICK.pick.name +
      ' at ' + PICK.pick.departs + ', ' + inr(PICK.pick.fare) + ' a person, so ' + PASSENGERS + ' people would pay ' + inr(PICK.total) + '.';
  }

  // The "LLM": decides the next step from what it has seen so far (its memory of earlier observations).
  function makeStep(r) {
    var c = r.cfg, m = r.mem, on = c.tools;
    var s = { n: r.steps.length + 1, thought: '', check: null, action: null, answer: null, outcome: '', flags: [], parts: [], cursor: 0, decision: '', obs: null, obsKind: '', secs: 0 };
    function call(tool, args, thought) {
      if (m.lastError === tool) {
        s.thought = 'The ' + tool + ' call timed out. That is often a short glitch, so I will send the same call once more.';
        s.flags.push('retry'); m.retried = true;
      } else s.thought = thought;
      s.action = { tool: tool, args: args };
    }

    if (c.goal === 'train') {
      var pk = PICK;
      if (!m.trains) {
        if (on.search_trains) call('search_trains', { from: 'Pune', to: 'Mumbai', date: r.date }, 'First I need tomorrow’s trains from Pune to Mumbai, with fares and seats left. I will call search_trains.');
        else {
          s.thought = 'To book a train I first need tomorrow’s trains and fares, but no tool can look them up. I must not make up train times or prices.';
          s.answer = 'Sorry, I can’t look up trains right now (the search_trains tool is switched off), so I have not booked anything.';
          s.outcome = 'nosearch';
        }
      } else if (m.total === null) {
        var pickTxt = (pk.cheapest !== pk.pick
          ? 'The cheapest train under ' + inr(FARE_CAP) + ' is ' + pk.cheapest.name + ' at ' + inr(pk.cheapest.fare) + ', but it has 0 seats left. The next cheapest is '
          : 'The cheapest train under ' + inr(FARE_CAP) + ' is ') +
          pk.pick.name + ' at ' + inr(pk.pick.fare) + ' a person, with ' + pk.pick.seats_left + ' seats left.';
        if (on.calculator) {
          call('calculator', { expression: PASSENGERS + ' * ' + pk.pick.fare }, pickTxt + ' For ' + PASSENGERS + ' people I need ' + PASSENGERS + ' × ' + pk.pick.fare + ', so I will use the calculator.');
        } else {
          var h = Math.floor(pk.pick.fare / 100) * 100, rest = pk.pick.fare - h;
          s.thought = pickTxt + ' I have no calculator, so I will work out ' + PASSENGERS + ' × ' + pk.pick.fare + ' in my head: ' +
            PASSENGERS + ' × ' + h + ' = ' + group(PASSENGERS * h) + ' and ' + PASSENGERS + ' × ' + rest + ' = ' + group(PASSENGERS * rest) +
            ', so the total is ' + inr(PASSENGERS * h + PASSENGERS * rest) + '.';
          s.flags.push('guess');
          s.check = { math: true, right: true, text: PASSENGERS + ' × ' + pk.pick.fare + ' really is ' + inr(pk.total) + '. But a guess can be wrong without any warning: try the GST goal.' };
          m.total = PASSENGERS * h + PASSENGERS * rest;
          if (on.book_ticket) { s.thought += ' Now I can book the seats.'; s.action = { tool: 'book_ticket', args: bookArgs(r) }; }
          else { s.thought += ' But the book_ticket tool is switched off, so I can’t book.'; s.answer = noBookAnswer(); s.outcome = 'nobook'; }
        }
      } else if (!m.bookDone) {
        if (on.book_ticket) call('book_ticket', bookArgs(r), 'The total for ' + PASSENGERS + ' people is ' + inr(m.total) + '. I will book ' + PASSENGERS + ' seats on ' + pk.pick.name + '.');
        else {
          s.thought = 'The total for ' + PASSENGERS + ' people is ' + inr(m.total) + ', but the book_ticket tool is switched off, so I can’t book the seats myself.';
          s.answer = noBookAnswer(); s.outcome = 'nobook';
        }
      } else if (m.booked) {
        s.thought = 'The booking is confirmed, so I can give the user the details.';
        s.answer = 'Done! I booked ' + PASSENGERS + ' seats on ' + pk.pick.name + ' for tomorrow: it leaves Pune at ' + pk.pick.departs + ' and reaches Mumbai at ' + pk.pick.arrives +
          '. The fare is ' + inr(pk.pick.fare) + ' a person, so the total is ' + inr(m.total) + '. Your PNR (booking number) is ' + m.pnr + '.';
        s.outcome = 'booked';
      } else {
        s.thought = 'The payment was not approved, so I must not book or try again.';
        s.answer = 'I have not booked anything, because the ' + inr(m.total) + ' payment was not approved. The best match is ' + pk.pick.name + ' at ' + pk.pick.departs + ': ' +
          inr(pk.pick.fare) + ' a person, or ' + inr(m.total) + ' for ' + PASSENGERS + ' people.';
        s.outcome = 'rejected';
      }
    } else if (c.goal === 'gst') {
      if (m.calc === null) {
        if (on.calculator) call('calculator', { expression: BILL + ' * ' + GST_RATE + ' / 100' }, GST_RATE + '% of ' + inr(BILL) + ' means ' + group(BILL) + ' × ' + GST_RATE + ' ÷ 100. I will use the calculator so the answer is exact.');
        else {
          s.thought = 'I have no calculator, so I will work it out in my head. 10% of ' + group(BILL) + ' is ' + group(GST_TEN) + '. 8% of ' + group(BILL) + ' is ' + group(GST_EIGHT_SLIP) +
            '. So ' + GST_RATE + '% is ' + group(GST_TEN) + ' + ' + group(GST_EIGHT_SLIP) + ' = ' + group(GST_GUESS) + '.';
          s.flags.push('guess');
          var off = GST_TRUE - GST_GUESS;
          s.check = { math: true, right: false, text: 'the true answer is ' + inr(GST_TRUE) + ' (' + group(BILL) + ' × ' + GST_RATE + ' ÷ 100), so the agent is off by ' + inr(off) + ', about ' + (100 * off / GST_TRUE).toFixed(1) + '% too low. Its slip: 8% of ' + group(BILL) + ' is ' + group(GST_EIGHT) + ', not ' + group(GST_EIGHT_SLIP) + '.' };
          s.answer = GST_RATE + '% GST on a ' + inr(BILL) + ' bill is ' + inr(GST_GUESS) + '.';
          s.outcome = 'guess';
        }
      } else {
        s.thought = 'The calculator says ' + group(m.calc) + '. That is the GST amount.';
        s.answer = GST_RATE + '% GST on a ' + inr(BILL) + ' bill is ' + inr(m.calc) + '.';
        s.outcome = 'correct';
      }
    } else if (c.goal === 'cricket') {
      if (m.calc === null) {
        if (on.calculator) call('calculator', { expression: RUNS + ' / (' + BALLS + ' / 6)' }, 'An over has 6 balls, so ' + BALLS + ' balls is ' + BALLS + ' ÷ 6 overs. The run rate needed is ' + RUNS + ' ÷ (' + BALLS + ' ÷ 6). I will use the calculator.');
        else {
          s.thought = 'I have no calculator, so I will do it in my head. ' + BALLS + ' balls is ' + BALLS + ' ÷ 6 = ' + OVERS + ' overs. ' + RUNS + ' ÷ ' + OVERS + ': ' + RR_WHOLE + ' × ' + OVERS + ' = ' + (RR_WHOLE * OVERS) +
            ', with ' + RR_LEFT + ' left over, so the answer is ' + RR_GUESS.toFixed(2) + '.';
          s.flags.push('guess');
          s.check = { math: true, right: false, text: 'the true answer is ' + RR_TRUE.toFixed(2) + ' (' + RUNS + ' ÷ ' + OVERS + ' = ' + (Math.floor(RR_TRUE * 1000) / 1000) + '…), so the agent is off by ' + (RR_TRUE - RR_GUESS).toFixed(2) + ' runs per over. Its slip: the ' + RR_LEFT + ' left over means ' + RR_LEFT + ' ÷ ' + OVERS + ' = ' + (RR_LEFT / OVERS).toFixed(2) + ' of a run, not ' + (RR_LEFT / 100).toFixed(2) + '.' };
          s.answer = 'India need about ' + RR_GUESS.toFixed(2) + ' runs per over.';
          s.outcome = 'guess';
        }
      } else {
        s.thought = 'The calculator says ' + m.calc + '. I will round it to 2 decimal places.';
        s.answer = 'India need about ' + m.calc.toFixed(2) + ' runs per over (' + RUNS + ' runs from ' + OVERS + ' overs).';
        s.outcome = 'correct';
      }
    } else {
      if (!m.weather) {
        if (on.get_weather) call('get_weather', { city: 'Mumbai', date: r.date }, 'I need tomorrow’s forecast for Mumbai. I will call get_weather.');
        else {
          s.thought = 'I have no weather tool, so I can’t check tomorrow’s forecast. Most days in Mumbai are dry, so I will guess that it won’t rain.';
          s.flags.push('guess');
          s.check = { math: false, right: false, text: 'the pretend forecast for tomorrow says a ' + WEATHER.rain_chance_percent + '% chance of rain, with thundershowers after 4 pm. This guess would leave you wet.' };
          s.answer = 'You probably don’t need an umbrella in Mumbai tomorrow.';
          s.outcome = 'guess';
        }
      } else {
        s.thought = 'The forecast says a ' + m.weather.rain_chance_percent + '% chance of rain, so an umbrella is a good idea.';
        s.answer = 'Yes, carry an umbrella. Tomorrow Mumbai has a ' + m.weather.rain_chance_percent + '% chance of rain, with thundershowers likely after 4 pm.';
        s.outcome = 'correct';
      }
    }

    // the order in which this step is shown
    s.parts.push('thought');
    if (s.check) s.parts.push('check');
    if (s.action) {
      s.parts.push('action');
      if (s.action.tool === 'book_ticket' && c.guard && s.action.args.amount_inr > c.limit) s.parts.push('guard');
      s.parts.push('obs');
    } else s.parts.push('answer');

    // tokens: the LLM re-reads the instructions, the goal and the whole history, then writes this step
    var outText = 'Thought: ' + s.thought + (s.action ? '\nAction: ' + inlineJSON({ tool: s.action.tool, arguments: s.action.args }) : '\nAnswer: ' + s.answer);
    s.inTok = r.baseTok + r.histTok;
    s.outTok = tok(outText);
    r.histTok += s.outTok;
    return s;
  }

  // The loop (ordinary code, not the LLM) runs the tool the LLM asked for.
  function execTool(r, s) {
    var m = r.mem, t = s.action.tool;
    if (s.decision === 'reject') {
      s.obs = { error: 'not_approved', message: 'A human rejected this payment. Nothing was booked or paid.' };
      s.obsKind = 'blocked'; m.bookDone = true; m.booked = false; m.lastError = ''; r.toolNote.book_ticket = 'blocked';
    } else {
      r.toolCalls++; r.used[t]++;
      if (m.failNext) {
        m.failNext = false; m.lastError = t;
        s.obs = { error: 'timeout', message: t + ' did not reply within 10 seconds' };
        s.obsKind = 'error'; s.secs = 10; s.flags.push('error'); r.toolNote[t] = 'timeout';
      } else {
        m.lastError = ''; r.toolNote[t] = '';
        s.secs = Math.round((0.3 + r.rng() * 1.1) * 10) / 10;
        if (t === 'search_trains') { m.trains = TRAINS; s.obs = { trains: TRAINS.map(copy) }; }
        else if (t === 'calculator') {
          var v = r.cfg.goal === 'train' ? PASSENGERS * PICK.pick.fare : r.cfg.goal === 'gst' ? BILL * GST_RATE / 100 : RUNS / (BALLS / 6);
          s.obs = { result: v };
          if (r.cfg.goal === 'train') m.total = v; else m.calc = v;
        } else if (t === 'get_weather') { m.weather = copy(WEATHER); s.obs = copy(WEATHER); }
        else if (t === 'book_ticket') {
          var pnr = String(1 + Math.floor(r.rng() * 9));
          for (var i = 0; i < 9; i++) pnr += Math.floor(r.rng() * 10);
          m.pnr = pnr; m.booked = true; m.bookDone = true; r.toolNote.book_ticket = 'booked';
          s.obs = { status: 'confirmed', pnr: pnr, train: PICK.pick.name, date: r.date, passengers: PASSENGERS, paid_inr: m.total, seats_left_now: PICK.pick.seats_left - PASSENGERS };
        }
      }
    }
    r.histTok += tok('Observation: ' + inlineJSON(s.obs));
  }

  /* ---------- the diagram layout (pixel units, laid out for the real width) ---------- */
  function layoutFor(W) {
    var narrow = W < 560, pad = narrow ? 8 : 14;
    var th = narrow ? 40 : 46, tg = narrow ? 6 : 10, tt = 4 * th + 3 * tg;
    var L = { W: W, narrow: narrow, pad: pad, tools: {} }, toolW, toolX;
    if (narrow) {
      var lw = Math.round((W - 2 * pad) * 0.37), nodeH = 46, vgap = 18;
      toolW = Math.round((W - 2 * pad) * 0.48);
      toolX = W - pad - toolW;
      L.you = { x: pad, y: pad, w: lw, h: nodeH };
      L.llm = { x: pad, y: pad + nodeH + vgap, w: lw, h: tt };
      L.ans = { x: pad, y: L.llm.y + tt + vgap, w: lw, h: nodeH };
      L.diagH = L.ans.y + nodeH;
    } else {
      var cw = Math.min(170, Math.round(W * 0.19)), lw2 = Math.min(200, Math.round(W * 0.23));
      toolW = Math.min(230, Math.round(W * 0.27));
      toolX = W - pad - toolW;
      var free = toolX - (pad + cw) - lw2;
      L.llm = { x: pad + cw + Math.round(free * 0.36), y: pad, w: lw2, h: tt };
      L.you = { x: pad, y: pad + 8, w: cw, h: 70 };
      L.ans = { x: pad, y: pad + tt - 78, w: cw, h: 70 };
      L.diagH = pad + tt;
    }
    TOOL_ORDER.forEach(function (t, i) { L.tools[t] = { x: toolX, y: L.llm.y + i * (th + tg), w: toolW, h: th }; });
    var cT = L.diagH + (narrow ? 18 : 22), barsH = narrow ? 46 : 58;
    L.chart = { titleY: cT + 12, barTop: cT + 34, barBase: cT + 34 + barsH, barsH: barsH };
    L.chart.numY = L.chart.barBase + 15;
    L.H = L.chart.numY + (narrow ? 6 : 8);
    return L;
  }

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'ag' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;
    var DATE = tomorrowISO();
    var cfg = cloneCfg(DEFAULTS);
    var speed = 'normal';
    var run = null, playing = false, timer = 0, rafId = 0, sizeRaf = 0, liveTimer = 0, liveMsg = '', runNo = 0;
    var runLog = [], done = {}, dimsW = 0;

    function checkRow(id, checked, labelHtml, extra) {
      return '<div style="display:grid;grid-template-columns:22px minmax(0,1fr);gap:8px;align-items:start">' +
        '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + (extra || '') + ' style="margin:3px 0 0">' +
        '<label for="' + id + '" style="font-size:.95rem">' + labelHtml + '</label></div>';
    }
    var goalOpts = GOAL_ORDER.map(function (g) { return '<option value="' + g + '">' + esc(GOALS[g].label) + '</option>'; }).join('');
    var toolRows = TOOL_ORDER.map(function (t) {
      return checkRow(P + 'tool-' + t, DEFAULTS.tools[t], '<code>' + t + '</code> <span class="small muted">' + esc(TOOLS[t].help) + '</span>', ' data-tool="' + t + '"');
    }).join('');
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + esc(t.text) + '</li>'; }).join('');
    function stat(id, k) { return '<div class="stat"><div class="k">' + k + '</div><div class="v" id="' + P + id + '">0</div></div>'; }

    var top = document.createElement('div');
    top.className = 'lab';
    top.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a pretend AI agent at work. No real AI runs here: a scripted “LLM” (large language model, the kind of AI behind chatbots) follows fixed rules, so the same settings always give the same run. ' +
        'An <em>agent</em> is an LLM + <em>tools</em> (small programs it may ask for, such as a calculator) + a <em>loop</em>. ' +
        'In each step the LLM writes a <strong>Thought</strong>, then either an <strong>Action</strong> (a tool’s name and inputs, written in JSON, a simple text format for data) or a final <strong>Answer</strong>. ' +
        'The code around the LLM runs the tool and adds its reply, the <strong>Observation</strong>, to the history, and the loop goes round again. The diagram shows the loop; the trace under it shows every word.</p>' +
      '<div class="lab-body">' +
        '<div class="stack" style="min-width:0">' +
          '<div class="stack-sm">' +
            '<div class="control"><label for="' + P + 'goal">Goal for the agent</label>' +
              '<select id="' + P + 'goal" style="width:100%;max-width:32rem">' + goalOpts + '</select></div>' +
            '<p id="' + P + 'goaltext" style="padding:8px 12px;background:var(--surface-2);border-radius:var(--radius-sm);color:var(--ink)"></p>' +
            '<div class="row" style="gap:8px 10px">' +
              '<button type="button" class="btn btn-primary" id="' + P + 'run">Run</button>' +
              '<button type="button" class="btn" id="' + P + 'step">Next step</button>' +
              '<button type="button" class="btn" id="' + P + 'reset">Reset</button>' +
              '<div class="row" style="gap:6px"><span class="small" id="' + P + 'speedlbl" style="font-weight:600">Speed</span>' +
                '<div class="seg" role="group" aria-labelledby="' + P + 'speedlbl">' +
                  '<button type="button" data-speed="slow" aria-pressed="false">Slow</button>' +
                  '<button type="button" data-speed="normal" aria-pressed="true">Normal</button>' +
                  '<button type="button" data-speed="instant" aria-pressed="false">Instant</button>' +
                '</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="stack-sm">' +
            '<div class="lab-canvas-wrap" id="' + P + 'wrap" style="aspect-ratio:auto;height:362px">' +
              '<svg id="' + P + 'svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram of the agent loop" style="touch-action:auto" preserveAspectRatio="xMidYMid meet"></svg></div>' +
            '<p id="' + P + 'status" style="min-height:1.6em;color:var(--ink);font-weight:600"></p>' +
            '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>' +
            '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">' +
              stat('ssteps', 'Steps used') + stat('scalls', 'Tool calls') + stat('stok', 'Tokens') + stat('scost', 'Cost of this run') +
            '</div>' +
            '<p class="small muted" id="' + P + 'costnote"></p>' +
          '</div>' +
          '<div class="stack-sm">' +
            '<h2 class="lab-h" id="' + P + 'traceh">Trace: what the agent wrote, step by step</h2>' +
            '<div id="' + P + 'tracebox" role="region" aria-labelledby="' + P + 'traceh" tabindex="0" style="max-height:min(32rem,75vh);overflow:auto;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);padding:12px 14px">' +
              '<ol id="' + P + 'trace" style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px"></ol></div>' +
            '<details class="fold"><summary id="' + P + 'syssum">What the LLM reads before every step</summary><div class="stack-sm">' +
              '<pre id="' + P + 'sys" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>' +
              '<p class="small muted">This text (the <em>system prompt</em>) plus the goal and the whole trace so far is sent to the LLM at every step. Each tool you switch on adds a line, so every step costs a little more.</p>' +
            '</div></details>' +
          '</div>' +
          '<div class="stack-sm">' +
            '<h2 class="lab-h" id="' + P + 'histh">Runs so far</h2>' +
            '<div class="table-wrap" role="region" aria-labelledby="' + P + 'histh" tabindex="0">' +
              '<table class="simple" style="min-width:600px;font-size:.9rem"><thead><tr><th scope="col">Run</th><th scope="col">Goal</th><th scope="col">Settings changed</th><th scope="col">Result</th><th scope="col">Steps</th><th scope="col">Tokens</th><th scope="col">Cost</th></tr></thead>' +
              '<tbody id="' + P + 'hist"></tbody></table></div>' +
            '<p class="small muted" id="' + P + 'histhint" hidden>Swipe the table sideways to see every column.</p>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls">' +
          '<div class="stack-sm" role="group" aria-labelledby="' + P + 'toolsh"><h2 class="lab-h" id="' + P + 'toolsh">Tools the agent may use</h2>' + toolRows +
            '<p class="small muted">Every tool that is on gets described to the LLM at the start of every step.</p></div>' +
          '<div class="stack-sm"><h2 class="lab-h">Safety limits</h2>' +
            checkRow(P + 'guard', DEFAULTS.guard, 'Ask a human before any payment above the approval limit (a <em>guardrail</em>: a rule in code that the LLM cannot skip)') +
            '<div class="control"><label for="' + P + 'limit">Approval limit <output id="' + P + 'limitout" for="' + P + 'limit">' + inr(DEFAULTS.limit) + '</output></label>' +
              '<input type="range" id="' + P + 'limit" min="' + LIMIT.min + '" max="' + LIMIT.max + '" step="' + LIMIT.step + '" value="' + DEFAULTS.limit + '"></div>' +
            '<div class="control"><label for="' + P + 'max">Max steps <output id="' + P + 'maxout" for="' + P + 'max">' + DEFAULTS.maxSteps + '</output></label>' +
              '<input type="range" id="' + P + 'max" min="' + STEPS.min + '" max="' + STEPS.max + '" step="1" value="' + DEFAULTS.maxSteps + '">' +
              '<p class="small muted">One step is one turn of the loop (one call to the LLM). When the limit is reached the loop stops, answer or not.</p></div>' +
          '</div>' +
          '<div class="stack-sm"><h2 class="lab-h">Make something go wrong</h2>' +
            checkRow(P + 'fail', DEFAULTS.fail, 'First tool call times out (it fails once, then works)') +
            '<p class="small muted">Real tools fail: networks drop and servers get busy. A good agent tries again, but not for ever.</p></div>' +
          '<p class="small muted">Changing a goal or setting resets the run. Then press Run.</p>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<div class="stack-sm"><h2 class="lab-h">Ideas to notice</h2><ul class="small" style="display:flex;flex-direction:column;gap:4px">' +
        '<li><strong>Function calling:</strong> the LLM never runs a tool itself. It only writes a small JSON message with the tool’s name and inputs; ordinary code runs the tool and pastes the reply back.</li>' +
        '<li><strong>Step limit:</strong> a stuck agent could loop for ever. Max steps is a hard stop, for its sake and for your bill.</li>' +
        '<li><strong>Guardrail:</strong> anything that spends money or cannot be undone should wait for a human “yes”. A rule in code is safer than hoping the LLM behaves.</li>' +
        '<li><strong>Cost grows with steps:</strong> at every step the LLM re-reads the instructions, the tool list and the whole history so far, so later steps read more tokens than early ones (see the bars).</li>' +
        '<li><strong>Tools beat guesses:</strong> without a tool the LLM still sounds sure of itself, even when its maths or facts are wrong.</li>' +
      '</ul></div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> real agents that book tickets, pay bills over UPI or write code run this same loop, so the people who build them choose the tools with care, cap the steps and the spending, and keep a human in charge of anything risky or costly.</p>';
    root.appendChild(top);

    function $(id) { return top.querySelector('#' + P + id); }
    var elGoal = $('goal'), elGoalText = $('goaltext'), btnRun = $('run'), btnStep = $('step'), btnReset = $('reset');
    var wrap = $('wrap'), svg = $('svg'), elStatus = $('status'), elLive = $('live');
    var elSteps = $('ssteps'), elCalls = $('scalls'), elTok = $('stok'), elCost = $('scost'), elCostNote = $('costnote');
    var traceBox = $('tracebox'), elTrace = $('trace'), elSys = $('sys'), elSysSum = $('syssum'), elHist = $('hist'), elHistHint = $('histhint');
    var histWrap = elHist.parentNode.parentNode;
    // the hint only shows when the runs table really is wider than its box
    function updateHistHint() { elHistHint.hidden = !(histWrap.scrollWidth > histWrap.clientWidth + 1); }
    var elGuard = $('guard'), elLimit = $('limit'), elLimitOut = $('limitout'), elMax = $('max'), elMaxOut = $('maxout'), elFail = $('fail');
    var toolBoxes = {};
    TOOL_ORDER.forEach(function (t) { toolBoxes[t] = $('tool-' + t); });
    var speedBtns = top.querySelectorAll('[data-speed]');
    var taskEls = {};
    Array.prototype.forEach.call(top.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- tasks + announcements ---------- */
    function markLi(id) {
      var li = taskEls[id];
      if (li && !li.classList.contains('done')) {
        li.classList.add('done');
        var sr = document.createElement('span');
        sr.className = 'visually-hidden';
        sr.textContent = ' (done)';
        li.appendChild(sr);
      }
    }
    TASKS.forEach(function (t) { if (ctx && ctx.isTaskDone && ctx.isTaskDone(t.id)) { done[t.id] = true; markLi(t.id); } });
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      announce('Task done: ' + TASK_DONE_MSG[id]);
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }
    // messages from one action are joined into one announcement
    function announce(s) {
      liveMsg = liveMsg ? liveMsg + ' ' + s : s;
      if (!liveTimer) liveTimer = setTimeout(function () { liveTimer = 0; if (!destroyed) elLive.textContent = liveMsg; liveMsg = ''; }, 60);
    }

    /* ---------- the trace ---------- */
    function block(color, title, body, opts) {
      opts = opts || {};
      return '<div style="border-left:' + (opts.thick ? 4 : 3) + 'px solid var(' + color + ');' +
        (opts.bg ? 'padding:8px 10px;background:var(' + opts.bg + ');border-radius:0 var(--radius-sm) var(--radius-sm) 0' : 'padding:2px 0 2px 10px') + '">' +
        '<p class="small" style="margin:0 0 2px;font-weight:700;color:var(--ink)">' + title + '</p>' + body + '</div>';
    }
    function para(text) { return '<p style="margin:0">' + esc(text) + '</p>'; }
    function addLi(html, style) {
      var li = document.createElement('li');
      li.style.cssText = 'margin:0;' + (style || '');
      li.innerHTML = html;
      elTrace.appendChild(li);
      return li;
    }
    function addPart(s, html) {
      var d = document.createElement('div');
      d.innerHTML = html;
      var el = d.firstChild;
      s.elParts.appendChild(el);
      traceBox.scrollTop = traceBox.scrollHeight;
      return el;
    }
    function renderFlags(s) {
      s.elFlags.innerHTML = s.flags.map(function (f) {
        var d = FLAGS[f];
        return '<span class="chip" style="color:var(--ink)"><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="4.5" style="fill:var(' + d[0] + ')"/></svg>' + d[1] + '</span>';
      }).join('');
      s.elFlags.hidden = !s.flags.length;
    }
    function addStepDom(s) {
      var li = addLi('<div class="row-between" style="gap:2px 12px"><strong>Step ' + s.n + '</strong><span class="small muted num">read ' + group(s.inTok) + ' tokens, wrote ' + group(s.outTok) + '</span></div>' +
        '<div class="row" data-flags style="gap:6px;margin-top:4px" hidden></div><div class="stack-sm" data-parts style="margin-top:8px"></div>', 'padding-top:12px;border-top:1px solid var(--line)');
      s.el = li; s.elFlags = li.querySelector('[data-flags]'); s.elParts = li.querySelector('[data-parts]');
    }
    function setupText(c) {
      var onT = TOOL_ORDER.filter(function (t) { return c.tools[t]; });
      return 'Tools on: ' + (onT.length ? onT.join(', ') : 'none') + '. ' +
        (c.guard ? 'A human must approve any payment above ' + inr(c.limit) + '. ' : 'No approval guardrail: payments go ahead without asking anyone. ') +
        'At most ' + c.maxSteps + (c.maxSteps === 1 ? ' step. ' : ' steps. ') +
        (c.fail ? 'The first tool call will time out once.' : 'Tools work first time.');
    }
    function showReady() {
      elTrace.innerHTML = '';
      addLi(block('--muted', 'Ready to run', para(setupText(run.cfg)) + '<p class="small muted" style="margin:4px 0 0">Press Run to watch the agent, or Next step to go one step at a time.</p>'));
    }
    function startTrace() {
      elTrace.innerHTML = '';
      if (run.example) addLi('<p class="small muted" style="margin:0">This example run used the starting settings. Press Run again to watch it happen live, or press Reset and then Next step to go one step at a time. You can change the settings first.</p>');
      addLi(block('--muted', 'You asked', para('“' + GOALS[run.cfg.goal].text + '”')));
    }
    function actionHtml(r, s) {
      var a = s.action, note = '';
      if (a.tool === 'book_ticket') {
        var amt = a.args.amount_inr;
        if (!r.cfg.guard) note = 'No guardrail is on, so this payment goes ahead without asking anyone.';
        else if (amt <= r.cfg.limit) note = 'Guardrail check: ' + inr(amt) + ' is not above your ' + inr(r.cfg.limit) + ' limit, so no approval is needed.';
      }
      return block('--series-4', 'Action: a tool call, written as JSON', '<pre style="' + PRE_STYLE + '">' + esc(prettyJSON({ tool: a.tool, arguments: a.args })) + '</pre>' +
        (note ? '<p class="small muted" style="margin:4px 0 0">' + esc(note) + '</p>' : ''));
    }
    function guardHtml(r, s) {
      var amt = inr(s.action.args.amount_inr);
      return '<div style="border-left:4px solid var(--haldi);background:var(--haldi-soft);padding:8px 10px;border-radius:0 var(--radius-sm) var(--radius-sm) 0">' +
        '<p class="small" style="margin:0 0 2px;font-weight:700;color:var(--ink)">Guardrail: waiting for a human</p>' +
        '<p style="margin:0;color:var(--ink)">The agent wants to pay ' + amt + ', which is above your approval limit of ' + inr(r.cfg.limit) + '. The loop is paused until you decide.</p>' +
        '<div class="row" data-guard-btns style="margin-top:8px"><button type="button" class="btn btn-sm btn-primary" data-decide="approve">Approve ' + amt + '</button>' +
        '<button type="button" class="btn btn-sm" data-decide="reject">Reject</button></div></div>';
    }
    function obsHtml(r, s) {
      var t = s.action.tool, title, color, extra = '';
      if (s.obsKind === 'error') { color = '--bad'; title = 'Observation: tool error <span style="font-weight:400">(no reply in ' + s.secs + ' s)</span>'; }
      else if (s.obsKind === 'blocked') { color = '--bad'; title = 'Observation: blocked by the guardrail'; }
      else {
        color = '--muted'; title = 'Observation: the tool’s reply <span style="font-weight:400">(took ' + s.secs + ' s)</span>';
        if (t === 'book_ticket') extra = 'The pretend world changed: ' + PICK.pick.name + ' now has ' + (PICK.pick.seats_left - PASSENGERS) + ' seats left, and ' + inr(r.mem.total) + ' was paid.';
      }
      return block(color, title, '<pre style="' + PRE_STYLE + '">' + esc(prettyJSON(s.obs)) + '</pre>' + (extra ? '<p class="small muted" style="margin:4px 0 0">' + esc(extra) + '</p>' : ''));
    }
    function checkHtml(ch) {
      return block(ch.right ? '--ok' : '--bad', 'Lab check (the agent cannot see this)', para((ch.right ? 'Right this time: ' : 'Wrong: ') + ch.text), { bg: '--surface-2' });
    }

    /* ---------- running the loop ---------- */
    function reveal(s, part) {
      var r = run;
      r.last = { s: s, part: part };
      if (part === 'thought') {
        r.tokens += s.inTok + s.outTok;
        renderFlags(s);
        addPart(s, block('--series-1', 'Thought', para(s.thought)));
      } else if (part === 'check') {
        addPart(s, checkHtml(s.check));
        if (s.check.math && !s.check.right && !r.example) completeTask('t2');
      } else if (part === 'action') {
        addPart(s, actionHtml(r, s));
      } else if (part === 'guard') {
        r.awaiting = true;
        s.flags.push('approval'); renderFlags(s);
        s.elGuard = addPart(s, guardHtml(r, s));
        // Run and Next step are about to be disabled: keep keyboard focus on something useful
        var ae = document.activeElement;
        if (ae === btnRun || ae === btnStep) { var ap = s.elGuard.querySelector('[data-decide="approve"]'); if (ap) ap.focus(); }
        if (!r.example) announce('Paused. The guardrail needs your approval for a ' + inr(s.action.args.amount_inr) + ' payment. Use the Approve or Reject button in the trace.');
      } else if (part === 'obs') {
        execTool(r, s);
        renderFlags(s);
        addPart(s, obsHtml(r, s));
      } else if (part === 'answer') {
        addPart(s, block('--ok', 'Final answer', para(s.answer), { bg: '--surface-2', thick: true }));
        finish(s.outcome);
      }
    }
    // Shows the next piece of the run. Returns false when there is nothing more to show right now.
    function advance() {
      var r = run;
      if (r.over || r.awaiting) return false;
      if (!r.started) { r.started = true; startTrace(); }
      if (r.pendingStop) { stopAtLimit(); return true; }
      var s = r.steps[r.steps.length - 1];
      if (!s || s.cursor >= s.parts.length) {
        s = makeStep(r);
        r.steps.push(s);
        addStepDom(s);
      }
      reveal(s, s.parts[s.cursor++]);
      // the loop checks the limit before it would call the LLM again
      if (!r.over && !r.awaiting && s.cursor >= s.parts.length && r.steps.length >= r.cfg.maxSteps) r.pendingStop = true;
      return true;
    }
    // Shows the rest of the current step (or the whole next step), plus the stop notice if the limit is now hit.
    function advanceStep() {
      if (!advance()) return;
      while (!run.over && !run.awaiting) {
        var cur = run.steps[run.steps.length - 1];
        if (!cur || cur.cursor >= cur.parts.length) break;
        advance();
      }
      if (run.pendingStop && !run.over) advance();
    }
    function stopAtLimit() {
      var r = run, max = r.cfg.maxSteps, extra;
      r.pendingStop = false;
      r.last = { s: null, part: 'stop' };
      if (r.mem.booked) extra = ' The ticket was already booked and ' + inr(r.mem.total) + ' paid, though: actions in the world stay done even when a run is cut short.';
      else if (r.cfg.goal === 'train') extra = ' Nothing was booked.';
      else extra = ' You got no answer.';
      addLi(block('--bad', 'Stopped by the step limit', para('The agent used all ' + max + (max === 1 ? ' step' : ' steps') + ' it was allowed and never gave a final answer.' + extra), { bg: '--surface-2', thick: true }), 'padding-top:12px;border-top:1px solid var(--line)');
      traceBox.scrollTop = traceBox.scrollHeight;
      finish('stopped');
    }
    function resultText(r) {
      var g = r.cfg.goal;
      switch (r.result) {
        case 'stopped': return 'stopped at the ' + r.cfg.maxSteps + '-step limit' + (r.mem.booked ? ', after booking' : '');
        case 'booked': return 'booked ' + PASSENGERS + ' seats for ' + inr(r.mem.total);
        case 'rejected': return 'not booked, because you rejected the payment';
        case 'nobook': return 'found the train but could not book it';
        case 'nosearch': return 'gave up honestly (no search tool)';
        case 'correct': return g === 'gst' ? 'correct, ' + inr(GST_TRUE) : g === 'cricket' ? 'correct, ' + RR_TRUE.toFixed(2) + ' runs per over' : 'correct, take an umbrella';
        case 'guess': return g === 'gst' ? 'wrong guess, ' + inr(GST_GUESS) + ' (true ' + inr(GST_TRUE) + ')' : g === 'cricket' ? 'wrong guess, ' + RR_GUESS.toFixed(2) + ' (true ' + RR_TRUE.toFixed(2) + ')' : 'wrong guess, no umbrella (' + WEATHER.rain_chance_percent + '% rain)';
        default: return r.result;
      }
    }
    function setupDiff(c) {
      var bits = [];
      TOOL_ORDER.forEach(function (t) { if (!c.tools[t]) bits.push(t + ' off'); });
      if (!c.guard) bits.push('no approval');
      else if (c.limit !== DEFAULTS.limit) bits.push('approval over ' + inr(c.limit));
      if (c.maxSteps !== DEFAULTS.maxSteps) bits.push('max ' + c.maxSteps + (c.maxSteps === 1 ? ' step' : ' steps'));
      if (c.fail) bits.push('first call times out');
      return bits.length ? bits.join(', ') : 'none (starting settings)';
    }
    function addHistory(r) {
      runLog.unshift({ name: r.example ? 'Example' : String(++runNo), goal: GOALS[r.cfg.goal].short, setup: setupDiff(r.cfg), result: cap(resultText(r)), steps: r.steps.length + ' / ' + r.cfg.maxSteps, tokens: group(r.tokens), cost: inr2(r.tokens * PRICE_PER_1K / 1000) });
      if (runLog.length > 8) runLog.length = 8;
      elHist.innerHTML = runLog.map(function (h) {
        return '<tr><td>' + esc(h.name) + '</td><td>' + esc(h.goal) + '</td><td>' + esc(h.setup) + '</td><td>' + esc(h.result) + '</td><td class="num">' + esc(h.steps) + '</td><td class="num">' + esc(h.tokens) + '</td><td class="num">' + esc(h.cost) + '</td></tr>';
      }).join('');
    }
    function finish(outcome) {
      var r = run;
      r.over = true; r.result = outcome;
      stopPlaying();
      addHistory(r);
      if (!r.example) {
        announce(statusText());
        if (outcome === 'booked' && r.mem.retried) completeTask('t1');
        if (outcome === 'stopped') completeTask('t3');
      }
    }
    function decide(dec) {
      var r = run, s = r.steps[r.steps.length - 1];
      if (!r.awaiting || !s || s.decision) return;
      s.decision = dec; r.awaiting = false;
      if (dec === 'reject') { s.flags.push('rejected'); renderFlags(s); }
      var box = s.elGuard && s.elGuard.querySelector('[data-guard-btns]');
      var hadFocus = !!(box && box.contains(document.activeElement));
      if (box) {
        var p = document.createElement('p');
        p.style.cssText = 'margin:8px 0 0;color:var(--ink);font-weight:700';
        p.textContent = dec === 'approve' ? 'You approved the payment.' : 'You rejected the payment.';
        box.parentNode.replaceChild(p, box);
      }
      announce(dec === 'approve' ? 'Approved. The booking goes ahead.' : 'Rejected. The payment is blocked.');
      if (dec === 'approve' && s.action.args.amount_inr > 1000 && !r.example) completeTask('t4');
      if (playing) schedule(); else advanceStep();
      syncUI(); requestDraw();
      if (hadFocus) (playing || btnStep.disabled ? btnRun : btnStep).focus();
    }
    function tick() {
      timer = 0;
      if (!playing || destroyed) return;
      if (speed === 'instant') { var guard = 0; while (guard++ < 200 && advance()) { /* show everything up to a pause or the end */ } }
      else advance();
      if (!run.over && !run.awaiting) timer = setTimeout(tick, DELAY[speed]);
      syncUI(); requestDraw();
    }
    function schedule() { if (!timer && playing && !destroyed) timer = setTimeout(tick, speed === 'instant' ? 0 : Math.min(400, DELAY[speed])); }
    function stopPlaying() { playing = false; if (timer) { clearTimeout(timer); timer = 0; } }
    function startPlaying() {
      if (run.over) resetRun('');
      playing = true;
      tick();
    }
    function resetRun(reason) {
      stopPlaying();
      var wasFresh = run && !run.started;
      run = newRun(cloneCfg(cfg), DATE);
      showReady();
      syncUI(); requestDraw();
      if (reason === 'settings' && !wasFresh) announce('Settings changed, so the run was reset. Press Run to try them.');
      else if (reason === 'reset') announce('Reset. Press Run or Next step to start.');
    }

    /* ---------- text around the diagram ---------- */
    function statusText() {
      var r = run, n = r.steps.length, max = r.cfg.maxSteps, l = r.last;
      if (!r.started) return 'Ready. Press Run to watch the agent work, or Next step to go one step at a time.';
      if (r.over) {
        var msg = r.result === 'stopped' ? 'stopped by the step limit after ' + max + (max === 1 ? ' step' : ' steps') + ', with no final answer.'
          : 'finished in ' + n + ' of ' + max + ' allowed steps: ' + resultText(r) + '.';
        return r.example ? 'Example run: ' + msg : cap(msg);
      }
      var pre = 'Step ' + n + ' of at most ' + max + ': ';
      if (r.awaiting) return pre + 'paused. The guardrail is waiting for you to approve or reject the payment in the trace.';
      if (!l || !l.s) return pre;
      var t = l.s.action ? l.s.action.tool : '';
      switch (l.part) {
        case 'thought': return pre + 'the LLM is thinking.';
        case 'check': return pre + 'the lab is checking the guess.';
        case 'action': return pre + 'the LLM asked for ' + t + '. The loop runs it.';
        case 'obs': return pre + (l.s.obsKind === 'error' ? t + ' failed. The error goes back to the LLM.' : l.s.obsKind === 'blocked' ? 'the payment was blocked. That news goes back to the LLM.' : t + ' replied. The reply goes back to the LLM.');
        default: return pre;
      }
    }
    function syncUI() {
      if (destroyed) return;
      var r = run, max = r.cfg.maxSteps;
      elSteps.textContent = r.steps.length + ' / ' + max;
      elCalls.textContent = String(r.toolCalls);
      elTok.textContent = group(r.tokens);
      var cost = r.tokens * PRICE_PER_1K / 1000;
      elCost.textContent = inr2(cost);
      elCostNote.textContent = 'A token is a piece of a word, about 4 letters of English. The price here is made up: ' + inr2(PRICE_PER_1K) + ' per 1,000 tokens. ' +
        (r.tokens ? 'If 1 lakh (1,00,000) people ran this each day, it would cost about ' + inr(cost * RUNS_PER_DAY) + ' a day.' : '');
      elStatus.textContent = statusText();
      var ae = document.activeElement;
      btnRun.textContent = r.over ? 'Run again' : (playing ? 'Pause' : (r.started ? 'Continue' : 'Run'));
      btnRun.disabled = r.awaiting;
      btnStep.disabled = r.over || r.awaiting;
      btnReset.disabled = !r.started;
      // a button that just became disabled drops keyboard focus: hand it to the next useful control
      if ((ae === btnRun || ae === btnStep || ae === btnReset) && ae.disabled) {
        var next = !btnRun.disabled ? btnRun : top.querySelector('[data-decide="approve"]');
        if (next) next.focus();
      }
    }
    function updateGoalText() {
      var g = GOALS[cfg.goal];
      elGoalText.innerHTML = '<span class="small" style="font-weight:700">You ask: </span>“' + esc(g.text) + '”' +
        (g.note ? '<span class="small muted" style="display:block;margin-top:4px">' + esc(g.note) + '</span>' : '');
    }
    function updateSys() {
      var sp = systemPrompt(cfg.tools);
      elSys.textContent = sp;
      elSysSum.textContent = 'What the LLM reads before every step (about ' + tok(sp) + ' tokens)';
    }

    /* ---------- the diagram ---------- */
    var mctx = null, fontBody = 'sans-serif', fontMono = 'monospace';
    function textW(str, size, weight, mono) {
      if (!mctx) mctx = document.createElement('canvas').getContext('2d');
      if (!mctx) return str.length * size * 0.6;
      mctx.font = (weight || 400) + ' ' + size + 'px ' + (mono ? fontMono : fontBody);
      return mctx.measureText(str).width;
    }
    function fit(str, max, size, weight, mono) {
      if (textW(str, size, weight, mono) <= max) return str;
      while (str.length > 1 && textW(str + '…', size, weight, mono) > max) str = str.slice(0, -1);
      return str + '…';
    }
    function r1(v) { return Math.round(v * 10) / 10; }
    function T(x, y, s, o) {
      return '<text x="' + r1(x) + '" y="' + r1(y) + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') +
        ' style="font-family:var(' + (o.mono ? '--font-mono' : '--font-body') + ');font-size:' + o.size + 'px;font-weight:' + (o.weight || 400) + ';fill:var(' + (o.fill || '--ink') + ')">' + esc(s) + '</text>';
    }
    function R(b, fill, stroke, sw, dash, rx) {
      return '<rect x="' + r1(b.x) + '" y="' + r1(b.y) + '" width="' + r1(b.w) + '" height="' + r1(b.h) + '" rx="' + (rx == null ? 8 : rx) + '" style="fill:var(' + fill + ');stroke:var(' + stroke + ');stroke-width:' + sw + (dash ? ';stroke-dasharray:' + dash : '') + '"/>';
    }
    function line(x1, y1, x2, y2, color, w, op, dash) {
      return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" style="stroke:var(' + color + ');stroke-width:' + w + ';opacity:' + op + (dash ? ';stroke-dasharray:' + dash : '') + '"/>';
    }
    // arrowhead with its tip at (x, y), pointing along angle a (radians)
    function head(x, y, a, color, size) {
      var s = size || 9, c = Math.cos(a), n = Math.sin(a);
      var bx = x - c * s, by = y - n * s, px = -n * s * 0.55, py = c * s * 0.55;
      return '<path d="M' + r1(x) + ' ' + r1(y) + 'L' + r1(bx + px) + ' ' + r1(by + py) + 'L' + r1(bx - px) + ' ' + r1(by - py) + 'Z" style="fill:var(' + color + ')"/>';
    }
    function shield(cx, cy, s, fill) {
      var k = s / 8;
      function p(x, y) { return r1(cx + x * k) + ' ' + r1(cy + y * k); }
      return '<path d="M' + p(0, -8) + 'L' + p(6.5, -5.5) + 'L' + p(6.5, 0) + 'C' + p(6.5, 4.5) + ' ' + p(3.5, 7) + ' ' + p(0, 8.5) + 'C' + p(-3.5, 7) + ' ' + p(-6.5, 4.5) + ' ' + p(-6.5, 0) + 'L' + p(-6.5, -5.5) + 'Z" style="fill:var(' + fill + ')"/>';
    }
    function pill(cx, cy, text, color) {
      var w = textW(text, 11.5, 600) + 16;
      return '<rect x="' + r1(cx - w / 2) + '" y="' + r1(cy - 10) + '" width="' + r1(w) + '" height="20" rx="10" style="fill:var(--surface);stroke:var(' + color + ');stroke-width:1.5"/>' +
        T(cx, cy + 4, text, { size: 11.5, weight: 600, anchor: 'middle' });
    }
    function diagState() {
      var r = run, l = r.last, st = { tool: '', edge: '', llm: 'ready', answer: 'waiting' };
      if (!r.started) return st;
      if (r.over) {
        st.llm = r.result === 'stopped' ? 'stopped' : 'finished';
        st.answer = r.result === 'stopped' ? 'none' : (r.result === 'guess' ? 'guess' : 'given');
        return st;
      }
      if (!l || !l.s) return st;
      var s = l.s;
      if (l.part === 'thought' || l.part === 'check') st.llm = 'thinking';
      else if (l.part === 'action') { st.llm = 'waiting'; st.tool = s.action.tool; st.edge = 'out'; }
      else if (l.part === 'guard') { st.llm = 'paused'; st.tool = s.action.tool; st.edge = 'held'; }
      else if (l.part === 'obs') { st.llm = 'reading'; st.tool = s.action.tool; st.edge = s.obsKind === 'error' ? 'err' : s.obsKind === 'blocked' ? 'blocked' : 'back'; }
      return st;
    }
    function toolLook(t, st, L) {
      var r = run, c = r.cfg;
      if (!c.tools[t]) return { text: 'switched off', fill: '--surface', stroke: '--muted', sw: 1.2, dash: '5 4', name: '--muted', tc: '--muted' };
      var base = { fill: '--surface-2', stroke: '--line', sw: 1, dash: '', name: '--ink', tc: '--muted' };
      function look(text, o) { var x = copy(base); x.text = text; if (o) Object.keys(o).forEach(function (k) { x[k] = o[k]; }); return x; }
      if (st.tool === t) {
        if (st.edge === 'out') return look('working…', { fill: '--indigo-soft', stroke: '--indigo', sw: 2, tc: '--ink' });
        if (st.edge === 'held') return look('waiting for your OK', { fill: '--haldi-soft', stroke: '--haldi', sw: 2, tc: '--ink' });
        if (st.edge === 'err') return look('timed out', { stroke: '--bad', sw: 2, tc: '--ink' });
        if (st.edge === 'blocked') return look('blocked by you', { stroke: '--bad', sw: 2, tc: '--ink' });
        if (st.edge === 'back') return look(t === 'book_ticket' ? 'booked ' + PASSENGERS + ' seats' : 'replied', { fill: '--indigo-soft', stroke: '--series-4', sw: 2, tc: '--ink' });
      }
      var note = r.toolNote[t], used = r.used[t];
      if (t === 'book_ticket' && note === 'booked') return look('booked ' + PASSENGERS + ' seats', { stroke: '--ok', sw: 2, tc: '--ink' });
      if (t === 'book_ticket' && note === 'blocked') return look('blocked by you');
      if (used) return look('used ' + used + '×' + (note === 'timeout' ? ', timed out' : ''));
      if (t === 'book_ticket' && c.guard && L.narrow) return look('asks you over ' + inr(c.limit));
      return look('ready');
    }
    function describe(st) {
      var r = run, c = r.cfg;
      var onT = TOOL_ORDER.filter(function (t) { return c.tools[t]; }), offT = TOOL_ORDER.filter(function (t) { return !c.tools[t]; });
      var s = 'Diagram of the agent loop for the goal: ' + GOALS[c.goal].short + '. Tools on: ' + (onT.join(', ') || 'none') + (offT.length ? '; switched off: ' + offT.join(', ') : '') + '. ' +
        (c.guard ? 'Payments above ' + inr(c.limit) + ' need a human’s approval. ' : 'No approval guardrail. ') +
        'Step ' + r.steps.length + ' of at most ' + c.maxSteps + '; the LLM is ' + LLM_TEXT[st.llm].replace('…', '') + '.';
      if (st.tool) s += ' Active tool: ' + st.tool + '.';
      if (r.steps.length) s += ' Tokens read in each step: ' + r.steps.map(function (x) { return group(x.inTok); }).join(', ') + '.';
      return s;
    }
    function requestDraw() { if (!rafId && !destroyed) rafId = requestAnimationFrame(function () { rafId = 0; drawDiagram(); }); }
    function drawDiagram() {
      if (destroyed) return;
      var W = dimsW || Math.round(wrap.clientWidth);
      if (W < 120) return;
      dimsW = W;
      var L = layoutFor(W);
      if (Math.abs(wrap.offsetHeight - (L.H + 2)) > 0.5) wrap.style.height = (L.H + 2) + 'px';   // +2: the wrapper's border
      var cs = getComputedStyle(document.documentElement);
      fontBody = cs.getPropertyValue('--font-body').trim() || 'sans-serif';
      fontMono = cs.getPropertyValue('--font-mono').trim() || 'monospace';
      var r = run, c = r.cfg, st = diagState(), o = [], nr = L.narrow;

      // You and the Answer
      var you = L.you, llm = L.llm, ans = L.ans, gs = GOALS[c.goal].short;
      o.push(R(you, '--surface-2', '--line', 1));
      o.push(T(you.x + you.w / 2, you.y + (nr ? 19 : 28), 'You', { size: nr ? 13.5 : 15, weight: 700, anchor: 'middle' }));
      o.push(T(you.x + you.w / 2, you.y + (nr ? 36 : 48), fit(gs, you.w - 12, 12, 400), { size: 12, fill: '--muted', anchor: 'middle' }));
      var ansLook = st.answer === 'given' ? ['given', '--ok', 2] : st.answer === 'guess' ? ['given (a guess)', '--bad', 2] : st.answer === 'none' ? ['none: stopped', '--bad', 2] : ['not yet', '--line', 1];
      o.push(R(ans, '--surface-2', ansLook[1], ansLook[2]));
      o.push(T(ans.x + ans.w / 2, ans.y + (nr ? 19 : 28), 'Answer', { size: nr ? 13.5 : 15, weight: 700, anchor: 'middle' }));
      o.push(T(ans.x + ans.w / 2, ans.y + (nr ? 36 : 48), fit(ansLook[0], ans.w - 12, 12, 400), { size: 12, fill: st.answer === 'waiting' ? '--muted' : '--ink', anchor: 'middle' }));
      var ansOn = st.answer === 'given' || st.answer === 'guess';
      var aCol = ansOn ? '--ok' : '--muted', aW = ansOn ? 3 : 1.4, aOp = ansOn ? 1 : 0.6;
      if (nr) {
        var cx = you.x + you.w / 2;
        o.push(line(cx, you.y + you.h, cx, llm.y - 2, '--muted', 1.4, 0.6) + head(cx, llm.y, Math.PI / 2, '--muted', 8));
        o.push(line(cx, llm.y + llm.h, cx, ans.y - 2, aCol, aW, aOp) + head(cx, ans.y, Math.PI / 2, aCol, ansOn ? 10 : 8));
      } else {
        var yy = you.y + you.h / 2, ya = ans.y + ans.h / 2;
        o.push(line(you.x + you.w, yy, llm.x - 2, yy, '--muted', 1.4, 0.6) + head(llm.x, yy, 0, '--muted', 8));
        o.push(T((you.x + you.w + llm.x) / 2, yy - 8, 'goal', { size: 11.5, fill: '--muted', anchor: 'middle' }));
        o.push(line(llm.x, ya, ans.x + ans.w + 2, ya, aCol, aW, aOp) + head(ans.x + ans.w, ya, Math.PI, aCol, ansOn ? 10 : 8));
        o.push(T((ans.x + ans.w + llm.x) / 2, ya - 8, 'answer', { size: 11.5, fill: '--muted', anchor: 'middle' }));
      }

      // the LLM
      var llmStroke = st.llm === 'thinking' ? ['--indigo', 2.5] : st.llm === 'paused' ? ['--haldi', 2.5] : st.llm === 'stopped' ? ['--bad', 2.5] : st.llm === 'finished' ? ['--ok', 2] : ['--line', 1];
      o.push(R(llm, st.llm === 'thinking' ? '--indigo-soft' : '--surface-2', llmStroke[0], llmStroke[1], '', 10));
      var mx = llm.x + llm.w / 2, my = llm.y + llm.h / 2;
      o.push(T(mx, my - 30, 'LLM', { size: nr ? 17 : 19, weight: 700, anchor: 'middle' }));
      var sub = 'the brain: thinks and decides';
      if (textW(sub, 12, 400) > llm.w - 12) sub = 'the brain';
      o.push(T(mx, my - 11, sub, { size: 12, fill: '--muted', anchor: 'middle' }));
      o.push(T(mx, my + 14, 'Step ' + r.steps.length + ' of ' + c.maxSteps, { size: 12.5, weight: 600, anchor: 'middle', mono: true }));
      o.push(T(mx, my + 34, fit(LLM_TEXT[st.llm], llm.w - 12, 12.5, 600), { size: 12.5, weight: 600, anchor: 'middle', fill: st.llm === 'ready' ? '--muted' : '--ink' }));

      // tools, with the wires to the LLM
      var x1 = llm.x + llm.w;
      TOOL_ORDER.forEach(function (t) {
        var b = L.tools[t], y = b.y + b.h / 2, x2 = b.x, onT = c.tools[t];
        var act = st.tool === t ? st.edge : '';
        var col = act === 'out' ? '--indigo' : act === 'back' ? '--series-4' : (act === 'err' || act === 'blocked') ? '--bad' : act === 'held' ? '--haldi' : '--muted';
        var gate = t === 'book_ticket' && c.guard && onT;   // no gate in front of a tool that is switched off
        var gap = x2 - x1, gw = nr ? 18 : Math.min(118, gap - 16), gx = (x1 + x2) / 2;
        var showGateBox = gate && !nr && gw >= 84;
        if (act) {
          if (act === 'held' && gate) {
            var gl = showGateBox ? gx - gw / 2 : gx - 10;
            o.push(line(x1, y, gl - 2, y, col, 3, 1) + head(gl, y, 0, col, 10));
            o.push(line(gl + (showGateBox ? gw : 20), y, x2, y, '--muted', 1.4, 0.5, '4 4'));
          } else {
            o.push(line(x1 + (act === 'out' ? 0 : 3), y, x2 - (act === 'out' ? 3 : 0), y, col, 3, 1));
            o.push(act === 'out' ? head(x2, y, 0, col, 10) : head(x1, y, Math.PI, col, 10));
          }
        } else o.push(line(x1, y, x2, y, '--muted', 1.4, onT ? 0.55 : 0.35, onT ? '' : '4 4'));
        if (gate) {
          var held = act === 'held';
          if (showGateBox) {
            var gb = { x: gx - gw / 2, y: y - 18, w: gw, h: 36 };
            o.push(R(gb, held ? '--haldi-soft' : '--surface', '--haldi', held ? 2.5 : 1.5, '', 7));
            o.push(shield(gb.x + 14, y, 8, '--haldi'));
            o.push(T(gb.x + 27, y - 3, fit('Asks you', gw - 32, 11, 600), { size: 11, weight: 600 }));
            o.push(T(gb.x + 27, y + 11, fit('over ' + inr(c.limit), gw - 32, 11, 400), { size: 11 }));
          } else {
            o.push('<circle cx="' + r1(gx) + '" cy="' + r1(y) + '" r="10" style="fill:var(' + (held ? '--haldi-soft' : '--surface') + ');stroke:var(--haldi);stroke-width:' + (held ? 2.5 : 1.5) + '"/>');
            o.push(shield(gx, y, 6.5, '--haldi'));
          }
        }
        if (act && !nr) {
          var label = act === 'out' ? 'Action (JSON)' : act === 'back' ? 'Observation' : act === 'err' ? 'Error: timed out' : act === 'blocked' ? 'Blocked' : 'Needs your OK';
          var pw = textW(label, 11.5, 600) + 16;
          if (showGateBox) o.push(pill(gx, y - 32, label, col));
          else if (pw <= gap - 8) o.push(pill(gx, y, label, col));
        }
        var lk = toolLook(t, st, L);
        o.push(R(b, lk.fill, lk.stroke, lk.sw, lk.dash));
        o.push(T(b.x + 10, b.y + (nr ? 17 : 19), fit(t, b.w - 18, nr ? 12 : 12.5, 600, true), { size: nr ? 12 : 12.5, weight: 600, mono: true, fill: lk.name }));
        o.push(T(b.x + 10, b.y + (nr ? 33 : 37), fit(lk.text, b.w - 18, nr ? 11.5 : 12, 400), { size: nr ? 11.5 : 12, fill: lk.tc }));
      });

      // tokens read in each step: one slot per allowed step
      var ch = L.chart, n = c.maxSteps, pad = L.pad;
      var slotW = Math.min(nr ? 50 : 58, (W - 2 * pad) / n), bw = Math.max(8, slotW * 0.64);
      var title = nr ? 'Tokens read per step' : 'Tokens the LLM reads in each step (it re-reads everything so far)';
      var right = r.over && r.result === 'stopped' ? 'limit hit: ' + n + (n === 1 ? ' step' : ' steps') : 'limit: ' + n + (n === 1 ? ' step' : ' steps');
      var rightW = textW(right, 12, 600);
      o.push(T(pad, ch.titleY, fit(title, W - 2 * pad - rightW - 14, 12.5, 700), { size: 12.5, weight: 700 }));
      o.push(T(W - pad, ch.titleY, right, { size: 12, weight: 600, anchor: 'end', fill: r.over && r.result === 'stopped' ? '--bad' : '--muted' }));
      var maxV = 1000;
      r.steps.forEach(function (s) { if (s.inTok > maxV) maxV = s.inTok; });
      for (var i = 0; i < n; i++) {
        var sx = pad + i * slotW + (slotW - bw) / 2, s = r.steps[i];
        if (s) {
          var hgt = Math.max(2, s.inTok / maxV * ch.barsH), latest = i === r.steps.length - 1 && !r.over;
          o.push('<rect x="' + r1(sx) + '" y="' + r1(ch.barBase - hgt) + '" width="' + r1(bw) + '" height="' + r1(hgt) + '" rx="2" style="fill:var(--series-1)' + (latest ? ';stroke:var(--ink);stroke-width:1.5' : '') + '"/>');
          var v = s.inTok, lab = slotW >= 40 || v < 1000 ? group(v) : (v / 1000).toFixed(1) + 'k';
          o.push(T(sx + bw / 2, ch.barBase - hgt - 4, lab, { size: nr ? 10 : 10.5, mono: true, anchor: 'middle' }));
        } else {
          o.push('<rect x="' + r1(sx) + '" y="' + r1(ch.barTop) + '" width="' + r1(bw) + '" height="' + r1(ch.barsH) + '" rx="2" style="fill:none;stroke:var(--muted);stroke-width:1;stroke-dasharray:3 3;opacity:.55"/>');
        }
        o.push(T(sx + bw / 2, ch.numY, String(i + 1), { size: 11, anchor: 'middle', fill: '--muted' }));
      }
      o.push(line(pad, ch.barBase + 0.5, pad + n * slotW, ch.barBase + 0.5, '--muted', 1, 0.6));

      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + L.H);
      svg.innerHTML = o.join('');
      svg.setAttribute('aria-label', describe(st));
      updateHistHint();
    }

    /* ---------- inputs ---------- */
    function syncSettingInputs() {
      elLimitOut.textContent = inr(cfg.limit);
      elLimit.setAttribute('aria-valuetext', inr(cfg.limit));
      elLimit.disabled = !cfg.guard;
      elMaxOut.textContent = String(cfg.maxSteps);
    }
    on(elGoal, 'change', function () { cfg.goal = elGoal.value; updateGoalText(); resetRun('settings'); });
    TOOL_ORDER.forEach(function (t) {
      on(toolBoxes[t], 'change', function () { cfg.tools[t] = toolBoxes[t].checked; updateSys(); resetRun('settings'); });
    });
    on(elGuard, 'change', function () { cfg.guard = elGuard.checked; syncSettingInputs(); resetRun('settings'); });
    on(elLimit, 'input', function () { cfg.limit = +elLimit.value; syncSettingInputs(); resetRun('settings'); });
    on(elMax, 'input', function () { cfg.maxSteps = +elMax.value; syncSettingInputs(); resetRun('settings'); });
    on(elFail, 'change', function () { cfg.fail = elFail.checked; resetRun('settings'); });
    Array.prototype.forEach.call(speedBtns, function (b) {
      on(b, 'click', function () {
        speed = b.getAttribute('data-speed');
        Array.prototype.forEach.call(speedBtns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (playing && timer) { clearTimeout(timer); timer = 0; schedule(); }
      });
    });
    on(btnRun, 'click', function () {
      if (run.awaiting) return;
      if (playing) { stopPlaying(); announce('Paused.'); }
      else startPlaying();
      syncUI(); requestDraw();
    });
    on(btnStep, 'click', function () {
      if (run.over || run.awaiting) return;
      stopPlaying();
      advanceStep();
      if (!run.over && !run.awaiting) announce(statusText());
      syncUI(); requestDraw();
    });
    on(btnReset, 'click', function () { resetRun('reset'); });
    on(traceBox, 'click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-decide]') : null;
      if (b && traceBox.contains(b)) decide(b.getAttribute('data-decide'));
    });

    /* ---------- theme, fonts, resize ---------- */
    function onTheme() { requestDraw(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', onTheme); else if (mql.addListener) mql.addListener(onTheme); }
    on(document, 'themechange', onTheme);
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(function () { requestDraw(); }, function () { /* ignore */ });
    function onResize() {
      if (destroyed) return;
      var W = Math.round(wrap.clientWidth);
      if (W === dimsW || W < 120) return;
      dimsW = W;
      // resizing the wrapper inside a ResizeObserver callback would loop, so a height change waits one frame
      if (Math.abs(wrap.offsetHeight - (layoutFor(W).H + 2)) > 0.5) {
        if (!sizeRaf) sizeRaf = requestAnimationFrame(function () { sizeRaf = 0; drawDiagram(); });
      } else drawDiagram();
    }
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(wrap); }
    else on(window, 'resize', onResize);

    /* ---------- start: the example run, already finished ---------- */
    elGoal.value = cfg.goal;
    updateGoalText(); updateSys(); syncSettingInputs();
    run = newRun(cloneCfg(cfg), DATE);
    run.example = true;
    for (var guard = 0; guard < 200 && advance(); guard++) { /* show the whole example */ }
    traceBox.scrollTop = 0;
    syncUI();
    drawDiagram();

    return {
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        stopPlaying();
        if (rafId) cancelAnimationFrame(rafId);
        if (sizeRaf) cancelAnimationFrame(sizeRaf);
        if (liveTimer) clearTimeout(liveTimer);
        rafId = 0; sizeRaf = 0; liveTimer = 0;
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners.length = 0;
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', onTheme); else if (mql.removeListener) mql.removeListener(onTheme); }
        if (ro) ro.disconnect();
        if (top.parentNode) top.parentNode.removeChild(top);
      }
    };
  }

  Labs.agent = {
    id: 'agent',
    module: 'l4-agents',
    title: 'AI agent loop simulator',
    summary: 'Watch a pretend AI agent think, call tools and loop towards a goal, and see how tools, a step limit and a human-approval guardrail change what it does.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
