/* src/optimizer.js
   Optimization module:
   - Exposes optimizeAssignment(items, config)
   - items: [{id, name, price, qty}] price is number (float)
   - config: {voucherValueUser, voucherValuePartner, voucherCountUser, voucherCountPartner}
   - Returns: {assignments: {user:[units], partner:[units]}, coveredSum, unassigned: [...], details}
*/

/*
 Algorithm design:
 - We consider **units**: each product with qty >1 is expanded into separate units (same name, same price).
 - If totalUnits <= 20 => exact backtracking search:
     * Two knapsacks (user and partner) each with capacity = voucherValue * count
     * We attempt to assign each unit to user, partner, or none.
     * We prune branches where current assigned sum for a voucher > capacity.
     * We sort units descending by price to improve pruning.
 - If totalUnits > 20 => heuristic:
     * Best-fit decreasing: sort units desc -> for each unit assign to voucher (user/partner) where it fits and leaves smallest leftover capacity; else unassigned.
     * Then try local improvement: attempt swaps between unassigned and assigned items to increase covered sum.
*/

// Utility functions
function expandUnits(items){
  const units = [];
  items.forEach((it, idx) => {
    const q = Math.max(1, Math.floor(it.qty || 1));
    for (let i=0;i<q;i++){
      units.push({
        unitId: `${it.id || idx}-${i}`,
        name: it.name,
        price: Number(it.price)
      });
    }
  });
  return units;
}

export function optimizeAssignment(items, config){
  const voucherUserCap = (config.voucherValueUser || 7.5) * (config.voucherCountUser || 1);
  const voucherPartnerCap = (config.voucherValuePartner || 7.0) * (config.voucherCountPartner || 1);

  const units = expandUnits(items);
  // sort descending by price for better pruning/greedy
  units.sort((a,b) => b.price - a.price);

  const totalUnits = units.length;

  // Exact solution when manageable
  if (totalUnits <= 20){
    return exactTwoKnapsack(units, voucherUserCap, voucherPartnerCap);
  } else {
    return heuristicTwoKnapsack(units, voucherUserCap, voucherPartnerCap);
  }
}

/* EXACT SEARCH (backtracking with pruning) */
function exactTwoKnapsack(units, capU, capP){
  const n = units.length;
  let best = {covered: 0, assignU: [], assignP: [], unassigned: []};
  const prefixPrices = new Array(n+1).fill(0);
  for (let i=n-1;i>=0;i--) prefixPrices[i]=prefixPrices[i+1]+units[i].price;

  function backtrack(i, sumU, sumP, assignU, assignP){
    // prune: if max possible (sumU+sumP+remaining) <= best.covered -> stop
    const possibleMax = sumU + sumP + prefixPrices[i];
    if (possibleMax <= best.covered) return;

    if (sumU > capU || sumP > capP) return; // invalid

    if (i === n){
      const covered = sumU + sumP;
      if (covered > best.covered){
        best = {
          covered,
          assignU: assignU.slice(),
          assignP: assignP.slice()
        };
      }
      return;
    }
    const unit = units[i];

    // Option 1: assign to user
    assignU.push(unit);
    backtrack(i+1, sumU + unit.price, sumP, assignU, assignP);
    assignU.pop();

    // Option 2: assign to partner
    assignP.push(unit);
    backtrack(i+1, sumU, sumP + unit.price, assignU, assignP);
    assignP.pop();

    // Option 3: leave unassigned
    backtrack(i+1, sumU, sumP, assignU, assignP);
  }

  backtrack(0, 0, 0, [], []);
  // produce unassigned list
  const assignedSet = new Set([...best.assignU.map(u=>u.unitId), ...best.assignP.map(u=>u.unitId)]);
  const unassigned = units.filter(u => !assignedSet.has(u.unitId));

  return {
    strategy: 'exact',
    coveredSum: Number(best.covered.toFixed(2)),
    assignments: {
      user: best.assignU,
      partner: best.assignP
    },
    unassigned,
    totals: {
      userCovered: Number((best.assignU.reduce((s,u)=>s+u.price,0)).toFixed(2)),
      partnerCovered: Number((best.assignP.reduce((s,u)=>s+u.price,0)).toFixed(2)),
      total: Number((best.assignU.reduce((s,u)=>s+u.price,0) + best.assignP.reduce((s,u)=>s+u.price,0)).toFixed(2))
    }
  };
}

/* HEURISTIC (greedy + local improvement) */
function heuristicTwoKnapsack(units, capU, capP){
  // best-fit decreasing
  const assignU = [];
  const assignP = [];
  let remU = capU;
  let remP = capP;
  const unassigned = [];

  units.forEach(unit => {
    // try fit to voucher where leftover is smallest non-negative
    const fitU = remU - unit.price;
    const fitP = remP - unit.price;
    if (fitU >= 0 && fitP >= 0){
      if (fitU <= fitP){
        assignU.push(unit); remU = fitU;
      } else {
        assignP.push(unit); remP = fitP;
      }
    } else if (fitU >= 0){
      assignU.push(unit); remU = fitU;
    } else if (fitP >= 0){
      assignP.push(unit); remP = fitP;
    } else {
      unassigned.push(unit);
    }
  });

  // Local improvement: try to swap unassigned with assigned items
  // Try single-item swap to increase covered sum
  for (let i = 0; i < unassigned.length; i++){
    const u = unassigned[i];
    // try swap with a user-assigned item
    for (let j = 0; j < assignU.length; j++){
      const a = assignU[j];
      const newRemU = remU + a.price - u.price;
      if (newRemU >= 0 && ( (capU - newRemU) > (capU - remU) )){ // increase covered
        // perform swap
        assignU.splice(j,1,u);
        unassigned[i] = a;
        remU = newRemU;
        break;
      }
    }
    // try partner slot
    for (let j = 0; j < assignP.length; j++){
      const a = assignP[j];
      const newRemP = remP + a.price - u.price;
      if (newRemP >= 0 && ( (capP - newRemP) > (capP - remP) )){
        assignP.splice(j,1,u);
        unassigned[i] = a;
        remP = newRemP;
        break;
      }
    }
  }

  const coveredU = assignU.reduce((s,u)=>s+u.price,0);
  const coveredP = assignP.reduce((s,u)=>s+u.price,0);
  return {
    strategy: 'heuristic',
    coveredSum: Number((coveredU+coveredP).toFixed(2)),
    assignments: { user: assignU, partner: assignP },
    unassigned,
    totals: { userCovered: Number(coveredU.toFixed(2)), partnerCovered: Number(coveredP.toFixed(2)), total: Number((coveredU+coveredP).toFixed(2)) }
  };
}