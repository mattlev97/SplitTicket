// js/optimizer.js
// Contiene l'algoritmo di ottimizzazione per la divisione della spesa.

const optimizer = {
    /**
     * Calcola la copertura dei buoni e il resto in contanti, considerando i buoni come unità discrete.
     * @param {number} total - Il totale del carrello da coprire.
     * @param {number} voucherValue - Il valore di un singolo buono.
     * @param {number} maxVouchers - Il numero massimo di buoni utilizzabili.
     * @returns {{covered: number, cash: number, vouchersUsed: number}}
     */
    calculateVoucherCoverage(total, voucherValue, maxVouchers) {
        if (voucherValue <= 0) {
            return { covered: 0, cash: total, vouchersUsed: 0 };
        }
        // Calcola quanti buoni interi possono coprire il totale, senza superarlo.
        const vouchersToUse = Math.min(Math.floor(total / voucherValue), maxVouchers);
        const amountCovered = vouchersToUse * voucherValue;
        const cashToPay = total - amountCovered;
        
        return {
            covered: amountCovered,
            cash: cashToPay,
            vouchersUsed: vouchersToUse
        };
    },

    /**
     * Funzione principale che partiziona l'intero carrello in due spese separate.
     */
    optimizeSplit(items, userVoucherValue, userVoucherCount, partnerVoucherValue, partnerVoucherCount) {
        const startTime = performance.now();
        
        const result = this.partitionOptimizer(items, userVoucherValue, userVoucherCount, partnerVoucherValue, partnerVoucherCount);
        result.algorithm = 'partition-backtracking';
        
        const endTime = performance.now();
        result.computationTime = (endTime - startTime).toFixed(2) + 'ms';
        console.log(`Ottimizzazione completata in ${result.computationTime}`);
        
        return this.formatResult(result, items, userVoucherValue, userVoucherCount, partnerVoucherValue, partnerVoucherCount);
    },

    /**
     * Algoritmo di backtracking che partiziona gli articoli per minimizzare il totale da pagare in contanti.
     */
    partitionOptimizer(items, userVoucherValue, userVoucherCount, partnerVoucherValue, partnerVoucherCount) {
        let bestSolution = {
            userItems: [],
            partnerItems: [],
            minCashToPay: Infinity
        };

        const self = this; // Riferimento a 'this' per l'uso in 'solve'

        function solve(index, currentUserItems, currentPartnerItems, currentUserSum, currentPartnerSum) {
            if (index === items.length) {
                const userCoverage = self.calculateVoucherCoverage(currentUserSum, userVoucherValue, userVoucherCount);
                const partnerCoverage = self.calculateVoucherCoverage(currentPartnerSum, partnerVoucherValue, partnerVoucherCount);
                const totalCash = userCoverage.cash + partnerCoverage.cash;

                if (totalCash < bestSolution.minCashToPay) {
                    bestSolution.minCashToPay = totalCash;
                    bestSolution.userItems = [...currentUserItems];
                    bestSolution.partnerItems = [...currentPartnerItems];
                }
                return;
            }

            const item = items[index];

            // Branch 1: Assegna l'articolo all'utente
            currentUserItems.push(item);
            solve(index + 1, currentUserItems, currentPartnerItems, currentUserSum + item.price, currentPartnerSum);
            currentUserItems.pop();

            // Branch 2: Assegna l'articolo al partner
            currentPartnerItems.push(item);
            solve(index + 1, currentUserItems, currentPartnerItems, currentUserSum, currentPartnerSum + item.price);
            currentPartnerItems.pop();
        }

        solve(0, [], [], 0, 0);
        return bestSolution;
    },
    
    /**
     * Formatta il risultato finale in una struttura dati consistente.
     */
    formatResult(solution, allItems, userVoucherValue, userVoucherCount, partnerVoucherValue, partnerVoucherCount) {
        const userCartSum = solution.userItems.reduce((sum, item) => sum + item.price, 0);
        const partnerCartSum = solution.partnerItems.reduce((sum, item) => sum + item.price, 0);

        const userCoverage = this.calculateVoucherCoverage(userCartSum, userVoucherValue, userVoucherCount);
        const partnerCoverage = this.calculateVoucherCoverage(partnerCartSum, partnerVoucherValue, partnerVoucherCount);

        return {
            user: {
                items: this.groupItems(solution.userItems),
                cartTotal: userCartSum,
                coveredByVoucher: userCoverage.covered,
                cashToPay: userCoverage.cash,
                vouchersUsed: userCoverage.vouchersUsed
            },
            partner: {
                items: this.groupItems(solution.partnerItems),
                cartTotal: partnerCartSum,
                coveredByVoucher: partnerCoverage.covered,
                cashToPay: partnerCoverage.cash,
                vouchersUsed: partnerCoverage.vouchersUsed
            },
            grandTotal: allItems.reduce((sum, item) => sum + item.price, 0),
            totalCovered: userCoverage.covered + partnerCoverage.covered,
            totalCash: userCoverage.cash + partnerCoverage.cash,
            algorithm: solution.algorithm,
            computationTime: solution.computationTime
        };
    },

    /**
     * Raggruppa gli articoli per nome e quantità.
     */
    groupItems(items) {
        const grouped = {};
        items.forEach(item => {
            if (grouped[item.name]) {
                grouped[item.name].quantity++;
            } else {
                grouped[item.name] = { ...item, quantity: 1 };
            }
        });
        return Object.values(grouped);
    }
};