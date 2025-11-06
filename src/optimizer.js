/**
 * Optimization algorithm for SplitTicket
 * Implements exact solution (backtracking) for n <= 20 items
 * Uses heuristic approach for n > 20 items
 */

const Optimizer = {
    
    /**
     * Main optimization function
     * Finds the best way to split items between two vouchers
     */
    optimize(items) {
        if (!items || items.length === 0) {
            return null;
        }
        
        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Use exact algorithm for small item counts
        if (items.length <= CONFIG.MAX_ITEMS) {
            return this.exactOptimization(items, total);
        } else {
            return this.heuristicOptimization(items, total);
        }
    },
    
    /**
     * Exact optimization using backtracking
     * Finds the optimal assignment that maximizes voucher coverage
     */
    exactOptimization(items, total) {
        const userVoucher = CONFIG.VOUCHER_VALUE_USER;
        const partnerVoucher = CONFIG.VOUCHER_VALUE_PARTNER;
        
        let bestSolution = null;
        let maxCovered = 0;
        
        // Try all possible combinations (2^n)
        const numCombinations = Math.pow(2, items.length);
        
        for (let mask = 0; mask < numCombinations; mask++) {
            let userSum = 0;
            let partnerSum = 0;
            const userItems = [];
            const partnerItems = [];
            
            // Assign items based on bitmask
            for (let i = 0; i < items.length; i++) {
                const itemTotal = items[i].price * items[i].quantity;
                
                if (mask & (1 << i)) {
                    // Assign to user
                    userSum += itemTotal;
                    userItems.push(items[i]);
                } else {
                    // Assign to partner
                    partnerSum += itemTotal;
                    partnerItems.push(items[i]);
                }
            }
            
            // Calculate coverage (without exceeding voucher values)
            const userCovered = Math.min(userSum, userVoucher);
            const partnerCovered = Math.min(partnerSum, partnerVoucher);
            const totalCovered = userCovered + partnerCovered;
            
            // Check if this is the best solution so far
            if (totalCovered > maxCovered) {
                maxCovered = totalCovered;
                bestSolution = {
                    userItems,
                    partnerItems,
                    userSum,
                    partnerSum,
                    userCovered,
                    partnerCovered,
                    totalCovered,
                    total,
                    remainingToDivide: total - totalCovered
                };
            }
        }
        
        return this.formatResult(bestSolution);
    },
    
    /**
     * Heuristic optimization for large item counts
     * Uses greedy approach with local improvements
     */
    heuristicOptimization(items, total) {
        const userVoucher = CONFIG.VOUCHER_VALUE_USER;
        const partnerVoucher = CONFIG.VOUCHER_VALUE_PARTNER;
        
        // Sort items by price (descending)
        const sortedItems = [...items].sort((a, b) => {
            const priceA = a.price * a.quantity;
            const priceB = b.price * b.quantity;
            return priceB - priceA;
        });
        
        let userSum = 0;
        let partnerSum = 0;
        const userItems = [];
        const partnerItems = [];
        
        // Greedy assignment: try to fill both vouchers optimally
        for (const item of sortedItems) {
            const itemTotal = item.price * item.quantity;
            
            // Calculate remaining capacity
            const userRemaining = userVoucher - userSum;
            const partnerRemaining = partnerVoucher - partnerSum;
            
            // Assign to voucher with most remaining capacity that can fit the item
            if (itemTotal <= userRemaining && userRemaining >= partnerRemaining) {
                userSum += itemTotal;
                userItems.push(item);
            } else if (itemTotal <= partnerRemaining) {
                partnerSum += itemTotal;
                partnerItems.push(item);
            } else if (itemTotal <= userRemaining) {
                userSum += itemTotal;
                userItems.push(item);
            } else {
                // Item doesn't fit in either voucher, assign to user
                userSum += itemTotal;
                userItems.push(item);
            }
        }
        
        // Calculate coverage
        const userCovered = Math.min(userSum, userVoucher);
        const partnerCovered = Math.min(partnerSum, partnerVoucher);
        const totalCovered = userCovered + partnerCovered;
        
        const result = {
            userItems,
            partnerItems,
            userSum,
            partnerSum,
            userCovered,
            partnerCovered,
            totalCovered,
            total,
            remainingToDivide: total - totalCovered
        };
        
        return this.formatResult(result);
    },
    
    /**
     * Format the optimization result for display
     */
    formatResult(solution) {
        if (!solution) return null;
        
        return {
            user: {
                name: CONFIG.USER_NAME,
                items: solution.userItems,
                subtotal: solution.userSum,
                voucherCoverage: solution.userCovered,
                toPay: solution.userSum - solution.userCovered + (solution.remainingToDivide / 2)
            },
            partner: {
                name: CONFIG.PARTNER_NAME,
                items: solution.partnerItems,
                subtotal: solution.partnerSum,
                voucherCoverage: solution.partnerCovered,
                toPay: solution.partnerSum - solution.partnerCovered + (solution.remainingToDivide / 2)
            },
            summary: {
                total: solution.total,
                totalCoveredByVouchers: solution.totalCovered,
                remainingToDivide: solution.remainingToDivide,
                eachPays: solution.remainingToDivide / 2
            },
            // Store for history
            items: [...solution.userItems, ...solution.partnerItems],
            total: solution.total,
            totalCoveredByVouchers: solution.totalCovered,
            remainingToDivide: solution.remainingToDivide
        };
    }
};