// /src/optimizer.js
// Purpose: Algorithm to assign products to vouchers of two people (user and partner).
// Exports: optimizeAssignment(items, settings)
// items: [{id,name,price,qty,barcode}]
// settings: {voucherValueUser, voucherValuePartner, voucherCountUser, voucherCountPartner}
// Returns: {assignmentUser: [itemEntries], assignmentPartner: [itemEntries], coveredAmountUser, coveredAmountPartner, remainderSplit: {user: x, partner: y}, total: t}

// Approach:
// - Expand quantities into individual units up to n units (if total units n <= 20) and run exact backtracking subsets with pruning.
// - If n > 20, run greedy heuristic: sort items by price desc, fill vouchers greedily, then local improvement (swap).

function expandItems(items){
  const units = [];
  let idx=0;
  items.forEach(it=>{
    for(let i=0;i<it.qty;i++){
      units.push({...it, unitId: `${it.id || it.barcode || it.name}-${i}`, __origId: idx});
    }
    idx++;
  });
  return units;
}

function sumPrices(arr){ return arr.reduce((s,it)=>s+it.price,0); }

export function optimizeAssignment(items, settings){
  const units = expandItems(items);
  const n = units.length;
  const vUser = settings.voucherValueUser;
  const vPartner = settings.voucherValuePartner;
  const cUser = Math.max(0, settings.voucherCountUser|0);
  const cPartner = Math.max(0, settings.voucherCountPartner|0);
  const totalVouchersUser = cUser * vUser;
  const totalVouchersPartner = cPartner * vPartner;

  const result = {assignmentUser:[], assignmentPartner:[], coveredAmountUser:0, coveredAmountPartner:0, remainderSplit:{user:0,partner:0}, total:0};

  const totalAmount = sumPrices(units);
  result.total = totalAmount;

  // For small n (<=20) use exact search: try all partitions of units into three sets: user, partner, none
  if (n <= 20){
    let best = {covered:0, userSet:[], partnerSet:[]};
    // Represent assignment as array of -1:none,0:user,1:partner
    const assign = new Array(n).fill(-1);
    function backtrack(i, sumUser, sumPartner){
      // Pruning: if sumUser > totalVouchersUser or sumPartner > totalVouchersPartner -> invalid
      if (sumUser - 1e-9 > totalVouchersUser || sumPartner - 1e-9 > totalVouchersPartner) return;
      if (i === n){
        const covered = sumUser + sumPartner;
        if (covered > best.covered + 1e-9){
          best = {covered, userSet: assign.map((a,idx)=> a===0 ? idx : -1).filter(i=>i>=0), partnerSet: assign.map((a,idx)=> a===1 ? idx : -1).filter(i=>i>=0)};
        }
        return;
      }
      // Upper bound pruning: remaining total sum
      const remaining = units.slice(i).reduce((s,u)=>s+u.price,0);
      if (sumUser + sumPartner + remaining <= best.covered + 1e-9) {
        // cannot beat current best
        return;
      }
      // Option 1: skip this unit
      assign[i] = -1;
      backtrack(i+1, sumUser, sumPartner);
      // Option 2: assign to user
      assign[i] = 0;
      backtrack(i+1, sumUser + units[i].price, sumPartner);
      // Option 3: assign to partner
      assign[i] = 1;
      backtrack(i+1, sumUser, sumPartner + units[i].price);
      assign[i] = -1;
    }
    backtrack(0,0,0);
    // Construct assignments by grouping units back to original items (summing qty if multiple units selected)
    const userUnits = best.userSet.map(i=>units[i]);
    const partnerUnits = best.partnerSet.map(i=>units[i]);
    // Convert to aggregated items
    function aggregate(unitsArr){
      const map = {};
      unitsArr.forEach(u=>{
        const key = u.name + '||' + u.price;
        if (!map[key]) map[key] = {...u, qty:0};
        map[key].qty++;
      });
      return Object.values(map).map(u=>({name:u.name, price:u.price, qty:u.qty}));
    }
    result.assignmentUser = aggregate(userUnits);
    result.assignmentPartner = aggregate(partnerUnits);
    result.coveredAmountUser = sumPrices(userUnits);
    result.coveredAmountPartner = sumPrices(partnerUnits);
    const coveredTotal = result.coveredAmountUser + result.coveredAmountPartner;
    const remainder = totalAmount - coveredTotal;
    // split remainder proportionally to leftover after vouchers (simple half split by default)
    result.remainderSplit = {user: +(remainder/2).toFixed(2), partner: +(remainder/2).toFixed(2)};
    return result;
  }

  // Heuristic for n > 20:
  // 1. Create list of items by descending price.
  // 2. Fill user vouchers greedily until reaching their total voucher capacity.
  // 3. Fill partner vouchers similarly.
  // 4. Local improvement: try swapping single units between assigned and unassigned to improve covered sum.
  const sorted = [...units].sort((a,b)=>b.price - a.price);
  const assignedUser = [];
  const assignedPartner = [];
  let sumUser = 0, sumPartner = 0;
  // Greedy fill user
  for (let u of sorted){
    if (sumUser + u.price <= totalVouchersUser + 1e-9){
      assignedUser.push(u);
      sumUser += u.price;
    }
  }
  // Remove assigned from pool
  let remainingPool = sorted.filter(u=>!assignedUser.includes(u));
  // Greedy fill partner
  for (let u of remainingPool.slice()){
    if (sumPartner + u.price <= totalVouchersPartner + 1e-9){
      assignedPartner.push(u);
      sumPartner += u.price;
      // remove
      remainingPool = remainingPool.filter(x=>x!==u);
    }
  }
  // Local improvement: try to replace a assigned low-price unit with a higher-price unassigned if possible via swap
  let improved = true;
  while(improved){
    improved = false;
    for (let i=0;i<assignedUser.length;i++){
      for (let j=0;j<remainingPool.length;j++){
        const cur = assignedUser[i];
        const candidate = remainingPool[j];
        const newSum = sumUser - cur.price + candidate.price;
        if (newSum <= totalVouchersUser + 1e-9 && candidate.price > cur.price + 1e-9){
          // apply swap
          assignedUser.splice(i,1,candidate);
          remainingPool.splice(j,1,cur);
          sumUser = newSum;
          improved = true;
        }
      }
    }
    for (let i=0;i<assignedPartner.length;i++){
      for (let j=0;j<remainingPool.length;j++){
        const cur = assignedPartner[i];
        const candidate = remainingPool[j];
        const newSum = sumPartner - cur.price + candidate.price;
        if (newSum <= totalVouchersPartner + 1e-9 && candidate.price > cur.price + 1e-9){
          assignedPartner.splice(i,1,candidate);
          remainingPool.splice(j,1,cur);
          sumPartner = newSum;
          improved = true;
        }
      }
    }
  }

  result.assignmentUser = assignedUser.reduce((agg,u)=>{
    const key = u.name+'||'+u.price;
    const m = agg.find(x=>x.key===key);
    if(m) m.qty++; else agg.push({key, name:u.name, price:u.price, qty:1});
    return agg;
  },[]).map(x=>({name:x.name, price:x.price, qty:x.qty}));
  result.assignmentPartner = assignedPartner.reduce((agg,u)=>{
    const key = u.name+'||'+u.price;
    const m = agg.find(x=>x.key===key);
    if(m) m.qty++; else agg.push({key, name:u.name, price:u.price, qty:1});
    return agg;
  },[]).map(x=>({name:x.name, price:x.price, qty:x.qty}));

  result.coveredAmountUser = +sumUser.toFixed(2);
  result.coveredAmountPartner = +sumPartner.toFixed(2);
  const coveredTotal = result.coveredAmountUser + result.coveredAmountPartner;
  const remainder = totalAmount - coveredTotal;
  result.remainderSplit = {user: +(remainder/2).toFixed(2), partner: +(remainder/2).toFixed(2)};
  return result;
}
