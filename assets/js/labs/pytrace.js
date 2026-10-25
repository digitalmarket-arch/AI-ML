/* AI Marg lab: Step through Python. Five short programs replayed one line at a time, in the style of Python Tutor:
   the code (the line that just ran is shaded, an arrow marks the line that runs next), every frame (set of names)
   with its values, lists and functions drawn as their own boxes with arrows from the names that point at them,
   and the printed output so far. No Python runs in the browser: each trace below is written out by hand, one step
   per line event, and was checked against real CPython 3 (sys.settrace), so the order of lines and every value
   is exactly what Python does.
   Plain classic script (ES2019). Registers window.AILabs.pytrace. No libraries, no network, no storage. */
(function () {
  'use strict';
  var Labs = (window.AILabs = window.AILabs || {});
  var mountCount = 0;

  var TASKS = [
    { id: 't1', text: 'Step through program 2 (the for loop) one line at a time, all the way to the final bill.' },
    { id: 't2', text: 'In program 4, watch a function frame appear when add_gst is called, then step on until it is thrown away when the function returns.' },
    { id: 't3', text: 'Spot aliasing: in program 5, find the step where changing same also changes cart, and press “cart changed on this step”.' },
    { id: 't4', text: 'Predict before you step: answer 3 prediction questions correctly.' }
  ];

  /* ---------- the programs and their traces ----------
     Each step is [line that just ran, line that runs next, changes, explanation]; null means none
     (nothing has run yet, or the program has finished).
     Changes, applied in order to the state of the step before:
       ['v', name, value]          set a name in the running (innermost) frame
       ['list', id, [items]]       build a list object        ['app', id, value]   append to that list
       ['fn', id, name, params]    build a function object
       ['push', name]              a call starts: open a new frame
       ['ret', value]              the frame is returning this value
       ['pop']                     the call has finished: throw its frame away
       ['out', text]               print one line
     Values are written the way Python shows them; '@L1' means "points at object L1".
     Step k+1 is the state at the next line event of real Python (or at a return), so a step that runs no line
     of its own never appears, and a for line shows up once per item plus once more when the items run out. */
  var PROGRAMS = [
    {
      id: 'vars',
      title: '1. Shop bill (variables)',
      desc: 'A shop bill. Names (variables) hold values, and a name can be given a new value later.',
      code: [
        'item = "Notebook"',
        'price = 40',
        'qty = 3',
        'bill = price * qty',
        'print(item, "bill (₹):", bill)',
        'price = 35',
        'print("New price:", price)',
        'print("Bill:", bill)',
        'bill = price * qty',
        'print("New bill (₹):", bill)'
      ],
      steps: [
        [null, 1, [], 'Nothing has run yet. The arrow points at line 1, the first line Python will run. Press Next to run it.'],
        [1, 2, [['v', 'item', '"Notebook"']], 'Line 1 ran: Python made a name, `item`, and gave it the text `"Notebook"`. Text in quotes is called a string.'],
        [2, 3, [['v', 'price', '40']], 'Line 2 ran: `price` now holds the whole number 40 (an int, short for integer).'],
        [3, 4, [['v', 'qty', '3']], 'Line 3 ran: `qty` (short for quantity) holds 3.'],
        [4, 5, [['v', 'bill', '120']], 'Line 4 ran: Python worked out the right-hand side first, `price * qty` = 40 × 3 = 120, then stored 120 in a new name, `bill`.'],
        [5, 6, [['out', 'Notebook bill (₹): 120']], 'Line 5 ran: `print()` wrote its three values to the Output box, with a space between each.'],
        [6, 7, [['v', 'price', '35']], 'Line 6 ran: `price` now holds 35, and the old 40 is gone. Giving a name a new value is called reassignment.'],
        [7, 8, [['out', 'New price: 35']], 'Line 7 ran: it printed the new price.'],
        [8, 9, [['out', 'Bill: 120']], 'Line 8 ran: `bill` is still 120. It was worked out on line 4, and it does not update by itself when `price` changes.'],
        [9, 10, [['v', 'bill', '105']], 'Line 9 ran: the sum was worked out again with the new price, 35 × 3 = 105, and 105 replaced the old `bill`.'],
        [10, null, [['out', 'New bill (₹): 105']], 'Line 10 ran: it printed the new bill. The program has finished.']
      ],
      q: {
        3: { text: 'Line 4 runs next. What will `bill` be after it runs?', opts: ['43', '120', '40', 'The words `price * qty`'], a: 1,
          why: '`*` means multiply, so Python works out 40 × 3 = 120 and gives that number the name `bill`. (43 would be 40 + 3.)' },
        7: { text: '`price` is now 35. What will line 8 print?', opts: ['`Bill: 105`', '`Bill: 35`', '`Bill: 120`', 'An error'], a: 2,
          why: '`bill` was worked out on line 4, when `price` was 40. Changing `price` later does not redo that sum: `bill` only changes when line 9 works it out again.' }
      }
    },
    {
      id: 'loop',
      title: '2. Adding up prices (for loop)',
      desc: 'A for loop adds up a list of prices, repeating the same lines once for each item.',
      code: [
        'prices = [120, 45, 60, 30]',
        'total = 0',
        'for p in prices:',
        '    total = total + p',
        '    print("So far:", total)',
        'print("Bill (₹):", total)'
      ],
      steps: [
        [null, 1, [], 'Nothing has run yet. Line 1 runs next.'],
        [1, 2, [['list', 'L1', ['120', '45', '60', '30']], ['v', 'prices', '@L1']], 'Line 1 ran: `prices` is a list (an ordered collection of values) holding four prices in rupees. A list is drawn as a row of boxes, numbered from 0, with an arrow from its name.'],
        [2, 3, [['v', 'total', '0']], 'Line 2 ran: `total` starts at 0, ready to be added to.'],
        [3, 4, [['v', 'p', '120']], 'Line 3 ran: the loop took the first item from `prices`, so `p` is 120. The indented lines 4 and 5 (the loop body) run once for each item.'],
        [4, 5, [['v', 'total', '120']], 'Line 4 ran: Python worked out `total + p` = 0 + 120 = 120, and the answer replaced the old `total`.'],
        [5, 3, [['out', 'So far: 120']], 'Line 5 ran: it printed the running total. That is the end of the loop body, so Python goes back up to line 3.'],
        [3, 4, [['v', 'p', '45']], 'Line 3 ran again: `p` moved on to the next item, 45.'],
        [4, 5, [['v', 'total', '165']], 'Line 4 ran: `total` = 120 + 45 = 165.'],
        [5, 3, [['out', 'So far: 165']], 'Line 5 ran: it printed 165. Back to line 3.'],
        [3, 4, [['v', 'p', '60']], 'Line 3 ran: `p` is now 60, the third item.'],
        [4, 5, [['v', 'total', '225']], 'Line 4 ran: `total` = 165 + 60 = 225.'],
        [5, 3, [['out', 'So far: 225']], 'Line 5 ran: it printed 225. Back to line 3.'],
        [3, 4, [['v', 'p', '30']], 'Line 3 ran: `p` is now 30, the last item.'],
        [4, 5, [['v', 'total', '255']], 'Line 4 ran: `total` = 225 + 30 = 255.'],
        [5, 3, [['out', 'So far: 255']], 'Line 5 ran: it printed 255. Back to line 3 once more.'],
        [3, 6, [], 'Line 3 ran: there were no items left, so the loop finished. `p` keeps its last value, 30, and Python jumps to line 6, the first line after the loop.'],
        [6, null, [['out', 'Bill (₹): 255']], 'Line 6 ran: it printed the final bill, ₹255. The program has finished.']
      ],
      q: {
        2: { text: 'Line 3 starts the loop. What will `p` be after it runs?', opts: ['120', '`[120, 45, 60, 30]`', '0', '4'], a: 0,
          why: '`for p in prices:` hands out the items one at a time, starting with the first. `p` is a name for the current item, not for the whole list.' },
        6: { text: '`p` is 45 and `total` is 120. What will `total` be after line 4 runs?', opts: ['45', '120', '90', '165'], a: 3,
          why: '`total + p` is 120 + 45 = 165, and that new value replaces the old `total`. This is how a loop keeps a running sum.' },
        14: { text: 'All four prices have been added. What happens when line 3 runs again?', opts: ['`p` goes back to 120 and the loop starts again', 'The loop ends, and Python jumps to line 6', '`p` becomes 0', 'Python shows an error'], a: 1,
          why: 'There is no fifth item, so the for loop is finished. `p` keeps its last value, 30, and Python carries on with the first line after the loop.' }
      }
    },
    {
      id: 'grade',
      title: '3. Grading marks (if, elif, else)',
      desc: 'Python checks each test from the top and runs only the first branch whose test is True.',
      code: [
        'class_marks = [92, 67, 28]',
        'for marks in class_marks:',
        '    if marks >= 90:',
        '        grade = "A"',
        '    elif marks >= 60:',
        '        grade = "B"',
        '    elif marks >= 35:',
        '        grade = "C"',
        '    else:',
        '        grade = "Fail"',
        '    print(marks, "->", grade)',
        'print("Report done")'
      ],
      steps: [
        [null, 1, [], 'Nothing has run yet. Line 1 runs next.'],
        [1, 2, [['list', 'L1', ['92', '67', '28']], ['v', 'class_marks', '@L1']], 'Line 1 ran: `class_marks` is a list of three students’ marks.'],
        [2, 3, [['v', 'marks', '92']], 'Line 2 ran: the loop took the first student’s marks, so `marks` is 92.'],
        [3, 4, [], 'Line 3 ran: Python checked `marks >= 90` (is 92 at least 90?). That is True, so Python goes into this branch, to line 4.'],
        [4, 11, [['v', 'grade', '"A"']], 'Line 4 ran: `grade` is `"A"`. Once one branch has run, Python skips every elif and else below it, so it jumps to line 11.'],
        [11, 2, [['out', '92 -> A']], 'Line 11 ran: it printed the result. Back to line 2 for the next student.'],
        [2, 3, [['v', 'marks', '67']], 'Line 2 ran: `marks` is now 67.'],
        [3, 5, [], 'Line 3 ran: `67 >= 90` is False, so Python skips line 4 and checks the elif on line 5.'],
        [5, 6, [], 'Line 5 ran: `67 >= 60` is True, so line 6 runs next.'],
        [6, 11, [['v', 'grade', '"B"']], 'Line 6 ran: `grade` is now `"B"`. Python skips the remaining branches and jumps to line 11.'],
        [11, 2, [['out', '67 -> B']], 'Line 11 ran: it printed the result. Back to line 2.'],
        [2, 3, [['v', 'marks', '28']], 'Line 2 ran: `marks` is now 28. Notice that `grade` still holds `"B"` from the last student, until a branch replaces it.'],
        [3, 5, [], 'Line 3 ran: `28 >= 90` is False, so on to line 5.'],
        [5, 7, [], 'Line 5 ran: `28 >= 60` is False, so on to line 7.'],
        [7, 10, [], 'Line 7 ran: `28 >= 35` is False too. No test was True, so the else branch runs. (The `else:` line has nothing to check, so Python goes straight to line 10.)'],
        [10, 11, [['v', 'grade', '"Fail"']], 'Line 10 ran: `grade` is now `"Fail"`.'],
        [11, 2, [['out', '28 -> Fail']], 'Line 11 ran: it printed the result. Back to line 2.'],
        [2, 12, [], 'Line 2 ran: there are no students left, so the loop finished. Python jumps to line 12.'],
        [12, null, [['out', 'Report done']], 'Line 12 ran: it printed the last message. The program has finished.']
      ],
      q: {
        6: { text: '`marks` is 67. What will `grade` be after this trip round the loop?', opts: ['`"A"`', '`"B"`', '`"C"`', '`"Fail"`'], a: 1,
          why: '`67 >= 90` is False, so Python moves on to the elif: `67 >= 60` is True. It sets `grade = "B"` and skips every branch below.' },
        11: { text: '`marks` is 28. Which line will set `grade` this time?', opts: ['Line 8: `grade = "C"`', 'None: `grade` stays `"B"`', 'Line 6: `grade = "B"`', 'Line 10: `grade = "Fail"`'], a: 3,
          why: '28 fails all three tests (>= 90, >= 60 and >= 35), so the else branch runs line 10. Until then, `grade` still shows `"B"`.' }
      }
    },
    {
      id: 'func',
      title: '4. GST calculator (a function call)',
      desc: 'A function that adds GST (a tax) to a price. Each call gets a fresh frame, which is thrown away when the function returns.',
      code: [
        'def add_gst(price, rate):',
        '    tax = price * rate / 100',
        '    total = price + tax',
        '    return total',
        '',
        'lunch = add_gst(500, 5)',
        'charger = add_gst(200, 18)',
        'print("Lunch (₹):", lunch)',
        'print("Charger (₹):", charger)'
      ],
      steps: [
        [null, 1, [], 'Nothing has run yet. Line 1 runs next.'],
        [1, 6, [['fn', 'F1', 'add_gst', 'price, rate'], ['v', 'add_gst', '@F1']], 'Line 1 ran: `def` created a function called `add_gst` and stored it under that name. Its body (lines 2 to 4) does not run yet, so Python jumps to line 6.'],
        [6, 2, [['push', 'add_gst'], ['v', 'price', '500'], ['v', 'rate', '5']], 'Line 6 called `add_gst(500, 5)`. Python made a new frame (a fresh set of names, just for this call) and put 500 in `price` and 5 in `rate`. `lunch` has to wait until the function returns.'],
        [2, 3, [['v', 'tax', '25.0']], 'Line 2 ran inside the function: `tax` = 500 * 5 / 100 = 25.0. Dividing with `/` always gives a decimal number (a float), so it shows 25.0, not 25.'],
        [3, 4, [['v', 'total', '525.0']], 'Line 3 ran: `total` = 500 + 25.0 = 525.0.'],
        [4, 6, [['ret', '525.0']], 'Line 4 ran: `return` sends 525.0 back to line 6, where the function was called. This frame is about to be thrown away.'],
        [6, 7, [['pop'], ['v', 'lunch', '525.0']], 'Back on line 6: the returned 525.0 was stored in `lunch`. The `add_gst` frame, with `price`, `rate`, `tax` and `total`, is gone.'],
        [7, 2, [['push', 'add_gst'], ['v', 'price', '200'], ['v', 'rate', '18']], 'Line 7 called `add_gst(200, 18)`: a brand-new frame, with `price` = 200 and `rate` = 18. Nothing is left over from the first call.'],
        [2, 3, [['v', 'tax', '36.0']], 'Line 2 ran: `tax` = 200 * 18 / 100 = 36.0.'],
        [3, 4, [['v', 'total', '236.0']], 'Line 3 ran: `total` = 200 + 36.0 = 236.0.'],
        [4, 7, [['ret', '236.0']], 'Line 4 ran: `return` sends 236.0 back to line 7.'],
        [7, 8, [['pop'], ['v', 'charger', '236.0']], 'Back on line 7: `charger` is 236.0, and the second frame is gone too.'],
        [8, 9, [['out', 'Lunch (₹): 525.0']], 'Line 8 ran: it printed the lunch bill.'],
        [9, null, [['out', 'Charger (₹): 236.0']], 'Line 9 ran: it printed the charger bill. The program has finished.']
      ],
      q: {
        1: { text: 'Line 6 calls `add_gst(500, 5)`. What appears in Frames and objects when the call starts?', opts: ['`lunch = 525.0` in the Global frame', 'A new frame for `add_gst`, with `price` = 500 and `rate` = 5', 'Nothing: functions have no names of their own', 'A copy of the Global frame'], a: 1,
          why: 'Every call gets its own fresh frame. The values in the brackets, 500 and 5, are put into the function’s parameters (its input names), `price` and `rate`. `lunch` is only set after the function returns.' },
        2: { text: 'What will `tax` be after line 2 runs?', opts: ['2500', '505', '25.0', '0.05'], a: 2,
          why: '500 * 5 = 2500, then / 100 gives 25.0. In Python, `/` always gives a float (a decimal number), even when the answer is a whole number.' },
        5: { text: '`add_gst` is returning 525.0. What happens to its frame?', opts: ['Its names move into the Global frame', 'It stays until the program ends', 'It is kept for the next call', 'It is thrown away; only the returned 525.0 is kept, in `lunch`'], a: 3,
          why: 'When a function returns, its frame and every name inside it disappear. The next call, on line 7, starts with a brand-new frame.' },
        6: { text: 'Line 7 runs next. What will `charger` be?', opts: ['236.0', '218.0', '3600.0', '525.0'], a: 0,
          why: '200 * 18 / 100 = 36.0 of tax, plus the price of 200, gives 236.0. (218.0 would add the rate itself instead of the tax.)' }
      }
    },
    {
      id: 'alias',
      title: '5. Shared shopping cart (lists)',
      desc: 'Two names can point at one list. Change the list through one name, and the other name sees the change too.',
      code: [
        'cart = [250, 40]',
        'same = cart',
        'same.append(99)',
        'print("cart:", cart)',
        'clone = cart.copy()',
        'clone.append(500)',
        'print("cart:", cart)',
        'print("clone:", clone)',
        'print(same is cart)',
        'print(clone is cart)'
      ],
      steps: [
        [null, 1, [], 'Nothing has run yet. Line 1 runs next.'],
        [1, 2, [['list', 'L1', ['250', '40']], ['v', 'cart', '@L1']], 'Line 1 ran: Python built a list, [250, 40], and pointed the name `cart` at it.'],
        [2, 3, [['v', 'same', '@L1']], 'Line 2 ran: `same = cart` did not copy anything. `same` now points at the very same list as `cart`: two arrows, one box.'],
        [3, 4, [['app', 'L1', '99']], 'Line 3 ran: 99 was added to the list through the name `same`. Both arrows lead to that one box, so `cart` has changed too. One object with two names is called aliasing.'],
        [4, 5, [['out', 'cart: [250, 40, 99]']], 'Line 4 ran: printing `cart` shows the 99, even though line 3 never mentioned `cart`.'],
        [5, 6, [['list', 'L2', ['250', '40', '99']], ['v', 'clone', '@L2']], 'Line 5 ran: `cart.copy()` built a second, separate list with the same items, and `clone` points at it.'],
        [6, 7, [['app', 'L2', '500']], 'Line 6 ran: 500 was added to `clone`’s list only. The box that `cart` points at did not change.'],
        [7, 8, [['out', 'cart: [250, 40, 99]']], 'Line 7 ran: `cart` has no 500.'],
        [8, 9, [['out', 'clone: [250, 40, 99, 500]']], 'Line 8 ran: `clone` has the 500.'],
        [9, 10, [['out', 'True']], 'Line 9 ran: `same is cart` is True, because both names point at one list. (`is` asks: is this the very same object?)'],
        [10, null, [['out', 'False']], 'Line 10 ran: `clone is cart` is False. `clone` started as a copy with the same items, but it is a different list. The program has finished.']
      ],
      q: {
        2: { text: 'Line 3 adds 99 through the name `same`. What will `cart` hold after it runs?', opts: ['`[250, 40]`, no change', '`[250, 40, 99]`', '`[99]`', '`[250, 40, 99, 99]`'], a: 1,
          why: '`same = cart` did not copy the list: it gave the same list a second name. Both arrows point at one box, so a change made through `same` shows up through `cart` too. This is called aliasing.' },
        5: { text: 'Line 6 adds 500 to `clone`. Will `cart` change this time?', opts: ['Yes, `cart` gets 500 too', 'Only `same` gets 500', 'No, `clone` is a separate list', 'Python shows an error'], a: 2,
          why: '`cart.copy()` built a brand-new list. Look at the arrows: `clone` points at a different box, so changing it leaves `cart` (and `same`) alone.' },
        8: { text: 'What will line 9, `print(same is cart)`, show?', opts: ['True', 'False', '`[250, 40, 99]`', '`same`'], a: 0,
          why: '`is` asks whether two names point at the very same object. `same` and `cart` share one list, so it prints True. Line 10 will print False: `clone` is a different list, a copy.' }
      },
      // the "spot aliasing" challenge: the step right after same.append(99) has run
      spot: 3,
      spotWhy: {
        0: 'Nothing has run yet, so nothing has changed. Press Next.',
        1: 'Line 1 created `cart`, and it says `cart` itself, so that is not a hidden change. Keep stepping.',
        2: 'Close! Line 2 gave the list a second name, but look inside the box: it still holds [250, 40]. Nothing in it has changed yet.',
        4: 'Too far: this step only printed `cart`. Printing never changes a list. Where did the 99 come from?',
        5: 'Line 5 built a new list for `clone`. The box that `cart` points at is the same as before.',
        6: 'Line 6 changed the list that `clone` points at, not the one `cart` points at. Follow the arrows.',
        other: 'This line only prints. Printing never changes a list. Step back to find where the 99 arrived.',
        found: 'Found it! Line 3 never mentions `cart`, yet `cart` now holds 99, because `same` and `cart` point at one list.'
      }
    }
  ];

  /* ---------- turn each trace into a full state per step ---------- */
  function cloneFrames(fr) {
    return fr.map(function (f) { var c = { name: f.name, vars: f.vars.map(function (v) { return [v[0], v[1]]; }) }; if (f.ret != null) c.ret = f.ret; return c; });
  }
  function cloneHeap(h) {
    var c = {};
    Object.keys(h).forEach(function (id) {
      var o = h[id];
      c[id] = o.type === 'list' ? { type: 'list', items: o.items.slice() } : { type: 'function', name: o.name, params: o.params };
    });
    return c;
  }
  function buildStates(prog) {
    var frames = [{ name: 'Global frame', vars: [] }], heap = {}, order = [], out = [], states = [];
    prog.steps.forEach(function (s, k) {
      s[2].forEach(function (op) {
        var f = frames[frames.length - 1];
        if (op[0] === 'v') {
          var hit = -1;
          for (var i = 0; i < f.vars.length; i++) if (f.vars[i][0] === op[1]) hit = i;
          if (hit >= 0) f.vars[hit][1] = op[2]; else f.vars.push([op[1], op[2]]);
        } else if (op[0] === 'list') { heap[op[1]] = { type: 'list', items: op[2].slice() }; order.push(op[1]); }
        else if (op[0] === 'fn') { heap[op[1]] = { type: 'function', name: op[2], params: op[3] }; order.push(op[1]); }
        else if (op[0] === 'app') heap[op[1]].items.push(op[2]);
        else if (op[0] === 'push') frames.push({ name: op[1], vars: [] });
        else if (op[0] === 'ret') f.ret = op[1];
        else if (op[0] === 'pop') frames.pop();
        else if (op[0] === 'out') out.push(op[1]);
      });
      states.push({ k: k, ran: s[0], next: s[1], note: s[3], frames: cloneFrames(frames), heap: cloneHeap(heap), order: order.slice(), out: out.slice() });
    });
    return states;
  }
  var STATES = PROGRAMS.map(buildStates);

  /* ---------- small helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  // `name` in the copy becomes <code>name</code>
  function rich(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>'); }
  function plain(s) { return String(s).replace(/`/g, ''); }
  function isRef(v) { return typeof v === 'string' && v.charAt(0) === '@'; }
  function r1(v) { return Math.round(v * 10) / 10; }

  // tiny Python highlighter: keywords, print, strings (colours come from the theme)
  var KW = { 'def': 1, 'return': 1, 'for': 1, 'in': 1, 'if': 1, 'elif': 1, 'else': 1, 'is': 1, 'and': 1, 'or': 1, 'not': 1, 'True': 1, 'False': 1, 'None': 1, 'while': 1 };
  function highlight(line) {
    var html = '', m, re = /("[^"]*")|([A-Za-z_][A-Za-z0-9_]*)|([\s\S])/g;
    while ((m = re.exec(line))) {
      if (m[1]) html += '<span style="color:var(--haldi-ink)">' + esc(m[1]) + '</span>';
      else if (m[2] && KW[m[2]]) html += '<span style="color:var(--indigo);font-weight:700">' + m[2] + '</span>';
      else if (m[2] === 'print') html += '<span style="color:var(--indigo)">print</span>';
      else html += esc(m[0]);
    }
    return html;
  }

  // markers used in the code box and the legend (drawn shapes, so they never depend on text contrast)
  var SVG_RAN = '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="display:block"><path d="M3 1.8 L12.2 7 L3 12.2 Z" style="fill:var(--haldi-ink)"/></svg>';
  var SVG_NEXT = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" style="display:block"><path d="M1.5 7 H11 M7.2 3.2 L11 7 L7.2 10.8" style="fill:none;stroke:var(--indigo);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"/></svg>';

  /* ---------- drawing sizes for the Frames and objects picture (CSS pixels) ---------- */
  var SZ = { pad: 10, top: 28, titleH: 26, rowH: 28, fgap: 12, ogap: 14, labelH: 15, cellH: 32, font: 13, fnFont: 12.5 };
  var STY = {
    head: 'fill:var(--muted);font:700 11px var(--font-body);letter-spacing:.07em',
    title: 'fill:var(--ink);font:700 13px var(--font-body)',
    titleMono: 'fill:var(--ink);font:700 13px var(--font-mono)',
    status: 'fill:var(--muted);font:400 12px var(--font-body)',
    name: 'fill:var(--ink);font:400 13px var(--font-mono)',
    retName: 'fill:var(--ink);font:400 12px var(--font-body)',
    val: 'fill:var(--ink);font:400 13px var(--font-mono)',
    idx: 'fill:var(--muted);font:400 10px var(--font-mono)',
    small: 'fill:var(--muted);font:400 11px var(--font-body)',
    note: 'fill:var(--muted);font:400 12px var(--font-body)',
    empty: 'fill:var(--muted);font:italic 400 12px var(--font-body)'
  };

  /* ================================================================ */
  function mount(root, ctx) {
    var P = 'pt' + (++mountCount) + '-';
    var listeners = [];
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); }
    var destroyed = false;
    var sayTimer = 0, heightRaf = 0, layoutRaf = 0;

    var progOpts = PROGRAMS.map(function (p, i) { return '<option value="' + i + '">' + esc(p.title) + '</option>'; }).join('');
    var tasksHtml = TASKS.map(function (t) { return '<li data-task="' + t.id + '">' + esc(t.text) + '</li>'; }).join('');
    var legendRow = function (sw, text) { return '<li style="display:flex;align-items:center;gap:8px;margin:0">' + sw + '<span>' + text + '</span></li>'; };
    var swBox = function (inner, style) { return '<span aria-hidden="true" style="flex:none;width:30px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;' + style + '">' + inner + '</span>'; };

    var topEl = document.createElement('div');
    topEl.className = 'lab';
    topEl.innerHTML =
      '<p class="lab-note"><strong>What you are seeing:</strong> a short Python program replayed one line at a time, like a slow-motion replay in cricket. ' +
        'In the <em>Code</em> box, the shaded line has just run and the arrow points at the line Python will run next. ' +
        '<em>Frames and objects</em> shows every name (variable) Python knows at this moment, and its value. A <em>frame</em> is one set of names: the Global frame for the main program, plus a fresh frame each time a function is called. ' +
        'Lists and functions are <em>objects</em> with boxes of their own, and an arrow runs from each name to the object it points at. ' +
        '<em>Output</em> shows what print() has written so far, and yellow marks whatever the last line changed. Every step matches what real Python 3 does.</p>' +
      '<div class="lab-body" id="' + P + 'body">' +
        '<div class="stack" id="' + P + 'left">' +
          '<div id="' + P + 'stage" style="display:flex;flex-wrap:wrap;gap:16px 20px;align-items:flex-start">' +
            '<div class="stack-sm" style="flex:1 1 300px;min-width:0">' +
              '<h2 class="lab-h">Code</h2>' +
              '<div id="' + P + 'code" role="region" tabindex="0" aria-label="Python code" style="overflow-x:auto;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:6px 0;font-family:var(--font-mono);font-size:clamp(12.5px,3.5vw,14px);line-height:1.75;outline-offset:-3px">' +
                '<div id="' + P + 'lines" style="min-width:max-content"></div></div>' +
              '<div class="row" style="gap:8px">' +
                '<button type="button" class="btn" id="' + P + 'back"><span aria-hidden="true">←</span> Back</button>' +
                '<button type="button" class="btn btn-primary" id="' + P + 'next">Next <span aria-hidden="true">→</span></button>' +
                '<button type="button" class="btn btn-sm btn-ghost" id="' + P + 'restart" style="margin-left:auto">Start again</button>' +
              '</div>' +
              '<div class="control"><label for="' + P + 'step">Step <output id="' + P + 'stepout" for="' + P + 'step"></output></label>' +
                '<input type="range" id="' + P + 'step" min="1" max="2" step="1" value="1"></div>' +
              '<div class="callout callout-indigo" id="' + P + 'say" style="font-size:.96rem"></div>' +
              '<div class="q stack-sm" id="' + P + 'q" hidden></div>' +
              '<div class="card-flat stack-sm" id="' + P + 'spot" hidden>' +
                '<p class="small" style="margin:0"><strong>Challenge:</strong> one line changes <code>cart</code> without ever using the name <code>cart</code>. Step to just after that line has run, then press the button.</p>' +
                '<div class="row"><button type="button" class="btn btn-sm" id="' + P + 'spotbtn">cart changed on this step</button></div>' +
                '<p class="small" id="' + P + 'spotmsg" style="margin:0" hidden></p>' +
              '</div>' +
            '</div>' +
            '<div class="stack-sm" style="flex:1.3 1 330px;min-width:0">' +
              '<h2 class="lab-h">Frames and objects</h2>' +
              '<div class="lab-canvas-wrap" id="' + P + 'wrap" style="aspect-ratio:auto;height:240px">' +
                '<svg id="' + P + 'svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frames and objects" preserveAspectRatio="xMinYMin meet" style="touch-action:auto"></svg></div>' +
              '<h2 class="lab-h">Output</h2>' +
              '<pre class="console" id="' + P + 'out" style="margin:0"></pre>' +
            '</div>' +
          '</div>' +
          '<div class="lab-stats" style="grid-template-columns:repeat(auto-fit,minmax(128px,1fr))">' +
            '<div class="stat"><div class="k">Just ran</div><div class="v" id="' + P + 'sran">—</div></div>' +
            '<div class="stat"><div class="k">Runs next</div><div class="v" id="' + P + 'snext">—</div></div>' +
            '<div class="stat"><div class="k">Frames</div><div class="v" id="' + P + 'sfr">1</div></div>' +
            '<div class="stat"><div class="k">Predictions right</div><div class="v" id="' + P + 'sq">0 of 0</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="lab-controls" id="' + P + 'controls">' +
          '<div class="control" id="' + P + 'progctl"><label for="' + P + 'prog">Program</label>' +
            '<select id="' + P + 'prog" style="width:100%">' + progOpts + '</select>' +
            '<p class="small muted" id="' + P + 'desc" style="margin:0"></p></div>' +
          '<div class="control"><label for="' + P + 'ask" style="justify-content:flex-start;align-items:center;gap:10px">' +
            '<input type="checkbox" id="' + P + 'ask" checked> Ask me to predict at key steps</label></div>' +
          '<div class="stack-sm"><h2 class="lab-h">How to read it</h2>' +
            '<ul class="small" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">' +
              legendRow(swBox(SVG_RAN, 'background:var(--haldi-soft);box-shadow:inset 3px 0 0 var(--haldi)'), 'The line that just ran') +
              legendRow(swBox(SVG_NEXT, 'box-shadow:inset 3px 0 0 var(--indigo)'), 'The line that runs next') +
              legendRow(swBox('', 'background:var(--haldi-soft);border:1.5px solid var(--haldi);height:16px;width:26px;margin:0 2px'), 'A value the last line changed') +
              legendRow(swBox('<svg width="30" height="12" viewBox="0 0 30 12" aria-hidden="true" focusable="false"><circle cx="4" cy="6" r="3.2" style="fill:var(--indigo)"/><path d="M4 6 H22" style="stroke:var(--indigo);stroke-width:1.7"/><path d="M29 6 L21 1.8 L21 10.2 Z" style="fill:var(--indigo)"/></svg>', ''), 'An arrow: this name points at that object') +
            '</ul></div>' +
          '<p class="kbd-hint">Keyboard: press → for the next step and ← for the step before, while the focus is on the code or a button in this lab. The step slider also takes Home and End.</p>' +
          '<div class="stack-sm"><h2 class="lab-h">Your tasks</h2><ul class="lab-tasks" id="' + P + 'tasks">' + tasksHtml + '</ul></div>' +
        '</div>' +
      '</div>' +
      '<p class="small muted"><strong style="color:var(--ink)">Why it matters in real ML:</strong> ML code is ordinary Python: training loops are for loops, each stage of a pipeline is a function, and data is passed around in lists and arrays. ' +
        'A classic bug is aliasing: you write <code>b = a</code> to “copy” your data, clean <code>b</code>, and quietly change <code>a</code>, your original data, too. Stepping through code like this is how programmers catch such bugs.</p>' +
      '<p class="visually-hidden" role="status" aria-live="polite" id="' + P + 'live"></p>';
    root.innerHTML = '';
    root.appendChild(topEl);

    function $(id) { return topEl.querySelector('#' + P + id); }
    var body = $('body'), leftCol = $('left'), controls = $('controls'), progCtl = $('progctl');
    var elCode = $('code'), elLines = $('lines'), btnBack = $('back'), btnNext = $('next'), btnRestart = $('restart');
    var elStep = $('step'), elStepOut = $('stepout'), elSay = $('say'), elQ = $('q'), elSpot = $('spot'), btnSpot = $('spotbtn'), elSpotMsg = $('spotmsg');
    var wrap = $('wrap'), svg = $('svg'), elOut = $('out'), elLive = $('live');
    var elSRan = $('sran'), elSNext = $('snext'), elSFr = $('sfr'), elSQ = $('sq');
    var elProg = $('prog'), elDesc = $('desc'), elAsk = $('ask');
    var taskEls = {};
    Array.prototype.forEach.call(topEl.querySelectorAll('[data-task]'), function (li) { taskEls[li.getAttribute('data-task')] = li; });

    /* ---------- state ---------- */
    // The lab opens on program 1 with its first line already run, so every part of the picture has something in it.
    var S = { prog: 0, step: 1, ask: true };
    var pos = PROGRAMS.map(function (p, i) { return i === 0 ? 1 : 0; });   // where each program was left
    var visited = PROGRAMS.map(function () { return {}; });
    var maxSeen = PROGRAMS.map(function () { return -1; });                 // a question only counts before its result was seen
    var answers = {}, nudged = {}, score = { right: 0, answered: 0 };
    var spotText = '', done = {};
    var G = null, codeRows = [], frameH = 240;
    function markVisited(p, s) { visited[p][s] = true; if (s > maxSeen[p]) maxSeen[p] = s; }
    markVisited(0, 1);

    /* ---------- tasks ---------- */
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
    var taskNote = '';
    function completeTask(id) {
      if (done[id]) return;
      done[id] = true;
      markLi(id);
      taskNote = 'Task done: ' + TASKS.filter(function (t) { return t.id === id; })[0].text;
      if (ctx && ctx.onTaskDone) ctx.onTaskDone(id);
    }
    function countVisited(p) { return Object.keys(visited[p]).length; }
    function checkStepTasks(old, n) {
      var prog = PROGRAMS[S.prog], states = STATES[S.prog], last = states.length - 1;
      // t1: the loop program walked to its end without skipping more than a step or two
      if (prog.id === 'loop' && n === last && countVisited(S.prog) >= states.length - 2) completeTask('t1');
      // t2: one step forward that throws a call frame away, after the step that created that frame was seen
      if (prog.id === 'func' && n === old + 1 && states[n].frames.length < states[old].frames.length) {
        var c = old;
        while (c > 0 && states[c].frames.length <= states[c - 1].frames.length) c--;
        if (c > 0 && visited[S.prog][c]) completeTask('t2');
      }
    }

    /* ---------- live announcements (step changes are announced once the stepping pauses) ---------- */
    function announce(s) { elLive.textContent = s; }
    function sayLater() {
      if (sayTimer) clearTimeout(sayTimer);
      sayTimer = setTimeout(function () {
        sayTimer = 0;
        if (destroyed) return;
        var st = cur(), q = questionState(S.prog, S.step), n = STATES[S.prog].length;
        var s = 'Step ' + (S.step + 1) + ' of ' + n + '. ' + plain(st.note);
        if (q && q.state === 'open') s += ' Prediction question: ' + plain(q.def.text);
        if (taskNote) { s += ' ' + taskNote; taskNote = ''; }
        announce(s);
      }, 280);
    }

    /* ---------- questions ---------- */
    function questionState(p, s) {
      var def = S.ask && PROGRAMS[p].q[s];
      if (!def) return null;
      var key = p + ':' + s;
      if (Object.prototype.hasOwnProperty.call(answers, key)) return { def: def, key: key, state: 'answered', choice: answers[key] };
      if (maxSeen[p] > s) return { def: def, key: key, state: 'skipped' };
      return { def: def, key: key, state: 'open' };
    }
    function answer(i) {
      var q = questionState(S.prog, S.step);
      if (!q || q.state !== 'open') return;
      answers[q.key] = i;
      score.answered++;
      var right = i === q.def.a;
      if (right) score.right++;
      renderQuestion();
      renderStats();
      if (score.right >= 3) completeTask('t4');
      var s = (right ? 'Correct. ' : 'Not quite. The answer is ' + plain(q.def.opts[q.def.a]) + '. ') + plain(q.def.why) + ' Press Next to watch it happen.';
      if (taskNote) { s += ' ' + taskNote; taskNote = ''; }
      announce(s);
      // the answer buttons have just been replaced by the result, so put the focus somewhere useful
      try { btnNext.focus({ preventScroll: true }); } catch (e) { btnNext.focus(); }
    }

    /* ---------- moving through the steps ---------- */
    function cur() { return STATES[S.prog][S.step]; }
    function setStep(n) {
      var last = STATES[S.prog].length - 1;
      n = clamp(Math.round(n), 0, last);
      var old = S.step;
      if (n === old) { renderNav(); return; }
      S.step = n;
      pos[S.prog] = n;
      markVisited(S.prog, n);
      spotText = '';
      checkStepTasks(old, n);
      render();
      sayLater();
    }
    function goNext() {
      var last = STATES[S.prog].length - 1;
      if (S.step >= last) { announce('This is the last step: the program has finished. Press Start again, or choose another program.'); return; }
      var q = questionState(S.prog, S.step);
      if (q && q.state === 'open' && !nudged[q.key]) {
        // predict before you step: the first press of Next asks for a guess, a second press skips the question
        nudged[q.key] = true;
        renderQuestion();
        announce('Have a guess first: pick an answer to the question, or press Next again to skip it.');
        return;
      }
      setStep(S.step + 1);
    }
    function goBack() {
      if (S.step <= 0) { announce('This is the first step: nothing has run yet.'); return; }
      setStep(S.step - 1);
    }
    function switchProgram(i) {
      if (i === S.prog || !PROGRAMS[i]) return;
      pos[S.prog] = S.step;
      S.prog = i;
      S.step = pos[i];
      markVisited(i, S.step);
      spotText = '';
      buildCode();
      relayout(true);
      render();
      var st = cur();
      announce(PROGRAMS[i].title.replace(/^\d+\.\s*/, '') + ': step ' + (S.step + 1) + ' of ' + STATES[i].length + '. ' + plain(st.note));
    }

    /* ---------- the code box ---------- */
    function buildCode() {
      var prog = PROGRAMS[S.prog], digits = String(prog.code.length).length;
      elLines.innerHTML = prog.code.map(function (line, i) {
        return '<div style="display:flex;align-items:center;padding:0 16px 0 4px;min-height:1.75em">' +
          '<span data-mark style="flex:none;width:20px;display:inline-flex;align-items:center;justify-content:center"></span>' +
          '<span aria-hidden="true" style="flex:none;box-sizing:content-box;width:' + digits + 'ch;text-align:right;padding-right:12px;color:var(--muted);user-select:none;-webkit-user-select:none">' + (i + 1) + '</span>' +
          '<span class="visually-hidden">Line ' + (i + 1) + ': </span>' +
          '<code style="white-space:pre;background:none;padding:0;border-radius:0;font-size:1em">' + (line ? highlight(line) : (i ? '<span class="visually-hidden">blank</span>' : '')) + '</code>' +
          '<span data-sr class="visually-hidden"></span></div>';
      }).join('');
      codeRows = Array.prototype.map.call(elLines.children, function (row) {
        return { row: row, mark: row.querySelector('[data-mark]'), sr: row.querySelector('[data-sr]'), state: '' };
      });
      elCode.setAttribute('aria-label', 'Python code: ' + prog.title.replace(/^\d+\.\s*/, ''));
      elProg.value = String(S.prog);
      elDesc.textContent = prog.desc;
      var outLines = STATES[S.prog][STATES[S.prog].length - 1].out.length;
      elOut.style.minHeight = 'calc(' + Math.max(1, outLines) + ' * 1.6em + 26px)';
      elStep.max = String(STATES[S.prog].length);
      elSpot.hidden = prog.spot == null;
    }
    function markCode(st) {
      codeRows.forEach(function (c, i) {
        var ln = i + 1, ran = st.ran === ln, nxt = st.next === ln, key = (ran ? 'r' : '') + (nxt ? 'n' : '');
        if (key === c.state) return;
        c.state = key;
        c.row.style.background = ran ? 'var(--haldi-soft)' : '';
        c.row.style.boxShadow = ran ? 'inset 3px 0 0 var(--haldi)' : nxt ? 'inset 3px 0 0 var(--indigo)' : '';
        c.mark.innerHTML = (ran ? SVG_RAN : '') + (nxt ? SVG_NEXT : '');
        c.sr.textContent = ran && nxt ? ' (just ran, and runs next)' : ran ? ' (just ran)' : nxt ? ' (runs next)' : '';
      });
    }

    /* ---------- the Frames and objects picture (SVG, sized from the wrapper so text stays sharp) ---------- */
    var mctx = document.createElement('canvas').getContext('2d');
    var fonts = { mono: 'monospace', body: 'sans-serif' };
    function readFonts() {
      var cs = getComputedStyle(document.documentElement);
      fonts.mono = cs.getPropertyValue('--font-mono').trim() || 'monospace';
      fonts.body = cs.getPropertyValue('--font-body').trim() || 'sans-serif';
    }
    function tw(text, px, mono, weight) {
      if (!mctx) return String(text).length * px * 0.6;
      mctx.font = (weight || 400) + ' ' + px + 'px ' + (mono ? fonts.mono : fonts.body);
      return mctx.measureText(String(text)).width;
    }
    // One geometry per program and width, so nothing jumps sideways while stepping.
    function computeGeom(pi, W) {
      var states = STATES[pi], nameW = 0, valW = 0, titleW = 0, cw = 30, maxItems = 0, hasObj = false, fnText = null;
      states.forEach(function (st) {
        st.frames.forEach(function (f, fi) {
          titleW = Math.max(titleW, fi ? tw(f.name, 13, true, 700) + tw(' (returning)', 12, false) : tw('Global frame', 13, false, 700));
          f.vars.forEach(function (v) {
            nameW = Math.max(nameW, tw(v[0], SZ.font, true));
            if (!isRef(v[1])) valW = Math.max(valW, tw(v[1], SZ.font, true));
          });
          if (f.ret != null) { nameW = Math.max(nameW, tw('Return value', 12, false)); valW = Math.max(valW, tw(f.ret, SZ.font, true)); }
        });
        Object.keys(st.heap).forEach(function (id) {
          var o = st.heap[id];
          hasObj = true;
          if (o.type === 'list') {
            maxItems = Math.max(maxItems, o.items.length);
            o.items.forEach(function (it) { cw = Math.max(cw, Math.ceil(tw(it, SZ.font, true) + 16)); });
          } else fnText = { name: o.name, params: o.params };
        });
      });
      var cellW = Math.ceil(Math.max(valW + 18, 34));
      var FW = Math.ceil(Math.max(10 + nameW + 8 + cellW + 10, titleW + 22, 110));
      var gap = hasObj ? clamp(Math.round(W * 0.07), 22, 56) : 24;
      var OX = SZ.pad + FW + gap, OW = Math.max(40, W - OX - SZ.pad);
      var perRow = Math.max(1, maxItems);
      if (maxItems && cw * maxItems > OW) {
        cw = Math.max(30, Math.floor(OW / maxItems));
        if (cw * maxItems > OW) perRow = Math.max(1, Math.floor(OW / cw));
      }
      // a function box shows name(params) on one line if it fits, else on two lines, else just the name
      var fn = null;
      if (fnText) {
        var one = fnText.name + '(' + fnText.params + ')', w1 = tw(one, SZ.fnFont, true) + 18;
        var w2 = Math.max(tw(fnText.name, SZ.fnFont, true), tw('(' + fnText.params + ')', SZ.fnFont, true)) + 18;
        if (w1 <= OW) fn = { lines: [one], w: w1 };
        else if (w2 <= OW) fn = { lines: [fnText.name, '(' + fnText.params + ')'], w: w2 };
        else fn = { lines: [fnText.name], w: Math.min(OW, tw(fnText.name, SZ.fnFont, true) + 18) };
      }
      return { pi: pi, W: W, FW: FW, nameW: nameW, cellW: cellW, OX: OX, OW: OW, cw: cw, perRow: perRow, fn: fn, hasObj: hasObj };
    }
    function objBox(o) {
      if (o.type === 'list') {
        var n = Math.max(1, o.items.length), rows = Math.ceil(n / G.perRow);
        return { w: Math.min(n, G.perRow) * G.cw, h: SZ.labelH + rows * SZ.cellH, anchor: SZ.labelH + SZ.cellH / 2 };
      }
      var lines = G.fn ? G.fn.lines.length : 1, bh = lines > 1 ? 44 : 30;
      return { w: G.fn ? G.fn.w : 80, h: SZ.labelH + bh, anchor: SZ.labelH + 15 };
    }
    // where every frame, row and object goes for one step
    function place(st, prev) {
      var y = SZ.top, F = [];
      st.frames.forEach(function (f, i) {
        var rows = f.vars.length + (f.ret != null ? 1 : 0);
        var h = SZ.titleH + Math.max(1, rows) * SZ.rowH + 6;
        F.push({ f: f, i: i, y: y, h: h });
        y += h + SZ.fgap;
      });
      var ghost = null;
      if (prev && prev.frames.length > st.frames.length) {
        ghost = { name: prev.frames[prev.frames.length - 1].name, y: y, h: 40 };
        y += ghost.h + SZ.fgap;
      }
      var framesBottom = y - SZ.fgap, refs = {};
      F.forEach(function (Fp) {
        Fp.f.vars.forEach(function (v, ri) {
          if (!isRef(v[1])) return;
          var id = v[1].slice(1);
          (refs[id] = refs[id] || []).push({ cy: Fp.y + SZ.titleH + ri * SZ.rowH + SZ.rowH / 2 });
        });
      });
      var O = {}, oy = SZ.top, objBottom = 0;
      st.order.forEach(function (id) {
        if (!refs[id]) return;   // only objects that some name still points at are drawn
        var b = objBox(st.heap[id]);
        var topY = Math.max(oy, refs[id][0].cy - b.anchor);
        O[id] = { x: G.OX, y: topY, w: b.w, h: b.h, anchor: b.anchor };
        oy = topY + b.h + SZ.ogap;
        objBottom = topY + b.h;
      });
      return { F: F, ghost: ghost, O: O, refs: refs, H: Math.ceil(Math.max(framesBottom, objBottom) + SZ.pad + 4) };
    }
    // what the line that just ran changed: new or changed names, new frames, new objects, changed list cells
    function changes(st, prev) {
      var c = { vars: {}, frames: {}, ret: {}, objs: {}, cells: {} };
      if (!prev) return c;
      st.frames.forEach(function (f, fi) {
        var pf = fi < prev.frames.length ? prev.frames[fi] : null;
        if (!pf) c.frames[fi] = true;
        f.vars.forEach(function (v) {
          var old;
          if (pf) for (var i = 0; i < pf.vars.length; i++) if (pf.vars[i][0] === v[0]) old = pf.vars[i][1];
          if (old !== v[1]) c.vars[fi + ':' + v[0]] = true;
        });
        if (f.ret != null && (!pf || pf.ret == null)) c.ret[fi] = true;
      });
      Object.keys(st.heap).forEach(function (id) {
        var o = st.heap[id], po = prev.heap[id];
        if (!po) { c.objs[id] = true; return; }
        if (o.type === 'list') o.items.forEach(function (it, i) { if (i >= po.items.length || po.items[i] !== it) c.cells[id + ':' + i] = true; });
      });
      return c;
    }
    function txt(x, y, s, style, extra) {
      return '<text x="' + r1(x) + '" y="' + r1(y) + '" dominant-baseline="central"' + (extra || '') + ' style="' + style + '">' + esc(s) + '</text>';
    }
    function cellRect(x, y, w, h, hot) {
      return '<rect x="' + r1(x + 0.5) + '" y="' + r1(y + 0.5) + '" width="' + r1(w - 1) + '" height="' + r1(h - 1) + '" rx="3" style="fill:' +
        (hot ? 'var(--haldi-soft);stroke:var(--haldi);stroke-width:1.6' : 'var(--surface);stroke:var(--field-line);stroke-width:1') + '"/>';
    }
    function wrapWords(text, maxW, px) {
      var words = text.split(' '), lines = [], line = '';
      words.forEach(function (w) {
        var t = line ? line + ' ' + w : w;
        if (line && tw(t, px, false) > maxW) { lines.push(line); line = w; } else line = t;
      });
      if (line) lines.push(line);
      return lines;
    }
    function drawFrames() {
      if (!G) return;
      var st = cur(), prev = S.step ? STATES[S.prog][S.step - 1] : null, L = place(st, prev), ch = changes(st, prev);
      var W = G.W, H = Math.max(frameH, L.H), parts = [];
      var fx = SZ.pad, nameX = fx + 10 + G.nameW, cellX = nameX + 8, dotX = cellX + 12;
      parts.push(txt(fx, 14, 'FRAMES', STY.head));
      if (G.hasObj) parts.push(txt(G.OX, 14, 'OBJECTS', STY.head));
      L.F.forEach(function (Fp) {
        var f = Fp.f, fi = Fp.i, y = Fp.y, isTop = fi > 0 && fi === st.frames.length - 1;
        var stroke = ch.frames[fi] ? 'var(--haldi);stroke-width:2' : isTop ? 'var(--indigo);stroke-width:2' : 'var(--line);stroke-width:1';
        parts.push('<rect x="' + (fx + 0.5) + '" y="' + (y + 0.5) + '" width="' + (G.FW - 1) + '" height="' + (Fp.h - 1) + '" rx="6" style="fill:var(--surface-2);stroke:' + stroke + '"/>');
        if (fi === 0) parts.push(txt(fx + 10, y + 14, 'Global frame', STY.title));
        else {
          parts.push('<text x="' + (fx + 10) + '" y="' + (y + 14) + '" dominant-baseline="central"><tspan style="' + STY.titleMono + '">' + esc(f.name) + '</tspan>' +
            '<tspan style="' + STY.status + '"> ' + (f.ret != null ? '(returning)' : '(running)') + '</tspan></text>');
        }
        if (!f.vars.length && f.ret == null) parts.push(txt(fx + 10, y + SZ.titleH + SZ.rowH / 2, '(no names yet)', STY.empty));
        f.vars.forEach(function (v, ri) {
          var cy = y + SZ.titleH + ri * SZ.rowH + SZ.rowH / 2;
          parts.push(txt(nameX, cy, v[0], STY.name, ' text-anchor="end"'));
          parts.push(cellRect(cellX, cy - 11, G.cellW, 22, ch.vars[fi + ':' + v[0]]));
          if (isRef(v[1])) parts.push('<circle cx="' + dotX + '" cy="' + r1(cy) + '" r="3.6" style="fill:var(--indigo)"/>');
          else parts.push(txt(cellX + 8, cy, v[1], STY.val));
        });
        if (f.ret != null) {
          var cy2 = y + SZ.titleH + f.vars.length * SZ.rowH + SZ.rowH / 2;
          parts.push(txt(nameX, cy2, 'Return value', STY.retName, ' text-anchor="end"'));
          parts.push(cellRect(cellX, cy2 - 11, G.cellW, 22, ch.ret[fi]));
          parts.push(txt(cellX + 8, cy2, f.ret, STY.val));
        }
      });
      if (L.ghost) {
        var gy = L.ghost.y, label = L.ghost.name + ' frame thrown away', px = 12;
        while (px > 9.5 && tw(label, px, false) > G.FW - 20) px -= 0.5;
        parts.push('<rect x="' + (fx + 0.5) + '" y="' + (gy + 0.5) + '" width="' + (G.FW - 1) + '" height="' + (L.ghost.h - 1) + '" rx="6" style="fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:5 4"/>');
        parts.push(txt(fx + 10, gy + L.ghost.h / 2, label, 'fill:var(--muted);font:italic 400 ' + px + 'px var(--font-body)'));
      }
      // objects
      st.order.forEach(function (id) {
        var o = L.O[id];
        if (!o) return;
        var obj = st.heap[id], hot = ch.objs[id];
        parts.push(txt(o.x, o.y + 7, obj.type === 'list' ? 'list' : 'function', STY.small));
        if (obj.type === 'list') {
          var top = o.y + SZ.labelH, items = obj.items.length ? obj.items : [''];
          items.forEach(function (it, i) {
            var x = o.x + (i % G.perRow) * G.cw, y = top + Math.floor(i / G.perRow) * SZ.cellH;
            parts.push(cellRect(x, y, G.cw, SZ.cellH, hot || ch.cells[id + ':' + i]));
            if (obj.items.length) {
              parts.push(txt(x + 4, y + 7, String(i), STY.idx));
              parts.push(txt(x + G.cw / 2, y + 20, it, STY.val, ' text-anchor="middle"'));
            } else parts.push(txt(x + 6, y + SZ.cellH / 2, 'empty', STY.empty));
          });
        } else {
          var lines = G.fn ? G.fn.lines : [obj.name], bh = lines.length > 1 ? 44 : 30, by = o.y + SZ.labelH;
          parts.push(cellRect(o.x, by, o.w, bh, hot));
          lines.forEach(function (ln, li) { parts.push(txt(o.x + 9, by + (lines.length > 1 ? 13 + li * 18 : bh / 2), ln, 'fill:var(--ink);font:400 ' + SZ.fnFont + 'px var(--font-mono)')); });
        }
      });
      // arrows from each name to the object it points at (two names, one object: two arrows into one box)
      Object.keys(L.refs).forEach(function (id) {
        var o = L.O[id], rs = L.refs[id];
        if (!o) return;
        rs.forEach(function (r, k) {
          var ex = o.x - 1, ey = o.y + o.anchor + (rs.length > 1 ? (k - (rs.length - 1) / 2) * 7 : 0);
          var sx = dotX, sy = r.cy, d = Math.max(24, ex - sx) * 0.5;
          parts.push('<path d="M' + r1(sx) + ' ' + r1(sy) + ' C' + r1(sx + d) + ' ' + r1(sy) + ' ' + r1(ex - d) + ' ' + r1(ey) + ' ' + r1(ex - 7) + ' ' + r1(ey) + '" style="fill:none;stroke:var(--indigo);stroke-width:1.7"/>');
          parts.push('<path d="M' + r1(ex) + ' ' + r1(ey) + ' L' + r1(ex - 9) + ' ' + r1(ey - 4.6) + ' L' + r1(ex - 9) + ' ' + r1(ey + 4.6) + ' Z" style="fill:var(--indigo)"/>');
        });
      });
      // a program with no objects at all says where they would go
      if (!G.hasObj) {
        var nx = SZ.pad + G.FW + 24, nw = W - nx - SZ.pad;
        if (nw >= 90) {
          wrapWords('Numbers and text sit right inside their frame. Lists and functions get boxes of their own: see programs 2 to 5.', nw, 12)
            .forEach(function (ln, i) { parts.push(txt(nx, SZ.top + 10 + i * 17, ln, STY.note)); });
        }
      } else if (!Object.keys(L.O).length) parts.push(txt(G.OX, SZ.top + 10, '(none yet)', STY.empty));
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML = parts.join('');
      svg.setAttribute('aria-label', describe(st, prev));
    }
    // the same picture in words, for screen readers
    function describe(st, prev) {
      var num = {}, n = 0, parts = [];
      st.order.forEach(function (id) { if (st.heap[id].type === 'list') num[id] = ++n; });
      function words(v) {
        if (!isRef(v)) return '= ' + v;
        var o = st.heap[v.slice(1)];
        if (o.type === 'function') return 'points at the function ' + o.name + '(' + o.params + ')';
        return 'points at list ' + num[v.slice(1)] + ': [' + o.items.join(', ') + ']';
      }
      st.frames.forEach(function (f, fi) {
        var head = fi === 0 ? 'Global frame' : f.name + ' frame' + (f.ret != null ? ', returning ' + f.ret : ', running');
        var vs = f.vars.map(function (v) { return v[0] + ' ' + words(v[1]); });
        parts.push(head + ': ' + (vs.length ? vs.join('; ') : 'no names yet') + '.');
      });
      if (prev && prev.frames.length > st.frames.length) parts.push('The ' + prev.frames[prev.frames.length - 1].name + ' frame has just been thrown away.');
      return 'Frames and objects at step ' + (S.step + 1) + '. ' + parts.join(' ');
    }
    // Work out the geometry for the current program at the current width and the tallest step, so the box keeps
    // one height while stepping. When called from the ResizeObserver the box height is changed a frame later
    // (changing it inside the callback would make the observer loop).
    function relayout(direct) {
      var W = Math.max(200, Math.round(wrap.clientWidth || 0));
      G = computeGeom(S.prog, W);
      var states = STATES[S.prog], h = 160;
      for (var k = 0; k < states.length; k++) h = Math.max(h, place(states[k], k ? states[k - 1] : null).H);
      if (h !== frameH) {
        frameH = h;
        if (direct) wrap.style.height = (h + 2) + 'px';
        else if (!heightRaf) heightRaf = requestAnimationFrame(function () { heightRaf = 0; if (!destroyed) wrap.style.height = (frameH + 2) + 'px'; });
      }
    }

    /* ---------- the rest of the page ---------- */
    function renderOutput(st, prev) {
      if (!st.out.length) { elOut.innerHTML = '<span class="info">(nothing printed yet)</span>'; return; }
      var n0 = prev ? prev.out.length : st.out.length;
      elOut.innerHTML = st.out.map(function (line, i) { return i >= n0 ? '<span class="ok">' + esc(line) + '</span>' : esc(line); }).join('\n');
    }
    function renderNav() {
      var n = STATES[S.prog].length, st = cur();
      elStep.value = String(S.step + 1);
      elStepOut.textContent = (S.step + 1) + ' of ' + n;
      elStep.setAttribute('aria-valuetext', 'Step ' + (S.step + 1) + ' of ' + n + (st.ran ? ', line ' + st.ran + ' just ran' : ', nothing has run yet'));
      setDisabled(btnBack, S.step === 0);
      setDisabled(btnNext, S.step === n - 1);
    }
    function setDisabled(b, off) {
      b.setAttribute('aria-disabled', String(off));
      b.style.opacity = off ? '.5' : '';
      b.style.cursor = off ? 'not-allowed' : '';
    }
    function renderSay(st) {
      elSay.innerHTML = '<p><strong>Step ' + (S.step + 1) + ' of ' + STATES[S.prog].length + '.</strong> ' + rich(st.note) + '</p>';
    }
    function renderQuestion() {
      var q = questionState(S.prog, S.step);
      if (!q) { if (!elQ.hidden) { elQ.hidden = true; elQ.innerHTML = ''; } return; }
      var d = q.def, tid = P + 'qt';
      var html = '<p class="q-text" id="' + tid + '" style="margin:0"><span class="eyebrow" style="display:block;margin-bottom:2px">Predict before you step</span>' + rich(d.text) + '</p>';
      if (q.state === 'open') {
        html += '<div class="q-opts" role="group" aria-labelledby="' + tid + '">' + d.opts.map(function (o, i) {
          return '<button type="button" class="q-opt" data-opt="' + i + '" style="font:inherit;color:inherit;text-align:left;width:100%"><b aria-hidden="true">' + 'ABCD'.charAt(i) + '</b><span>' + rich(o) + '</span></button>';
        }).join('') + '</div>';
        html += nudged[q.key]
          ? '<p class="small" style="margin:0"><strong>Have a guess first!</strong> Pick an answer, or press Next again to skip this question.</p>'
          : '<p class="small muted" style="margin:0">Pick an answer, then press Next to watch Python do it.</p>';
      } else {
        var choice = q.state === 'answered' ? q.choice : -1;
        html += '<div class="q-opts">' + d.opts.map(function (o, i) {
          var cls = i === d.a ? ' correct' : i === choice ? ' wrong' : '';
          return '<div class="q-opt' + cls + '" style="cursor:default"><b aria-hidden="true">' + 'ABCD'.charAt(i) + '</b><span>' + rich(o) + '</span></div>';
        }).join('') + '</div>';
        var lead = q.state === 'skipped' ? 'You stepped past this one, so here is the answer.' : choice === d.a ? 'Correct!' : 'Not quite.';
        html += '<p class="q-explain" style="margin:0"><strong>' + lead + '</strong> ' + rich(d.why) + '</p>';
      }
      elQ.innerHTML = html;
      elQ.hidden = false;
    }
    function renderSpot() {
      if (PROGRAMS[S.prog].spot == null) return;
      elSpotMsg.hidden = !spotText;
      elSpotMsg.innerHTML = spotText ? rich(spotText) : '';
    }
    function renderStats() {
      var st = cur();
      elSRan.textContent = st.ran ? 'line ' + st.ran : '—';
      elSNext.textContent = st.next ? 'line ' + st.next : 'finished';
      elSFr.textContent = String(st.frames.length);
      elSQ.textContent = score.right + ' of ' + score.answered;
    }
    function render() {
      var st = cur(), prev = S.step ? STATES[S.prog][S.step - 1] : null;
      markCode(st);
      drawFrames();
      renderOutput(st, prev);
      renderNav();
      renderSay(st);
      renderQuestion();
      renderSpot();
      renderStats();
    }

    /* ---------- the "spot aliasing" challenge ---------- */
    function spot() {
      var prog = PROGRAMS[S.prog];
      if (prog.spot == null) return;
      var w = prog.spotWhy;
      if (S.step === prog.spot) { spotText = w.found; completeTask('t3'); }
      else spotText = w[S.step] || w.other;
      renderSpot();
      var s = plain(spotText);
      if (taskNote) { s += ' ' + taskNote; taskNote = ''; }
      announce(s);
    }

    /* ---------- events ---------- */
    on(btnNext, 'click', goNext);
    on(btnBack, 'click', goBack);
    on(btnRestart, 'click', function () { setStep(0); });
    on(elStep, 'input', function () { setStep(+elStep.value - 1); });
    on(elProg, 'change', function () { switchProgram(+elProg.value); });
    on(elAsk, 'change', function () { S.ask = elAsk.checked; renderQuestion(); });
    on(btnSpot, 'click', spot);
    on(elQ, 'click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-opt]') : null;
      if (b && elQ.contains(b)) answer(+b.getAttribute('data-opt'));
    });
    on(topEl, 'keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
    });

    /* ---------- theme, fonts, resizing ---------- */
    function redraw() { if (destroyed) return; readFonts(); relayout(true); drawFrames(); }
    var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mql) { if (mql.addEventListener) mql.addEventListener('change', redraw); else if (mql.addListener) mql.addListener(redraw); }
    on(document, 'themechange', redraw);
    // text widths are measured to lay out the picture, so measure again once the site's web fonts have arrived
    var fontSet = document.fonts && document.fonts.addEventListener ? document.fonts : null;
    if (fontSet) {
      on(fontSet, 'loadingdone', redraw);
      if (fontSet.ready && fontSet.ready.then) fontSet.ready.then(redraw, function () { /* ignore */ });
    }

    // style.css stacks .lab-body into one column below 820px. Then the program picker moves to the top of the
    // left column, so it sits above the code instead of below everything. In a narrow box on a wide screen the
    // lab stacks too.
    var STACK_W = 660;
    var mqNarrow = window.matchMedia ? window.matchMedia('(max-width: 820px)') : null;
    var stacked = null;
    function narrowScreen() { return !!(mqNarrow && mqNarrow.matches); }
    function wantStacked() { var w = topEl.getBoundingClientRect().width; return narrowScreen() || (w > 0 && w < STACK_W); }
    function placeLayout() {
      layoutRaf = 0;
      if (destroyed) return;
      var want = wantStacked();
      if (want === stacked) return;
      stacked = want;
      body.style.gridTemplateColumns = want && !narrowScreen() ? 'minmax(0, 1fr)' : '';
      if (want) leftCol.insertBefore(progCtl, leftCol.firstChild);
      else controls.insertBefore(progCtl, controls.firstChild);
    }
    if (mqNarrow) { if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', placeLayout); else if (mqNarrow.addListener) mqNarrow.addListener(placeLayout); }

    var lastW = 0, ro = null;
    function onResize() {
      if (destroyed) return;
      if (wantStacked() !== stacked && !layoutRaf) layoutRaf = requestAnimationFrame(placeLayout);
      var w = Math.round(wrap.clientWidth || 0);
      if (w && w !== lastW) { lastW = w; relayout(false); drawFrames(); }   // repaint right away at the new width
    }
    if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(wrap); ro.observe(topEl); }
    else on(window, 'resize', onResize);

    /* ---------- starting state ---------- */
    readFonts();
    placeLayout();
    buildCode();
    lastW = Math.round(wrap.clientWidth || 0);
    relayout(true);
    render();

    return {
      destroy: function () {
        // safe to call twice, and it only removes this lab's own element, never a newer lab in the same root
        if (destroyed) return;
        destroyed = true;
        if (sayTimer) clearTimeout(sayTimer);
        if (heightRaf) cancelAnimationFrame(heightRaf);
        if (layoutRaf) cancelAnimationFrame(layoutRaf);
        sayTimer = heightRaf = layoutRaf = 0;
        if (ro) ro.disconnect();
        if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', redraw); else if (mql.removeListener) mql.removeListener(redraw); }
        if (mqNarrow) { if (mqNarrow.removeEventListener) mqNarrow.removeEventListener('change', placeLayout); else if (mqNarrow.removeListener) mqNarrow.removeListener(placeLayout); }
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
        listeners = [];
        if (topEl.parentNode) topEl.parentNode.removeChild(topEl);
      }
    };
  }

  Labs.pytrace = {
    id: 'pytrace',
    module: 'l1-python',
    title: 'Step through Python',
    summary: 'Replay five short Python programs one line at a time and watch names, lists and function frames change, exactly as real Python runs them.',
    tasks: TASKS.map(function (t) { return { id: t.id, text: t.text }; }),
    mount: mount
  };
})();
