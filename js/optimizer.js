// js/optimizer.js
// Contiene l'algoritmo di ottimizzazione per la divisione della spesa.

const optimizer = {
    /**
     * Funzione principale che partiziona l'intero carrello in due spese separate
     * per minimizzare il totale da pagare in contanti.
     */
    optimizeSplit(items, userVoucherTotal, partnerVoucherTotal, threshold) {
        const startTime = performance.now();
        let result;

        // Per questo problema, l'euristica greedy è meno efficace.
        // Usiamo il backtracking che ora è più veloce (2^n invece di 3^n).
        // Aumentiamo leggermente la soglia.
        if (items.length > threshold + 2) {
            // TODO: Implementare un'euristica migliore per il problema della partizione,
            // per ora usiamo il backtracking anche per un numero maggiore di articoli,
            // avvisando l'utente che potrebbe essere lento.
            console.warn(`Numero di articoli (${items.length}) alto. Il calcolo potrebbe richiedere tempo.`);
        }
        
        console.log(`Uso l'algoritmo di partizione (backtracking).`);
        result = this.partitionOptimizer(items, userVoucherTotal, partnerVoucherTotal);
        result.algorithm = 'partition-backtracking';
        
        const endTime = performance.now();
        result.computationTime = (endTime - startTime).toFixed(2) + 'ms';
        console.log(`Ottimizzazione completata in ${result.computationTime}`);
        
        return this.formatResult(result, items, userVoucherTotal, partnerVoucherTotal);
    },

    /**
     * Algoritmo di backtracking che partiziona gli articoli in due set (carrello utente, carrello partner)
     * per minimizzare il totale da pagare in contanti.
     */
    partitionOptimizer(items, userVoucherTotal, partnerVoucherTotal) {
        let bestSolution = {
            userItems: [],
            partnerItems: [],
            minCashToPay: Infinity
        };

        function solve(index, currentUserItems, currentPartnerItems, currentUserSum, currentPartnerSum) {
            // Caso base: abbiamo processato tutti gli articoli
            if (index === items.length) {
                const userCash = Math.max(0, currentUserSum - userVoucherTotal);
                const partnerCash = Math.max(0, currentPartnerSum - partnerVoucherTotal);
                const totalCash = userCash + partnerCash;

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
            currentUserItems.pop(); // Backtrack

            // Branch 2: Assegna l'articolo al partner
            currentPartnerItems.push(item);
            solve(index + 1, currentUserItems, currentPartnerItems, currentUserSum, currentPartnerSum + item.price);
            currentPartnerItems.pop(); // Backtrack
        }

        solve(0, [], [], 0, 0);
        return bestSolution;
    },
    
    /**
     * Formatta il risultato finale in una struttura dati consistente.
     */
    formatResult(solution, allItems, userVoucherTotal, partnerVoucherTotal) {
        const userCartSum = solution.userItems.reduce((sum, item) => sum + item.price, 0);
        const partnerCartSum = solution.partnerItems.reduce((sum, item) => sum + item.price, 0);

        const userCovered = Math.min(userCartSum, userVoucherTotal);
        const partnerCovered = Math.min(partnerCartSum, partnerVoucherTotal);

        const userCash = userCartSum - userCovered;
        const partnerCash = partnerCartSum - partnerCovered;

        return {
            user: {
                items: this.groupItems(solution.userItems),
                cartTotal: userCartSum,
                coveredByVoucher: userCovered,
                cashToPay: userCash
            },
            partner: {
                items: this.groupItems(solution.partnerItems),
                cartTotal: partnerCartSum,
                coveredByVoucher: partnerCovered,
                cashToPay: partnerCash
            },
            grandTotal: allItems.reduce((sum, item) => sum + item.price, 0),
            totalCovered: userCovered + partnerCovered,
            totalCash: userCash + partnerCash,
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