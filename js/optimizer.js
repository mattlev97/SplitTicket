// js/optimizer.js
// Contiene l'algoritmo di ottimizzazione per la divisione della spesa.

const optimizer = {
    /**
     * Funzione principale che sceglie l'algoritmo da usare.
     * @param {Array} items - Array di oggetti {name, price}.
     * @param {number} userVoucher - Valore del buono utente.
     * @param {number} partnerVoucher - Valore del buono partner.
     * @param {number} threshold - Soglia di articoli per usare l'algoritmo esatto.
     * @returns {Object} - Il risultato dell'ottimizzazione.
     */
    optimizeSplit(items, userVoucher, partnerVoucher, threshold) {
        const startTime = performance.now();
        let result;

        if (items.length > threshold) {
            console.log(`Numero di articoli (${items.length}) > soglia (${threshold}). Uso euristica greedy.`);
            result = this.greedyHeuristic(items, userVoucher, partnerVoucher);
            result.algorithm = 'greedy';
        } else {
            console.log(`Numero di articoli (${items.length}) <= soglia (${threshold}). Uso backtracking.`);
            result = this.backtrackingOptimizer(items, userVoucher, partnerVoucher);
            result.algorithm = 'backtracking';
        }
        
        const endTime = performance.now();
        result.computationTime = (endTime - startTime).toFixed(2) + 'ms';
        console.log(`Ottimizzazione completata in ${result.computationTime}`);
        
        return this.formatResult(result, items);
    },

    /**
     * Algoritmo di backtracking che trova la soluzione ottimale.
     * Esplora tutte le combinazioni possibili.
     */
    backtrackingOptimizer(items, userVoucher, partnerVoucher) {
        let bestSolution = {
            userItems: [],
            partnerItems: [],
            remainingItems: [],
            userSum: 0,
            partnerSum: 0,
            maxCovered: -1
        };

        function solve(index, currentUserItems, currentPartnerItems, currentUserSum, currentPartnerSum) {
            // Caso base: abbiamo processato tutti gli articoli
            if (index === items.length) {
                const totalCovered = currentUserSum + currentPartnerSum;
                if (totalCovered > bestSolution.maxCovered) {
                    bestSolution.maxCovered = totalCovered;
                    bestSolution.userItems = [...currentUserItems];
                    bestSolution.partnerItems = [...currentPartnerItems];
                    bestSolution.userSum = currentUserSum;
                    bestSolution.partnerSum = currentPartnerSum;
                }
                return;
            }

            const item = items[index];

            // 1. Prova ad assegnare l'articolo all'utente
            if (currentUserSum + item.price <= userVoucher) {
                currentUserItems.push(item);
                solve(index + 1, currentUserItems, currentPartnerItems, currentUserSum + item.price, currentPartnerSum);
                currentUserItems.pop(); // Backtrack
            }

            // 2. Prova ad assegnare l'articolo al partner
            if (currentPartnerSum + item.price <= partnerVoucher) {
                currentPartnerItems.push(item);
                solve(index + 1, currentUserItems, currentPartnerItems, currentUserSum, currentPartnerSum + item.price);
                currentPartnerItems.pop(); // Backtrack
            }

            // 3. Non assegnare l'articolo a nessuno (va nel resto)
            solve(index + 1, currentUserItems, currentPartnerItems, currentUserSum, currentPartnerSum);
        }

        solve(0, [], [], 0, 0);
        return bestSolution;
    },

    /**
     * Euristica greedy: veloce ma non garantisce l'ottimalità.
     * Ordina gli articoli per prezzo decrescente e li assegna al primo buono disponibile.
     */
    greedyHeuristic(items, userVoucher, partnerVoucher) {
        const sortedItems = [...items].sort((a, b) => b.price - a.price);
        
        const solution = {
            userItems: [],
            partnerItems: [],
            userSum: 0,
            partnerSum: 0,
        };

        for (const item of sortedItems) {
            if (solution.userSum + item.price <= userVoucher) {
                solution.userItems.push(item);
                solution.userSum += item.price;
            } else if (solution.partnerSum + item.price <= partnerVoucher) {
                solution.partnerItems.push(item);
                solution.partnerSum += item.price;
            }
        }
        
        return solution;
    },
    
    /**
     * Formatta il risultato finale in una struttura dati consistente.
     */
    formatResult(solution, allItems) {
        const assignedItems = new Set([...solution.userItems, ...solution.partnerItems]);
        const remainingItems = allItems.filter(item => !assignedItems.has(item));
        
        const totalSum = allItems.reduce((sum, item) => sum + item.price, 0);
        const remainingSum = remainingItems.reduce((sum, item) => sum + item.price, 0);

        return {
            user: {
                items: this.groupItems(solution.userItems),
                total: solution.userSum
            },
            partner: {
                items: this.groupItems(solution.partnerItems),
                total: solution.partnerSum
            },
            remaining: {
                items: this.groupItems(remainingItems),
                total: remainingSum,
                perPerson: remainingSum / 2
            },
            total: totalSum,
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